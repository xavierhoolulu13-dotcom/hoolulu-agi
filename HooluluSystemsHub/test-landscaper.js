const createLandscaperAgent = require('./landscaper-agent');

(async () => {
  const agent = await createLandscaperAgent({
    businessName: "Aloha Greens",
    services: "maintenance, design, hardscape",
    pricing: "per sq ft",
    area: "Honolulu + 15 mile radius",
    crew: 4,
    specialties: "tropical installs, irrigation"
  });

  console.log(agent);
})();
