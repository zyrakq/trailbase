import { css } from 'lit';

export const accountMenuStyles = css`
  :host {
    position: relative;
    display: inline-block;
  }

  .account-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.375rem;
    border-radius: 24px;
    color: var(--theme-color-text-primary);
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    transition: background-color 0.2s ease;
  }

  .account-btn:hover {
    background: var(--theme-color-background);
  }

  .avatar-img,
  .avatar-initials,
  .avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .avatar-img {
    object-fit: cover;
  }

  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1;
  }

  .avatar-placeholder {
    background: var(--theme-color-border);
  }

  .chevron {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 180px;
    background: var(--theme-color-surface-elevated, var(--theme-color-surface));
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    box-shadow: var(--theme-shadow-md);
    z-index: 1000;
    overflow: hidden;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    text-align: left;
    padding: 0.625rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--theme-color-text-primary);
    font-family: inherit;
    font-size: 0.9375rem;
    transition: background-color 0.2s ease;
    text-decoration: none;
  }

  .dropdown-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--theme-color-text-secondary, var(--theme-color-text-primary));
  }

  .dropdown-item.danger .dropdown-icon {
    color: var(--theme-color-error);
  }

  .dropdown-item:hover {
    background: var(--theme-color-background);
  }

  .dropdown-item.danger {
    color: var(--theme-color-error);
  }
`;
