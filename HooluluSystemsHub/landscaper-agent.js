const ApplifyClient = require('./applify');
const { v4: uuid } = require('uuid');

async function createLandscaperAgent(config) {
  const applify = new ApplifyClient();

  const intelligence = await applify.generate(`
    Build a landscaper agent with:
    Services: ${config.services}
    Pricing: ${config.pricing}
    Area: ${config.area}
    Crew: ${config.crew}
    Specialties: ${config.specialties}
  `);

  return {
    id: uuid(),
    name: `${config.businessName}-LandscaperAgent`,
    role: "landscaper",
    capabilities: intelligence.capabilities || [],
    workflows: intelligence.workflows || [],
    config
  };
}

module.exports = createLandscaperAgent;
