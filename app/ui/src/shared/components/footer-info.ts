import { LitElement, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { configService } from '@/features/auth/services/config.service';
import { footerInfoStyles } from './footer-info.styles';

type FooterLink = { label: string; href: string };

@customElement('footer-info')
@localized()
export class FooterInfo extends LitElement {
  @state()
  private brandName = 'VELORA';

  @state()
  private copyrightYear = new Date().getFullYear();

  @state()
  private termsUrl?: string;

  @state()
  private privacyUrl?: string;

  @state()
  private supportUrl?: string;

  // Await init() so real branding wins over the first-paint placeholders —
  // the footer mounts before the branding fetch resolves.
  async connectedCallback() {
    super.connectedCallback();
    await configService.init();
    const config = configService.getConfig();
    this.brandName = config.brandName.toUpperCase();
    this.copyrightYear = config.copyrightYear;
    this.termsUrl = config.termsUrl;
    this.privacyUrl = config.privacyUrl;
    this.supportUrl = config.supportUrl;
  }

  private get links(): FooterLink[] {
    return [
      this.termsUrl ? { label: msg('Terms'), href: this.termsUrl } : null,
      this.privacyUrl ? { label: msg('Privacy'), href: this.privacyUrl } : null,
      this.supportUrl ? { label: msg('Support'), href: this.supportUrl } : null,
    ].filter((link): link is FooterLink => link !== null);
  }

  render() {
    const links = this.links;

    return html`
      <footer>
        <div class="footer-content">
          <span class="copyright"
            >© ${this.copyrightYear} ${this.brandName}.
            ${msg('All rights reserved.')}</span
          >
          <div class="links">
            ${links.map((link, index) => [
              index > 0 ? html`<span class="separator">•</span>` : nothing,
              html`<a
                href=${link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                ${link.label}
              </a>`,
            ])}
          </div>
        </div>
      </footer>
    `;
  }

  static styles = footerInfoStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-info': FooterInfo;
  }
}
