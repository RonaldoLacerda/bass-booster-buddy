export type VideoExportProgress = (value: number) => void;

/** Copy the encoded picture; never screen-record/recompress the source video. */
export async function exportVideoWithAudio(
  videoUrl: string,
  audio: AudioBuffer,
  onProgress?: VideoExportProgress,
): Promise<Blob> {
  const {
    Input, ALL_FORMATS, BlobSource, Output, BufferTarget, WebMOutputFormat,
    Mp4OutputFormat, EncodedPacketSink, EncodedVideoPacketSource,
    AudioBufferSource, canEncodeAudio,
  } = await import("mediabunny");
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error("VIDEO_READ_ERROR");
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(await response.blob()) });
  let output: InstanceType<typeof Output> | undefined;
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error("VIDEO_TRACK_ERROR");
    const codec = await track.getCodec();
    const config = await track.getDecoderConfig();
    if (!codec || !config) throw new Error("VIDEO_EXPORT_UNSUPPORTED");
    const rotation = await track.getRotation();
    const flip = await track.getFlip();
    const format = ["vp8", "vp9", "av1"].includes(codec) && rotation === 0 && !flip
      ? new WebMOutputFormat() : new Mp4OutputFormat();
    if (!format.getSupportedVideoCodecs().includes(codec)) throw new Error("VIDEO_EXPORT_UNSUPPORTED");
    // AAC has broad MP4 playback support; Opus is a browser-compatible fallback.
    const options = { numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate, bitrate: 320_000 };
    const audioCodec = format instanceof Mp4OutputFormat && await canEncodeAudio("aac", options) ? "aac" : "opus";
    if (!(await canEncodeAudio(audioCodec, options))) throw new Error("VIDEO_AUDIO_UNSUPPORTED");
    const target = new BufferTarget();
    output = new Output({ format, target });
    const videoSource = new EncodedVideoPacketSource(codec);
    const audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: 320_000 });
    output.addVideoTrack(videoSource, { decoderConfig: config, transformationMatrix: await track.getTransformationMatrix() });
    output.addAudioTrack(audioSource);
    await output.start();
    const duration = await track.computeDuration();
    onProgress?.(0);
    // Feed both tracks concurrently to keep the muxer's interleaving buffer bounded.
    await Promise.all([
      (async () => {
        const sink = new EncodedPacketSink(track);
        for await (const packet of sink.packets()) {
          await videoSource.add(packet, { decoderConfig: config });
          onProgress?.(Math.min(95, Math.max(0, packet.timestamp / duration * 95)));
        }
        videoSource.close();
      })(),
      (async () => { await audioSource.add(audio); audioSource.close(); })(),
    ]);
    await output.finalize();
    if (!target.buffer) throw new Error("VIDEO_EMPTY");
    onProgress?.(100);
    return new Blob([target.buffer], { type: format.mimeType });
  } catch (error) {
    await output?.cancel().catch(() => undefined);
    throw error;
  } finally {
    input.dispose();
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