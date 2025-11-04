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
      'EventID',
      'GatheringName',
      'GatheringType',
      'Date',
      'StartTime',
      'EndTime',
      'Location',
      'ExpectedAttendance',
      'ActualAttendance',
      'Status',
      'Notes',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'GatheringID';
  }

  async prepareCreateData(data, user) {
    // Validate date and times
    const gatheringDate = new Date(data.date);
    if (isNaN(gatheringDate.getTime())) {
      throw new ApiError(400, 'Invalid date');
    }

    // If eventID is provided, validate it exists
    if (data.eventID) {
      const events = await sheetsService.getSheetObjects(sheetsService.SHEETS.EVENTS);
      const event = events.find((e) => e.eventID === data.eventID);
      if (!event) {
        throw new ApiError(404, 'Event not found');
      }
    }

    return {
      gatheringID: generateId('GATH'),
      eventID: data.eventID || '',
      gatheringName: data.gatheringName,
      gatheringType: data.gatheringType || 'Service',
      date: data.date,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      location: data.location || '',
      expectedAttendance: data.expectedAttendance || '',
      actualAttendance: data.actualAttendance || '0',
      status: data.status || 'Scheduled',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.gatheringType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.eventID) {
      filteredData = filteredData.filter((item) => item.eventID === filters.eventID);
    }

    // Date range filters
    if (filters.startDate) {
      const filterStartDate = new Date(filters.startDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= filterStartDate;
      });
    }

    if (filters.endDate) {
      const filterEndDate = new Date(filters.endDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate <= filterEndDate;
      });
    }

    return filteredData;
  }

  /**
   * Get gatherings by event
   */
  async getByEvent(req, res) {
    const { eventID } = req.params;

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const gatherings = data.filter((g) => g.eventID === eventID);

    res.json({
      eventID,
      total: gatherings.length,
      gatherings,
    });
  }

  /**
   * Update attendance count
   */
  async updateAttendance(req, res) {
    const { id } = req.params;
    const { actualAttendance } = req.body;

    if (!actualAttendance || isNaN(parseInt(actualAttendance))) {
      throw new ApiError(400, 'Valid attendance count is required');
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const gathering = data.find((g) => this.matchId(g, id));

    if (!gathering) {
      throw new ApiError(404, 'Gathering not found');
    }

    const updated = {
      ...gathering,
      actualAttendance: actualAttendance.toString(),
      updatedAt: new Date().toISOString(),
    };

    await this.updateInSheet(gathering, updated, data, req.user);

    res.json({
      message: 'Attendance updated successfully',
      data: updated,
    });
  }

  /**
   * Get gathering statistics
   */
  async getStats(req, res) {
    const data = await sheetsService.getSheetObjects(this.sheetName);
    const today = new Date().toISOString().split('T')[0];

    const totalGatherings = data.length;
    const upcomingGatherings = data.filter((g) => g.date >= today).length;
    const pastGatherings = data.filter((g) => g.date < today).length;

    // Calculate average attendance
    const gatheringsWithAttendance = data.filter(
      (g) => g.actualAttendance && parseInt(g.actualAttendance) > 0
    );
    const totalAttendance = gatheringsWithAttendance.reduce(
      (sum, g) => sum + parseInt(g.actualAttendance || 0),
      0
    );
    const avgAttendance =
      gatheringsWithAttendance.length > 0
        ? totalAttendance / gatheringsWithAttendance.length
        : 0;

    // Type distribution
    const typeDistribution = {};
    data.forEach((gathering) => {
      const type = gathering.gatheringType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      totalGatherings,
      upcomingGatherings,
      pastGatherings,
      avgAttendance: Math.round(avgAttendance),
      totalAttendance,
      typeDistribution,
    });
  }
}

module.exports = new GatheringsController();
