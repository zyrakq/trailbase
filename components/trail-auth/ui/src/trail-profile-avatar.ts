import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { uploadAvatar, deleteAvatar, AuthClientError } from './api/auth-client.ts';
import { userIcon, trashIcon } from './icons.ts';

@customElement('trail-profile-avatar')
export class TrailProfileAvatar extends LitElement {
  @property({ type: String }) userId = '';

  @state() private avatarFailed = false;
  @state() private uploading = false;
  @state() private deleting = false;
  @state() private errorMessage = '';
  @state() private cacheBust = '';

  private fileInput?: HTMLInputElement;

  private get avatarSrc(): string {
    if (!this.userId) return '';
    const base = `/api/auth/v1/avatar/${this.userId}`;
    return this.cacheBust ? `${base}?t=${this.cacheBust}` : base;
  }

  private handleAvatarError() {
    this.avatarFailed = true;
  }

  private handleFileClick() {
    if (this.uploading || this.deleting) return;
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/png,image/jpeg';
      this.fileInput.style.display = 'none';
      this.fileInput.addEventListener('change', () => this.handleFileChange());
      this.renderRoot.appendChild(this.fileInput);
    }
    this.fileInput.value = '';
    this.fileInput.click();
  }

  private async handleFileChange() {
    const file = this.fileInput?.files?.[0];
    if (!file) return;

    this.errorMessage = '';
    this.uploading = true;

    try {
      await uploadAvatar(file);
      this.avatarFailed = false;
      this.cacheBust = Date.now().toString();
      this.dispatchEvent(
        new CustomEvent('trail-profile-avatar-changed', { bubbles: true, composed: true })
      );
    } catch (err) {
      this.errorMessage =
        err instanceof AuthClientError ? err.message : 'Avatar upload failed. Please try again.';
    } finally {
      this.uploading = false;
    }
  }

  private async handleDelete() {
    this.errorMessage = '';
    this.deleting = true;

    try {
      await deleteAvatar();
      this.avatarFailed = true;
      this.cacheBust = '';
      this.dispatchEvent(
        new CustomEvent('trail-profile-avatar-changed', { bubbles: true, composed: true })
      );
    } catch (err) {
      this.errorMessage =
        err instanceof AuthClientError ? err.message : 'Failed to remove avatar. Please try again.';
    } finally {
      this.deleting = false;
    }
  }

  render() {
    const isBusy = this.uploading || this.deleting;

    return html`
      <div class="avatar-root">
        <div class="avatar-wrapper" ?disabled=${isBusy}>
          <button
            class="avatar-trigger"
            aria-label="Upload new avatar"
            ?disabled=${isBusy}
            @click=${this.handleFileClick}
          >
            <object
              type="image/jpeg"
              data=${this.avatarSrc}
              class="avatar-image"
              @error=${this.handleAvatarError}
            >
              <div class="avatar-fallback">${userIcon(32)}</div>
            </object>
            ${this.uploading
              ? html`<div class="avatar-loading-overlay"><div class="spinner"></div></div>`
              : ''}
          </button>

          ${!this.avatarFailed && !this.uploading
            ? html`<button
                class="avatar-delete"
                aria-label="Remove avatar"
                ?disabled=${this.deleting}
                @click=${this.handleDelete}
              >
                ${trashIcon()}
              </button>`
            : ''}
        </div>

        ${this.errorMessage
          ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
          : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      font-size: 1rem;
      color: var(--theme-color-text-primary, #111827);
    }

    .avatar-root {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .avatar-trigger {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid var(--theme-color-border, #e5e7eb);
      background: var(--theme-color-primary, #6366f1);
      color: white;
      cursor: pointer;
      padding: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .avatar-trigger:hover:not(:disabled) {
      border-color: var(--theme-color-primary-hover, #4f46e5);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-color-primary, #6366f1) 25%, transparent);
    }

    .avatar-trigger:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
    }

    .avatar-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: rgba(255, 255, 255, 0.85);
    }

    .avatar-loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--theme-color-primary, #6366f1) 60%, transparent);
      border-radius: 50%;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .avatar-delete {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1px solid var(--theme-color-border, #e5e7eb);
      background: var(--theme-color-surface, #ffffff);
      color: var(--theme-color-error, #ef4444);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease, background-color 0.15s ease;
    }

    .avatar-wrapper:hover .avatar-delete {
      opacity: 1;
    }

    .avatar-delete:hover:not(:disabled) {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .avatar-delete:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .error-message {
      font-size: 0.8125rem;
      color: var(--theme-color-error, #ef4444);
      text-align: center;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'trail-profile-avatar': TrailProfileAvatar;
  }
}
