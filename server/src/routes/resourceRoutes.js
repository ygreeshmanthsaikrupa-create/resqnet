const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { type, status, limit, page } = req.query;
    let resources = store.getAll('resources');

    if (type) resources = resources.filter(r => r.type === type);
    if (status) resources = resources.filter(r => r.status === status);

    resources.sort((a, b) => (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0));

    const parsedLimit = Math.min(Number(limit) || 100, 200);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginated = resources.slice(startIndex, startIndex + parsedLimit);

    res.json(paginated);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Failed to retrieve emergency resources' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const resource = store.getById('resources', req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching resource details' });
  }
});

// PATCH /resources/:id - Allow volunteers & admins to update shelter capacity/status in real time
router.patch('/:id', authenticate, authorize('volunteer', 'admin'), (req, res) => {
  try {
    const { currentOccupancy, status } = req.body;
    const updates = {};

    if (currentOccupancy !== undefined) {
      updates.currentOccupancy = Math.max(0, Number(currentOccupancy));
    }
    if (status && ['open', 'full', 'closed'].includes(status)) {
      updates.status = status;
    }
    updates.lastUpdated = new Date().toISOString();

    const updated = store.update('resources', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Resource not found' });

    if (req.app.locals.io) {
      req.app.locals.io.emit('resource_updated', updated);
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating resource:', err);
    res.status(500).json({ error: 'Failed to update emergency resource' });
  }
});

module.exports = router;
