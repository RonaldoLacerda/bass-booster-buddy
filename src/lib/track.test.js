import { describe, expect, test } from "bun:test";
import { durationBucket, sizeBucket, track, analyticsHead } from "./track";

describe("analytics privacy helpers", () => {
  test("size buckets", () => {
    expect(sizeBucket(5 * 1024 * 1024)).toBe("lt10mb");
    expect(sizeBucket(30 * 1024 * 1024)).toBe("10to50mb");
    expect(sizeBucket(100 * 1024 * 1024)).toBe("50to200mb");
    expect(sizeBucket(500 * 1024 * 1024)).toBe("gt200mb");
  });
  test("duration buckets", () => {
    expect(durationBucket(30)).toBe("lt1min");
    expect(durationBucket(120)).toBe("1to5min");
    expect(durationBucket(600)).toBe("5to20min");
    expect(durationBucket(3600)).toBe("gt20min");
  });
  test("is a no-op and loads no script when not configured", () => {
    expect(() => track("signup_submit")).not.toThrow();
    expect(analyticsHead().scripts).toEqual([]);
  });
});
