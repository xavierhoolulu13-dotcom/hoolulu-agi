/**
 * Agent Capability Manager - Manages agent capabilities and skills
 */

class AgentCapabilityManager {
  constructor(config = {}) {
    this.config = config;
    this.capabilities = new Map();
    this.skillRegistry = new Map();
  }

  /**
   * Initialize capability manager
   */
  async initialize() {
    // Load default capabilities
    this.registerDefaultCapabilities();
  }

  /**
   * Register default capabilities
   */
  registerDefaultCapabilities() {
    const defaults = [
      {
        id: 'reasoning',
        name: 'Reasoning',
        description: 'Ability to reason and think through complex problems',
      },
      {
        id: 'task-execution',
        name: 'Task Execution',
        description: 'Ability to execute defined tasks',
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis',
        description: 'Ability to analyze and interpret data',
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Ability to communicate with other agents',
      },
      {
        id: 'automation',
        name: 'Automation',
        description: 'Ability to automate repetitive tasks',
      },
      {
        id: 'coordination',
        name: 'Coordination',
        description: 'Ability to coordinate between multiple entities',
      },
      {
        id: 'learning',
        name: 'Learning',
        description: 'Ability to learn from data and interactions',
      },
      {
        id: 'scheduling',
        name: 'Scheduling',
        description: 'Ability to schedule and manage tasks',
      },
      {
        id: 'reporting',
        name: 'Reporting',
        description: 'Ability to generate and provide reports',
      },
      {
        id: 'orchestration',
        name: 'Orchestration',
        description: 'Ability to orchestrate complex workflows',
      },
    ];

    defaults.forEach(cap => {
      this.capabilities.set(cap.id, {
        ...cap,
        skills: [],
        enabled: true,
        metadata: {
          registeredAt: new Date().toISOString(),
        },
      });
    });
  }

  /**
   * Assign capabilities to an agent
   */
  async assignCapabilities(agentId, capabilityIds = []) {
    const assignedCapabilities = [];

    for (const capId of capabilityIds) {
      const capability = this.capabilities.get(capId);

      if (!capability) {
        console.warn(`Capability not found: ${capId}`);
        continue;
      }

      assignedCapabilities.push({
        capabilityId: capId,
        agentId,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
      });
    }

    return assignedCapabilities;
  }

  /**
   * Add a skill to a capability
   */
  registerSkill(capabilityId, skill) {
    const capability = this.capabilities.get(capabilityId);

    if (!capability) {
      throw new Error(`Capability not found: ${capabilityId}`);
    }

    const skillEntry = {
      id: skill.id || `${capabilityId}-${Date.now()}`,
      name: skill.name,
      description: skill.description,
      handler: skill.handler,
      enabled: skill.enabled !== false,
      metadata: skill.metadata || {},
    };

    capability.skills.push(skillEntry);

    return skillEntry;
  }

  /**
   * Get capability details
   */
  getCapability(capabilityId) {
    return this.capabilities.get(capabilityId);
  }

  /**
   * List all capabilities
   */
  listCapabilities() {
    return Array.from(this.capabilities.values());
  }

  /**
   * Check if agent has capability
   */
  hasCapability(agentId, capabilityId) {
    return this.capabilities.has(capabilityId);
  }
}

module.exports = AgentCapabilityManager;
