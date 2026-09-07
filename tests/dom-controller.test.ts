// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { DomController } from "../src/content/dom-controller";

afterEach(() => { document.body.innerHTML = ""; });

describe("DomController", () => {
  it("transforms visible text but preserves excluded and interactive content", () => {
    document.body.innerHTML = `<p>собака</p><a href="/собака">привет</a><input value="собака"><textarea>собака</textarea><code>собака</code><pre>привет</pre><div contenteditable="true">собака</div>`;
    const controller = new DomController(100, "https://example.test");
    controller.enable();
    expect(document.querySelector("p")!.textContent).toBe("собака-хуяка");
    expect(document.querySelector("a")!.textContent).toBe("привет-хуевет");
    expect(document.querySelector("a")!.getAttribute("href")).toBe("/собака");
    expect((document.querySelector("input") as HTMLInputElement).value).toBe("собака");
    expect(document.querySelector("textarea")!.textContent).toBe("собака");
    expect(document.querySelector("code")!.textContent).toBe("собака");
    expect(document.querySelector("pre")!.textContent).toBe("привет");
    expect(document.querySelector("[contenteditable]")!.textContent).toBe("собака");
    controller.disable();
  });

  it("is idempotent, observes dynamic content, restores safely", async () => {
    document.body.innerHTML = `<p>собака</p><section></section>`;
    const controller = new DomController(100, "https://example.test");
    controller.enable();
    const paragraph = document.querySelector("p")!;
    expect(paragraph.textContent).toBe("собака-хуяка");
    document.querySelector("section")!.innerHTML = "привет";
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.querySelector("section")!.textContent).toBe("привет-хуевет");
    paragraph.firstChild!.textContent = "изменение сайта";
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.disable();
    expect(paragraph.textContent).not.toBe("собака");
    expect(document.querySelector("section")!.textContent).toBe("привет");
  });
});
