# Gemini Chat

AI chatbot powered by Google Gemini.

## Setup

1. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API key:
   # GEMINI_API_KEY=your_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Google Gemini API

## Project Structure

```
src/app/
├── page.tsx          # Main chat UI
├── layout.tsx        # Root layout
├── globals.css       # Global styles
└── api/chat/
    └── route.ts      # Chat API endpoint
```