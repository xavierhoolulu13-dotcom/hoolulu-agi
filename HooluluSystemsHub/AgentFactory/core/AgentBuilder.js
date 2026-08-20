/**
 * Agent Builder - Responsible for building agent instances
 */

const { v4: uuidv4 } = require('uuid');

class AgentBuilder {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Build an agent from template
   * @param {Object} template - Agent template
   * @param {Object} config - Agent configuration
   * @returns {Object} Agent instance
   */
  async build(template, config) {
    // Validate template
    this.validateTemplate(template);

    // Validate configuration
    this.validateConfig(config, template.requiredConfig);

    // Build agent
    const agent = {
      id: config.id || uuidv4(),
      templateId: template.id,
      name: config.name,
      description: config.description || template.description,
      version: '1.0.0',
      status: 'created',
      capabilities: this.mergeCapabilities(template.capabilities, config.capabilities),
      config: {
        ...template.config,
        ...config,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: config.createdBy || 'system',
      },
      state: {
        active: false,
        deployed: false,
        deploymentId: null,
      },
    };

    return agent;
  }

  /**
   * Validate template
   */
  validateTemplate(template) {
    if (!template || typeof template !== 'object') {
      throw new Error('Invalid template: template must be an object');
    }

    if (!template.id) {
      throw new Error('Invalid template: missing id');
    }

    if (!template.name) {
      throw new Error('Invalid template: missing name');
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(config, requiredFields = []) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config: config must be an object');
    }

    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Invalid config: missing required field ${field}`);
      }
    }
  }

  /**
   * Merge capabilities from template and config
   */
  mergeCapabilities(templateCapabilities = [], configCapabilities = []) {
    const merged = new Set([...templateCapabilities]);

    if (Array.isArray(configCapabilities)) {
      configCapabilities.forEach(cap => merged.add(cap));
    }

    return Array.from(merged);
  }
}

module.exports = AgentBuilder;
