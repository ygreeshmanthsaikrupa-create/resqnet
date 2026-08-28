const express = require('express');
const router = express.Router();
const { getPredictions, getZonePrediction } = require('../services/predictionService');

router.get('/', (req, res) => {
  try {
    const predictions = getPredictions();
    res.json(predictions);
  } catch (err) {
    console.error('Error fetching disaster zones:', err);
    res.status(500).json({ error: 'Failed to retrieve disaster risk predictions' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const prediction = getZonePrediction(req.params.id);
    if (!prediction) return res.status(404).json({ error: 'Disaster zone not found' });
    res.json(prediction);
  } catch (err) {
    console.error(`Error fetching disaster zone ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve disaster zone prediction' });
  }
});

module.exports = router;
