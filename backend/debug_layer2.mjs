// Standalone test — runs the EXACT same Layer 2 logic as index.ts
// Run with: node debug_layer2.mjs
import fs from 'fs';

const memory = JSON.parse(fs.readFileSync('./memory.json', 'utf-8'));
const hobbies = memory.recreation_and_hobbies || [];
const projects = memory.active_projects || {};
const learnedSlang = memory.learned_slang || [];

const testMessages = [
  "yo wanna grab lunch today?",
  "bro you up for Valorant tonight?",
  "haha ok cool 👍",
  "did you watch the F1 race last night??",
  "hey how are you doing?",
  "bhai prod gaya help kar",
  "bro the IHMS server is crashing again",
  "urgent hotfix needed for the login page",
];

const TECH_KEYWORDS = /\b(server|crash|down|error|bug|broken|fail|prod|deploy|hotfix|rollback|database|api|outage|exception|500|404|build|pipeline|ci|alert|urgent|asap)\b/i;
const SOCIAL_SIGNALS = [
  /\b(lunch|dinner|breakfast|coffee|food|eat|drinks?)\b/i,
  /\b(wanna|want to|up for|wanna grab|lets? (go|hang|meet|catch up))\b/i,
  /\b(how are you|how r u|how's it going|what'?s up|wassup|sup)\b/i,
  /\b(you free|are you free|you available|you around|you up)\b/i,
  /\b(party|hangout|hang out|weekend plans|tonight|this evening)\b/i,
  /^(hey|hi|hello|yo|sup|heyy|heyyy|hola)\b/i,
  /\bdid you (watch|see|catch|play)\b/i,
];
const REACTION = /^(ok|okay|cool|lol|lmao|haha|hehe|sure|yep|nope|nice|great|k|hmm|wow|noted|got it|👍|👌|😂|🙂|😊|thx|thanks|ty|np|no prob|fine|alright|aight|roger)[\s!.]*$/i;

const projectNames = Object.keys(projects);
const hobbyWords = hobbies.flatMap(h => h.toLowerCase().split(/[\s\/]/));

console.log('\n🔬 Layer 2 Debug — testing regex logic in isolation');
console.log('Hobbies:', hobbies);
console.log('Hobby words:', hobbyWords);
console.log('Projects:', projectNames);
console.log('─'.repeat(70));

for (const msg of testMessages) {
  const msgLower = msg.toLowerCase().trim();

  // Layer 1 slang
  let slangHit = null;
  for (const entry of learnedSlang) {
    const phrase = entry.split('->')[0].trim().toLowerCase();
    const norm = msgLower.replace(/[^a-z0-9\s]/g, '');
    const normPhrase = phrase.replace(/[^a-z0-9\s]/g, '');
    if (norm.includes(normPhrase)) { slangHit = phrase; break; }
  }

  const hasTech = TECH_KEYWORDS.test(msg);
  const hasProject = projectNames.some(p => msgLower.includes(p.toLowerCase()));
  const isSocial = SOCIAL_SIGNALS.some(r => r.test(msg));
  const hasHobby = hobbyWords.some(w => w.length > 2 && msgLower.includes(w));
  const isReaction = REACTION.test(msg.trim());

  let verdict;
  if (slangHit)                              verdict = `L1→ESCALATE (slang: "${slangHit}")`;
  else if ((isSocial || hasHobby) && !hasTech && !hasProject) verdict = 'L2→BLOCK';
  else if (isReaction)                       verdict = 'L3→IGNORE';
  else if (hasTech || hasProject)            verdict = 'L4→LLM (has tech signal)';
  else                                       verdict = 'L4→LLM (ambiguous)';

  const matchedSignals = SOCIAL_SIGNALS.map((r, i) => r.test(msg) ? i : null).filter(x => x !== null);
  console.log(`\n"${msg}"`);
  console.log(`  slang=${slangHit||'none'} isSocial=${isSocial}[signals:${matchedSignals}] hasHobby=${hasHobby} hasTech=${hasTech} hasProject=${hasProject} isReaction=${isReaction}`);
  console.log(`  → ${verdict}`);
}
