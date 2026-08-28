const store = require('../data/store');

const calculatePriority = (report, zone) => {
  const sevScore = (report.severity / 5) * 100 * 0.3;
  const peopleScore = Math.min((report.peopleAffected || 0) * 2, 100) * 0.25;
  const zoneScore = (zone ? zone.riskScore : 0) * 0.2;
  const confScore = (report.confidenceScore || 0) * 0.15;
  
  let timeScore = 0;
  if (report.reportedAt) {
    const diffHours = (new Date() - new Date(report.reportedAt)) / 3600000;
    if (diffHours < 1) timeScore = 100 * 0.1;
    else if (diffHours < 3) timeScore = 70 * 0.1;
    else if (diffHours < 6) timeScore = 40 * 0.1;
    else timeScore = 20 * 0.1;
  }

  return Math.min(Math.round(sevScore + peopleScore + zoneScore + confScore + timeScore), 100);
};

const getPriorityLabel = (score) => {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
};

const getPriorityQueue = () => {
  const reports = store.getAll('reports').filter(r => r.status !== 'resolved');
  return reports.map(r => {
    const zone = r.zoneId ? store.getById('zones', r.zoneId) : null;
    const score = calculatePriority(r, zone);
    return { ...r, priorityScore: score, priorityLabel: getPriorityLabel(score) };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
};

module.exports = { calculatePriority, getPriorityQueue, getPriorityLabel };
