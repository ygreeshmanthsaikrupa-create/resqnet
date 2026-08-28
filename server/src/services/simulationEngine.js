const store = require('../data/store');
const { getZonePrediction } = require('./predictionService');
const { generateAlerts } = require('./alertEngine');
const { v4: uuidv4 } = require('uuid');

class SimulationEngine {
  constructor(io) {
    this.io = io;
    this.interval = null;
    this.status = { running: false, currentStep: 0, totalSteps: 10 };
    this.speed = 1;
  }

  start(speed = 1) {
    if (this.status.running) return;
    this.speed = speed;
    this.status.running = true;
    this.status.currentStep = 0;
    this.nextStep();
  }

  stop() {
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    this.status.running = false;
  }

  reset() {
    this.stop();
    store.reset();
    this.status.currentStep = 0;
  }

  getStatus() {
    return this.status;
  }

  nextStep() {
    if (!this.status.running || this.status.currentStep >= this.status.totalSteps) {
      this.stop();
      return;
    }
    this.status.currentStep++;
    const step = this.status.currentStep;

    let zoneA, report, alert;

    switch (step) {
      case 1:
        zoneA = store.getById('zones', 'z1');
        store.update('zones', 'z1', { waterLevel: 7.2, trend: 'increasing' });
        this.io.emit('sensor_update', { zoneId: 'z1', waterLevel: 7.2 });
        break;
      case 2:
        const pred = getZonePrediction('z1');
        store.update('zones', 'z1', { riskScore: 91, severity: 'critical' });
        this.io.emit('prediction_update', { zoneId: 'z1', riskScore: 91, severity: 'critical' });
        break;
      case 3:
        this.io.emit('zone_update', { zoneId: 'z1', color: 'red' });
        break;
      case 4:
        generateAlerts([store.getById('zones', 'z1')]);
        const alerts = store.getAll('alerts');
        alert = alerts.find(a => a.zoneId === 'z1' && a.type === 'critical' && a.isActive);
        if (alert) this.io.emit('new_alert', alert);
        break;
      case 5:
        report = store.add('reports', {
          id: uuidv4(), category: 'missing_stranded', title: 'Flooded road, 12 stranded',
          description: 'Road completely underwater', location: { lat: 16.5062, lng: 80.6480 },
          severity: 5, status: 'submitted', reportedBy: 'u1', reportedAt: new Date().toISOString(),
          confirmedBy: [], confidenceScore: 10, priorityScore: 50, peopleAffected: 12, zoneId: 'z1'
        });
        this.io.emit('new_report', report);
        this.currentReportId = report.id;
        break;
      case 6:
        this.io.emit('report_on_map', store.getById('reports', this.currentReportId));
        break;
      case 7:
        if (this.currentReportId) {
          store.update('reports', this.currentReportId, { confirmedBy: ['u2', 'u3', 'u4'], confidenceScore: 95 });
          this.io.emit('confidence_update', store.getById('reports', this.currentReportId));
        }
        break;
      case 8:
        if (this.currentReportId) {
          store.update('reports', this.currentReportId, { priorityScore: 95 });
          this.io.emit('priority_update', store.getById('reports', this.currentReportId));
        }
        break;
      case 9:
        if (this.currentReportId) {
          this.io.emit('dashboard_update', { topPriorityIncident: store.getById('reports', this.currentReportId) });
        }
        break;
      case 10:
        if (this.currentReportId) {
          store.update('reports', this.currentReportId, { status: 'verified', adminNotes: 'Response Dispatched' });
          this.io.emit('status_update', store.getById('reports', this.currentReportId));
        }
        break;
    }

    this.interval = setTimeout(() => this.nextStep(), 5000 / this.speed);
  }
}

module.exports = SimulationEngine;
