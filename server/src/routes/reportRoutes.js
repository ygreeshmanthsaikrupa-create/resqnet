const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const store = require('../data/store');
const { getPriorityQueue, calculatePriority } = require('../services/priorityScorer');
const { addConfirmation, verifyReport, calculateConfidence } = require('../services/verificationService');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for real image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed'), false);
    }
  }
});

// Image upload route
router.post('/upload', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl: fileUrl });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// GET /reports with pagination and filtering
router.get('/', (req, res) => {
  try {
    const { status, category, zoneId, limit, page } = req.query;
    let reports = getPriorityQueue();

    if (status) {
      const statusList = status.split(',');
      reports = reports.filter(r => statusList.includes(r.status));
    }
    if (category) reports = reports.filter(r => r.category === category);
    if (zoneId) reports = reports.filter(r => r.zoneId === zoneId);

    const parsedLimit = Math.min(Number(limit) || 100, 200);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginated = reports.slice(startIndex, startIndex + parsedLimit);

    res.json(paginated);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to retrieve incident reports' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const report = store.getById('reports', req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching report details' });
  }
});

const VALID_CATEGORIES = [
  'flood', 'fire', 'road_blockage', 'building_damage', 'landslide',
  'medical_emergency', 'missing_stranded', 'power_outage', 'cyclone', 'earthquake', 'other'
];

// POST /reports - With strict schema validation and whitelisting
router.post('/', authenticate, (req, res) => {
  try {
    const { category, title, description, severity, peopleAffected, location, address, imageUrl, zoneId } = req.body;

    // Validation
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title is required (at least 3 characters)' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: 'Description is required (at least 5 characters)' });
    }

    const parsedSeverity = Number(severity);
    if (isNaN(parsedSeverity) || parsedSeverity < 1 || parsedSeverity > 5) {
      return res.status(400).json({ error: 'Severity must be a number between 1 and 5' });
    }

    let reportLat = 16.5062;
    let reportLng = 80.6480;
    let reportAddress = 'Disaster Area';

    if (location && typeof location === 'object') {
      if (location.lat !== undefined && location.lng !== undefined) {
        reportLat = Number(location.lat) || reportLat;
        reportLng = Number(location.lng) || reportLng;
      }
      if (location.address) reportAddress = String(location.address).trim();
    } else if (req.body.lat !== undefined && req.body.lng !== undefined) {
      reportLat = Number(req.body.lat) || reportLat;
      reportLng = Number(req.body.lng) || reportLng;
      if (address) reportAddress = String(address).trim();
    }

    const reportData = {
      id: `r_${Date.now()}_${uuidv4().substring(0, 8)}`,
      category,
      title: title.trim().substring(0, 150),
      description: description.trim().substring(0, 1000),
      location: {
        lat: reportLat,
        lng: reportLng,
        address: reportAddress.substring(0, 200)
      },
      severity: parsedSeverity,
      peopleAffected: Math.max(0, Number(peopleAffected) || 0),
      imageUrl: imageUrl ? String(imageUrl).substring(0, 500) : null,
      reportedBy: req.user.id,
      reportedAt: new Date().toISOString(),
      status: 'submitted',
      confirmedBy: [],
      adminNotes: '',
      zoneId: zoneId ? String(zoneId) : 'z1'
    };
    
    reportData.confidenceScore = calculateConfidence(reportData);
    reportData.priorityScore = calculatePriority(reportData, store.getById('zones', reportData.zoneId));

    const newReport = store.add('reports', reportData);
    if (req.app.locals.io) {
      req.app.locals.io.emit('new_report', newReport);
    }
    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Internal server error while saving report' });
  }
});

// PATCH /reports/:id - Role-based field restrictions
router.patch('/:id', authenticate, authorize('volunteer', 'admin'), (req, res) => {
  try {
    const existing = store.getById('reports', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Report not found' });

    const allowedUpdates = {};
    const role = req.user.role;

    // Volunteers can only change status and append notes
    if (role === 'volunteer') {
      if (req.body.status && ['under_verification', 'verified', 'resolved'].includes(req.body.status)) {
        allowedUpdates.status = req.body.status;
      }
      if (req.body.adminNotes !== undefined) {
        allowedUpdates.adminNotes = String(req.body.adminNotes).trim();
      }
    } else if (role === 'admin') {
      // Admins have broader control
      if (req.body.status && ['submitted', 'under_verification', 'verified', 'resolved'].includes(req.body.status)) {
        allowedUpdates.status = req.body.status;
      }
      if (req.body.adminNotes !== undefined) allowedUpdates.adminNotes = String(req.body.adminNotes).trim();
      if (req.body.severity !== undefined) allowedUpdates.severity = Math.min(5, Math.max(1, Number(req.body.severity)));
      if (req.body.peopleAffected !== undefined) allowedUpdates.peopleAffected = Math.max(0, Number(req.body.peopleAffected));
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided for your role' });
    }

    const updatedReport = store.update('reports', req.params.id, allowedUpdates);
    if (req.app.locals.io) {
      req.app.locals.io.emit('report_updated', updatedReport);
    }
    res.json(updatedReport);
  } catch (err) {
    console.error('Error patching report:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// POST /reports/:id/confirm - Community verification check
router.post('/:id/confirm', authenticate, (req, res) => {
  try {
    const updatedReport = addConfirmation(req.params.id, req.user.id);
    if (!updatedReport) return res.status(404).json({ error: 'Report not found' });
    if (req.app.locals.io) {
      req.app.locals.io.emit('report_updated', updatedReport);
    }
    res.json(updatedReport);
  } catch (err) {
    console.error('Error confirming report:', err);
    res.status(500).json({ error: 'Failed to add confirmation' });
  }
});

module.exports = router;
