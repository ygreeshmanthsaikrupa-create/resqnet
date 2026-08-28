const express = require('express');
const router = express.Router();
const { getPredictions } = require('../services/predictionService');
const store = require('../data/store');

router.get('/zones', (req, res) => {
  const predictions = getPredictions();
  const featureCollection = {
    type: 'FeatureCollection',
    features: predictions.map(p => ({
      type: 'Feature',
      properties: {
        id: p.id,
        name: p.name,
        riskScore: p.riskScore,
        severity: p.severity,
        type: p.type
      },
      geometry: {
        type: 'Polygon',
        coordinates: [p.polygon.map(coord => [coord[1], coord[0]])] // GeoJSON is [lng, lat]
      }
    }))
  };
  res.json(featureCollection);
});

router.get('/markers', (req, res) => {
  const reports = store.getAll('reports');
  const resources = store.getAll('resources');

  const markers = [
    ...reports.map(r => ({
      id: r.id,
      type: 'report',
      icon: r.category,
      position: [r.location.lat, r.location.lng],
      popupData: r
    })),
    ...resources.map(r => ({
      id: r.id,
      type: 'resource',
      icon: r.type,
      position: [r.location.lat, r.location.lng],
      popupData: r
    }))
  ];

  res.json(markers);
});

module.exports = router;
