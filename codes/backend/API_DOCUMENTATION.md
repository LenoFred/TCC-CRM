# TCC-CRM Backend API - CRUD Endpoints Documentation

## Overview
Complete RESTful API with authentication, authorization, and comprehensive CRUD operations for all entities in the TCC-CRM system.

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
All endpoints (except `/health` and `/api`) require JWT authentication via:
- **Authorization Header**: `Bearer <access_token>`
- **Refresh Token**: httpOnly cookie

### Auth Endpoints
```
POST   /api/auth/login          - Login and get tokens
POST   /api/auth/logout         - Logout and clear tokens
POST   /api/auth/refresh        - Refresh access token
GET    /api/auth/me             - Get current user info
GET    /api/auth/validate       - Validate token
POST   /api/auth/change-password - Change password
POST   /api/auth/register       - Register new staff (Admin only)
```

## Entities and Endpoints

### 1. Members (`/api/members`)
**Permissions**: `can_view_members`, `can_add_members`, `can_edit_members`, `can_delete_members`

```
GET    /api/members/stats            - Get member statistics
GET    /api/members/family/:familyId - Get members by family
GET    /api/members                  - Get all members (paginated, searchable)
GET    /api/members/:id              - Get single member
GET    /api/members/:id/family       - Get member with family details
POST   /api/members                  - Create new member
PATCH  /api/members/:id              - Update member
DELETE /api/members/:id              - Delete member
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in firstName, lastName, email, phone, memberStatus
- `status`, `familyId`, `gender` - Filters

**ID Format**: `MEM-YYYYMMDD-XXXXX`

---

### 2. Families (`/api/families`)
**Permissions**: `can_view_families`, `can_add_families`, `can_edit_families`, `can_delete_families`

```
GET    /api/families/stats              - Get family statistics
GET    /api/families                    - Get all families (optionally with members)
GET    /api/families/:id                - Get single family with members
POST   /api/families                    - Create new family
POST   /api/families/:id/members        - Add member to family
PATCH  /api/families/:id                - Update family
DELETE /api/families/:id/members/:memberId - Remove member from family
DELETE /api/families/:id                - Delete family
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in familyName
- `includeMembers=true` - Include family members in response

**ID Format**: `FAM-YYYYMMDD-XXXXX`

---

### 3. Groups (`/api/groups`)
**Permissions**: `can_view_groups`, `can_add_groups`, `can_edit_groups`, `can_delete_groups`

```
GET    /api/groups/stats              - Get group statistics
GET    /api/groups/leader/:leaderID   - Get groups by leader
GET    /api/groups                    - Get all groups
GET    /api/groups/:id                - Get single group
GET    /api/groups/:id/members        - Get group with members
POST   /api/groups                    - Create new group
PATCH  /api/groups/:id                - Update group
DELETE /api/groups/:id                - Delete group
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in groupName, groupType, description
- `type`, `status`, `leaderID` - Filters

**ID Format**: `GRP-YYYYMMDD-XXXXX`

---

### 4. Group Members (`/api/group-members`)
**Permissions**: `can_view_groups`, `can_edit_groups`

```
GET    /api/group-members/group/:groupID   - Get members of a group
GET    /api/group-members/member/:memberID - Get groups of a member
GET    /api/group-members                  - Get all group memberships
GET    /api/group-members/:id              - Get single membership
POST   /api/group-members                  - Add member to group
PATCH  /api/group-members/:id              - Update membership
DELETE /api/group-members/:id              - Remove member from group
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `groupID`, `memberID`, `role`, `status` - Filters

**ID Format**: `GRM-YYYYMMDD-XXXXX`

---

### 5. Events (`/api/events`)
**Permissions**: `can_view_events`, `can_add_events`, `can_edit_events`, `can_delete_events`

```
GET    /api/events/stats              - Get event statistics
GET    /api/events/upcoming           - Get upcoming events
GET    /api/events/past               - Get past events
GET    /api/events/date-range         - Get events by date range
GET    /api/events                    - Get all events
GET    /api/events/:id                - Get single event
POST   /api/events                    - Create new event
PATCH  /api/events/:id                - Update event
DELETE /api/events/:id                - Delete event
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in eventName, eventType, description, location
- `type`, `status`, `organizer` - Filters
- `startDate`, `endDate` - Date range filters

**ID Format**: `EVT-YYYYMMDD-XXXXX`

---

### 6. Gatherings (`/api/gatherings`)
**Permissions**: `can_view_attendance`, `can_add_attendance`, `can_edit_attendance`, `can_delete_attendance`

```
GET    /api/gatherings/stats              - Get gathering statistics
GET    /api/gatherings/event/:eventID     - Get gatherings by event
GET    /api/gatherings                    - Get all gatherings
GET    /api/gatherings/:id                - Get single gathering
POST   /api/gatherings                    - Create new gathering
PATCH  /api/gatherings/:id/attendance     - Update attendance count
PATCH  /api/gatherings/:id                - Update gathering
DELETE /api/gatherings/:id                - Delete gathering
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in gatheringName, gatheringType, location
- `type`, `status`, `eventID` - Filters
- `startDate`, `endDate` - Date range filters

**ID Format**: `GATH-YYYYMMDD-XXXXX`

---

### 7. Attendance (`/api/attendance`)
**Permissions**: `can_view_attendance`, `can_add_attendance`, `can_edit_attendance`, `can_delete_attendance`

```
GET    /api/attendance/stats                    - Get attendance statistics
GET    /api/attendance/gathering/:gatheringID   - Get attendance for gathering
GET    /api/attendance/member/:memberID         - Get attendance for member
GET    /api/attendance                          - Get all attendance records
GET    /api/attendance/:id                      - Get single attendance record
POST   /api/attendance/check-in                 - Check-in member
POST   /api/attendance                          - Create attendance record
PATCH  /api/attendance/:id/check-out            - Check-out member
PATCH  /api/attendance/:id                      - Update attendance record
DELETE /api/attendance/:id                      - Delete attendance record
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `gatheringID`, `memberID`, `status`, `checkInMethod` - Filters
- `startDate`, `endDate` - Date range filters for stats

**ID Format**: `ATT-YYYYMMDD-XXXXX`

---

### 8. Donations (`/api/donations`)
**Permissions**: `can_view_donations`, `can_add_donations`, `can_edit_donations`, `can_delete_donations`, `can_verify_donations`

```
GET    /api/donations/stats              - Get donation statistics
GET    /api/donations/member/:memberID   - Get donations by member
GET    /api/donations                    - Get all donations
GET    /api/donations/:id                - Get single donation
POST   /api/donations                    - Create new donation
PATCH  /api/donations/:id/verify         - Verify donation
PATCH  /api/donations/:id                - Update donation
DELETE /api/donations/:id                - Delete donation
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in donationType, paymentMethod, category
- `memberID`, `type`, `category`, `status`, `paymentMethod` - Filters
- `startDate`, `endDate` - Date range filters
- `minAmount`, `maxAmount` - Amount range filters

**ID Format**: `DON-YYYYMMDD-XXXXX`

---

### 9. Volunteer Roles (`/api/volunteer-roles`)
**Permissions**: `can_view_volunteers`, `can_manage_volunteers`

```
GET    /api/volunteer-roles/stats                  - Get role statistics
GET    /api/volunteer-roles/department/:department - Get roles by department
GET    /api/volunteer-roles                        - Get all roles
GET    /api/volunteer-roles/:id                    - Get single role
POST   /api/volunteer-roles                        - Create new role
PATCH  /api/volunteer-roles/:id                    - Update role
DELETE /api/volunteer-roles/:id                    - Delete role
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in roleName, department, description
- `department`, `status` - Filters

**ID Format**: `VRL-YYYYMMDD-XXXXX`

---

### 10. Volunteer Assignments (`/api/volunteer-assignments`)
**Permissions**: `can_view_volunteers`, `can_manage_volunteers`

```
GET    /api/volunteer-assignments/stats            - Get assignment statistics
GET    /api/volunteer-assignments/member/:memberID - Get assignments by member
GET    /api/volunteer-assignments/role/:roleID     - Get assignments by role
GET    /api/volunteer-assignments                  - Get all assignments
GET    /api/volunteer-assignments/:id              - Get single assignment
POST   /api/volunteer-assignments                  - Create new assignment
PATCH  /api/volunteer-assignments/:id/complete     - Complete assignment
PATCH  /api/volunteer-assignments/:id              - Update assignment
DELETE /api/volunteer-assignments/:id              - Delete assignment
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `memberID`, `roleID`, `status`, `frequency` - Filters

**ID Format**: `VAS-YYYYMMDD-XXXXX`

---

### 11. Support Requests (`/api/support-requests`)
**Permissions**: `can_view_support_requests`, `can_create_support_requests`, `can_manage_support_requests`, `can_delete_support_requests`

```
GET    /api/support-requests/stats              - Get request statistics
GET    /api/support-requests/member/:memberID   - Get requests by member
GET    /api/support-requests/assigned/:staffID  - Get requests assigned to staff
GET    /api/support-requests                    - Get all requests
GET    /api/support-requests/:id                - Get single request
POST   /api/support-requests                    - Create new request
PATCH  /api/support-requests/:id/assign         - Assign request to staff
PATCH  /api/support-requests/:id/resolve        - Resolve request
PATCH  /api/support-requests/:id                - Update request
DELETE /api/support-requests/:id                - Delete request
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in requestType, priority, status, category
- `memberID`, `type`, `category`, `priority`, `status`, `assignedTo` - Filters

**ID Format**: `SUP-YYYYMMDD-XXXXX`

---

### 12. Staff (`/api/staff`)
**Permissions**: Admin role required for all endpoints

```
GET    /api/staff/stats                    - Get staff statistics
GET    /api/staff/role/:role               - Get staff by role
GET    /api/staff/department/:department   - Get staff by department
GET    /api/staff                          - Get all staff
GET    /api/staff/:id                      - Get single staff
POST   /api/staff                          - Create staff (use /auth/register)
PATCH  /api/staff/:id/status               - Update staff status
PATCH  /api/staff/:id                      - Update staff
DELETE /api/staff/:id                      - Delete staff
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in email, role, department
- `role`, `department`, `status` - Filters

**ID Format**: `STF-YYYYMMDD-XXXXX`

**Note**: Password hashes are automatically excluded from all responses.

---

### 13. Communications (`/api/communications`)
**Permissions**: `can_view_communications`, `can_send_communications`, `can_manage_communications`, `can_delete_communications`

```
GET    /api/communications/stats                  - Get communication statistics
GET    /api/communications/recipient/:recipientID - Get communications by recipient
GET    /api/communications                        - Get all communications
GET    /api/communications/:id                    - Get single communication
POST   /api/communications/bulk                   - Send bulk message
POST   /api/communications                        - Send new communication
PATCH  /api/communications/:id/status             - Update communication status
PATCH  /api/communications/:id                    - Update communication
DELETE /api/communications/:id                    - Delete communication
```

**Query Parameters**:
- `page`, `limit` - Pagination
- `search` - Search in messageType, status, subject
- `recipientID`, `recipientType`, `messageType`, `status`, `sentBy` - Filters
- `startDate`, `endDate` - Date range filters

**ID Format**: `COM-YYYYMMDD-XXXXX`

---

## Common Response Formats

### Success Response (List)
```json
{
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3,
  "data": [...]
}
```

### Success Response (Single)
```json
{
  "memberID": "MEM-20250101-A7B3C",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "stack": "..." // Only in development
}
```

## Common Query Parameters

All list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)
- `search` - Search term (searches entity-specific fields)

## Permission Matrix

| Entity | View | Add | Edit | Delete | Special |
|--------|------|-----|------|--------|---------|
| Members | can_view_members | can_add_members | can_edit_members | can_delete_members | - |
| Families | can_view_families | can_add_families | can_edit_families | can_delete_families | - |
| Groups | can_view_groups | can_add_groups | can_edit_groups | can_delete_groups | - |
| Events | can_view_events | can_add_events | can_edit_events | can_delete_events | - |
| Attendance | can_view_attendance | can_add_attendance | can_edit_attendance | can_delete_attendance | - |
| Donations | can_view_donations | can_add_donations | can_edit_donations | can_delete_donations | can_verify_donations |
| Volunteers | can_view_volunteers | can_manage_volunteers | can_manage_volunteers | can_manage_volunteers | - |
| Support | can_view_support_requests | can_create_support_requests | can_manage_support_requests | can_delete_support_requests | - |
| Staff | Admin role | Admin role | Admin role | Admin role | - |
| Communications | can_view_communications | can_send_communications | can_manage_communications | can_delete_communications | - |

## Statistics Endpoints

All `/stats` endpoints return aggregated data:
- Total counts
- Status distributions
- Type/category distributions
- Trend data (where applicable)
- Additional entity-specific metrics

Example:
```json
{
  "totalMembers": 500,
  "activeMembers": 450,
  "inactiveMembers": 50,
  "genderDistribution": {
    "Male": 250,
    "Female": 240,
    "Other": 10
  },
  "avgAge": 35
}
```

## Rate Limiting
- **Rate**: 100 requests per 15 minutes per IP
- **Scope**: All `/api/*` endpoints
- **Headers**: 
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## CORS
- **Allowed Origins**: Configured via `CORS_ORIGIN` environment variable
- **Credentials**: Enabled (for cookies)
- **Methods**: GET, POST, PATCH, DELETE, OPTIONS

## Health Check
```
GET /health
```
Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development",
  "uptime": 1234.56
}
```

## Error Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Audit Logging
All create, update, and delete operations are automatically logged with:
- User who performed the action
- Timestamp
- Entity type and ID
- Action performed
- IP address (if available)

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs

## Next Steps
1. Implement actual SMS/Email/WhatsApp integration
2. Add Analytics endpoints for reporting
3. Implement real-time notifications via WebSocket
4. Add data export endpoints (CSV, PDF)
5. Implement file upload for profile pictures
6. Add batch operations for bulk updates
