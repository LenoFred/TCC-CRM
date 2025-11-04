/**
 * Base Controller
 * Provides common CRUD operations that can be extended by entity-specific controllers
 */

const { ApiError } = require('../../middlewares/errorHandler');
const { paginate, searchFilter } = require('../../utils/helpers');
const { logAudit } = require('../../utils/logger');

class BaseController {
  constructor(sheetsService, sheetName, entityName) {
    this.sheetsService = sheetsService;
    this.sheetName = sheetName;
    this.entityName = entityName;
  }

  /**
   * Get all records with optional pagination and search
   * GET /api/entity?page=1&limit=10&search=term
   */
  async getAll(req, res) {
    const { page, limit, search, ...filters } = req.query;

    // Get all data
    let data = await this.sheetsService.getSheetObjects(this.sheetName);
    
    // LOG: Show what we read from sheets (for debugging Members status issue)
    if (this.sheetName === 'Members' && data.length > 0) {
      console.log('=== READING MEMBERS FROM SHEETS ===');
      console.log('First member ALL FIELDS:', Object.keys(data[0]));
      console.log('First member RAW:', JSON.stringify(data[0], null, 2));
      console.log('First member has status field:', 'status' in data[0]);
      console.log('First member has memberStatus field:', 'memberStatus' in data[0]);
      console.log('First member status value:', data[0].status);
      console.log('First member memberStatus value:', data[0].memberStatus);
      
      // Also log MEM-00003 specifically
      const mem003 = data.find(m => m.memberID === 'MEM-00003');
      if (mem003) {
        console.log('=== MEM-00003 SPECIFICALLY ===');
        console.log('MEM-00003 ALL FIELDS:', Object.keys(mem003));
        console.log('MEM-00003 status:', mem003.status);
        console.log('MEM-00003 memberStatus:', mem003.memberStatus);
        console.log('MEM-00003 lGA:', mem003.lGA);
      }
    }

    // Apply search if provided
    if (search) {
      const searchFields = this.getSearchFields();
      data = searchFilter(data, search, searchFields);
    }

    // Apply custom filters
    data = this.applyFilters(data, filters);

    // Apply pagination if requested
    if (page || limit) {
      const result = paginate(data, page, limit);
      return res.json(result);
    }

    res.json({
      success: true,
      data,
      total: data.length,
    });
  }

  /**
   * Get single record by ID
   * GET /api/entity/:id
   */
  async getById(req, res) {
    const { id } = req.params;

    const data = await this.sheetsService.getSheetObjects(this.sheetName);
    const record = data.find(item => this.matchId(item, id));

    if (!record) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    res.json({
      success: true,
      data: record,
    });
  }

  /**
   * Create new record
   * POST /api/entity
   */
  async create(req, res) {
    const createData = await this.prepareCreateData(req.body, req.user);

    // Get headers
    const sheetData = await this.sheetsService.getSheetData(this.sheetName);
    const headers = sheetData[0] || this.getDefaultHeaders();

    // Create row from data
    const row = headers.map(header => {
      const camelKey = header.charAt(0).toLowerCase() + header.slice(1);
      return createData[camelKey] !== undefined 
        ? createData[camelKey] 
        : (createData[header] || '');
    });

    // Append to sheet
    await this.sheetsService.appendSheetData(this.sheetName, [row]);

    // Log audit
    logAudit('CREATE', req.user?.userId, this.entityName, createData.id, {
      data: createData,
    });

    res.status(201).json({
      success: true,
      message: `${this.entityName} created successfully`,
      data: createData,
    });
  }

  /**
   * Update existing record
   * PATCH /api/entity/:id
   */
  async update(req, res) {
    const { id } = req.params;
    const updates = req.body;

    const idColumn = this.getIdColumn();
    const success = await this.sheetsService.updateRow(
      this.sheetName,
      idColumn,
      id,
      updates
    );

    if (!success) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    // Log audit
    logAudit('UPDATE', req.user?.userId, this.entityName, id, {
      updates,
    });

    res.json({
      success: true,
      message: `${this.entityName} updated successfully`,
    });
  }

  /**
   * Delete record
   * DELETE /api/entity/:id
   */
  async delete(req, res) {
    const { id } = req.params;

    const sheetData = await this.sheetsService.getSheetData(this.sheetName);
    
    if (sheetData.length === 0) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    const idColumn = this.getIdColumn();
    const idIndex = headers.findIndex(h => 
      h.toLowerCase() === idColumn.toLowerCase()
    );

    if (idIndex === -1) {
      throw new ApiError('ID column not found', 500);
    }

    const rowIndex = rows.findIndex(row => row[idIndex] === id);

    if (rowIndex === -1) {
      throw new ApiError(`${this.entityName} not found`, 404);
    }

    // Remove the row
    rows.splice(rowIndex, 1);

    // Update sheet
    await this.sheetsService.updateSheetData(this.sheetName, [headers, ...rows]);

    // Log audit
    logAudit('DELETE', req.user?.userId, this.entityName, id);

    res.json({
      success: true,
      message: `${this.entityName} deleted successfully`,
    });
  }

  // ============================================
  // Methods to be overridden by child classes
  // ============================================

  /**
   * Get fields to search in
   * Override in child class
   */
  getSearchFields() {
    return [];
  }

  /**
   * Get default headers if sheet is empty
   * Override in child class
   */
  getDefaultHeaders() {
    return [];
  }

  /**
   * Get ID column name
   * Override in child class
   */
  getIdColumn() {
    return 'ID';
  }

  /**
   * Match record ID (handles different ID formats)
   * Override if needed
   */
  matchId(record, id) {
    const idColumn = this.getIdColumn();
    const camelKey = idColumn.charAt(0).toLowerCase() + idColumn.slice(1);
    return record[camelKey] === id || record[idColumn] === id;
  }

  /**
   * Prepare data for creation (add ID, timestamps, etc.)
   * Override in child class
   */
  async prepareCreateData(data, user) {
    return {
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: user?.userId || '',
    };
  }

  /**
   * Apply custom filters to data
   * Override in child class for entity-specific filters
   */
  applyFilters(data, filters) {
    return data;
  }
}

module.exports = BaseController;
