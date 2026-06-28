import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { LocaleController } from '../controllers/locale.controller';
import { localizationService } from '../services/localization.service';
import { LOCALE_METADATA } from '../data/locale-metadata';
import { localeBottomSheetStyles } from './locale-bottom-sheet.styles';
import type { LocaleCode, LocaleMetadata } from '../types/localization.types';

@customElement('locale-bottom-sheet')
@localized()
export class LocaleBottomSheet extends LitElement {
  @property({ type: Boolean }) open = false;

  private _locale = new LocaleController(this);

  @state() private _locales: LocaleMetadata[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this._locales = localizationService
      .getAvailableLocales()
      .map((code) => LOCALE_METADATA[code]);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('open')) {
      if (this.open) {
        document.addEventListener('keydown', this._handleKeyDown);
      } else {
        document.removeEventListener('keydown', this._handleKeyDown);
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this._emitClose();
    }
  };

  private _emitClose(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private async _selectLocale(code: LocaleCode): Promise<void> {
    try {
      await localizationService.setLocale(code);
    } catch (error) {
      console.error('Failed to switch locale:', error);
    }
    this.dispatchEvent(
      new CustomEvent('locale-selected', {
        detail: { locale: code },
        bubbles: true,
        composed: true,
      })
    );
    this._emitClose();
  }

  private _renderCheckmark() {
    return html`
      <svg class="sheet-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <polyline
          points="20 6 9 17 4 12"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></polyline>
      </svg>
    `;
  }

  render() {
    const openClass = this.open ? 'open' : '';
    return html`
      <div
        class="sheet-backdrop ${openClass}"
        @click=${this._emitClose}
        aria-hidden="true"
      ></div>
      <div
        class="sheet-panel ${openClass}"
        role="dialog"
        aria-modal="true"
        aria-label=${msg('Select Language')}
      >
        <div class="sheet-handle" aria-hidden="true"></div>
        <div class="sheet-header">${msg('Select Language')}</div>
        <div class="sheet-list" role="listbox">
          ${this._locales.map((locale) => {
            const isActive = locale.code === this._locale.locale;
            return html`
              <button
                class="sheet-item ${isActive ? 'active' : ''}"
                role="option"
                aria-selected=${isActive}
                @click=${() => this._selectLocale(locale.code)}
              >
                <span class="sheet-flag">${locale.flag}</span>
                <span class="sheet-name">${locale.name}</span>
                ${isActive ? this._renderCheckmark() : nothing}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  static styles = localeBottomSheetStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'locale-bottom-sheet': LocaleBottomSheet;
  }
}
