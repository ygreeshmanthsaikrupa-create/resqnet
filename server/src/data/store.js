const Database = require('better-sqlite3');
const path = require('path');
const seedData = require('./seedData');

class Store {
  constructor() {
    this.db = new Database(path.join(__dirname, '../../resqnet.db'));
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        name TEXT
      );
      CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        center TEXT,
        polygon TEXT,
        riskScore INTEGER,
        severity TEXT,
        waterLevel REAL,
        waterLevelThreshold REAL,
        rainfallMm REAL,
        trend TEXT,
        population INTEGER,
        lastUpdated TEXT
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        category TEXT,
        title TEXT,
        description TEXT,
        locationLat REAL,
        locationLng REAL,
        locationAddress TEXT,
        severity INTEGER,
        status TEXT,
        reportedBy TEXT,
        reportedAt TEXT,
        confirmedBy TEXT,
        confidenceScore INTEGER,
        priorityScore INTEGER,
        peopleAffected INTEGER,
        imageUrl TEXT,
        adminNotes TEXT,
        zoneId TEXT
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT,
        disasterType TEXT,
        title TEXT,
        message TEXT,
        area TEXT,
        zoneId TEXT,
        issuedAt TEXT,
        source TEXT,
        verificationStatus TEXT,
        isActive INTEGER
      );
      CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        type TEXT,
        name TEXT,
        locationLat REAL,
        locationLng REAL,
        locationAddress TEXT,
        contact TEXT,
        capacity INTEGER,
        currentOccupancy INTEGER,
        status TEXT,
        distance TEXT,
        operatingHours TEXT,
        lastUpdated TEXT
      );
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zoneId TEXT,
        timestamp TEXT,
        waterLevel REAL,
        rainfallMm REAL
      );
    `);

    const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (usersCount === 0) {
      this.reset();
    }
  }

  reset() {
    this.db.exec(`
      DELETE FROM users;
      DELETE FROM zones;
      DELETE FROM reports;
      DELETE FROM alerts;
      DELETE FROM resources;
      DELETE FROM sensor_readings;
    `);

    const insertUser = this.db.prepare('INSERT INTO users (id, username, password, role, name) VALUES (@id, @username, @password, @role, @name)');
    const insertZone = this.db.prepare('INSERT INTO zones (id, name, type, center, polygon, riskScore, severity, waterLevel, waterLevelThreshold, rainfallMm, trend, population, lastUpdated) VALUES (@id, @name, @type, @center, @polygon, @riskScore, @severity, @waterLevel, @waterLevelThreshold, @rainfallMm, @trend, @population, @lastUpdated)');
    const insertReport = this.db.prepare('INSERT INTO reports (id, category, title, description, locationLat, locationLng, locationAddress, severity, status, reportedBy, reportedAt, confirmedBy, confidenceScore, priorityScore, peopleAffected, imageUrl, adminNotes, zoneId) VALUES (@id, @category, @title, @description, @locationLat, @locationLng, @locationAddress, @severity, @status, @reportedBy, @reportedAt, @confirmedBy, @confidenceScore, @priorityScore, @peopleAffected, @imageUrl, @adminNotes, @zoneId)');
    const insertAlert = this.db.prepare('INSERT INTO alerts (id, type, disasterType, title, message, area, zoneId, issuedAt, source, verificationStatus, isActive) VALUES (@id, @type, @disasterType, @title, @message, @area, @zoneId, @issuedAt, @source, @verificationStatus, @isActive)');
    const insertResource = this.db.prepare('INSERT INTO resources (id, type, name, locationLat, locationLng, locationAddress, contact, capacity, currentOccupancy, status, distance, operatingHours, lastUpdated) VALUES (@id, @type, @name, @locationLat, @locationLng, @locationAddress, @contact, @capacity, @currentOccupancy, @status, @distance, @operatingHours, @lastUpdated)');
    const insertSensor = this.db.prepare('INSERT INTO sensor_readings (zoneId, timestamp, waterLevel, rainfallMm) VALUES (@zoneId, @timestamp, @waterLevel, @rainfallMm)');

    this.db.transaction(() => {
      for (const u of seedData.users || []) insertUser.run(u);
      for (const z of seedData.zones || []) {
        insertZone.run({
          ...z,
          center: JSON.stringify(z.center),
          polygon: JSON.stringify(z.polygon)
        });
      }
      for (const r of seedData.reports || []) {
        insertReport.run({
          ...r,
          locationLat: r.location ? r.location.lat : null,
          locationLng: r.location ? r.location.lng : null,
          locationAddress: r.location ? r.location.address : null,
          confirmedBy: JSON.stringify(r.confirmedBy || [])
        });
      }
      for (const a of seedData.alerts || []) {
        insertAlert.run({
          ...a,
          isActive: a.isActive ? 1 : 0
        });
      }
      for (const res of seedData.resources || []) {
        insertResource.run({
          ...res,
          locationLat: res.location ? res.location.lat : null,
          locationLng: res.location ? res.location.lng : null,
          locationAddress: res.location ? res.location.address : null
        });
      }
      for (const s of seedData.sensorReadings || []) {
        insertSensor.run(s);
      }
    })();
  }

  _rowToObj(collection, row) {
    if (!row) return null;
    const obj = { ...row };

    if (collection === 'zones') {
      if (obj.center) obj.center = JSON.parse(obj.center);
      if (obj.polygon) obj.polygon = JSON.parse(obj.polygon);
    }
    
    if (collection === 'reports' || collection === 'resources') {
      obj.location = {
        lat: obj.locationLat,
        lng: obj.locationLng,
        address: obj.locationAddress
      };
      delete obj.locationLat;
      delete obj.locationLng;
      delete obj.locationAddress;
    }

    if (collection === 'reports' && obj.confirmedBy) {
      obj.confirmedBy = JSON.parse(obj.confirmedBy);
    }

    if (collection === 'alerts') {
      obj.isActive = obj.isActive === 1;
    }

    return obj;
  }

  _objToRow(collection, obj) {
    const row = { ...obj };

    if (collection === 'zones') {
      if (row.center) row.center = JSON.stringify(row.center);
      if (row.polygon) row.polygon = JSON.stringify(row.polygon);
    }
    
    if (collection === 'reports' || collection === 'resources') {
      if (row.location) {
        row.locationLat = row.location.lat;
        row.locationLng = row.location.lng;
        row.locationAddress = row.location.address;
      }
      delete row.location;
    }

    if (collection === 'reports' && row.confirmedBy !== undefined) {
      row.confirmedBy = JSON.stringify(row.confirmedBy);
    }

    if (collection === 'alerts' && row.isActive !== undefined) {
      row.isActive = row.isActive ? 1 : 0;
    }

    return row;
  }

  _tableName(collection) {
    if (collection === 'sensorReadings') return 'sensor_readings';
    return collection;
  }

  getAll(collection) {
    const table = this._tableName(collection);
    try {
      const rows = this.db.prepare(`SELECT * FROM ${table}`).all();
      return rows.map(row => this._rowToObj(collection, row));
    } catch (err) {
      console.error(`[DB Error] getAll failed for collection "${collection}" (table: "${table}"):`, err.message);
      return [];
    }
  }

  getById(collection, id) {
    const table = this._tableName(collection);
    try {
      const row = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      return this._rowToObj(collection, row);
    } catch (err) {
      console.error(`[DB Error] getById failed for collection "${collection}" id "${id}":`, err.message);
      return null;
    }
  }

  add(collection, item) {
    const table = this._tableName(collection);
    try {
      const row = this._objToRow(collection, item);
      const keys = Object.keys(row);
      const placeholders = keys.map(k => `@${k}`).join(', ');
      const columns = keys.join(', ');
      
      this.db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`).run(row);
      return item;
    } catch (err) {
      console.error(`[DB Error] add failed for collection "${collection}":`, err.message);
      throw new Error(`Database insert failed for ${collection}: ${err.message}`);
    }
  }

  update(collection, id, updates) {
    const table = this._tableName(collection);
    try {
      const existing = this.getById(collection, id);
      if (!existing) return null;

      const merged = { ...existing, ...updates };
      const row = this._objToRow(collection, merged);
      
      const keys = Object.keys(row).filter(k => k !== 'id');
      const setClause = keys.map(k => `${k} = @${k}`).join(', ');
      
      this.db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = @id`).run(row);
      return merged;
    } catch (err) {
      console.error(`[DB Error] update failed for collection "${collection}" id "${id}":`, err.message);
      throw new Error(`Database update failed for ${collection}: ${err.message}`);
    }
  }

  remove(collection, id) {
    const table = this._tableName(collection);
    try {
      const info = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return info.changes > 0;
    } catch (err) {
      console.error(`[DB Error] remove failed for collection "${collection}" id "${id}":`, err.message);
      return false;
    }
  }
}

const store = new Store();
module.exports = store;
