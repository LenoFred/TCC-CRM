/**
 * TCC-CRM Backend Application
 * Main entry point for the Express server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./api/routes/auth');
const membersRoutes = require('./api/routes/members');
const familiesRoutes = require('./api/routes/families');
const groupsRoutes = require('./api/routes/groups');
const groupMembersRoutes = require('./api/routes/groupMembers');
const gatheringsRoutes = require('./api/routes/gatherings');
const attendanceRoutes = require('./api/routes/attendance');
const donationsRoutes = require('./api/routes/donations');
const volunteersRoutes = require('./api/routes/volunteers');
const volunteerRolesRoutes = require('./api/routes/volunteerRoles');
const volunteerAssignmentsRoutes = require('./api/routes/volunteerAssignments');
const supportRequestsRoutes = require('./api/routes/supportRequests');
const staffRoutes = require('./api/routes/staff');
const staffPermissionsRoutes = require('./api/routes/staffPermissions');
const communicationsRoutes = require('./api/routes/communications');
const templatesRoutes = require('./api/routes/templates'); // NEW: Template-based messaging
const formsRoutes = require('./api/routes/forms'); // NEW: Form ingestion endpoints
const businessLogicRoutes = require('./api/routes/businessLogic');
const analyticsRoutes = require('./api/routes/analytics');
const settingsRoutes = require('./api/routes/settings'); // NEW: Settings and integrations

// Create Express app
const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: config.server.isProduction,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration with detailed logging
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = Array.isArray(config.cors.origin) 
      ? config.cors.origin 
      : [config.cors.origin];
    
    logger.debug('CORS Request', { origin, allowedOrigins });
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// Body Parsing Middleware
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// Request Logging
// ============================================

// Detailed request/response logging
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    origin: req.get('origin'),
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logger.info('Outgoing Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
    originalSend.call(this, data);
  };
  
  next();
});

app.use(requestLogger);

// ============================================
// Health Check Endpoint
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    uptime: process.uptime(),
  });
});

// API Information
app.get('/api', (req, res) => {
  res.json({
    name: 'TCC-CRM API',
    version: '1.0.0',
    description: 'Church CRM Backend API with Google Sheets integration',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      members: '/api/members',
      families: '/api/families',
      groups: '/api/groups',
      attendance: '/api/attendance',
      donations: '/api/donations',
      volunteers: '/api/volunteers',
      staff: '/api/staff',
      communications: '/api/communications',
      templates: '/api/templates',
      forms: '/api/forms',
      business: '/api/business',
      analytics: '/api/analytics',
    },
  });
});

// ============================================
// API Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/group-members', groupMembersRoutes);
app.use('/api/gatherings', gatheringsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/volunteer-roles', volunteerRolesRoutes);
app.use('/api/volunteer-assignments', volunteerAssignmentsRoutes);
app.use('/api/support-requests', supportRequestsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/staff-permissions', staffPermissionsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/templates', templatesRoutes); // NEW: Template management API
app.use('/api/forms', formsRoutes); // NEW: Form ingestion API
app.use('/api/business', businessLogicRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes); // NEW: Settings and integrations API

// ============================================
// Serve Frontend (Production)
// ============================================

// Note: Frontend is deployed separately on Vercel
// Static file serving disabled for serverless deployment
// if (config.server.isProduction) {
//   const path = require('path');
//   const frontendPath = path.join(__dirname, '../../frontend/build');
//   
//   app.use(express.static(frontendPath));
//   
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'));
//   });
// }

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TCC CRM Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      members: '/api/members',
      documentation: '/api/docs'
    }
  });
});

// Health check endpoint for Vercel/monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    uptime: process.uptime()
  });
});

// ============================================
// Error Handling
// ============================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = config.server.port;

const server = app.listen(PORT, async () => {
  logger.info(`🚀 TCC-CRM Backend started successfully`);
  logger.info(`📡 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.server.env}`);
  logger.info(`📊 Google Sheet ID: ${config.googleSheets.spreadsheetId}`);
  
  if (config.server.isDevelopment) {
    logger.info(`🔗 API Documentation: http://localhost:${PORT}/api`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
  }

  // Initialize Form Ingestion Service
  try {
    const formIngestionService = require('./services/formIngestionService');
    await formIngestionService.initialize();
    formIngestionService.startPolling();
    logger.info('✅ Form Ingestion Service initialized and polling started');
  } catch (error) {
    logger.error('❌ Failed to initialize Form Ingestion Service:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  // Stop form ingestion polling
  try {
    const formIngestionService = require('./services/formIngestionService');
    formIngestionService.stopPolling();
  } catch (error) {
    logger.error('Error stopping form ingestion:', error.message);
  }
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  
  // Stop form ingestion polling
  try {
    const formIngestionService = require('./services/formIngestionService');
    formIngestionService.stopPolling();
  } catch (error) {
    logger.error('Error stopping form ingestion:', error.message);
  }
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = app;
