# Argiago Development Guide

## Project Overview

Argiago is a modern web application designed with a feature-based modular architecture. The project aims to provide a highly scalable, performant, and maintainable platform. It's structured to allow easy extraction of features into separate packages or microfrontends in the future.


## Technology Stack

The application is built on a modern, lightweight stack that prioritizes performance and developer experience.

### Frontend

- **Lit 3.x**: A lightweight library for building fast, lightweight web components.
- **Vite**: A modern frontend build tool that provides fast hot module replacement and optimized builds.
- **TypeScript**: Adds static typing to JavaScript, ensuring type safety and better tooling support.
- **@lit/localize**: Handles internationalization and localization of components.
- **@lit-labs/router**: Manages routing and navigation within the application.

### Backend

- **Rust**: A systems programming language focused on safety, speed, and concurrency.
- **TrailBase**: An open-source, lightweight database and backend solution built in Rust.

### Build Tools

- **bun**: Used for managing frontend dependencies, running scripts, and building the frontend application.
- **cargo**: The Rust package manager and build system used for compiling and running the backend server.

### Future Considerations

- **Tauri**: Planned for future desktop application distribution, allowing the web application to run as a native desktop app.


## Architecture

The frontend codebase follows a feature-based modular structure. This design isolates functional modules, making them self-contained and preparing the application for future microfrontend migration.

### Directory Organization

- `features/`: Contains isolated functional modules such as authentication, notifications, and theme management. Each feature is self-contained with its own components, services, and types.
- `pages/`: Contains top-level page components that compose features and shared components.
- `shared/`: Contains reusable UI components that are not tied to any specific feature, such as form inputs, modals, and buttons.
- `assets/`: Stores static resources like images and icons.

### Feature Structure

Each feature module is organized with the following subdirectories:

- `components/`: Feature-specific UI components.
- `services/`: Business logic, state management, and API calls.
- `types/`: TypeScript interfaces and types specific to the feature.
- `index.ts`: This file defines the public API of the feature. Only documented interfaces, components, and services are exported here. Other features must only import from this public API.

### Path Strategy

- **Intra-feature**: Relative paths are used for imports within the same feature module (e.g., `../services/auth.service`).
- **Inter-feature**: Path aliases are used for imports across different features or shared modules (e.g., `@/features/auth`, `@/shared/components`).


## Development Workflow

The development workflow relies on bun for frontend tasks and cargo for backend tasks.

### Frontend Scripts

- `bun run watch`: Starts the build process in watch mode to automatically compile changes.
- `bun run build`: Runs the pre-build steps and compiles the production build using Vite.
- `bun run pre-build`: Runs the localization build and TypeScript compiler.
- `bun run i18n:extract`: Extracts localizable strings from components into XLIFF files.
- `bun run i18n:build`: Generates locale modules from translated XLIFF files.

### Backend Commands

- `cargo build`: Compiles the backend server.
- `cargo run`: Starts the backend server.


## Styling & Theme

Styling is implemented using CSS Custom Properties to support dynamic light and dark themes.

### CSS Custom Properties

All components must use theme variables defined in `@/features/theme/styles/theme-variables.css`. Hardcoded color values are not allowed. The main CSS file imports these variables:

```css
@import '@/features/theme/styles/theme-variables.css';
```

### Design Principles

- **Minimalism**: Backgrounds do not use gradients, and excessive shadows are avoided.
- **Clean Spacing**: Adequate padding and margins are maintained across all layouts.
- **Flat Design**: No 3D effects are used.
- **Simple Shadows**: Cards use a minimal shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.12)`).
- **Rounded Corners**: Elements use a standard border radius of 6px to 8px.

### Component Standards

- **Buttons**: Orange background, no shadows, 6px border radius, and 500 font weight.
- **Cards**: White or surface background, minimal shadow, and 8px border radius.
- **Logo Sizes**: Header logos are 48px, and authentication card logos are 120px.
- **Typography**: System fonts are used, with 600 weight for headings and 500 weight for semi-bold text.

### Theme-Aware Components

Dynamic, theme-dependent elements use the `ThemeController` to detect and react to theme changes:

```typescript
import { ThemeController } from '@/features/theme';

private theme = new ThemeController(this);
// Use this.theme.theme (returns 'light' | 'dark')
```

Theme changes automatically trigger a component re-render. Smooth transitions are applied to theme-aware properties:

```css
transition: background-color 0.2s ease, color 0.2s ease;
```


## Localization

The application supports internationalization (i18n) using `@lit/localize`.

### Component Requirements

- Every Lit component must use the `@localized()` decorator.
- All user-visible strings must be wrapped in the `msg()` function.
- Hardcoded strings outside of `msg()` calls are not allowed.

### Implementation Pattern

```typescript
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';

@customElement('my-component')
@localized()
export class MyComponent extends LitElement {
  render() {
    return html`${msg('Hello World')}`;
  }
}
```

### Root Initialization

The localization service is initialized once in the app-component constructor:

```typescript
localizationService.init();
```

### Translation Workflow

1. Wrap user-visible strings in `msg()` within the component.
2. Run `bun run i18n:extract` to update the XLIFF files.
3. Add translations to the XLIFF files located in `xliff/*.xlf`.
4. Run `bun run i18n:build` to generate the locale modules.
5. Rebuild the application.


## Code Conventions

- **Import Paths**: Use relative paths for intra-feature imports and path aliases for inter-feature imports.
- **Comments**: All comments, documentation, and descriptions must be written in English.


## Migration Notes

The `react/` folder in the project root contains legacy React code. This folder serves as a reference for the gradual migration from React to Lit. Don't modify any files in the `react/` folder.
