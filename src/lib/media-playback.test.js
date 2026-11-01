import { expect, test } from "bun:test";
import { isVideoFile, playMediaPair } from "./media-playback";

test("camera video with missing MIME is recognized as video", () => {
  expect(isVideoFile({ name: "camera.MP4", type: "" })).toBe(true);
  expect(isVideoFile({ name: "camera.mov", type: "application/octet-stream" })).toBe(true);
  expect(isVideoFile({ name: "audio.mp3", type: "audio/mpeg" })).toBe(false);
});

test("both play calls run before either play promise resolves", async () => {
  const calls = [];
  let resolveAudio;
  const audio = { currentTime: 2, play: () => { calls.push("audio"); return new Promise((r) => { resolveAudio = r; }); }, pause() {} };
  const video = { currentTime: 0, muted: false, play: async () => { calls.push("video"); }, pause() {} };
  const pending = playMediaPair(audio, video);
  expect(calls).toEqual(["audio", "video"]);
  expect(video.currentTime).toBe(2);
  expect(video.muted).toBe(true);
  resolveAudio?.();
  await pending;
});

test("video playback failure also stops audio", async () => {
  const calls = [];
  const audio = { currentTime: 0, play: async () => {}, pause: () => calls.push("audio paused") };
  const video = { currentTime: 0, muted: false, play: async () => { throw new Error("unsupported video"); }, pause: () => calls.push("video paused") };
  await expect(playMediaPair(audio, video)).rejects.toThrow("unsupported video");
  expect(calls).toEqual(["audio paused", "video paused"]);
});