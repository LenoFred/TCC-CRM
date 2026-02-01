/**
 * Staff Permissions Controller
 * Handles staff permission management
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { logger } = require('../../utils/logger');

class StaffPermissionsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.STAFF_PERMISSIONS, 'StaffPermissions');
  }

  getSearchFields() {
    return ['staffID', 'permissionKey'];
  }

  getDefaultHeaders() {
    return ['PermissionID', 'StaffID', 'PermissionKey', 'HasAccess'];
  }

  getIdColumn() {
    return 'PermissionID';
  }

  /**
   * Get all available system permissions
   */
  getAvailablePermissions() {
    return [
      // Members Management
      { key: 'can_view_members', label: 'View Members', category: 'Members', description: 'Can view member profiles and list' },
      { key: 'can_create_members', label: 'Create Members', category: 'Members', description: 'Can add new members' },
      { key: 'can_edit_members', label: 'Edit Members', category: 'Members', description: 'Can modify member information' },
      { key: 'can_delete_members', label: 'Delete Members', category: 'Members', description: 'Can remove members' },
      
      // Families Management
      { key: 'can_view_families', label: 'View Families', category: 'Families', description: 'Can view family information' },
      { key: 'can_create_families', label: 'Create Families', category: 'Families', description: 'Can create new families' },
      { key: 'can_edit_families', label: 'Edit Families', category: 'Families', description: 'Can modify family information' },
      { key: 'can_delete_families', label: 'Delete Families', category: 'Families', description: 'Can remove families' },
      
      // Groups Management
      { key: 'can_view_groups', label: 'View Groups', category: 'Groups', description: 'Can view groups and memberships' },
      { key: 'can_create_groups', label: 'Create Groups', category: 'Groups', description: 'Can create new groups' },
      { key: 'can_edit_groups', label: 'Edit Groups', category: 'Groups', description: 'Can modify group information' },
      { key: 'can_delete_groups', label: 'Delete Groups', category: 'Groups', description: 'Can remove groups' },
      
      // Gatherings Management
      { key: 'can_view_gatherings', label: 'View Gatherings', category: 'Gatherings', description: 'Can view events and gatherings' },
      { key: 'can_create_gatherings', label: 'Create Gatherings', category: 'Gatherings', description: 'Can create new gatherings' },
      { key: 'can_edit_gatherings', label: 'Edit Gatherings', category: 'Gatherings', description: 'Can modify gathering details' },
      { key: 'can_delete_gatherings', label: 'Delete Gatherings', category: 'Gatherings', description: 'Can remove gatherings' },
      
      // Attendance Management
      { key: 'can_view_attendance', label: 'View Attendance', category: 'Attendance', description: 'Can view attendance records' },
      { key: 'can_take_attendance', label: 'Take Attendance', category: 'Attendance', description: 'Can mark attendance for events' },
      { key: 'can_edit_attendance', label: 'Edit Attendance', category: 'Attendance', description: 'Can modify attendance records' },
      
      // Donations Management
      { key: 'can_view_donations', label: 'View Donations', category: 'Donations', description: 'Can view donation records' },
      { key: 'can_create_donations', label: 'Create Donations', category: 'Donations', description: 'Can record new donations' },
      { key: 'can_verify_donations', label: 'Verify Donations', category: 'Donations', description: 'Can verify and approve donations' },
      { key: 'can_edit_donations', label: 'Edit Donations', category: 'Donations', description: 'Can modify donation information' },
      { key: 'can_delete_donations', label: 'Delete Donations', category: 'Donations', description: 'Can remove donation records' },
      
      // Guests Management
      { key: 'can_view_guests', label: 'View Guests', category: 'Guests', description: 'Can view guest information' },
      { key: 'can_create_guests', label: 'Create Guests', category: 'Guests', description: 'Can add new guests' },
      { key: 'can_edit_guests', label: 'Edit Guests', category: 'Guests', description: 'Can modify guest information' },
      { key: 'can_delete_guests', label: 'Delete Guests', category: 'Guests', description: 'Can remove guests' },
      
      // Volunteers Management
      { key: 'can_view_volunteers', label: 'View Volunteers', category: 'Volunteers', description: 'Can view volunteer information' },
      { key: 'can_manage_volunteer_assignments', label: 'Manage Volunteer Assignments', category: 'Volunteers', description: 'Can assign volunteers to roles' },
      { key: 'can_manage_volunteer_roles', label: 'Manage Volunteer Roles', category: 'Volunteers', description: 'Can create and edit volunteer roles' },
      { key: 'can_edit_volunteers', label: 'Edit Volunteers', category: 'Volunteers', description: 'Can modify volunteer information' },
      { key: 'can_delete_volunteers', label: 'Delete Volunteers', category: 'Volunteers', description: 'Can remove volunteers' },
      
      // Support Requests Management
      { key: 'can_view_support_requests', label: 'View Support Requests', category: 'Support', description: 'Can view support requests' },
      { key: 'can_create_support_requests', label: 'Create Support Requests', category: 'Support', description: 'Can create new support requests' },
      { key: 'can_respond_support_requests', label: 'Respond to Support Requests', category: 'Support', description: 'Can respond to support requests' },
      { key: 'can_resolve_support_requests', label: 'Resolve Support Requests', category: 'Support', description: 'Can mark support requests as resolved' },
      
      // Staff Management
      { key: 'can_view_staff', label: 'View Staff', category: 'Staff', description: 'Can view staff members' },
      { key: 'can_create_staff', label: 'Create Staff', category: 'Staff', description: 'Can add new staff members' },
      { key: 'can_edit_staff', label: 'Edit Staff', category: 'Staff', description: 'Can modify staff information' },
      { key: 'can_delete_staff', label: 'Delete Staff', category: 'Staff', description: 'Can remove staff members' },
      { key: 'can_manage_staff_permissions', label: 'Manage Staff Permissions', category: 'Staff', description: 'Can assign permissions to staff' },
      
      // Communications
      { key: 'can_view_communications', label: 'View Communications', category: 'Communications', description: 'Can view communication history' },
      { key: 'can_send_sms', label: 'Send SMS', category: 'Communications', description: 'Can send SMS messages' },
      { key: 'can_send_email', label: 'Send Email', category: 'Communications', description: 'Can send email messages' },
      { key: 'can_send_whatsapp', label: 'Send WhatsApp', category: 'Communications', description: 'Can send WhatsApp messages' },
      { key: 'can_view_communication_analytics', label: 'View Communication Analytics', category: 'Communications', description: 'Can view communication statistics and analytics' },
      
      // Settings & System
      { key: 'can_view_settings', label: 'View Settings', category: 'Settings', description: 'Can view system settings' },
      { key: 'can_edit_integrations', label: 'Edit Integrations', category: 'Settings', description: 'Can configure integrations' },
      { key: 'can_manage_system_settings', label: 'Manage System Settings', category: 'Settings', description: 'Can modify system configurations' },
      
      // Reports & Analytics
      { key: 'can_view_reports', label: 'View Reports', category: 'Reports', description: 'Can view analytics and reports' },
      { key: 'can_export_data', label: 'Export Data', category: 'Reports', description: 'Can export data and reports' },
    ];
  }

  /**
   * Get all available permissions (API endpoint)
   */
  async getAllAvailable(req, res) {
    const permissions = this.getAvailablePermissions();
    
    // Group by category for better UI display
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      total: permissions.length,
      permissions: permissions,
      grouped: grouped,
    });
  }

  /**
   * Get permissions for a specific staff member
   */
  async getByStaffId(req, res) {
    const { staffId } = req.params;

    const allPermissions = await sheetsService.getSheetObjects(this.sheetName);
    const staffPermissions = allPermissions.filter(
      (p) => String(p.staffID) === String(staffId)
    );

    // Get available permissions list
    const available = this.getAvailablePermissions();

    // Separate group permissions from regular permissions
    const groupPermissions = staffPermissions.filter(p => 
      String(p.permissionKey).startsWith('GRP-') && 
      (p.hasAccess === true || p.hasAccess === 'true' || p.hasAccess === 'TRUE')
    );
    const regularPermissions = staffPermissions.filter(p => 
      !String(p.permissionKey).startsWith('GRP-')
    );

    // Create a map of granted regular permissions
    const grantedMap = {};
    regularPermissions.forEach((p) => {
      grantedMap[p.permissionKey] = p.hasAccess === true || p.hasAccess === 'true' || p.hasAccess === 'TRUE';
    });

    // Combine with available permissions
    const permissionsWithStatus = available.map((perm) => ({
      ...perm,
      granted: grantedMap[perm.key] || false,
    }));

    res.json({
      success: true,
      staffId,
      total: permissionsWithStatus.filter(p => p.granted).length,
      permissions: permissionsWithStatus,
      groupPermissions: groupPermissions.map(p => p.permissionKey),
    });
  }

  /**
   * Update permissions for a staff member
   */
  async updateStaffPermissions(req, res) {
    const { staffId } = req.params;
    const { permissions, groupPermissions } = req.body; // permissions: Array of permission keys, groupPermissions: Array of group IDs

    if (!Array.isArray(permissions)) {
      throw new ApiError(400, 'Permissions must be an array of permission keys');
    }

    logger.info('Updating staff permissions', { staffId, permissions, groupPermissions });

    // Get all available permissions
    const availablePermissions = this.getAvailablePermissions();
    const validKeys = availablePermissions.map(p => p.key);

    // Validate permission keys
    const invalidKeys = permissions.filter(key => !validKeys.includes(key));
    if (invalidKeys.length > 0) {
      throw new ApiError(400, `Invalid permission keys: ${invalidKeys.join(', ')}`);
    }

    // Get existing permissions for this staff
    const allPermissions = await sheetsService.getSheetObjects(this.sheetName);
    const existingStaffPermissions = allPermissions.filter(
      (p) => String(p.staffID) === String(staffId)
    );

    // Separate existing group permissions from regular permissions
    const existingGroupPermissions = existingStaffPermissions.filter(p => 
      String(p.permissionKey).startsWith('GRP-')
    );
    const existingRegularPermissions = existingStaffPermissions.filter(p => 
      !String(p.permissionKey).startsWith('GRP-')
    );

    // Create a map of existing regular permissions
    const existingMap = {};
    existingRegularPermissions.forEach((p) => {
      existingMap[p.permissionKey] = p;
    });

    // Prepare updates
    const toUpdate = [];
    const toCreate = [];

    // For each available permission, determine if it should be granted or revoked
    availablePermissions.forEach((perm) => {
      const shouldGrant = permissions.includes(perm.key);
      const existing = existingMap[perm.key];

      if (existing) {
        // Update existing permission
        const currentAccess = existing.hasAccess === true || existing.hasAccess === 'true' || existing.hasAccess === 'TRUE';
        if (currentAccess !== shouldGrant) {
          toUpdate.push({
            ...existing,
            hasAccess: shouldGrant,
          });
        }
      } else if (shouldGrant) {
        // Create new permission (only if granting)
        toCreate.push({
          permissionID: generateId('PRM'),
          staffID: staffId,
          permissionKey: perm.key,
          hasAccess: true,
        });
      }
    });

    // Handle group permissions
    const groupPermissionsArray = Array.isArray(groupPermissions) ? groupPermissions : [];
    logger.info('Processing group permissions', {
      staffId,
      groupPermissionsArray,
      arrayLength: groupPermissionsArray.length
    });
    
    const groupPermissionsToCreate = groupPermissionsArray.map(groupId => ({
      permissionID: generateId('PRM'),
      staffID: staffId,
      permissionKey: groupId,
      hasAccess: true,
    }));

    // Apply updates - IMPORTANT: Don't use cache to ensure we have latest data
    let data = await sheetsService.getSheetObjects(this.sheetName, false);
    const headers = this.getDefaultHeaders();

    // Count existing group permissions before deletion
    const existingGroupPermsCount = data.filter(p => 
      String(p.staffID) === String(staffId) && String(p.permissionKey).startsWith('GRP-')
    ).length;

    // Remove all existing group permissions for this staff
    data = data.filter(p => 
      !(String(p.staffID) === String(staffId) && String(p.permissionKey).startsWith('GRP-'))
    );
    
    logger.info('Group permissions deletion', {
      staffId,
      existingGroupPermsCount,
      newGroupPermsCount: groupPermissionsToCreate.length,
      totalRecordsAfterDeletion: data.length
    });

    // Update existing regular permissions
    for (const update of toUpdate) {
      const index = data.findIndex((p) => p.permissionID === update.permissionID);
      if (index !== -1) {
        data[index] = update;
      }
    }

    // Add new regular permissions
    data.push(...toCreate);

    // Add new group permissions
    data.push(...groupPermissionsToCreate);

    // CRITICAL: Clear the sheet first to remove deleted group permissions
    // Using update() alone doesn't clear rows beyond the new data range
    await sheetsService.clearSheet(this.sheetName);
    
    // Write to sheet
    await sheetsService.updateSheetData(
      this.sheetName,
      [
        headers,
        ...data.map((item) =>
          headers.map((h) => {
            const key = h.charAt(0).toLowerCase() + h.slice(1);
            return item[key] !== undefined ? item[key] : '';
          })
        ),
      ]
    );

    logger.info('Staff permissions updated', {
      staffId,
      updated: toUpdate.length,
      created: toCreate.length,
      groupPermissions: groupPermissionsArray.length,
    });

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      staffId,
      updated: toUpdate.length,
      created: toCreate.length,
      totalGranted: permissions.length,
      groupPermissionsGranted: groupPermissionsArray.length,
    });
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.staffID) {
      filteredData = filteredData.filter(
        (item) => String(item.staffID) === String(filters.staffID)
      );
    }

    if (filters.permissionKey) {
      filteredData = filteredData.filter(
        (item) => item.permissionKey === filters.permissionKey
      );
    }

    if (filters.hasAccess !== undefined) {
      const access = filters.hasAccess === true || filters.hasAccess === 'true';
      filteredData = filteredData.filter(
        (item) => (item.hasAccess === true || item.hasAccess === 'true') === access
      );
    }

    return filteredData;
  }
}

module.exports = new StaffPermissionsController();
