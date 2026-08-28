const store = require('../data/store');

const calculateRiskScore = (zone) => {
  let score = 0;
  if (zone.waterLevel && zone.waterLevelThreshold) {
    const ratio = zone.waterLevel / zone.waterLevelThreshold;
    score += ratio * 50;
  }
  score += Math.min(zone.rainfallMm, 200) / 200 * 30;
  score += Math.min(zone.population, 50000) / 50000 * 20;
  return Math.min(Math.round(score), 100);
};

const getSeverityLevel = (score) => {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  if (score < 85) return 'high';
  return 'critical';
};

const getTrend = (readings) => {
  if (readings.length < 3) return 'stable';
  const recent = readings.slice(-3);
  if (recent[0].waterLevel < recent[1].waterLevel && recent[1].waterLevel < recent[2].waterLevel) return 'increasing';
  if (recent[0].waterLevel > recent[1].waterLevel && recent[1].waterLevel > recent[2].waterLevel) return 'decreasing';
  return 'stable';
};

const getZonePrediction = (zoneId) => {
  const zone = store.getById('zones', zoneId);
  if (!zone) return null;
  const readings = store.getAll('sensorReadings').filter(r => r.zoneId === zoneId).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const trend = getTrend(readings);
  const score = calculateRiskScore(zone);
  const severity = getSeverityLevel(score);
  return { ...zone, riskScore: score, severity, trend };
};

const getPredictions = () => {
  const zones = store.getAll('zones');
  return zones.map(z => getZonePrediction(z.id));
};

module.exports = { calculateRiskScore, getSeverityLevel, getTrend, getPredictions, getZonePrediction };
