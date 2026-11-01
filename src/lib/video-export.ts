export type VideoExportProgress = (value: number) => void;

type CaptureVideoElement = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

function pickVideoMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

/** Preserva a imagem do vídeo e troca sua trilha pelo áudio processado, sem upload. */
export async function exportVideoWithAudio(
  videoUrl: string,
  audio: AudioBuffer,
  onProgress?: VideoExportProgress,
): Promise<Blob> {
  const mimeType = pickVideoMime();
  if (!mimeType) throw new Error("VIDEO_EXPORT_UNSUPPORTED");

  const video = document.createElement("video") as CaptureVideoElement;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  let context: AudioContext | undefined;
  let source: AudioBufferSourceNode | undefined;
  let captured: MediaStream | undefined;
  let destination: MediaStreamAudioDestinationNode | undefined;
  let recorder: MediaRecorder | undefined;
  let frame = 0;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    window.cancelAnimationFrame(frame);
    if (watchdog) clearTimeout(watchdog);
    video.onended = null;
    video.onerror = null;
    video.pause();
    if (recorder) {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.ondataavailable = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    try { source?.stop(); } catch { /* already stopped */ }
    source?.disconnect();
    const tracks = new Set([...(captured?.getTracks() ?? []), ...(destination?.stream.getTracks() ?? [])]);
    tracks.forEach((track) => track.stop());
    if (context && context.state !== "closed") await context.close().catch(() => undefined);
    video.removeAttribute("src");
    video.load();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("VIDEO_READ_TIMEOUT")), 15000);
      const finish = (error?: Error) => {
        window.clearTimeout(timeout);
        video.onloadeddata = null;
        video.onerror = null;
        if (error) reject(error); else resolve();
      };
      video.onloadeddata = () => finish();
      video.onerror = () => finish(new Error("VIDEO_READ_ERROR"));
      video.src = videoUrl;
      video.load();
    });
    const capture = video.captureStream ?? video.mozCaptureStream;
    if (!capture) throw new Error("VIDEO_EXPORT_UNSUPPORTED");
    context = new AudioContext({ sampleRate: audio.sampleRate });
    await context.resume();
    destination = context.createMediaStreamDestination();
    source = context.createBufferSource();
    source.buffer = audio;
    source.connect(destination);
    // Wait for real playback before starting the recording clock. The audio
    // offset follows the media clock, including any asynchronous play delay.
    await video.play();
    captured = capture.call(video);
    const videoTrack = captured.getVideoTracks()[0];
    const audioTrack = destination.stream.getAudioTracks()[0];
    if (!videoTrack || !audioTrack) throw new Error("VIDEO_TRACK_ERROR");
    recorder = new MediaRecorder(new MediaStream([videoTrack, audioTrack]), {
      mimeType, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 192_000,
    });
    const activeRecorder = recorder;
    const audioSource = source;
    const stopAt = Math.min(video.duration || audio.duration, audio.duration);
    const chunks: Blob[] = [];
    return await new Promise<Blob>((resolve, reject) => {
      let settled = false;
      const finish = async (error?: Error) => {
        if (settled) return;
        settled = true;
        const blob = new Blob(chunks, { type: mimeType });
        await cleanup();
        if (error) reject(error);
        else if (!blob.size) reject(new Error("VIDEO_EMPTY"));
        else { onProgress?.(100); resolve(blob); }
      };
      const stop = () => {
        if (activeRecorder.state !== "inactive") activeRecorder.stop();
      };
      const progress = () => {
        if (settled) return;
        onProgress?.(Math.min(99, video.currentTime / stopAt * 100));
        if (video.currentTime >= stopAt) { stop(); return; }
        frame = window.requestAnimationFrame(progress);
      };
      activeRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      activeRecorder.onerror = () => { void finish(new Error("VIDEO_RECORD_ERROR")); };
      activeRecorder.onstop = () => { void finish(); };
      video.onended = stop;
      video.onerror = () => { void finish(new Error("VIDEO_READ_ERROR")); };
      watchdog = setTimeout(() => { void finish(new Error("VIDEO_EXPORT_TIMEOUT")); }, (stopAt + 30) * 1000);
      try {
        activeRecorder.start(250);
        audioSource.start(0, Math.min(video.currentTime, Math.max(0, audio.duration - 0.001)));
        progress();
      } catch {
        void finish(new Error("VIDEO_START_ERROR"));
      }
    });
  } finally {
    await cleanup();
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}