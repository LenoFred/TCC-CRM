/**
 * Gatherings Controller
 * Handles gathering/service operations (worship services, prayer meetings, etc.)
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');
const { filterByGroupPermissions, hasAccessToGroup } = require('../../middlewares/groupPermissions');

class GatheringsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.GATHERINGS, 'Gatherings');
  }

  /**
   * Override getAll to filter by group permissions
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all data
    let gatheringsData = await sheetsService.getSheetObjects(this.sheetName);
    
    // Filter by group permissions (gatherings have parentID = groupID)
    gatheringsData = filterByGroupPermissions(gatheringsData, req, 'parentID');

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      const searchLower = search.toLowerCase();
      gatheringsData = gatheringsData.filter((gathering) =>
        searchFields.some((field) =>
          gathering[field]?.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply custom filters
    gatheringsData = this.applyFilters(gatheringsData, filters);

    // Apply pagination if requested
    if (page || limit) {
      const pageNum = parseInt(page) || 1;
      const pageSize = parseInt(limit) || 10;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      return res.json({
        success: true,
        data: gatheringsData.slice(startIndex, endIndex),
        total: gatheringsData.length,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(gatheringsData.length / pageSize),
      });
    }

    res.json({
      success: true,
      data: gatheringsData,
      total: gatheringsData.length,
    });
  }

  /**
   * Override create to validate group access
   */
  async create(req, res) {
    const { parentID } = req.body;
    
    // Check if staff has access to this group
    if (parentID && !hasAccessToGroup(req, parentID)) {
      throw new ApiError(403, `You do not have access to create gatherings for this group (${parentID}). You can only create gatherings for your assigned groups.`);
    }
    
    return super.create(req, res);
  }

  /**
   * Override update to validate group access
   */
  async update(req, res) {
    const { id } = req.params;
    
    // Get the gathering to check its parentID
    const gatherings = await sheetsService.getSheetObjects(this.sheetName);
    const gathering = gatherings.find(g => g.gatheringID === id || g.id === id);
    
    if (!gathering) {
      throw new ApiError(404, 'Gathering not found');
    }
    
    // Check if staff has access to this group
    if (gathering.parentID && !hasAccessToGroup(req, gathering.parentID)) {
      throw new ApiError(403, `You do not have access to modify gatherings for this group (${gathering.parentID}). You can only modify gatherings for your assigned groups.`);
    }
    
    // If updating parentID, check access to new group
    if (req.body.parentID && req.body.parentID !== gathering.parentID && !hasAccessToGroup(req, req.body.parentID)) {
      throw new ApiError(403, `You do not have access to move gatherings to this group (${req.body.parentID}). You can only work with your assigned groups.`);
    }
    
    return super.update(req, res);
  }

  /**
   * Override delete to validate group access
   */
  async delete(req, res) {
    const { id } = req.params;
    
    // Get the gathering to check its parentID
    const gatherings = await sheetsService.getSheetObjects(this.sheetName);
    const gathering = gatherings.find(g => g.gatheringID === id || g.id === id);
    
    if (!gathering) {
      throw new ApiError(404, 'Gathering not found');
    }
    
    // Check if staff has access to this group
    if (gathering.parentID && !hasAccessToGroup(req, gathering.parentID)) {
      throw new ApiError(403, `You do not have access to delete gatherings for this group (${gathering.parentID}). You can only delete gatherings for your assigned groups.`);
    }
    
    return super.delete(req, res);
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
      'ClassType',
      'SessionNumber',
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

    // Validate that ParentID exists in Groups
    if (data.parentID) {
      const groups = await sheetsService.getSheetObjects(sheetsService.SHEETS.GROUPS);
      const group = groups.find((g) => g.groupID === data.parentID);
      
      if (!group) {
        throw new ApiError('Parent Group ID not found', 404);
      }
    }

    const normalizedClassType = (data.classType || data.ClassType || 'Other').toString().trim() || 'Other';

    // Compute next session number scoped to group + class type
    const existingGatherings = await sheetsService.getSheetObjects(this.sheetName);
    const siblings = existingGatherings.filter(
      (g) =>
        g.parentID === data.parentID &&
        (g.classType || g.ClassType || 'Other').toString().toLowerCase() === normalizedClassType.toLowerCase()
    );
    const nextSessionNumber =
      (siblings
        .map((g) => parseInt(g.sessionNumber ?? g.SessionNumber ?? '', 10))
        .filter((n) => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0) || 0) + 1;

    return {
      gatheringID: generateId('GATHERING'),
      gatheringName: data.gatheringName,
      gatheringType: data.gatheringType || '',
      parentID: data.parentID,
      gatheringDate: data.gatheringDate,
      gatheringTime: data.gatheringTime || '',
      classType: normalizedClassType,
      sessionNumber: String(nextSessionNumber),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.gatheringType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.classType) {
      filteredData = filteredData.filter(
        (item) => item.classType?.toLowerCase() === filters.classType.toLowerCase()
      );
    }

    if (filters.sessionNumber) {
      filteredData = filteredData.filter(
        (item) => (item.sessionNumber || '').toString() === filters.sessionNumber.toString()
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
