/**  
 * core/LeadPipeline.js  
 * Reads qualified CSV leads, ranks + filters by fit, generates  
 * template-based outreach assets. No AgentFactory/Amanda/AgentOrchestrator  
 * changes required — AgentOrchestrator just calls runLeadPipeline().  
 */  
  
const fs = require('fs');  
  
// ---- Priority verticals (case-insensitive substring match on Industry) ----  
const PRIORITY_INDUSTRIES = [  
  'landscap', 'contractor', 'hvac', 'plumb', 'electric', 'roof', 'beauty', 'salon'  
];  
  
// ---- Outreach templates by Recommended Service ----  
const TEMPLATES = {  
  'Website Upgrade': {  
    email: (b) =>  
      `Subject: Quick question about ${b.business}\n\nHi ${b.business} team,\n\nI noticed ${b.business} doesn't have a website live yet — that's likely costing you jobs to competitors who show up first in search. I build fast, mobile-ready sites for Oahu businesses like yours, live in days not months.\n\nWorth a quick 10-min call this week?\n\n— Island AI Systems`,  
    sms: (b) => `Hi, this is Island AI Systems — noticed ${b.business} has no website live. I can get one up fast for local search. Worth a quick call?`,  
    callScript: (b) =>  
      `Opener: "Hi, is this ${b.business}? I help Oahu businesses like yours get found online — I noticed you don't have a website up yet. Got 2 minutes?"\nIf yes: pitch fast-turnaround site, ask for best email/time for a 10-min walkthrough.\nIf no: "No worries — mind if I text you a quick example instead?"`  
  },  
  'Review Management': {  
    email: (b) =>  
      `Subject: Your Google reviews, ${b.business}\n\nHi ${b.business} team,\n\nYour Google rating is solid, but review volume is lower than similar businesses nearby — that's hurting your ranking in local search. I run a simple review-generation system that gets you consistent new reviews on autopilot.\n\nOpen to a quick look?\n\n— Island AI Systems`,  
    sms: (b) => `Hi, Island AI Systems here — noticed ${b.business}'s review count is behind similar local businesses. I can fix that on autopilot. Quick call?`,  
    callScript: (b) =>  
      `Opener: "Hi, is this ${b.business}? I noticed your review count is a bit behind others in your category — I run a system that gets businesses consistent new reviews. Got 2 min?"\nIf yes: explain simple review-request automation, ask for email.\nIf no: offer to text a quick example.`  
  },  
  'AI Assistant': {  
    email: (b) =>  
      `Subject: Never miss another call, ${b.business}\n\nHi ${b.business} team,\n\nMissed calls usually mean missed jobs. I set up AI assistants for local businesses that answer, qualify, and book appointments 24/7 — even after hours.\n\nWant a quick demo?\n\n— Island AI Systems`,  
    sms: (b) => `Hi, Island AI Systems here — I set up AI assistants that answer & book jobs for businesses like ${b.business}, even after hours. Quick demo?`,  
    callScript: (b) =>  
      `Opener: "Hi, is this ${b.business}? Quick question — what happens to calls you can't pick up? I set up AI assistants that answer and book jobs automatically. Got 2 min?"\nIf yes: explain, ask for email for a demo link.\nIf no: offer to text a short demo video.`  
  }  
};  
  
const DEFAULT_TEMPLATE = TEMPLATES['Website Upgrade'];  
  
// ---- Minimal CSV parser (no new dependency) ----  
function parseCSV(raw) {  
  const lines = raw.trim().split(/\r?\n/);  
  const headers = splitCSVLine(lines[0]);  
  return lines.slice(1).filter(Boolean).map((line) => {  
    const cells = splitCSVLine(line);  
    const row = {};  
    headers.forEach((h, i) => { row[h.trim()] = (cells[i] || '').trim(); });  
    return row;  
  });  
}  
  
function splitCSVLine(line) {  
  const result = [];  
  let cur = '', inQuotes = false;  
  for (let i = 0; i < line.length; i++) {  
    const c = line[i];  
    if (c === '"') { inQuotes = !inQuotes; }  
    else if (c === ',' && !inQuotes) { result.push(cur); cur = ''; }  
    else { cur += c; }  
  }  
  result.push(cur);  
  return result;  
}  
  
// ---- Core pipeline ----  
function isPriorityFit(industry = '') {  
  const ind = industry.toLowerCase();  
  return PRIORITY_INDUSTRIES.some((kw) => ind.includes(kw));  
}  
  
function runLeadPipeline(csvPath, outPath) {  
  const raw = fs.readFileSync(csvPath, 'utf8');  
  const rows = parseCSV(raw);  
  
  const ranked = rows  
    .filter((r) => isPriorityFit(r['Industry']))  
    .map((r) => ({ ...r, _score: parseFloat(r['Opportunity Score']) || 0 }))  
    .sort((a, b) => b._score - a._score);  
  
  const leads = ranked.map((r) => {  
    const business = r['Business Name'];  
    const service = r['Recommended Service'] || 'Website Upgrade';  
    const reason = r['Opportunity Reason'] || '';  
    const score = r._score;  
    const tpl = TEMPLATES[service] || DEFAULT_TEMPLATE;  
  
    return {  
      business,  
      score,  
      service,  
      reason,  
      industry: r['Industry'],  
      location: r['Location'],  
      phone: r['Phone Number'],  
      email_address: r['Email'],  
      priority: score >= 8 ? 'High' : score >= 5 ? 'Medium' : 'Low',  
      email: tpl.email({ business }),  
      sms: tpl.sms({ business }),  
      callScript: tpl.callScript({ business }),  
      status: 'Ready For Outreach'  
    };  
  });  
  
  if (outPath) {  
    fs.writeFileSync(outPath, JSON.stringify(leads, null, 2));  
  }  
  
  return leads;  
}  
  
// ---- CLI entry point: node core/LeadPipeline.js leads.csv output.json ----  
if (require.main === module) {  
  const [,, csvPath, outPath] = process.argv;  
  if (!csvPath) {  
    console.error('Usage: node core/LeadPipeline.js <input.csv> [output.json]');  
    process.exit(1);  
  }  
  const leads = runLeadPipeline(csvPath, outPath || 'leads-ready.json');  
  console.log(`[LeadPipeline] Processed ${leads.length} priority-fit leads.`);  
  console.log(`[LeadPipeline] Output: ${outPath || 'leads-ready.json'}`);  
}  
  
module.exports = { runLeadPipeline, TEMPLATES, isPriorityFit };

How AgentOrchestrator hooks in (one line, no edits to existing behavior):

const { runLeadPipeline } = require('./LeadPipeline');  
// inside your Cash Claw 808 workflow case:  
const leads = runLeadPipeline(csvPath, outPath);

