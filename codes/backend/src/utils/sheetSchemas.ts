/**
 * Google Sheets Schema Definitions & Validation
 * 
 * This file provides TypeScript interfaces and validation utilities
 * for all Google Sheets in the TCC CRM system.
 * 
 * IMPORTANT: These schemas reflect the ACTUAL Google Sheets structure.
 * Do NOT modify existing schemas without explicit user approval.
 */

// ==========================================
// COMMUNICATION TEMPLATES (NEW)
// ==========================================

/**
 * Communication_Templates Sheet
 * Created: January 2026
 * Purpose: Template-based messaging system for SMS, WhatsApp, and Email
 */
export interface CommunicationTemplate {
  templateID: string;           // Primary key (e.g., TMPL001)
  templateName: string;          // Display name
  channel: 'sms' | 'whatsapp' | 'email';  // Communication channel
  subject: string;               // Email subject (optional for SMS/WhatsApp)
  messageContent: string;        // Template with {{variables}}
  variables: string;             // Comma-separated variable names
  category: 'welcome' | 'birthday' | 'donation' | 'event' | 'general';
  audienceType: 'members' | 'guests' | 'volunteers' | 'all';
  isActive: 'TRUE' | 'FALSE';   // Template enabled/disabled
  whatsAppTemplateID: string;    // Meta-approved template ID (required for WhatsApp)
  createdBy: string;             // Staff member ID
  createdByName: string;         // Staff member name
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  notes: string;                 // Internal notes
}

// Column mapping for Communication_Templates
export const COMMUNICATION_TEMPLATE_COLUMNS = [
  'TemplateID',
  'TemplateName',
  'Channel',
  'Subject',
  'MessageContent',
  'Variables',
  'Category',
  'AudienceType',
  'IsActive',
  'WhatsAppTemplateID',
  'CreatedBy',
  'CreatedByName',
  'CreatedAt',
  'UpdatedAt',
  'Notes'
] as const;

// ==========================================
// COMMUNICATIONS (EXISTING - DO NOT MODIFY)
// ==========================================

/**
 * Communications Sheet (EXISTING)
 * 23 columns - IMMUTABLE SCHEMA
 */
export interface Communication {
  communicationID: string;
  recipientID: string;
  recipientType: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  messageType: 'SMS' | 'Email' | 'WhatsApp';
  emailProvider: string;
  subject: string;
  message: string;
  status: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
  sentBy: string;
  sentByName: string;
  sentAt: string;
  deliveredAt: string;
  failureReason: string;
  externalMessageID: string;
  cost: string;
  groupIDs: string;
  tags: string;
  scheduledMessageID: string;
  createdAt: string;
  updatedAt: string;
}

export const COMMUNICATION_COLUMNS = [
  'CommunicationID',
  'RecipientID',
  'RecipientType',
  'RecipientName',
  'RecipientPhone',
  'RecipientEmail',
  'MessageType',
  'EmailProvider',
  'Subject',
  'Message',
  'Status',
  'SentBy',
  'SentByName',
  'SentAt',
  'DeliveredAt',
  'FailureReason',
  'ExternalMessageID',
  'Cost',
  'GroupIDs',
  'Tags',
  'ScheduledMessageID',
  'CreatedAt',
  'UpdatedAt'
] as const;

// ==========================================
// SCHEDULED MESSAGES (EXISTING - DO NOT MODIFY)
// ==========================================

/**
 * ScheduledMessages Sheet (EXISTING)
 * 21 columns - IMMUTABLE SCHEMA
 * Note: Contains typo "CreadedByName" - DO NOT FIX
 */
export interface ScheduledMessage {
  scheduleID: string;
  title: string;
  recipientType: string;
  recipients: string;
  message: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  emailProvider: string;
  subject: string;
  scheduleType: string;
  scheduleDate: string;
  scheduleTime: string;
  frequency: string;
  status: string;
  groupIDs: string;
  tags: string;
  createdBy: string;
  creadedByName: string;  // Note: Typo in actual sheet - preserved
  lastSent: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export const SCHEDULED_MESSAGE_COLUMNS = [
  'ScheduleID',
  'Title',
  'RecipientType',
  'Recipients',
  'Message',
  'Channel',
  'EmailProvider',
  'Subject',
  'ScheduleType',
  'ScheduleDate',
  'ScheduleTime',
  'Frequency',
  'Status',
  'GroupIDs',
  'Tags',
  'CreatedBy',
  'CreadedByName',  // Preserving typo
  'LastSent',
  'NextRun',
  'CreatedAt',
  'UpdatedAt'
] as const;

// ==========================================
// MESSAGE DRAFTS (EXISTING - DO NOT MODIFY)
// ==========================================

/**
 * MessageDrafts Sheet (EXISTING)
 * 14 columns - IMMUTABLE SCHEMA
 * Note: Will be deprecated in favor of Communication_Templates
 */
export interface MessageDraft {
  draftID: string;
  title: string;
  recipientType: string;
  recipients: string;
  message: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  emailProvider: string;
  subject: string;
  groupIDs: string;
  tags: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  lastModified: string;
}

export const MESSAGE_DRAFT_COLUMNS = [
  'DraftID',
  'Title',
  'RecipientType',
  'Recipients',
  'Message',
  'Channel',
  'EmailProvider',
  'Subject',
  'GroupIDs',
  'Tags',
  'CreatedBy',
  'CreatedByName',
  'CreatedAt',
  'LastModified'
] as const;

// ==========================================
// VALIDATION UTILITIES
// ==========================================

/**
 * Validates that required columns exist in sheet data
 */
export function validateSheetColumns(
  sheetName: string,
  actualColumns: string[],
  expectedColumns: readonly string[]
): { valid: boolean; missing: string[]; extra: string[] } {
  const missing = expectedColumns.filter(col => !actualColumns.includes(col));
  const extra = actualColumns.filter(col => !expectedColumns.includes(col));
  
  return {
    valid: missing.length === 0,
    missing,
    extra
  };
}

/**
 * Converts camelCase field names to Google Sheets column names
 */
export function fieldToColumn(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

/**
 * Converts Google Sheets column names to camelCase field names
 */
export function columnToField(column: string): string {
  return column.charAt(0).toLowerCase() + column.slice(1);
}

/**
 * Maps a template object to a sheet row array
 */
export function templateToRow(template: Partial<CommunicationTemplate>): string[] {
  return COMMUNICATION_TEMPLATE_COLUMNS.map(col => {
    const field = columnToField(col);
    return template[field as keyof CommunicationTemplate] || '';
  });
}

/**
 * Maps a sheet row array to a template object
 */
export function rowToTemplate(row: string[], headers: string[]): Partial<CommunicationTemplate> {
  const template: any = {};
  headers.forEach((header, index) => {
    const field = columnToField(header);
    template[field] = row[index] || '';
  });
  return template;
}

// ==========================================
// WHATSAPP TEMPLATE VALIDATION
// ==========================================

/**
 * Validates WhatsApp template requirements
 * WhatsApp messages REQUIRE an approved template ID
 */
export function validateWhatsAppTemplate(template: CommunicationTemplate): {
  valid: boolean;
  error?: string;
} {
  if (template.channel !== 'whatsapp') {
    return { valid: true };
  }

  if (!template.whatsAppTemplateID || template.whatsAppTemplateID.trim() === '') {
    return {
      valid: false,
      error: 'WhatsApp messages require an approved template ID. Please get your template approved by Meta first.'
    };
  }

  return { valid: true };
}

/**
 * Extracts variable names from template content
 * Example: "Hello {{first_name}}, your {{event_name}}" → ['first_name', 'event_name']
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

/**
 * Replaces variables in template content with actual values
 */
export function replaceVariables(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return values[variable] !== undefined ? values[variable] : match;
  });
}

/**
 * Validates that all required variables are provided
 */
export function validateVariables(
  template: CommunicationTemplate,
  providedValues: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredVars = template.variables
    .split(',')
    .map(v => v.trim())
    .filter(v => v.length > 0);
  
  const missing = requiredVars.filter(v => !providedValues[v] || providedValues[v].trim() === '');
  
  return {
    valid: missing.length === 0,
    missing
  };
}
