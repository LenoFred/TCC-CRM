# TCC CRM System

Church relationship management system with Google Sheets integration for member management, attendance tracking, donations, and communications.

## Features

- Member and family management with custom fields
- Event and attendance tracking with digital check-in
- Donation recording and verification workflow
- Guest registration and conversion tracking
- Volunteer role management and scheduling
- Staff permissions and access control
- Multi-branch support
- Communications hub (SMS, Email, WhatsApp)
- Analytics and reporting
- Progressive Web App with offline support

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- Service Worker for offline support

### Backend
- Node.js with Express
- Google Sheets API for data storage
- JWT authentication
- Winston logging
- Zod validation

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Google Cloud Service Account with Sheets API enabled
- Google Sheet configured as database

## Quick Start

1. Clone repository:
   ```bash
   git clone https://github.com/LenoFred/TCC-CRM.git
   cd TCC-CRM/Codebase
   ```

2. Install dependencies:
   ```bash
   # Backend
   cd codes/backend
   npm install
   
   # Frontend
   cd ../
   npm install
   ```

3. Configure environment:
   ```bash
   # Backend
   cd codes/backend
   cp .env.example .env
   # Edit .env with your Google Sheet ID and credentials
   
   # Frontend (optional)
   cd ../
   echo "VITE_API_BASE_URL=http://localhost:3001" > .env
   ```

4. Add Google service account credentials:
   ```bash
   # Place credentials.json in codes/backend/
   cp /path/to/credentials.json codes/backend/credentials.json
   ```

5. Start servers:
   ```bash
   # Terminal 1 - Backend
   cd codes/backend
   npm start
   
   # Terminal 2 - Frontend
   cd codes
   npm run dev
   ```

6. Access application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Google Sheets Setup

Create a Google Sheet and share it with your service account email (found in credentials.json). Grant "Editor" access.

### Required Sheet Tabs

Create tabs with these exact column headers:

Members:
MemberID, FirstName, LastName, PhoneNumber, Email, DOB, Gender, State, LGA, Address, FamilyID, Status, JoinDate, MemberType, EmergencyContact, FamilyRole

Families:
FamilyID, FamilyName, CreatedDate

Groups:
GroupID, GroupName, GroupType, LeaderMemberID, Status, MeetingLocation, Description

GroupMembers:
GroupMemberID, MemberID, GroupID, Status

Gatherings:
GatheringID, GatheringName, GatheringType, ParentID, GatheringDate, GatheringTime

Attendance:
AttendanceID, MemberID, GatheringID

Donations:
DonationID, MemberID, Amount, DonationDate, Fund, PayDate, Status

Guest
GuestID, Name, Phone, Email																					

VolunteerRoles:
RoleID, RoleName, Description

VolunteerAssignments:
AssignmentID, MemberID, GroupID, RoleID, AssignmentStatus, AssignmentDate

SupportRequests:
RequestID, MemberID, RequestorName, RequestorContact, RequestCategory, RequestDetails, RequestStatus, AssignedTo

Staff:
StaffID, MemberID, JobTitle, AppointmentDate, SalaryInfo

StaffPermissions:
PermissionID, StaffMemberID, PermissionKey, HasAccess

Logs:This sheet will record creation and update timestamps for every record in all other sheets using their Primary Key as the reference.
LogID — (Primary Key) Unique ID for each log entry.
TableName — (String, Required) The name of the table/sheet where the record belongs (e.g., “Members”, “Families”).
RecordID — (String, Required) The unique identifier of the record in that table (the corresponding Primary Key, e.g., “MemberID”, “FamilyID”).
CreatedAt — (DateTime) The date and time the record was created.
UpdatedAt — (DateTime) The date and time the record was last updated.

   ### VolunteerAssignments
   - AssignmentID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID
   - GroupID (FK): String -> Gatherings.GatheringID
   - RoleID (FK): String -> VolunteerRoles.RoleID
   - AssignmentStatus: String, Required (e.g., Confirmed, Cancelled)
   - AssignmentDate

   ### SupportRequests
   - RequestID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID (if known)
   - RequestorName: String, Required
   - RequestorContact: String, Required
   - RequestCategory: String, Required (e.g., Prayer, Assistance, General)
   - RequestDetails: String, Required
   - RequestStatus: String, Required (e.g., New, In Progress, Resolved)
   - AssignedTo (FK): String -> Members.MemberID

   ### Staff
   - StaffID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID
   - JobTitle: String, Required
   - AppointmentDate: Date, Required
   - SalaryInfo: String (Encrypted)

   ### StaffPermissions
   - PermissionID (PK): String, Required, Unique
   - StaffMemberID (FK): String -> Members.MemberID
   - PermissionKey: String, Required (e.g., can_view_donations)
   - HasAccess: Boolean, Required

## Running the Application

## Running the Application

Start backend and frontend servers in separate terminals:

```bash
# Terminal 1 - Backend (http://localhost:3001)
cd codes/backend
npm start

# Terminal 2 - Frontend (http://localhost:5173)
cd codes
npm run dev
```

Access the application at http://localhost:5173

## API Endpoints

### Health Check
- `GET /api/health` - Server status check

### Members
- `GET /api/members` - List all members (supports pagination and search)
- `GET /api/members/:id` - Get member details
- `POST /api/members` - Create member
- `PATCH /api/members/:id` - Update member

### Families
- `GET /api/families` - List all families
- `GET /api/families/:id` - Get family details
- `POST /api/families` - Create family

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id/attendance` - Get event attendance
- `POST /api/events/:id/checkin` - Check in member
- `POST /api/events/:id/finish` - Mark event complete

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Record attendance

### Communications
- `POST /api/communications/send` - Send message immediately
- `POST /api/communications/schedule` - Schedule message

### Donations
- `GET /api/donations` - List donations
- `POST /api/donations/:id/verify` - Verify donation
- `PATCH /api/donations/:id` - Update donation

### Volunteers
- `GET /api/volunteers` - List volunteers
- `POST /api/volunteers/assign` - Assign volunteer to role

### Staff
- `GET /api/staff` - List staff members
- `GET /api/staff/:id/permissions` - Get staff permissions
- `PATCH /api/staff/:id/permissions` - Update permissions

### Branches
- `GET /api/branches` - List all branches
- `GET /api/branches/:id/members` - Get branch members

### Settings
- `GET /api/settings` - Get system configuration
- `PATCH /api/settings` - Update settings

### Analytics
- `GET /api/analytics/attendance-summary` - Attendance metrics
- `GET /api/analytics/donations-summary` - Donation metrics

### Schema
- `GET /api/schema/members` - Get member field schema

### Guests
- `GET /api/guests/:id/convert` - Check conversion eligibility
- `POST /api/guests/:id/convert` - Convert guest to member

## Testing

Test API endpoints using Postman or curl. Verify operations:
- Create, read, update, delete records across all modules
- Check Google Sheets reflects changes correctly
- Test pagination, search, and filtering
- Validate error handling and edge cases

Frontend testing:
- Navigate all pages and features
- Submit forms and verify data persistence
- Test offline mode and PWA functionality
- Verify responsive design across devices

## Deployment

**Backend:**
1. Deploy to hosting service (Heroku, AWS, DigitalOcean, Azure)
2. Set environment variables (GOOGLE_SHEET_ID, credentials)
3. Configure CORS for production domain
4. Ensure service account has sheet access

**Frontend:**
1. Build production bundle: `npm run build`
2. Deploy dist folder to static host (Netlify, Vercel, GitHub Pages)
3. Update VITE_API_BASE_URL to production backend URL
4. Configure PWA settings for production

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature/your-feature`
5. Open pull request

## Troubleshooting

**Backend issues:**
- Port 3001 already in use: Change PORT in .env
- Credentials error: Verify credentials.json exists and is valid
- Google Sheets not updating: Check service account has Editor access and correct sheet ID

**Frontend issues:**
- Cannot connect to API: Verify backend is running and VITE_API_BASE_URL is correct
- CORS errors: Update backend CORS configuration with frontend URL
- Build fails: Clear node_modules and reinstall dependencies

**Google Sheets issues:**
- Permission denied: Share sheet with service account email from credentials.json
- API not enabled: Enable Google Sheets API in Cloud Console project
- Rate limits: Implement caching and reduce API calls