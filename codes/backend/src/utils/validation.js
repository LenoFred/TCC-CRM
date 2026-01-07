/**
 * Validation Utilities and Schemas
 * Uses Zod for runtime type validation
 */

const { z } = require('zod');

/**
 * Common validation schemas
 */
const commonSchemas = {
  id: z.string().min(1, 'ID is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dateTime: z.string().datetime('Invalid datetime format'),
  url: z.string().url('Invalid URL format').optional(),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Cannot be negative'),
};

/**
 * Member Schemas
 */
const memberSchemas = {
  create: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    address: z.string().optional(),
    dateOfBirth: commonSchemas.date.optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    familyId: z.string().optional(),
    memberStatus: z.enum(['Active', 'Inactive', 'Child', 'Guest']),
    branchId: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  }),
  
  update: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    address: z.string().optional(),
    dateOfBirth: commonSchemas.date.optional(),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    familyId: z.string().optional(),
    memberStatus: z.enum(['Active', 'Inactive', 'Child', 'Guest']).optional(),
    branchId: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  }),
};

/**
 * Family Schemas
 */
const familySchemas = {
  create: z.object({
    familyName: z.string().min(1, 'Family name is required'),
    branchId: z.string().optional(),
    members: z.array(z.object({
      memberID: z.string(),
      familyRole: z.string().optional(),
    })).min(1, 'At least one member must be added to the family'),
  }),
  
  update: z.object({
    familyName: z.string().min(1).optional(),
    branchId: z.string().optional(),
  }),
};

/**
 * Group Schemas
 */
const groupSchemas = {
  create: z.object({
    groupName: z.string().min(1, 'Group name is required'),
    groupType: z.enum(['Department', 'Fellowship', 'Cell', 'Ministry', 'Committee', 'Small Group']),
    leaderMemberID: z.string().optional(),
    status: z.string().optional(),
    meetingLocation: z.string().optional(),
    description: z.string().optional(),
  }),
  
  update: z.object({
    groupName: z.string().min(1).optional(),
    groupType: z.enum(['Department', 'Fellowship', 'Cell', 'Ministry', 'Committee', 'Small Group']).optional(),
    leaderMemberID: z.string().optional(),
    status: z.string().optional(),
    meetingLocation: z.string().optional(),
    description: z.string().optional(),
  }),
};

/**
 * Event Schemas
 */
const eventSchemas = {
  create: z.object({
    eventName: z.string().min(1, 'Event name is required'),
    eventType: z.enum(['Weekly Service', 'Monthly Program', 'Annual Program', 'Special Event']),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
  
  update: z.object({
    eventName: z.string().min(1).optional(),
    eventType: z.enum(['Weekly Service', 'Monthly Program', 'Annual Program', 'Special Event']).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
};

/**
 * Gathering Schemas
 */
const gatheringSchemas = {
  create: z.object({
    gatheringName: z.string().min(1, 'Gathering name is required'),
    gatheringType: z.string().optional(),
    parentID: z.string().min(1, 'Parent ID (Event or Group) is required'),
    gatheringDate: z.string().min(1, 'Gathering date is required'),
    gatheringTime: z.string().optional(),
  }),
  
  update: z.object({
    gatheringName: z.string().min(1).optional(),
    gatheringType: z.string().optional(),
    parentID: z.string().optional(),
    gatheringDate: z.string().optional(),
    gatheringTime: z.string().optional(),
  }),
};

/**
 * Attendance Schemas
 */
const attendanceSchemas = {
  create: z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    gatheringId: z.string().min(1, 'Gathering ID is required'),
    checkInTime: commonSchemas.dateTime.optional(),
  }),
};

/**
 * Donation Schemas
 */
const donationSchemas = {
  create: z.object({
    memberId: z.string().optional(),
    amount: commonSchemas.positiveNumber,
    donationDate: commonSchemas.date,
    fund: z.enum(['Tithe', 'Offering', 'Building Fund', 'Mission', 'Special Project', 'Other']),
    notes: z.string().optional(),
    donorName: z.string().optional(),
  }),
  
  update: z.object({
    amount: commonSchemas.positiveNumber.optional(),
    donationDate: commonSchemas.date.optional(),
    fund: z.enum(['Tithe', 'Offering', 'Building Fund', 'Mission', 'Special Project', 'Other']).optional(),
    notes: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
  
  verify: z.object({
    verifiedBy: z.string().min(1, 'Verifier ID is required'),
  }),
};

/**
 * Authentication Schemas
 */
const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
  
  register: z.object({
    email: commonSchemas.email,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
};

/**
 * Communication Schemas
 */
const communicationSchemas = {
  create: z.object({
    message: z.string().min(1, 'Message is required'),
    channel: z.enum(['sms', 'email', 'whatsapp', 'SMS', 'Email', 'WhatsApp']),
    memberIds: z.array(z.string()).optional(),
    familyIds: z.array(z.string()).optional(),
    groupIds: z.array(z.string()).optional(),
    manualPhoneNumbers: z.array(z.string()).optional(),
    manualEmails: z.array(z.string()).optional(),
    subject: z.string().optional(),
    scheduledAt: z.string().optional(),
  }).refine(
    data => data.memberIds?.length || data.familyIds?.length || data.groupIds?.length || 
           data.manualPhoneNumbers?.length || data.manualEmails?.length,
    { message: 'At least one recipient (member, family, group, or manual contact) is required' }
  ),
  
  send: z.object({
    recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
    message: z.string().min(1, 'Message is required'),
    channel: z.enum(['SMS', 'Email', 'WhatsApp']),
    subject: z.string().optional(),
  }),
  
  schedule: z.object({
    recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
    message: z.string().min(1, 'Message is required'),
    channel: z.enum(['SMS', 'Email', 'WhatsApp']),
    scheduledAt: commonSchemas.dateTime,
    subject: z.string().optional(),
  }),
  
  update: z.object({
    status: z.enum(['sent', 'failed', 'pending', 'scheduled']).optional(),
    sentAt: z.string().optional(),
    failureReason: z.string().optional(),
  }),
};

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'params', 'query')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validate,
  schemas: {
    common: commonSchemas,
    member: memberSchemas,
    family: familySchemas,
    group: groupSchemas,
    event: eventSchemas,
    gathering: gatheringSchemas,
    attendance: attendanceSchemas,
    donation: donationSchemas,
    auth: authSchemas,
    communication: communicationSchemas,
  },
};
