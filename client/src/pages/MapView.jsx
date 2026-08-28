import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import {
  Globe, MapPin, Layers, Cross, Home, Flame, Droplets,
  AlertTriangle, Shield, Navigation, Eye, Activity, Filter,
  Locate, Search, Sparkles, Compass, Maximize2, Minimize2, Plus, Minus,
  ChevronRight, ChevronLeft, RefreshCw
} from 'lucide-react';

// Controller to smoothly change view and handle resize invalidations
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Click listener to place custom point or inspect coordinates
function MapClickInspector({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

// Custom icons setup using plain HTML and SVG strings (Zero external image dependencies)
const createIcon = (color, svgPath) => L.divIcon({
  html: `<div style="background:${color};border:2px solid white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.6)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
  </div>`,
  className: 'custom-leaflet-icon',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -20]
});

const getResourceIcon = (type) => {
  let svgPath = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`; // Police
  let color = '#3b82f6';
  
  if (type === 'hospital') {
    svgPath = `<path d="M18 18V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12"/><path d="M2 18h20"/><path d="M10 10h4"/><path d="M12 8v4"/>`;
    color = '#ef4444';
  } else if (type === 'shelter') {
    svgPath = `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`;
    color = '#10b981';
  } else if (type === 'fire') {
    svgPath = `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`;
    color = '#f97316';
  }
  
  return createIcon(color, svgPath);
};

const getReportIcon = (category, severity) => {
  let svgPath = `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`;
  if (category === 'fire') {
    svgPath = `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`;
  } else if (category === 'cyclone') {
    svgPath = `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`;
  } else if (category === 'earthquake') {
    svgPath = `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`;
  }

  let color = '#10b981'; // 1-2 green
  if (severity === 3) color = '#eab308'; // yellow
  if (severity === 4) color = '#f97316'; // orange
  if (severity >= 5) color = '#ef4444'; // red

  return createIcon(color, svgPath);
};

const getZoneStyle = (severity, type) => {
  let baseColor = '#ef4444';
  if (severity === 'high') baseColor = '#f97316';
  if (severity === 'medium') baseColor = '#eab308';
  if (severity === 'low') baseColor = '#10b981';

  return {
    color: baseColor,
    fillColor: baseColor,
    fillOpacity: severity === 'critical' ? 0.35 : 0.22,
    weight: 2.5,
    dashArray: type === 'cyclone' ? '6, 6' : undefined
  };
};

const REGIONS = [
  { id: 'global', name: '🌍 Global World View', center: [20, 10], zoom: 2 },
  { id: 'india_regional', name: '🇮🇳 India / Vijayawada', center: [16.5062, 80.6480], zoom: 12 },
  { id: 'cyclone_bay', name: '🌀 Bay of Bengal Cyclone', center: [15.5, 83.5], zoom: 6 },
  { id: 'japan', name: '🇯🇵 Japan Pacific Rim', center: [35.6895, 139.6917], zoom: 6 },
  { id: 'usa', name: '🇺🇸 North America', center: [35.0, -100.0], zoom: 4 },
  { id: 'europe', name: '🇪🇺 Europe & Mediterranean', center: [44.0, 15.0], zoom: 4 },
  { id: 'brazil', name: '🇧🇷 Latin America (Brazil)', center: [-15.0, -50.0], zoom: 4 }
];

// 100% WATERMARK-FREE & FREE TILE PROVIDERS (ZERO API KEYS)
const TILE_LAYERS = {
  dark: {
    name: '🌙 Dark Tactical (Esri Clean)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
  },
  osm: {
    name: '🗺️ OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  hot: {
    name: '🚨 Humanitarian OSM (Disaster)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
  },
  satellite: {
    name: '🛰️ Satellite View (Esri Free)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Open GIS World Imagery'
  }
};

export default function MapView() {
  const { socket } = useSocket();
  const mapContainerRef = useRef(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map view & controls
  const [currentCenter, setCurrentCenter] = useState([20, 10]);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [activeRegion, setActiveRegion] = useState('global');
  const [activeTileLayer, setActiveTileLayer] = useState('dark');
  const [userLocation, setUserLocation] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters & sidebar
  const [showZones, setShowZones] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchZones = async () => {
    try {
      const data = await api.get('/map/zones');
      if (data && data.type === 'FeatureCollection') {
        setGeoJsonData(data);
      }
    } catch (err) {
      console.error('Failed to fetch zones', err);
    }
  };

  const fetchMarkers = async () => {
    try {
      const data = await api.get('/map/markers');
      if (data && Array.isArray(data)) {
        setMarkers(data);
      }
    } catch (err) {
      console.error('Failed to fetch markers', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchZones(), fetchMarkers()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_report', (report) => {
      setMarkers((prev) => [
        ...prev,
        {
          id: report.id,
          type: 'report',
          position: [report.location?.lat || report.lat, report.location?.lng || report.lng],
          popupData: report
        }
      ]);
    });

    socket.on('zone_update', () => {
      fetchZones();
    });

    return () => {
      socket.off('new_report');
      socket.off('zone_update');
    };
  }, [socket]);

  const handleRegionChange = (region) => {
    setActiveRegion(region.id);
    setCurrentCenter(region.center);
    setCurrentZoom(region.zoom);
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setCurrentCenter([lat, lng]);
          setCurrentZoom(13);
          setActiveRegion('custom');
        },
        (err) => {
          console.warn('Geolocation unavailable, defaulting to regional zone', err);
          setCurrentCenter([16.5062, 80.6480]);
          setCurrentZoom(13);
        }
      );
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    const q = searchQuery.toLowerCase();
    
    // Quick match against loaded zones
    if (geoJsonData?.features) {
      const match = geoJsonData.features.find(f => 
        f.properties.name?.toLowerCase().includes(q) || f.properties.type?.toLowerCase().includes(q)
      );
      if (match && match.geometry?.coordinates?.[0]?.[0]) {
        const coord = match.geometry.coordinates[0][0];
        setCurrentCenter([coord[1], coord[0]]);
        setCurrentZoom(9);
        setActiveRegion('custom');
        return;
      }
    }

    if (q.includes('india') || q.includes('vijayawada')) handleRegionChange(REGIONS[1]);
    else if (q.includes('japan') || q.includes('tokyo')) handleRegionChange(REGIONS[3]);
    else if (q.includes('usa') || q.includes('california') || q.includes('america')) handleRegionChange(REGIONS[4]);
    else if (q.includes('europe') || q.includes('swiss') || q.includes('greece')) handleRegionChange(REGIONS[5]);
    else if (q.includes('brazil') || q.includes('rio')) handleRegionChange(REGIONS[6]);
    else if (q.includes('cyclone') || q.includes('bengal')) handleRegionChange(REGIONS[2]);
    else handleRegionChange(REGIONS[0]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredMarkers = markers.filter((m) => {
    if (m.type === 'report' && !showReports) return false;
    if (m.type === 'resource' && !showResources) return false;
    if (selectedCategory !== 'all') {
      const cat = m.popupData?.category || m.popupData?.type;
      if (cat !== selectedCategory) return false;
    }
    return true;
  });

  return (
    <div ref={mapContainerRef} className="w-full h-full flex-1 relative bg-dark-900 overflow-hidden select-none">
      {/* Full-Screen Map Container */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-dark-900/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <span className="text-sm font-bold text-white tracking-wider">Rendering Live Threat Map...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={currentCenter}
          zoom={currentZoom}
          style={{ height: '100%', width: '100%', backgroundColor: '#0b1120' }}
          zoomControl={false}
          attributionControl={true}
        >
          <MapController center={currentCenter} zoom={currentZoom} />
          <MapClickInspector onMapClick={(latlng) => setClickedLocation(latlng)} />

          {/* 100% Watermark-Free Tile Layer */}
          <TileLayer
            key={activeTileLayer}
            url={TILE_LAYERS[activeTileLayer].url}
            attribution={TILE_LAYERS[activeTileLayer].attribution}
          />

          {/* GPS User Pin */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={createIcon('#3b82f6', '<circle cx="12" cy="12" r="7"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>')}
            >
              <Popup>
                <div className="text-white text-xs font-bold p-1">
                  📍 Your Current GPS Location
                </div>
              </Popup>
            </Marker>
          )}

          {/* Clicked location marker */}
          {clickedLocation && (
            <Marker
              position={[clickedLocation.lat, clickedLocation.lng]}
              icon={createIcon('#a855f7', '<path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>')}
            >
              <Popup>
                <div className="text-white text-xs p-1">
                  <div className="font-bold mb-1">Selected Coordinates</div>
                  <div className="font-mono text-gray-300 mb-2">
                    {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}
                  </div>
                  <a
                    href="/report"
                    className="block text-center bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-[11px]"
                  >
                    Report Incident Here
                  </a>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Risk Zone Polygons from GeoJSON */}
          {showZones && geoJsonData && (
            <GeoJSON
              key={`geojson-${JSON.stringify(geoJsonData)}`}
              data={geoJsonData}
              style={(feature) =>
                getZoneStyle(feature.properties.severity, feature.properties.type)
              }
              onEachFeature={(feature, layer) => {
                const p = feature.properties;
                layer.bindPopup(`
                  <div style="min-width: 220px; font-family: 'Inter', sans-serif; color: #f1f5f9; padding: 4px;">
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: ${
                      p.severity === 'critical' ? '#f87171' : '#fb923c'
                    }; letter-spacing: 0.5px; margin-bottom: 2px;">
                      ${p.type ? p.type.toUpperCase() : 'HAZARD ZONE'} &bull; ${p.severity?.toUpperCase()}
                    </div>
                    <h3 style="font-weight: 800; font-size: 15px; margin-bottom: 6px; color: #ffffff;">${p.name}</h3>
                    <div style="background: rgba(255,255,255,0.06); padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                      <div style="display:flex; justify-content:space-between; margin-bottom: 3px; font-size: 12px;">
                        <span>AI Risk Score:</span>
                        <strong style="color:#f87171; font-family:monospace;">${p.riskScore || 85}%</strong>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size: 12px;">
                        <span>Threat Level:</span>
                        <span style="text-transform: capitalize; font-weight: 600;">${p.severity}</span>
                      </div>
                    </div>
                    <a href="/alerts" style="display:block; text-align:center; background:#dc2626; color:white; padding:6px; border-radius:6px; font-size:11px; font-weight:bold; text-decoration:none;">
                      View Associated Alerts &rarr;
                    </a>
                  </div>
                `);
              }}
            />
          )}

          {/* Markers: Incidents & Emergency Resources */}
          {filteredMarkers.map((marker, idx) => {
            if (!marker.position || !marker.position[0] || !marker.position[1]) return null;

            const isReport = marker.type === 'report';
            const popup = marker.popupData || {};

            return (
              <Marker
                key={`marker-${marker.id || idx}`}
                position={marker.position}
                icon={
                  isReport
                    ? getReportIcon(popup.category || 'flood', popup.severity || 4)
                    : getResourceIcon(popup.type || 'police')
                }
              >
                <Popup>
                  <div className="font-sans text-white min-w-[210px] p-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          isReport ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {isReport ? `Incident: ${popup.category}` : `Facility: ${popup.type}`}
                      </span>
                      {popup.status && (
                        <span className="text-[10px] font-mono capitalize text-emerald-400 font-bold">
                          {popup.status}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-base text-white mb-1">
                      {popup.title || popup.name}
                    </h4>

                    {popup.description && (
                      <p className="text-xs text-gray-300 mb-2 leading-relaxed">
                        {popup.description}
                      </p>
                    )}

                    {popup.location?.address && (
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-red-400" />
                        <span>{popup.location.address}</span>
                      </div>
                    )}

                    {popup.peopleAffected && (
                      <div className="text-xs text-red-400 font-bold mb-2">
                        ⚠️ {popup.peopleAffected} People Reported At Risk
                      </div>
                    )}

                    {popup.capacity && (
                      <div className="text-xs text-gray-300 mb-3">
                        Bed Capacity: <strong>{popup.currentOccupancy || 0}/{popup.capacity}</strong>
                      </div>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${marker.position[0]},${marker.position[1]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition mt-2 text-center"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigate to Location</span>
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* FLOATING TOP BAR: Region Quick Jumper & Zero-Watermark Indicator */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Region Quick Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 bg-dark-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-700/80 shadow-2xl pointer-events-auto">
          {REGIONS.map((reg) => (
            <button
              key={reg.id}
              onClick={() => handleRegionChange(reg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeRegion === reg.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-gray-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              {reg.name}
            </button>
          ))}
          <button
            onClick={handleLocateMe}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Pin My Real-time GPS Location"
          >
            <Locate className="w-3.5 h-3.5" />
            <span>My GPS Location</span>
          </button>
        </div>

        {/* Tile Style + Fullscreen Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-dark-900/90 backdrop-blur-md p-1 rounded-2xl border border-gray-700/80 flex items-center gap-1 shadow-2xl">
            {Object.keys(TILE_LAYERS).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTileLayer(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  activeTileLayer === key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {TILE_LAYERS[key].name.split(' ')[0]} {TILE_LAYERS[key].name.split(' ')[1]}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-dark-900/90 backdrop-blur-md border border-gray-700/80 rounded-2xl text-white hover:bg-dark-800 transition shadow-2xl"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-2 bg-dark-900/90 backdrop-blur-md border border-gray-700/80 rounded-2xl text-white hover:bg-dark-800 transition shadow-2xl flex items-center gap-1.5 text-xs font-bold"
          >
            <Filter className="w-4 h-4 text-red-500" />
            <span>{sidebarOpen ? 'Hide Controls' : 'Show Controls'}</span>
          </button>
        </div>
      </div>

      {/* FLOATING ZOOM CONTROLS (Left side) */}
      <div className="absolute left-4 bottom-8 z-[400] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setCurrentZoom((z) => Math.min(18, z + 1))}
          className="w-10 h-10 bg-dark-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl text-white hover:bg-dark-800 flex items-center justify-center shadow-xl transition"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentZoom((z) => Math.max(2, z - 1))}
          className="w-10 h-10 bg-dark-900/90 backdrop-blur-md border border-gray-700/80 rounded-xl text-white hover:bg-dark-800 flex items-center justify-center shadow-xl transition"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* FLOATING LAYER & SEARCH DRAWER (Right side - Floating over map) */}
      {sidebarOpen && (
        <div className="absolute top-20 right-4 bottom-8 w-80 bg-dark-900/90 backdrop-blur-xl border border-gray-700/80 rounded-3xl p-5 z-[400] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 pointer-events-auto">
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search region, hazard or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-800 border border-gray-700 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 shadow-inner"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Live Map Layers</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Watermark-Free
              </span>
            </div>

            {/* Layer Checkboxes */}
            <div className="space-y-2 bg-dark-800/80 p-3 rounded-2xl border border-gray-700/60">
              <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-dark-700/50 rounded transition">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-400"></span>
                  <span>Disaster Hazard Zones</span>
                </span>
                <input
                  type="checkbox"
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 bg-dark-900 border-gray-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-dark-700/50 rounded transition">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Citizen Incident Reports</span>
                </span>
                <input
                  type="checkbox"
                  checked={showReports}
                  onChange={(e) => setShowReports(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 bg-dark-900 border-gray-600 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-dark-700/50 rounded transition">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Hospitals & Shelters</span>
                </span>
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={(e) => setShowResources(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 bg-dark-900 border-gray-600 focus:ring-0"
                />
              </label>
            </div>

            {/* Threat Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Filter Threat Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-dark-800 border border-gray-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">🌐 All Threats Worldwide</option>
                <option value="flood">🌊 Floods & Inundation</option>
                <option value="cyclone">🌀 Cyclones & Hurricanes</option>
                <option value="earthquake">🌋 Earthquakes & Faults</option>
                <option value="fire">🔥 Wildfires</option>
                <option value="landslide">🏔️ Landslides</option>
              </select>
            </div>

            {/* Legend */}
            <div className="border-t border-gray-800 pt-3">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Severity & Key</h3>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500"></div> Critical Severity (&ge;80% Risk)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> High Severity (60-79%)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Medium Severity (30-59%)</div>
                <div className="flex items-center gap-2 mt-2"><Cross className="w-3.5 h-3.5 text-red-500" /> Hospital / Emergency Unit</div>
                <div className="flex items-center gap-2"><Home className="w-3.5 h-3.5 text-emerald-500" /> Disaster Relief Shelter</div>
                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-500" /> Police / Rescue HQ</div>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="pt-3 border-t border-gray-800">
            <a
              href="/report"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xl shadow-red-600/30"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Local Incident</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
