// i18n barrel for the wcauth component.
// Re-exports the localized decorator/controller, init service, and the
// @lit/localize template helpers so call sites only need one import path.

export { localizationService } from "./init.ts";
export { LocaleController, localized } from "./localized.ts";
export { msg, str } from "@lit/localize";
