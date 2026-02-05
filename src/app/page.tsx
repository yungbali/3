'use client';

import { useState } from 'react';
import { AudioWaveform, LogIn, Users, SlidersHorizontal, CloudUpload } from 'lucide-react';
import TopicForm from '@/components/TopicForm';
import GenerationStatus from '@/components/GenerationStatus';
import AudioPlayer from '@/components/AudioPlayer';
import VideoBackground from '@/components/VideoBackground';
import Visualizer from '@/components/Visualizer';

type AppState = 'idle' | 'generating' | 'complete' | 'error';

// Progress state for real-time updates
interface GenerationProgress {
  step: string;
  message: string;
  // Validation
  cleanedTopic?: string;
  // Research
  keyPointsCount?: number;
  factsCount?: number;
  // Script
  title?: string;
  speakers?: Array<{ name: string; personality: string }>;
  lineCount?: number;
  // Audio generation
  currentLine?: number;
  totalLines?: number;
  currentSpeaker?: string;
  currentEmotion?: string;
  // Model info
  model?: string;
  provider?: string;
}

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [progress, setProgress] = useState<GenerationProgress>({ step: '', message: '' });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [podcastTitle, setPodcastTitle] = useState<string>('');
  const [scriptInfo, setScriptInfo] = useState<{
    title: string;
    speakers: Array<{ name: string; personality: string }>;
    lineCount: number;
  } | null>(null);

  const handleGenerate = async (data: { topic: string; tone: string; duration: string }) => {
    setState('generating');
    setProgress({ step: 'started', message: 'Starting podcast generation...' });
    setError(null);
    setAudioUrl(null);
    setPodcastTitle(data.topic);
    setScriptInfo(null);

    try {
      // Use relative URL - API is now on the same origin
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to generation service');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const eventData = JSON.parse(line.slice(6));
              handleSSEEvent(currentEvent, eventData);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            currentEvent = '';
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  };

  const handleSSEEvent = (event: string, data: Record<string, unknown>) => {
    switch (event) {
      case 'status':
        setProgress({
          step: data.step as string,
          message: data.message as string,
          model: data.model as string | undefined,
          provider: data.provider as string | undefined,
          totalLines: data.totalLines as number | undefined,
        });
        break;

      case 'validated':
        setProgress(prev => ({
          ...prev,
          step: 'validated',
          message: data.message as string,
          cleanedTopic: data.cleanedTopic as string,
        }));
        if (data.cleanedTopic) {
          setPodcastTitle(data.cleanedTopic as string);
        }
        break;

      case 'researched':
        setProgress(prev => ({
          ...prev,
          step: 'researched',
          message: data.message as string,
          keyPointsCount: data.keyPointsCount as number,
          factsCount: data.factsCount as number,
        }));
        break;

      case 'scripted':
        const speakers = data.speakers as Array<{ name: string; personality: string }>;
        setProgress(prev => ({
          ...prev,
          step: 'scripted',
          message: data.message as string,
          title: data.title as string,
          speakers,
          lineCount: data.lineCount as number,
        }));
        setScriptInfo({
          title: data.title as string,
          speakers,
          lineCount: data.lineCount as number,
        });
        setPodcastTitle(data.title as string);
        break;

      case 'audio_progress':
        setProgress(prev => ({
          ...prev,
          step: 'generating_audio',
          message: data.message as string,
          currentLine: data.current as number,
          totalLines: data.total as number,
          currentSpeaker: data.speaker as string,
          currentEmotion: data.emotion as string,
        }));
        break;

      case 'audio_complete':
        setProgress(prev => ({
          ...prev,
          step: 'audio_complete',
          message: data.message as string,
        }));
        break;

      case 'complete':
        // Use direct URL if available (Vercel Blob), otherwise convert base64
        let url: string;
        if (data.audioUrl) {
          // Direct CDN URL from Vercel Blob
          url = data.audioUrl as string;
        } else if (data.audioBase64) {
          // Fallback: Convert base64 to blob URL
          const base64 = data.audioBase64 as string;
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
          url = URL.createObjectURL(audioBlob);
        } else {
          setError('No audio data received');
          setState('error');
          break;
        }
        
        setAudioUrl(url);
        setPodcastTitle(data.title as string || podcastTitle);
        setProgress({ step: 'complete', message: 'Podcast generation complete!' });
        setState('complete');
        break;

      case 'error':
        setError(data.message as string || data.error as string || 'Generation failed');
        setState('error');
        break;
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setState('idle');
    setProgress({ step: '', message: '' });
    setAudioUrl(null);
    setError(null);
    setPodcastTitle('');
    setScriptInfo(null);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <VideoBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050507]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#06b6d4] flex items-center justify-center text-white">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white font-mono">KOTOMO</span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[#a1a1aa]">
            <a href="#" className="hover:text-white transition-colors">Episodes</a>
            <a href="#" className="hover:text-white transition-colors">Voices</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden md:flex items-center gap-2 text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors">
              <LogIn className="w-4 h-4" />
              Sign In
            </a>
            <a href="#" className="text-xs font-medium bg-white/10 text-white px-3 py-1.5 rounded border border-white/10 hover:bg-white/15 transition-all">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {(state === 'idle' || state === 'generating') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Left Column: Input */}
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                    <span className="text-[10px] font-mono text-[#a1a1aa] tracking-tight uppercase">
                      System v1.0 Operational
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-white leading-[1.1]">
                    Turn raw ideas into <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a1a1aa]">
                      studio podcasts.
                    </span>
                  </h1>
                  <p className="text-lg text-[#a1a1aa] font-light max-w-md leading-relaxed">
                    Generate immersive audio episodes from a single topic. Powered by multi-agent AI synthesis.
                  </p>
                </div>

                <TopicForm onSubmit={handleGenerate} isLoading={state === 'generating'} />
              </div>

              {/* Right Column: Interface Simulation */}
              <div className="space-y-6">
                {state === 'generating' ? (
                  <>
                    {/* Active Generation Card */}
                    <div className="linear-card rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 noise-bg z-0 pointer-events-none" />
                      <div className="relative z-10 p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#06b6d4]/20 rounded-lg border border-[#06b6d4]/30 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-white tracking-tight">
                                {scriptInfo?.title || podcastTitle || 'Generating...'}
                              </h3>
                              <p className="text-xs text-[#a1a1aa] mt-0.5">
                                {progress.model ? `Using ${progress.model}` : 'Processing your request'}
                              </p>
                            </div>
                          </div>
                          <div className="px-2 py-1 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4] text-[10px] font-mono uppercase tracking-wider">
                            {progress.step === 'generating_audio' && progress.currentLine 
                              ? `${progress.currentLine}/${progress.totalLines}`
                              : 'Processing'}
                          </div>
                        </div>
                        
                        {/* Show speakers if script is ready */}
                        {scriptInfo && (
                          <div className="flex gap-3">
                            {scriptInfo.speakers.map((speaker, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#06b6d4]' : 'bg-[#22c55e]'}`} />
                                <span className="text-xs text-[#a1a1aa]">{speaker.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Visualizer isPlaying={progress.step === 'generating_audio'} />
                        
                        {/* Audio line progress */}
                        {progress.step === 'generating_audio' && progress.currentLine && progress.totalLines && (
                          <div className="space-y-2">
                            <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-[#06b6d4] transition-all duration-300"
                                style={{ width: `${(progress.currentLine / progress.totalLines) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-[#a1a1aa]">
                              <span>{progress.currentSpeaker} ({progress.currentEmotion})</span>
                              <span>{progress.currentLine}/{progress.totalLines} lines</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <GenerationStatus progress={progress} />
                  </>
                ) : (
                  <>
                    {/* Demo Audio Player Card */}
                    <div className="linear-card rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 noise-bg z-0 pointer-events-none" />
                      <div className="relative z-10 p-6 space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#06b6d4]/20 rounded-lg border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
                              <AudioWaveform className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-white tracking-tight">The Architecture of AI</h3>
                              <p className="text-xs text-[#a1a1aa] mt-0.5">Episode #042 • Generated 2m ago</p>
                            </div>
                          </div>
                          <div className="px-2 py-1 rounded bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-mono uppercase tracking-wider">
                            Ready
                          </div>
                        </div>
                        <Visualizer isPlaying={true} />
                        <div className="space-y-2">
                          <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 h-full w-[35%] bg-[#06b6d4]" />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-[#a1a1aa]">
                            <span>04:12</span>
                            <span>12:05</span>
                          </div>
                        </div>
                        <div className="flex justify-center items-center gap-6">
                          <button className="text-[#a1a1aa] hover:text-white transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="19 20 9 12 19 4 19 20" />
                              <line x1="5" y1="19" x2="5" y2="5" />
                            </svg>
                          </button>
                          <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                          </button>
                          <button className="text-[#a1a1aa] hover:text-white transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="5 4 15 12 5 20 5 4" />
                              <line x1="19" y1="5" x2="19" y2="19" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Demo Generation Status */}
                    <div className="linear-card rounded-xl p-5 border-t border-white/5">
                      <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4 pl-1">
                        Generation Process
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span className="text-xs text-[#a1a1aa] line-through decoration-[#a1a1aa]/50">
                            Analyze Topic Semantics
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span className="text-xs text-[#a1a1aa] line-through decoration-[#a1a1aa]/50">
                            Generate Multi-Speaker Script
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative w-5 h-5 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border border-[#06b6d4] border-t-transparent animate-spin" />
                          </div>
                          <span className="text-xs font-medium text-white">
                            Synthesizing Audio (Neural Model)
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {state === 'complete' && audioUrl && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  <span className="text-[10px] font-mono text-[#22c55e] tracking-tight uppercase">
                    Generation Complete
                  </span>
                </div>
                <h2 className="text-3xl font-medium text-white">Your episode is ready</h2>
                <p className="text-[#a1a1aa]">Stream it now or download for offline listening.</p>
              </div>
              
              <AudioPlayer audioUrl={audioUrl} title={podcastTitle} />
              
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-[#a1a1aa] hover:text-white transition-colors"
                >
                  ← Create another episode
                </button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="max-w-md mx-auto">
              <div className="linear-card rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white">Generation Failed</h3>
                <p className="text-sm text-[#a1a1aa]">{error}</p>
                <button
                  onClick={handleReset}
                  className="btn-primary text-white text-xs font-medium px-6 py-2.5 rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Features Section - only show on idle */}
      {state === 'idle' && (
        <section className="relative z-10 py-24 border-t border-white/5 bg-[#050507]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <h2 className="text-2xl font-medium text-white tracking-tight mb-2">Technical Specifications</h2>
              <p className="text-[#a1a1aa] font-light">Built for developers and creators who demand precision.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="linear-card p-6 rounded-xl hover:translate-y-[-2px] transition-transform duration-300">
                <div className="w-10 h-10 rounded bg-[#0a0a0f] border border-white/10 flex items-center justify-center text-[#a1a1aa] mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">Multi-Agent Conversation</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Two distinct AI personas debate and discuss your topic with natural interruptions and pacing.
                </p>
              </div>

              <div className="linear-card p-6 rounded-xl hover:translate-y-[-2px] transition-transform duration-300">
                <div className="w-10 h-10 rounded bg-[#0a0a0f] border border-white/10 flex items-center justify-center text-[#a1a1aa] mb-4">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">Granular Control</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Adjust tone, duration, and complexity. Define speaker personalities via JSON configuration.
                </p>
              </div>

              <div className="linear-card p-6 rounded-xl hover:translate-y-[-2px] transition-transform duration-300">
                <div className="w-10 h-10 rounded bg-[#0a0a0f] border border-white/10 flex items-center justify-center text-[#a1a1aa] mb-4">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">Instant Publishing</h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Exports directly to RSS feeds compatible with Spotify and Apple Podcasts via our edge network.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050507] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#06b6d4] flex items-center justify-center text-white">
              <AudioWaveform className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-[#ededed] font-mono">KOTOMO</span>
          </div>
          
          <div className="flex gap-8 text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wide">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
            <a href="#" className="hover:text-white transition-colors">Legal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
