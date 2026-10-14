import { describe, expect, test } from "bun:test";
import { isSitemapRouteIncluded, sitemapXML } from "./sitemap.ts";

describe("sitemap visibility", () => {
  test("authenticated descendants cannot override the private subtree exclusion", () => {
    const root = { isRoot: true, options: { staticData: { sitemap: false } } };
    const privateLayout = { options: { staticData: { sitemap: "exclude-subtree" } }, parentRoute: root };
    const studio = { options: { staticData: { sitemap: true } }, parentRoute: privateLayout };
    expect(isSitemapRouteIncluded(studio)).toBe(false);
  });

  test("the root layout does not exclude a public child", () => {
    const root = { isRoot: true, options: { staticData: { sitemap: false } } };
    expect(isSitemapRouteIncluded({ options: { staticData: { sitemap: true } }, parentRoute: root })).toBe(true);
  });

  test("does not invent modification dates for static pages", () => {
    const xml = sitemapXML("https://audiomix.app", [{ path: "/" }, { path: "/auth" }]);
    expect(xml).toContain("<loc>https://audiomix.app/</loc>");
    expect(xml).not.toContain("<lastmod>");
  });
});