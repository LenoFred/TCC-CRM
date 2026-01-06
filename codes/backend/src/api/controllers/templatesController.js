/**
 * Templates Controller
 * Handles Communication_Templates CRUD operations
 */

const BaseController = require('./baseController');
const templateService = require('../../services/templateService');
const { ApiError } = require('../../middlewares/errorHandler');

class TemplatesController extends BaseController {
  constructor() {
    super(null, null, 'Templates');
  }

  /**
   * Get all active templates
   */
  async getAll(req, res) {
    const templates = await templateService.getAllTemplates();
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  }

  /**
   * Get templates by channel
   */
  async getByChannel(req, res) {
    const { channel } = req.params;
    
    if (!['sms', 'whatsapp', 'email'].includes(channel.toLowerCase())) {
      throw new ApiError(400, 'Invalid channel. Must be: sms, whatsapp, or email');
    }

    const templates = await templateService.getTemplatesByChannel(channel);
    res.json({
      success: true,
      channel,
      count: templates.length,
      data: templates
    });
  }

  /**
   * Get templates by audience
   */
  async getByAudience(req, res) {
    const { audience } = req.params;
    
    if (!['members', 'guests', 'volunteers', 'all'].includes(audience.toLowerCase())) {
      throw new ApiError(400, 'Invalid audience. Must be: members, guests, volunteers, or all');
    }

    const templates = await templateService.getTemplatesByAudience(audience);
    res.json({
      success: true,
      audience,
      count: templates.length,
      data: templates
    });
  }

  /**
   * Get single template by ID
   */
  async getById(req, res) {
    const { id } = req.params;
    const template = await templateService.getTemplateById(id);
    
    res.json({
      success: true,
      data: template
    });
  }

  /**
   * Create new template
   */
  async create(req, res) {
    const data = req.body;
    const createdBy = req.user?.memberID || req.body.createdBy || 'UNKNOWN';
    
    // Validation
    if (!data.templateName) {
      throw new ApiError(400, 'Template name is required');
    }
    if (!data.channel || !['sms', 'whatsapp', 'email'].includes(data.channel.toLowerCase())) {
      throw new ApiError(400, 'Valid channel is required (sms, whatsapp, email)');
    }
    if (!data.messageContent) {
      throw new ApiError(400, 'Message content is required');
    }

    // WhatsApp validation
    if (data.channel.toLowerCase() === 'whatsapp' && !data.whatsAppTemplateID) {
      throw new ApiError(
        400,
        'WhatsApp templates require a WhatsAppTemplateID from Meta Business'
      );
    }

    const template = await templateService.createTemplate(data, createdBy);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  }

  /**
   * Update template
   */
  async update(req, res) {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow changing template ID
    delete updates.templateID;
    delete updates.createdBy;
    delete updates.createdByName;
    delete updates.createdAt;

    const template = await templateService.updateTemplate(id, updates);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  }

  /**
   * Deactivate template
   */
  async deactivate(req, res) {
    const { id } = req.params;
    const template = await templateService.deactivateTemplate(id);
    
    res.json({
      success: true,
      message: 'Template deactivated successfully',
      data: template
    });
  }

  /**
   * Render template with variables (preview)
   */
  async renderPreview(req, res) {
    const { id } = req.params;
    const { variables } = req.body;

    if (!variables || typeof variables !== 'object') {
      throw new ApiError(400, 'Variables object is required');
    }

    const rendered = await templateService.renderTemplate(id, variables);
    
    res.json({
      success: true,
      data: rendered
    });
  }

  /**
   * Get template statistics
   */
  async getStats(req, res) {
    const stats = await templateService.getTemplateStats();
    
    res.json({
      success: true,
      data: stats
    });
  }
}

module.exports = new TemplatesController();
