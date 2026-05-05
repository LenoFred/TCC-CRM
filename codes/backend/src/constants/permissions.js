/**
 * Permissions Constants
 * Single source of truth for all system permissions
 * Organized by feature category with standard CRUD operations
 */

const PERMISSIONS = {
  // ==========================================
  // MEMBERS (4 permissions)
  // ==========================================
  MEMBERS: [
    'can_view_members',
    'can_create_members',
    'can_edit_members',
    'can_delete_members',
  ],

  // ==========================================
  // FAMILIES (4 permissions)
  // ==========================================
  FAMILIES: [
    'can_view_families',
    'can_create_families',
    'can_edit_families',
    'can_delete_families',
  ],

  // ==========================================
  // GROUPS (4 permissions)
  // ==========================================
  GROUPS: [
    'can_view_groups',
    'can_create_groups',
    'can_edit_groups',
    'can_delete_groups',
  ],

  // ==========================================
  // GATHERINGS/EVENTS (4 permissions)
  // ==========================================
  GATHERINGS: [
    'can_view_gatherings',
    'can_create_gatherings',
    'can_edit_gatherings',
    'can_delete_gatherings',
  ],

  // ==========================================
  // ATTENDANCE (4 permissions)
  // ==========================================
  ATTENDANCE: [
    'can_view_attendance',
    'can_mark_attendance',
    'can_edit_attendance',
    'can_delete_attendance',
  ],

  // ==========================================
  // DONATIONS (5 permissions)
  // ==========================================
  DONATIONS: [
    'can_view_donations',
    'can_create_donations',
    'can_edit_donations',
    'can_delete_donations',
    'can_verify_donations',
  ],

  // ==========================================
  // GUESTS (4 permissions)
  // ==========================================
  GUESTS: [
    'can_view_guests',
    'can_create_guests',
    'can_edit_guests',
    'can_delete_guests',
  ],

  // ==========================================
  // VOLUNTEERS (5 permissions)
  // ==========================================
  VOLUNTEERS: [
    'can_view_volunteers',
    'can_manage_volunteers',
    'can_edit_volunteers',
    'can_delete_volunteers',
  ],

  // ==========================================
  // SUPPORT REQUESTS (4 permissions)
  // ==========================================
  SUPPORT_REQUESTS: [
    'can_view_support_requests',
    'can_create_support_requests',
    'can_respond_support_requests',
    'can_resolve_support_requests',
  ],

  // ==========================================
  // STAFF MANAGEMENT (5 permissions)
  // ==========================================
  STAFF: [
    'can_view_staff',
    'can_create_staff',
    'can_edit_staff',
    'can_delete_staff',
    'can_manage_staff_permissions',
    'can_manage_staff', // Umbrella permission for staff operations
  ],

  // ==========================================
  // COMMUNICATIONS (5+ permissions)
  // ==========================================
  COMMUNICATIONS: [
    'can_view_communications',
    'can_create_communications',
    'can_update_communications',
    'can_delete_communications',
    'can_send_sms',
    'can_send_email',
    'can_send_whatsapp',
  ],

  // ==========================================
  // SETTINGS & CONFIGURATION (3 permissions)
  // ==========================================
  SETTINGS: [
    'can_view_settings',
    'can_edit_settings',
    'can_manage_system_settings',
  ],

  // ==========================================
  // REPORTS & ANALYTICS (2 permissions)
  // ==========================================
  REPORTS: [
    'can_view_reports',
    'can_generate_reports',
    'can_export_reports',
  ],
};

/**
 * Get all permissions as a flat array
 * Used for granting all permissions to admin users
 * @returns {string[]} Array of all permission keys
 */
PERMISSIONS.ALL = () => {
  return Object.values(PERMISSIONS)
    .filter(val => Array.isArray(val))
    .flat();
};

/**
 * Check if a permission exists in the system
 * @param {string} permissionKey - Permission key to check
 * @returns {boolean} True if permission exists
 */
PERMISSIONS.exists = (permissionKey) => {
  return PERMISSIONS.ALL().includes(permissionKey);
};

/**
 * Get all permissions for a specific category
 * @param {string} category - Category name (MEMBERS, DONATIONS, etc.)
 * @returns {string[]} Array of permissions in that category
 */
PERMISSIONS.getCategory = (category) => {
  return PERMISSIONS[category] || [];
};

/**
 * Map old permission names to new standardized names
 * Used for backward compatibility during migration
 * @param {string} oldPermission - Old permission name
 * @returns {string} New standardized permission name
 */
PERMISSIONS.migrateOldName = (oldPermission) => {
  const mappings = {
    'can_add_members': 'can_create_members',
    'can_add_families': 'can_create_families',
    'can_add_groups': 'can_create_groups',
    'can_add_gatherings': 'can_create_gatherings',
    'can_add_attendance': 'can_mark_attendance',
    'can_add_donations': 'can_create_donations',
    'can_add_guests': 'can_create_guests',
    'can_add_staff': 'can_create_staff',
    'can_manage_donations': 'can_view_donations', // Needs review
  };
  return mappings[oldPermission] || oldPermission;
};

/**
 * Verification: Ensure no duplicates exist
 */
const allPerms = PERMISSIONS.ALL();
const uniquePerms = new Set(allPerms);
if (allPerms.length !== uniquePerms.size) {
  const duplicates = allPerms.filter((item, index) => allPerms.indexOf(item) !== index);
  console.warn('⚠️ WARNING: Duplicate permissions found:', duplicates);
}

module.exports = PERMISSIONS;
