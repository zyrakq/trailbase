import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { localized } from '@/features/localization';
import { segmentedControlStyles } from './segmented-control.styles';

export interface SegmentedSelectEventDetail {
  value: string;
}

@customElement('segmented-control')
@localized()
export class SegmentedControl extends LitElement {
  @property({ type: Array }) values: string[] = [];
  @property({ type: Object }) labels: Record<string, string> = {};
  @property({ type: String }) value = '';
  @property({ type: Array }) disabledValues: string[] = [];

  private _handleClick(value: string, disabled: boolean): void {
    if (disabled) return;
    this.dispatchEvent(
      new CustomEvent<SegmentedSelectEventDetail>('select', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render(): TemplateResult {
    return html`
      ${this.values.map(value => {
        const disabled = this.disabledValues.includes(value);
        const isActive = this.value === value;
        return html`
          <button
            type="button"
            class="pill ${isActive ? 'active' : ''}"
            ?data-disabled=${disabled}
            aria-disabled=${disabled ? 'true' : 'false'}
            @click=${() => this._handleClick(value, disabled)}
          >
            ${this.labels[value] ?? value}
          </button>
        `;
      })}
      ${this.values.length === 0 ? nothing : null}
    `;
  }

  static styles = segmentedControlStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'segmented-control': SegmentedControl;
  }
}
