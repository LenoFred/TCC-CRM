// Type definitions for TCC CRM

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  joinDate: string;
  status: string;
  familyId?: string;
  branchId: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  familyName: string;
  branchId: string;
  members?: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  memberId: string;
  memberName: string;
  role: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hireDate: string;
  status: string;
  branchId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
  pastor: string;
  phone: string;
  email: string;
  memberCount: number;
  status: string;
  establishedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  amount: number;
  currency: string;
  fund: string;
  paymentMethod: string;
  donationDate: string;
  isVerified: boolean;
  memberId?: string;
  branchId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  category: string;
  startDate: string;
  endDate?: string;
  location?: string;
  branchId: string;
  expectedAttendance?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Gathering {
  id: string;
  gatheringName: string;
  gatheringType: "EVENT" | "GROUP";
  gatheringDate: string;
  parentId?: string; // Event ID or Group ID
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  gatheringId: string;
  checkInTime: string;
  isGuest: boolean;
  branchId: string;
  createdAt: string;
}

export interface VolunteerRole {
  id: string;
  roleName: string;
  description: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerAssignment {
  id: string;
  memberId: string;
  memberName: string;
  roleId: string;
  roleName: string;
  gatheringId: string;
  gatheringName: string;
  assignmentDate: string;
  status: string;
  notes?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  id: string;
  sheetName: string;
  fieldName: string;
  dataType: string;
  isRequired: boolean;
  options?: string[];
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  subject: string;
  content: string;
  messageType: string;
  channels: string[];
  recipientIds: string[];
  sentAt?: string;
  scheduledFor?: string;
  status: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDraft {
  id: string;
  subject: string;
  content: string;
  recipientIds: string[];
  channels: string[];
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reportName: string;
  dataSource: string;
  filters: ReportFilter[];
  outputFields: string[];
  generatedBy: string;
  generatedAt: string;
  branchId: string;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Form types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MemberFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  status: string;
  familyId?: string;
  customFields?: Record<string, any>;
}

export interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  hireDate: string;
  status: string;
}

export interface FamilyFormData {
  familyName: string;
  members: Array<{
    memberId: string;
    role: string;
  }>;
}

export interface BranchFormData {
  name: string;
  location: string;
  address: string;
  pastor: string;
  phone: string;
  email: string;
  establishedDate?: string;
}

// UI State types
export interface FilterState {
  searchTerm: string;
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  customFilters: Record<string, any>;
}

export interface SortState {
  field: string;
  direction: "asc" | "desc";
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Theme and UI types
export interface ThemeConfig {
  mode: "light" | "dark" | "system";
  primaryColor: string;
  accentColor: string;
}

export interface NotificationConfig {
  email: boolean;
  browser: boolean;
  sound: boolean;
}

// Analytics types
export interface AnalyticsMetric {
  name: string;
  value: number;
  change?: number;
  period: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
}