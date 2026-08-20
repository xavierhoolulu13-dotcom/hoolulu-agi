const Amanda = require("./amanda");

async function start() {
  const amanda = new Amanda();

  // Give AgentFactory time to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));

  const agent = await amanda.createLandscaper({
    businessName: "Cash Claw 808"
  });

  console.log("\nCREATED AGENT:");
  console.log(agent);  const result = await amanda.runAgent(
    agent,
    "Find and qualify landscaping leads on Oahu"
  );

  console.log("\nORCHESTRATION RESULT:");
  console.log(JSON.stringify(result, null, 2));

  console.log("\nFACTORY STATUS:");
  console.log(amanda.status());
}

start().catch(console.error);
