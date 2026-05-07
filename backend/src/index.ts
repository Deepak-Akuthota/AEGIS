import express from 'express';
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
app.use(express.json());

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
    const userContext = JSON.stringify(currentMemory); 
    
    const learnedSlang = currentMemory.learned_slang || [];
    const slangContext = learnedSlang.length > 0 ? `\nCRITICAL LEARNED SLANG:\n- ${learnedSlang.join("\n- ")}` : "";
    const dynamicSlangExample = learnedSlang.length > 0 ? learnedSlang[0].split('->')[0].trim() : "system crashed";

    if (!messageHistoryStore[sender]) messageHistoryStore[sender] = [];
    messageHistoryStore[sender].push(message);
    if (messageHistoryStore[sender].length > 3) messageHistoryStore[sender].shift();
    const historyContext = messageHistoryStore[sender].join(" | ");

    const input = `<system>You are Aegis, a strict JSON-only routing API.
CRITICAL RULES:
1. NEVER USE ANY TOOLS (No web_search, No plugins, No web scraping).
2. YOU ARE A RAW TEXT CLASSIFIER.
3. OUTPUT ONLY A SINGLE VALID JSON OBJECT.
4. DO NOT WRITE ANY CONVERSATIONAL TEXT OR MARKDOWN.

Respond EXACTLY with this JSON schema:
{
  "is_hobby": boolean,
  "matched_slang": boolean,
  "is_casual": boolean,
  "verdict": "block" | "ignore" | "escalate",
  "auto_reply": boolean
}</system>

=== SYSTEM CONTEXT ===
${userContext}
${slangContext}

=== DYNAMIC EXAMPLES ===
Recent History: [ "Bro our backend is down" ]
TARGET MESSAGE: "hey wanna join for lunch?"
Output: {"is_hobby": false, "matched_slang": false, "is_casual": true, "verdict": "block", "auto_reply": true}

Recent History: [ "just pushed the code" ]
TARGET MESSAGE: "Bro ${dynamicSlangExample}, check the server!"
Output: {"is_hobby": false, "matched_slang": true, "is_casual": false, "verdict": "escalate", "auto_reply": false}

=== INCOMING SIGNAL ===
Recent History: [ ${historyContext} ]
TARGET MESSAGE: "${message}"

=== CHAIN OF THOUGHT EVALUATION ===
Evaluate ONLY the TARGET MESSAGE against the system context.
Output ONLY valid JSON matching the exact schema above. No other text.
YOUR JSON:`;

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
        const marker = "YOUR JSON:";
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

// --- 1. EXPRESS ROUTES ---
app.post('/api/webhook/discord', async (req, res) => {
    const { sender, message } = req.body;
    try {
        const decision = await evaluateMessage(sender, message);
        res.json({ status: 'success', decision });
    } catch (error) {
        res.status(500).json({ error: 'Agent execution failed' });
    }
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
const waClient = new WAClient({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

waClient.on('qr', (qr) => {
    console.log('\n📱 [Aegis] Scan this QR code:');
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
    console.log('🤖 [Aegis WhatsApp] Successfully linked!');
});

waClient.on('message', async (message: WAMessage) => {
    const isGroup = message.from.endsWith('@g.us');
    
    if (message.from === 'status@broadcast' || message.fromMe || isGroup) return;

    const sender = message.from.replace('@c.us', ''); 
    console.log(`\n[WhatsApp Intercept] From ${sender}: "${message.body}"`);

    // URGENT OVERRIDE
    if (message.body.trim().toUpperCase() === 'URGENT') {
        console.log(`\n🚨 [URGENT OVERRIDE] Caller ${sender} bypassed the AI gate!`);
        await message.reply(`🚨 *[PRIORITY ESCALATION]* Bypassing gate. Notifying Anupam immediately!`);
        try { await message.react('🚨'); } catch(e) {} 
        notifier.notify({ title: '🚨 URGENT WHATSAPP OVERRIDE', message: `Urgent request from ${sender}`, sound: 'Basso' });
        return;
    }

    try {
        const decision = await evaluateMessage(sender, message.body);
        
        console.log(`🧠 [Aegis WhatsApp Decision]:`, decision);

        if (decision.verdict === 'block' || decision.verdict === 'ignore') {
            if (decision.auto_reply || decision.is_casual) {
                await message.reply(`🛡️ *Aegis Auto-Response:* Anupam is in Deep Work. Muting notification.`);
            } else {
                console.log(`🤫 [Aegis] Silently blocking (auto_reply is false).`);
            }
        } else if (decision.verdict === 'escalate') {
            await message.reply(`🚨 *[PRIORITY ESCALATION]* Bypassing gate. Notifying Anupam immediately!`);
            try { await message.react('🚨'); } catch(e) {} 
            notifier.notify({ title: '🚨 WHATSAPP OVERRIDE', message: `Urgent: ${message.body}`, sound: 'Basso' });
        }
    } catch (error) { console.error(error); }
});

waClient.initialize();

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

    try {
        const decision = await evaluateMessage(message.author.username, message.content);
        
        console.log(`🧠 [Aegis Discord Decision]:`, decision);

        if (decision.verdict === 'block' || decision.verdict === 'ignore') {
            if (decision.auto_reply || decision.is_casual) {
                await message.reply(`🛡️ **Aegis Auto-Response:** Anupam is in Deep Work. Muting notification.`);
            } else {
                console.log(`🤫 [Aegis] Silently blocking (auto_reply is false).`);
            }
        } else if (decision.verdict === 'escalate') {
            await message.reply(`🚨 **[PRIORITY ESCALATION]** Bypassing Deep Work gate. Notifying Anupam immediately!`);
            try { await message.react('🚨'); } catch(e) {} 
            notifier.notify({ title: '🚨 DISCORD OVERRIDE', message: `Urgent: ${message.content}`, sound: 'Basso' });
        }
    } catch (error) { console.error(error); }
});

if (DISCORD_TOKEN) client.login(DISCORD_TOKEN);

app.listen(3000, () => console.log(`🛡️ Aegis API Gateway alive on port 3000`));