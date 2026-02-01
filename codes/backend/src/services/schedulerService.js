const cron = require('node-cron');
const sheetsService = require('./sheetsService');
const communicationService = require('./communicationService');
const { logger } = require('../utils/logger');

/**
 * Message Scheduler Service
 * Runs scheduled and automated messages at specified times
 * Uses WAT (West Africa Time) timezone
 * Checks every 5 minutes for pending messages
 */
class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.midnightJob = null;
    this.todaysScheduledMessages = [];
    this.todaysAutomatedMessages = [];
    this.retryQueue = new Map(); // Track retry attempts
    this.sendQueue = []; // Queue for batching
    this.isSending = false;
  }

  /**
   * Start the scheduler service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler service is already running');
      return;
    }

    logger.info('Starting Scheduler Service...');

    // Run every 5 minutes to check for pending messages
    // Cron format: '*/5 * * * *' = every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendPendingMessages();
    }, {
      timezone: 'Africa/Lagos' // WAT (West Africa Time)
    });

    // Run at midnight (12:00 AM) to load today's schedule
    // Cron format: '0 0 * * *' = at 00:00 every day
    this.midnightJob = cron.schedule('0 0 * * *', async () => {
      await this.loadTodaysSchedule();
    }, {
      timezone: 'Africa/Lagos' // WAT
    });

    // Load today's schedule on startup
    this.loadTodaysSchedule();

    // Initialize default system automations
    this.initializeDefaultAutomations();

    this.isRunning = true;
    logger.info('✅ Scheduler Service started successfully');
    logger.info('📅 Running every 5 minutes (WAT timezone)');
    logger.info('🕐 Midnight job scheduled for 12:00 AM daily');
  }

  /**
   * Initialize default system automations if they don't exist
   */
  async initializeDefaultAutomations() {
    try {
      logger.info('🔧 Checking default system automations...');
      
      const automations = await sheetsService.getSheetData('AutomatedMessages');
      
      // Define default automations
      const defaults = [
        {
          AutomationID: 'AUTO_SYS_001',
          Name: 'New Member Welcome',
          Type: 'new_member',
          TriggerTime: 'instant',
          Channel: 'whatsapp,email',
          EmailProvider: 'gmail',
          Subject: 'Welcome to TCC Church!',
          Message: 'Dear {firstName} {lastName},\n\nWelcome to The Champion\'s Church (TCC) family! 🎉\n\nWe are thrilled to have you join our community. Your presence enriches our fellowship, and we look forward to growing together in faith.\n\nIf you have any questions or need assistance, please don\'t hesitate to reach out to us.\n\nGod bless you!\n\nTCC Team',
          Recurring: 'FALSE',
          Enabled: 'TRUE',
          TargetMembers: 'TRUE',
          TargetGuests: 'FALSE',
          TargetVolunteers: 'FALSE',
          CreatedBy: 'SYSTEM',
          CreatedByName: 'System',
          LastRun: '',
          NextRun: '',
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          IsSystem: 'TRUE' // Mark as system automation (non-deletable)
        },
        {
          AutomationID: 'AUTO_SYS_002',
          Name: 'Volunteer Assignment Notification',
          Type: 'volunteer_assignment',
          TriggerTime: 'instant',
          Channel: 'sms',
          EmailProvider: '',
          Subject: '',
          Message: 'Hi {firstName},\n\nYou have been assigned to serve as {roleName} for {groupName} on {assignmentDate}.\n\nThank you for your willingness to serve! 🙌\n\nStatus: {assignmentStatus}\n\nTCC Team',
          Recurring: 'FALSE',
          Enabled: 'TRUE',
          TargetMembers: 'FALSE',
          TargetGuests: 'FALSE',
          TargetVolunteers: 'TRUE',
          CreatedBy: 'SYSTEM',
          CreatedByName: 'System',
          LastRun: '',
          NextRun: '',
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          IsSystem: 'TRUE' // Mark as system automation (non-deletable)
        }
      ];

      // Check which defaults are missing
      const existingAutomationIDs = automations.map(a => a.AutomationID);
      const missingDefaults = defaults.filter(def => !existingAutomationIDs.includes(def.AutomationID));

      // Add missing defaults
      if (missingDefaults.length > 0) {
        logger.info(`📝 Creating ${missingDefaults.length} default system automations...`);
        
        for (const defaultAuto of missingDefaults) {
          const headers = ['AutomationID', 'Name', 'Type', 'TriggerTime', 'Channel', 'EmailProvider', 'Subject', 'Message', 'Recurring', 'Enabled', 'TargetMembers', 'TargetGuests', 'TargetVolunteers', 'CreatedBy', 'CreatedByName', 'LastRun', 'NextRun', 'CreatedAt', 'UpdatedAt', 'IsSystem'];
          const row = headers.map(h => defaultAuto[h] || '');
          await sheetsService.appendSheetData('AutomatedMessages', [row]);
          logger.info(`✅ Created: ${defaultAuto.Name}`);
        }
      } else {
        logger.info('✅ All default system automations already exist');
      }
    } catch (error) {
      logger.error('Error initializing default automations:', error);
      // Don't fail startup if this fails
    }
  }

  /**
   * Stop the scheduler service
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    if (this.midnightJob) {
      this.midnightJob.stop();
    }
    this.isRunning = false;
    logger.info('Scheduler Service stopped');
  }

  /**
   * Get current WAT time
   */
  getCurrentWATTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  }

  /**
   * Load today's scheduled and automated messages at midnight
   */
  async loadTodaysSchedule() {
    try {
      logger.info('📅 Loading today\'s scheduled messages...');
      
      const now = this.getCurrentWATTime();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Load scheduled messages for today
      const scheduledData = await sheetsService.getSheetData('ScheduledMessages');
      this.todaysScheduledMessages = scheduledData.filter(msg => {
        return msg.ScheduleDate === today && 
               (msg.Status === 'pending' || msg.Status === 'scheduled');
      });

      // Load enabled automated messages
      const automatedData = await sheetsService.getSheetData('AutomatedMessages');
      this.todaysAutomatedMessages = automatedData.filter(msg => msg.Enabled === 'TRUE' || msg.Enabled === true);

      logger.info(`✅ Loaded ${this.todaysScheduledMessages.length} scheduled messages for today`);
      logger.info(`✅ Loaded ${this.todaysAutomatedMessages.length} active automated messages`);

      // Check for missed messages (server was down)
      await this.checkMissedMessages();

    } catch (error) {
      logger.error('Error loading today\'s schedule:', error);
    }
  }

  /**
   * Check for messages that should have been sent (server was down)
   */
  async checkMissedMessages() {
    const now = this.getCurrentWATTime();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    for (const message of this.todaysScheduledMessages) {
      if (message.ScheduleTime < currentTime) {
        logger.warn(`⚠️ Missed message detected: ${message.ScheduleID}`);
        logger.info('📤 Sending immediately as per restart policy...');
        await this.sendMessage(message, 'scheduled');
      }
    }
  }

  /**
   * Check and send pending messages every 5 minutes
   */
  async checkAndSendPendingMessages() {
    if (this.isSending) {
      logger.debug('Already processing messages, skipping this cycle');
      return;
    }

    try {
      this.isSending = true;
      const now = this.getCurrentWATTime();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const currentMinute = now.getMinutes();

      logger.debug(`⏰ Checking pending messages at ${currentTime}`);

      // Check scheduled messages
      for (const message of this.todaysScheduledMessages) {
        if (this.shouldSendNow(message.ScheduleTime, currentTime, currentMinute)) {
          await this.sendMessage(message, 'scheduled');
        }
      }

      // Check automated messages (birthdays, events, etc.)
      for (const automation of this.todaysAutomatedMessages) {
        await this.checkAutomatedTriggers(automation, now);
      }

      // Process send queue with rate limiting
      await this.processSendQueue();

    } catch (error) {
      logger.error('Error checking pending messages:', error);
    } finally {
      this.isSending = false;
    }
  }

  /**
   * Determine if message should be sent now
   * Allows 5-minute window to account for cron schedule
   */
  shouldSendNow(scheduleTime, currentTime, currentMinute) {
    const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    // Check if we're within 5 minutes of scheduled time
    const scheduledTotalMinutes = scheduleHour * 60 + scheduleMinute;
    const currentTotalMinutes = currentHour * 60 + currentMin;
    const diff = currentTotalMinutes - scheduledTotalMinutes;

    return diff >= 0 && diff < 5;
  }

  /**
   * Check if automated message should trigger
   */
  async checkAutomatedTriggers(automation, now) {
    try {
      switch (automation.Type) {
        case 'birthday':
          await this.checkBirthdayTriggers(automation, now);
          break;
        case 'event_reminder':
          await this.checkEventReminders(automation, now);
          break;
        case 'guest_welcome':
          await this.checkNewGuests(automation, now);
          break;
        case 'absent_followup':
          await this.checkAbsentMembers(automation, now);
          break;
        case 'volunteer':
          await this.checkVolunteerAssignments(automation, now);
          break;
        case 'anniversary':
          await this.checkAnniversaries(automation, now);
          break;
        case 'donation_thank_you':
          await this.checkDonations(automation, now);
          break;
        default:
          logger.debug(`Unknown automation type: ${automation.Type}`);
      }
    } catch (error) {
      logger.error(`Error checking automation ${automation.AutomationID}:`, error);
    }
  }

  /**
   * Check for birthdays today and send messages
   */
  async checkBirthdayTriggers(automation, now) {
    const today = now.toISOString().split('T')[0];
    const todayMonthDay = today.slice(5); // MM-DD

    // Get all members
    const members = await sheetsService.getSheetData('Members');
    
    // Find members with birthdays today
    const birthdayMembers = members.filter(member => {
      if (!member.dateOfBirth && !member.dOB) return false;
      const dob = member.dateOfBirth || member.dOB;
      const memberMonthDay = dob.slice(5, 10); // MM-DD
      return memberMonthDay === todayMonthDay;
    });

    if (birthdayMembers.length > 0) {
      logger.info(`🎂 Found ${birthdayMembers.length} birthday(s) today`);
      
      // Check if already sent today
      const lastRun = automation.LastRun || '';
      if (lastRun.startsWith(today)) {
        logger.debug('Birthday messages already sent today');
        return;
      }

      // Queue messages for each birthday member
      for (const member of birthdayMembers) {
        const message = this.replacePlaceholders(automation.Message, member);
        const recipient = this.getRecipientContact(member, automation.Channel);
        
        if (recipient) {
          this.sendQueue.push({
            recipient,
            message,
            channel: automation.Channel,
            subject: automation.Subject,
            emailProvider: automation.EmailProvider,
            automationID: automation.AutomationID,
            memberID: member.memberID
          });
        }
      }

      // Update LastRun and NextRun
      await this.updateAutomationRunTime(automation, now);
    }
  }

  /**
   * Check for upcoming events and send reminders
   */
  async checkEventReminders(automation, now) {
    const triggerTime = automation.TriggerTime; // e.g., '24h_before', '48h_before'
    
    // Parse trigger time
    let hoursBeforeEvent = 0;
    if (triggerTime === '24h_before') hoursBeforeEvent = 24;
    else if (triggerTime === '48h_before') hoursBeforeEvent = 48;
    else return;

    const targetDate = new Date(now);
    targetDate.setHours(targetDate.getHours() + hoursBeforeEvent);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Get gatherings for target date
    const gatherings = await sheetsService.getSheetData('Gatherings');
    const upcomingGatherings = gatherings.filter(g => g.gatheringDate === targetDateStr);

    if (upcomingGatherings.length > 0) {
      logger.info(`📅 Found ${upcomingGatherings.length} upcoming event(s)`);
      
      // Get members for each gathering
      for (const gathering of upcomingGatherings) {
        await this.sendEventReminders(automation, gathering);
      }
    }
  }

  /**
   * Send event reminders to group members
   */
  async sendEventReminders(automation, gathering) {
    // Get group members
    const groups = await sheetsService.getSheetData('Groups');
    const group = groups.find(g => g.groupID === gathering.parentID);
    
    if (!group) return;

    const members = await sheetsService.getSheetData('Members');
    const groupMembers = members.filter(m => m.groupID === group.groupID);

    for (const member of groupMembers) {
      const message = this.replacePlaceholders(automation.Message, { 
        ...member, 
        eventName: gathering.gatheringName,
        eventDate: gathering.gatheringDate,
        eventTime: gathering.gatheringTime
      });
      
      const recipient = this.getRecipientContact(member, automation.Channel);
      
      if (recipient) {
        this.sendQueue.push({
          recipient,
          message,
          channel: automation.Channel,
          subject: automation.Subject,
          emailProvider: automation.EmailProvider,
          automationID: automation.AutomationID,
          memberID: member.memberID
        });
      }
    }
  }

  /**
   * Check for new guests and send welcome messages
   */
  async checkNewGuests(automation, now) {
    const today = now.toISOString().split('T')[0];
    const guests = await sheetsService.getSheetData('Guest');
    
    // Find guests added today
    const newGuests = guests.filter(guest => {
      const visitDate = guest.visitDate || guest.dateAdded || '';
      return visitDate.startsWith(today);
    });

    if (newGuests.length > 0) {
      logger.info(`👋 Found ${newGuests.length} new guest(s) today`);
      
      for (const guest of newGuests) {
        const message = this.replacePlaceholders(automation.Message, guest);
        const recipient = this.getRecipientContact(guest, automation.Channel);
        
        if (recipient) {
          this.sendQueue.push({
            recipient,
            message,
            channel: automation.Channel,
            subject: automation.Subject,
            emailProvider: automation.EmailProvider,
            automationID: automation.AutomationID,
            guestID: guest.guestID
          });
        }
      }
    }
  }

  /**
   * Check for absent members (didn't attend recent gatherings)
   */
  async checkAbsentMembers(automation, now) {
    // This would require more complex logic to track attendance
    // Placeholder for now
    logger.debug('Absent member follow-up check not yet implemented');
  }

  /**
   * Check for new volunteer assignments
   */
  async checkVolunteerAssignments(automation, now) {
    // Placeholder for volunteer assignment notifications
    logger.debug('Volunteer assignment check not yet implemented');
  }

  /**
   * Check for anniversaries (membership, marriage, etc.)
   */
  async checkAnniversaries(automation, now) {
    const today = now.toISOString().split('T')[0];
    const todayMonthDay = today.slice(5);

    const members = await sheetsService.getSheetData('Members');
    const anniversaryMembers = members.filter(member => {
      if (!member.joinDate) return false;
      const joinMonthDay = member.joinDate.slice(5, 10);
      return joinMonthDay === todayMonthDay;
    });

    if (anniversaryMembers.length > 0) {
      logger.info(`🎊 Found ${anniversaryMembers.length} anniversary(ies) today`);
      
      for (const member of anniversaryMembers) {
        const yearsOfMembership = now.getFullYear() - new Date(member.joinDate).getFullYear();
        const message = this.replacePlaceholders(automation.Message, { 
          ...member, 
          years: yearsOfMembership 
        });
        const recipient = this.getRecipientContact(member, automation.Channel);
        
        if (recipient) {
          this.sendQueue.push({
            recipient,
            message,
            channel: automation.Channel,
            subject: automation.Subject,
            emailProvider: automation.EmailProvider,
            automationID: automation.AutomationID,
            memberID: member.memberID
          });
        }
      }
    }
  }

  /**
   * Check for recent donations and send thank you messages
   */
  async checkDonations(automation, now) {
    // Placeholder for donation tracking
    logger.debug('Donation thank you check not yet implemented');
  }

  /**
   * Process send queue with rate limiting (25 messages per minute)
   */
  async processSendQueue() {
    if (this.sendQueue.length === 0) return;

    logger.info(`📤 Processing send queue: ${this.sendQueue.length} messages`);

    const batchSize = 25; // 25 messages per minute
    const batch = this.sendQueue.splice(0, batchSize);

    for (const item of batch) {
      await this.sendWithRetry(item);
      // Small delay between sends (60000ms / 25 = 2400ms per message)
      await this.sleep(2400);
    }

    // If more messages remain, they'll be processed in next cycle
    if (this.sendQueue.length > 0) {
      logger.info(`📋 ${this.sendQueue.length} messages remaining in queue`);
    }
  }

  /**
   * Send message with retry logic (3 attempts)
   */
  async sendWithRetry(item, attemptNumber = 1) {
    const maxRetries = 3;
    const retryKey = `${item.automationID || item.scheduleID}_${item.recipient}`;

    try {
      logger.info(`📨 Sending message to ${item.recipient} via ${item.channel} (attempt ${attemptNumber})`);

      // Prepare request based on channel
      const channels = item.channel.split(',').map(c => c.trim());
      
      for (const channel of channels) {
        const requestData = {
          recipientType: 'individual',
          recipients: [item.recipient],
          message: item.message,
          channel: channel
        };

        // Add email-specific fields
        if (channel === 'email') {
          requestData.subject = item.subject || 'Message from TCC CRM';
          requestData.emailProvider = item.emailProvider || 'gmail';
        }

        // Send via communication service
        await communicationService.sendBulkMessage(requestData);
      }

      logger.info(`✅ Message sent successfully to ${item.recipient}`);
      
      // Clear retry tracking
      this.retryQueue.delete(retryKey);

      // Update status if it's a scheduled message
      if (item.scheduleID) {
        await this.updateScheduledMessageStatus(item.scheduleID, 'sent');
      }

      return true;

    } catch (error) {
      logger.error(`❌ Failed to send message (attempt ${attemptNumber}):`, error.message);

      if (attemptNumber < maxRetries) {
        // Retry
        logger.info(`🔄 Retrying... (attempt ${attemptNumber + 1}/${maxRetries})`);
        await this.sleep(5000); // Wait 5 seconds before retry
        return await this.sendWithRetry(item, attemptNumber + 1);
      } else {
        // Max retries reached - log failure
        logger.error(`❌ Max retries reached for ${item.recipient}. Logging failure...`);
        await this.logFailedMessage(item, error.message);
        
        // Notify admins
        await this.notifyAdminsOfFailure(item, error.message);
        
        // Update status if it's a scheduled message
        if (item.scheduleID) {
          await this.updateScheduledMessageStatus(item.scheduleID, 'failed');
        }

        return false;
      }
    }
  }

  /**
   * Send message (for scheduled messages)
   */
  async sendMessage(message, type) {
    const item = {
      scheduleID: message.ScheduleID,
      recipient: message.Recipients,
      message: message.Message,
      channel: message.Channel,
      subject: message.Subject,
      emailProvider: message.EmailProvider
    };

    await this.sendWithRetry(item);

    // Handle recurring messages
    if (message.ScheduleType === 'recurring' && message.Frequency) {
      await this.scheduleNextRecurrence(message);
    }
  }

  /**
   * Schedule next recurrence for recurring messages
   */
  async scheduleNextRecurrence(message) {
    const now = this.getCurrentWATTime();
    let nextRun = new Date(now);

    switch (message.Frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        break;
    }

    const nextRunDate = nextRun.toISOString().split('T')[0];
    
    // Update NextRun and Status in sheet
    await sheetsService.updateSheetRow('ScheduledMessages', message.ScheduleID, {
      NextRun: nextRunDate,
      Status: 'scheduled',
      LastSent: now.toISOString()
    });

    logger.info(`📅 Next recurrence scheduled for ${nextRunDate}`);
  }

  /**
   * Update automation last run time
   */
  async updateAutomationRunTime(automation, now) {
    const today = now.toISOString().split('T')[0];
    let nextRun = today;

    // Calculate next run for recurring automations
    if (automation.Recurring === 'TRUE' || automation.Recurring === true) {
      const nextDate = new Date(now);
      nextDate.setFullYear(nextDate.getFullYear() + 1); // Next year for birthdays/anniversaries
      nextRun = nextDate.toISOString().split('T')[0];
    }

    await sheetsService.updateSheetRow('AutomatedMessages', automation.AutomationID, {
      LastRun: now.toISOString(),
      NextRun: nextRun
    });
  }

  /**
   * Log failed message to FailedAutomations sheet
   */
  async logFailedMessage(item, errorMessage) {
    try {
      const failureRecord = [
        `FAIL-${Date.now()}`, // FailureID
        item.automationID || item.scheduleID || 'unknown',
        item.recipient,
        item.channel,
        errorMessage,
        new Date().toISOString(), // FailedAt
        'pending', // RetryStatus
        0 // RetryCount
      ];

      await sheetsService.appendSheetData('FailedAutomations', [failureRecord]);
      logger.info('📝 Logged failure to FailedAutomations sheet');
    } catch (error) {
      logger.error('Failed to log failure:', error);
    }
  }

  /**
   * Notify admins of message failure via email
   */
  async notifyAdminsOfFailure(item, errorMessage) {
    try {
      // Get admin emails from Staff sheet
      const staff = await sheetsService.getSheetData('Staff');
      const admins = staff.filter(s => s.role === 'Admin' || s.role === 'Super Admin');
      
      if (admins.length === 0) return;

      const adminEmails = admins.map(a => a.email).filter(e => e);
      
      if (adminEmails.length === 0) return;

      const notificationMessage = `
⚠️ AUTOMATED MESSAGE FAILURE ALERT

A scheduled/automated message has failed after 3 retry attempts.

Details:
- Automation/Schedule ID: ${item.automationID || item.scheduleID}
- Recipient: ${item.recipient}
- Channel: ${item.channel}
- Error: ${errorMessage}
- Time: ${new Date().toISOString()}

Please check the FailedAutomations sheet for more details.
      `;

      await communicationService.sendBulkMessage({
        recipientType: 'individual',
        recipients: adminEmails,
        message: notificationMessage,
        channel: 'email',
        subject: '⚠️ TCC CRM - Automated Message Failure Alert',
        emailProvider: 'gmail'
      });

      logger.info('📧 Admin notification sent');
    } catch (error) {
      logger.error('Failed to notify admins:', error);
    }
  }

  /**
   * Update scheduled message status
   */
  async updateScheduledMessageStatus(scheduleID, status) {
    try {
      await sheetsService.updateSheetRow('ScheduledMessages', scheduleID, {
        Status: status,
        UpdatedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update message status:', error);
    }
  }

  /**
   * Replace placeholders in message template
   */
  replacePlaceholders(template, data) {
    let message = template;
    
    // Common placeholders
    const placeholders = {
      '{firstName}': data.firstName || data.first_name || '',
      '{lastName}': data.lastName || data.last_name || '',
      '{fullName}': `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      '{email}': data.email || '',
      '{phone}': data.phoneNumber || data.phone || '',
      '{eventName}': data.eventName || '',
      '{eventDate}': data.eventDate || '',
      '{eventTime}': data.eventTime || '',
      '{years}': data.years || ''
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    return message;
  }

  /**
   * Get recipient contact info based on channel
   */
  getRecipientContact(person, channel) {
    const channels = channel.split(',').map(c => c.trim());
    
    // For now, return email or phone based on primary channel
    if (channels.includes('email')) {
      return person.email;
    } else if (channels.includes('whatsapp') || channels.includes('sms')) {
      return person.phoneNumber || person.phone;
    }
    
    return null;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get pending messages for today
   */
  async getPendingMessagesForToday() {
    const now = this.getCurrentWATTime();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    return this.todaysScheduledMessages.filter(msg => {
      return msg.ScheduleTime >= currentTime && 
             (msg.Status === 'pending' || msg.Status === 'scheduled');
    });
  }

  /**
   * Get pending messages for this week
   */
  async getPendingMessagesForWeek() {
    const now = this.getCurrentWATTime();
    const today = now.toISOString().split('T')[0];
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const endDate = nextWeek.toISOString().split('T')[0];

    const allScheduled = await sheetsService.getSheetData('ScheduledMessages');
    
    return allScheduled.filter(msg => {
      return msg.ScheduleDate >= today && 
             msg.ScheduleDate <= endDate &&
             (msg.Status === 'pending' || msg.Status === 'scheduled');
    });
  }

  /**
   * Trigger automation immediately for a specific event
   * Used for instant notifications when records are created
   * @param {string} automationType - Type of automation to trigger (new_member, volunteer_assignment)
   * @param {object} recipientData - Data about the recipient and event
   */
  async triggerAutomationImmediately(automationType, recipientData) {
    try {
      logger.info(`Triggering immediate automation: ${automationType}`);

      // Get all enabled automations of this type
      const automations = await sheetsService.getSheetData('AutomatedMessages');
      const matchingAutomation = automations.find(auto => 
        auto.Type === automationType && 
        auto.Enabled === 'TRUE'
      );

      if (!matchingAutomation) {
        logger.info(`No active automation found for type: ${automationType}`);
        return { success: false, message: 'No active automation configured' };
      }

      // Prepare message with placeholders
      const message = this.replacePlaceholders(matchingAutomation.Message, recipientData);
      const subject = matchingAutomation.Subject ? 
        this.replacePlaceholders(matchingAutomation.Subject, recipientData) : null;

      // Determine channels
      const channels = matchingAutomation.Channel.split(',').map(c => c.trim());

      // Send to each channel
      const results = [];
      for (const channel of channels) {
        try {
          const requestData = {
            recipients: [recipientData.phoneNumber || recipientData.email],
            message: message,
            subject: subject,
            messageType: channel === 'whatsapp' ? 'WhatsApp' : 
                        channel === 'sms' ? 'SMS' : 'Email',
            emailProvider: matchingAutomation.EmailProvider || 'gmail',
            senderId: 'SYSTEM_AUTO',
            senderName: 'System Automation',
            scheduledDate: null,
            scheduledTime: null
          };

          const result = await communicationService.sendBulkMessage(requestData);
          results.push({ channel, success: true, result });
          
          logger.info(`Sent ${channel} message to ${recipientData.firstName} ${recipientData.lastName}`);
        } catch (error) {
          logger.error(`Failed to send ${channel} message:`, error.message);
          results.push({ channel, success: false, error: error.message });
        }
      }

      // Update LastRun for the automation
      await this.updateAutomationLastRun(matchingAutomation.AutomationID);

      return {
        success: true,
        automation: matchingAutomation.Name,
        results: results
      };

    } catch (error) {
      logger.error('Error triggering immediate automation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update the LastRun timestamp for an automation
   */
  async updateAutomationLastRun(automationID) {
    try {
      const automations = await sheetsService.getSheetData('AutomatedMessages');
      const index = automations.findIndex(a => a.AutomationID === automationID);
      
      if (index !== -1) {
        automations[index].LastRun = new Date().toISOString();
        await sheetsService.updateSheetData('AutomatedMessages', automations);
      }
    } catch (error) {
      logger.error('Error updating automation LastRun:', error);
    }
  }
}

module.exports = new SchedulerService();
