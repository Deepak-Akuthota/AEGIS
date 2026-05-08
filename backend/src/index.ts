console.log("🚀 [Aegis] Loading NEW index.ts (Hybrid Layered Classifier)...");
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os'; // 🔥 NEW: We use this to access the Mac's hidden temp folder

// Aliased Imports to prevent collisions
import { Client as DiscordClient, GatewayIntentBits, Message as DiscordMessage } from 'discord.js';
import { Client as WAClient, LocalAuth, Message as WAMessage } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import notifier from 'node-notifier';
import 'dotenv/config'; 

const execPromise = util.promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

export let isDeepWorkActive = true;
export let sessionMetrics = { total: 0, alerts: 0, blocked: 0, auto: 0, focusTimeSaved: 0 };
export let sessionMissedMessages: Array<{sender: string, message: string, platform: string}> = [];

// 🧹 AUTO-CLEANUP: Remove stale Puppeteer lockfiles left from previous crashes
// This prevents the "browser already running" error on restart
const WA_SESSION_PATH = path.join(__dirname, '../.wwebjs_auth/session');
const STALE_FILES = ['SingletonLock', 'SingletonCookie'];
STALE_FILES.forEach(file => {
    const filePath = path.join(WA_SESSION_PATH, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 [Aegis] Cleared stale lock: ${file}`);
    }
});

const MEMORY_FILE_PATH = path.join(__dirname, '../memory.json');
const messageHistoryStore: Record<string, string[]> = {};

// --- MEMORY HELPERS ---
function getAegisMemory() {
    if (!fs.existsSync(MEMORY_FILE_PATH)) {
        return { identity: "", core_teammates: [], active_projects: {}, recreation_and_hobbies: [], learned_slang: [] };
    }
    const rawData = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
    return JSON.parse(rawData);
}

function saveAegisMemory(newMemory: any) {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(newMemory, null, 2));
}

// --- BULLETPROOF JSON EXTRACTOR ---
function extractDecisionJSON(text: string): any {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '');
    const possibleStarts = [];
    for (let i = 0; i < cleanText.length; i++) {
        if (cleanText[i] === '{') possibleStarts.push(i);
    }
    
    let validObjects = [];
    for (let i = 0; i < possibleStarts.length; i++) {
        const start = possibleStarts[i];
        let openBraces = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let j = start; j < cleanText.length; j++) {
            const char = cleanText[j];
            
            if (escapeNext) { escapeNext = false; continue; }
            if (char === '\\') { escapeNext = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            
            if (!inString) {
                if (char === '{') openBraces++;
                if (char === '}') {
                    openBraces--;
                    if (openBraces === 0) {
                        const jsonStr = cleanText.substring(start, j + 1);
                        try {
                            const fixedStr = jsonStr.replace(/False/g, 'false').replace(/True/g, 'true');
                            validObjects.push(JSON.parse(fixedStr));
                        } catch (e) {}
                        break;
                    }
                }
            }
        }
    }
    
    // Return the last parsed object that contains a 'verdict'
    for (let i = validObjects.length - 1; i >= 0; i--) {
        if (validObjects[i] && typeof validObjects[i].verdict === 'string') {
            return validObjects[i];
        }
    }
    return null;
}

// --- CORE AI GATEWAY ---
async function evaluateMessage(sender: string, message: string) {
    if (!/[a-zA-Z0-9]/.test(message)) {
        console.log(`\n⚡ [Fast Path] Target is just an emoji or punctuation. Auto-blocking.`);
        return { is_hobby: false, matched_slang: false, is_casual: true, verdict: "block", auto_reply: false };
    }
    
    const currentMemory = getAegisMemory();
    const teammates: string[] = currentMemory.core_teammates || [];
    const projects: Record<string, string> = currentMemory.active_projects || {};
    const hobbies: string[] = currentMemory.recreation_and_hobbies || [];
    const learnedSlang: string[] = currentMemory.learned_slang || [];

    const isSenderTeammate = teammates.some(t =>
        sender.toLowerCase().includes(t.toLowerCase().split(' ')[0].toLowerCase())
    );

    if (!messageHistoryStore[sender]) messageHistoryStore[sender] = [];
    messageHistoryStore[sender].push(message);
    if (messageHistoryStore[sender].length > 3) messageHistoryStore[sender].shift();
    const historyContext = messageHistoryStore[sender].join(' | ');

    const msgLower = message.toLowerCase().trim();

    // ════════════════════════════════════════════════════════
    // LAYER 1 — CODE: SLANG CHECK (no LLM needed, 100% reliable)
    // ════════════════════════════════════════════════════════
    for (const entry of learnedSlang) {
        const phrase = entry.split('->')[0].trim().toLowerCase();
        // Match if the message contains the slang phrase (fuzzy: ignoring punctuation)
        const normalized = msgLower.replace(/[^a-z0-9\s]/g, '');
        const normalizedPhrase = phrase.replace(/[^a-z0-9\s]/g, '');
        if (normalized.includes(normalizedPhrase)) {
            console.log(`\n⚡ [L1 Slang] "${phrase}" matched → ESCALATE`);
            return { is_hobby: false, matched_slang: true, is_casual: false, verdict: "escalate", auto_reply: false };
        }
    }

    // ════════════════════════════════════════════════════════
    // LAYER 2 — CODE: SOCIAL/HOBBY BLOCK (no LLM needed)
    // ════════════════════════════════════════════════════════
    const TECH_KEYWORDS = /\b(server|crash|down|error|bug|broken|fail|prod|deploy|hotfix|rollback|database|api|outage|exception|500|404|build|pipeline|ci|alert|urgent|asap)\b/i;
    const hasTech = TECH_KEYWORDS.test(message);
    const projectNames = Object.keys(projects);
    const hasProject = projectNames.some(p => msgLower.includes(p.toLowerCase()));

    const SOCIAL_SIGNALS = [
        /\b(lunch|dinner|breakfast|coffee|food|eat|drinks?)\b/i,
        /\b(wanna|want to|up for|wanna grab|lets? (go|hang|meet|catch up))\b/i,
        /\b(how are you|how r u|how's it going|what'?s up|wassup|sup)\b/i,
        /\b(you free|are you free|you available|you around|you up)\b/i,
        /\b(party|hangout|hang out|weekend plans|tonight|this evening)\b/i,
        /^(hey|hi|hello|yo|sup|heyy|heyyy|hola)\b/i,
        /\bdid you (watch|see|catch|play)\b/i,
    ];
    const isSocial = SOCIAL_SIGNALS.some(r => r.test(message));
    const hobbyWords = hobbies.flatMap(h => h.toLowerCase().split(/[\s\/]/));
    const hasHobby = hobbyWords.some(w => w.length > 2 && msgLower.includes(w));

    if ((isSocial || hasHobby) && !hasTech && !hasProject) {
        console.log(`\n⚡ [L2 Social] Social/hobby message → BLOCK`);
        console.log(`   isSocial=${isSocial} hasHobby=${hasHobby} hasTech=${hasTech} hasProject=${hasProject}`);
        return { is_hobby: hasHobby, matched_slang: false, is_casual: true, verdict: "block", auto_reply: true };
    }
    console.log(`\n🔍 [Debug L2 miss] isSocial=${isSocial} hasHobby=${hasHobby} hasTech=${hasTech} hasProject=${hasProject} msg="${message}"`);


    // ════════════════════════════════════════════════════════
    // LAYER 3 — CODE: REACTION/GIBBERISH IGNORE (no LLM needed)
    // ════════════════════════════════════════════════════════
    const REACTION = /^((ok|okay|cool|lol|lmao|haha|hehe|sure|yep|nope|nice|great|k|hmm|wow|noted|got it|👍|👌|😂|🙂|😊|thx|thanks|ty|np|no prob|fine|alright|aight|roger)[\s!.,]*)+$/i;
    if (REACTION.test(message.trim())) {
        console.log(`\n⚡ [L3 Reaction] Reaction message → IGNORE`);
        return { is_hobby: false, matched_slang: false, is_casual: true, verdict: "ignore", auto_reply: false };
    }

    // ════════════════════════════════════════════════════════
    // LAYER 3.5 — CODE: CRITICAL EMERGENCY (no LLM needed)
    // ════════════════════════════════════════════════════════
    const CRITICAL_EMERGENCY = /\b(is down|are down|crashed|crashing|not working|broken|urgent|asap|failing|failed|fatal|emergency)\b/i;
    if (hasTech && CRITICAL_EMERGENCY.test(message)) {
        console.log(`\n⚡ [L3.5 Critical] Tech keyword + Emergency phrase → ESCALATE`);
        return { is_hobby: false, matched_slang: false, is_casual: false, verdict: "escalate", auto_reply: false };
    }

    // ════════════════════════════════════════════════════════
    // LAYER 4 — LLM: only for ambiguous messages
    // (has tech keywords but unclear context, or teammate message, etc.)
    // ════════════════════════════════════════════════════════
    const slangList = learnedSlang.map(s => {
        const [phrase, meaning] = s.split('->').map(p => p.trim());
        return `"${phrase}" = ${meaning}`;
    }).join('; ');

    const input = `<system>
- escalate: message is a genuine work emergency (server down, crash, production issue, data loss, security breach, or explicit urgent work request)
- block: message is casual social chat with no work urgency
- ignore: message is a reaction, spam, or zero actionable content

JSON Schema to follow: {"is_hobby":boolean,"matched_slang":boolean,"is_casual":boolean,"verdict":"block"|"ignore"|"escalate","reason":"Brief explanation of why this verdict was chosen","auto_reply":boolean}

MESSAGE: "${message}"

JSON:`;

    const uniqueSessionId = `aegis-eval-${Date.now()}`;
    
    // 🔥 THE FIX: Save the prompt to the Mac's hidden /tmp folder
    const tempFilePath = path.join(os.tmpdir(), `aegis_prompt_${uniqueSessionId}.txt`);

    try {
        fs.writeFileSync(tempFilePath, input);

        const { stdout } = await execPromise(`openclaw agent --session-id ${uniqueSessionId} --message "$(cat '${tempFilePath}')" --thinking off`, {
            cwd: '../agent'
        });

        // Delete the file instantly so we don't clog up your hard drive
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        let searchArea = stdout;
        const marker = "JSON:";
        const markerIndex = stdout.lastIndexOf(marker);
        if (markerIndex !== -1) {
            searchArea = stdout.substring(markerIndex + marker.length);
        }

        let parsedDecision = extractDecisionJSON(searchArea);
        
        // Fallback: if we didn't find anything after the marker, search the entire string
        if (!parsedDecision) {
            parsedDecision = extractDecisionJSON(stdout);
        }

        if (!parsedDecision) {
            console.error("\n❌ [Agent Error] Output didn't contain valid JSON with a verdict:\n", stdout);
            return { is_hobby: false, matched_slang: false, is_casual: false, verdict: "escalate", auto_reply: false };
        }

        return parsedDecision;

    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        console.error('\n❌ FATAL EXECUTION ERROR:\n', error);
        return { is_hobby: false, matched_slang: false, is_casual: false, verdict: "escalate", auto_reply: false };
    }
}

async function processInterception(platform: string, sender: string, messageText: string, decision: any) {
    sessionMetrics.total++;
    if (decision.verdict === 'escalate') sessionMetrics.alerts++;
    else if (decision.verdict === 'block' || decision.verdict === 'ignore') {
        if (decision.verdict === 'block') {
            sessionMetrics.blocked++;
            sessionMetrics.focusTimeSaved += 3;
        }
        sessionMissedMessages.push({ platform, sender, message: messageText });
    }
    
    if (decision.auto_reply) sessionMetrics.auto++;

    io.emit('new_interception', {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        platform,
        sender,
        message: messageText,
        decision,
        timestamp: new Date().toISOString()
    });
    io.emit('metrics_update', sessionMetrics);
}

// --- 1. EXPRESS ROUTES ---
app.post('/api/webhook/discord', async (req, res) => {
    const { sender, message } = req.body;
    console.log(`\n🔎 [ROUTE HIT] sender="${sender}" message="${message}"`);
    if (!isDeepWorkActive) return res.json({ status: 'ignored_deep_work_off' });
    try {
        const decision = await evaluateMessage(sender, message);
        await processInterception('Discord Webhook', sender, message, decision);
        res.json({ status: 'success', decision });
    } catch (error) {
        res.status(500).json({ error: 'Agent execution failed' });
    }
});

app.get('/api/settings/profile', (req, res) => {
    try {
        const memory = getAegisMemory();
        res.json(memory);
    } catch (e) {
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

app.post('/api/settings/profile', (req, res) => {
    try {
        const newProfile = req.body;
        // Basic validation: ensure we don't overwrite with garbage
        if (!newProfile.identity || !Array.isArray(newProfile.core_teammates)) {
            return res.status(400).json({ error: 'Invalid profile data' });
        }
        
        const memory = getAegisMemory();
        const updatedMemory = { ...memory, ...newProfile };
        saveAegisMemory(updatedMemory);
        
        console.log(`\n👤 [Aegis] Profile updated via Onboarding Wizard`);
        res.json({ status: 'success' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

app.get('/api/metrics', (req, res) => {
    res.json(sessionMetrics);
});

function stripLogNoise(text: string): string {
    // Strip ANSI codes
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    let clean = text.replace(ansiRegex, '');
    
    // Strip Runway/OpenClaw noise more aggressively
    const noisePatterns = [
        /The error message indicates that.*?\./gs,
        /To resolve this, you can try.*?\./gs,
        /Here's an example of how to call the.*?\./gs,
        /```.*?```/gs, 
        /If you're still facing issues.*?\./gs,
        /Additionally, if you're trying to call the tool.*?\./gs,
        /If this doesn't help resolve your issue.*?\./gs,
        /It looks like the `sessions_history` tool.*?\./gs,
        /Make sure to replace.*?\./gs,
        /If you're unsure how to obtain.*?\./gs,
        /\{[\s\n]*"function":.*?\n\}/gs,
        /\[plugins\].*?\n/gs,
        /runway installed.*?\n/gs,
        /@agentclientprotocol.*?\n/gs,
        /@lydell\/node-pty.*?\n/gs
    ];
    
    noisePatterns.forEach(pattern => {
        clean = clean.replace(pattern, '');
    });

    // Finally, if there's a "SUMMARY:" marker, only take what's after it
    const marker = "SUMMARY:";
    const markerIndex = clean.lastIndexOf(marker);
    if (markerIndex !== -1) {
        clean = clean.substring(markerIndex + marker.length);
    }

    // Fallback: If stripping everything left us with nothing, return a snippet of the raw output
    if (!clean.trim()) {
        return text.split('\n').filter(line => !line.includes('[plugins]') && !line.includes('runway')).slice(-5).join('\n').trim() || "Session concluded. Summary unavailable.";
    }

    return clean.trim();
}

app.post('/api/settings/mode', async (req, res) => {
    const active = req.body.active;
    isDeepWorkActive = active;
    let summary = "";

    if (!active && sessionMissedMessages.length > 0) {
        // We use 'openclaw chat' instead of 'agent' for summary to prevent it from trying to use tools
        // We also use a more restrictive prompt format
        const prompt = `[INST] <<SYS>>
You are Aegis, a notification firewall. The user just finished a Deep Work session. 
Summarize these missed messages concisely for the dashboard. 
Group by sender. Ignore trivial reactions. 
CRITICAL: Do NOT use any tools or functions. Output ONLY the summary text.
<</SYS>>

MISSED MESSAGES:
${sessionMissedMessages.map(m => `[${m.platform}] ${m.sender}: ${m.message}`).join('\n')}

SUMMARY: [/INST]`;
        
        const uniqueSessionId = `aegis-summary-${Date.now()}`;
        const tempFilePath = path.join(os.tmpdir(), `aegis_summary_${uniqueSessionId}.txt`);
        fs.writeFileSync(tempFilePath, prompt);

        try {
            // Using 'openclaw chat' is much safer for non-agentic tasks like summarization
            const { stdout } = await execPromise(`openclaw chat --message "$(cat '${tempFilePath}')"`, { cwd: path.join(__dirname, '../../agent') });
            summary = stripLogNoise(stdout);
        } catch (e) {
            console.error(e);
            summary = "Error generating summary.";
        }
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        sessionMissedMessages = [];
        sessionMetrics = { total: 0, alerts: 0, blocked: 0, auto: 0, focusTimeSaved: 0 };
        io.emit('metrics_update', sessionMetrics);
    } else if (!active) {
        summary = "No messages missed during this session.";
    }
    console.log(`\n🎛️ [Aegis] Deep Work Mode is now ${active ? 'ACTIVE' : 'INACTIVE'}`);
    res.json({ status: 'success', active: isDeepWorkActive, summary });
});

app.post('/api/webhook/learn', (req, res) => {
    const { category, newValue } = req.body;
    try {
        const memory = getAegisMemory();
        if (Array.isArray(memory[category])) {
            memory[category].push(newValue);
            saveAegisMemory(memory);
            console.log(`\n🧠 [Aegis Learned]: Array -> ${category}`);
            res.json({ status: 'success', message: 'Array memory updated' });
        } else if (typeof memory[category] === 'object' && memory[category] !== null) {
            Object.assign(memory[category], newValue);
            saveAegisMemory(memory);
            console.log(`\n🧠 [Aegis Learned]: Object -> ${category}`);
            res.json({ status: 'success', message: 'Object memory updated' });
        } else {
            res.status(400).json({ error: 'Invalid category' });
        }
    } catch (error) {
        console.error('\n❌ Memory Error:', error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

app.post(/^\/api\/webhook\/call/, async (req, res) => {
    let caller = req.body?.caller;
    if (!caller) {
        const path = req.path;
        if (path.startsWith('/api/webhook/call')) {
            caller = path.replace('/api/webhook/call', '');
        }
    }
    
    if (caller) {
        const cleanNumber = caller.replace(/[^0-9]/g, '');
        const chatId = `${cleanNumber}@c.us`;
        
        console.log(`\n[Gateway] Missed call intercepted from ${caller} (${chatId}).`);
        
        try {
            await waClient.sendMessage(chatId, `🛡️ *Aegis Auto-Response:* I missed your call because I'm currently in Deep Work mode. If this is an emergency, please reply exactly with the word *URGENT*.`);
            res.json({ status: 'success' });
        } catch (e) {
            console.error('\n❌ Error sending WhatsApp reply to missed call:', e);
            res.status(500).json({ error: 'Failed to send WhatsApp message' });
        }
    } else {
        res.status(400).json({ error: 'No caller ID provided' });
    }
});

// --- 3. REAL PERSONAL WHATSAPP ---
// Uses system Chrome for reliability over Puppeteer's bundled Chromium
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const useSystemChrome = fs.existsSync(CHROME_PATH);
if (useSystemChrome) console.log('🌐 [Aegis] Using system Chrome for WhatsApp.');
else console.log('⚠️  [Aegis] System Chrome not found, using bundled Chromium.');

const waClient = new WAClient({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js' 
    },
    puppeteer: {
        headless: true,
        executablePath: useSystemChrome ? CHROME_PATH : undefined,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ]
    }
});

waClient.on('qr', (qr) => {
    waReady = true; clearTimeout(waWatchdog);
    console.log('\n📱 [Aegis] No saved session found. Scan this QR code in WhatsApp (Linked Devices → Link a Device):');
    qrcode.generate(qr, { small: true });
});

waClient.on('loading_screen', (percent, message) => {
    waReady = true; clearTimeout(waWatchdog);
    console.log(`⏳ [Aegis WhatsApp] Loading... ${percent}% - ${message}`);
});

waClient.on('authenticated', () => {
    waReady = true; clearTimeout(waWatchdog);
    console.log('✅ [Aegis WhatsApp] Authenticated! Session saved locally.');
});

waClient.on('auth_failure', (msg) => {
    console.error('❌ [Aegis WhatsApp] Auth failed — session likely expired. Delete .wwebjs_auth folder and restart to get a fresh QR code.');
    console.error('   Reason:', msg);
});

waClient.on('disconnected', (reason) => {
    console.warn(`⚠️ [Aegis WhatsApp] Disconnected: ${reason}. Restart the server to reconnect.`);
});

waClient.on('ready', () => {
    waReady = true; clearTimeout(waWatchdog);
    console.log('🤖 [Aegis WhatsApp] Successfully linked!');
});

waClient.on('message', async (message: WAMessage) => {
    const isGroup = message.from.endsWith('@g.us');
    
    if (message.from === 'status@broadcast' || message.fromMe || isGroup) return;

    const senderPhone = message.from.replace('@c.us', ''); 
    
    // Attempt to fetch their saved contact name or public pushname
    let contactName = senderPhone;
    try {
        const contact = await message.getContact();
        contactName = contact.name || contact.pushname || senderPhone;
    } catch (e) {
        console.warn('Could not fetch contact name, using phone number.');
    }

    console.log(`\n[WhatsApp Intercept] From ${contactName} (${senderPhone}): "${message.body}"`);

    // URGENT OVERRIDE
    if (message.body.trim().toUpperCase() === 'URGENT') {
        console.log(`\n🚨 [URGENT OVERRIDE] Caller ${contactName} bypassed the AI gate!`);
        await message.reply(`🚨 *[PRIORITY ESCALATION]* Bypassing gate. Notifying Anupam immediately!`);
        try { await message.react('🚨'); } catch(e) {} 
        notifier.notify({ title: '🚨 URGENT WHATSAPP OVERRIDE', message: `Urgent request from ${contactName}`, sound: 'Basso' });
        if (isDeepWorkActive) {
            await processInterception('WhatsApp', contactName, message.body, { verdict: 'escalate', is_casual: false, matched_slang: false, is_hobby: false, auto_reply: false });
        }
        return;
    }

    if (!isDeepWorkActive) return;

    try {
        // Pass the readable name so AI knows if they're a teammate
        const decision = await evaluateMessage(contactName, message.body);
        
        console.log(`🧠 [Aegis WhatsApp Decision]:`, decision);
        await processInterception('WhatsApp', contactName, message.body, decision);

        const memory = getAegisMemory();
        const userName = memory.identity.split(',')[0].replace('I am ', '').trim() || 'the user';

        if (decision.verdict === 'block' || decision.verdict === 'ignore') {
            if (decision.auto_reply || decision.is_casual) {
                await message.reply(`🛡️ *Aegis Auto-Response:* ${userName} is in Deep Work. Muting notification.`);
            } else {
                console.log(`🤫 [Aegis] Silently blocking (auto_reply is false).`);
            }
        } else if (decision.verdict === 'escalate') {
            await message.reply(`🚨 *[PRIORITY ESCALATION]* Bypassing gate. Notifying ${userName} immediately!`);
            try { await message.react('🚨'); } catch(e) {} 
            notifier.notify({ title: `🚨 WHATSAPP: ${contactName}`, message: `${message.body}`, sound: 'Basso' });
        }
    } catch (error) { console.error(error); }
});

// Watchdog: if NO WhatsApp event fires within 90s, the session is corrupted — auto-recover
// 90s because loading a saved session via system Chrome can legitimately take 60+ seconds
let waReady = false;
const WA_SESSION_DIR = path.join(__dirname, '../.wwebjs_auth');

const waWatchdog = setTimeout(() => {
    if (!waReady) {
        console.warn('\n⚠️  [Aegis] WhatsApp stuck after 90s — session is corrupted.');
        console.warn('   Run this to fix: rm -rf ' + WA_SESSION_DIR + ' && npm run dev');
        console.warn('   A fresh QR code will appear on next startup.');
    }
}, 90000);

waClient.initialize().catch((err) => {
    clearTimeout(waWatchdog);
    console.error('❌ [Aegis WhatsApp] Failed to initialize:', err.message);
});

// --- 2. LIVE DISCORD BOT ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OWNER_USERNAMES = (process.env.OWNER_USERNAMES || '').split(',').map(name => name.trim());

const client = new DiscordClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.on('ready', () => {
    console.log(`🤖 [Aegis Bot] Online as ${client.user?.tag}`);
});

client.on('messageCreate', async (message: DiscordMessage) => {
    if (message.author.bot || OWNER_USERNAMES.includes(message.author.username)) {
        return; 
    }

    console.log(`\n[Discord Intercept] Evaluating message from ${message.author.username}: "${message.content}"`);

    if (!isDeepWorkActive) return;

    try {
        const decision = await evaluateMessage(message.author.username, message.content);
        
        console.log(`🧠 [Aegis Discord Decision]:`, decision);
        await processInterception('Discord', message.author.username, message.content, decision);

        const memory = getAegisMemory();
        const userName = memory.identity.split(',')[0].replace('I am ', '').trim() || 'the user';

        if (decision.verdict === 'block' || decision.verdict === 'ignore') {
            if (decision.auto_reply || decision.is_casual) {
                await message.reply(`🛡️ **Aegis Auto-Response:** ${userName} is in Deep Work. Muting notification.`);
            } else {
                console.log(`🤫 [Aegis] Silently blocking (auto_reply is false).`);
            }
        } else if (decision.verdict === 'escalate') {
            await message.reply(`🚨 **[PRIORITY ESCALATION]** Bypassing Deep Work gate. Notifying ${userName} immediately!`);
            try { await message.react('🚨'); } catch(e) {} 
            notifier.notify({ title: '🚨 DISCORD OVERRIDE', message: `Urgent: ${message.content}`, sound: 'Basso' });
        }
    } catch (error) { console.error(error); }
});

if (DISCORD_TOKEN) client.login(DISCORD_TOKEN);

httpServer.listen(3000, () => console.log(`🛡️ Aegis API Gateway alive on port 3000`));

// --- GRACEFUL SHUTDOWN ---
// Properly kills Puppeteer's Chromium on Ctrl+C so the SingletonLock is released
// Without this, the next startup always fails with "browser already running"
async function shutdown(signal: string) {
    console.log(`\n⛔ [Aegis] ${signal} received. Shutting down gracefully...`);
    try {
        await waClient.destroy();
        console.log('✅ [Aegis] WhatsApp client destroyed. Chrome closed.');
    } catch (e) {
        console.warn('⚠️  Could not destroy WA client cleanly:', (e as Error).message);
    }
    process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));