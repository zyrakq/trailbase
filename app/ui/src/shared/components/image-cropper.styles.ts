import { css } from 'lit';

export const imageCropperStyles = css`
  :host {
    display: block;
  }

  .placeholder {
    border: 1px dashed var(--theme-color-border);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
  }

  .canvas-wrap {
    position: relative;
    width: 100%;
    max-width: 320px;
    aspect-ratio: 1 / 1;
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--theme-color-background);
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

  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .controls label {
    font-size: 0.8125rem;
    color: var(--theme-color-text-secondary);
  }

  input[type='range'] {
    width: 100%;
  }

  .file-input {
    display: none;
  }

  .btn-upload {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    background: var(--theme-color-surface);
    color: var(--theme-color-text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }

  .btn-upload:hover {
    border-color: var(--theme-color-primary);
  }
`;
