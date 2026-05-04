import express from 'express';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);
const app = express();
app.use(express.json());

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

// --- 1. CORE DISCORD ROUTER ---
app.post('/api/webhook/discord', async (req, res) => {
    const { sender, message } = req.body;
    console.log(`\n[Gateway] Evaluating message from ${sender}...`);

    const currentMemory = getAegisMemory();
    const userContext = JSON.stringify(currentMemory, null, 2);

    const learnedSlang = currentMemory.learned_slang || [];
    const slangContext = learnedSlang.length > 0 
        ? `\nCRITICAL LEARNED SLANG (Highest Priority):\n- ${learnedSlang.join("\n- ")}` 
        : "";

    if (!messageHistoryStore[sender]) messageHistoryStore[sender] = [];
    messageHistoryStore[sender].push(message);
    if (messageHistoryStore[sender].length > 3) messageHistoryStore[sender].shift();
    const historyContext = messageHistoryStore[sender].join(" | ");

    try {
        // 🔥 THE FIX: Tightened Chain of Thought
        const input = `You are Aegis, a strict JSON-only routing API.

=== SYSTEM CONTEXT ===
${userContext}
${slangContext}

=== INCOMING SIGNAL ===
Sender: ${sender}
Recent History: [ ${historyContext} ]
Message: "${message}"

=== CHAIN OF THOUGHT EVALUATION ===
To prevent errors, generate your JSON response in this EXACT order:
1. "is_hobby": true ONLY IF the message explicitly mentions an item from "recreation_and_hobbies" (e.g., "Elden Ring", "F1"). Otherwise false.
2. "matched_slang": true ONLY IF the message uses the EXACT phrases from the CRITICAL LEARNED SLANG list. Do NOT mark true for generic tech words like "server down" or "500 error".
3. "is_casual": true if "is_hobby" is true, OR if the message is general chit-chat/lunch plans.
4. "verdict": "block" if is_casual is true. "escalate" ONLY IF matched_slang is true OR if it is a legitimate work emergency related to "active_projects".
5. "auto_reply": true if verdict is "block", false if "escalate".

Output ONLY valid JSON.
YOUR JSON:`;
        
        const uniqueSessionId = `aegis-eval-${Date.now()}`;
        
        // 🔥 THE FIX: Escape single quotes for the Bash terminal
        const safeInput = input.replace(/'/g, "'\\''");

        const { stdout } = await execPromise(`openclaw agent --session-id ${uniqueSessionId} --message '${safeInput}'`, {
            cwd: '../agent' 
        });

        const jsonRegex = /\{[\s\S]*?\}/;
        const match = stdout.match(jsonRegex);
        if (!match) throw new Error("Agent failed to generate JSON.");

        // Gateway Sanitizer
        let cleanJson = match[0].replace(/\\"/g, '"'); 
        cleanJson = cleanJson.replace(/False/gi, 'false').replace(/True/gi, 'true'); 

        const decision = JSON.parse(cleanJson);
        console.log('\n🛡️ [Aegis Action]:', decision);
        res.json({ status: 'success', decision, message_processed: message });

    } catch (error) {
        console.error('\n❌ Gateway Error:', error);
        res.status(500).json({ error: 'Agent execution failed' });
    }
});

// --- 2. THE LEARNING ROUTE ---
app.post('/api/webhook/learn', (req, res) => {
    const { category, newValue } = req.body;
    
    try {
        const memory = getAegisMemory();
        
        if (Array.isArray(memory[category])) {
            memory[category].push(newValue);
            saveAegisMemory(memory);
            console.log(`\n🧠 [Aegis Learned]: Array -> ${category}`);
            res.json({ status: 'success', message: 'Array memory updated' });
        } 
        else if (typeof memory[category] === 'object' && memory[category] !== null) {
            Object.assign(memory[category], newValue);
            saveAegisMemory(memory);
            console.log(`\n🧠 [Aegis Learned]: Object -> ${category}`);
            res.json({ status: 'success', message: 'Object memory updated' });
        } 
        else {
            res.status(400).json({ error: 'Invalid category' });
        }
    } catch (error) {
        console.error('\n❌ Memory Error:', error);
        res.status(500).json({ error: 'Failed to update memory' });
    }
});

// --- 3. MISSED CALLS (Desi Voicemail) ---
app.post('/api/webhook/call', (req, res) => {
    const { caller } = req.body;
    console.log(`\n[Gateway] Missed call intercepted from ${caller}.`);
    res.json({ status: 'success', decision: { verdict: 'auto_respond', message: "Anupam is in deep work. Reply 'URGENT' if critical." }});
});

app.listen(3000, () => console.log(`🛡️ Aegis Gateway alive on port 3000`));