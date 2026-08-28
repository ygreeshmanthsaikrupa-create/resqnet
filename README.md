# ResQNet — Intelligent Disaster Prediction & Community Response Platform

> **Problem Statement #1: Disaster Prediction and Community Response System**
> *"A technology-driven disaster management platform that analyses available environmental, weather, geographical, and community-generated data to identify potential risks and support faster emergency response."*

---

## 🎯 Problem Statement #1 — Feature Compliance Matrix

| # | Expected Feature | Implementation in ResQNet |
|---|------------------|----------------------------|
| **1** | **Risk prediction or early-warning mechanism** | ✅ Weighted multi-factor risk scoring engine (`predictionService.js`), 24-hour predictive inundation curves, and automated early-warning alerts (`alertEngine.js`). |
| **2** | **Interactive map showing vulnerable locations** | ✅ 100% Free Live Threat Map (`MapView.jsx`) with GeoJSON hazard polygons, colored severity tiers (Critical/High/Medium/Low), global region jumpers, and zero API keys needed. |
| **3** | **Identification of nearby shelters, hospitals & resources** | ✅ Emergency resource locator (`Resources.jsx`) with live capacity tracking, distance sorting, and turn-by-turn navigation routing. |
| **4** | **Real-time notifications and alerts** | ✅ Bidirectional Socket.io broadcast bus (`LiveAlertToast.jsx` & `AlertCenter.jsx`) pushing verified emergency directives and citizen notifications instantly. |
| **5** | **Dashboard for administrators / rescue teams** | ✅ 4-in-1 Operations Center (`Dashboard.jsx`): Authority Command Center (Admin), Volunteer Operations Hub, Citizen Safety Portal, and AI Early Warning Telemetry. |
| **6** | **Prioritization of rescue requests based on severity** | ✅ Mathematical priority scorer (`priorityScorer.js`) ranking triage requests by severity, people trapped, zone risk, confidence, and time sensitivity. |
| **7** | **Offline / low-connectivity functionality** | ✅ Offline-first PWA architecture (`sw.js`, `OfflineContext.jsx`), encrypted local incident queuing, offline shelter directory, and automatic background sync upon reconnection. |

---

## 🌟 Key Capabilities & Architecture

- **🗺️ 100% Free Live Threat Map (Zero Watermarks, Zero API Keys)**: Full-viewport geospatial threat map powered by **Esri Dark Canvas**, **OpenStreetMap Standard**, and **Humanitarian OSM (HOT)** with native GPS locator and interactive report pin picker.
- **🔐 Hardened Authentication & Access Control**: Password hashing with `bcryptjs`, JWT token signing via environment secret, brute-force rate-limiting (`express-rate-limit`), and role-based permissions (Citizen, Volunteer, Admin).
- **💾 Persistent SQLite Storage**: Powered by `better-sqlite3` with automated schema DDLs, relational integrity, and pre-seeded global disaster zones, reports, and emergency resources.
- **⚡ Real-Time Broadcasting**: Socket.io bidirectional event bus emitting instant alerts, status changes, and priority recalculations to all connected clients with floating notifications.
- **📸 Real Field Photo Uploads**: Multi-part image processing via `multer` storing incident evidence to `/uploads`.
- **🚨 1-Tap SOS Emergency Dispatch**: Quick distress button for citizens in immediate peril.
- **⚡ Offline Mode with Auto-Sync**: Submit ground reports even with zero internet; queued reports automatically transmit when connectivity is restored.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0+
- **npm**: v9.0+

### 2. Environment Configuration (`server/.env`)
Create `server/.env` (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=resqnet-production-super-secret-key-2026
CLIENT_URL=http://localhost:5173
DB_PATH=./resqnet.db
```

### 3. Installation & Boot

```bash
# Terminal 1: Backend API & Socket.io Server
cd server
npm install
node server.js

# Terminal 2: Frontend Client (Vite + React)
cd client
npm install
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Regression Testing

Run the automated end-to-end regression test suite:
```bash
cd server
node test_resqnet_e2e.js
```
*Executes 17 comprehensive tests verifying auth, bcrypt hashing, error bubbling, role-based field restrictions, report schemas, shelter capacity updates, and simulation endpoint protection.*

---

## 👥 Demo Responder Accounts

| Role | Username | Password | Default Capabilities |
|------|----------|----------|----------------------|
| **👤 Citizen** | `citizen` | `citizen123` | Submit hazard reports with photos/GPS, mark safe, view alerts, queue reports offline |
| **🤝 Volunteer** | `volunteer` | `volunteer123` | Field triage reports, update shelter occupancy (`+5/-5`), relief log |
| **🛡️ Admin** | `admin` | `admin123` | Issue live broadcasts, run simulation scenarios, override priority |

---

## 🔒 Security & Reliability Implementations

1. **Helmet Security Headers**: Configured across Express endpoints with cross-origin asset allowances.
2. **Rate Limiting**: `/api/auth/login` and `/api/auth/signup` capped at 30 requests per 15-minute window per IP.
3. **Strict Whitelisting**: `POST /reports` validates all categories, severity (1-5), titles, descriptions, and coordinates with explicit 400 Bad Request error messages.
4. **Session Expiry Handlers**: 401 unauthorized responses automatically clear expired tokens and notify the user to log in again.
5. **Architectural Tradeoff Note**: JWT tokens are stored in `localStorage` for prototype simplicity and cross-tab responsiveness with `Authorization: Bearer <token>` headers, coupled with strict expiration and sanitization. In multi-tenant cloud deployments, moving to `httpOnly` `SameSite=Strict` cookies is recommended to prevent XSS exposure.
