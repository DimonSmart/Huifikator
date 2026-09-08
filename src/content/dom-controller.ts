import { applyTransformations, planTransformations, transformText } from "../core/transform";
import type { Intensity } from "../core/selector";

const EXCLUDED = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION",
  "CODE", "PRE", "KBD", "SAMP",
]);

interface NodeState { original: string; installed: string }

export class DomController {
  private readonly states = new Map<Text, NodeState>();
  private readonly queue = new Set<Node>();
  private readonly processedBlocks = new WeakSet<Element>();
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
    const block = (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement)
      ?.closest("p,div,section,article,li,blockquote,h1,h2,h3,h4,h5,h6");
    if (block) this.processedBlocks.delete(block);
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
      this.processInContext(root as Text);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => this.isExcluded(node)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
    });
    let node: Node | null;
    while ((node = walker.nextNode())) this.processInContext(node as Text);
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

  private processInContext(node: Text): void {
    const block = node.parentElement?.closest("p,div,section,article,li,blockquote,h1,h2,h3,h4,h5,h6");
    if (!block) { this.process(node); return; }
    if (this.processedBlocks.has(block)) return;
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode: (candidate) => this.isExcluded(candidate) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let current: Node | null;
    while ((current = walker.nextNode())) nodes.push(current as Text);
    if (nodes.length < 2) { this.process(node); return; }

    // Text is analysed as one block, but replacements are installed back into
    // their original text nodes so markup and restore semantics are preserved.
    const source = nodes.map((item) => {
      const state = this.states.get(item);
      return state && item.data === state.installed ? state.original : item.data;
    }).join("");
    const plan = planTransformations(source, this.pageUrl, this.intensity);
    let offset = 0;
    for (const item of nodes) {
      const previous = this.states.get(item);
      const original = previous && item.data === previous.installed ? previous.original : item.data;
      if (previous && item.data !== previous.installed) this.states.delete(item);
      const installed = applyTransformations(original, plan, offset);
      if (installed !== original && (!previous || item.data !== previous.installed || installed !== previous.installed)) {
        this.states.set(item, { original, installed });
        item.data = installed;
      } else if (installed === original) {
        if (previous && item.data === previous.installed) item.data = original;
        this.states.delete(item);
      }
      offset += original.length;
    }
    this.processedBlocks.add(block);
  }
}
