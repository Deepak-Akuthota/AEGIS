# BACKGROUND DAEMON: POST-SESSION DIGEST

**Trigger:** 
Listen for system state change: `SESSION_STATUS == "inactive"`

**Action:**
1. Access local `memory/` logs for the current session.
2. Retrieve all messages where `action == "block"`.
3. Synthesize a concise "Post-Session Digest".
4. Group messages by Sender.
5. Highlight any messages that were borderline urgent but ultimately blocked.

**Output Destination:**
POST the synthesized markdown digest to `http://localhost:3000/api/digest/update` so the React dashboard can display it immediately.