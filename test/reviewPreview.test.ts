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
  querySelectorAll(selector: string): Element[] {
    return this.children.flatMap((child) => [
      ...(child.className.split(" ").includes(selector.slice(1))
        ? [child]
        : []),
      ...child.querySelectorAll(selector),
    ]);
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

async function review(reportList: model.ReviewChange[] = reports) {
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
  const focus = jest.fn<(_room: number) => boolean>().mockReturnValue(true);
  const fetch = jest
    .fn<(url: string, options?: { body?: string }) => Promise<unknown>>()
    .mockImplementation((url) =>
      Promise.resolve({
        ok: true,
        headers: { get: () => "v1" },
        json: () =>
          Promise.resolve(
            url.startsWith("change/review-upstream")
              ? { id: "review", upstreamVersion: "v2", reconciliation: [] }
              : reportList.map((report) => ({ ...report })),
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
        createTextNode: (text: string) =>
          Object.assign(new Element(), { textContent: text }),
      },
      Option: Element,
      window: {
        CrowdmapReviewMap: { show, focus },
        confirm: jest.fn(() => true),
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
  expect(show.mock.calls[0][0]).toEqual([]);
  expect(show.mock.calls[0][1]).toEqual(reports);
  expect(show.mock.calls[0][4]).toBe(true);
  expect(show.mock.calls[0][5]).toBe("v1");
  expect(element("#preview-title").textContent).toBe("All pending reports");
  await card(element, "b").children[1].click();
  await card(element, "a").children[1].click();
  expect(focus.mock.calls).toEqual([[2], [1]]);
  expect(show).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe("change?timesSeen=0");
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
  expect(show.mock.calls[2][0]).toEqual([]);
  expect(show.mock.calls[2][1]).toEqual(reports);
  expect(show.mock.calls[2][4]).toBe(true);
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

test("absent-room reports and room jumps explain the current preview without fetching maps", async () => {
  const { element, show, focus } = await review();
  await element("#show-baseline").click();
  focus.mockReturnValue(false);
  await card(element, "b").children[1].click();
  expect(element("#notice").textContent).toContain(
    "Room 2 is absent from this preview",
  );
  expect(element("#notice").textContent).toContain("Preview all reports");
  element("#report-focus").value = "2";
  element("#report-focus").listeners.get("change")?.();
  expect(focus).toHaveBeenCalledTimes(2);
  expect(show).toHaveBeenCalledTimes(2);
});

test("reports without room targets inspect their values without moving or reloading maps", async () => {
  const nonRoomReports = [
    {
      changeId: "area",
      type: "rename-area",
      areaId: 7,
      name: "New area name",
      reporters: 1,
    },
    {
      changeId: "label",
      type: "set-map-label",
      areaId: 7,
      labelId: 2,
      text: "New label",
      reporters: 1,
    },
    {
      changeId: "data",
      type: "set-map-user-data",
      key: "source",
      value: "survey",
      reporters: 1,
    },
  ];
  const { element, show, focus } = await review(nonRoomReports);
  for (const report of nonRoomReports) {
    const button = card(element, report.changeId).children[1];
    expect(button.setAttribute).toHaveBeenCalledWith(
      "aria-label",
      expect.stringMatching(/^Inspect /u),
    );
    await button.click();
    expect(element("#room-diff-summary").children[0].textContent).not.toContain(
      "undefined",
    );
    expect(element("#room-diff-title").textContent).toBe(
      model.typeLabel(report.type),
    );
    expect(element("#room-diff-summary").children[1].textContent).toContain(
      "no room target",
    );
    expect(element("#room-diff-details").hidden).toBe(false);
    expect(
      element("#room-diff-details")
        .children.map((row) => row.textContent)
        .join(" "),
    ).toContain(report.name ?? report.text ?? report.value);
  }
  expect(focus).not.toHaveBeenCalled();
  expect(show).toHaveBeenCalledTimes(1);
});

test("review deletes selected changes collectively and shows their support counts", async () => {
  const supported = [{ ...reports[0], reporters: 2 }, reports[1]];
  const { element, fetch } = await review(supported);
  const selected = card(element, "a");
  const badges = selected.children[1].children[0].children[2];
  expect(
    badges.children.some((badge) => badge.textContent === "2 reporters"),
  ).toBe(true);
  expect(
    selected.children.some((child) =>
      child.children[0]?.textContent.startsWith("Current observations"),
    ),
  ).toBe(false);
  element("#api-key").value = "admin-key";
  selected.children[0].checked = true;
  await selected.children[0].click();
  await element("#delete-selected").click();
  const submission = fetch.mock.calls.find(
    (call) => call[0] === "change/delete",
  );
  expect(JSON.parse(submission?.[1]?.body ?? "{}")).toEqual({
    changeIds: ["a"],
  });
  expect(
    fetch.mock.calls.some((call) => call[0] === "change/observations"),
  ).toBe(false);
});
