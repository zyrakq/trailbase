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

  .choice-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .divider {
    height: 1px;
    background: var(--theme-color-border);
    margin: 0.25rem 0;
    transition: background-color 0.2s ease;
  }

  .password-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--theme-color-text-primary);
    transition: color 0.2s ease;
  }

  .form-field input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: 0.9375rem;
    font-family: inherit;
    color: var(--theme-color-text-primary);
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    box-sizing: border-box;
    margin: 0;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }

  .form-field input:focus {
    outline: none;
    border-color: var(--theme-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
  }

  .form-field input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .password-field .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-field input {
    padding-right: 2.5rem;
    box-sizing: border-box;
  }

  .password-toggle {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--theme-color-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;
  }

  .password-toggle:hover:not(:disabled) {
    color: var(--theme-color-text-primary);
  }

  .password-toggle:focus {
    outline: 2px solid var(--theme-color-primary);
    outline-offset: 1px;
  }

  .password-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    font-size: 0.875rem;
    color: var(--theme-color-error);
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-error);
    border-radius: 6px;
    padding: 0.625rem 0.75rem;
    transition: all 0.2s ease;
  }

  .back-link {
    display: block;
    width: 100%;
    margin-top: 1rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    color: var(--theme-color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: center;
    transition: color 0.2s ease;
  }

  .back-link:hover:not(:disabled) {
    color: var(--theme-color-text-primary);
    text-decoration: underline;
  }

  .back-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .forgot-password-link {
    align-self: flex-end;
    padding: 0;
    font-size: 0.8125rem;
    color: var(--theme-color-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;
    margin-top: -0.25rem;
  }

  .forgot-password-link:hover:not(:disabled) {
    color: var(--theme-color-text-primary);
    text-decoration: underline;
  }

  .forgot-password-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    text-align: center;
  }

  .success-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--theme-color-success);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .success-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0;
  }

  .success-message {
    font-size: 0.875rem;
    color: var(--theme-color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .resend-confirmation {
    font-size: 0.875rem;
    color: var(--theme-color-success);
    margin: 0;
  }

  .resend-rate-limited {
    font-size: 0.875rem;
    color: var(--theme-color-text-muted);
    margin: 0;
  }

  .resend-smtp-error {
    font-size: 0.875rem;
    color: var(--theme-color-error);
    margin: 0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-family: inherit;
    width: 100%;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--theme-color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--theme-color-primary-hover);
  }

  .btn-primary:active:not(:disabled) {
    background: var(--theme-color-primary-active);
  }

  .btn-secondary {
    background: var(--theme-color-surface);
    color: var(--theme-color-text-primary);
    border: 1px solid var(--theme-color-border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--theme-color-background);
  }

  .mfa-subtitle {
    font-size: 0.9375rem;
    color: var(--theme-color-text-secondary);
    margin: 0 0 1rem 0;
    transition: color 0.2s ease;
  }

  @media (max-width: 640px) {
    .modal-card { max-width: 100%; }
    .modal-header { padding: 0.875rem 1rem; }
    .modal-content { padding: 1rem; }
    .modal-title { font-size: 1rem; }
  }
`;
