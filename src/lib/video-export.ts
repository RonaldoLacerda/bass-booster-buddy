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
  video.src = videoUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("VIDEO_READ_ERROR"));
  });

  const capture = video.captureStream ?? video.mozCaptureStream;
  if (!capture) throw new Error("VIDEO_EXPORT_UNSUPPORTED");

  const context = new AudioContext({ sampleRate: audio.sampleRate });
  const destination = context.createMediaStreamDestination();
  const source = context.createBufferSource();
  source.buffer = audio;
  source.connect(destination);

  const videoStream = capture.call(video);
  const videoTrack = videoStream.getVideoTracks()[0];
  const audioTrack = destination.stream.getAudioTracks()[0];
  if (!videoTrack || !audioTrack) {
    videoStream.getTracks().forEach((track) => track.stop());
    await context.close();
    throw new Error("VIDEO_TRACK_ERROR");
  }

  const output = new MediaStream([videoTrack, audioTrack]);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(output, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
    audioBitsPerSecond: 192_000,
  });

  return new Promise<Blob>((resolve, reject) => {
    let frame = 0;
    const cleanUp = async () => {
      window.cancelAnimationFrame(frame);
      video.pause();
      output.getTracks().forEach((track) => track.stop());
      videoStream.getTracks().forEach((track) => track.stop());
      await context.close();
      video.removeAttribute("src");
      video.load();
    };
    const updateProgress = () => {
      const duration = Math.min(video.duration || audio.duration, audio.duration);
      onProgress?.(duration > 0 ? Math.min(99, (video.currentTime / duration) * 100) : 0);
      frame = window.requestAnimationFrame(updateProgress);
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      void cleanUp();
      reject(new Error("VIDEO_RECORD_ERROR"));
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      onProgress?.(100);
      void cleanUp().then(() => resolve(blob));
    };

    void (async () => {
      try {
        await context.resume();
        recorder.start(1000);
        source.start(0);
        await video.play();
        updateProgress();
        const stopAt = Math.min(video.duration || audio.duration, audio.duration);
        window.setTimeout(() => {
          if (recorder.state !== "inactive") recorder.stop();
        }, Math.max(0, stopAt * 1000));
      } catch {
        if (recorder.state !== "inactive") recorder.stop();
        reject(new Error("VIDEO_START_ERROR"));
      }
    })();
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}