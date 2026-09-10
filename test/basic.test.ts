import { beforeEach, expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import request from "supertest";
import { app } from "../src/app.js";
import { setupChangeServiceMock } from "./setup/iocSetup.js";

beforeEach(() => {
  setupChangeServiceMock();
});

test("getChanges returns empty array when no changes", async () => {
  await request(app)
    .get("/change")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual([]);
    });
});

test("the version endpoint returns the baseline version when no changes", async () => {
  await request(app)
    .get("/map/version?timesSeen=0")
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual("466.AAAAAAAAAAA.0");
    });
});

test("the map endoint returns the baseline JSON map when no changes and JSONis requested", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=json")
    .expect(200)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect((res) => {
      expect(res.body).toMatchSnapshot();
    });
});

test("the map endoint returns the baseline binary map when no changes and binary is requested", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=binary")
    .expect(200)
    .expect("Content-Type", "application/octet-stream")
    .expect((res) => {
      expect(res.body).toBeDefined();
    });
});

test("the map endpoint returns the map version in the header", async () => {
  await request(app)
    .get("/map?timesSeen=0&format=json")
    .expect(200)
    .expect("X-Map-Version", "466.AAAAAAAAAAA.0");
});

test("GET /docs returns the Swagger UI", async () => {
  await request(app)
    .get("/docs/")
    .expect(200)
    .expect("Content-Type", "text/html; charset=utf-8");
});

test("GET /review.html returns the change review UI", async () => {
  await request(app)
    .get("/review.html")
    .expect(200)
    .expect("Content-Type", "text/html; charset=utf-8")
    .expect((res) => {
      expect(res.text).toContain("Review pending changes");
      expect(res.text).toContain("javascripts/review-model.js");
      expect(res.text).toContain("javascripts/review.js");
    });
});

test("GET / returns the current map explorer with a configurable report threshold", async () => {
  await request(app)
    .get("/")
    .expect(200)
    .expect("Content-Type", "text/html; charset=utf-8")
    .expect((res) => {
      expect(res.text).toContain("javascripts/map-explorer/index.min.css");
      expect(res.text).toContain("javascripts/map-explorer-config.js");
      expect(res.text).toContain("javascripts/map-explorer/index.min.js");
      expect(res.text).toContain('id="times-seen"');
    });
});

test("GET /javascripts/map-explorer-config.js configures the binary map source", async () => {
  await request(app)
    .get("/javascripts/map-explorer-config.js")
    .expect(200)
    .expect("Content-Type", /javascript/u)
    .expect((res) => {
      expect(res.text).toContain("map?format=binary&timesSeen=");
      expect(res.text).toContain("URLSearchParams");
    });
});

test("the explorer config reads the report threshold from the URL without browser storage", async () => {
  const source = await readFile(
    new URL("../website/javascripts/map-explorer-config.js", import.meta.url),
    "utf8",
  );
  const window: {
    MAP_CONFIG?: { mapUrl: string };
    location: { search: string };
  } = {
    location: { search: "?timesSeen=3" },
  };

  runInNewContext(source, {
    JSON,
    Number,
    document: { querySelector: () => null },
    encodeURIComponent,
    URLSearchParams,
    window,
  });
  expect(window.MAP_CONFIG?.mapUrl).toBe("map?format=binary&timesSeen=3");
});

test("the explorer config still initializes without a threshold control", async () => {
  const source = await readFile(
    new URL("../website/javascripts/map-explorer-config.js", import.meta.url),
    "utf8",
  );
  const window: {
    MAP_CONFIG?: { mapUrl: string };
    location: { search: string };
  } = {
    location: { search: "" },
  };

  expect(() => {
    runInNewContext(source, {
      JSON,
      Number,
      document: { querySelector: () => null },
      encodeURIComponent,
      URLSearchParams,
      window,
    });
  }).not.toThrow();
  expect(window.MAP_CONFIG?.mapUrl).toBe("map?format=binary&timesSeen=0");
});

test("the explorer config keeps an invalid threshold out of the URL", async () => {
  const source = await readFile(
    new URL("../website/javascripts/map-explorer-config.js", import.meta.url),
    "utf8",
  );
  let assigned: URL | undefined;
  let onChange: (() => void) | undefined;
  const input = {
    value: "",
    addEventListener(event: string, listener: () => void) {
      if (event === "change") onChange = listener;
    },
  };

  runInNewContext(source, {
    JSON,
    Number,
    document: { querySelector: () => input },
    encodeURIComponent,
    URL,
    URLSearchParams,
    window: {
      location: {
        search: "",
        href: "https://example.test/",
        assign: (url: URL) => (assigned = url),
      },
    },
  });

  input.value = "-1";
  expect(() => onChange?.()).not.toThrow();
  expect(input.value).toBe("0");
  expect(assigned).toBeUndefined();
});

test("the explorer config prevents threshold form submission and updates the URL", async () => {
  const source = await readFile(
    new URL("../website/javascripts/map-explorer-config.js", import.meta.url),
    "utf8",
  );
  let assigned: URL | undefined;
  let onSubmit: ((event: { preventDefault: () => void }) => void) | undefined;
  let prevented = false;
  const form = {
    addEventListener(
      event: string,
      listener: (event: { preventDefault: () => void }) => void,
    ) {
      if (event === "submit") onSubmit = listener;
    },
  };
  const input = {
    form,
    value: "",
    addEventListener: () => undefined,
  };

  runInNewContext(source, {
    JSON,
    Number,
    document: { querySelector: () => input },
    encodeURIComponent,
    URL,
    URLSearchParams,
    window: {
      location: {
        search: "",
        href: "https://example.test/",
        assign: (url: URL) => (assigned = url),
      },
    },
  });

  input.value = "3";
  onSubmit?.({ preventDefault: () => (prevented = true) });

  expect(prevented).toBe(true);
  expect(assigned?.searchParams.get("timesSeen")).toBe("3");
});

test("GET /javascripts/map-explorer/index.min.js serves the packaged explorer", async () => {
  await request(app)
    .get("/javascripts/map-explorer/index.min.js")
    .expect(200)
    .expect("Content-Type", /javascript/u)
    .expect("Cache-Control", /max-age=3600/u)
    .expect((res) => {
      expect(res.text).not.toHaveLength(0);
    });
});

test("GET /unknown-path returns 404 Not Found", async () => {
  await request(app)
    .get("/unknown-path")
    .expect(404)
    .expect("Content-Type", "application/json; charset=utf-8")
    .expect((res) => {
      expect(res.body).toEqual({
        message: "Not Found",
      });
    });
});
