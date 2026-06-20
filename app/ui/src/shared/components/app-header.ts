import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { localized } from '@/features/localization';
import { ThemeController } from '@/features/theme';
import { appHeaderStyles } from './app-header.styles';
import { configService } from '@/features/auth/services/config.service';
import '@/features/localization/components/locale-switcher';

@customElement('app-header')
@localized()
export class AppHeader extends LitElement {
  private theme = new ThemeController(this);

  @state()
  private brandName = 'velora';

  connectedCallback(): void {
    super.connectedCallback();
    this.brandName = configService.getConfig().brandName;
  }

  render() {
    const logo = `/branding/logo-${this.theme.theme}.svg`;

    return html`
      <header>
        <div class="header-content">
          <div class="logo-section">
            <img src=${logo} alt=${this.brandName} class="logo" />
            <span class="app-name">${this.brandName}</span>
          </div>
          <div class="actions">
            <theme-toggler></theme-toggler>
            <locale-switcher></locale-switcher>
          </div>
        </div>
      </header>
    `;
  }

  static styles = appHeaderStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
