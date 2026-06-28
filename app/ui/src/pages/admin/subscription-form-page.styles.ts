import { css } from 'lit';

export const subscriptionFormPageStyles = css`
  :host {
    display: block;
    min-height: 100vh;
    background: var(--theme-color-background);
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

  .page-title {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
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
    gap: 0.875rem;
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

  .logo-input-row .input {
    flex: 1;
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

  .period-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .btn-remove-tier {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--theme-color-error, #ef4444);
    transition: background-color 0.15s ease;
  }

  .btn-remove-tier:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-remove-tier svg {
    width: 16px;
    height: 16px;
  }

  /* ── Form actions ────────────────────────────────────────────────── */

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1.25rem;
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
`;
