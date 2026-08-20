const AgentFactory = require("./index");
const AgentOrchestrator = require("./core/AgentOrchestrator");

class Amanda {
  constructor() {
    this.factory = new AgentFactory();
    this.orchestrator = new AgentOrchestrator(this.factory);
    this.name = "Amanda";
  }

  async createLandscaper(config) {
    console.log(`[${this.name}] Creating landscaper agent`);

    const agent = await this.factory.createAgent(
      "generic-agent",
      {
        name: config.businessName,
        description: "AI landscaping sales and lead agent",
        capabilities: [
          "lead-generation",
          "qualification",
          "appointment-booking"
        ]
      }
    );

    return agent;
  }

  async runAgent(agent, task) {
    console.log(`[${this.name}] Orchestrating agent`);

    return await this.orchestrator.run(agent, task);
  }

  status() {
    return this.factory.getStatus();
  }
}

module.exports = Amanda;
