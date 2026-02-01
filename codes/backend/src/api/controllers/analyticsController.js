/**
 * Analytics Controller
 * Handles custom report generation, data filtering, and analytics
 */

const sheetsService = require('../../services/sheetsService');

class AnalyticsController {
  constructor() {
    this.sheetsService = sheetsService;
    
    // Map of sheet names to their actual Google Sheets names
    this.sheetMapping = {
      'members': 'Members',
      'families': 'Families',
      'groups': 'Groups',
      'groupMembers': 'GroupMembers',
      'gatherings': 'Gatherings',
      'attendance': 'Attendance',
      'donations': 'Donations',
      'guests': 'Guest',
      'volunteerRoles': 'VolunteerRoles',
      'volunteerAssignments': 'VolunteerAssignments',
      'supportRequests': 'SupportRequests',
      'staff': 'Staff',
      'staffPermissions': 'StaffPermissions',
      'logs': 'Logs'
    };
    
    // Define column schemas for each sheet
    this.sheetSchemas = {
      'Members': [
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'FirstName', type: 'string', label: 'First Name' },
        { name: 'LastName', type: 'string', label: 'Last Name' },
        { name: 'PhoneNumber', type: 'string', label: 'Phone Number' },
        { name: 'Email', type: 'string', label: 'Email' },
        { name: 'DOB', type: 'date', label: 'Date of Birth' },
        { name: 'Gender', type: 'string', label: 'Gender' },
        { name: 'State', type: 'string', label: 'State' },
        { name: 'LGA', type: 'string', label: 'LGA' },
        { name: 'Address', type: 'string', label: 'Address' },
        { name: 'FamilyID', type: 'string', label: 'Family ID' },
        { name: 'Status', type: 'string', label: 'Status' },
        { name: 'JoinDate', type: 'date', label: 'Join Date' },
        { name: 'MemberType', type: 'string', label: 'Member Type' },
        { name: 'EmergencyContact', type: 'string', label: 'Emergency Contact' },
        { name: 'FamilyRole', type: 'string', label: 'Family Role' },
        { name: 'CLDS', type: 'string', label: 'CLDS' },
        { name: 'Baptism', type: 'string', label: 'Baptism' },
        { name: 'GBIC', type: 'string', label: 'GBIC' },
        { name: 'ABIC', type: 'string', label: 'ABIC' },
        { name: 'MembershipLevel', type: 'string', label: 'Membership Level' }
      ],
      'Families': [
        { name: 'FamilyID', type: 'string', label: 'Family ID' },
        { name: 'FamilyName', type: 'string', label: 'Family Name' },
        { name: 'CreatedDate', type: 'date', label: 'Created Date' }
      ],
      'Groups': [
        { name: 'GroupID', type: 'string', label: 'Group ID' },
        { name: 'GroupName', type: 'string', label: 'Group Name' },
        { name: 'GroupType', type: 'string', label: 'Group Type' },
        { name: 'LeaderMemberID', type: 'string', label: 'Leader Member ID' },
        { name: 'AsstLeaderID', type: 'string', label: 'Assistant Leader ID' },
        { name: 'PastorID', type: 'string', label: 'Pastor ID' },
        { name: 'classType', type: 'string', label: 'Class Type' },
        { name: 'sessionNumber', type: 'string', label: 'Session Number' },
        { name: 'Status', type: 'string', label: 'Status' },
        { name: 'MeetingLocation', type: 'string', label: 'Meeting Location' },
        { name: 'Description', type: 'string', label: 'Description' }
      ],
      'GroupMembers': [
        { name: 'GroupMemberID', type: 'string', label: 'Group Member ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'GroupID', type: 'string', label: 'Group ID' },
        { name: 'Status', type: 'string', label: 'Status' }
      ],
      'Gatherings': [
        { name: 'GatheringID', type: 'string', label: 'Gathering ID' },
        { name: 'GatheringName', type: 'string', label: 'Gathering Name' },
        { name: 'GatheringType', type: 'string', label: 'Gathering Type' },
        { name: 'ParentID', type: 'string', label: 'Parent ID' },
        { name: 'GatheringDate', type: 'date', label: 'Gathering Date' },
        { name: 'GatheringTime', type: 'string', label: 'Gathering Time' }
      ],
      'Attendance': [
        { name: 'AttendanceID', type: 'string', label: 'Attendance ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'GatheringID', type: 'string', label: 'Gathering ID' }
      ],
      'Donations': [
        { name: 'DonationID', type: 'string', label: 'Donation ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'Amount', type: 'number', label: 'Amount' },
        { name: 'DonationDate', type: 'date', label: 'Donation Date' },
        { name: 'Fund', type: 'string', label: 'Fund' },
        { name: 'PayDate', type: 'date', label: 'Pay Date' },
        { name: 'Status', type: 'string', label: 'Status' }
      ],
      'Guest': [
        { name: 'GuestID', type: 'string', label: 'Guest ID' },
        { name: 'Name', type: 'string', label: 'Name' },
        { name: 'Phone', type: 'string', label: 'Phone' },
        { name: 'Email', type: 'string', label: 'Email' }
      ],
      'VolunteerRoles': [
        { name: 'RoleID', type: 'string', label: 'Role ID' },
        { name: 'RoleName', type: 'string', label: 'Role Name' },
        { name: 'Description', type: 'string', label: 'Description' }
      ],
      'VolunteerAssignments': [
        { name: 'AssignmentID', type: 'string', label: 'Assignment ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'GroupID', type: 'string', label: 'Group ID' },
        { name: 'RoleID', type: 'string', label: 'Role ID' },
        { name: 'AssignmentStatus', type: 'string', label: 'Assignment Status' },
        { name: 'AssignmentDate', type: 'date', label: 'Assignment Date' }
      ],
      'SupportRequests': [
        { name: 'RequestID', type: 'string', label: 'Request ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'RequestorName', type: 'string', label: 'Requestor Name' },
        { name: 'RequestorContact', type: 'string', label: 'Requestor Contact' },
        { name: 'RequestCategory', type: 'string', label: 'Request Category' },
        { name: 'RequestDetails', type: 'string', label: 'Request Details' },
        { name: 'RequestStatus', type: 'string', label: 'Request Status' },
        { name: 'AssignedTo', type: 'string', label: 'Assigned To' }
      ],
      'Staff': [
        { name: 'StaffID', type: 'string', label: 'Staff ID' },
        { name: 'MemberID', type: 'string', label: 'Member ID' },
        { name: 'JobTitle', type: 'string', label: 'Job Title' },
        { name: 'AppointmentDate', type: 'date', label: 'Appointment Date' },
        { name: 'SalaryInfo', type: 'string', label: 'Salary Info' }
      ],
      'StaffPermissions': [
        { name: 'PermissionID', type: 'string', label: 'Permission ID' },
        { name: 'StaffMemberID', type: 'string', label: 'Staff Member ID' },
        { name: 'PermissionKey', type: 'string', label: 'Permission Key' },
        { name: 'HasAccess', type: 'string', label: 'Has Access' }
      ],
      'Logs': [
        { name: 'LogID', type: 'string', label: 'Log ID' },
        { name: 'TableName', type: 'string', label: 'Table Name' },
        { name: 'RecordID', type: 'string', label: 'Record ID' },
        { name: 'CreatedAt', type: 'date', label: 'Created At' },
        { name: 'UpdatedAt', type: 'date', label: 'Updated At' }
      ]
    };
  }

  /**
   * Get available columns for a specific sheet
   */
  async getSheetColumns(req, res) {
    try {
      const { sheetName } = req.params;
      const actualSheetName = this.sheetMapping[sheetName] || sheetName;
      
      const columns = this.sheetSchemas[actualSheetName];
      
      if (!columns) {
        return res.status(404).json({
          success: false,
          message: `Sheet '${sheetName}' not found`
        });
      }
      
      res.json({
        success: true,
        data: columns
      });
    } catch (error) {
      console.error('Error getting sheet columns:', error);
      throw error;
    }
  }

  /**
   * Apply filters to data
   */
  applyFilters(data, filters) {
    if (!filters || filters.length === 0) {
      console.log('   No filters provided, returning all data');
      return data;
    }

    console.log(`   Filtering ${data.length} records with ${filters.length} filter(s)`);
    
    return data.filter(row => {
      const rowMatches = filters.every(filter => {
        const { field, operator, value } = filter;
        
        // Find the actual field name in the row (case-insensitive)
        const actualField = Object.keys(row).find(key => key.toLowerCase() === field.toLowerCase()) || field;
        const cellValue = row[actualField];
        
        console.log(`   - Checking filter: field="${field}", actualField="${actualField}", operator="${operator}", value="${value}", cellValue="${cellValue}"`);
        
        if (cellValue === undefined || cellValue === null) {
          const matches = operator === 'is_empty';
          console.log(`     Cell is null/undefined, matches=${matches}`);
          return matches;
        }

        const cellStr = String(cellValue).toLowerCase();
        const valueStr = String(value).toLowerCase();

        let matches = false;
        switch (operator) {
          case 'equals':
            matches = cellStr === valueStr;
            break;
          case 'not_equals':
            matches = cellStr !== valueStr;
            break;
          case 'contains':
            matches = cellStr.includes(valueStr);
            break;
          case 'not_contains':
            matches = !cellStr.includes(valueStr);
            break;
          case 'starts_with':
            matches = cellStr.startsWith(valueStr);
            break;
          case 'ends_with':
            matches = cellStr.endsWith(valueStr);
            break;
          case 'is_empty':
            matches = cellStr === '' || cellStr === 'null';
            break;
          case 'is_not_empty':
            matches = cellStr !== '' && cellStr !== 'null';
            break;
          
          // Number operators
          case 'greater_than':
            matches = Number(cellValue) > Number(value);
            break;
          case 'less_than':
            matches = Number(cellValue) < Number(value);
            break;
          case 'greater_equals':
            matches = Number(cellValue) >= Number(value);
            break;
          case 'less_equals':
            matches = Number(cellValue) <= Number(value);
            break;
          
          // Date operators
          case 'after':
            matches = new Date(cellValue) > new Date(value);
            break;
          case 'before':
            matches = new Date(cellValue) < new Date(value);
            break;
          case 'between':
            // Value should be "date1,date2"
            const [date1, date2] = valueStr.split(',');
            const cellDate = new Date(cellValue);
            matches = cellDate >= new Date(date1) && cellDate <= new Date(date2);
            break;
          
          default:
            matches = true;
        }
        
        console.log(`     Result: ${matches}`);
        return matches;
      });
      
      console.log(`   Row matches all filters: ${rowMatches}`);
      return rowMatches;
    });
  }

  /**
   * Generate custom report with filters
   */
  async generateReport(req, res) {
    try {
      const { dataSource, filters, outputFields, limit } = req.body;
      
      console.log('=== ANALYTICS REPORT DEBUG ===');
      console.log('1. Request:', { dataSource, filters, outputFields, limit });
      
      if (!dataSource) {
        return res.status(400).json({
          success: false,
          message: 'Data source is required'
        });
      }

      // Get actual sheet name
      const actualSheetName = this.sheetMapping[dataSource] || dataSource;
      console.log('2. Sheet mapping:', { dataSource, actualSheetName });
      
      // Fetch data from sheet
      const sheetData = await this.sheetsService.getSheetObjects(actualSheetName);
      console.log(`3. Fetched ${sheetData.length} records from ${actualSheetName}`);
      
      if (sheetData.length > 0) {
        console.log('4. Sample record keys:', Object.keys(sheetData[0]));
        console.log('5. Sample record:', sheetData[0]);
      }
      
      // Apply filters
      console.log('6. Applying filters:', filters);
      const filteredData = this.applyFilters(sheetData, filters);
      console.log(`7. After filtering: ${filteredData.length} records`);
      
      // Select only requested fields if specified (case-insensitive)
      let resultData = filteredData;
      if (outputFields && outputFields.length > 0) {
        resultData = filteredData.map(row => {
          const filteredRow = {};
          outputFields.forEach(field => {
            // Find actual field name (case-insensitive)
            const actualField = Object.keys(row).find(key => key.toLowerCase() === field.toLowerCase()) || field;
            if (row.hasOwnProperty(actualField)) {
              filteredRow[field] = row[actualField]; // Use requested field name as key
            }
          });
          return filteredRow;
        });
      }
      
      // Apply limit if specified
      if (limit && limit > 0) {
        resultData = resultData.slice(0, limit);
      }
      
      res.json({
        success: true,
        data: resultData,
        total: filteredData.length,
        returned: resultData.length
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(req, res) {
    try {
      const stats = {};
      let membersData = [];

      // Get counts for each sheet
      for (const [key, sheetName] of Object.entries(this.sheetMapping)) {
        try {
          const data = await this.sheetsService.getSheetObjects(sheetName);
          if (sheetName === 'Members') {
            membersData = data;
          }
          stats[key] = {
            total: data.length,
            sheetName: sheetName
          };
        } catch (error) {
          console.error(`Error getting stats for ${sheetName}:`, error.message);
          stats[key] = {
            total: 0,
            sheetName: sheetName,
            error: error.message
          };
        }
      }

      // Onboarding summary for quick dashboard metrics
      if (membersData.length > 0) {
        const normalize = (val) => (val || '').toString().trim().toLowerCase();
        const onboardingSummary = {
          totalMembers: membersData.length,
          registeredMembers: membersData.filter(m => normalize(m.membershipLevel) === 'registered member').length,
          members: membersData.filter(m => normalize(m.membershipLevel) !== 'registered member').length,
          cldsCompleted: membersData.filter(m => normalize(m.CLDS) === 'completed').length,
          baptismDone: membersData.filter(m => normalize(m.Baptism) === 'done').length,
          gbicCompleted: membersData.filter(m => normalize(m.GBIC) === 'completed').length,
          abicCompleted: membersData.filter(m => normalize(m.ABIC) === 'completed').length,
        };
        stats.onboarding = onboardingSummary;
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting summary stats:', error);
      throw error;
    }
  }

  /**
   * Export report data to CSV
   */
  async exportReport(req, res) {
    try {
      const { data, fileName } = req.body;
      
      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data to export'
        });
      }

      // Get headers from first row
      const headers = Object.keys(data[0]);
      
      // Convert to CSV
      const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'report'}.csv"`);
      res.send(csvContent);
      
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsController();
