/**
 * Staff Permissions Constants
 * Comprehensive list of all system permissions organized by category
 * Used in both AddEditStaffModal and ManageStaffPermissionsModal
 */

export interface Permission {
  key: string;
  label: string;
  description: string;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export const STAFF_PERMISSIONS: PermissionCategory[] = [
  {
    name: "Members",
    permissions: [
      { key: "can_view_members", label: "View Members", description: "Can view member profiles and information" },
      { key: "can_create_members", label: "Create Members", description: "Can create new member profiles" },
      { key: "can_edit_members", label: "Edit Members", description: "Can modify member profiles" },
      { key: "can_delete_members", label: "Delete Members", description: "Can remove member records" },
    ]
  },
  {
    name: "Families",
    permissions: [
      { key: "can_view_families", label: "View Families", description: "Can view family information" },
      { key: "can_create_families", label: "Create Families", description: "Can create new family records" },
      { key: "can_edit_families", label: "Edit Families", description: "Can modify family information" },
      { key: "can_delete_families", label: "Delete Families", description: "Can remove family records" },
    ]
  },
  {
    name: "Groups",
    permissions: [
      { key: "can_view_groups", label: "View Groups", description: "Can view group information and memberships" },
      { key: "can_create_groups", label: "Create Groups", description: "Can create new groups" },
      { key: "can_edit_groups", label: "Edit Groups", description: "Can modify group information" },
      { key: "can_delete_groups", label: "Delete Groups", description: "Can delete groups" },
    ]
  },
  {
    name: "Donations",
    permissions: [
      { key: "can_view_donations", label: "View Donations", description: "Can view donation records and history" },
      { key: "can_create_donations", label: "Create Donations", description: "Can record new donations" },
      { key: "can_edit_donations", label: "Edit Donations", description: "Can modify donation records" },
      { key: "can_delete_donations", label: "Delete Donations", description: "Can remove donation records" },
      { key: "can_verify_donations", label: "Verify Donations", description: "Can verify and process pending donations" },
    ]
  },
  {
    name: "Attendance",
    permissions: [
      { key: "can_view_attendance", label: "View Attendance", description: "Can view attendance records" },
      { key: "can_mark_attendance", label: "Mark Attendance", description: "Can record attendance for events" },
      { key: "can_edit_attendance", label: "Edit Attendance", description: "Can modify attendance records" },
      { key: "can_delete_attendance", label: "Delete Attendance", description: "Can remove attendance records" },
    ]
  },
  {
    name: "Gatherings/Events",
    permissions: [
      { key: "can_view_gatherings", label: "View Gatherings", description: "Can view gathering/event information" },
      { key: "can_create_gatherings", label: "Create Gatherings", description: "Can create new gatherings/events" },
      { key: "can_edit_gatherings", label: "Edit Gatherings", description: "Can modify gathering/event information" },
      { key: "can_delete_gatherings", label: "Delete Gatherings", description: "Can delete gatherings/events" },
    ]
  },
  {
    name: "Guests",
    permissions: [
      { key: "can_view_guests", label: "View Guests", description: "Can view guest information" },
      { key: "can_create_guests", label: "Create Guests", description: "Can record new guests" },
      { key: "can_edit_guests", label: "Edit Guests", description: "Can modify guest information" },
      { key: "can_delete_guests", label: "Delete Guests", description: "Can remove guest records" },
    ]
  },
  {
    name: "Volunteers",
    permissions: [
      { key: "can_view_volunteers", label: "View Volunteers", description: "Can view volunteer information" },
      { key: "can_manage_volunteers", label: "Manage Volunteers", description: "Can schedule and manage volunteer assignments" },
      { key: "can_edit_volunteers", label: "Edit Volunteers", description: "Can modify volunteer information" },
      { key: "can_delete_volunteers", label: "Delete Volunteers", description: "Can remove volunteer records" },
    ]
  },
  {
    name: "Support Requests",
    permissions: [
      { key: "can_view_support_requests", label: "View Support Requests", description: "Can view support requests" },
      { key: "can_create_support_requests", label: "Create Support Requests", description: "Can create new support requests" },
      { key: "can_respond_support_requests", label: "Respond to Support", description: "Can respond to support requests" },
      { key: "can_resolve_support_requests", label: "Resolve Support", description: "Can resolve/close support requests" },
    ]
  },
  {
    name: "Communications",
    permissions: [
      { key: "can_view_communications", label: "View Communications", description: "Can view communication history" },
      { key: "can_create_communications", label: "Create Communications", description: "Can create new messages" },
      { key: "can_send_sms", label: "Send SMS", description: "Can send SMS messages" },
      { key: "can_send_email", label: "Send Email", description: "Can send email messages" },
      { key: "can_send_whatsapp", label: "Send WhatsApp", description: "Can send WhatsApp messages" },
    ]
  },
  {
    name: "Staff Management",
    permissions: [
      { key: "can_view_staff", label: "View Staff", description: "Can view staff information" },
      { key: "can_create_staff", label: "Create Staff", description: "Can create new staff accounts" },
      { key: "can_edit_staff", label: "Edit Staff", description: "Can modify staff information" },
      { key: "can_delete_staff", label: "Delete Staff", description: "Can remove staff accounts" },
      { key: "can_manage_staff_permissions", label: "Manage Staff Permissions", description: "Can assign permissions to staff" },
      { key: "can_manage_staff", label: "Manage Staff", description: "Can perform all staff management operations" },
    ]
  },
  {
    name: "Reports & Analytics",
    permissions: [
      { key: "can_view_reports", label: "View Reports", description: "Can view analytics and reports" },
      { key: "can_generate_reports", label: "Generate Reports", description: "Can create and export analytics reports" },
      { key: "can_export_reports", label: "Export Reports", description: "Can export report data" },
    ]
  },
  {
    name: "Settings",
    permissions: [
      { key: "can_view_settings", label: "View Settings", description: "Can view system settings" },
      { key: "can_edit_settings", label: "Edit Settings", description: "Can modify system settings" },
      { key: "can_manage_system_settings", label: "Manage System Settings", description: "Can manage all system configuration" },
    ]
  },
];

/**
 * Helper function to get all permission keys
 */
export const getAllPermissionKeys = (): string[] => {
  return STAFF_PERMISSIONS.flatMap(category => 
    category.permissions.map(permission => permission.key)
  );
};

/**
 * Helper function to get permission by key
 */
export const getPermissionByKey = (key: string): Permission | undefined => {
  for (const category of STAFF_PERMISSIONS) {
    const permission = category.permissions.find(p => p.key === key);
    if (permission) return permission;
  }
  return undefined;
};
