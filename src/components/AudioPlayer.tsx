/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sliders, Music } from 'lucide-react';

interface AudioPlayerProps {
  src: string | null;
  filename: string;
  version: 'A' | 'B';
  externalTime?: number;
  onTimeUpdate?: (time: number) => void;
}

export default function AudioPlayer({ src, filename, version, externalTime, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Synchronize with external time if provided (A/B sync feature)
  useEffect(() => {
    if (audioRef.current && externalTime !== undefined && Math.abs(audioRef.current.currentTime - externalTime) > 0.5) {
      audioRef.current.currentTime = externalTime;
    }
  }, [externalTime]);

  useEffect(() => {
    // Reset player states if src changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Playback error:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    audioRef.current.playbackRate = playbackRate;
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !src) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying && src) {
      audioRef.current.play().catch(err => console.log(err));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const versionColors = version === 'A' 
    ? { bg: 'bg-emerald-950/40 border-emerald-800/50', accent: 'text-emerald-400', fill: 'bg-emerald-500', range: 'accent-emerald-500' }
    : { bg: 'bg-sky-950/40 border-sky-800/50', accent: 'text-sky-400', fill: 'bg-sky-500', range: 'accent-sky-500' };

  return (
    <div id={`audio-player-${version}`} className={`p-4 rounded-xl border ${versionColors.bg} transition-all duration-300`}>
      <audio
        ref={audioRef}
        src={src || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-2 rounded-lg bg-black/40 ${versionColors.accent}`}>
            <Music className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${version === 'A' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
                النسخة {version}
              </span>
              <span className="text-gray-400 text-xs font-mono">
                {filename.includes('.') ? filename.split('.').pop()!.toUpperCase() : "MP3"}
              </span>
            </div>
            <p className="text-sm font-medium text-white truncate mt-1 text-right dir-rtl font-sans" title={filename}>
              {filename}
            </p>
          </div>
        </div>
      </div>

      {!src ? (
        <div className="h-24 flex items-center justify-center border border-dashed border-gray-700/60 rounded-lg bg-black/20">
          <p className="text-xs text-gray-500 text-center font-sans">
            الملف الصوتي لهذه النسخة غير محمل.<br />
            اسحب الملف أو اختره من الأعلى للتفعيل.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Progress Bar */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className={`w-full h-1.5 rounded-lg bg-gray-800 cursor-pointer appearance-none ${versionColors.range}`}
              id={`seekbar-${version}`}
            />
            <div className="flex justify-between items-center text-xs font-mono text-gray-500">
              <span>{formatTime(duration)}</span>
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 p-2.5 rounded-lg">
            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-2">
              <button
                id={`btn-play-pause-${version}`}
                onClick={togglePlay}
                className={`p-2.5 rounded-full ${isPlaying ? 'bg-gray-100 text-black' : version === 'A' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-sky-500 text-black hover:bg-sky-400'} transition-all`}
                title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                id={`btn-reset-${version}`}
                onClick={restartAudio}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="إعادة للبداية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Playback Speed Controls */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 font-sans mr-1 flex items-center gap-0.5">
                <Sliders className="w-3 h-3 text-gray-500" /> السرعة:
              </span>
              {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  id={`btn-speed-${version}-${rate}`}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                    playbackRate === rate 
                      ? version === 'A' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-sky-500/20 text-sky-400 font-bold'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 min-w-[80px]">
              <button
                id={`btn-mute-${version}`}
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-all"
                title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                id={`volume-slider-${version}`}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={`w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer ${versionColors.range}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}