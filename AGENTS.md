# Argiago — Agent Reference

Primary documentation is in two canonical files:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tech stack, repo layout, feature modules,
  data flows, build & deploy commands
- **[CODE_STYLE.md](./CODE_STYLE.md)** — Naming, component structure, imports, theming,
  localization, code patterns, error handling

## Essential Constraints

- `vendor/react/src/web` is a **read-only** reference folder — never modify
- `vendor/trailbase/` may be patched to fix upstream bugs — keep changes minimal and documented
- `vendor/mailcrab/backend/` has a minimal lib-target patch — do not add further
  modifications beyond what is already in `src/lib.rs` and `src/app_state.rs`
- Use **bun** for frontend tasks, **cargo** for backend
- All comments and documentation must be in **English**
- **NEVER run `cargo clean`** — it wipes the entire build cache and forces a
  full recompilation of every crate, which is extremely costly on this workspace.
  If a build artifact is stale, rebuild the specific package instead.

## Comments

Add comments only when the code cannot speak for itself — non-obvious side-effects,
counter-intuitive decisions, or subtle invariants. Do not add doc-comments (`///`, `/** */`)
to every struct, field, or function; do not narrate what the code obviously does with
inline comments. Match the comment density of the surrounding file.

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

## sccache — DO NOT BYPASS

`sccache` is configured in `.cargo/config.toml` as `rustc-wrapper = "sccache"`.
It is an intentional, project-wide setup that caches Cargo compilations across
invocations and is essential to keep rebuild times bearable on this workspace.

**Never:**

- Set `RUSTC_WRAPPER=""` (or any empty value) to disable the wrapper — even for a
  "single invocation"
- Override `RUSTC_WRAPPER` or `SCCACHE_*` env vars to work around sccache
- Strip `.cargo/config.toml`'s `rustc-wrapper` line to "fix" a failing build
- Recommend disabling sccache as a workaround for any build issue

**If sccache appears missing or a build fails because of it, the correct response is
to install it** (`cargo install sccache` or your distro's package), not to bypass it.
Stop and ask the user instead of unilaterally disabling the cache.

## Future Considerations

- **Tauri**: Planned for future desktop distribution (not yet implemented)
