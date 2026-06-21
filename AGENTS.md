# Velora — Agent Reference

Primary docs: [ARCHITECTURE.md](./ARCHITECTURE.md) (stack, layout, flows) and
[CODE_STYLE.md](./CODE_STYLE.md) (naming, components, theming, i18n).

## Essential Constraints

- `vendor/trailbase/` — patches allowed only to fix upstream bugs; keep minimal + documented
- `vendor/mailcrab/backend/` — no changes beyond existing `src/lib.rs` and `src/app_state.rs`
- **bun** for frontend, **cargo** for backend; all comments/docs in **English**
- **NEVER `cargo clean`** — rebuild specific packages instead

## Comments

Comment only non-obvious side-effects, counter-intuitive decisions, or invariants.
No doc-comments on every struct/field/function; don't narrate obvious code. Match
surrounding density.

## Logging — DO NOT TOUCH

Two coexisting systems; breaking either panics: `pretty_env_logger` owns the `log`
global logger (`logging::init()`), **TrailBase** owns the `tracing` subscriber
(`Server::init()`).

**Never:** remove `pretty_env_logger`; call `tracing_subscriber::*init*` in velora
code; enable `tracing-log` feature (or omit `default-features = false`) on
`tracing-subscriber`; move `logging::init()` after `Server::init()`. Discovered
during mailcrab integration (Jun 2026).

## Build cache — sccache & cargo subagents

- Remove or replace `pretty_env_logger` — it is the only `log` output for non-tracing crates
- Call `tracing_subscriber::...init()` or `tracing_subscriber::...try_init()` anywhere in
  velora code — TrailBase owns that
- Add `default-features = true` (or omit `default-features = false`) to any new dependency
  on `tracing-subscriber` — the `tracing-log` default feature breaks the setup
- Move `logging::init()` after `trailbase::Server::init()` — the env var must be set first

**Never:** bypass it (`RUSTC_WRAPPER=""`, override `SCCACHE_*`) — reinstall if broken;
run `cargo` in **parallel subagents** (locks + cache thrash). All cargo verification
(`check`/`build`/`test`) runs in the **main thread, sequentially**; subagents edit only.

## trailbase submodules & tests — DO NOT TOUCH

`vendor/trailbase/` is not prepped for direct execution from this worktree.

**Never:** `git submodule update --init` (or `--recursive`) inside
`vendor/trailbase/`; run `cargo test` inside `vendor/trailbase/` or any of its
crates; or attempt to build/run trailbase binaries directly. The user runs all
trailbase verification themselves.

## `thoughts/` — never commit

Gitignored (`.gitignore` entry `thoughts`): design docs, plans, ledgers stay local.

**Never:** `git add thoughts/...`, or `git add .`/`-A`/`-f` to work around the ignore.
Writing a doc/plan is the final step — don't follow it with `git add` + `git commit`.

## Future

- **Tauri** — planned desktop distribution (not yet implemented)
