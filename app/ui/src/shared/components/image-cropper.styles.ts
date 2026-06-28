import { css } from 'lit';

export const imageCropperStyles = css`
  :host {
    display: block;
  }

  .root {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* ── Drop zone (empty state) ─────────────────────────────────────── */

  .drop-zone {
    min-height: 200px;
    border: 2px dashed var(--theme-color-border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem 1.5rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
    text-align: center;
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    border-color: var(--theme-color-primary);
    background: var(--theme-color-primary-subtle);
  }

  .drop-zone-icon {
    color: var(--theme-color-text-muted);
    flex-shrink: 0;
  }

  .drop-zone-heading {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0;
  }

  .drop-zone-hint {
    font-size: 0.8125rem;
    color: var(--theme-color-text-secondary);
    margin: 0;
  }

  .btn-choose {
    display: inline-flex;
    align-items: center;
    padding: 0.4375rem 1rem;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    background: var(--theme-color-surface);
    color: var(--theme-color-text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
    margin-top: 0.25rem;
  }

  .btn-choose:hover {
    border-color: var(--theme-color-primary);
  }

  /* ── Canvas state ────────────────────────────────────────────────── */

  .canvas-wrap {
    position: relative;
    width: 100%;
    max-width: 320px;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    /* Dark neutral — must stay dark regardless of theme for crop visibility */
    background: #1a1a1a;
    touch-action: none;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }

  /* ── Uploading overlay ───────────────────────────────────────────── */

  .uploading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Zoom row (below canvas) ─────────────────────────────────────── */

  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 320px;
  }

  .controls label {
    font-size: 0.8125rem;
    color: var(--theme-color-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  input[type='range'] {
    flex: 1;
    accent-color: var(--theme-color-primary);
  }

  .btn-change {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--theme-color-text-secondary);
    font-family: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .btn-change:hover {
    color: var(--theme-color-text-primary);
    background: var(--theme-color-surface-hover);
  }

  /* ── Hidden file input ───────────────────────────────────────────── */

  .file-input {
    display: none;
  }

  /* ── Error message ───────────────────────────────────────────────── */

  .error-msg {
    font-size: 0.875rem;
    color: var(--theme-color-error, #ef4444);
    margin: 0;
  }
`;
