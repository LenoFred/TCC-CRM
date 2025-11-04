# TCC-CRM Backend

Backend API for TCC Church CRM system with Google Sheets integration.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Role-Based Access Control** - Granular permissions system
- 📊 **Google Sheets Integration** - Using Sheets as database
- ⚡ **Caching Layer** - In-memory caching for performance
- 🔄 **Retry Logic** - Automatic retry for failed operations
- 📝 **Structured Logging** - Winston-based production logging
- ✅ **Input Validation** - Zod schemas for all endpoints
- 🚦 **Rate Limiting** - Protection against abuse
- 🔒 **Security Hardening** - Helmet.js, CORS, secure cookies

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Service Account with Sheets API enabled
- Google Sheet ID for your database

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

3. Place Google Service Account credentials:
```bash
# Copy your credentials.json to the backend directory
cp /path/to/credentials.json ./credentials.json
```

## Configuration

See `.env.example` for all available configuration options.

### Required Environment Variables

- `GOOGLE_SHEET_ID` - Your Google Sheet ID
- `JWT_SECRET` - Secure random string for JWT signing
- `CORS_ORIGIN` - Frontend URL

### Optional Variables

- `TWILIO_ACCOUNT_SID` - For SMS/WhatsApp (placeholder ready)
- `EMAIL_USER` - For email notifications (placeholder ready)

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/register` - Register staff (admin only)

### Health Check
- `GET /health` - Server health status
- `GET /api` - API information

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
├── old_code/              # Archived old code
├── package.json
└── .env.example

```

## Authentication Flow

1. **Login**: User submits email/password
2. **Verification**: Password checked against hashed value in Staff sheet
3. **Token Generation**: JWT access token (24h) + refresh token (7d)
4. **Token Storage**: Access token in localStorage, refresh token in httpOnly cookie
5. **Protected Routes**: Middleware validates token on each request
6. **Token Refresh**: Use refresh endpoint before access token expires

## Permission System

Permissions are stored in the `StaffPermissions` sheet:

- `can_view_members` - View member data
- `can_add_members` - Add new members
- `can_edit_members` - Edit member data
- `can_delete_members` - Delete members
- `can_manage_staff` - Manage staff accounts
- `can_view_donations` - View donation data
- `can_verify_donations` - Verify donations
- etc.

### Using Permissions in Routes

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

Logs are written to:
- `logs/error.log` - Error level logs only
- `logs/combined.log` - All logs
- Console - Development mode

## Security Features

- **Bcrypt Password Hashing** - 12 rounds
- **JWT Tokens** - Signed with secret, auto-expiring
- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS** - Restricted to frontend origin
- **Input Validation** - All inputs validated with Zod
- **HttpOnly Cookies** - Refresh tokens not accessible via JS

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Google Sheets API Errors

1. Verify credentials.json is in the correct location
2. Ensure service account has Editor access to the sheet
3. Check that Sheet ID in .env is correct

### Authentication Issues

1. Verify JWT_SECRET is set
2. Check that Staff sheet has PasswordHash column
3. Ensure passwords are hashed (use register endpoint)

### CORS Errors

1. Verify CORS_ORIGIN matches frontend URL exactly
2. Include credentials: true in frontend requests

## Development Guidelines

1. **Always use asyncHandler** for async route handlers
2. **Use validation middleware** for all input
3. **Log important events** using logger utilities
4. **Handle errors properly** - throw ApiError for known errors
5. **Invalidate cache** after write operations
6. **Document new endpoints** in this README

## Next Steps

- [ ] Add remaining CRUD endpoints
- [ ] Implement communications service
- [ ] Add comprehensive tests
- [ ] Set up CI/CD pipeline
- [ ] Add API documentation (Swagger)

## License

Proprietary - TCC Church

## Support

For issues or questions, contact the development team.
