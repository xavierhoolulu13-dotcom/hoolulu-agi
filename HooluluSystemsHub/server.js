const express = require("express");
const app = express();
app.use(express.json());

// Simple Super Agent logic — replace later with your real AgentFactory
const SuperAgent = {
  process: async (msg) => {
    return "Super Agent heard: " + msg;
  }
};

// ✅ Endpoint that receives messages from your frontend
app.post("/agent/chat", async (req, res) => {
  const userMessage = req.body.message;
  const reply = await SuperAgent.process(userMessage);
  res.json({ reply });
});

// ✅ Start the backend server
app.listen(3000, () => {
  console.log("AgentFactory server running on http://localhost:3000");
});


