````markdown
# 🚀 Hoolulu Systems Hub - Agent Factory

The **Agent Factory** is the builder component of the **Hoolulu Intelligence OS**, responsible for creating, configuring, and deploying super agents across the Hoolulu Systems ecosystem.

## 🎯 Overview

The Agent Factory enables rapid creation and deployment of intelligent agents with:

- **Template-based Agent Creation** - Quick setup using pre-built templates
- **Capability Management** - Flexible skill assignment and management
- **Team Composition** - Multi-agent team coordination
- **Multi-environment Deployment** - Dev, staging, and production ready
- **Agent Registry** - Central tracking of all agents and teams

## 📊 Architecture

```
HooluluSystemsHub (The Company)
    ↓
HooluluIntelligenceOS (The Brain)
    ↓
Amanda (The Interface)
    ↓
Conductor808 (The Operator)
    ↓
UnicornLead (The Intelligence)
    ↓
AgentFactory ← YOU ARE HERE (The Builder)
    ↓
LocalAIEmployees (The Workforce)
```

## 🏗️ Core Components

### 1. **AgentFactory** (index.js)
Main orchestrator that manages the entire agent lifecycle.

**Key Methods:**
- `createAgent(templateName, config)` - Create single agents
- `createTeam(teamName, teamConfig)` - Compose multi-agent teams
- `deploy(targetId, environment)` - Deploy agents/teams
- `listAgents()` / `listTeams()` - View all agents and teams
- `getStatus()` - Get factory status

### 2. **AgentBuilder** (core/AgentBuilder.js)
Instantiates agents from templates with validation.

**Key Methods:**
- `build(template, config)` - Build agent from template
- `validateTemplate(template)` - Validate template structure
- `validateConfig(config)` - Validate agent configuration
- `mergeCapabilities(template, config)` - Merge capabilities

### 3. **AgentCapabilityManager** (core/AgentCapabilityManager.js)
Manages agent skills and capabilities.

**10+ Default Capabilities:**
- `reasoning` - Think through complex problems
- `task-execution` - Execute defined tasks
- `data-analysis` - Analyze and interpret data
- `communication` - Communicate with other agents
- `automation` - Automate repetitive tasks
- `coordination` - Coordinate between entities
- `learning` - Learn from data and interactions
- `scheduling` - Schedule and manage tasks
- `reporting` - Generate and provide reports
- `orchestration` - Orchestrate complex workflows

### 4. **AgentTemplateManager** (core/AgentTemplateManager.js)
Manages agent templates and configurations.

**Default Templates:**
- `generic-agent` - Custom agent template
- `analyst` - Data analysis specialist
- `executor` - Task execution specialist
- `coordinator` - Multi-agent coordinator

### 5. **AgentTeamComposer** (core/AgentTeamComposer.js)
Composes multi-agent teams with role management.

**Key Methods:**
- `compose(teamName, config)` - Create agent team
- `defineRoles(rolesConfig)` - Define team roles
- `setupChannels(members)` - Setup communication
- `addMember(teamId, member)` - Add team member
- `getTeamChannels(teamId)` - Get communication channels

### 6. **AgentDeploymentManager** (core/AgentDeploymentManager.js)
Handles deployment and lifecycle management.

**Environments:**
- **Development** - 1 replica, 256Mi memory
- **Staging** - 2 replicas, 512Mi memory
- **Production** - 3 replicas, 1Gi memory

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/xksh808dsh-bit/Hoolulu-api1.git
cd Hoolulu-api1/HooluluSystemsHub/AgentFactory

# Install dependencies
npm install

# Or with yarn
yarn install
```

## 🚀 Quick Start

### 1. Initialize the Agent Factory

```javascript
const AgentFactory = require('./index');

const factory = new AgentFactory({
  name: 'HooluluAgentFactory',
  environment: 'production'
});

// Factory is auto-initialized
console.log(factory.getStatus());
```

### 2. Create a Single Agent

```javascript
// Create an analyst agent
const analyst = await factory.createAgent('analyst', {
  name: 'DataAnalyst-001',
  description: 'Analyzes business metrics',
  capabilities: ['data-analysis', 'reporting'],
  dataSource: 'postgresql://metrics-db',
});

console.log('Agent created:', analyst.id);
```

### 3. Create a Team of Agents

```javascript
// Create a coordinated agent team
const team = await factory.createTeam('DataProcessingTeam', {
  description: 'Multi-agent data pipeline',
  members: [
    {
      agentId: 'data-extractor-001',
      role: 'extractor',
      capabilities: ['data-analysis', 'automation']
    },
    {
      agentId: 'data-transformer-001',
      role: 'transformer',
      capabilities: ['task-execution', 'automation']
    },
    {
      agentId: 'data-validator-001',
      role: 'validator',
      capabilities: ['data-analysis', 'reporting']
    }
  ],
  workflows: [
    {
      id: 'extract-transform-validate',
      steps: ['extract', 'transform', 'validate'],
      parallelizable: false
    }
  ]
});

console.log('Team created:', team.id);
```

### 4. Deploy Agent

```javascript
// Deploy to production
const deployment = await factory.deploy(analyst.id, 'production');

console.log('Deployment details:');
console.log('Status:', deployment.status);
console.log('REST Endpoint:', deployment.endpoints.rest);
console.log('WebSocket:', deployment.endpoints.websocket);
console.log('gRPC:', deployment.endpoints.grpc);
```

### 5. Assign Capabilities

```javascript
// Assign additional capabilities
await factory.capabilityManager.assignCapabilities(analyst.id, [
  'learning',
  'orchestration'
]);

// Register custom skill
factory.capabilityManager.registerSkill('data-analysis', {
  id: 'ml-prediction',
  name: 'ML Prediction Skill',
  description: 'Predict outcomes using ML models',
  handler: async (data) => {
    // Custom ML logic
    return { prediction: Math.random() };
  }
});
```

### 6. View Registry

```javascript
// List all agents
const allAgents = factory.listAgents();
console.log(`Total agents: ${allAgents.length}`);

// List all teams
const allTeams = factory.listTeams();
console.log(`Total teams: ${allTeams.length}`);

// List available templates
const templates = factory.listTemplates();
templates.forEach(t => {
  console.log(`- ${t.name}: ${t.description}`);
});
```

## 📋 Complete Example

```javascript
const AgentFactory = require('./HooluluSystemsHub/AgentFactory');

async function main() {
  // Initialize factory
  const factory = new AgentFactory();

  // Create individual agents
  console.log('📦 Creating agents...');
  
  const scraper = await factory.createAgent('executor', {
    name: 'WebScraper-001',
    description: 'Scrapes web data',
    capabilities: ['automation', 'task-execution'],
    taskType: 'web-scraping'
  });

  const analyzer = await factory.createAgent('analyst', {
    name: 'DataAnalyzer-001',
    description: 'Analyzes scraped data',
    capabilities: ['data-analysis', 'reporting'],
    dataSource: 'memory://scraped-data'
  });

  console.log(`✅ Created ${scraper.name} (${scraper.id})`);
  console.log(`✅ Created ${analyzer.name} (${analyzer.id})`);

  // Create team
  console.log('\n🤝 Creating team...');
  
  const dataPipeline = await factory.createTeam('DataPipeline', {
    description: 'End-to-end data pipeline',
    members: [
      { agentId: scraper.id, role: 'extractor', priority: 'high' },
      { agentId: analyzer.id, role: 'processor', priority: 'high' }
    ],
    workflows: [
      {
        name: 'scrape-and-analyze',
        steps: ['scrape', 'validate', 'analyze', 'report']
      }
    ]
  });

  console.log(`✅ Team created: ${dataPipeline.id}`);

  // Deploy agents
  console.log('\n🚀 Deploying agents...');
  
  const scrapperDeploy = await factory.deploy(scraper.id, 'production');
  const analyzerDeploy = await factory.deploy(analyzer.id, 'production');

  console.log(`✅ ${scraper.name} deployed`);
  console.log(`   REST: ${scrapperDeploy.endpoints.rest}`);
  console.log(`✅ ${analyzer.name} deployed`);
  console.log(`   REST: ${analyzerDeploy.endpoints.rest}`);

  // Show status
  console.log('\n📊 Factory Status:');
  console.log(factory.getStatus());

  // Show deployments
  console.log('\n📋 Active Deployments:');
  factory.deploymentManager.listDeployments().forEach(d => {
    console.log(`- ${d.agentName} → ${d.environment} (${d.status})`);
  });
}

main().catch(console.error);
```

## 🔌 API Reference

### AgentFactory

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `createAgent()` | `templateName, config` | `Agent` | Create new agent |
| `createTeam()` | `teamName, config` | `Team` | Create agent team |
| `deploy()` | `targetId, environment` | `Deployment` | Deploy agent/team |
| `getAgent()` | `agentId` | `Agent` | Get agent by ID |
| `getTeam()` | `teamId` | `Team` | Get team by ID |
| `listAgents()` | — | `Agent[]` | List all agents |
| `listTeams()` | — | `Team[]` | List all teams |
| `listTemplates()` | — | `Template[]` | List templates |
| `removeAgent()` | `agentId` | `boolean` | Remove agent |
| `getStatus()` | — | `Status` | Get factory status |

### Agent Object Structure

```javascript
{
  id: "uuid",
  templateId: "template-id",
  name: "Agent Name",
  description: "Description",
  version: "1.0.0",
  status: "created|active|deployed",
  capabilities: ["reasoning", "task-execution"],
  config: { /* merged config */ },
  metadata: {
    createdAt: "ISO-8601",
    updatedAt: "ISO-8601",
    createdBy: "string"
  },
  state: {
    active: boolean,
    deployed: boolean,
    deploymentId: "uuid"
  }
}
```

### Team Object Structure

```javascript
{
  id: "uuid",
  name: "Team Name",
  description: "Description",
  members: [
    {
      agentId: "uuid",
      role: "role-name",
      priority: "normal|high",
      capabilities: ["skill1", "skill2"]
    }
  ],
  roles: { /* role definitions */ },
  communicationChannels: [
    {
      id: "channel-id",
      type: "bidirectional",
      agents: ["agent-id-1", "agent-id-2"],
      protocol: "mqtt"
    }
  ],
  workflows: [ /* team workflows */ ],
  metadata: { createdAt: "ISO-8601", updatedAt: "ISO-8601" }
}
```

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=production          # development|staging|production
AGENT_FACTORY_NAME=MyFactory # Factory name
DEPLOYMENT_REGION=us-east-1  # Deployment region
```

### Default Templates

Extend templates by creating custom ones:

```javascript
await factory.templateManager.createTemplate({
  id: 'custom-template',
  name: 'My Custom Template',
  description: 'Custom agent template',
  capabilities: ['reasoning', 'automation', 'learning'],
  config: { /* default config */ },
  requiredConfig: ['name', 'customParam']
});
```

## 🎓 Use Cases

### Use Case 1: Content Processing Pipeline

```javascript
const contentPipeline = await factory.createTeam('ContentPipeline', {
  members: [
    { agentId: 'scraper', role: 'collector' },
    { agentId: 'nlp-processor', role: 'processor' },
    { agentId: 'indexer', role: 'storage' }
  ]
});
```

### Use Case 2: Data Analytics Team

```javascript
const analyticTeam = await factory.createTeam('AnalyticsTeam', {
  members: [
    { agentId: 'data-extractor', role: 'source' },
    { agentId: 'data-cleaner', role: 'transform' },
    { agentId: 'analyst', role: 'analyze' },
    { agentId: 'reporter', role: 'report' }
  ]
});
```

### Use Case 3: Multi-Model Inference

```javascript
const inferenceTeam = await factory.createTeam('InferenceCluster', {
  members: [
    { agentId: 'model-1', role: 'inference', capabilities: ['reasoning'] },
    { agentId: 'model-2', role: 'inference', capabilities: ['reasoning'] },
    { agentId: 'aggregator', role: 'coordinator', capabilities: ['coordination'] }
  ]
});
```

## 🧪 Testing

```javascript
// Basic agent creation test
const agent = await factory.createAgent('generic-agent', {
  name: 'TestAgent',
  description: 'Test agent'
});

assert(agent.id, 'Agent should have an ID');
assert(agent.status === 'created', 'Agent status should be created');
assert(factory.getAgent(agent.id), 'Agent should be in registry');
```

## 📚 Documentation

- [Agent Skills Format](https://agentskills.io)
- [Hoolulu Documentation](https://docs.hoolulu.ai)
- [API Reference](./docs/API.md)
- [Examples](./examples/)

## 🔗 Related Projects

- [HooluluIntelligenceOS](../../../README.md) - Main Hoolulu OS
- [Amanda Interface](../../Amanda/) - User interface layer
- [Conductor808 Operator](../../Conductor808/) - Orchestration layer
- [LocalAIEmployees](../LocalAIEmployees/) - Runtime agents

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/xksh808dsh-bit/Hoolulu-api1/issues)
- Documentation: [Hoolulu Docs](https://docs.hoolulu.ai)
- Discussions: [GitHub Discussions](https://github.com/xksh808dsh-bit/Hoolulu-api1/discussions)

---

**Built for the Hoolulu Systems Hub**  
*The builder in the Hoolulu Intelligence Ecosystem*
````
