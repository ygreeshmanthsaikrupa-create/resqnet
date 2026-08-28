export const CATEGORIES = [
  { id: 'flood', label: 'Flood', icon: 'Droplets' },
  { id: 'fire', label: 'Fire', icon: 'Flame' },
  { id: 'road_blockage', label: 'Road Blockage', icon: 'Construction' },
  { id: 'building_damage', label: 'Building Damage', icon: 'Building' },
  { id: 'landslide', label: 'Landslide', icon: 'Mountain' },
  { id: 'medical_emergency', label: 'Medical Emergency', icon: 'Heart' },
  { id: 'missing_stranded', label: 'Missing/Stranded', icon: 'UserSearch' },
  { id: 'power_outage', label: 'Power Outage', icon: 'Zap' },
  { id: 'other', label: 'Other', icon: 'AlertCircle' },
];

export const SEVERITY_LEVELS = [
  { value: 1, label: 'Low', color: 'bg-green-600' },
  { value: 2, label: 'Medium', color: 'bg-yellow-500' },
  { value: 3, label: 'High', color: 'bg-orange-500' },
  { value: 4, label: 'Critical', color: 'bg-red-600' },
  { value: 5, label: 'Catastrophic', color: 'bg-purple-600' },
];

export const SEVERITY_COLORS = {
  low: 'text-green-500 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
};

export const STATUS_FLOW = ['submitted', 'under_verification', 'verified', 'resolved'];

export const RESOURCE_TYPES = [
  { id: 'hospital', label: 'Hospital', icon: 'Cross' },
  { id: 'shelter', label: 'Shelter', icon: 'Home' },
  { id: 'police', label: 'Police', icon: 'Shield' },
  { id: 'fire', label: 'Fire Station', icon: 'Flame' },
  { id: 'relief', label: 'Relief Center', icon: 'Package' },
  { id: 'food_water', label: 'Food & Water', icon: 'Coffee' },
];

export const MAP_CENTER = [16.5062, 80.6480];
export const MAP_ZOOM = 13;

export const SIMULATION_STEPS = [
  "Initializing simulation engine...",
  "Generating baseline weather and seismic data...",
  "Injecting early warning sensor anomalies...",
  "Triggering AI prediction models...",
  "Simulating primary incident...",
  "Propagating secondary effects...",
  "Generating synthetic citizen reports...",
  "Routing autonomous drone verification...",
  "Allocating emergency resources dynamically...",
  "Finalizing damage assessment and stabilization."
];
