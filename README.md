# TCC CRM System

A comprehensive CRM for managing church members, families, events, donations, etc., with Google Sheets integration.

## Features

- **Dashboard**: Overview of key metrics and recent activities
- **Members**: Manage church member profiles and information
- **Families**: Group members into family units
- **Attendance**: Track attendance for events and gatherings
- **Communications**: Send messages and manage communications
- **Donations**: Record and verify financial contributions
- **Volunteers**: Manage volunteer roles and assignments
- **Staff**: Handle staff information and permissions
- **Branches**: Manage different church branches
- **Analytics**: Generate reports and insights
- **Settings**: Configure system preferences

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Google Cloud Service Account with Google Sheets API enabled

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd tcc-crm
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../codes
   npm install
   ```

## Configuration

1. Copy the Google service account credentials file to the backend directory:
   ```
   cp tcc-crm-backend-121789771aad.json backend/credentials.json
   ```

2. Update the backend environment file (`backend/.env`):
   ```
   GOOGLE_SHEET_ID=your_google_sheet_id_here
   ```
   Replace `your_google_sheet_id_here` with the actual ID of your Google Sheet (e.g., `1XCqJk2XBPcPjXFo1nN-h4tWMLLOrAJnajfT63rQ3iDs`).

3. (Optional) Update the frontend environment file (`codes/.env`) if needed:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

## Google Sheets Setup

1. Create a new Google Sheet or use an existing one.

2. Share the Google Sheet with the service account email:
   ```
   tcc-crm-service@tcc-crm-backend.iam.gserviceaccount.com
   ```
   Grant "Editor" access to the service account.

3. Ensure the Google Sheet has the following tabs (sheets) with the specified column structures:

   ### Members
   - MemberID (PK): String, Required, Unique
   - FirstName: String, Required
   - LastName: String, Required
   - PhoneNumber: String, Unique (if provided)
   - Email: String, Unique (if provided)
   - DOB: Date (YYYY-MM-DD format)
   - Gender: String (e.g., Male, Female, Other)
   - Address: String
   - FamilyID (FK): String -> Families.FamilyID
   - MemberStatus: String, Required (e.g., Active, Inactive, Child, Guest)
   - (Custom Fields): Varies

   ### Families
   - FamilyID (PK): String, Required, Unique
   - FamilyName: String, Required

   ### Groups
   - GroupID (PK): String, Required, Unique
   - GroupName: String, Required
   - GroupType: String, Required (e.g., Department, Fellowship, Cell)
   - LeaderMemberID (FK): String -> Members.MemberID

   ### GroupMembers
   - GroupMemberID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID
   - GroupID (FK): String -> Groups.GroupID

   ### Events
   - EventID (PK): String, Required, Unique
   - EventName: String, Required
   - EventType: String, Required (e.g., Weekly Service, Annual Program)

   ### Gatherings
   - GatheringID (PK): String, Required, Unique
   - GatheringName: String, Required
   - GatheringType: String, Required (EVENT or GROUP)
   - ParentID (FK): String, Required (ID from Events or Groups)
   - GatheringDate: DateTime, Required

   ### Attendance
   - AttendanceID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID
   - GatheringID (FK): String -> Gatherings.GatheringID

   ### Donations
   - DonationID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID (can be blank for guests)
   - Amount: Number, Required
   - DonationDate: Date, Required
   - Fund: String, Required (e.g., Tithe, Building Fund)
   - Notes: String

   ### VolunteerRoles
   - RoleID (PK): String, Required, Unique
   - RoleName: String, Required, Unique
   - Description: String

   ### VolunteerAssignments
   - AssignmentID (PK): String, Required, Unique
   - MemberID (FK): String -> Members.MemberID
   - GatheringID (FK): String -> Gatherings.GatheringID
   - RoleID (FK): String -> VolunteerRoles.RoleID
   - AssignmentStatus: String, Required (e.g., Confirmed, Served, Cancelled)

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

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
   The backend will run on http://localhost:3001

2. Start the frontend development server:
   ```
   cd codes
   npm run dev
   ```
   The frontend will run on http://localhost:8080

3. Open your browser and navigate to http://localhost:8080

## API Documentation

The backend provides the following API endpoints:

### Health Check
- `GET /api/health` - Check if the backend is running

### Members
- `GET /api/members` - Get all members (with pagination and search)
- `GET /api/members/:id` - Get a specific member
- `POST /api/members` - Create a new member
- `PATCH /api/members/:id` - Update a member

### Families
- `GET /api/families` - Get all families
- `GET /api/families/:id` - Get a specific family
- `POST /api/families` - Create a new family

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id/attendance` - Get attendance for a specific event
- `POST /api/events/:id/checkin` - Check in a member for an event
- `POST /api/events/:id/finish` - Mark an event as finished

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance` - Create a new attendance record

### Communications
- `POST /api/communications/send` - Send a message
- `POST /api/communications/schedule` - Schedule a message

### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations/:id/verify` - Verify a donation
- `PATCH /api/donations/:id` - Update a donation

### Volunteers
- `GET /api/volunteers` - Get all volunteers
- `POST /api/volunteers/assign` - Assign a volunteer

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id/permissions` - Get permissions for a staff member
- `PATCH /api/staff/:id/permissions` - Update staff permissions

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id/members` - Get members for a specific branch

### Settings
- `GET /api/settings` - Get system settings
- `PATCH /api/settings` - Update system settings

### Analytics
- `GET /api/analytics/attendance-summary` - Get attendance summary
- `GET /api/analytics/donations-summary` - Get donations summary

### Schema
- `GET /api/schema/members` - Get members schema

### Guests
- `GET /api/guests/:id/convert` - Check if guest can be converted
- `POST /api/guests/:id/convert` - Convert guest to member

## Testing

1. **CRUD Operations Testing:**
   - Use tools like Postman or curl to test API endpoints
   - Create, read, update, and delete records for members, families, etc.
   - Verify that changes are reflected in the Google Sheet

2. **Sheets Sync Verification:**
   - After performing operations via the API, check the Google Sheet to ensure data is updated correctly
   - Test with different data types and edge cases

3. **Frontend Testing:**
   - Navigate through different pages in the application
   - Test form submissions and data display
   - Verify that API calls are working correctly

## Deployment

1. **Backend Deployment:**
   - Deploy the backend to a server (e.g., Heroku, AWS, DigitalOcean)
   - Ensure environment variables are set correctly
   - Update CORS settings for production domain

2. **Frontend Deployment:**
   - Build the frontend: `npm run build`
   - Deploy the `dist` folder to a static hosting service (e.g., Netlify, Vercel, GitHub Pages)

3. **Google Sheets Access:**
   - Ensure the service account has access to the production Google Sheet
   - Update the GOOGLE_SHEET_ID in production environment

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

- **Backend not starting:** Check if port 3001 is available and credentials.json is in the backend directory
- **Google Sheets not updating:** Verify that the service account email has editor access to the sheet and the sheet ID is correct
- **Frontend not loading:** Ensure the backend is running and the API_BASE_URL is set correctly
- **CORS errors:** Update the CORS configuration in the backend for your frontend domain
- **Authentication issues:** Double-check the credentials.json file and ensure the Google Cloud project has Sheets API enabled