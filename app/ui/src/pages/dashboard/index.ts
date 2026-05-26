import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { localized } from '@/features/localization';
import { authService } from '@/features/auth';
import { notificationService } from '@/features/notifications';
import type { User } from '@/features/auth';
import type { NotificationTestPayload } from './blocks/notification-tests.ts';
import '@/shared/components/app-header';
import '@/shared/components/footer-info';
import './blocks/user-info.ts';
import './blocks/notification-tests.ts';

@customElement('dashboard-page')
@localized()
export class DashboardPage extends LitElement {
  @state() private user: User | null = null;
  @state() private loading = false;

  async connectedCallback() {
    super.connectedCallback();
    const authState = authService.getAuthState();
    this.user = authState.user;
  }

  private async handleSignOut() {
    try {
      this.loading = true;
      await authService.signOut();
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch {
      notificationService.error(msg('Failed to sign out. Please try again.'));
    } finally {
      this.loading = false;
    }
  }

  private handleTestNotification(e: CustomEvent<NotificationTestPayload>) {
    const { type, long } = e.detail;

    const messages: Record<
      NotificationTestPayload['type'],
      { short: string; long: string }
    > = {
      success: {
        short: msg('Operation completed successfully!'),
        long: msg(
          'The operation has been completed successfully! All user data has been synchronized with the remote server, and the local cache has been updated accordingly. Please verify the changes in your dashboard.'
        ),
      },
      error: {
        short: msg('An error occurred during the operation'),
        long: msg(
          'Failed to connect to the authentication server. The connection was refused due to network timeout (error code: ETIMEDOUT). Please check your internet connection and try again. If the problem persists, contact your system administrator for assistance.'
        ),
      },
      warning: {
        short: msg('This action requires your attention'),
        long: msg(
          'Your session is about to expire in 5 minutes. Any unsaved changes will be lost. Please save your work and refresh your session to continue working without interruption. This is an automated security measure to protect your account.'
        ),
      },
      info: {
        short: msg('New information is available'),
        long: msg(
          'System maintenance is scheduled for tonight between 2:00 AM and 4:00 AM UTC. During this time, the following services will be temporarily unavailable: user authentication, data synchronization, file uploads, and API access. We apologize for any inconvenience this may cause. All services are expected to be fully operational by 4:30 AM UTC. For emergency support during the maintenance window, please contact our 24/7 helpdesk at support@example.com or call +1-800-123-4567. Thank you for your patience and understanding.'
        ),
      },
    };

    const text = long ? messages[type].long : messages[type].short;
    notificationService[type](text);
  }

  render() {
    return html`
      <div class="page">
        <app-header></app-header>
        <main class="main-content">
          <div class="dashboard-container">
            <div class="dashboard-card">
              <h1 class="title">${msg('Dashboard')}</h1>
              <p class="subtitle">${msg('Welcome to your protected area')}</p>

              <dashboard-user-info .user=${this.user}></dashboard-user-info>

              <dashboard-notification-tests
                @test-notification=${this.handleTestNotification}
              ></dashboard-notification-tests>

              <div class="actions">
                <button
                  class="btn btn-danger"
                  @click=${this.handleSignOut}
                  ?disabled=${this.loading}
                >
                  ${this.loading ? msg('Signing out...') : msg('Sign Out')}
                </button>
              </div>
            </div>
          </div>
        </main>
        <footer-info></footer-info>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: var(--theme-color-background);
      transition: background-color 0.2s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
    }

    .dashboard-container {
      width: 100%;
      max-width: 600px;
    }

    .dashboard-card {
      background: var(--theme-color-surface);
      border-radius: 8px;
      padding: 3rem 2.5rem;
      box-shadow: var(--theme-shadow-md);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    .title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--theme-color-text-primary);
      margin: 0 0 0.5rem 0;
      transition: color 0.2s ease;
    }

    .subtitle {
      font-size: 1rem;
      color: var(--theme-color-text-secondary);
      margin: 0 0 2rem 0;
      transition: color 0.2s ease;
    }

    .actions {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
    }

    .btn {
      padding: 0.75rem 2rem;
      font-size: 0.9375rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-family: inherit;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      background: var(--theme-color-error);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-danger:active:not(:disabled) {
      background: #b91c1c;
    }

    @media (max-width: 640px) {
      .main-content {
        padding: 1.5rem 1rem;
      }

      .dashboard-card {
        padding: 2rem 1.5rem;
      }

      .title {
        font-size: 1.75rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-page': DashboardPage;
  }
}
