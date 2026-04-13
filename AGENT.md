# AGENT.md

## Purpose

This file is the execution contract for coding agents working in this repository.
It is not a product brief or onboarding doc. It defines how this app must be built,
tested, and maintained. Follow these rules unless the user explicitly overrides them.

## Product Definition

Build a WhatsApp-style multi-buddy group chat web app.
The frontend is a static `React + TypeScript + Vite` app deployed to GitHub Pages.
The app is **local-first** and **private**; it runs entirely in the browser with no sign-in flow and no server-side backend.
LLM access goes through `OpenRouter` directly from the browser using a client-side API key.

Primary product surfaces:
- buddy management: Create and edit AI buddies with distinct roles.
- chat management: Group buddies into rooms around specific topics.
- conversation thread: Real-time chat with fanned-out responses from multiple buddies.
- settings: Manage local workspace state and OpenRouter API keys.

## Non-Negotiable Architecture

### Frontend

- Must use `React + TypeScript + Vite`.
- Must use `HashRouter` for routing because GitHub Pages is static hosting.
- Must be deployable to GitHub Pages without a separate frontend server.
- Must keep the product UI app-like, dense, and operational.
- Must use `localStorage` for all persistence (local-first mode).

### Backend

- **No backend server.** The app is static and client-side only.
- Do not introduce `Supabase`, `FastAPI`, Express, or any separate API server.

### LLM Provider Access

- The browser calls OpenRouter directly via `fetch`.
- User-supplied OpenRouter API keys are stored only in `localStorage` and never persisted on any server.
- All model listing and generation requests happen client-side.

### Persistence and Auth

- Persistence is local-only using `localStorage`.
- No authentication or sign-in flow is required for the private mode.
- Users manage their own workspace state which is siloed to their browser.

## Product Behavior Rules

### Buddy and Chat Model

- A user can create multiple buddies.
- Each buddy must support:
  - name
  - role title
  - responsibilities
  - persona or system prompt
  - selected OpenRouter model
- A user can create chats around a topic and attach multiple buddies.
- Buddy order inside a chat must be explicit and stable.

### Reply Routing

- If the user tags one or more buddies in a message, only those tagged buddies respond.
- If the user does not tag any buddy, every buddy in the chat responds.
- Buddy responses are generated in deterministic order.
- Later buddies in the same turn see earlier buddy replies from that same turn.

### Failure Handling

- One buddy failure must not abort the full turn.
- A failed buddy reply must surface as a per-buddy error state in the UI.
- Failed buddy replies must be retryable individually.

### Model Picker

- Buddy creation and editing uses the OpenRouter `/models` endpoint to list available models.
- The UI must allow manual model ID entry if model catalog retrieval fails.

## Repo Structure

```text
src/                       Frontend application code
  components/              React components
  lib/                     Business logic and API utilities
public/                    Static assets for Vite
tests/                     Unit and E2E tests
```

## Required Source Control Rules

- Keep logic modular for testing (e.g., mention parsing, prompt building).
- Ensure all business logic lives in `src/lib`.

## Environment and Config

- `VITE_APP_BASE_PATH`: Set to the repository name for GitHub Pages deployment.

## Local Development Workflow

1. Install dependencies with `npm install`.
2. Run the frontend with `npm run dev`.

## Testing Rules

- Use `vitest` for unit tests.
- Use `Playwright` for E2E tests.
- Mock OpenRouter responses by default in tests.

## Definition of Done

Work is not complete unless:
- The code follows the local-first architecture rules in this file.
- Changes are tested and verified.
- No secrets are hardcoded.
