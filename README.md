# ⚡ SyncClash: Real-Time Multiplayer Party Showdown

A real-time multiplayer party game built for the **AI Skills Studio Challenge**. Players join using a 4-letter room code from any device (phone, laptop, tablet) with **zero logins or downloads required**.

---

## 🎮 Game Rules & Mechanics

1. **Instant Join**:
   - Host clicks **"Create Room"** (gets a 4-character code, e.g., `ABCD`).
   - Host chooses question categories and round length (5, 7, or 10 rounds).
   - Friends join from their phone or browser by typing the code or clicking the direct invite link.
2. **Speed-Based Scoring**:
   - Each question has a synchronized 15-second timer.
   - Correct answers earn up to **1,000 points** (500 base + up to 500 speed bonus).
   - Streak multipliers grant up to **+500 extra bonus points** for consecutive correct answers!
3. **Synchronized Real-Time Screen Sync**:
   - 3-2-1 countdown synchronized across all players.
   - Live indicators show when friends lock in their answer without giving away their selection.
   - Explanatory trivia reveal with instant rank updates.
   - Grand podium finish (🥇 1st, 🥈 2nd, 🥉 3rd) with celebratory confetti!
4. **Interactive Features**:
   - Floating live emoji reactions (🔥, 👏, 😂, ⚡, 🤯) in lobby and gameplay.
   - Synthesized Web Audio API sound effects (no external audio files needed).
   - Mobile-first responsive glassmorphism dark mode.

---

## 🚀 Running Locally

The server is running live locally at:
👉 **[http://localhost:3000](http://localhost:3000)**

### How to test multiplayer with 2+ players:
1. Open [http://localhost:3000](http://localhost:3000) in your main browser tab (Tab 1: Host).
2. Click **Create Room** and copy the 4-letter room code.
3. Open a **Private / Incognito** window (Tab 2: Player 2) and go to [http://localhost:3000](http://localhost:3000).
4. Enter the room code and click **Join Game**.
5. Switch to Tab 1 and click **Start Game 🚀**!

---

## 🌐 Deploying to a Public Live URL (For Submission)

To submit the challenge with a live public URL reachable across different devices on the internet:

### Option 1: Render (Easiest & Free)
1. Push this folder to a GitHub repository.
2. Go to [render.com](https://render.com) and click **New + > Web Service**.
3. Select your repo, set **Build Command**: `npm install`, and **Start Command**: `npm start`.
4. Render gives you a public HTTPS URL (e.g., `https://syncclash.onrender.com`).

### Option 2: Railway
1. Install Railway CLI or connect your GitHub repository at [railway.app](https://railway.app).
2. It automatically detects Node.js and deploys your WebSocket server with a public domain.

### Option 3: Glitch / Replit
- Simply import or upload this directory into Glitch or Replit to get an instant live public URL in 60 seconds.

