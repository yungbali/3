'use client';

import { useEffect, useRef, useState } from 'react';

const VIDEO_SRC = 'https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/manifest/video.m3u8';
const POSTER_SRC = 'https://customer-cbeadsgr09pnsezs.cloudflarestream.com/257c7359efd4b4aaebcc03aa8fc78a36/thumbnails/thumbnail.jpg';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC;
      video.addEventListener('loadeddata', () => setIsVideoLoaded(true));
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(VIDEO_SRC);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          video.addEventListener('loadeddata', () => setIsVideoLoaded(true));
        }
      });
    }

    return () => {
      video.removeEventListener('loadeddata', () => setIsVideoLoaded(true));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Heavy overlay for contrast */}
      <div className="absolute inset-0 bg-[#050507]/90 z-10" />
      
      {/* Poster fallback */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${POSTER_SRC})`,
          opacity: isVideoLoaded ? 0 : 0.4
        }}
      />
      
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-40"
        style={{ opacity: isVideoLoaded ? 0.4 : 0, transition: 'opacity 1s ease' }}
      />
      
      {/* Gradient Mesh for atmosphere */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#7b39fc]/10 to-transparent z-10 pointer-events-none" />
    </div>
  );
}
