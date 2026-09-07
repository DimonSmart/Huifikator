import { DomController } from "./dom-controller";
import type { Intensity } from "../core/selector";

declare global { interface Window { __huifikatorController?: DomController } }

const controller = window.__huifikatorController ?? new DomController(100);
window.__huifikatorController = controller;

if (!(globalThis as typeof globalThis & { __huifikatorListener?: boolean }).__huifikatorListener) {
  (globalThis as typeof globalThis & { __huifikatorListener?: boolean }).__huifikatorListener = true;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "status") sendResponse({ enabled: controller.isEnabled() });
    if (message.type === "toggle") {
      controller.setIntensity(message.intensity as Intensity);
      controller.isEnabled() ? controller.disable() : controller.enable();
      sendResponse({ enabled: controller.isEnabled() });
    }
  });
}
