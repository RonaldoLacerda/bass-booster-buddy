/** Some devices provide an empty or generic MIME type for camera videos. */
export function isVideoFile(file: Pick<File, "name" | "type">): boolean {
  return file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm|ogv|mkv)$/i.test(file.name);
}

export async function playMediaPair(audio: HTMLAudioElement, video: HTMLVideoElement | null) {
  if (video) {
    video.muted = true;
    video.currentTime = audio.currentTime;
  }
  try {
    // Both play calls happen in the same user gesture (important on mobile).
    await Promise.all([audio.play(), video?.play()]);
  } catch (error) {
    audio.pause();
    video?.pause();
    throw error;
  }
}