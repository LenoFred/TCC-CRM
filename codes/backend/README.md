# TCC CRM Backend

Backend API for TCC Church CRM system with Google Sheets database integration.

## Features

- JWT authentication with refresh tokens
- Role-based access control with granular permissions
- Google Sheets API integration for data storage
- In-memory caching layer for performance
- Automatic retry logic for failed operations
- Structured logging with Winston
- Input validation using Zod schemas
- Rate limiting for API protection
- Security hardening with Helmet.js, CORS, and secure cookies

## Prerequisites

- Node.js 18 or higher
- npm package manager
- Google Cloud Service Account with Sheets API enabled
- Google Sheet configured as database

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Add Google Service Account credentials:
```bash
cp /path/to/credentials.json ./credentials.json
```

## Configuration

### Required Environment Variables

- `GOOGLE_SHEET_ID` - Google Sheet ID for database
- `JWT_SECRET` - Secure random string for JWT signing
- `CORS_ORIGIN` - Frontend URL for CORS

### Optional Variables

- `TWILIO_ACCOUNT_SID` - SMS/WhatsApp integration
- `EMAIL_USER` - Email notification service

See `.env.example` for complete configuration options.

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on http://localhost:3001 by default.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/change-password` - Change user password
- `POST /api/auth/register` - Register new staff member (admin only)

### Health Check
- `GET /health` - Server health status
- `GET /api` - API information

See main project README for complete endpoint documentation.

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/    # Request handlers
│   │   └── routes/         # Route definitions
│   ├── services/           # Business logic
│   │   ├── authService.js
│   │   └── sheetsService.js
│   ├── middlewares/        # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/              # Utilities
│   │   ├── idGenerator.js
│   │   ├── validation.js
│   │   ├── helpers.js
│   │   └── logger.js
│   ├── config/             # Configuration
│   │   └── index.js
│   └── index.js            # Entry point
├── tests/                  # Test files
├── logs/                   # Log files
├── credentials.json        # Google service account credentials
├── package.json
└── .env                    # Environment variables
```
│   │   └── logger.js
│   ├── config/             # Configuration
│   │   └── index.js
│   └── index.js            # Entry point
├── tests/                  # Test files
├── logs/                   # Log files
├── old_code/              # Archived old code
├── package.json
└── .env.example

```

## Authentication Flow

1. User submits email and password
2. System verifies password against hashed value in Staff sheet
3. Generate JWT access token (24h expiry) and refresh token (7d expiry)
4. Store access token in localStorage, refresh token in httpOnly cookie
5. Middleware validates token on each protected route request
6. Use refresh endpoint to obtain new access token before expiration

## Permission System

Permissions are defined in the `StaffPermissions` sheet with boolean flags:

- `can_view_members` - View member data
- `can_add_members` - Add new members
- `can_edit_members` - Edit member information
- `can_delete_members` - Delete member records
- `can_manage_staff` - Manage staff accounts and permissions
- `can_view_donations` - View donation records
- `can_verify_donations` - Verify and approve donations

### Permission Middleware Usage

```javascript
// Require specific permission
router.post('/members', 
  authenticate, 
  requirePermission('can_add_members'),
  controller.create
);

// Require any of multiple permissions
router.get('/analytics',
  authenticate,
  requireAnyPermission(['can_view_analytics', 'admin']),
  controller.getAnalytics
);
```

## Logging

Winston logger writes to:
- `logs/error.log` - Error level messages only
- `logs/combined.log` - All log levels
- Console output in development mode

## Security Features

- Bcrypt password hashing with 12 salt rounds
- JWT tokens with automatic expiration
- Helmet.js for security headers
- Rate limiting: 100 requests per 15 minutes per IP
- CORS restricted to configured frontend origin
- Zod schema validation for all inputs
- HttpOnly cookies for refresh tokens (not accessible via JavaScript)

## Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

With coverage:
```bash
npm test -- --coverage
```

## Troubleshooting

**Google Sheets API Errors:**
- Verify credentials.json exists in backend directory
- Ensure service account has Editor access to the sheet
- Confirm Sheet ID in .env matches your Google Sheet

**Authentication Issues:**
- Check JWT_SECRET is set in environment
- Verify Staff sheet has PasswordHash column
- Ensure passwords are properly hashed (use register endpoint)

**CORS Errors:**
- Confirm CORS_ORIGIN exactly matches frontend URL (including protocol and port)
- Include `credentials: true` in frontend fetch/axios requests

## Development Guidelines

1. Always use asyncHandler wrapper for async route handlers
2. Validate all inputs with Zod schemas via validation middleware
3. Log important events and errors using logger utilities
4. Throw ApiError for known error conditions
5. Invalidate cache after write operations to maintain consistency
6. Document new endpoints in project README

## License

Proprietary - TCC Church
