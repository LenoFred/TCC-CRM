/**
 * Central Configuration Management
 * Loads and validates all environment variables
 */
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },

  // Google Sheets Configuration
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json',
  },

  // JWT Configuration
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      // In production, JWT_SECRET MUST be set
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error('CRITICAL: JWT_SECRET environment variable is required in production!');
      }
      // In development, warn if using default (but allow it)
      if (!secret) {
        console.warn('⚠️  WARNING: JWT_SECRET not set. Using development default. This is insecure for production!');
        return 'dev-default-secret-change-in-production';
      }
      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimit: {
      // In development: 500 requests per 15 minutes (~ 33 req/min, more forgiving for dev)
      // In production: 1500 requests per 15 minutes (~ 100 req/min, secure for production)
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      maxRequests: process.env.NODE_ENV === 'production' 
        ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1500)
        : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000), // More forgiving in development
    },
  },

  // CORS Configuration
  cors: {
    origin: (() => {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(process.env.CORS_ORIGIN || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // If not valid JSON, treat as single origin string
      }
      return process.env.CORS_ORIGIN || 'http://localhost:5173';
    })(),
    credentials: true,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3, // 3 seconds - immediate refresh for development
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 5, // 5 seconds check period
  },

  // Communications Configuration
  communications: {
    // Meta WhatsApp Cloud API
    whatsapp: {
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN || '',
      businessAccountId: process.env.WHATSAPP_META_BUSINESS_ACCOUNT_ID || '',
    },
    // SendGrid for promotional emails
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
      fromName: process.env.SENDGRID_FROM_NAME || 'The Covenant Church',
      templates: {
        newsletter: process.env.SENDGRID_TEMPLATE_NEWSLETTER || '',
        event: process.env.SENDGRID_TEMPLATE_EVENT || '',
        announcement: process.env.SENDGRID_TEMPLATE_ANNOUNCEMENT || '',
      },
    },
    // Gmail SMTP for automated emails
    gmail: {
      user: process.env.GMAIL_SMTP_USER || '',
      appPassword: process.env.GMAIL_SMTP_APP_PASSWORD || '',
      fromName: process.env.GMAIL_SMTP_FROM_NAME || 'The Covenant Church',
    },
    // BulkSMS Nigeria for SMS
    bulksms: {
      apiToken: process.env.BULKSMS_NIGERIA_API_TOKEN || '',
      senderName: process.env.BULKSMS_NIGERIA_SENDER_NAME || 'TCC',
      dndEnabled: process.env.BULKSMS_NIGERIA_DND_ENABLED === 'true',
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

/**
 * Validates required environment variables
 */
const validateConfig = () => {
  const required = [
    'GOOGLE_SHEET_ID',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    
    if (config.server.isProduction) {
      throw new Error('Cannot start server: missing required environment variables');
    } else {
      console.warn('⚠️  Running in development mode with incomplete configuration');
    }
  }
};

// Validate configuration on load
validateConfig();

module.exports = config;
