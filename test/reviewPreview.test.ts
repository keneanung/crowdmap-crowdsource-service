import { expect, jest, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import * as model from "../website/javascripts/review-model.js";

class Element {
  children: Element[] = [];
  textContent = "";
  className = "";
  hidden = false;
  disabled = false;
  checked = false;
  value = "";
  dataset: Record<string, string> = {};
  classList = { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() };
  listeners = new Map<string, (event?: unknown) => unknown>();
  append(...children: Element[]) {
    this.children.push(...children);
  }
  appendChild(child: Element) {
    this.append(child);
  }
  add(child: Element) {
    this.append(child);
  }
  replaceChildren(...children: Element[]) {
    this.children = children;
  }
  setAttribute = jest.fn();
  querySelectorAll() {
    return [];
  }
  addEventListener(event: string, listener: (event?: unknown) => unknown) {
    this.listeners.set(event, listener);
  }
  async click() {
    await this.listeners.get("click")?.({ stopPropagation: jest.fn() });
  }
}

const reports = [
  {
    changeId: "a",
    type: "room-name",
    roomNumber: 1,
    name: "First",
    reporters: 1,
  },
  {
    changeId: "b",
    type: "room-name",
    roomNumber: 2,
    name: "Second",
    reporters: 1,
  },
];

async function review() {
  const source = await readFile(
    new URL("../website/javascripts/review.js", import.meta.url),
    "utf8",
  );
  const elements = new Map<string, Element>();
  const element = (selector: string) => {
    const existing = elements.get(selector);
    if (existing) return existing;
    const created = new Element();
    elements.set(selector, created);
    return created;
  };
  const show = jest
    .fn<(...args: unknown[]) => Promise<void>>()
    .mockResolvedValue();
  const focus = jest.fn();
  const fetch = jest
    .fn<(url: string) => Promise<unknown>>()
    .mockImplementation((url) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => "v1" },
        json: () =>
          Promise.resolve(
            url.startsWith("change/review-upstream")
              ? { id: "review", upstreamVersion: "v2", reconciliation: [] }
              : reports.map((report) => ({ ...report })),
          ),
      }),
    );
  runInNewContext(
    source.replace(/^import .*;\n/u, "").replace("void loadChanges();", ""),
    {
      model,
      document: {
        querySelector: element,
        querySelectorAll: () => [],
        createElement: () => new Element(),
      },
      Option: Element,
      window: {
        CrowdmapReviewMap: { show, focus },
        addEventListener: jest.fn(),
        clearTimeout: jest.fn(),
        setTimeout: jest.fn(),
      },
      fetch,
    },
  );
  await element("#refresh").click();
  return { element, show, focus, fetch };
}

function card(element: (selector: string) => Element, id: string) {
  const result = element("#change-list").children.find(
    (item) => item.dataset.changeId === id,
  );
  if (!result) throw new Error("Missing report card: " + id);
  return result;
}

test("initial preview includes all reports and clicking reports only focuses the loaded map", async () => {
  const { element, show, focus, fetch } = await review();
  expect(show.mock.calls[0][0]).toEqual(["a", "b"]);
  expect(element("#preview-title").textContent).toBe("All pending reports");
  await card(element, "b").children[1].click();
  await card(element, "a").children[1].click();
  expect(focus.mock.calls).toEqual([[2], [1]]);
  expect(show).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("checkboxes do not reload maps; explicit subset and all previews control included reports", async () => {
  const { element, show } = await review();
  const checkbox = card(element, "a").children[0];
  checkbox.checked = true;
  await checkbox.click();
  expect(show).toHaveBeenCalledTimes(1);
  await element("#show-selected").click();
  expect(show.mock.calls[1][0]).toEqual(["a"]);
  await card(element, "b").children[1].click();
  expect(show).toHaveBeenCalledTimes(2);
  expect(element("#preview-title").textContent).toBe("Selected reports");
  await element("#show-all").click();
  expect(show.mock.calls[2][0]).toEqual(["a", "b"]);
  expect(element("#selected-count").textContent).toBe("1");
});

test("focusing a staged report retains the reviewed selection and apply eligibility", async () => {
  const { element, show } = await review();
  element("#api-key").value = "admin-key";
  await element("#stage-upstream").click();
  expect(element("#show-all").disabled).toBe(true);
  const checkbox = card(element, "a").children[0];
  checkbox.checked = true;
  await checkbox.click();
  expect(element("#apply-update").disabled).toBe(true);
  await element("#show-selected").click();
  expect(show.mock.calls[2][0]).toEqual(["a"]);
  expect(show.mock.calls[2][3]).toBe("review");
  expect(element("#apply-update").disabled).toBe(false);
  await card(element, "b").children[1].click();
  expect(show).toHaveBeenCalledTimes(3);
  expect(element("#apply-update").disabled).toBe(false);
});
