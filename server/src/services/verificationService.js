const store = require('../data/store');

const calculateConfidence = (report) => {
  let score = 0;
  if (report.confirmedBy && report.confirmedBy.length > 0) {
    score += Math.min(report.confirmedBy.length * 15, 60);
  }
  if (report.zoneId) {
    const zone = store.getById('zones', report.zoneId);
    if (zone && zone.riskScore > 50) score += 20;
  }
  if (report.reportedAt) {
    const diffHours = (new Date() - new Date(report.reportedAt)) / 3600000;
    if (diffHours < 2) score += 10;
  }
  if (report.description && report.description.length > 50) score += 10;
  return Math.min(score, 100);
};

const verifyReport = (reportId) => {
  const report = store.getById('reports', reportId);
  if (!report) return null;
  const conf = calculateConfidence(report);
  if (conf >= 70 && report.status !== 'verified') {
    return store.update('reports', reportId, { status: 'verified', confidenceScore: conf });
  }
  return store.update('reports', reportId, { confidenceScore: conf });
};

const addConfirmation = (reportId, userId) => {
  const report = store.getById('reports', reportId);
  if (!report) return null;
  const confirmations = report.confirmedBy || [];
  if (!confirmations.includes(userId)) {
    confirmations.push(userId);
    store.update('reports', reportId, { confirmedBy: confirmations });
    return verifyReport(reportId);
  }
  return report;
};

const getVerificationStatus = (reportId) => {
  const report = store.getById('reports', reportId);
  if (!report) return null;
  return { status: report.status, confidenceScore: report.confidenceScore, confirmedBy: report.confirmedBy };
};

const autoVerify = (reports) => {
  return reports.map(r => verifyReport(r.id)).filter(Boolean);
};

module.exports = { calculateConfidence, verifyReport, addConfirmation, getVerificationStatus, autoVerify };
