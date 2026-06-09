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

## Future Considerations

- **Tauri**: Planned for future desktop distribution (not yet implemented)
