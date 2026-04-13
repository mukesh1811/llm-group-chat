# llm-group-chat
<p align="center">
  <img src="public/favicon.svg" width="128" height="128" />
</p>

is a private, local-first multi-llm chat app that lets create multiple llms with individual roles and responsibilities and converse with them in one group chat room.

### What it does

Inspired by Andrej Karpathy's [LLM Council](https://x.com/karpathy/status/1992381094667411768).

Create AI buddies with distinct roles and prompts, group them into rooms around a topic, and run shared conversations where @mentions can narrow which buddies respond.


- Each AI buddy has a role, responsibilities, prompt, and model selection.
- Group chats bind a topic to a selected roster of buddies and keep all turns in one shared timeline.
- @mentions narrow the responder set; untagged messages fan out to the full room in order.
- Failed buddy replies stay inline and can be retried without leaving the thread.

### Architecture

- Runtime: React 18 with Vite, running entirely in the browser with no sign-in flow and no backend.
- Prompt handling: each buddy carries its own system prompt, while each group chat contributes the shared topic and recent transcript used to ground replies.
- Model routing: OpenRouter-backed buddy generation and model catalog loading happen directly from the browser using your key for the current tab.

### [Support me](https://github.com/sponsors/mukesh1811/)

### [Raise an issue for feature request](https://github.com/mukesh1811/llm-group-chat/issues)