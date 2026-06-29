import { css } from 'lit';

export const subscriptionFormPageStyles = css`
  :host {
    display: block;
    min-height: 100vh;
    background: var(--theme-color-background);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .page-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .loading {
    text-align: center;
    color: var(--theme-color-text-secondary);
    padding: 4rem 0;
  }

  /* ── Top bar ─────────────────────────────────────────────────────── */

  .top-bar {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--theme-color-text-secondary);
    font-size: 0.9375rem;
    font-family: inherit;
    padding: 0.375rem 0.5rem;
    border-radius: 6px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .btn-back:hover {
    color: var(--theme-color-text-primary);
    background: var(--theme-color-surface);
  }

  .btn-back svg {
    width: 18px;
    height: 18px;
  }

  /* ── Page title ──────────────────────────────────────────────────── */

  .page-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
  }

  .btn-preview-toggle {
    display: none;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    cursor: pointer;
    color: var(--theme-color-text-primary);
    font-size: 0.875rem;
    font-family: inherit;
    font-weight: 500;
    padding: 0.375rem 0.75rem;
    transition: background-color 0.15s ease;
  }

  .btn-preview-toggle:hover {
    background: var(--theme-color-background);
  }

  .btn-preview-toggle svg {
    width: 16px;
    height: 16px;
  }

  /* ── Two-column layout ───────────────────────────────────────────── */

  .edit-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
    align-items: start;
  }

  .form-col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .preview-col {
    position: sticky;
    top: 2rem;
  }

  /* ── Tab bar ─────────────────────────────────────────────────────── */

  segmented-control[variant='tabs'] {
    width: 100%;
  }

  /* ── Form ────────────────────────────────────────────────────────── */

  .form {
    display: flex;
    flex-direction: column;
  }

  /* ── Fields ──────────────────────────────────────────────────────── */

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--theme-color-text-primary);
  }

  .input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    background: var(--theme-color-surface);
    color: var(--theme-color-text-primary);
    font-family: inherit;
    font-size: 0.9375rem;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
  }

  .input:focus {
    outline: none;
    border-color: var(--theme-color-primary);
    box-shadow: 0 0 0 3px var(--theme-color-primary-subtle);
  }

  .textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* ── Logo section ────────────────────────────────────────────────── */

  .logo-input-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .input-with-clear {
    position: relative;
    flex: 1;
  }

  .input-with-clear .input {
    width: 100%;
    box-sizing: border-box;
    padding-right: 2.25rem;
  }

  .btn-clear-url {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--theme-color-text-secondary);
    transition: color 0.15s ease;
  }

  .btn-clear-url:hover {
    color: var(--theme-color-text-primary);
  }

  .btn-clear-url svg {
    width: 14px;
    height: 14px;
  }

  .logo-preview {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 8px;
    border: 1px solid var(--theme-color-border);
    flex-shrink: 0;
  }

  .btn-link {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.875rem;
    color: var(--theme-color-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .btn-link:hover {
    opacity: 0.8;
  }

  /* ── Pricing section ─────────────────────────────────────────────── */

  .pricing-empty {
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
    font-style: italic;
    margin: 0;
  }

  .pricing-tier {
    display: grid;
    grid-template-columns: 130px 1fr 72px auto;
    gap: 0.5rem;
    align-items: center;
  }

  .period-label-wrap {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }

  .period-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subscriber-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    padding: 0 0.3125rem;
    height: 1.25rem;
    border-radius: 999px;
    background: var(--theme-color-warning, #f59e0b);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1;
    flex-shrink: 0;
  }

  .price-input {
    text-align: right;
    -moz-appearance: textfield;
  }

  .price-input::-webkit-outer-spin-button,
  .price-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .currency-input {
    text-align: center;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .btn-remove-tier,
  .btn-archive-tier {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-remove-tier {
    color: var(--theme-color-error, #ef4444);
  }

  .btn-remove-tier:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-archive-tier {
    color: var(--theme-color-warning, #f59e0b);
  }

  .btn-archive-tier:hover {
    background: rgba(245, 158, 11, 0.1);
  }

  .btn-remove-tier svg,
  .btn-archive-tier svg {
    width: 16px;
    height: 16px;
  }

  /* ── Form actions ────────────────────────────────────────────────── */

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--theme-color-border);
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5625rem 1.25rem;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9375rem;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.15s ease;
  }

  .btn-primary {
    background: var(--theme-color-primary);
    border: none;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--theme-color-border);
    color: var(--theme-color-text-primary);
  }

  .btn-secondary:hover {
    background: var(--theme-color-surface);
  }

  /* ── Preview column ──────────────────────────────────────────────── */

  .detail-card {
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 16px;
    overflow: hidden;
  }

  .logo-hero {
    height: 160px;
    background: var(--theme-color-background);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-img {
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
  }

  .logo-letter {
    font-size: 4rem;
    font-weight: 700;
    color: var(--theme-color-text-secondary);
  }

  .detail-body {
    padding: 1.5rem 2rem 2rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
  }

  .description {
    color: var(--theme-color-text-secondary);
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section-heading {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0 0 0.5rem;
  }

  .section-text {
    color: var(--theme-color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .pricing-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pricing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    font-size: 0.9375rem;
    color: var(--theme-color-text-primary);
  }

  /* ── Responsive ──────────────────────────────────────────────────── */

  @media (max-width: 960px) {
    .edit-layout {
      grid-template-columns: 1fr;
    }

    .preview-col {
      position: static;
    }

    .btn-preview-toggle {
      display: inline-flex;
    }

    .edit-layout.mobile-preview .form-col {
      display: none;
    }

    .edit-layout:not(.mobile-preview) .preview-col {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .page-content {
      padding: 1rem;
    }

    .pricing-tier {
      grid-template-columns: 100px 1fr 60px auto;
      gap: 0.375rem;
    }
  }

  @media (max-width: 480px) {
    .pricing-tier {
      grid-template-columns: 1fr 56px auto;
    }

    .period-label-wrap {
      grid-column: 1 / -1;
    }

    .form-actions {
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary {
      flex: 1;
      text-align: center;
    }
  }
`;
