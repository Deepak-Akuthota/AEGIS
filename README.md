# 🛡️ Aegis: The State-Based Zen Mode Shield

[![Framework: React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20TS-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![AI: OpenClaw](https://img.shields.io/badge/AI-OpenClaw%20%2B%20LLM-blueviolet?style=flat-square)](https://github.com/openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Aegis** is an AI-powered notification firewall designed to protect your cognitive flow. Unlike traditional "Do Not Disturb" modes that block everything, Aegis uses a **Hybrid Layered Classifier** to understand context, identity, and urgency, allowing critical emergencies through while silently archiving the noise.

---

## 🌊 The Philosophy: State-Based Zen
Aegis operates on three distinct psychological states:
1. **Idle**: Your workspace preparation area. Monitor your general metrics and prepare for focus.
2. **Zen (Deep Work)**: A distraction-free dark environment. No feeds, no pop-ups, just a calming ripple animation and total silence.
3. **Digest**: A post-focus "Welcome Back" experience. Review everything Aegis handled for you and teach the AI through a human-in-the-loop feedback system.

---

## ✨ Key Features
- **🧠 Hybrid Layered Classifier**: A 3-stage filtering system (Regex -> Keyword/Context -> LLM Reasoning) that understands technical emergencies and Hinglish slang.
- **🌑 Ultra-Minimalist Zen Mode**: Visual shielding to protect your psychological flow state.
- **📋 Post-Session Digest**: Grouped message summaries with instant feedback controls.
- **🔄 Human-in-the-Loop Learning**: Correct the AI directly from the UI to update your `memory.json` profile in real-time.
- **🌐 WhatsApp Integration**: Native-like interception of WhatsApp Web messages via OpenClaw.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS (Vanilla CSS modules), Framer Motion (Animations), Lucide React.
- **Backend**: Node.js, TypeScript, Express, Socket.io (Real-time events).
- **AI/Integration**: OpenClaw (Browser automation), Local LLM (via Ollama/Gemma).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **Ollama**: For local LLM processing (Required for L3 classification).
- **OpenClaw**: For WhatsApp Web gateway integration.

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/AEGIS.git
   cd AEGIS
   ```

2. **Install Dependencies**
   ```bash
   # Install Frontend deps
   npm install

   # Install Backend deps
   cd backend
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3000
   OPENCLAW_URL=http://localhost:4000
   LLM_MODEL=gemma2:2b
   ```

---

## 🏃 Running the Application

### Phase 1: Start Services
Ensure your local AI and Gateway services are running first:
```bash
# Start Ollama (Terminal 1)
ollama serve

# Start OpenClaw Gateway (Terminal 2)
openclaw gateway
```

### Phase 2: Start Aegis
Follow the commands for your specific Operating System:

#### 🍏 macOS / 🐧 Linux
```bash
# In the root directory (Terminal 3 - Frontend)
npm run dev

# In the /backend directory (Terminal 4 - Backend)
npm run dev
```

#### 🪟 Windows (PowerShell)
```powershell
# In the root directory (Terminal 3 - Frontend)
npm run dev

# In the \backend directory (Terminal 4 - Backend)
cd backend
npm run dev
```

---

## 🗄️ Project Structure
```text
AEGIS/
├── src/                # React Frontend
│   ├── components/     # UI Design System
│   ├── pages/          # Dashboard (Idle, Zen, Digest)
│   └── utils/          # Socket & CN utilities
├── backend/            # Node.js + TS Server
│   ├── src/            # Core AI Logic & API Gateway
│   ├── memory.json     # Personal Identity & Slang Profile (THE BRAIN)
│   └── index.ts        # Hybrid Layered Classifier
└── public/             # Static Assets
```

---

## 🎯 Configuration: The `memory.json`
Aegis's intelligence is driven by your personal `memory.json`. You can customize:
- `identity`: Who you are and what you do.
- `core_teammates`: List of people whose messages should be prioritized.
- `active_projects`: Project names for the AI to watch for.
- `learned_slang`: Hinglish or tech-slang (e.g., *"prod gaya"*, *"phat gaya"*) to trigger emergency escalations.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Built with ❤️ for Focus by the Aegis Team</p>
