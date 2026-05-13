# Gemini Chat Webapp

## 1. Project Overview

- **Project name**: gemini-chat
- **Type**: Next.js webapp with Gemini API integration
- **Core functionality**: AI chatbot powered by Google Gemini
- **Target users**: Anyone wanting to chat with an AI assistant

## 2. Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: Google Gemini API (@google/generative-ai)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## 3. Features

- [x] Chat interface with message history
- [x] User message input
- [x] AI response via API route
- [x] Message display with roles (user/assistant)
- [x] API key configuration via environment variable
- [x] Clean, modern UI

## 4. API Design

- `POST /api/chat` - Send message and receive AI response
- Request body: `{ messages: Array<{role: string, content: string}> }`
- Response: `{ response: string }`

## 5. Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)

## 6. UI Layout

- Header with app title
- Chat message area (scrollable)
- Input bar at bottom with send button
- User messages right-aligned (blue), AI messages left-aligned (gray)