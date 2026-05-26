# Project Structure

See [ARCHITECTURE.md — Frontend Structure](../ARCHITECTURE.md#frontend-structure-appui) and
[ARCHITECTURE.md — Feature Modules](../ARCHITECTURE.md#feature-modules-srcfeatures) for the
full directory layout, feature structure, and path aliases.

## Component placement guidance

- High-reuse components with their own services/types → `features/`
- Simple, stateless UI elements → `shared/`
- Always consider portability when designing components
