require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./src/routes/authRoutes');
const disasterRoutes = require('./src/routes/disasterRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const resourceRoutes = require('./src/routes/resourceRoutes');
const mapRoutes = require('./src/routes/mapRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const simulationRoutes = require('./src/routes/simulationRoutes');
const SimulationEngine = require('./src/services/simulationEngine');
const store = require('./src/data/store');

const app = express();
const server = http.createServer(app);

// CORS Allowlist
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
  .split(',')
  .map(url => url.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or requests without origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly fallback
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Security & Body parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploaded report images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Simulation Engine & Attach to Locals
const simulationEngine = new SimulationEngine(io);
app.locals.simulationEngine = simulationEngine;
app.locals.io = io;

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: 'sqlite3-active',
    activeConnections: io.engine.clientsCount
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/simulation', simulationRoutes);

// Socket.io connection logic
io.on('connection', (socket) => {
  // Emit current disaster state to newly connected client
  try {
    socket.emit('initial_state', {
      zones: store.getAll('zones'),
      alerts: store.getAll('alerts').filter(a => a.isActive),
      recentReports: store.getAll('reports').slice(-5)
    });
  } catch (err) {
    console.error('Error emitting initial socket state:', err);
  }

  socket.on('disconnect', () => {
    // disconnected
  });
});

// 404 Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ResQNet Server running on port ${PORT} [Environment: ${process.env.NODE_ENV || 'development'}]`);
  console.log(`Live API URL: http://localhost:${PORT}`);
});
