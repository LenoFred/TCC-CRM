/**
 * Business Logic Routes
 * API endpoints for specialized CRM workflows
 */

const express = require('express');
const router = express.Router();
const { authenticate: authenticateToken, requireRole } = require('../../middlewares/auth');
const { validate: validateRequest, schemas } = require('../../utils/validation');
const guestTrackingService = require('../../services/guestTrackingService');
const checkInService = require('../../services/checkInService');
const donationVerificationService = require('../../services/donationVerificationService');
const communicationService = require('../../services/communicationService');

// ==========================================
// GUEST TRACKING
// ==========================================

/**
 * @route   POST /api/business/guest-register
 * @desc    Register or update a guest visit
 * @access  Private (Staff/Admin)
 */
router.post(
  '/guest-register',
  // authenticateToken,
  // requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const result = await guestTrackingService.registerGuest(req.body);
      res.status(200).json({
        success: true,
        message: result.isNewGuest ? 'Guest registered successfully' : 'Guest visit recorded',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/guest-to-member
 * @desc    Convert a guest to a member
 * @access  Private (Admin/Staff)
 */
router.post(
  '/guest-to-member',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { guestID, additionalInfo } = req.body;
      const result = await guestTrackingService.convertToMember(guestID, additionalInfo);
      res.status(200).json({
        success: true,
        message: 'Guest converted to member successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/guests
 * @desc    Get all guests with optional filters
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/guests',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const { includeMembers } = req.query;
      const guests = await guestTrackingService.getAllGuests(includeMembers === 'true');
      res.status(200).json({
        success: true,
        count: guests.length,
        data: guests,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/guest-stats
 * @desc    Get guest statistics
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/guest-stats',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const { days } = req.query;
      const stats = await guestTrackingService.getGuestStats(days ? parseInt(days) : 30);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/dashboard-stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/dashboard-stats',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const sheetsService = require('../../services/sheetsService');
      
      // Fetch all required data
      const [members, families, groups] = await Promise.all([
        sheetsService.getSheetObjects('Members'),
        sheetsService.getSheetObjects('Families'),
        sheetsService.getSheetObjects('Groups'),
      ]);
      
      // Calculate stats
      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'Active').length;
      const guestMembers = members.filter(m => m.status === 'Guest').length;
      const totalFamilies = families.length;
      const totalGroups = groups.filter(g => g.isActive === 'true' || g.isActive === true).length;
      
      res.status(200).json({
        success: true,
        data: {
          totalMembers,
          activeMembers,
          guestMembers,
          totalFamilies,
          totalGroups,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/recent-activities
 * @desc    Get recent activity log across all sheets
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/recent-activities',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const sheetsService = require('../../services/sheetsService');
      const { limit = 20 } = req.query;
      
      // Fetch recent data from various sheets
      const [members, families, attendance, donations, volunteerAssignments] = await Promise.all([
        sheetsService.getSheetObjects('Members'),
        sheetsService.getSheetObjects('Families'),
        sheetsService.getSheetObjects('Attendance'),
        sheetsService.getSheetObjects('Donations'),
        sheetsService.getSheetObjects('VolunteerAssignments'),
      ]);
      
      const activities = [];
      
      console.log('=== ACTIVITY TRACKING DEBUG ===');
      console.log('Total members:', members.length);
      console.log('Members with updatedAt:', members.filter(m => m.updatedAt).length);
      console.log('Sample member with updatedAt:', members.find(m => m.updatedAt));
      console.log('Sample member fields:', members[0] ? Object.keys(members[0]) : 'No members');
      
      // Add member registrations - use createdAt or joinDate as fallback
      members
        .filter(m => m.createdAt || m.joinDate)
        .forEach(m => {
          const timestamp = m.createdAt || m.joinDate;
          // If timestamp is just a date (no time), add current time to make it sortable
          const fullTimestamp = timestamp.includes('T') ? timestamp : `${timestamp}T00:00:00Z`;
          
          activities.push({
            id: `member-create-${m.memberID}`,
            type: m.status === 'Guest' ? 'Guest Visit' : 'Member Registration',
            description: `${m.firstName} ${m.lastName} ${m.status === 'Guest' ? 'visited' : 'registered'}`,
            timestamp: fullTimestamp,
            icon: m.status === 'Guest' ? 'UserPlus' : 'UserCheck',
            memberName: `${m.firstName} ${m.lastName}`,
          });
        });
      
      // Add member updates - ONLY if updatedAt exists AND is different from createdAt/joinDate
      const membersWithUpdates = members.filter(m => {
        if (!m.updatedAt) return false;
        const created = m.createdAt || m.joinDate;
        if (!created) return true; // Has update but no create time
        // Compare dates - if updatedAt is later, it's a real update
        return new Date(m.updatedAt) > new Date(created);
      });
      
      console.log('Members qualifying for update activity:', membersWithUpdates.length);
      if (membersWithUpdates.length > 0) {
        console.log('Sample update:', membersWithUpdates[0]);
      }
      
      membersWithUpdates.forEach(m => {
        activities.push({
          id: `member-update-${m.memberID}-${m.updatedAt}`,
          type: 'Member Update',
          description: `${m.firstName} ${m.lastName}'s profile was updated`,
          timestamp: m.updatedAt,
          icon: 'UserCheck',
          memberName: `${m.firstName} ${m.lastName}`,
        });
      });
      
      // Add family activities
      families
        .filter(f => f.createdAt || f.updatedAt || f.createdDate)
        .forEach(f => {
          const timestamp = f.updatedAt || f.createdAt || f.createdDate;
          const created = f.createdAt || f.createdDate;
          const isUpdate = f.updatedAt && created && new Date(f.updatedAt) > new Date(created);
          const fullTimestamp = timestamp.includes('T') ? timestamp : `${timestamp}T00:00:00Z`;
          
          activities.push({
            id: `family-${isUpdate ? 'update' : 'create'}-${f.familyID}-${timestamp}`,
            type: isUpdate ? 'Family Update' : 'Family Registration',
            description: `Family "${f.familyName || f.familyID}" ${isUpdate ? 'was updated' : 'was registered'}`,
            timestamp: fullTimestamp,
            icon: 'Home',
            memberName: f.familyName || 'Family',
          });
        });
      
      // Add attendance check-ins
      attendance
        .filter(a => a.createdAt || a.attendanceDate)
        .forEach(a => {
          const member = members.find(m => m.memberID === a.memberID);
          activities.push({
            id: `attendance-${a.attendanceID}`,
            type: 'Attendance Check-in',
            description: `${member ? `${member.firstName} ${member.lastName}` : 'Member'} checked in to ${a.serviceName || a.eventType}`,
            timestamp: a.createdAt || a.attendanceDate,
            icon: 'CheckCircle',
            memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
          });
        });
      
      // Add donations - use createdAt or donationDate or date
      donations
        .filter(d => d.createdAt || d.donationDate || d.date)
        .forEach(d => {
          const member = members.find(m => m.memberID === d.memberID);
          const timestamp = d.createdAt || d.donationDate || d.date;
          const fullTimestamp = timestamp.includes('T') ? timestamp : `${timestamp}T00:00:00Z`;
          
          activities.push({
            id: `donation-${d.donationID}`,
            type: 'Donation',
            description: `${member ? `${member.firstName} ${member.lastName}` : 'Member'} donated ₦${parseFloat(d.amount || 0).toLocaleString()} (${d.fund || d.category || 'General'})`,
            timestamp: fullTimestamp,
            icon: 'DollarSign',
            memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
            status: d.status || d.verificationStatus,
          });
        });
      
      // Add volunteer assignments
      volunteerAssignments
        .filter(v => v.assignedDate)
        .forEach(v => {
          const member = members.find(m => m.memberID === v.memberID);
          activities.push({
            id: `volunteer-${v.assignmentID}`,
            type: 'Volunteer Assignment',
            description: `${member ? `${member.firstName} ${member.lastName}` : 'Member'} assigned to volunteer role`,
            timestamp: v.assignedDate,
            icon: 'Heart',
            memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
          });
        });
      
      // Sort by timestamp (newest first) and limit
      const sortedActivities = activities
        .sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB - dateA; // Newest first
        })
        .slice(0, parseInt(limit));
      
      res.status(200).json({
        success: true,
        count: sortedActivities.length,
        data: sortedActivities,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// CHECK-IN / CHECK-OUT
// ==========================================

/**
 * @route   POST /api/business/check-in
 * @desc    Check in a member to a gathering
 * @access  Private (temporarily disabled for testing)
 */
router.post('/check-in', 
  // authenticateToken, 
  async (req, res, next) => {
  try {
    const { memberID, gatheringID, checkInMethod } = req.body;
    const result = await checkInService.checkIn(memberID, gatheringID, checkInMethod);
    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/business/bulk-check-in
 * @desc    Check in multiple members at once
 * @access  Private (Staff/Admin)
 */
router.post(
  '/bulk-check-in',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { memberIDs, gatheringID, checkInMethod } = req.body;
      const results = await checkInService.bulkCheckIn(memberIDs, gatheringID, checkInMethod);
      res.status(200).json({
        success: true,
        message: 'Bulk check-in completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/check-in-qr
 * @desc    Check in via QR code scan
 * @access  Private
 */
router.post('/check-in-qr', authenticateToken, async (req, res, next) => {
  try {
    const { qrCodeData, gatheringID } = req.body;
    const result = await checkInService.checkInViaQR(qrCodeData, gatheringID);
    res.status(200).json({
      success: true,
      message: 'Checked in via QR code successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/business/current-attendees/:gatheringID
 * @desc    Get list of currently checked-in attendees
 * @access  Private (Staff/Admin)
 */
router.get(
  '/current-attendees/:gatheringID',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const attendees = await checkInService.getCurrentAttendees(req.params.gatheringID);
      res.status(200).json({
        success: true,
        count: attendees.length,
        data: attendees,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/attendance-report/:gatheringID
 * @desc    Get comprehensive attendance report
 * @access  Private (Staff/Admin)
 */
router.get(
  '/attendance-report/:gatheringID',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const report = await checkInService.getAttendanceReport(req.params.gatheringID);
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/member-qr/:memberID
 * @desc    Generate QR code data for a member
 * @access  Private
 */
router.get('/member-qr/:memberID', authenticateToken, async (req, res, next) => {
  try {
    const qrData = await checkInService.generateMemberQR(req.params.memberID);
    res.status(200).json({
      success: true,
      data: qrData,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// DONATION VERIFICATION
// ==========================================

/**
 * @route   POST /api/business/donation-submit
 * @desc    Submit a donation for verification
 * @access  Private
 */
router.post('/donation-submit', authenticateToken, async (req, res, next) => {
  try {
    const donation = await donationVerificationService.submitDonation(req.body);
    res.status(201).json({
      success: true,
      message: 'Donation submitted for verification',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/business/donation-verify
 * @desc    Verify a donation
 * @access  Private (Staff/Admin)
 */
router.post(
  '/donation-verify',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { donationID, verifiedBy, notes } = req.body;
      const result = await donationVerificationService.verifyDonation(
        donationID,
        verifiedBy,
        notes
      );
      res.status(200).json({
        success: true,
        message: 'Donation verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/donation-reject
 * @desc    Reject a donation
 * @access  Private (Staff/Admin)
 */
router.post(
  '/donation-reject',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { donationID, rejectedBy, reason } = req.body;
      const result = await donationVerificationService.rejectDonation(
        donationID,
        rejectedBy,
        reason
      );
      res.status(200).json({
        success: true,
        message: 'Donation rejected',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/donation-bulk-verify
 * @desc    Verify multiple donations at once
 * @access  Private (Admin)
 */
router.post(
  '/donation-bulk-verify',
  authenticateToken,
  requireRole(['Admin']),
  async (req, res, next) => {
    try {
      const { donationIDs, verifiedBy, notes } = req.body;
      const results = await donationVerificationService.bulkVerify(
        donationIDs,
        verifiedBy,
        notes
      );
      res.status(200).json({
        success: true,
        message: 'Bulk verification completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/donations-pending
 * @desc    Get all pending donations
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/donations-pending',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const pending = await donationVerificationService.getPendingDonations();
      res.status(200).json({
        success: true,
        count: pending.length,
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/business/donation-receipt/:donationID
 * @desc    Generate receipt for a verified donation
 * @access  Private
 */
router.get('/donation-receipt/:donationID', authenticateToken, async (req, res, next) => {
  try {
    const receipt = await donationVerificationService.generateReceipt(req.params.donationID);
    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/business/donation-stats
 * @desc    Get verification statistics
 * @access  Private (Staff/Admin) - TEMPORARILY PUBLIC FOR TESTING
 */
router.get(
  '/donation-stats',
  // authenticateToken, // Temporarily disabled for testing
  // requireRole(['Admin', 'Staff']), // Temporarily disabled for testing
  async (req, res, next) => {
    try {
      const stats = await donationVerificationService.getVerificationStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// COMMUNICATIONS
// ==========================================

/**
 * @route   POST /api/business/send-sms
 * @desc    Send SMS to a member
 * @access  Private (Staff/Admin)
 */
router.post(
  '/send-sms',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { to, message, recipientID } = req.body;
      const result = await communicationService.sendSMS(to, message, {
        recipientID,
        sentBy: req.user.staffID || req.user.memberID,
      });
      res.status(200).json({
        success: true,
        message: 'SMS sent',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/send-email
 * @desc    Send email to a member
 * @access  Private (Staff/Admin)
 */
router.post(
  '/send-email',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { to, subject, htmlContent, recipientID } = req.body;
      const result = await communicationService.sendEmail(to, subject, htmlContent, {
        recipientID,
        sentBy: req.user.staffID || req.user.memberID,
      });
      res.status(200).json({
        success: true,
        message: 'Email sent',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/send-whatsapp
 * @desc    Send WhatsApp message to a member
 * @access  Private (Staff/Admin)
 */
router.post(
  '/send-whatsapp',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { to, message, recipientID } = req.body;
      const result = await communicationService.sendWhatsApp(to, message, {
        recipientID,
        sentBy: req.user.staffID || req.user.memberID,
      });
      res.status(200).json({
        success: true,
        message: 'WhatsApp sent',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/send-bulk
 * @desc    Send bulk messages
 * @access  Private (Admin)
 */
router.post(
  '/send-bulk',
  authenticateToken,
  requireRole(['Admin']),
  async (req, res, next) => {
    try {
      const { recipients, messageType, message, subject } = req.body;
      const results = await communicationService.sendBulkMessages(
        recipients,
        messageType,
        message,
        {
          subject,
          sentBy: req.user.staffID || req.user.memberID,
        }
      );
      res.status(200).json({
        success: true,
        message: 'Bulk messaging completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/business/send-template
 * @desc    Send templated message
 * @access  Private (Staff/Admin)
 */
router.post(
  '/send-template',
  authenticateToken,
  requireRole(['Admin', 'Staff']),
  async (req, res, next) => {
    try {
      const { templateName, recipient, data, messageType } = req.body;
      const result = await communicationService.sendTemplatedMessage(
        templateName,
        recipient,
        data,
        messageType
      );
      res.status(200).json({
        success: true,
        message: 'Templated message sent',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
