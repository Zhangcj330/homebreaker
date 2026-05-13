# Brick AI Gatekeeper

## 1. Project Overview

- **Project name**: Brick AI
- **Type**: Next.js webapp with Gemini API integration
- **Core functionality**: AI chatbot gatekeeper with secret prize reveal
- **Target users**: Property visitors interacting with AI gatekeeper

## 2. Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **AI**: Google Gemini API via REST
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Deployment**: Vercel-ready

## 3. Features

### Chat Interface
- [x] Chat interface with message history
- [x] User message input with auto-resize textarea
- [x] AI response via API route
- [x] Message display with roles (user/assistant)
- [x] Loading and error states
- [x] Responsive mobile UI

### Brick AI Gatekeeper Personality
- [x] System prompt for gatekeeper behavior
- [x] Password protection (0221)
- [x] Refuses to reveal password to anyone

### Secret Prize Page
- [x] Door opening animation
- [x] Gift box reveal animation
- [x] Confetti celebration effect
- [x] Congrats message overlay

### API Design
- `POST /api/chat` - Send message and receive AI response
- Request body: `{ messages: Array<{role: string, content: string}> }`
- Response: `{ response: string }`

## 4. Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)

## 5. Pages

- `/` - Main chat interface with Brick AI
- `/prize` - Secret prize reveal animation (accessible by entering password 0221)

## 6. UI Layout

- Header with Brick AI logo and navigation
- Chat message area (scrollable)
- Input bar at bottom with suggestions
- Gradient background with blur effects
- Mobile responsive design
