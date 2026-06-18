// Expose localization namespaces on window for debugging and external access.
import * as litLocalize from '@lit/localize';
import * as argiagoLocalization from '@/features/localization';

window.__litLocalize = litLocalize;
window.__argiagoLocalization = argiagoLocalization;

declare global {
  interface Window {
    __litLocalize: typeof import('@lit/localize');
    __argiagoLocalization: typeof import('@/features/localization');
  }
}
