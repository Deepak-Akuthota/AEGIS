---
name: send_discord_reply
description: Sends the generated auto-response back to the specific Discord user via the local Node.js Gateway.
inputs:
  - name: sender_id
    type: string
  - name: reply_text
    type: string
---

# EXECUTION
Execute an HTTP POST request to the local Gateway API.

**URL:** http://localhost:3000/api/discord/reply
**Method:** POST
**Headers:** 
  Content-Type: application/json
**Body:**
{
  "target_user_id": "{{sender_id}}",
  "message": "{{reply_text}}"
}