import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const changeVolume = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const v = value[0];
    audio.volume = v;
    setVolume(v);
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const cycleSpeed = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2, 0.75];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    if (audioRef.current) audioRef.current.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2 space-y-1.5">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Progress */}
      <div className="space-y-0.5">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.5}
          onValueChange={seek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={togglePlay}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </Button>

        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={restart}>
          <RotateCcw className="h-3 w-3" />
        </Button>

        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] font-mono tabular-nums" onClick={cycleSpeed}>
          {playbackRate}x
        </Button>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMute}>
            {muted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.05}
            onValueChange={changeVolume}
            className="w-16 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
