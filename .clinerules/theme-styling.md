# Theme & Styling

## Brief overview

Styling guidelines using CSS Custom Properties with light/dark theme support.

## CSS Custom Properties

- Always use theme variables from `@/features/theme/styles/theme-variables.css`
- Never hardcode color values
- Import in main CSS: `@import '@/features/theme/styles/theme-variables.css'`

### Standard variables

```css
/* Primary colors */
--theme-color-primary         /* Light: #ff6b35 (orange), Dark: #f97316 (Tailwind orange-500) */
--theme-color-primary-hover   /* Hover state */
--theme-color-primary-active  /* Active/pressed state */

/* Background colors */
--theme-color-background      /* Light: #f9fafb, Dark: #212529 */
--theme-color-surface         /* Light: #ffffff, Dark: #2c3136 */
--theme-color-surface-elevated /* Elevated surface for modals and toasts */

/* Text colors */
--theme-color-text-primary    /* Main text */
--theme-color-text-secondary  /* Secondary text */
--theme-color-text-muted      /* Muted/hint text */

/* Border colors */
--theme-color-border          /* Borders */

/* Semantic colors */
--theme-color-success         /* Success state */
--theme-color-error           /* Error state */
--theme-color-warning         /* Warning state */
--theme-color-info            /* Info state */

/* Shadows */
--theme-shadow-sm             /* Small shadow */
--theme-shadow-md             /* Default card shadow */
--theme-shadow-lg             /* Large shadow */
```

## Design principles

- Minimalism: no gradients on backgrounds, no excessive shadows
- Clean spacing: adequate padding and margins
- Flat design: no 3D effects
- Simple shadows: `box-shadow: 0 1px 3px rgba(0,0,0,0.12)` for cards
- Rounded corners: `border-radius: 6-8px`

## Component standards

- **Buttons**: Orange background, no shadows, 6px radius, 500 font-weight
- **Cards**: White/surface background, minimal shadow, 8px radius
- **Logo sizes**: Header 48px, Auth card 120px
- **Typography**: System fonts, 600 weight for headings, 500 for semi-bold

## Theme-aware components

For dynamic theme-dependent elements (logos, icons):

```typescript
import { ThemeController } from '@/features/theme';

private theme = new ThemeController(this);
// Use this.theme.theme (returns 'light' | 'dark')
```

Theme changes automatically trigger re-render.

## Transitions

Add smooth transitions for theme-aware properties:

```css
transition: background-color 0.2s ease, color 0.2s ease;
```

Apply in `:host`, container elements, and interactive elements.
