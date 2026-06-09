# Argiago — Agent Reference

Primary documentation is in two canonical files:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tech stack, repo layout, feature modules,
  data flows, build & deploy commands
- **[CODE_STYLE.md](./CODE_STYLE.md)** — Naming, component structure, imports, theming,
  localization, code patterns, error handling

## Essential Constraints

- `vendor/react/` and `vendor/trailbase/` are **read-only** reference folders — never modify
- `vendor/mailcrab/backend/` has a minimal lib-target patch — do not add further
  modifications beyond what is already in `src/lib.rs` and `src/app_state.rs`
- Use **bun** for frontend tasks, **cargo** for backend
- All comments and documentation must be in **English**

## Logging — DO NOT TOUCH

The logging setup is a two-system arrangement that must not be broken:

- `pretty_env_logger` owns the **`log` crate** global logger (set via `logging::init()`)
- **TrailBase** owns the **`tracing` subscriber** (set in `Server::init()`)
- `tracing-subscriber` must be built **without** the `tracing-log` feature; otherwise
  its `LogTracer` bridge tries to call `log::set_logger()` a second time and **panics**

**Never:**
- Remove or replace `pretty_env_logger` — it is the only `log` output for non-tracing crates
- Call `tracing_subscriber::...init()` or `tracing_subscriber::...try_init()` anywhere in
  argiago code — TrailBase owns that
- Add `default-features = true` (or omit `default-features = false`) to any new dependency
  on `tracing-subscriber` — the `tracing-log` default feature breaks the setup
- Move `logging::init()` after `trailbase::Server::init()` — the env var must be set first

This constraint was discovered and fixed in the mailcrab integration (Jun 2026).

## Future Considerations

- **Tauri**: Planned for future desktop distribution (not yet implemented)
