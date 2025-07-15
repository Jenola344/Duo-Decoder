# 🎮 Duo Decoder

**Duo Decoder** is a fast-paced, collaborative guessing game where two players team up to crack secret words using limited clues — all within a time limit. It’s fun, social, and designed to bring people together through communication and intuition.

---

## 📚 Table of Contents

- [Features](#features)
- [Game Overview](#game-overview)
- [How to Play](#how-to-play)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [What's Next](#whats-next)
- [About Me](#about-me)

---

## ✨ Features

- 👯‍♂️ Duo team-based gameplay
- ⏱️ Time-limited rounds to boost excitement
- 🔀 Rotating roles (Clue Master & Code Breaker)
- 🎲 Multiple-choice guessing mechanic
- 🧠 Predefined clue sets (no typing needed)
- 🔗 Invite link system to pair players
- 📦 Stateless game logic (Farcaster-compatible)
- 🎨 Clean, animated UI with responsive design

---

## 🎮 Game Overview

**Duo Decoder** is a game of teamwork and deduction. Players enter the game in pairs and must take turns giving and interpreting clues to guess secret words. Each game consists of 5 rounds, with players switching roles each time.

It’s simple to learn but becomes more challenging and fun as players try to communicate effectively with limited clues and tight time constraints.

---

## 🕹️ How to Play

1. **Create a Duo Room**
   - Start the game and receive an invite link to share.
   - Or join an existing game from someone else's invite.

2. **Pick a Role**
   - Choose to be either the Clue Master or the Code Breaker.
   - Roles alternate each round for balance.

3. **Play Rounds**
   - Clue Master receives a secret word and selects 2–3 clues from a predefined list.
   - Code Breaker sees the clues and guesses the correct word from 4 options.

4. **Win Together**
   - Each correct guess adds to your team’s score.
   - Play all 5 rounds and aim for a perfect score!

---

## 🧑‍💻 Tech Stack

### Frontend:
- **React + Vite** — Fast, modern SPA framework
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Smooth animations and transitions

### Game Logic:
- **React Context** — Shared game state across components
- **LocalStorage or In-Memory State** — For temporary session tracking
- **URL Params** — To identify and connect players

### Future Changes for Farcaster Frame Version:
- **Farcaster Frames v2 SDK**
- **Next.js API routes** or **Edge Functions**
- **Redis / Supabase** — Temporary storage for game sessions

---

