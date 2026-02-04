'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Podcast, Download, Volume2, VolumeX } from 'lucide-react';
import Visualizer from './Visualizer';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

export default function AudioPlayer({ audioUrl, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `kotomo-${title?.replace(/\s+/g, '-').toLowerCase() || 'podcast'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="linear-card rounded-xl overflow-hidden relative">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 noise-bg z-0 pointer-events-none" />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#7b39fc]/20 rounded-lg border border-[#7b39fc]/30 flex items-center justify-center text-[#7b39fc]">
              <Podcast className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white tracking-tight">
                {title || 'Untitled Episode'}
              </h3>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Generated • {Math.ceil(duration / 60) || 0} min
              </p>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-mono uppercase tracking-wider">
            Ready
          </div>
        </div>

        {/* Visualizer */}
        <Visualizer isPlaying={isPlaying} />

        {/* Progress */}
        <div className="space-y-2">
          <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#7b39fc] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#a1a1aa]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          {/* Volume */}
          <button
            onClick={() => {
              const audio = audioRef.current;
              if (audio) {
                const newVol = volume > 0 ? 0 : 1;
                audio.volume = newVol;
                setVolume(newVol);
              }
            }}
            className="text-[#a1a1aa] hover:text-white transition-colors p-2"
          >
            {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* Main controls */}
          <div className="flex justify-center items-center gap-6">
            <button className="text-[#a1a1aa] hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>
            <button className="text-[#a1a1aa] hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          {/* Download */}
          <button
            onClick={handleDownload}
            className="text-[#a1a1aa] hover:text-white transition-colors p-2"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
