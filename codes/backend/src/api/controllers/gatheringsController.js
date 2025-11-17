/**
 * Gatherings Controller
 * Handles gathering/service operations (worship services, prayer meetings, etc.)
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class GatheringsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.GATHERINGS, 'Gatherings');
  }

  getSearchFields() {
    return ['gatheringName', 'gatheringType', 'location'];
  }

  getDefaultHeaders() {
    return [
      'GatheringID',
      'GatheringName',
      'GatheringType',
      'ParentID',
      'GatheringDate',
      'GatheringTime',
    ];
  }

  getIdColumn() {
    return 'GatheringID';
  }

  async prepareCreateData(data, user) {
    // Validate required fields
    if (!data.gatheringName) {
      throw new ApiError('Gathering name is required', 400);
    }

    if (!data.parentID) {
      throw new ApiError('ParentID (EventID or GroupID) is required', 400);
    }

    if (!data.gatheringDate) {
      throw new ApiError('Gathering date is required', 400);
    }

    // Validate date format
    const gatheringDate = new Date(data.gatheringDate);
    if (isNaN(gatheringDate.getTime())) {
      throw new ApiError('Invalid gathering date', 400);
    }

    // Validate that ParentID exists (either as Event or Group)
    if (data.parentID) {
      // Try to find in Events first
      const events = await sheetsService.getSheetObjects(sheetsService.SHEETS.EVENTS);
      const event = events.find((e) => e.eventID === data.parentID);
      
      if (!event) {
        // If not found in events, try Groups
        const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
        const group = groups.find((g) => g.groupID === data.parentID);
        
        if (!group) {
          throw new ApiError('Parent ID not found in Events or Groups', 404);
        }
      }
    }

    return {
      gatheringID: generateId('GATHERING'),
      gatheringName: data.gatheringName,
      gatheringType: data.gatheringType || '',
      parentID: data.parentID,
      gatheringDate: data.gatheringDate,
      gatheringTime: data.gatheringTime || '',
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.gatheringType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.parentID) {
      filteredData = filteredData.filter((item) => item.parentID === filters.parentID);
    }

    // Date range filters
    if (filters.startDate) {
      const filterStartDate = new Date(filters.startDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.gatheringDate);
        return itemDate >= filterStartDate;
      });
    }

    if (filters.endDate) {
      const filterEndDate = new Date(filters.endDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.gatheringDate);
        return itemDate <= filterEndDate;
      });
    }

    return filteredData;
  }

  /**
   * Get gatherings by parent (Event or Group)
   */
  async getByParent(req, res) {
    const { parentID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const gatherings = data.filter((g) => g.parentID === parentID);

    res.json({
      success: true,
      parentID,
      total: gatherings.length,
      data: gatherings,
    });
  }

  /**
   * Get gatherings by group
   */
  async getByGroup(req, res) {
    const { groupID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const gatherings = data.filter((g) => g.parentID === groupID);

    res.json({
      success: true,
      groupID,
      total: gatherings.length,
      data: gatherings,
    });
  }

  /**
   * Get gathering statistics
   */
  async getStats(req, res) {
    const data = await sheetsService.getSheetObjects(this.sheetName);
    const today = new Date().toISOString().split('T')[0];

    const totalGatherings = data.length;
    const upcomingGatherings = data.filter((g) => g.gatheringDate >= today).length;
    const pastGatherings = data.filter((g) => g.gatheringDate < today).length;

    // Type distribution
    const typeDistribution = {};
    data.forEach((gathering) => {
      const type = gathering.gatheringType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalGatherings,
        upcomingGatherings,
        pastGatherings,
        typeDistribution,
      },
    });
  }
}

module.exports = new GatheringsController();
