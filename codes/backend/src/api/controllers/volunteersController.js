/**
 * Volunteers Controller
 * Handles volunteer operations (form submissions from Volunteer sheet)
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { ApiError } = require('../../middlewares/errorHandler');

class VolunteersController extends BaseController {
  constructor() {
    super(
      sheetsService,
      sheetsService.SHEETS.VOLUNTEER,
      'Volunteers'
    );
  }

  getSearchFields() {
    return ['fullName', 'email', 'phoneNumber'];
  }

  getDefaultHeaders() {
    return [
      'VolunteerID',
      'FullName',
      'PhoneNumber',
      'Email',
      'DepartmentOfInterest',
      'Availability',
    ];
  }

  getIdColumn() {
    return 'VolunteerID';
  }

  /**
   * Get all volunteers from Volunteer sheet (form submissions)
   */
  async getAll(req, res) {
    try {
      // Get all volunteers from sheet
      const volunteers = await this.sheetsService.getSheetObjects(this.sheetName);
      
      res.json({
        success: true,
        data: volunteers,
        total: volunteers.length,
      });
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      throw new ApiError('Failed to fetch volunteers', 500);
    }
  }
}

module.exports = new VolunteersController();
