import { useState } from "react";
import { Download, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPORT_PRESETS, encodeExport, formatBytes, type ExportPresetId } from "@/lib/mastering";
import { downloadBlob, exportVideoWithAudio } from "@/lib/video-export";

type Props = {
  buffer: AudioBuffer;
  baseName: string;
  originalVideoUrl?: string | undefined;
  disabled?: boolean;
};

export function ExportCard({ buffer, baseName, originalVideoUrl, disabled = false }: Props) {
  const [selected, setSelected] = useState<ExportPresetId>("hifi");
  const [busy, setBusy] = useState(false);
  const [lastSize, setLastSize] = useState<number | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleExport = async () => {
    if (busy || videoBusy || disabled) return;
    const preset = EXPORT_PRESETS.find((p) => p.id === selected);
    if (!preset) return;
    setBusy(true);
    setVideoError(null);
    try {
      const blob = await encodeExport(buffer, preset);
      setLastSize(blob.size);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}-${preset.id}.${preset.format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setVideoError("Não foi possível gerar o áudio. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handleVideoExport = async () => {
    if (!originalVideoUrl || busy || videoBusy || disabled) return;
    setVideoBusy(true);
    setVideoError(null);
    setVideoProgress(0);
    try {
      const blob = await exportVideoWithAudio(originalVideoUrl, buffer, setVideoProgress);
      setLastSize(blob.size);
      downloadBlob(blob, `${baseName}-melhorado.webm`);
    } catch {
      setVideoError("Este navegador não conseguiu gerar o vídeo. Tente usar Chrome ou Edge atualizado.");
    } finally {
      setVideoBusy(false);
    }
  };

  return (
    <section className="panel p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        📤 Baixar resultado
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {EXPORT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selected === p.id ? "border-accent bg-accent/10" : "border-border bg-[var(--surface-sunken)]"
            }`}
          >
            <span className="text-lg">{p.emoji}</span>
            <p className="mt-1 text-sm font-semibold">{p.name}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{p.detail}</p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button size="lg" className="w-full sm:w-auto" onClick={handleExport} disabled={busy || videoBusy || disabled}>
          <Download className="mr-2 h-4 w-4" />
          {busy ? "Gerando arquivo..." : "Baixar áudio melhorado"}
        </Button>
        {lastSize !== null && (
          <span className="text-xs text-muted-foreground">Último arquivo: {formatBytes(lastSize)}</span>
        )}
      </div>

      {originalVideoUrl && (
        <div className="mt-4 border-t border-border/60 pt-4">
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleVideoExport}
            disabled={videoBusy || busy || disabled}
          >
            <Film className="mr-2 h-4 w-4" />
            {videoBusy ? `Gerando vídeo... ${Math.round(videoProgress)}%` : "Baixar vídeo com áudio melhorado"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            A imagem original será mantida e o vídeo será salvo em WebM. A geração acompanha a duração do vídeo.
          </p>
        </div>
      )}
      {videoError && <p role="alert" className="mt-2 text-xs text-destructive">{videoError}</p>}

    </section>
  );
}
