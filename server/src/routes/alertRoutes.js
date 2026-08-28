const express = require('express');
const router = express.Router();
const { getActiveAlerts, getAlertHistory, createAlert } = require('../services/alertEngine');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  try {
    const { type, severity, active } = req.query;
    let alerts = [];
    if (active === 'true' || active === undefined) {
      alerts = getActiveAlerts();
    } else {
      alerts = getAlertHistory();
    }
    
    if (type) alerts = alerts.filter(a => a.type === type);
    if (severity) alerts = alerts.filter(a => a.type === severity);
    
    res.json(alerts);
  } catch (err) {
    console.error('Error getting alerts:', err);
    res.status(500).json({ error: 'Failed to retrieve disaster alerts' });
  }
});

router.get('/history', (req, res) => {
  try {
    res.json(getAlertHistory());
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve alert timeline history' });
  }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { title, message, type, area, disasterType } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Alert title and message are required fields' });
    }

    const alert = createAlert({
      title: String(title).trim(),
      message: String(message).trim(),
      type: ['critical', 'warning', 'advisory', 'all_clear'].includes(type) ? type : 'warning',
      area: area ? String(area).trim() : 'Monitored Disaster Zone',
      disasterType: disasterType || 'flood',
      source: 'authority',
      verificationStatus: 'official'
    });

    if (req.app.locals.io) {
      req.app.locals.io.emit('new_alert', alert);
    }
    res.status(201).json(alert);
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ error: 'Failed to issue disaster broadcast alert' });
  }
});

module.exports = router;
