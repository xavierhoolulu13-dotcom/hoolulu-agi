/**
 * Agent Template Manager - Manages agent templates and configurations
 */

class AgentTemplateManager {
  constructor(config = {}) {
    this.config = config;
    this.templates = new Map();
  }

  /**
   * Initialize template manager
   */
  async initialize() {
    console.log('[TemplateManager] Initializing...');
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Create custom template
   */
  async createTemplate(templateConfig) {
    const template = {
      id: templateConfig.id,
      name: templateConfig.name,
      description: templateConfig.description,
      capabilities: templateConfig.capabilities || [],
      config: templateConfig.config || {},
      requiredConfig: templateConfig.requiredConfig || [],
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    this.templates.set(template.id, template);

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updates) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const updated = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.templates.set(templateId, updated);

    return updated;
  }

  /**
   * List all templates
   */
  async listTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId) {
    return this.templates.delete(templateId);
  }
}

module.exports = AgentTemplateManager;
