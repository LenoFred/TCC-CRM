/**
 * Events Controller
 * Handles all event-related operations
 */

const BaseController = require('./baseController');
const sheetsService = require('../../services/sheetsService');
const { generateId } = require('../../utils/idGenerator');
const { ApiError } = require('../../middlewares/errorHandler');

class EventsController extends BaseController {
  constructor() {
    super(sheetsService, sheetsService.SHEETS.EVENTS, 'Events');
  }

  getSearchFields() {
    return ['eventName', 'eventType', 'description', 'location'];
  }

  getDefaultHeaders() {
    return [
      'EventID',
      'EventName',
      'EventType',
      'Description',
      'StartDate',
      'EndDate',
      'Location',
      'Organizer',
      'Status',
      'CreatedAt',
      'UpdatedAt',
    ];
  }

  getIdColumn() {
    return 'EventID';
  }

  async prepareCreateData(data, user) {
    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (isNaN(startDate.getTime())) {
      throw new ApiError(400, 'Invalid start date');
    }

    if (endDate && isNaN(endDate.getTime())) {
      throw new ApiError(400, 'Invalid end date');
    }

    if (endDate && endDate < startDate) {
      throw new ApiError(400, 'End date cannot be before start date');
    }

    return {
      eventID: generateId('EVT'),
      eventName: data.eventName,
      eventType: data.eventType || 'General',
      description: data.description || '',
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      location: data.location || '',
      organizer: data.organizer || user?.memberID || '',
      status: data.status || 'Planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  applyFilters(data, filters) {
    let filteredData = data;

    if (filters.type) {
      filteredData = filteredData.filter(
        (item) => item.eventType?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(
        (item) => item.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.organizer) {
      filteredData = filteredData.filter(
        (item) => item.organizer === filters.organizer
      );
    }

    // Date range filters
    if (filters.startDate) {
      const filterStartDate = new Date(filters.startDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.startDate);
        return itemDate >= filterStartDate;
      });
    }

    if (filters.endDate) {
      const filterEndDate = new Date(filters.endDate);
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.startDate);
        return itemDate <= filterEndDate;
      });
    }

    return filteredData;
  }

  /**
   * Get upcoming events
   */
  async getUpcoming(req, res) {
    const { limit = 10 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const upcomingEvents = data
      .filter(
        (event) =>
          event.startDate >= today &&
          event.status?.toLowerCase() !== 'cancelled'
      )
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, parseInt(limit));

    res.json({
      total: upcomingEvents.length,
      events: upcomingEvents,
    });
  }

  /**
   * Get past events
   */
  async getPast(req, res) {
    const { limit = 10 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const pastEvents = data
      .filter((event) => event.endDate < today)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
      .slice(0, parseInt(limit));

    res.json({
      total: pastEvents.length,
      events: pastEvents,
    });
  }

  /**
   * Get events by date range
   */
  async getByDateRange(req, res) {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid date format');
    }

    if (end < start) {
      throw new ApiError(400, 'End date cannot be before start date');
    }

    const data = await sheetsService.getSheetObjects(this.sheetName);
    const events = data.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (
        (eventStart >= start && eventStart <= end) ||
        (eventEnd >= start && eventEnd <= end) ||
        (eventStart <= start && eventEnd >= end)
      );
    });

    res.json({
      startDate,
      endDate,
      total: events.length,
      events,
    });
  }

  /**
   * Get event statistics
   */
  async getStats(req, res) {
    const data = await sheetsService.getSheetObjects(this.sheetName);
    const today = new Date().toISOString().split('T')[0];

    const totalEvents = data.length;
    const upcomingEvents = data.filter(
      (e) => e.startDate >= today && e.status?.toLowerCase() !== 'cancelled'
    ).length;
    const pastEvents = data.filter((e) => e.endDate < today).length;
    const cancelledEvents = data.filter(
      (e) => e.status?.toLowerCase() === 'cancelled'
    ).length;

    // Event types distribution
    const typeDistribution = {};
    data.forEach((event) => {
      const type = event.eventType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    res.json({
      totalEvents,
      upcomingEvents,
      pastEvents,
      cancelledEvents,
      typeDistribution,
    });
  }
}

module.exports = new EventsController();
