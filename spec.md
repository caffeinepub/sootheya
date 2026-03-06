# Sootheya

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- A compassionate emotional support chat companion named Sootheya
- Conversational chat interface where users can type messages and receive warm, empathetic responses
- Chat history stored per session (persisted in backend)
- Sootheya persona: warm, calm, empathetic tone with supportive emojis; WhatsApp-style short paragraphs
- Response logic covers: stress, loneliness, overthinking, emotional overwhelm, daily worries, relationship concerns, self-reflection, mindfulness/breathing suggestions
- Safety boundaries: never diagnoses, never replaces therapy; crisis situations prompt gentle redirection to professional help
- Privacy reminder logic: if user shares sensitive info (passwords, IDs, financial), gently remind them not to share
- A calming, welcoming landing/intro screen before entering the chat
- Tagline: "Serenity begins here."
- Optional quick-start prompts so users can begin a conversation easily (e.g. "I'm feeling stressed", "I feel lonely", "I need to vent")

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - Store chat messages per anonymous session (sessionId, role, text, timestamp)
   - sendMessage(sessionId, userMessage) -> returns Sootheya's AI-style response text
   - getChatHistory(sessionId) -> returns array of messages
   - clearChat(sessionId) -> clears history for a session
   - Response generation logic: rule/pattern-based empathetic responses mapped to emotional topics; crisis detection triggers a safety response; privacy keyword detection triggers a gentle reminder

2. Frontend:
   - Landing screen with Sootheya branding, tagline, and "Start a conversation" CTA
   - Chat view: message bubbles (user right, Sootheya left), input bar at bottom, send button
   - Quick-start prompt chips on empty chat state
   - Typing indicator while waiting for response
   - Session ID generated client-side (stored in localStorage)
   - Clear chat option
   - Fully responsive, mobile-first layout
