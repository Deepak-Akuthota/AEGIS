// Quick classifier test — run with: node test_classifier.mjs
const BASE = 'http://localhost:3000/api/webhook/discord';

const tests = [
  // [label, sender, message, expected_verdict]
  ['Casual lunch invite (unknown)',     'randomguy',   'yo wanna grab lunch today?',                       'block'],
  ['Hobby topic - Valorant',           'randomguy',   'bro you up for Valorant tonight?',                 'block'],
  ['Learned slang - prod gaya',        'Deepak',      'bhai prod gaya help kar',                          'escalate'],
  ['Learned slang - code fat gaya',    'Aditya',      'yaar code fat gaya phir se',                       'escalate'],
  ['Learned slang - eagle landed',     'someuser',    'The eagle has landed, brace yourself',             'escalate'],
  ['Teammate + server down',           'Aditya',      'bro the IHMS server is crashing again',            'escalate'],
  ['Project mention by stranger',      'stranger123', 'hey is the Nexus API down?',                       'escalate'],
  ['Pure reaction / gibberish',        'randomguy',   'haha ok cool 👍',                                  'ignore'],
  ['F1 hobby - casual',                'friend',      'did you watch the F1 race last night??',           'block'],
  ['Vite slang',                       'Akuthota',    'Vite server is crying bro fix it',                 'escalate'],
  ['Hotfix needed',                    'stranger',    'urgent hotfix needed for the login page',          'escalate'],
  ['Normal how are you',               'mom',         'hey how are you doing?',                           'block'],
];

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const YELLOW= '\x1b[33m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';

let passed = 0, failed = 0;

console.log(`\n${BOLD}🧪 Aegis Classifier Test Suite${RESET}\n${'─'.repeat(70)}`);

for (const [label, sender, message, expected] of tests) {
  process.stdout.write(`  ${DIM}Testing:${RESET} ${label.padEnd(40)} `);
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, message }),
    });
    const data = await res.json();
    const verdict = data?.decision?.verdict ?? 'ERROR';
    const ok = verdict === expected;
    if (ok) {
      console.log(`${GREEN}✅ ${verdict}${RESET}`);
      passed++;
    } else {
      console.log(`${RED}❌ got: ${verdict}  (expected: ${expected})${RESET}`);
      failed++;
    }
  } catch (e) {
    console.log(`${RED}💥 request failed: ${e.message}${RESET}`);
    failed++;
  }
}

const total = passed + failed;
const pct   = Math.round((passed / total) * 100);
const color = pct >= 90 ? GREEN : pct >= 75 ? YELLOW : RED;

console.log(`\n${'─'.repeat(70)}`);
console.log(`${BOLD}Results: ${color}${passed}/${total} passed (${pct}%)${RESET}`);
if (pct >= 90) console.log(`${GREEN}🎯 Target accuracy met!${RESET}`);
else           console.log(`${RED}⚠️  Below 90% target — review failures above${RESET}`);
console.log();
