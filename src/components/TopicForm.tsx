'use client';

import { useState } from 'react';
import { Command, Mic, CheckCircle } from 'lucide-react';

interface TopicFormProps {
  onSubmit: (data: { topic: string; tone: string; duration: string }) => void;
  isLoading: boolean;
}

export default function TopicForm({ onSubmit, isLoading }: TopicFormProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;
    onSubmit({ topic: topic.trim(), tone: 'educational', duration: 'short' });
  };

  return (
    <div className="space-y-4 max-w-lg">
      {/* Input with gradient border */}
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          {/* Gradient glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#06b6d4] to-[#22c55e] rounded-lg opacity-30 group-hover:opacity-50 blur transition duration-500" />
          
          {/* Input container */}
          <div className="relative flex items-center bg-[#0a0a0f] border border-white/10 rounded-lg p-1.5">
            <div className="pl-3 pr-2 text-[#a1a1aa]">
              <Command className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., 'The Future of React Server Components')..."
              className="w-full bg-transparent border-none text-sm text-white placeholder-[#a1a1aa]/50 focus:ring-0 font-mono py-2.5 px-2 outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="btn-primary text-white text-xs font-medium px-5 py-2.5 rounded hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Feature badges */}
      <div className="flex items-center gap-4 text-xs text-[#a1a1aa]">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
          HD Audio 48kHz
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
          Multi-Speaker
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
          Auto-Mixed
        </span>
      </div>
    </div>
  );
}
