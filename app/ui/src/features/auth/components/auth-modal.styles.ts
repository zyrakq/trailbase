import { css } from 'lit';

export const authModalStyles = css`
  :host {
    display: block;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
    pointer-events: auto;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-card {
    background: var(--theme-color-surface-elevated);
    border-radius: 8px;
    box-shadow: var(--theme-shadow-lg);
    max-width: 420px;
    width: 100%;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--theme-color-border);
    transition: border-color 0.2s ease;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    transition: color 0.2s ease;
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--theme-color-text-secondary);
    font-size: 20px;
    cursor: pointer;
    border-radius: 6px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .modal-close:hover {
    background: var(--theme-color-background);
    color: var(--theme-color-text-primary);
  }

  .modal-close:focus {
    outline: 2px solid var(--theme-color-primary);
    outline-offset: 2px;
  }

  .modal-content {
    padding: 1.25rem;
    overflow-y: auto;
  }

  /*
   * Gentle fade-in for whichever block (skeleton, trail-auth, bundle-error)
   * is currently mounted. Softens the visual jump when the bundle finishes
   * loading and the real form replaces the placeholder.
   */
  .modal-content > :not(style) {
    animation: contentFadeIn 0.2s ease-out;
  }

  @keyframes contentFadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .modal-card { max-width: 100%; }
    .modal-header { padding: 0.875rem 1rem; }
    .modal-content { padding: 1rem; }
    .modal-title { font-size: 1rem; }
  }

  /* Loading skeleton shown while trail-auth bundle is being fetched */
  .auth-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    padding: 0.25rem 0;
  }

  .skeleton-title,
  .skeleton-field,
  .skeleton-btn {
    background: var(--theme-color-border);
    border-radius: 6px;
    animation: skeleton-pulse 1.4s ease-in-out infinite;
  }

  .skeleton-title {
    height: 1.25rem;
    width: 45%;
    margin-bottom: 0.25rem;
  }

  .skeleton-field {
    height: 2.5rem;
    width: 100%;
    border-radius: 8px;
  }

  .skeleton-btn {
    height: 2.625rem;
    width: 100%;
    border-radius: 8px;
    margin-top: 0.25rem;
    background: var(--theme-color-primary, #4f46e5);
    opacity: 0.25;
  }

  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }
`;
