/**
 * Template Service
 * Handles template-based communication system
 * 
 * PROVIDERS (SIMPLIFIED):
 * - SMS: BulkSMS Nigeria only
 * - WhatsApp: Meta WhatsApp Cloud API (template-based only)
 * - Email: Gmail SMTP only
 */

const sheetsService = require('./sheetsService');
const { generateId } = require('../utils/idGenerator');
const { logger } = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

class TemplateService {
  constructor() {
    this.sheetName = sheetsService.SHEETS.COMMUNICATION_TEMPLATES;
  }

  /**
   * Get all active templates
   */
  async getAllTemplates() {
    try {
      const templates = await sheetsService.getSheetObjects(this.sheetName);
      return templates.filter(t => t.isActive === 'TRUE');
    } catch (error) {
      logger.error('Error fetching templates', { error: error.message });
      throw new ApiError(500, 'Failed to fetch templates');
    }
  }

  /**
   * Get templates by channel
   */
  async getTemplatesByChannel(channel) {
    try {
      const templates = await this.getAllTemplates();
      return templates.filter(t => t.channel.toLowerCase() === channel.toLowerCase());
    } catch (error) {
      logger.error('Error fetching templates by channel', { error: error.message });
      throw error;
    }
  }

  /**
   * Get templates by audience type
   */
  async getTemplatesByAudience(audienceType) {
    try {
      const templates = await this.getAllTemplates();
      return templates.filter(
        t => t.audienceType === audienceType || t.audienceType === 'all'
      );
    } catch (error) {
      logger.error('Error fetching templates by audience', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateID) {
    try {
      const templates = await sheetsService.getSheetObjects(this.sheetName);
      const template = templates.find(t => t.templateID === templateID);
      
      if (!template) {
        throw new ApiError(404, `Template ${templateID} not found`);
      }

      if (template.isActive === 'FALSE') {
        throw new ApiError(400, `Template ${templateID} is inactive`);
      }

      return template;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error fetching template by ID', { error: error.message });
      throw new ApiError(500, 'Failed to fetch template');
    }
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content) {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * Replace variables in template content
   */
  replaceVariables(content, values) {
    return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return values[variable] !== undefined ? values[variable] : match;
    });
  }

  /**
   * Validate required variables are provided
   */
  validateVariables(template, providedValues) {
    const requiredVars = template.variables
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    const missing = requiredVars.filter(
      v => !providedValues[v] || providedValues[v].trim() === ''
    );
    
    if (missing.length > 0) {
      throw new ApiError(
        400,
        `Missing required variables: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Validate WhatsApp template requirements
   * WhatsApp REQUIRES an approved template ID from Meta
   */
  validateWhatsAppTemplate(template) {
    if (template.channel.toLowerCase() === 'whatsapp') {
      if (!template.whatsAppTemplateID || template.whatsAppTemplateID.trim() === '') {
        throw new ApiError(
          400,
          'WhatsApp messages require an approved template ID. Please get your template approved by Meta Business first.'
        );
      }
    }
  }

  /**
   * Render template with provided values
   * Returns: { subject, message, channel }
   */
  async renderTemplate(templateID, values) {
    try {
      const template = await this.getTemplateById(templateID);
      
      // Validate WhatsApp requirements
      this.validateWhatsAppTemplate(template);
      
      // Validate all variables are provided
      this.validateVariables(template, values);
      
      // Replace variables
      const message = this.replaceVariables(template.messageContent, values);
      const subject = template.subject 
        ? this.replaceVariables(template.subject, values)
        : '';
      
      return {
        subject,
        message,
        channel: template.channel,
        whatsAppTemplateID: template.whatsAppTemplateID,
        category: template.category
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error rendering template', { error: error.message });
      throw new ApiError(500, 'Failed to render template');
    }
  }

  /**
   * Create new template
   */
  async createTemplate(data, createdBy) {
    try {
      const templateID = generateId('TMPL');
      
      const template = {
        templateID,
        templateName: data.templateName,
        channel: data.channel,
        subject: data.subject || '',
        messageContent: data.messageContent,
        variables: data.variables || '',
        category: data.category || 'general',
        audienceType: data.audienceType || 'all',
        isActive: 'TRUE',
        whatsAppTemplateID: data.whatsAppTemplateID || '',
        createdBy: createdBy,
        createdByName: data.createdByName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: data.notes || ''
      };

      // Auto-extract variables if not provided
      if (!template.variables) {
        const extractedVars = this.extractVariables(template.messageContent);
        template.variables = extractedVars.join(',');
      }

      await sheetsService.appendRows(this.sheetName, [template]);
      
      logger.info('Template created', { templateID, name: template.templateName });
      return template;
    } catch (error) {
      logger.error('Error creating template', { error: error.message });
      throw new ApiError(500, 'Failed to create template');
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateID, updates) {
    try {
      const templates = await sheetsService.getSheetObjects(this.sheetName);
      const index = templates.findIndex(t => t.templateID === templateID);
      
      if (index === -1) {
        throw new ApiError(404, `Template ${templateID} not found`);
      }

      const updated = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Auto-update variables if content changed
      if (updates.messageContent) {
        const extractedVars = this.extractVariables(updated.messageContent);
        updated.variables = extractedVars.join(',');
      }

      templates[index] = updated;

      const headers = Object.keys(templates[0]);
      const rows = [
        headers,
        ...templates.map(t => headers.map(h => t[h] || ''))
      ];

      await sheetsService.updateSheetData(this.sheetName, rows);
      sheetsService.invalidateCache(this.sheetName);

      logger.info('Template updated', { templateID });
      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Error updating template', { error: error.message });
      throw new ApiError(500, 'Failed to update template');
    }
  }

  /**
   * Deactivate template (soft delete)
   */
  async deactivateTemplate(templateID) {
    try {
      return await this.updateTemplate(templateID, { isActive: 'FALSE' });
    } catch (error) {
      logger.error('Error deactivating template', { error: error.message });
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    try {
      const templates = await sheetsService.getSheetObjects(this.sheetName);
      
      const stats = {
        total: templates.length,
        active: templates.filter(t => t.isActive === 'TRUE').length,
        inactive: templates.filter(t => t.isActive === 'FALSE').length,
        byChannel: {
          sms: templates.filter(t => t.channel === 'sms').length,
          whatsapp: templates.filter(t => t.channel === 'whatsapp').length,
          email: templates.filter(t => t.channel === 'email').length
        },
        byCategory: {},
        whatsappReady: templates.filter(
          t => t.channel === 'whatsapp' && t.whatsAppTemplateID && t.whatsAppTemplateID.trim() !== ''
        ).length
      };

      // Count by category
      templates.forEach(t => {
        const cat = t.category || 'general';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting template stats', { error: error.message });
      throw new ApiError(500, 'Failed to get template statistics');
    }
  }
}

module.exports = new TemplateService();
