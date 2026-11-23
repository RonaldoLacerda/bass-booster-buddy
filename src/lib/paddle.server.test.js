import { afterEach, describe, expect, test } from "bun:test";
import { findPaddlePriceId } from "./paddle.server";

process.env.PADDLE_LIVE_API_KEY = "test-key";
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const page = (data, next) => new Response(JSON.stringify({ data, meta: { pagination: { has_more: Boolean(next), next } } }));

describe("findPaddlePriceId", () => {
  test("matches by import_meta.external_id and sends the bearer key to the live API", async () => {
    let seen;
    globalThis.fetch = async (url, init) => { seen = { url, auth: init.headers.Authorization }; return page([{ id: "pri_1", import_meta: { external_id: "banda_monthly" } }]); };
    expect(await findPaddlePriceId("live", "banda_monthly")).toBe("pri_1");
    expect(seen.url.startsWith("https://api.paddle.com/prices")).toBe(true);
    expect(seen.auth).toBe("Bearer test-key");
  });
  test("follows pagination and returns null when absent", async () => {
    const calls = [];
    globalThis.fetch = async (url) => { calls.push(url); return calls.length === 1 ? page([{ id: "pri_a", import_meta: null }], "https://api.paddle.com/prices?after=pri_a") : page([]); };
    expect(await findPaddlePriceId("live", "estudio_monthly")).toBeNull();
    expect(calls.length).toBe(2);
  });
  test("throws when the API errors", async () => {
    globalThis.fetch = async () => new Response("no", { status: 401 });
    await expect(findPaddlePriceId("live", "x")).rejects.toThrow();
  });
});
