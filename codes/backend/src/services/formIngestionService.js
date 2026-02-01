/**
 * Form Ingestion Service
 * 
 * ARCHITECTURE:
 * Google Forms → FormResponses_* sheets → This service → Entity tables (Members, Guest, etc.)
 * 
 * KEY REQUIREMENTS:
 * - Automatic polling every N minutes (configurable via .env)
 * - Idempotent: (FormType + ResponseSheetName + ResponseRow) uniquely identifies records
 * - Failed ingestions logged but don't block other rows
 * - Kill switch: FORM_INGESTION_ENABLED
 * - Separate spreadsheet for form responses (FORM_RESPONSES_SHEET_ID)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class FormIngestionService {
  constructor() {
    this.MAIN_SHEET_ID = process.env.GOOGLE_SHEET_ID;
    this.FORM_RESPONSES_SHEET_ID = process.env.FORM_RESPONSES_SHEET_ID;
    this.INGESTION_ENABLED = process.env.FORM_INGESTION_ENABLED === 'true';
    this.INTERVAL_MINUTES = parseInt(process.env.FORM_INGESTION_INTERVAL_MINUTES || '30');
    
    this.sheets = null;
    this.pollingInterval = null;

    // Sheet name mappings
    this.FORM_RESPONSE_SHEETS = {
      MEMBERS: process.env.FORM_RESPONSE_MEMBERS || 'FormResponses_Members',
      GUESTS: process.env.FORM_RESPONSE_GUESTS || 'FormResponses_Guests',
      VOLUNTEERS: process.env.FORM_RESPONSE_VOLUNTEERS || 'FormResponses_Volunteers',
      REQUESTS: process.env.FORM_RESPONSE_REQUESTS || 'FormResponses_Requests'
    };

    this.TARGET_SHEETS = {
      MEMBERS: 'Members',
      GUESTS: 'Guest',
      VOLUNTEERS: 'Volunteer',  // CHANGED: Form responses go to Volunteer sheet, NOT VolunteerAssignments
      REQUESTS: 'SupportRequests'
    };
  }

  /**
   * Initialize Google Sheets client
   */
  async initialize() {
    try {
      let credentials;
      
      if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        credentials = JSON.parse(
          Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString('utf8')
        );
      } else {
        const credPath = path.join(__dirname, '../../credentials.json');
        credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Form Ingestion Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Form Ingestion Service:', error.message);
      throw error;
    }
  }

  /**
   * Start automatic polling
   */
  startPolling() {
    if (!this.INGESTION_ENABLED) {
      console.log('⏸️  Form ingestion disabled (FORM_INGESTION_ENABLED=false)');
      return;
    }

    if (this.pollingInterval) {
      console.log('⚠️  Polling already active');
      return;
    }

    console.log(`🔄 Starting automatic form ingestion (every ${this.INTERVAL_MINUTES} minutes)`);
    
    // Run immediately on start
    this.ingestAllForms().catch(err => 
      console.error('❌ Initial ingestion error:', err.message)
    );

    // Then poll at intervals
    this.pollingInterval = setInterval(async () => {
      try {
        await this.ingestAllForms();
      } catch (error) {
        console.error('❌ Polling error:', error.message);
      }
    }, this.INTERVAL_MINUTES * 60 * 1000);
  }

  /**
   * Stop automatic polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️  Stopped automatic form ingestion');
    }
  }

  /**
   * Ingest all form types
   */
  async ingestAllForms() {
    console.log('\n🔄 Starting form ingestion cycle...');
    const timestamp = new Date().toISOString();
    
    const results = {
      timestamp,
      members: { processed: 0, success: 0, failed: 0 },
      guests: { processed: 0, success: 0, failed: 0 },
      volunteers: { processed: 0, success: 0, failed: 0 },
      requests: { processed: 0, success: 0, failed: 0 }
    };

    try {
      // Process each form type
      results.members = await this.ingestMembers();
      results.guests = await this.ingestGuests();
      results.volunteers = await this.ingestVolunteers();
      results.requests = await this.ingestRequests();

      const totalProcessed = results.members.processed + results.guests.processed + 
                            results.volunteers.processed + results.requests.processed;
      const totalSuccess = results.members.success + results.guests.success + 
                          results.volunteers.success + results.requests.success;
      const totalFailed = results.members.failed + results.guests.failed + 
                         results.volunteers.failed + results.requests.failed;

      console.log(`✅ Ingestion cycle complete: ${totalSuccess}/${totalProcessed} successful, ${totalFailed} failed\n`);
      
      return results;
    } catch (error) {
      console.error('❌ Ingestion cycle error:', error.message);
      throw error;
    }
  }

  /**
   * Check if a response has already been ingested
   */
  async isAlreadyIngested(formType, responseSheetName, responseRow) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.MAIN_SHEET_ID,
        range: 'Form_Ingestion_Log!A:F'
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return false; // Only header

      // Check for duplicate (FormType + ResponseSheetName + ResponseRow)
      return rows.slice(1).some(row => 
        row[0] === formType && 
        row[1] === responseSheetName && 
        parseInt(row[2]) === parseInt(responseRow)
      );
    } catch (error) {
      console.error('❌ Error checking ingestion log:', error.message);
      return false; // Allow ingestion if check fails
    }
  }

  /**
   * Log ingestion attempt
   */
  async logIngestion(formType, responseSheetName, responseRow, status, errorMessage = '') {
    try {
      const timestamp = new Date().toISOString();
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.MAIN_SHEET_ID,
        range: 'Form_Ingestion_Log!A:F',
        valueInputOption: 'RAW',
        resource: {
          values: [[
            formType,
            responseSheetName,
            responseRow,
            timestamp,
            status,
            errorMessage
          ]]
        }
      });
    } catch (error) {
      console.error('❌ Error logging ingestion:', error.message);
    }
  }

  /**
   * Generate unique ID following existing formats
   */
  generateId(prefix, type = 'default') {
    if (type === 'member') {
      // MEM-00001, MEM-00002 format
      // Note: In production, should query last ID and increment
      return `MEM-${String(Date.now()).slice(-5)}`;
    } else if (type === 'guest') {
      // GST-20251117-FAAF1 format
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      return `GST-${date}-${random}`;
    } else if (type === 'volunteer') {
      // VOL-00001, VOL-00002 format
      return `VOL-${String(Date.now()).slice(-5)}`;
    } else if (type === 'support') {
      // SR-001, SR-002, SR-003 format
      // Note: In production, should query last ID and increment
      return `SR-${String(Date.now()).slice(-3)}`;
    } else {
      return `${prefix}${Date.now()}`;
    }
  }

  /**
   * Create header-to-index mapping from response sheet
   */
  createHeaderMap(headers) {
    const map = {};
    headers.forEach((header, index) => {
      map[header] = index;
    });
    return map;
  }

  /**
   * Get value from response by header name
   */
  getByHeader(row, headerMap, headerName) {
    const index = headerMap[headerName];
    return (index !== undefined && row[index]) ? row[index] : '';
  }

  /**
   * Validate semantic correctness
   */
  validateSemantics(data, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      if (rule.required && !value) {
        errors.push(`${field} is required but empty`);
        continue;
      }
      
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} has invalid format: "${value}"`);
      }
      
      if (value && rule.enum && !rule.enum.includes(value)) {
        errors.push(`${field} has invalid value: "${value}" (expected: ${rule.enum.join(', ')})`);
      }
    }
    
    return errors;
  }

  /**
   * Ingest Member Registration responses
   * HEADER-BASED MAPPING: No positional indexing, semantic validation
   */
  async ingestMembers() {
    const formType = 'MEMBERS';
    const responseSheetName = this.FORM_RESPONSE_SHEETS.MEMBERS;
    const stats = { processed: 0, success: 0, failed: 0 };

    try {
      // Read form responses with headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.FORM_RESPONSES_SHEET_ID,
        range: `${responseSheetName}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log(`  📋 ${formType}: No new responses`);
        return stats;
      }

      // Create header-to-index mapping (form responses)
      const headers = rows[0];
      const headerMap = this.createHeaderMap(headers);
      console.log(`  📋 ${formType} headers found:`, Object.keys(headerMap));

      // Get target Members sheet headers to align columns (prevents misalignment like Baptism -> CLDS)
      const memberHeadersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.MAIN_SHEET_ID,
        range: `${this.TARGET_SHEETS.MEMBERS}!1:1`
      });
      const memberHeaders = memberHeadersResponse.data.values?.[0] || [];
      const memberHeaderIndex = memberHeaders.reduce((acc, header, idx) => {
        if (header) acc[header.toString().trim().toLowerCase()] = idx;
        return acc;
      }, {});

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1;
        stats.processed++;

        try {
          if (await this.isAlreadyIngested(formType, responseSheetName, rowNumber)) {
            console.log(`  ⏭️  ${formType} row ${rowNumber}: Already ingested`);
            continue;
          }

          const row = rows[i];
          
          /**
           * HEADER-BASED MAPPING - Members
           * Map by exact header names from Google Form
           */
          const formData = {
            FirstName: this.getByHeader(row, headerMap, 'FirstName') || this.getByHeader(row, headerMap, 'First Name'),
            LastName: this.getByHeader(row, headerMap, 'LastName') || this.getByHeader(row, headerMap, 'Last Name') || this.getByHeader(row, headerMap, 'Surname'),
            Email: this.getByHeader(row, headerMap, 'Email') || this.getByHeader(row, headerMap, 'Email Address'),
            PhoneNumber: this.getByHeader(row, headerMap, 'PhoneNumber') || this.getByHeader(row, headerMap, 'Phone Number') || this.getByHeader(row, headerMap, 'Phone'),
            DOB: this.getByHeader(row, headerMap, 'DOB') || this.getByHeader(row, headerMap, 'Date of Birth') || this.getByHeader(row, headerMap, 'DateOfBirth'),
            Gender: this.getByHeader(row, headerMap, 'Gender'),
            State: this.getByHeader(row, headerMap, 'State'),
            LGA: this.getByHeader(row, headerMap, 'LGA') || this.getByHeader(row, headerMap, 'Local Government Area'),
            Address: this.getByHeader(row, headerMap, 'Address') || this.getByHeader(row, headerMap, 'Home Address'),
            EmergencyContact: this.getByHeader(row, headerMap, 'EmergencyContact') || this.getByHeader(row, headerMap, 'Emergency Contact'),
            Baptism: this.getByHeader(row, headerMap, 'Baptism') || this.getByHeader(row, headerMap, 'Baptismal')
          };

          // Semantic validation
          const validationRules = {
            FirstName: { required: true },
            LastName: { required: true },
            Email: { 
              required: true, 
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            PhoneNumber: { 
              required: true, 
              pattern: /^[\d\s\+\-\(\)]{7,20}$/
            },
            Gender: { 
              enum: ['Male', 'Female', 'male', 'female']
            }
          };

          const validationErrors = this.validateSemantics(formData, validationRules);
          
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
          }

          /**
           * Members Sheet Structure (17 columns):
           * [0] MemberID, [1] FirstName, [2] LastName, [3] PhoneNumber, [4] Email,
           * [5] DOB, [6] Gender, [7] State, [8] LGA, [9] Address,
           * [10] FamilyID, [11] Status, [12] JoinDate, [13] MemberType,
           * [14] EmergencyContact, [15] FamilyRole, [16] Baptism
           */
          
          // Format DOB as YYYY-MM-DD to ensure it's stored as date type
          let dobFormatted = formData.DOB;
          if (dobFormatted) {
            try {
              const dobDate = new Date(dobFormatted);
              if (!isNaN(dobDate.getTime())) {
                dobFormatted = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD format
              }
            } catch (e) {
              console.warn(`  ⚠️  Invalid DOB format: ${formData.DOB}`);
            }
          }
          
          const buildMemberRow = () => {
            // Fallback length 17 if headers missing
            const row = Array(memberHeaders.length || 17).fill('');
            const setField = (headerName, value) => {
              const idx = memberHeaderIndex[headerName.toLowerCase()];
              if (idx !== undefined) {
                row[idx] = value ?? '';
              }
            };

            setField('memberid', this.generateId('MEM', 'member'));
            setField('firstname', formData.FirstName);
            setField('lastname', formData.LastName);
            setField('phonenumber', formData.PhoneNumber);
            setField('email', formData.Email);
            setField('dob', dobFormatted);
            setField('gender', formData.Gender);
            setField('state', formData.State);
            setField('lga', formData.LGA);
            setField('address', formData.Address);
            setField('emergencycontact', formData.EmergencyContact);
            setField('baptism', formData.Baptism || '');
            setField('familyid', '');
            setField('status', 'Active');
            setField('joindate', new Date().toISOString().split('T')[0]);
            setField('membertype', 'Regular Member');
            setField('familyrole', '');

            // If headers were empty or didn't include our keys, ensure base structure so we don't append blanks
            if (memberHeaders.length === 0) {
              return [
                this.generateId('MEM', 'member'),
                formData.FirstName,
                formData.LastName,
                formData.PhoneNumber,
                formData.Email,
                dobFormatted,
                formData.Gender,
                formData.State,
                formData.LGA,
                formData.Address,
                '',
                'Active',
                new Date().toISOString().split('T')[0],
                'Regular Member',
                formData.EmergencyContact,
                '',
                formData.Baptism || ''
              ];
            }

            return row;
          };

          const memberData = buildMemberRow();

          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.MAIN_SHEET_ID,
            range: `${this.TARGET_SHEETS.MEMBERS}!A1`,
            valueInputOption: 'USER_ENTERED', // preserve date formatting
            resource: { values: [memberData] }
          });

          await this.logIngestion(formType, responseSheetName, rowNumber, 'SUCCESS');
          stats.success++;
          console.log(`  ✅ ${formType} row ${rowNumber}: Ingested (${formData.FirstName} ${formData.LastName})`);

        } catch (rowError) {
          stats.failed++;
          console.error(`  ❌ ${formType} row ${rowNumber}: ${rowError.message}`);
          await this.logIngestion(formType, responseSheetName, rowNumber, 'FAILED', rowError.message);
        }
      }

      console.log(`  📊 ${formType}: ${stats.success}/${stats.processed} successful, ${stats.failed} failed`);
      return stats;

    } catch (error) {
      console.error(`❌ Error ingesting ${formType}:`, error.message);
      return stats;
    }
  }

  /**
   * Ingest Guest Registration responses
   * HEADER-BASED MAPPING: No positional indexing, semantic validation
   */
  async ingestGuests() {
    const formType = 'GUESTS';
    const responseSheetName = this.FORM_RESPONSE_SHEETS.GUESTS;
    const stats = { processed: 0, success: 0, failed: 0 };

    try {
      // Read form responses with headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.FORM_RESPONSES_SHEET_ID,
        range: `${responseSheetName}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log(`  📋 ${formType}: No new responses`);
        return stats;
      }

      // Create header-to-index mapping
      const headers = rows[0];
      const headerMap = this.createHeaderMap(headers);
      console.log(`  📋 ${formType} headers found:`, Object.keys(headerMap));

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1;
        stats.processed++;

        try {
          if (await this.isAlreadyIngested(formType, responseSheetName, rowNumber)) {
            console.log(`  ⏭️  ${formType} row ${rowNumber}: Already ingested`);
            continue;
          }

          const row = rows[i];
          
          /**
           * HEADER-BASED MAPPING - Guests
           * Map by exact header names from Google Form
           * IGNORE: "Would you like to receive updates?" and all metadata
           */
          const formData = {
            Name: this.getByHeader(row, headerMap, 'Name') || this.getByHeader(row, headerMap, 'Full Name') || this.getByHeader(row, headerMap, 'Guest Name'),
            Phone: this.getByHeader(row, headerMap, 'Phone') || this.getByHeader(row, headerMap, 'Phone Number') || this.getByHeader(row, headerMap, 'PhoneNumber'),
            Email: this.getByHeader(row, headerMap, 'Email') || this.getByHeader(row, headerMap, 'Email Address')
          };

          // Semantic validation
          const validationRules = {
            Name: { required: true },
            Phone: { 
              required: true, 
              pattern: /^[\d\s\+\-\(\)]{7,20}$/
            },
            Email: { 
              required: true, 
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
          };

          const validationErrors = this.validateSemantics(formData, validationRules);
          
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
          }

          /**
           * Guest Sheet Structure (5 columns):
           * [0] GuestID, [1] Name, [2] Phone, [3] Email, [4] Date
           */
          const guestData = [
            this.generateId('GST', 'guest'),            // [0] GuestID - AUTO
            formData.Name,                              // [1] Name - FORM
            formData.Phone,                             // [2] Phone - FORM
            formData.Email,                             // [3] Email - FORM
            new Date().toISOString().split('T')[0]      // [4] Date - AUTO (YYYY-MM-DD format)
          ];

          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.MAIN_SHEET_ID,
            range: 'Guest!A:E',
            valueInputOption: 'USER_ENTERED', // Changed from 'RAW' to preserve date formatting
            resource: { values: [guestData] }
          });

          await this.logIngestion(formType, responseSheetName, rowNumber, 'SUCCESS');
          stats.success++;
          console.log(`  ✅ ${formType} row ${rowNumber}: Ingested (${formData.Name})`);

        } catch (rowError) {
          stats.failed++;
          console.error(`  ❌ ${formType} row ${rowNumber}: ${rowError.message}`);
          await this.logIngestion(formType, responseSheetName, rowNumber, 'FAILED', rowError.message);
        }
      }

      console.log(`  📊 ${formType}: ${stats.success}/${stats.processed} successful, ${stats.failed} failed`);
      return stats;

    } catch (error) {
      console.error(`❌ Error ingesting ${formType}:`, error.message);
      return stats;
    }
  }

  /**
   * Ingest Volunteer Signup responses
   * HEADER-BASED MAPPING: Routes to Volunteer sheet (NOT VolunteerAssignments)
   */
  async ingestVolunteers() {
    const formType = 'VOLUNTEERS';
    const responseSheetName = this.FORM_RESPONSE_SHEETS.VOLUNTEERS;
    const stats = { processed: 0, success: 0, failed: 0 };

    try {
      // Read form responses with headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.FORM_RESPONSES_SHEET_ID,
        range: `${responseSheetName}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log(`  📋 ${formType}: No new responses`);
        return stats;
      }

      // Create header-to-index mapping
      const headers = rows[0];
      const headerMap = this.createHeaderMap(headers);
      console.log(`  📋 ${formType} headers found:`, Object.keys(headerMap));

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1;
        stats.processed++;

        try {
          if (await this.isAlreadyIngested(formType, responseSheetName, rowNumber)) {
            console.log(`  ⏭️  ${formType} row ${rowNumber}: Already ingested`);
            continue;
          }

          const row = rows[i];
          
          /**
           * HEADER-BASED MAPPING - Volunteers
           * Map by exact header names from Google Form
           * NOTE: Availability comes from multiple checkbox columns - concatenate them
           */
          const formData = {
            FullName: this.getByHeader(row, headerMap, 'Name') || this.getByHeader(row, headerMap, 'Full Name') || this.getByHeader(row, headerMap, 'FullName'),
            PhoneNumber: this.getByHeader(row, headerMap, 'Phone Number') || this.getByHeader(row, headerMap, 'Phone') || this.getByHeader(row, headerMap, 'PhoneNumber'),
            Email: this.getByHeader(row, headerMap, 'Email') || this.getByHeader(row, headerMap, 'Email Address'),
            DepartmentOfInterest: this.getByHeader(row, headerMap, 'Which department(s) are you interested in volunteering for?') || this.getByHeader(row, headerMap, 'Department of Interest') || this.getByHeader(row, headerMap, 'DepartmentOfInterest') || this.getByHeader(row, headerMap, 'Department'),
            Availability: ''  // Will concatenate from multiple columns
          };

          // Concatenate availability from multiple checkbox columns
          const availabilityColumns = Object.keys(headerMap).filter(key => key.includes('Please indicate your availability'));
          const availabilities = availabilityColumns
            .map(col => this.getByHeader(row, headerMap, col))
            .filter(val => val && val.trim() !== '')
            .join('; ');
          formData.Availability = availabilities || 'Not Specified';

          // Semantic validation
          const validationRules = {
            FullName: { required: true },
            PhoneNumber: { 
              required: true, 
              pattern: /^[\d\s\+\-\(\)]{7,20}$/
            },
            Email: { 
              required: true, 
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }
          };

          const validationErrors = this.validateSemantics(formData, validationRules);
          
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
          }

          /**
           * Volunteer Sheet Structure (6 columns):
           * [0] VolunteerID, [1] FullName, [2] PhoneNumber, [3] Email,
           * [4] DepartmentOfInterest, [5] Availability, [6] Date
           */
          const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          const volunteerData = [
            this.generateId('VOL', 'volunteer'), // [0] VolunteerID - AUTO
            formData.FullName,                   // [1] FullName - FORM
            formData.PhoneNumber,                // [2] PhoneNumber - FORM
            formData.Email,                      // [3] Email - FORM
            formData.DepartmentOfInterest,       // [4] DepartmentOfInterest - FORM
            formData.Availability,               // [5] Availability - FORM
            currentDate,                         // [6] Date - AUTO (YYYY-MM-DD)
            'Scheduled'                          // [7] Status - AUTO (default)
          ];

          // ⚠️ CRITICAL: Route to Volunteer sheet (NOT VolunteerAssignments)
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.MAIN_SHEET_ID,
            range: 'Volunteer!A:H',
            valueInputOption: 'RAW',
            resource: { values: [volunteerData] }
          });

          await this.logIngestion(formType, responseSheetName, rowNumber, 'SUCCESS');
          stats.success++;
          console.log(`  ✅ ${formType} row ${rowNumber}: Ingested (${formData.FullName})`);

        } catch (rowError) {
          stats.failed++;
          console.error(`  ❌ ${formType} row ${rowNumber}: ${rowError.message}`);
          await this.logIngestion(formType, responseSheetName, rowNumber, 'FAILED', rowError.message);
        }
      }

      console.log(`  📊 ${formType}: ${stats.success}/${stats.processed} successful, ${stats.failed} failed`);
      return stats;

    } catch (error) {
      console.error(`❌ Error ingesting ${formType}:`, error.message);
      return stats;
    }
  }

  /**
   * Ingest Prayer Request responses
   * HEADER-BASED MAPPING: Correct field names (Requestor not Requester)
   */
  async ingestRequests() {
    const formType = 'REQUESTS';
    const responseSheetName = this.FORM_RESPONSE_SHEETS.REQUESTS;
    const stats = { processed: 0, success: 0, failed: 0 };

    try {
      // Read form responses with headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.FORM_RESPONSES_SHEET_ID,
        range: `${responseSheetName}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        console.log(`  📋 ${formType}: No new responses`);
        return stats;
      }

      // Create header-to-index mapping
      const headers = rows[0];
      const headerMap = this.createHeaderMap(headers);
      console.log(`  📋 ${formType} headers found:`, Object.keys(headerMap));

      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const rowNumber = i + 1;
        stats.processed++;

        try {
          if (await this.isAlreadyIngested(formType, responseSheetName, rowNumber)) {
            console.log(`  ⏭️  ${formType} row ${rowNumber}: Already ingested`);
            continue;
          }

          const row = rows[i];
          
          /**
           * HEADER-BASED MAPPING - SupportRequests
           * Map by exact header names from Google Form
           * IGNORE: FollowUp, Confidentiality flags, etc.
           */
          const formData = {
            RequestorName: this.getByHeader(row, headerMap, 'Name') || this.getByHeader(row, headerMap, 'Your Name') || this.getByHeader(row, headerMap, 'RequestorName') || this.getByHeader(row, headerMap, 'FullName'),
            RequestorContact: this.getByHeader(row, headerMap, 'Phone') || this.getByHeader(row, headerMap, 'Contact Number') || this.getByHeader(row, headerMap, 'Phone Number'),
            RequestorEmail: this.getByHeader(row, headerMap, 'Email') || this.getByHeader(row, headerMap, 'Email Address') || this.getByHeader(row, headerMap, 'Your Email'),
            RequestCategory: this.getByHeader(row, headerMap, 'Request Category') || this.getByHeader(row, headerMap, 'Category') || this.getByHeader(row, headerMap, 'Type of Request') || this.getByHeader(row, headerMap, 'RequestType') || 'Prayer Request',
            RequestDetails: this.getByHeader(row, headerMap, 'Details') || this.getByHeader(row, headerMap, 'Request Details') || this.getByHeader(row, headerMap, 'Description') || this.getByHeader(row, headerMap, 'Message')
          };

          // Semantic validation
          const validationRules = {
            RequestorName: { required: true },
            RequestorContact: { 
              required: true, 
              pattern: /^[\d\s\+\-\(\)]{7,20}$/
            },
            RequestorEmail: { 
              required: true, 
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            RequestCategory: { required: true }
          };

          const validationErrors = this.validateSemantics(formData, validationRules);
          
          if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
          }

          /**
           * SupportRequests Sheet Structure (9 columns):
           * [0] RequestID, [1] MemberID, [2] RequestorName, [3] RequestorContact,
           * [4] Email, [5] RequestCategory, [6] RequestDetails,
           * [7] RequestStatus, [8] AssignedTo
           */
          const requestData = [
            this.generateId('SR', 'support'),    // [0] RequestID - AUTO
            '',                                  // [1] MemberID - BLANK
            formData.RequestorName,              // [2] RequestorName - FORM
            formData.RequestorContact,           // [3] RequestorContact - FORM
            formData.RequestorEmail,             // [4] Email - FORM
            formData.RequestCategory,            // [5] RequestCategory - FORM
            formData.RequestDetails,             // [6] RequestDetails - FORM
            'Open',                              // [7] RequestStatus - AUTO
            ''                                   // [8] AssignedTo - BLANK
          ];

          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.MAIN_SHEET_ID,
            range: 'SupportRequests!A:I',
            valueInputOption: 'RAW',
            resource: { values: [requestData] }
          });

          await this.logIngestion(formType, responseSheetName, rowNumber, 'SUCCESS');
          stats.success++;
          console.log(`  ✅ ${formType} row ${rowNumber}: Ingested (${formData.RequestorName})`);

        } catch (rowError) {
          stats.failed++;
          console.error(`  ❌ ${formType} row ${rowNumber}: ${rowError.message}`);
          await this.logIngestion(formType, responseSheetName, rowNumber, 'FAILED', rowError.message);
        }
      }

      console.log(`  📊 ${formType}: ${stats.success}/${stats.processed} successful, ${stats.failed} failed`);
      return stats;

    } catch (error) {
      console.error(`❌ Error ingesting ${formType}:`, error.message);
      return stats;
    }
  }

  /**
   * Manual trigger for specific form type
   */
  async ingestFormType(formType) {
    const upperType = formType.toUpperCase();
    
    switch (upperType) {
      case 'MEMBERS':
        return await this.ingestMembers();
      case 'GUESTS':
        return await this.ingestGuests();
      case 'VOLUNTEERS':
        return await this.ingestVolunteers();
      case 'REQUESTS':
        return await this.ingestRequests();
      default:
        throw new Error(`Unknown form type: ${formType}`);
    }
  }
}

module.exports = new FormIngestionService();
