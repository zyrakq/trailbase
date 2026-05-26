import { css } from 'lit';

export const authSharedStyles = css`
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

  .mfa-subtitle {
    font-size: 0.9375rem;
    color: var(--theme-color-text-secondary);
    margin: 0 0 1rem 0;
    transition: color 0.2s ease;
  }
`;
