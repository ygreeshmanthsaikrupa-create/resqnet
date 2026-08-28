const bcrypt = require('bcryptjs');

const users = [
  { id: 'u1', username: 'citizen', password: bcrypt.hashSync('citizen123', 10), role: 'citizen', name: 'Rahul Kumar' },
  { id: 'u2', username: 'volunteer', password: bcrypt.hashSync('volunteer123', 10), role: 'volunteer', name: 'Priya Sharma' },
  { id: 'u3', username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Dr. Suresh Reddy' }
];

const zones = [
  // Regional High-Resolution Zones (India / Vijayawada)
  {
    id: 'z1', name: 'Zone A - Krishna River Basin (India)', type: 'flood', center: [16.5062, 80.6480],
    polygon: [[16.5162, 80.6380], [16.5162, 80.6580], [16.4962, 80.6580], [16.4962, 80.6380], [16.5162, 80.6380]],
    riskScore: 91, severity: 'critical', waterLevel: 8.5, waterLevelThreshold: 7.0, rainfallMm: 120, trend: 'increasing', population: 25000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'z2', name: 'Zone B - Eluru Road Corridor (India)', type: 'flood', center: [16.5162, 80.6580],
    polygon: [[16.5262, 80.6480], [16.5262, 80.6680], [16.5062, 80.6680], [16.5062, 80.6480], [16.5262, 80.6480]],
    riskScore: 74, severity: 'high', waterLevel: 5.2, waterLevelThreshold: 4.5, rainfallMm: 80, trend: 'increasing', population: 40000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'z3', name: 'Zone C - Benz Circle Area (India)', type: 'flood', center: [16.4962, 80.6480],
    polygon: [[16.5062, 80.6380], [16.5062, 80.6580], [16.4862, 80.6580], [16.4862, 80.6380], [16.5062, 80.6380]],
    riskScore: 68, severity: 'high', waterLevel: 4.8, waterLevelThreshold: 4.0, rainfallMm: 65, trend: 'stable', population: 60000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'z4', name: 'Zone D - Kanuru Residential (India)', type: 'flood', center: [16.4862, 80.6680],
    polygon: [[16.4962, 80.6580], [16.4962, 80.6780], [16.4762, 80.6780], [16.4762, 80.6580], [16.4962, 80.6580]],
    riskScore: 45, severity: 'medium', waterLevel: 3.1, waterLevelThreshold: 3.5, rainfallMm: 40, trend: 'stable', population: 15000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'z5', name: 'Zone E - Gannavaram Outskirts (India)', type: 'flood', center: [16.5362, 80.7980],
    polygon: [[16.5462, 80.7880], [16.5462, 80.8080], [16.5262, 80.8080], [16.5262, 80.7880], [16.5462, 80.7880]],
    riskScore: 22, severity: 'low', waterLevel: 1.5, waterLevelThreshold: 4.0, rainfallMm: 15, trend: 'decreasing', population: 8000, lastUpdated: new Date().toISOString()
  },

  // Worldwide Disaster Zones
  {
    id: 'wz1', name: 'Bay of Bengal Cyclone Storm Surge', type: 'cyclone', center: [15.5, 83.5],
    polygon: [[17.0, 81.5], [17.0, 85.5], [14.0, 85.5], [14.0, 81.5], [17.0, 81.5]],
    riskScore: 89, severity: 'critical', waterLevel: 6.2, waterLevelThreshold: 4.0, rainfallMm: 180, trend: 'increasing', population: 450000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz2', name: 'Pacific Rim - Tokyo Seismic Fault (Japan)', type: 'earthquake', center: [35.6895, 139.6917],
    polygon: [[36.5, 138.5], [36.5, 141.0], [34.5, 141.0], [34.5, 138.5], [36.5, 138.5]],
    riskScore: 84, severity: 'critical', waterLevel: 0, waterLevelThreshold: 0, rainfallMm: 10, trend: 'increasing', population: 12000000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz3', name: 'Northern California Wildfire Corridor (USA)', type: 'fire', center: [38.5816, -121.4944],
    polygon: [[39.8, -122.8], [39.8, -120.0], [37.5, -120.0], [37.5, -122.8], [39.8, -122.8]],
    riskScore: 88, severity: 'critical', waterLevel: 0, waterLevelThreshold: 0, rainfallMm: 0, trend: 'increasing', population: 2200000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz4', name: 'Gulf Coast & Caribbean Hurricane Sector (USA/Caribbean)', type: 'cyclone', center: [25.7617, -80.1918],
    polygon: [[27.5, -82.5], [27.5, -78.0], [24.0, -78.0], [24.0, -82.5], [27.5, -82.5]],
    riskScore: 92, severity: 'critical', waterLevel: 4.5, waterLevelThreshold: 2.5, rainfallMm: 210, trend: 'increasing', population: 6000000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz5', name: 'Mediterranean Wildfire & Heat Alert (Greece)', type: 'fire', center: [37.9838, 23.7275],
    polygon: [[39.0, 22.0], [39.0, 25.0], [36.5, 25.0], [36.5, 22.0], [39.0, 22.0]],
    riskScore: 78, severity: 'high', waterLevel: 0, waterLevelThreshold: 0, rainfallMm: 0, trend: 'increasing', population: 3500000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz6', name: 'Java Trench Tsunami & Volcanic Risk (Indonesia)', type: 'earthquake', center: [-6.2088, 106.8456],
    polygon: [[-5.0, 105.0], [-5.0, 109.0], [-8.0, 109.0], [-8.0, 105.0], [-5.0, 105.0]],
    riskScore: 82, severity: 'critical', waterLevel: 3.8, waterLevelThreshold: 2.0, rainfallMm: 95, trend: 'increasing', population: 9500000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz7', name: 'Alpine Landslide Watch - Valais (Switzerland)', type: 'landslide', center: [46.2276, 7.3589],
    polygon: [[46.8, 6.8], [46.8, 8.0], [45.8, 8.0], [45.8, 6.8], [46.8, 6.8]],
    riskScore: 65, severity: 'high', waterLevel: 0, waterLevelThreshold: 0, rainfallMm: 75, trend: 'stable', population: 350000, lastUpdated: new Date().toISOString()
  },
  {
    id: 'wz8', name: 'Rio Metropolitan Flash Floods (Brazil)', type: 'flood', center: [-22.9068, -43.1729],
    polygon: [[-22.0, -44.0], [-22.0, -42.5], [-23.5, -42.5], [-23.5, -44.0], [-22.0, -44.0]],
    riskScore: 76, severity: 'high', waterLevel: 4.2, waterLevelThreshold: 3.0, rainfallMm: 110, trend: 'increasing', population: 6800000, lastUpdated: new Date().toISOString()
  }
];

const reportCategories = ['flood', 'fire', 'road_blockage', 'building_damage', 'landslide', 'medical_emergency', 'missing_stranded', 'power_outage', 'other'];

// Reports covering both regional hotspots and global disaster alerts
const reports = [
  {
    id: 'r1', category: 'missing_stranded', title: '12 Citizens Stranded Near River Junction',
    description: 'Rapidly rising water levels submerged residential ground floors. Immediate rescue boats required.',
    location: { lat: 16.5082, lng: 80.6490, address: 'Krishna Canal Road, Vijayawada' },
    severity: 5, status: 'under_verification', reportedBy: 'u1', reportedAt: new Date(Date.now() - 3600000).toISOString(),
    confirmedBy: ['u2', 'u3'], confidenceScore: 95, priorityScore: 96, peopleAffected: 12, imageUrl: null, adminNotes: 'NDRF team en route', zoneId: 'z1'
  },
  {
    id: 'r2', category: 'road_blockage', title: 'Main Highway Highway NH-16 Flooded',
    description: 'Over 3 feet of water on highway. Heavy vehicles stranded, traffic completely blocked.',
    location: { lat: 16.5162, lng: 80.6580, address: 'Eluru Road NH-16 Junction' },
    severity: 4, status: 'verified', reportedBy: 'u2', reportedAt: new Date(Date.now() - 7200000).toISOString(),
    confirmedBy: ['u1'], confidenceScore: 90, priorityScore: 84, peopleAffected: 50, imageUrl: null, adminNotes: 'Traffic diverted via bypass', zoneId: 'z2'
  },
  {
    id: 'r3', category: 'medical_emergency', title: 'Elderly Patients Need Oxygen Support',
    description: 'Power outage due to transformer submergence. 3 patients require emergency power / hospital evacuation.',
    location: { lat: 16.4962, lng: 80.6480, address: 'Benz Circle Sector 4' },
    severity: 5, status: 'submitted', reportedBy: 'u1', reportedAt: new Date(Date.now() - 1800000).toISOString(),
    confirmedBy: [], confidenceScore: 80, priorityScore: 92, peopleAffected: 3, imageUrl: null, adminNotes: '', zoneId: 'z3'
  },
  // Global incidents
  {
    id: 'r4', category: 'cyclone', title: 'Coastal Storm Surge Alert (Bay of Bengal)',
    description: 'Tidal waves over 4m breaching coastal sea walls. Fishermen evacuated.',
    location: { lat: 15.8, lng: 83.2, address: 'Visakhapatnam - Machilipatnam Coastal Belt' },
    severity: 5, status: 'verified', reportedBy: 'u3', reportedAt: new Date(Date.now() - 10800000).toISOString(),
    confirmedBy: ['u2'], confidenceScore: 98, priorityScore: 95, peopleAffected: 450, imageUrl: null, adminNotes: 'Red alert sounded', zoneId: 'wz1'
  },
  {
    id: 'r5', category: 'earthquake', title: 'M6.8 Seismic Tremor Detected (Tokyo Bay)',
    description: 'Subway lines halted for safety inspection. Minor structural damage reported.',
    location: { lat: 35.65, lng: 139.75, address: 'Tokyo Metropolitan Zone, Japan' },
    severity: 4, status: 'verified', reportedBy: 'u3', reportedAt: new Date(Date.now() - 5400000).toISOString(),
    confirmedBy: [], confidenceScore: 95, priorityScore: 88, peopleAffected: 1200, imageUrl: null, adminNotes: 'Emergency squads activated', zoneId: 'wz2'
  },
  {
    id: 'r6', category: 'fire', title: 'Fast-Moving Wildfire Perimeter (Sacramento, CA)',
    description: 'Dry high winds pushing blaze towards residential sector. Level 3 Evacuation notice issued.',
    location: { lat: 38.65, lng: -121.35, address: 'Sacramento County, California, USA' },
    severity: 5, status: 'under_verification', reportedBy: 'u2', reportedAt: new Date(Date.now() - 9000000).toISOString(),
    confirmedBy: ['u1'], confidenceScore: 92, priorityScore: 94, peopleAffected: 850, imageUrl: null, adminNotes: 'CAL FIRE on scene', zoneId: 'wz3'
  },
  {
    id: 'r7', category: 'cyclone', title: 'Category 4 Hurricane Landfall Warning (Miami, FL)',
    description: 'Sustained winds 140mph. Storm surge warnings active for coastal keys.',
    location: { lat: 25.78, lng: -80.22, address: 'Biscayne Bay, Miami, Florida, USA' },
    severity: 5, status: 'verified', reportedBy: 'u3', reportedAt: new Date(Date.now() - 14400000).toISOString(),
    confirmedBy: ['u1', 'u2'], confidenceScore: 99, priorityScore: 98, peopleAffected: 3400, imageUrl: null, adminNotes: 'FEMA shelters opened', zoneId: 'wz4'
  },
  {
    id: 'r8', category: 'landslide', title: 'Mountain Road Blocked by Debris Flow (Valais)',
    description: 'Heavy rainfall triggered rockslide blocking Alpine pass. Tourist vehicles stranded.',
    location: { lat: 46.25, lng: 7.40, address: 'Valais Mountain Pass, Switzerland' },
    severity: 3, status: 'under_verification', reportedBy: 'u1', reportedAt: new Date(Date.now() - 7200000).toISOString(),
    confirmedBy: [], confidenceScore: 75, priorityScore: 68, peopleAffected: 24, imageUrl: null, adminNotes: 'Heavy machinery dispatched', zoneId: 'wz7'
  }
];

const alerts = [
  {
    id: 'a1', type: 'critical', disasterType: 'flood',
    title: 'CRITICAL: Severe Krishna River Basin Inundation',
    message: 'Water levels exceeded danger mark (8.5m). Evacuate low-lying areas immediately towards designated shelters.',
    area: 'Zone A - Krishna River Basin', zoneId: 'z1', issuedAt: new Date().toISOString(),
    source: 'authority', verificationStatus: 'official', isActive: true
  },
  {
    id: 'a2', type: 'critical', disasterType: 'cyclone',
    title: 'SUPER CYCLONE WARNING: Bay of Bengal Coastal Corridor',
    message: 'Storm surge of 3-5m anticipated. All maritime activities strictly prohibited. Move to cyclone shelters.',
    area: 'Bay of Bengal Coastal Sector', zoneId: 'wz1', issuedAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'system', verificationStatus: 'official', isActive: true
  },
  {
    id: 'a3', type: 'warning', disasterType: 'fire',
    title: 'WILDFIRE EVACUATION DIRECTIVE: Northern California',
    message: 'Rapidly spreading brush fire fueled by dry gusty winds. Avoid Highway 101 corridors.',
    area: 'Sacramento Foothills, CA', zoneId: 'wz3', issuedAt: new Date(Date.now() - 7200000).toISOString(),
    source: 'authority', verificationStatus: 'official', isActive: true
  },
  {
    id: 'a4', type: 'warning', disasterType: 'earthquake',
    title: 'SEISMIC AFTERSHOCK ALERT: Pacific Rim - Kanto Region',
    message: 'M5.5+ aftershocks probable within the next 24 hours. Keep emergency go-bags ready.',
    area: 'Tokyo & Surrounding Prefectures', zoneId: 'wz2', issuedAt: new Date(Date.now() - 10800000).toISOString(),
    source: 'prediction', verificationStatus: 'ai_prediction', isActive: true
  }
];

const resources = [
  // Local Emergency Facilities (India)
  {
    id: 'res1', type: 'hospital', name: 'Government General Hospital (Vijayawada)',
    location: { lat: 16.5122, lng: 80.6420, address: 'Hanumanpet, Vijayawada' },
    contact: '+91-866-2421234', capacity: 350, currentOccupancy: 210, status: 'open',
    distance: '1.2', operatingHours: '24/7 Emergency & Trauma', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res2', type: 'shelter', name: 'Municipal Indoor Stadium Emergency Shelter',
    location: { lat: 16.5040, lng: 80.6550, address: 'M.G. Road, Vijayawada' },
    contact: '+91-866-2554321', capacity: 600, currentOccupancy: 340, status: 'open',
    distance: '2.4', operatingHours: '24/7 Relief & Food Distribution', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res3', type: 'fire', name: 'Central Fire & Disaster Rescue Station',
    location: { lat: 16.5180, lng: 80.6350, address: 'Old City Station Road' },
    contact: '101 / +91-866-2470101', capacity: 80, currentOccupancy: 45, status: 'open',
    distance: '3.1', operatingHours: '24/7 Quick Response Boats', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res4', type: 'police', name: 'District Emergency Police Command',
    location: { lat: 16.5090, lng: 80.6460, address: 'Collectorate Junction' },
    contact: '100 / 112', capacity: 120, currentOccupancy: 60, status: 'open',
    distance: '0.8', operatingHours: '24/7 Emergency Dispatch', lastUpdated: new Date().toISOString()
  },

  // Global Disaster Hubs
  {
    id: 'res5', type: 'hospital', name: 'Tokyo University Disaster Medical Center',
    location: { lat: 35.7128, lng: 139.7620, address: 'Bunkyo-ku, Tokyo, Japan' },
    contact: '+81-3-3815-5411', capacity: 1200, currentOccupancy: 850, status: 'open',
    distance: '4.5', operatingHours: '24/7 Level 1 Trauma Center', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res6', type: 'shelter', name: 'Sacramento County Evacuation & Relief Center',
    location: { lat: 38.5600, lng: -121.4600, address: 'Sacramento, CA, USA' },
    contact: '+1-916-874-5000', capacity: 800, currentOccupancy: 520, status: 'open',
    distance: '8.2', operatingHours: '24/7 Wildfire Evacuation', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res7', type: 'shelter', name: 'Miami-Dade Storm Relief Pavilion',
    location: { lat: 25.7900, lng: -80.1500, address: 'Miami Beach, FL, USA' },
    contact: '+1-305-468-5400', capacity: 1500, currentOccupancy: 1100, status: 'open',
    distance: '6.0', operatingHours: '24/7 Category 5 Rated Shelter', lastUpdated: new Date().toISOString()
  },
  {
    id: 'res8', type: 'hospital', name: 'Hôpital du Valais (Sion Emergency Unit)',
    location: { lat: 46.2300, lng: 7.3600, address: 'Sion, Valais, Switzerland' },
    contact: '+41-27-603-4000', capacity: 400, currentOccupancy: 280, status: 'open',
    distance: '3.4', operatingHours: '24/7 Alpine Rescue Trauma Unit', lastUpdated: new Date().toISOString()
  }
];

const sensorReadings = [];
zones.forEach(zone => {
  for (let i = 0; i < 24; i++) {
    const time = new Date(new Date().getTime() - (24 - i) * 3600000);
    let waterLevel = zone.waterLevel * 0.5 + (i / 24) * zone.waterLevel * 0.5;
    if (zone.id === 'z1') {
      waterLevel = 5.0 + (i / 24) * 3.5; 
    }
    sensorReadings.push({
      zoneId: zone.id,
      timestamp: time.toISOString(),
      waterLevel: Number(waterLevel.toFixed(2)),
      rainfallMm: Math.floor(zone.rainfallMm * 0.5 + (i / 24) * zone.rainfallMm * 0.5)
    });
  }
});

module.exports = { users, zones, reports, alerts, resources, sensorReadings };
