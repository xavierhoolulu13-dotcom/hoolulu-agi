/**
 * Agent Team Composer - Manages composition of agent teams
 */

const { v4: uuidv4 } = require('uuid');

class AgentTeamComposer {
  constructor(config = {}) {
    this.config = config;
    this.teams = new Map();
  }

  /**
   * Initialize team composer
   */
  async initialize() {
    console.log('[TeamComposer] Initializing...');
  }

  /**
   * Compose a team of agents
   */
  async compose(teamName, teamConfig = {}) {
    const team = {
      id: teamConfig.id || uuidv4(),
      name: teamName,
      description: teamConfig.description || '',
      members: [],
      roles: {},
      communicationChannels: [],
      workflows: teamConfig.workflows || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Define team roles
    if (teamConfig.roles) {
      team.roles = this.defineRoles(teamConfig.roles);
    }

    // Add team members
    if (teamConfig.members && Array.isArray(teamConfig.members)) {
      team.members = teamConfig.members.map(member => ({
        agentId: member.agentId,
        role: member.role || 'member',
        priority: member.priority || 'normal',
        capabilities: member.capabilities || [],
      }));
    }

    // Setup communication channels
    if (teamConfig.members && teamConfig.members.length > 1) {
      team.communicationChannels = this.setupChannels(team.members);
    }

    return team;
  }

  /**
   * Define team roles
   */
  defineRoles(rolesConfig) {
    const roles = {};

    for (const [roleId, roleConfig] of Object.entries(rolesConfig)) {
      roles[roleId] = {
        id: roleId,
        name: roleConfig.name || roleId,
        description: roleConfig.description || '',
        responsibilities: roleConfig.responsibilities || [],
        capabilities: roleConfig.capabilities || [],
      };
    }

    return roles;
  }

  /**
   * Setup communication channels between team members
   */
  setupChannels(members) {
    const channels = [];

    // Create channels for communication between members
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        channels.push({
          id: `channel-${members[i].agentId}-${members[j].agentId}`,
          type: 'bidirectional',
          agents: [members[i].agentId, members[j].agentId],
          protocol: 'mqtt',
          status: 'active',
        });
      }
    }

    return channels;
  }

  /**
   * Add member to team
   */
  async addMember(teamId, member) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const memberEntry = {
      agentId: member.agentId,
      role: member.role || 'member',
      priority: member.priority || 'normal',
      capabilities: member.capabilities || [],
      joinedAt: new Date().toISOString(),
    };

    team.members.push(memberEntry);

    return memberEntry;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId, agentId) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    team.members = team.members.filter(m => m.agentId !== agentId);

    return true;
  }

  /**
   * Define team workflow
   */
  async defineWorkflow(teamId, workflow) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const workflowEntry = {
      id: workflow.id || uuidv4(),
      name: workflow.name,
      description: workflow.description || '',
      steps: workflow.steps || [],
      parallelizable: workflow.parallelizable || false,
      estimatedDuration: workflow.estimatedDuration || 'unknown',
    };

    team.workflows.push(workflowEntry);

    return workflowEntry;
  }

  /**
   * Get team
   */
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  /**
   * List all teams
   */
  listTeams() {
    return Array.from(this.teams.values());
  }

  /**
   * Get team members
   */
  getTeamMembers(teamId) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    return team.members;
  }

  /**
   * Get team communication channels
   */
  getTeamChannels(teamId) {
    const team = this.teams.get(teamId);

    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    return team.communicationChannels;
  }
}

module.exports = AgentTeamComposer;
