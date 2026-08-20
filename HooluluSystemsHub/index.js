/**
 * ============================================================================
 * HOOLULU SYSTEMS HUB - AGENT FACTORY
 * ============================================================================
 * The builder module for creating, configuring, and deploying super agents
 * across the Hoolulu Intelligence ecosystem.
 *
 * Role: The builder
 * Responsibilities:
 * - Agent creation and templating
 * - Agent configuration management
 * - Agent skill/capability assignment
 * - Agent deployment orchestration
 * - Agent team composition
 * ============================================================================
 */

const AgentBuilder = require('./core/AgentBuilder');
const AgentTemplateManager = require('./core/AgentTemplateManager');
const AgentCapabilityManager = require('./core/AgentCapabilityManager');
const AgentDeploymentManager = require('./core/AgentDeploymentManager');
const AgentTeamComposer = require('./core/AgentTeamComposer');

class AgentFactory {
  constructor(config = {}) {
    this.config = {
      name: 'AgentFactory',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ...config,
    };

    // Initialize core components
    this.builder = new AgentBuilder(this.config);
    this.templateManager = new AgentTemplateManager(this.config);
    this.capabilityManager = new AgentCapabilityManager(this.config);
    this.deploymentManager = new AgentDeploymentManager(this.config);
    this.teamComposer = new AgentTeamComposer(this.config);

    // Agent registry
    this.agents = new Map();
    this.templates = new Map();
    this.teams = new Map();

    this.initialize();
  }

  /**
   * Initialize the Agent Factory
   */
  async initialize() {
    console.log('[AgentFactory] Initializing Agent Factory...');

    try {
      // Load default templates
      await this.loadDefaultTemplates();

      // Initialize managers
      await Promise.all([
        this.templateManager.initialize(),
        this.capabilityManager.initialize(),
        this.deploymentManager.initialize(),
      ]);

      console.log('[AgentFactory] Agent Factory initialized successfully');
    } catch (error) {
      console.error('[AgentFactory] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Create a new agent from template
   * @param {string} templateName - Template to use
   * @param {Object} config - Agent configuration
   * @returns {Object} Created agent instance
   */
  async createAgent(templateName, config = {}) {
    console.log(`[AgentFactory] Creating agent from template: ${templateName}`);

    try {
      // Get template
      const template = this.templates.get(templateName) ||
                       await this.templateManager.getTemplate(templateName);

      // Build agent
      const agent = await this.builder.build(template, config);

      // Register agent
      this.agents.set(agent.id, agent);

      // Assign capabilities
      if (config.capabilities) {
        await this.capabilityManager.assignCapabilities(agent.id, config.capabilities);
      }

      return agent;
    } catch (error) {
      console.error(`[AgentFactory] Agent creation error:`, error);
      throw error;
    }
  }

  /**
   * Create a team of agents
   * @param {string} teamName - Team identifier
   * @param {Object} teamConfig - Team configuration
   * @returns {Object} Created team instance
   */
  async createTeam(teamName, teamConfig = {}) {
    console.log(`[AgentFactory] Creating agent team: ${teamName}`);

    try {
      const team = await this.teamComposer.compose(teamName, teamConfig);

      this.teams.set(teamName, team);

      return team;
    } catch (error) {
      console.error(`[AgentFactory] Team creation error:`, error);
      throw error;
    }
  }

  /**
   * Deploy an agent or team
   * @param {string} targetId - Agent or team ID
   * @param {string} environment - Deployment environment
   * @returns {Object} Deployment result
   */
  async deploy(targetId, environment = 'production') {
    console.log(`[AgentFactory] Deploying: ${targetId} to ${environment}`);

    try {
      // Check if it's an agent or team
      const agent = this.agents.get(targetId);
      const team = this.teams.get(targetId);
      const target = agent || team;

      if (!target) {
        throw new Error(`Target not found: ${targetId}`);
      }

      // Deploy
      const result = await this.deploymentManager.deploy(target, environment);

      console.log(`[AgentFactory] Deployment successful: ${targetId}`);

      return result;
    } catch (error) {
      console.error(`[AgentFactory] Deployment error:`, error);
      throw error;
    }
  }

  /**
   * Load default agent templates
   */
  async loadDefaultTemplates() {
    const defaultTemplates = {
      'generic-agent': {
        id: 'generic-agent',
        name: 'Generic Agent',
        description: 'A generic template for creating custom agents',
        capabilities: ['reasoning', 'task-execution'],
        requiredConfig: ['name', 'description'],
      },
      'analyst': {
        id: 'analyst',
        name: 'Analyst Agent',
        description: 'Specialized for data analysis and insights',
        capabilities: ['data-analysis', 'reporting', 'reasoning'],
        requiredConfig: ['name', 'dataSource'],
      },
      'executor': {
        id: 'executor',
        name: 'Executor Agent',
        description: 'Specialized for task execution and automation',
        capabilities: ['task-execution', 'automation', 'scheduling'],
        requiredConfig: ['name', 'taskType'],
      },
      'coordinator': {
        id: 'coordinator',
        name: 'Coordinator Agent',
        description: 'Coordinates between multiple agents and systems',
        capabilities: ['coordination', 'communication', 'orchestration'],
        requiredConfig: ['name'],
      },
    };

    for (const [key, template] of Object.entries(defaultTemplates)) {
      this.templates.set(key, template);
    }

    return defaultTemplates;
  }

  /**
   * Get an agent by ID
   * @param {string} agentId - Agent ID
   * @returns {Object} Agent instance
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get a team by ID
   * @param {string} teamId - Team ID
   * @returns {Object} Team instance
   */
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  /**
   * List all agents
   * @returns {Array} List of agents
   */
  listAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * List all teams
   * @returns {Array} List of teams
   */
  listTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * List available templates
   * @returns {Array} List of templates
   */
  listTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Remove an agent
   * @param {string} agentId - Agent ID to remove
   */
  async removeAgent(agentId) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Clean up deployments
    await this.deploymentManager.undeploy(agentId);

    // Remove from registry
    this.agents.delete(agentId);

    return true;
  }

  /**
   * Get factory status
   * @returns {Object} Factory status
   */
  getStatus() {
    return {
      name: this.config.name,
      version: this.config.version,
      environment: this.config.environment,
      agents: this.agents.size,
      teams: this.teams.size,
      templates: this.templates.size,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AgentFactory;
