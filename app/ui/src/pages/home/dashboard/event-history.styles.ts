import { css } from 'lit';

export const eventHistoryStyles = css`
  :host {
    display: block;
  }

  .title {
    margin: 0 0 0.75rem 0;
    color: var(--theme-color-text-primary);
    font-size: 1rem;
    font-weight: 600;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--theme-color-border);
  }

  .item:last-child {
    border-bottom: none;
  }

  .icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-subscribed {
    color: var(--theme-color-success);
  }

  .icon-renewed {
    color: var(--theme-color-info);
  }

  .icon-cancelled {
    color: var(--theme-color-error);
  }

  .icon-expired {
    color: var(--theme-color-warning);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .name {
    font-weight: 500;
    color: var(--theme-color-text-primary);
  }

  .meta {
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
  }

  .item time {
    margin-left: auto;
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
  }

  .empty,
  .loading {
    color: var(--theme-color-text-secondary);
    text-align: center;
    padding: 2rem 1rem;
    margin: 0;
  }
`;
