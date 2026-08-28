const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.post('/start', authenticate, authorize('admin'), (req, res) => {
  try {
    const { speed } = req.body;
    const parsedSpeed = Number(speed) || 1;
    req.app.locals.simulationEngine.start(parsedSpeed);
    res.json(req.app.locals.simulationEngine.getStatus());
  } catch (err) {
    console.error('Error starting simulation:', err);
    res.status(500).json({ error: 'Failed to start simulation engine' });
  }
});

router.post('/stop', authenticate, authorize('admin'), (req, res) => {
  try {
    req.app.locals.simulationEngine.stop();
    res.json(req.app.locals.simulationEngine.getStatus());
  } catch (err) {
    console.error('Error stopping simulation:', err);
    res.status(500).json({ error: 'Failed to stop simulation engine' });
  }
});

router.post('/reset', authenticate, authorize('admin'), (req, res) => {
  try {
    req.app.locals.simulationEngine.reset();
    res.json(req.app.locals.simulationEngine.getStatus());
  } catch (err) {
    console.error('Error resetting simulation:', err);
    res.status(500).json({ error: 'Failed to reset disaster simulation state' });
  }
});

router.get('/status', (req, res) => {
  try {
    res.json(req.app.locals.simulationEngine ? req.app.locals.simulationEngine.getStatus() : { running: false, currentStep: 0, totalSteps: 10 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve simulation status' });
  }
});

module.exports = router;
