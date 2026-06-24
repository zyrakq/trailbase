import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import { deleteUser, AuthClientError } from "./api/auth-client.ts";

type AccountState = "idle" | "confirming" | "deleting" | "error";

/**
 * `<wcauth-profile-account>` — destructive account deletion with confirmation modal.
 *
 * Renders a "Delete Account" button that opens a hand-rolled confirmation modal.
 * On confirm, calls GET /api/auth/v1/delete and dispatches
 * wcauth-profile-account-deleted for the host to handle redirect.
 *
 * Events dispatched (bubbles, composed):
 * - `wcauth-profile-account-deleted` — fired after successful deletion
 */
@customElement("wcauth-profile-account")
@localized()
export class WcAuthProfileAccount extends LitElement {
  @state() private state: AccountState = "idle";
  @state() private errorMessage = "";

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.handleKeyDown);
    document.body.style.overflow = "";
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Esc closes the modal unless a deletion is in flight.
    if (
      e.key === "Escape" &&
      this.state !== "idle" &&
      this.state !== "deleting"
    ) {
      this.closeModal();
    }
  };

  private openModal() {
    this.state = "confirming";
    this.errorMessage = "";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(
      new CustomEvent("modal-opened", { bubbles: true, composed: true }),
    );
  }

  private closeModal() {
    this.state = "idle";
    this.errorMessage = "";
    document.body.style.overflow = "";
    window.dispatchEvent(
      new CustomEvent("modal-closed", { bubbles: true, composed: true }),
    );
  }

  private handleBackdropClick(e: MouseEvent) {
    // Only dismiss when clicking the overlay itself, not its children. Never
    // dismiss while a deletion request is in flight.
    if (e.target === e.currentTarget && this.state !== "deleting") {
      this.closeModal();
    }
  }

  private async handleConfirmDelete() {
    this.errorMessage = "";
    this.state = "deleting";

    try {
      await deleteUser();
      // Restore scroll lock state for host toast timers before navigating away.
      window.dispatchEvent(
        new CustomEvent("modal-closed", { bubbles: true, composed: true }),
      );
      this.dispatchEvent(
        new CustomEvent("wcauth-profile-account-deleted", {
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      // Modal stays open so the user can retry or back out.
      this.errorMessage =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to delete account. Please try again.");
      this.state = "error";
    }
  }

  render() {
    const isModalOpen = this.state !== "idle";
    const isDeleting = this.state === "deleting";

    return html`
      <div class="card danger-zone">
        <h2 class="card-title">${msg("Danger Zone")}</h2>
        <p class="danger-description">
          ${msg(
            "Permanently delete your account and all associated data. This action cannot be undone.",
          )}
        </p>
        <button class="btn btn-danger-outline" @click=${this.openModal}>
          ${msg("Delete Account")}
        </button>
      </div>

      ${isModalOpen
        ? html`
            <div class="modal-overlay" @click=${this.handleBackdropClick}>
              <div
                class="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="wcauth-acct-title"
              >
                <h3 id="wcauth-acct-title" class="modal-title">
                  ${msg("Delete Account")}
                </h3>
                <p class="modal-warning">
                  ${msg(
                    "This action is destructive and cannot be reverted. All your data will be permanently deleted.",
                  )}
                </p>

                ${this.errorMessage
                  ? html`<div class="error-message" role="alert">
                      ${this.errorMessage}
                    </div>`
                  : ""}

                <div class="modal-actions">
                  <button
                    class="btn btn-secondary"
                    @click=${this.closeModal}
                    ?disabled=${isDeleting}
                  >
                    ${msg("Back")}
                  </button>
                  <button
                    class="btn btn-danger"
                    @click=${this.handleConfirmDelete}
                    ?disabled=${isDeleting}
                  >
                    ${isDeleting ? msg("Deleting...") : msg("Delete")}
                  </button>
                </div>
              </div>
            </div>
          `
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

    .card {
      background: var(--theme-color-surface, #ffffff);
      border-radius: 8px;
      padding: 2rem;
      box-shadow: var(--theme-shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .danger-zone {
      border: 1px solid var(--theme-color-error, #ef4444);
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0 0 0.75rem 0;
    }

    .danger-description {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary, #6b7280);
      margin: 0 0 1.25rem 0;
      line-height: 1.5;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease,
        opacity 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger-outline {
      background: transparent;
      border: 1px solid var(--theme-color-error, #ef4444);
      color: var(--theme-color-error, #ef4444);
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .btn-secondary {
      background: var(--theme-color-surface, #f9fafb);
      color: var(--theme-color-text-primary, #111827);
      border: 1px solid var(--theme-color-border, #e5e7eb);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--theme-color-background, #f3f4f6);
    }

    .btn-danger {
      background: var(--theme-color-error, #ef4444);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      opacity: 0.9;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--theme-color-error, #ef4444);
      background: var(--theme-color-surface, #f9fafb);
      border: 1px solid var(--theme-color-error, #ef4444);
      border-radius: 6px;
      padding: 0.625rem 0.75rem;
      margin: 0 0 1rem 0;
    }

    /* Modal overlay — fixed full-screen, above all page content. */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      box-sizing: border-box;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal-card {
      width: 100%;
      max-width: 420px;
      background: var(--theme-color-surface, #ffffff);
      border-radius: 10px;
      padding: 1.75rem;
      box-shadow: var(--theme-shadow-md, 0 10px 25px rgba(0, 0, 0, 0.2));
      box-sizing: border-box;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--theme-color-text-primary, #111827);
      margin: 0 0 0.75rem 0;
    }

    .modal-warning {
      font-size: 0.9375rem;
      color: var(--theme-color-text-secondary, #6b7280);
      line-height: 1.5;
      margin: 0 0 1.25rem 0;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.625rem;
    }

    @media (max-width: 480px) {
      .modal-card {
        padding: 1.25rem;
      }

      .modal-actions {
        flex-direction: column-reverse;
      }

      .modal-actions .btn {
        width: 100%;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-profile-account": WcAuthProfileAccount;
  }
}
