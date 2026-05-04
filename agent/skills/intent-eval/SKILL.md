---
name: evaluate_intent
description: Analyzes an incoming message to determine if it should interrupt a deep work session.
inputs:
  - name: sender_id
    type: string
  - name: message_content
    type: string
  - name: timestamp
    type: string
---

# TASK
You have received a new message from a Discord webhook.
**Sender:** {{sender_id}}
**Time:** {{timestamp}}
**Message:** "{{message_content}}"

# INSTRUCTIONS
1. Consult your URGENCY HEURISTICS in SOUL.md.
2. Analyze the `message_content`.
3. Output the strict JSON decision payload. DO NOT output any conversational text outside of the JSON block.

# EXPECTED OUTPUT FORMAT
```json
{
  "action": "...",
  "auto_reply": true/false,
  "reasoning": "..."
}