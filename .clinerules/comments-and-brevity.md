# Comments & Code Brevity (MANDATORY)

These rules are non-negotiable. They reinforce
[AGENTS.md — Comments](../AGENTS.md) and [CODE_STYLE.md](../CODE_STYLE.md).
Violating them wastes review cycles and will be reverted.

## Comments

- Comment ONLY: non-obvious side-effects, counter-intuitive decisions, or invariants.
- NO doc-comments (`///`, `/** */`, `//`) on every struct, field, function, or module.
- DO NOT narrate what code obviously does. The code is the source of truth.
- MATCH the surrounding comment density of each file. When in doubt, OMIT the comment.
- Applies to BOTH backend (Rust) AND frontend (Lit/TS). Backend is held to the strictest
  bar — almost no comments unless something is genuinely surprising.

## Entry-point files must stay thin

### `app/src/main.rs` — orchestration ONLY

- Load config, assemble services, start the server. Nothing else.
- NEVER inline multi-line construction of config objects. No inline
  `branding_overlay_config` / `public_config` blocks.
- Construction belongs behind a method on the owning type/module:
  - branding overlay config → `BrandingSettings::overlay_config(&self)` in
    `settings/branding.rs`.
  - public config → `PublicConfig::from(...)` / `state.public_config()` on
    `PublicConfig` or app state, in `settings/frontend.rs`.
- Rule of thumb: if a block in `main.rs` grows beyond ~3 lines, move it into a method
  in the appropriate module and call that method.

### `app/src/routes.rs` — route wiring + thin handlers ONLY

- Handlers must be thin: parse input, delegate to a function/method, return a response.
- Do NOT accumulate construction, serialization, or resolution logic here.
- Reusable logic lives in its owning module:
  - brand-asset overlay resolution (disk-then-embedded) → `settings/branding.rs`
    (or `frontend_assets.rs`).
  - manifest rendering → `settings/branding.rs` or a dedicated module.
- Route registration stays in `routes.rs`. Heavy logic moves out.

## Checklist before finishing any code change

- Re-read EVERY touched file and DELETE every comment that does not clear the bar above.
- Prefer a well-named function/method over a comment that explains the code.
- A method in the right module ALWAYS beats an inline block in an entry point.
- Verify `main.rs` and `routes.rs` did not grow inline construction or heavy logic.
