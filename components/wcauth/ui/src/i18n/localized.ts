import "./init.ts";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  LOCALE_STATUS_EVENT,
  type LocaleStatusEventDetail,
} from "@lit/localize";

// Tracks hosts that already own a LocaleController so re-connections
// (DOM moves, reattach cycles) do not stack duplicate listeners.
const ATTACHED_HOSTS = new WeakSet<ReactiveControllerHost>();

/**
 * Re-renders the host whenever `lit-localize` emits a status event on
 * `window`. Listens for all status transitions (`loading` | `ready` |
 * `error`) — any of them is a signal that templates may now resolve to
 * a different locale and the host should re-evaluate `msg(...)` calls.
 *
 * Standalone for the wcauth bundle — does not depend on the host
 * app's `localizationService`.
 */
export class LocaleController implements ReactiveController {
  private readonly host: ReactiveControllerHost;

  private readonly _handleLocaleStatus = (
    _event: CustomEvent<LocaleStatusEventDetail>,
  ): void => {
    this.host.requestUpdate();
  };

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    window.addEventListener(LOCALE_STATUS_EVENT, this._handleLocaleStatus);
  }

  hostDisconnected(): void {
    window.removeEventListener(LOCALE_STATUS_EVENT, this._handleLocaleStatus);
  }
}

/**
 * Class decorator factory. Attaches a `LocaleController` to the host
 * element so it re-renders on lit-localize status changes.
 *
 * Zero-arg factory so call sites read as `@localized()` and stay
 * composable with `@customElement(...)`.
 *
 * Usage:
 *   @customElement('my-element')
 *   @localized()
 *   class MyElement extends LitElement { ... }
 */
export function localized() {
  return function <T extends { new (...args: any[]): HTMLElement }>(
    constructor: T,
  ): T {
    const connectedCallback = constructor.prototype.connectedCallback;

    constructor.prototype.connectedCallback = function (this: HTMLElement) {
      const host = this as unknown as ReactiveControllerHost;
      if (!ATTACHED_HOSTS.has(host)) {
        new LocaleController(host);
        ATTACHED_HOSTS.add(host);
      }
      if (connectedCallback) {
        connectedCallback.call(this);
      }
    };

    return constructor;
  };
}
