import { LitElement, html, css } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { msg } from "@lit/localize";
import { localized } from "./i18n/localized.ts";
import { authSharedStyles } from "./styles.ts";
import {
  fetchWcAuthConfig,
  updateWcAuthConfig,
  fetchWcAuthI18n,
  updateWcAuthI18n,
  deleteWcAuthI18n,
  type WcAuthConfig,
  type I18nEntry,
  AuthClientError,
} from "./api/auth-client.ts";
import { allLocales } from "./generated/locale-codes.ts";

type Tab = "general" | "translations";

/**
 * `<wcauth-settings>` — admin settings UI for the wcauth module.
 *
 * Two tabs:
 * - General: edit reset-password redirect URL
 * - Translations: per-locale translation override editor
 *
 * All API calls target `/_/wasm/wcauth/*` admin endpoints which require
 * admin status + CSRF (handled by the API client methods).
 */
@customElement("wcauth-settings")
@localized()
export class WcAuthSettings extends LitElement {
  @state() private activeTab: Tab = "general";
  @state() private loading = true;
  @state() private error = "";
  @state() private successMessage = "";

  // General tab state
  @state() private resetPasswordUrl = "";
  @state() private savingGeneral = false;

  // Translations tab state
  @state() private selectedLocale = "en";
  @state() private i18nEntries: I18nEntry[] = [];
  @state() private i18nDefaults: I18nEntry[] = [];
  @state() private i18nOverrides: Map<string, string> = new Map();
  // Snapshot of overrides as last saved/loaded from the server — used to
  // determine dirty state so the Save button is only active on unsaved changes.
  @state() private savedOverrides: Map<string, string> = new Map();
  @state() private loadingI18n = false;
  @state() private savingI18n = false;
  @state() private resettingI18n = false;
  @state() private showResetConfirm = false;

  @query("#xliff-upload") private xliffUploadInput!: HTMLInputElement;

  async connectedCallback() {
    super.connectedCallback();
    try {
      await this.loadConfig();
    } catch (err) {
      this.error =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to load settings. Please try again.");
    } finally {
      this.loading = false;
    }
  }

  private async loadConfig() {
    const config = await fetchWcAuthConfig();
    this.resetPasswordUrl = config.reset_password_redirect_url;
  }

  private async handleSaveGeneral() {
    this.savingGeneral = true;
    this.error = "";
    this.successMessage = "";
    try {
      const config: WcAuthConfig = {
        reset_password_redirect_url: this.resetPasswordUrl,
      };
      await updateWcAuthConfig(config);
      this.successMessage = msg("Settings saved successfully.");
    } catch (err) {
      this.error =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to save settings.");
    } finally {
      this.savingGeneral = false;
    }
  }

  private async handleTabSwitch(tab: Tab) {
    this.activeTab = tab;
    this.error = "";
    this.successMessage = "";
    if (tab === "translations" && this.i18nDefaults.length === 0) {
      await this.loadI18n();
    }
  }

  private mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (b.get(key) !== val) return false;
    }
    return true;
  }

  private async loadI18n() {
    this.loadingI18n = true;
    this.error = "";
    try {
      const data = await fetchWcAuthI18n(this.selectedLocale);
      this.i18nDefaults = data.default;
      this.i18nEntries = data.default;
      this.i18nOverrides = new Map(data.override.map((e) => [e.id, e.value]));
      this.savedOverrides = new Map(this.i18nOverrides);
    } catch (err) {
      this.error =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to load translations.");
    } finally {
      this.loadingI18n = false;
    }
  }

  private async handleLocaleChange(e: Event) {
    this.selectedLocale = (e.target as HTMLSelectElement).value;
    this.showResetConfirm = false;
    await this.loadI18n();
  }

  private handleOverrideInput(id: string, value: string) {
    const next = new Map(this.i18nOverrides);
    if (value === this.getDefaultValue(id)) {
      next.delete(id);
    } else {
      next.set(id, value);
    }
    this.i18nOverrides = next;
  }

  private getDefaultValue(id: string): string {
    return this.i18nDefaults.find((e) => e.id === id)?.value ?? "";
  }

  private async handleSaveI18n() {
    this.savingI18n = true;
    this.error = "";
    this.successMessage = "";
    try {
      const entries: I18nEntry[] = Array.from(this.i18nOverrides.entries()).map(
        ([id, value]) => ({ id, value }),
      );
      await updateWcAuthI18n(this.selectedLocale, entries);
      this.savedOverrides = new Map(this.i18nOverrides);
      this.successMessage = msg("Translations saved successfully.");
    } catch (err) {
      this.error =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to save translations.");
    } finally {
      this.savingI18n = false;
    }
  }

  private async handleResetI18n() {
    this.resettingI18n = true;
    this.error = "";
    this.successMessage = "";
    try {
      await deleteWcAuthI18n(this.selectedLocale);
      this.i18nOverrides = new Map();
      this.savedOverrides = new Map();
      this.showResetConfirm = false;
      this.successMessage = msg("Translations reset to default.");
    } catch (err) {
      this.error =
        err instanceof AuthClientError
          ? err.message
          : msg("Failed to reset translations.");
    } finally {
      this.resettingI18n = false;
    }
  }

  // emptyTargets=true: generate a translator template with blank <target> elements.
  private generateXliff(emptyTargets = false): string {
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const units = this.i18nDefaults
      .map((entry) => {
        const target = emptyTargets
          ? ""
          : (this.i18nOverrides.get(entry.id) ?? entry.value);
        return [
          `      <trans-unit id="${esc(entry.id)}">`,
          `        <source>${esc(entry.value)}</source>`,
          `        <target>${esc(target)}</target>`,
          `      </trans-unit>`,
        ].join("\n");
      })
      .join("\n");
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      `  <file source-language="en" target-language="${this.selectedLocale}" original="wcauth" datatype="plaintext">`,
      "    <body>",
      units,
      "    </body>",
      "  </file>",
      "</xliff>",
    ].join("\n");
  }

  private handleXliffDownload(emptyTargets = false) {
    const xml = this.generateXliff(emptyTargets);
    const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = emptyTargets
      ? "wcauth-template.xliff"
      : `wcauth-${this.selectedLocale}.xliff`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private parseXliff(text: string): Map<string, string> {
    const doc = new DOMParser().parseFromString(text, "text/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error(msg("Invalid XLIFF file"));
    }
    const result = new Map<string, string>();
    for (const unit of doc.querySelectorAll("trans-unit")) {
      const id = unit.getAttribute("id");
      const target = unit.querySelector("target")?.textContent;
      if (id && target != null) result.set(id, target);
    }
    return result;
  }

  private async handleXliffUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    this.error = "";
    this.successMessage = "";
    try {
      const parsed = this.parseXliff(await file.text());
      const next = new Map<string, string>();
      for (const [id, value] of parsed) {
        if (value !== this.getDefaultValue(id)) next.set(id, value);
      }
      this.i18nOverrides = next;
      this.successMessage = msg("XLIFF loaded. Review and save when ready.");
    } catch (err) {
      this.error =
        err instanceof Error ? err.message : msg("Failed to parse XLIFF file.");
    }
  }

  private renderGeneralTab() {
    return html`
      <div class="tab-content">
        <div class="form-field">
          <label for="reset-password-url"
            >${msg("Reset password redirect URL")}</label
          >
          <input
            id="reset-password-url"
            type="text"
            .value=${this.resetPasswordUrl}
            @input=${(e: Event) => {
              this.resetPasswordUrl = (e.target as HTMLInputElement).value;
            }}
            placeholder="/reset-password?token={token}"
          />
          <span class="hint"
            >${msg("Use {token} as a placeholder for the reset token.")}</span
          >
        </div>

        <button
          class="btn btn-primary"
          @click=${() => this.handleSaveGeneral()}
          ?disabled=${this.savingGeneral || !this.resetPasswordUrl}
        >
          ${this.savingGeneral ? msg("Saving...") : msg("Save")}
        </button>
      </div>
    `;
  }

  private renderTranslationsReadOnly() {
    return html`
      <div class="translations-table">
        <div class="table-header table-2col">
          <span class="col-key">${msg("Key")}</span>
          <span class="col-default">${msg("Value")}</span>
        </div>
        ${this.i18nDefaults.map(
          (entry) => html`
            <div class="table-row table-2col">
              <span class="col-key" title=${entry.id}>${entry.id}</span>
              <span class="col-default">${entry.value}</span>
            </div>
          `,
        )}
      </div>

      <div class="translations-actions">
        <button
          class="btn btn-outline"
          @click=${() => this.handleXliffDownload(true)}
          ?disabled=${this.i18nDefaults.length === 0}
        >
          ${msg("Download XLIFF Template")}
        </button>
      </div>
    `;
  }

  private renderTranslationsEditable() {
    return html`
      <div class="translations-table">
        <div class="table-header">
          <span class="col-key">${msg("Key")}</span>
          <span class="col-default">${msg("Default")}</span>
          <span class="col-override">${msg("Override")}</span>
        </div>
        ${this.i18nEntries.map((entry) => {
          const overrideValue = this.i18nOverrides.get(entry.id) ?? "";
          return html`
            <div class="table-row">
              <span class="col-key" title=${entry.id}>${entry.id}</span>
              <span class="col-default">${entry.value}</span>
              <input
                class="col-override-input"
                type="text"
                .value=${overrideValue}
                placeholder=${entry.value}
                @input=${(e: Event) => {
                  this.handleOverrideInput(
                    entry.id,
                    (e.target as HTMLInputElement).value,
                  );
                }}
              />
            </div>
          `;
        })}
      </div>

      <input
        id="xliff-upload"
        type="file"
        accept=".xliff,.xlf,.xml"
        hidden
        @change=${this.handleXliffUpload}
      />

      <div class="translations-actions">
        <button
          class="btn btn-primary"
          @click=${() => this.handleSaveI18n()}
          ?disabled=${this.savingI18n ||
          this.mapsEqual(this.i18nOverrides, this.savedOverrides)}
        >
          ${this.savingI18n ? msg("Saving...") : msg("Save Overrides")}
        </button>
        <button
          class="btn btn-outline"
          @click=${() => this.xliffUploadInput.click()}
        >
          ${msg("Upload XLIFF")}
        </button>
        <button
          class="btn btn-outline"
          @click=${() => this.handleXliffDownload()}
          ?disabled=${this.i18nDefaults.length === 0}
        >
          ${msg("Download XLIFF")}
        </button>
        <button
          class="btn btn-outline"
          @click=${() => {
            this.showResetConfirm = true;
          }}
          ?disabled=${this.resettingI18n || this.savedOverrides.size === 0}
        >
          ${msg("Reset to Default")}
        </button>
      </div>
    `;
  }

  private renderTranslationsTab() {
    const isSourceLocale = this.selectedLocale === "en";

    return html`
      <div class="tab-content">
        <div class="form-field">
          <label for="locale-select">${msg("Locale")}</label>
          <select
            id="locale-select"
            .value=${this.selectedLocale}
            @change=${this.handleLocaleChange}
            ?disabled=${this.loadingI18n}
          >
            ${allLocales.map(
              (locale) => html`<option value=${locale}>${locale}</option>`,
            )}
          </select>
        </div>

        ${this.loadingI18n
          ? html`<div class="loading">${msg("Loading translations...")}</div>`
          : isSourceLocale
            ? this.renderTranslationsReadOnly()
            : this.renderTranslationsEditable()}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-skeleton"></div>`;
    }

    if (this.error && !this.resetPasswordUrl) {
      return html`<div class="error-banner" role="alert">${this.error}</div>`;
    }

    return html`
      <div class="settings-root">
        <h1 class="settings-title">${msg("WcAuth Settings")}</h1>

        ${this.error
          ? html`<div class="error-banner" role="alert">${this.error}</div>`
          : ""}
        ${this.successMessage
          ? html`<div class="success-banner" role="status">
              ${this.successMessage}
            </div>`
          : ""}

        <div class="tabs">
          <button
            class="tab ${this.activeTab === "general" ? "active" : ""}"
            @click=${() => this.handleTabSwitch("general")}
          >
            ${msg("General")}
          </button>
          <button
            class="tab ${this.activeTab === "translations" ? "active" : ""}"
            @click=${() => this.handleTabSwitch("translations")}
          >
            ${msg("Translations")}
          </button>
        </div>

        ${this.activeTab === "general"
          ? this.renderGeneralTab()
          : this.renderTranslationsTab()}
      </div>

      ${this.showResetConfirm
        ? html`
            <div
              class="modal-overlay"
              @click=${() => {
                this.showResetConfirm = false;
              }}
            >
              <div
                class="modal-dialog"
                @click=${(e: Event) => e.stopPropagation()}
              >
                <p class="modal-text">
                  ${msg("Reset all overrides to default?")}
                </p>
                <div class="modal-actions">
                  <button
                    class="btn btn-secondary"
                    @click=${() => this.handleResetI18n()}
                    ?disabled=${this.resettingI18n}
                  >
                    ${this.resettingI18n ? msg("Resetting...") : msg("Confirm")}
                  </button>
                  <button
                    class="btn btn-outline"
                    @click=${() => {
                      this.showResetConfirm = false;
                    }}
                  >
                    ${msg("Cancel")}
                  </button>
                </div>
              </div>
            </div>
          `
        : ""}
    `;
  }

  static styles = [
    authSharedStyles,
    css`
      :host {
        display: block;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
          sans-serif;
        font-size: 1rem;
        color: var(--theme-color-text-primary, #111827);
      }

      .settings-root {
        background: var(--theme-color-surface-elevated, #ffffff);
        border-radius: 12px;
        padding: 2rem;
        width: 100%;
        box-sizing: border-box;
      }

      .settings-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1.5rem 0;
        color: var(--theme-color-text-primary, #111827);
      }

      .tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--theme-color-border, #e5e7eb);
        margin-bottom: 1.5rem;
      }

      .tab {
        padding: 0.625rem 1rem;
        font-size: 0.9375rem;
        font-weight: 500;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--theme-color-text-secondary, #6b7280);
        cursor: pointer;
        font-family: inherit;
        transition:
          color 0.2s ease,
          border-color 0.2s ease;
      }

      .tab:hover {
        color: var(--theme-color-text-primary, #111827);
      }

      .tab.active {
        color: var(--theme-color-primary, #6366f1);
        border-bottom-color: var(--theme-color-primary, #6366f1);
      }

      .tab-content {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .hint {
        font-size: 0.8125rem;
        color: var(--theme-color-text-secondary, #6b7280);
      }

      .form-field select {
        width: 100%;
        padding: 0.625rem 0.75rem;
        font-size: 0.9375rem;
        font-family: inherit;
        color: var(--theme-color-text-primary, #111827);
        background: var(--theme-color-surface, #f9fafb);
        border: 1px solid var(--theme-color-border, #e5e7eb);
        border-radius: 6px;
        box-sizing: border-box;
        cursor: pointer;
      }

      .translations-table {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--theme-color-border, #e5e7eb);
        border-radius: 8px;
        overflow: hidden;
      }

      .table-2col {
        grid-template-columns: 1fr 3fr;
      }

      .table-header {
        display: grid;
        grid-template-columns: 1fr 2fr 2fr;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: var(--theme-color-surface, #f9fafb);
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--theme-color-text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .table-row {
        display: grid;
        grid-template-columns: 1fr 2fr 2fr;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        border-top: 1px solid var(--theme-color-border, #e5e7eb);
        align-items: center;
      }

      .col-key {
        font-size: 0.8125rem;
        font-family: monospace;
        color: var(--theme-color-text-secondary, #6b7280);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .col-default {
        font-size: 0.875rem;
        color: var(--theme-color-text-secondary, #6b7280);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .col-override-input {
        width: 100%;
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
        font-family: inherit;
        color: var(--theme-color-text-primary, #111827);
        background: var(--theme-color-surface, #f9fafb);
        border: 1px solid var(--theme-color-border, #e5e7eb);
        border-radius: 4px;
        box-sizing: border-box;
      }

      .col-override-input:focus {
        outline: none;
        border-color: var(--theme-color-primary, #6366f1);
      }

      .translations-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        position: sticky;
        bottom: 0;
        background: var(--theme-color-surface-elevated, #ffffff);
        padding: 0.75rem 0;
        border-top: 1px solid var(--theme-color-border, #e5e7eb);
        margin-top: 0.25rem;
        z-index: 10;
      }

      .translations-actions .btn {
        width: auto;
      }

      .confirm-text {
        font-size: 0.875rem;
        color: var(--theme-color-error, #ef4444);
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-dialog {
        background: var(--theme-color-surface-elevated, #ffffff);
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      }

      .modal-text {
        margin: 0 0 1.25rem 0;
        font-size: 0.9375rem;
        color: var(--theme-color-text-primary, #111827);
      }

      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .error-banner {
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--theme-color-error, #ef4444);
        background: color-mix(
          in srgb,
          var(--theme-color-error, #ef4444) 10%,
          transparent
        );
        border: 1px solid var(--theme-color-error, #ef4444);
        border-radius: 6px;
      }

      .success-banner {
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: var(--theme-color-success, #22c55e);
        background: color-mix(
          in srgb,
          var(--theme-color-success, #22c55e) 10%,
          transparent
        );
        border: 1px solid var(--theme-color-success, #22c55e);
        border-radius: 6px;
      }

      .loading-skeleton {
        height: 120px;
        border-radius: 8px;
        background: color-mix(
          in srgb,
          var(--theme-color-text-primary, #111827) 8%,
          transparent
        );
        animation: pulse 1.5s ease-in-out infinite;
      }

      .loading {
        padding: 2rem;
        text-align: center;
        color: var(--theme-color-text-secondary, #6b7280);
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      @media (max-width: 640px) {
        .settings-root {
          padding: 1.5rem;
        }
        .table-header {
          display: none;
        }
        .table-row {
          grid-template-columns: 1fr;
          gap: 0.25rem;
          padding: 0.75rem;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "wcauth-settings": WcAuthSettings;
  }
}
