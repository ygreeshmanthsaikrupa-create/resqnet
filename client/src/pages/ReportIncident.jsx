import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Droplets, Flame, Construction, Building, Mountain, 
  Heart, UserSearch, Zap, AlertCircle, ArrowRight, ArrowLeft, CheckCircle,
  MapPin, Locate, Sparkles, Send, Upload, Image as ImageIcon, X, AlertTriangle, Radio
} from 'lucide-react';
import { api, uploadReportImage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/ui/LoginModal';

const CATEGORIES = [
  { id: 'flood', label: 'Flood & Inundation', icon: Droplets, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'fire', label: 'Wildfire / Urban Fire', icon: Flame, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { id: 'road_blockage', label: 'Road Blockage / Debris', icon: Construction, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  { id: 'building_damage', label: 'Structural Collapse', icon: Building, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 'landslide', label: 'Landslide / Mudflow', icon: Mountain, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'medical_emergency', label: 'Medical Emergency', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  { id: 'missing_stranded', label: 'Stranded / Trapped People', icon: UserSearch, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { id: 'power_outage', label: 'Power & Grid Outage', icon: Zap, color: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30' },
  { id: 'other', label: 'Other Hazard', icon: AlertCircle, color: 'text-gray-300 bg-gray-500/10 border-gray-500/30' }
];

function LocationPicker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    }
  });

  const pinIcon = L.divIcon({
    html: `<div style="background:#ef4444;border:2px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.6)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
    </div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

export default function ReportIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  const [pinPosition, setPinPosition] = useState([16.5062, 80.6480]);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    severity: 4,
    peopleAffected: 0,
    address: 'Krishna River Basin Corridor, Vijayawada',
    contactName: user?.name || '',
    contactPhone: ''
  });

  // Auto-attempt geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPinPosition(coords);
        },
        () => {}
      );
    }
  }, []);

  const validateStep1 = () => {
    if (!formData.category) {
      setErrors({ category: 'Please select an incident category to proceed' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.title || formData.title.trim().length < 3) {
      errs.title = 'Incident headline is required (min 3 characters)';
    }
    if (!formData.description || formData.description.trim().length < 5) {
      errs.description = 'Please provide details about what is happening (min 5 characters)';
    }
    if (!formData.address || formData.address.trim().length < 2) {
      errs.address = 'Please provide an address or click the map to set a location';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPinPosition(coords);
          setFormData((prev) => ({
            ...prev,
            address: `GPS Pin: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`
          }));
        },
        () => {
          alert('GPS permission not granted. You can click anywhere on the map to drop a pin.');
        }
      );
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const res = await uploadReportImage(file);
      if (res && res.imageUrl) {
        setUploadedImageUrl(res.imageUrl);
      }
    } catch (err) {
      console.warn('Image upload error:', err.message);
      // Fallback preview kept
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
  };

  const handleQuickSOS = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await api.post('/reports', {
        category: 'medical_emergency',
        title: 'URGENT SOS: Immediate Rescue Required',
        description: 'Citizen in critical emergency requiring immediate response assistance.',
        severity: 5,
        peopleAffected: 1,
        location: {
          lat: pinPosition[0],
          lng: pinPosition[1],
          address: 'Emergency GPS Coordinates'
        },
        reportedBy: user.id
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Failed to dispatch SOS alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await api.post('/reports', {
        ...formData,
        imageUrl: uploadedImageUrl,
        location: {
          lat: pinPosition[0],
          lng: pinPosition[1],
          address: formData.address
        },
        reportedBy: user.id
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Failed to submit report. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-dark-800 p-8 rounded-3xl border border-gray-700 max-w-md w-full text-center shadow-2xl"
        >
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-extrabold text-white mb-2">Emergency Report Dispatched</h2>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Your incident has been pinned to the Live Threat Map and broadcasted to emergency coordinators & volunteers.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/map')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-red-600/30"
            >
              View on Live Map
            </button>
            <button 
              onClick={() => navigate('/my-reports')}
              className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-bold py-3 rounded-xl transition"
            >
              Track Reports
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
      {/* 1-Tap SOS Emergency Banner */}
      <div className="mb-6 bg-gradient-to-r from-red-950/80 via-dark-800 to-dark-800 border border-red-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-red-600/30 text-red-400 rounded-xl flex items-center justify-center border border-red-500/40 flex-shrink-0 animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Immediate Life Threat?</h3>
            <p className="text-xs text-gray-300 mt-0.5">Need instant rescue boats, ambulance or evacuation assistance right now?</p>
          </div>
        </div>
        <button
          onClick={handleQuickSOS}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-600/40 flex items-center justify-center gap-2 flex-shrink-0"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{loading ? 'Sending...' : '1-Tap Emergency SOS'}</span>
        </button>
      </div>

      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            CITIZEN REPORTING
          </span>
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Real-time Response Dispatch
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Report Disaster Incident</h1>
        <p className="text-gray-400 text-sm mt-1">Submit ground observations with photos and exact coordinates to guide rescue operations.</p>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative mt-8 max-w-xl mx-auto">
          <div className="absolute left-0 right-0 h-1 bg-gray-800 top-1/2 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute left-0 h-1 bg-red-600 top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {['1. Category', '2. Map Pin & Info', '3. Severity & Photo', '4. Review'].map((label, idx) => {
            const num = idx + 1;
            return (
              <div key={num} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step >= num ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}
                >
                  {num}
                </div>
                <span className="text-[10px] text-gray-400 font-bold mt-1 hidden sm:block">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-dark-800 border border-gray-700/80 rounded-3xl p-6 md:p-8 shadow-2xl">
        {serverError && (
          <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Step 1: Select Incident Category</h2>
                <p className="text-xs text-gray-400">Choose the primary nature of the emergency situation.</p>
              </div>

              {errors.category && (
                <p className="text-xs text-red-400 font-semibold">{errors.category}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id, title: cat.label });
                      setErrors({});
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                      formData.category === cat.id
                        ? 'border-red-500 bg-red-600/20 text-white ring-2 ring-red-500 shadow-lg'
                        : 'border-gray-700/80 bg-dark-900/80 text-gray-300 hover:border-gray-600 hover:bg-dark-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{cat.label}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  disabled={!formData.category}
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                >
                  <span>Continue to Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MAP PINNING & DESCRIPTION */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Step 2: Pin Exact Location & Details</h2>
                <p className="text-xs text-gray-400">Click anywhere on the map to drop an emergency marker pin.</p>
              </div>

              {/* Free OpenStreetMap Pin Picker */}
              <div className="rounded-2xl overflow-hidden border border-gray-700 relative h-64 w-full shadow-inner">
                <div className="absolute top-3 right-3 z-[400]">
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                  >
                    <Locate className="w-3.5 h-3.5" />
                    <span>Pin My GPS Location</span>
                  </button>
                </div>

                <MapContainer
                  center={pinPosition}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <LocationPicker
                    position={pinPosition}
                    onLocationSelect={(pos) => {
                      setPinPosition(pos);
                      setFormData((prev) => ({ ...prev, address: `Pinned: ${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}` }));
                    }}
                  />
                </MapContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Incident Headline / Summary *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (errors.title) setErrors({ ...errors, title: null });
                    }}
                    placeholder="e.g. Flash flood trapped 5 families"
                    className={`w-full bg-dark-900 border ${errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700'} rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500`}
                    required
                  />
                  {errors.title && <p className="text-[11px] text-red-400 font-semibold mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Address / Landmark *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: null });
                    }}
                    placeholder="Nearby street, building or landmark"
                    className={`w-full bg-dark-900 border ${errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700'} rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500`}
                    required
                  />
                  {errors.address && <p className="text-[11px] text-red-400 font-semibold mt-1">{errors.address}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Detailed Situation Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: null });
                  }}
                  placeholder="Describe water depth, fire spread, road accessibility, or specific medical needs..."
                  rows={3}
                  className={`w-full bg-dark-900 border ${errors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700'} rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500`}
                  required
                ></textarea>
                {errors.description && <p className="text-[11px] text-red-400 font-semibold mt-1">{errors.description}</p>}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                >
                  <span>Next: Severity & Photo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SEVERITY, IMPACT & REAL PHOTO UPLOAD */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Step 3: Severity & Field Photo</h2>
                <p className="text-xs text-gray-400">Estimate human risk and attach ground verification imagery.</p>
              </div>

              {/* Severity Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-gray-300 uppercase">Perceived Severity Rating (1 to 5)</label>
                  <span className={`font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg ${
                    formData.severity >= 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    Level {formData.severity} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-semibold">
                  <span>1 - Minor Alert</span>
                  <span>3 - Moderate Risk</span>
                  <span>5 - Life Threatening Emergency</span>
                </div>
              </div>

              {/* People Affected Count */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Estimated People Trapped / Needing Immediate Aid</label>
                <input
                  type="number"
                  min="0"
                  value={formData.peopleAffected}
                  onChange={(e) => setFormData({ ...formData, peopleAffected: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-dark-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                  placeholder="e.g. 8"
                />
              </div>

              {/* Real Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Incident Ground Photo (Optional)</label>
                {!imagePreview ? (
                  <label className="border-2 border-dashed border-gray-700 hover:border-red-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-dark-900/60 hover:bg-dark-900 transition">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs font-bold text-gray-300">Click to upload photo evidence</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">JPG, PNG, WebP (up to 10MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative inline-block border border-gray-700 rounded-2xl overflow-hidden bg-dark-900">
                    <img src={imagePreview} alt="Uploaded scene" className="h-40 w-auto object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white font-bold">
                        Uploading...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                >
                  <span>Review Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Step 4: Review & Dispatch Report</h2>
                <p className="text-xs text-gray-400">Confirm report summary before publishing to response teams.</p>
              </div>

              <div className="bg-dark-900/80 border border-gray-700 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-bold text-red-400 capitalize">{formData.category.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Headline:</span>
                  <span className="font-bold text-white">{formData.title}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Pinned Coordinates:</span>
                  <span className="font-mono text-emerald-400 font-bold">{pinPosition[0].toFixed(4)}, {pinPosition[1].toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Severity Level:</span>
                  <span className="font-bold text-red-400 font-mono">{formData.severity} / 5</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-gray-400">People At Risk:</span>
                  <span className="font-mono text-yellow-400 font-bold">{formData.peopleAffected}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Description:</span>
                  <p className="text-gray-200 bg-dark-800 p-2.5 rounded-xl border border-gray-700/60 text-xs leading-relaxed">
                    {formData.description}
                  </p>
                </div>
                {imagePreview && (
                  <div>
                    <span className="text-gray-400 block mb-1">Attached Photo:</span>
                    <img src={imagePreview} alt="Attached scene" className="h-24 rounded-lg border border-gray-700 object-cover" />
                  </div>
                )}
              </div>

              {!user && (
                <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>You must be signed in to submit emergency reports. Clicking submit will open a 1-click sign in.</span>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-xl shadow-red-600/40 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Dispatching to Response Crews...' : 'Submit Emergency Report'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
