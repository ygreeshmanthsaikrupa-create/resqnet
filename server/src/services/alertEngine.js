const store = require('../data/store');
const { v4: uuidv4 } = require('uuid');
const { getZonePrediction } = require('./predictionService');

const createAlert = (data) => {
  const alert = {
    id: uuidv4(),
    issuedAt: new Date().toISOString(),
    isActive: true,
    ...data
  };
  return store.add('alerts', alert);
};

const getActiveAlerts = () => {
  const alerts = store.getAll('alerts').filter(a => a.isActive);
  const order = { 'critical': 1, 'warning': 2, 'advisory': 3, 'all_clear': 4 };
  return alerts.sort((a, b) => (order[a.type] || 5) - (order[b.type] || 5));
};

const getAlertHistory = () => {
  return store.getAll('alerts').sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
};

const checkAndAlert = (zone) => {
  const prediction = getZonePrediction(zone.id);
  if (!prediction) return null;
  const score = prediction.riskScore;
  let type = null;
  if (score >= 85) type = 'critical';
  else if (score >= 60) type = 'warning';
  else if (score >= 30) type = 'advisory';
  else type = 'all_clear';

  const activeAlerts = store.getAll('alerts').filter(a => a.zoneId === zone.id && a.isActive);
  if (activeAlerts.length > 0) {
    const latestAlert = activeAlerts.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0];
    if (latestAlert.type === type) return null; 
    activeAlerts.forEach(a => store.update('alerts', a.id, { isActive: false })); 
  }

  return createAlert({
    type,
    disasterType: prediction.type,
    title: `${type.toUpperCase()} Alert for ${prediction.name}`,
    message: `Risk score is ${score}. Threshold crossed.`,
    area: prediction.name,
    zoneId: zone.id,
    source: 'system',
    verificationStatus: 'official'
  });
};

const generateAlerts = (zones) => {
  const newAlerts = [];
  zones.forEach(zone => {
    const alert = checkAndAlert(zone);
    if (alert) newAlerts.push(alert);
  });
  return newAlerts;
};

module.exports = { generateAlerts, createAlert, getActiveAlerts, getAlertHistory, checkAndAlert };
