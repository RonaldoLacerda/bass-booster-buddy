import { expect, test } from "bun:test";
import { isVideoFile, playMediaPair } from "./media-playback";

test("camera video with missing MIME is recognized as video", () => {
  expect(isVideoFile({ name: "camera.MP4", type: "" })).toBe(true);
  expect(isVideoFile({ name: "camera.mov", type: "application/octet-stream" })).toBe(true);
  expect(isVideoFile({ name: "audio.mp3", type: "audio/mpeg" })).toBe(false);
});

test("both play calls run before either play promise resolves", async () => {
  const calls: string[] = [];
  let resolveAudio: (() => void) | undefined;
  const audio = { currentTime: 2, play: () => { calls.push("audio"); return new Promise<void>((r) => { resolveAudio = r; }); }, pause() {} };
  const video = { currentTime: 0, muted: false, play: async () => { calls.push("video"); }, pause() {} };
  const pending = playMediaPair(audio as HTMLAudioElement, video as HTMLVideoElement);
  expect(calls).toEqual(["audio", "video"]);
  expect(video.currentTime).toBe(2);
  expect(video.muted).toBe(true);
  resolveAudio?.();
  await pending;
});