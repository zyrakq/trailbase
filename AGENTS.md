# Argiago — Agent Reference

Primary documentation is in two canonical files:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tech stack, repo layout, feature modules,
  data flows, build & deploy commands
- **[CODE_STYLE.md](./CODE_STYLE.md)** — Naming, component structure, imports, theming,
  localization, code patterns, error handling

## Essential Constraints

- `react/` and `trailbase/` are **read-only** reference folders — never modify
- Use **bun** for frontend tasks, **cargo** for backend
- All comments and documentation must be in **English**

## Future Considerations

- **Tauri**: Planned for future desktop distribution (not yet implemented)
