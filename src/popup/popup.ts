import type { Intensity } from "../core/selector";

const status = document.querySelector<HTMLElement>("#status")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
const intensity = document.querySelector<HTMLSelectElement>("#intensity")!;

function render(enabled: boolean): void {
  status.textContent = enabled ? "● Включен" : "○ Выключен";
  status.classList.toggle("enabled", enabled);
  toggle.textContent = enabled ? "ВЕРНУТЬ КАК БЫЛО" : "ХУИФИЦИРОВАТЬ";
}

async function activeTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Нет активной вкладки");
  return tab;
}

async function send(message: object): Promise<{ enabled: boolean }> {
  const tab = await activeTab();
  try {
    return await chrome.tabs.sendMessage(tab.id!, message);
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id! }, files: ["content.js"] });
    return await chrome.tabs.sendMessage(tab.id!, message);
  }
}

async function initialize(): Promise<void> {
  const stored = await chrome.storage.local.get("intensity");
  intensity.value = String(stored.intensity ?? 100);
  try { render((await send({ type: "status" })).enabled); }
  catch { status.textContent = "Недоступно на этой странице"; toggle.disabled = true; }
}

intensity.addEventListener("change", () => {
  void chrome.storage.local.set({ intensity: Number(intensity.value) });
});

toggle.addEventListener("click", async () => {
  toggle.disabled = true;
  try {
    const result = await send({ type: "toggle", intensity: Number(intensity.value) as Intensity });
    render(result.enabled);
  } catch { status.textContent = "Недоступно на этой странице"; }
  finally { toggle.disabled = false; }
});

void initialize();
