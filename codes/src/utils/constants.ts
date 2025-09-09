// Application Constants for TCC CRM

export const APP_CONFIG = {
  name: "TCC CRM",
  fullName: "TCC Church Management System",
  version: "1.0.0",
  description: "Church Resource Management for TCC",
  supportEmail: "support@tccchurch.org",
  websiteUrl: "https://tccchurch.org",
} as const;

export const PERMISSIONS = {
  // Member Management
  CAN_VIEW_MEMBERS: "can_view_members",
  CAN_EDIT_MEMBERS: "can_edit_members",
  CAN_DELETE_MEMBERS: "can_delete_members",
  
  // Donations
  CAN_VIEW_DONATIONS: "can_view_donations",
  CAN_VERIFY_DONATIONS: "can_verify_donations",
  CAN_EDIT_DONATIONS: "can_edit_donations",
  
  // Attendance
  CAN_TAKE_ATTENDANCE: "can_take_attendance",
  CAN_VIEW_ATTENDANCE: "can_view_attendance",
  
  // Volunteers
  CAN_MANAGE_VOLUNTEERS: "can_manage_volunteers",
  CAN_VIEW_VOLUNTEERS: "can_view_volunteers",
  
  // Communications
  CAN_COMMUNICATE: "can_communicate",
  CAN_SEND_BULK_MESSAGES: "can_send_bulk_messages",
  
  // Analytics & Reports
  CAN_VIEW_ANALYTICS: "can_view_analytics",
  CAN_EXPORT_DATA: "can_export_data",
  
  // Staff Management (Admin Only)
  CAN_MANAGE_STAFF: "can_manage_staff",
  CAN_VIEW_STAFF: "can_view_staff",
  
  // System Settings
  CAN_MANAGE_SETTINGS: "can_manage_settings",
  CAN_MANAGE_BRANCHES: "can_manage_branches",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  PASTOR: "pastor", 
  STAFF: "staff",
  VOLUNTEER: "volunteer",
} as const;

export const MEMBER_STATUSES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  VISITOR: "Visitor",
  MEMBER: "Member",
  GUEST: "Guest",
} as const;

export const COMMUNICATION_CHANNELS = {
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
} as const;

export const EVENT_TYPES = {
  SUNDAY_SERVICE: "Sunday Service",
  BIBLE_STUDY: "Bible Study",
  PRAYER_MEETING: "Prayer Meeting",
  YOUTH_SERVICE: "Youth Service",
  WOMENS_MEETING: "Women's Meeting",
  MENS_MEETING: "Men's Meeting",
  CHILDRENS_SERVICE: "Children's Service",
  SPECIAL_EVENT: "Special Event",
  CONFERENCE: "Conference",
  RETREAT: "Retreat",
  OUTREACH: "Outreach",
} as const;

export const GATHERING_TYPES = {
  EVENT: "EVENT",
  GROUP: "GROUP",
} as const;

export const FAMILY_ROLES = {
  FATHER: "Father",
  MOTHER: "Mother",
  SON: "Son",
  DAUGHTER: "Daughter",
  SPOUSE: "Spouse",
  GUARDIAN: "Guardian",
  OTHER: "Other",
} as const;

export const VOLUNTEER_ROLES = {
  USHER: "Usher",
  GREETER: "Greeter",
  MUSICIAN: "Musician",
  SOUND_TECH: "Sound Technician",
  MEDIA_TECH: "Media Technician",
  PARKING_ATTENDANT: "Parking Attendant",
  SECURITY: "Security",
  CHILDREN_WORKER: "Children's Worker",
  YOUTH_WORKER: "Youth Worker",
} as const;

export const DATA_SOURCES = {
  MEMBERS: "Members",
  FAMILIES: "Families", 
  DONATIONS: "Donations",
  ATTENDANCE: "Attendance",
  VOLUNTEERS: "Volunteers",
  STAFF: "Staff",
  EVENTS: "Events",
  GROUPS: "Groups",
} as const;

export const CUSTOM_FIELD_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  BOOLEAN: "boolean",
  DROPDOWN: "dropdown",
  EMAIL: "email",
  PHONE: "phone",
  URL: "url",
} as const;

export const MESSAGE_TYPES = {
  BIRTHDAY: "birthday",
  WELCOME: "welcome",
  FOLLOW_UP: "follow_up",
  EVENT_REMINDER: "event_reminder",
  VOLUNTEER_REMINDER: "volunteer_reminder",
  GENERAL: "general",
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  FULL: "EEEE, MMMM do, yyyy",
  TIME: "h:mm a",
  DATETIME: "MMM dd, yyyy 'at' h:mm a",
} as const;

// Validation rules
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)\.]+$/,
  NAME: /^[a-zA-Z\s\-\'\.]+$/,
  URL: /^https?:\/\/.+/,
} as const;

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 25,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  NOT_FOUND: "The requested resource was not found.",
} as const;