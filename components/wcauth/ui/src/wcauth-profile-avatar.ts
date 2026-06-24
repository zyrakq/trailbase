import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import {
  uploadAvatar,
  deleteAvatar,
  AuthClientError,
} from "./api/auth-client.ts";
import { userIcon } from "./icons.ts";

/**
 * `<wcauth-profile-avatar>` — avatar display + upload/delete actions.
 *
 * Layout: avatar on the left (display-only), action buttons on the right.
 * The avatar itself is not clickable; explicit "Change" and "Remove" buttons
 * are the only interaction points.
 *
 * Events dispatched to parent (bubbles, composed):
 * - `wcauth-profile-avatar-changed` — fired after successful upload or delete
 */
@customElement("wcauth-profile-avatar")
@localized()
export class WcAuthProfileAvatar extends LitElement {
  @property({ type: String }) userId = "";

  @state() private avatarFailed = false;
  @state() private uploading = false;
  @state() private deleting = false;
  @state() private errorMessage = "";
  @state() private cacheBust = "";

  private fileInput?: HTMLInputElement;

  private get avatarSrc(): string {
    if (!this.userId) return "";
    const base = `/api/auth/v1/avatar/${this.userId}`;
    return this.cacheBust ? `${base}?t=${this.cacheBust}` : base;
  }

  private handleAvatarError() {
    this.avatarFailed = true;
  }

  private handleChangeClick() {
    if (this.uploading || this.deleting) return;
    if (!this.fileInput) {
      this.fileInput = document.createElement("input");
      this.fileInput.type = "file";
      this.fileInput.accept = "image/png,image/jpeg";
      this.fileInput.style.display = "none";
      this.fileInput.addEventListener("change", () => this.handleFileChange());
      this.renderRoot.appendChild(this.fileInput);
    }
    this.fileInput.value = "";
    this.fileInput.click();
  }

  private async handleFileChange() {
    const file = this.fileInput?.files?.[0];
    if (!file) return;

    this.errorMessage = "";
    this.uploading = true;

    try {
      await uploadAvatar(file);
      this.avatarFailed = false;
      this.cacheBust = Date.now().toString();
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-avatar-changed", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      this.errorMessage =
        err instanceof AuthClientError
          ? err.message
          : msg("Avatar upload failed. Please try again.");
    } finally {
      this.uploading = false;
    }
  }

  private async handleRemove() {
    this.errorMessage = "";
    this.deleting = true;

    try {
      await deleteAvatar();
      this.avatarFailed = true;
      this.cacheBust = "";
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-avatar-changed", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      this.errorMessage =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to remove avatar. Please try again.");
    } finally {
      this.deleting = false;
    }
  }

  private get isBusy() {
    return this.uploading || this.deleting;
  }

  render() {
    const hasAvatar = !this.avatarFailed;

    return html`
      <div class="avatar-row">
        <div class="avatar-display">
          <object
            type="image/jpeg"
            data=${this.avatarSrc}
            class="avatar-image"
            @error=${this.handleAvatarError}
          >
            <div class="avatar-fallback">${userIcon()}</div>
          </object>
          ${this.uploading
            ? html`<div class="avatar-loading-overlay">
                <div class="spinner"></div>
              </div>`
            : ""}
        </div>

        <div class="avatar-actions">
          <button
            class="action-btn action-btn-change"
            ?disabled=${this.isBusy}
            @click=${this.handleChangeClick}
          >
            ${this.uploading ? msg("Uploading...") : msg("Change")}
          </button>
          ${hasAvatar
            ? html`<button
                class="action-btn action-btn-remove"
                ?disabled=${this.isBusy}
                @click=${this.handleRemove}
              >
                ${this.deleting ? msg("Removing...") : msg("Remove")}
              </button>`
            : ""}
        </div>
      </div>

      ${this.errorMessage
        ? html`<div class="error-message" role="alert">
            ${this.errorMessage}
          </div>`
        : ""}
    `;
  }

  static styles = css`
    :host {
      display: block;
      font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        sans-serif;
      font-size: 1rem;
      color: var(--theme-color-text-primary, #111827);
    }

    .avatar-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-display {
      position: relative;
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid var(--theme-color-border, #e5e7eb);
      background: var(--theme-color-primary, #6366f1);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
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
      background: color-mix(
        in srgb,
        var(--theme-color-primary, #6366f1) 60%,
        transparent
      );
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
      to {
        transform: rotate(360deg);
      }
    }

    .avatar-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      border: 1px solid transparent;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        opacity 0.2s ease;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-btn-change {
      background: var(--theme-color-surface, #ffffff);
      border-color: var(--theme-color-border, #e5e7eb);
      color: var(--theme-color-text-primary, #111827);
    }

    .action-btn-change:hover:not(:disabled) {
      border-color: var(--theme-color-primary, #6366f1);
      color: var(--theme-color-primary, #6366f1);
    }

    .action-btn-remove {
      background: transparent;
      border-color: var(--theme-color-error, #ef4444);
      color: var(--theme-color-error, #ef4444);
    }

    .action-btn-remove:hover:not(:disabled) {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .error-message {
      font-size: 0.8125rem;
      color: var(--theme-color-error, #ef4444);
      margin-top: 0.5rem;
    }

    @media (max-width: 480px) {
      .avatar-display {
        width: 56px;
        height: 56px;
      }

      .action-btn {
        padding: 0.4rem 0.75rem;
        font-size: 0.8125rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-profile-avatar": WcAuthProfileAvatar;
  }
}
