import { transformText } from "../core/transform";
import type { Intensity } from "../core/selector";

const EXCLUDED = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION",
  "CODE", "PRE", "KBD", "SAMP",
]);

interface NodeState { original: string; installed: string }

export class DomController {
  private readonly states = new Map<Text, NodeState>();
  private readonly queue = new Set<Node>();
  private observer: MutationObserver | null = null;
  private scheduled = false;
  private enabled = false;

  constructor(private intensity: Intensity, private readonly pageUrl = location.href) {}

  isEnabled(): boolean { return this.enabled; }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.scan(document.body ?? document.documentElement);
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") this.enqueue(mutation.target);
        for (const node of mutation.addedNodes) this.enqueue(node);
      }
    });
    this.observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.observer?.disconnect();
    this.observer = null;
    this.queue.clear();
    for (const [node, state] of this.states) {
      if (node.data === state.installed) node.data = state.original;
    }
    this.states.clear();
  }

  setIntensity(intensity: Intensity): void {
    if (this.intensity === intensity) return;
    const wasEnabled = this.enabled;
    if (wasEnabled) this.disable();
    this.intensity = intensity;
    if (wasEnabled) this.enable();
  }

  private enqueue(node: Node): void {
    if (!this.enabled) return;
    this.queue.add(node);
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      const batch = [...this.queue];
      this.queue.clear();
      for (const item of batch) this.scan(item);
    });
  }

  private scan(root: Node): void {
    if (!this.enabled || this.isExcluded(root)) return;
    if (root.nodeType === Node.TEXT_NODE) {
      this.process(root as Text);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => this.isExcluded(node)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
    });
    let node: Node | null;
    while ((node = walker.nextNode())) this.process(node as Text);
  }

  private isExcluded(node: Node): boolean {
    const element = node.nodeType === Node.ELEMENT_NODE
      ? node as Element
      : node.parentElement;
    return Boolean(element?.closest([...EXCLUDED].join(",")) || element?.closest("[contenteditable]:not([contenteditable='false'])"));
  }

  private process(node: Text): void {
    const previous = this.states.get(node);
    if (previous && node.data === previous.installed) return;
    // A site-authored mutation supersedes our previous snapshot.
    if (previous) this.states.delete(node);
    const original = node.data;
    const installed = transformText(original, this.pageUrl, this.intensity);
    if (installed === original) return;
    this.states.set(node, { original, installed });
    node.data = installed;
  }
}
