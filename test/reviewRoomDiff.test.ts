import { expect, jest, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import * as model from "../website/javascripts/review-model.js";

class Element {
  set innerHTML(_html: string) {
    this.children = [new Element(), new Element()];
  }
  children: Element[] = [];
  textContent = "";
  className = "";
  hidden = false;
  disabled = false;
  value = "";
  classList = { add: jest.fn(), remove: jest.fn() };
  listeners = new Map<string, () => void>();
  append(...children: Element[]) {
    this.children.push(...children);
  }
  appendChild(child: Element) {
    this.append(child);
  }
  replaceChildren(...children: Element[]) {
    this.children = children;
  }
  addEventListener(event: string, listener: () => void) {
    this.listeners.set(event, listener);
  }
}

type Room = Record<string, unknown>;

async function renderComparison(baseline?: Room, candidate?: Room) {
  const source = await readFile(
    new URL("../website/javascripts/review.js", import.meta.url),
    "utf8",
  );
  const elements = new Map<string, Element>();
  const element = (selector: string) => {
    let result = elements.get(selector);
    if (!result) {
      result = new Element();
      elements.set(selector, result);
    }
    return result;
  };
  let selectRoom: ((event: { detail: { roomId: number } }) => void) | undefined;
  runInNewContext(
    source.replace(/^import .*;\n/u, "").replace("void loadChanges();", ""),
    {
      model,
      document: {
        querySelector: element,
        querySelectorAll: () => [],
        createElement: () => new Element(),
      },
      window: {
        CrowdmapReviewMap: {
          getRoomComparison: () => ({ baseline, candidate, changes: [] }),
        },
        addEventListener: (_event: string, listener: typeof selectRoom) => {
          selectRoom = listener;
        },
      },
    },
  );
  selectRoom?.({ detail: { roomId: 42 } });
  return element;
}

const newRoom = {
  name: "New room",
  area: 7,
  x: 10,
  y: 20,
  z: 0,
  exits: { north: 43 },
  userData: { source: "survey" },
};

function text(element: Element): string {
  return [element.textContent, ...element.children.map(text)].join(" ");
}

test("new rooms show added properties, exits and user data in expanded details", async () => {
  const element = await renderComparison(undefined, newRoom);
  expect(text(element("#room-diff-summary"))).toContain(
    "Added in the candidate map.",
  );
  expect(text(element("#room-diff-summary"))).toContain("— → New room");
  expect(text(element("#room-diff-details"))).toContain("— → 43");
  expect(text(element("#room-diff-details"))).toContain(
    "User data · source — → survey",
  );
  expect(element("#show-all-details").disabled).toBe(false);
  element("#show-all-details").listeners.get("click")?.();
  expect(element("#room-diff-details").hidden).toBe(false);
});

test("deleted rooms retain their previous properties in the comparison", async () => {
  const element = await renderComparison(newRoom);
  expect(text(element("#room-diff-summary"))).toContain(
    "Removed from the candidate map.",
  );
  expect(text(element("#room-diff-details"))).toContain("New room → —");
  expect(text(element("#room-diff-details"))).toContain("43 → —");
});

test("rooms absent from both maps are not described as additions", async () => {
  const element = await renderComparison();
  expect(text(element("#room-diff-summary"))).toContain(
    "Room is absent from both maps.",
  );
  expect(text(element("#room-diff-summary"))).not.toContain("Added");
  expect(element("#show-all-details").disabled).toBe(true);
});

test("existing rooms still compare their baseline and candidate values", async () => {
  const element = await renderComparison(
    { ...newRoom, name: "Old room" },
    newRoom,
  );
  expect(text(element("#room-diff-summary"))).toContain("Old room → New room");
  expect(text(element("#room-diff-summary"))).not.toContain("Added");
});
