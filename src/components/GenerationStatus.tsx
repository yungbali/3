'use client';

import { Check } from 'lucide-react';

interface GenerationProgress {
  step: string;
  message: string;
  cleanedTopic?: string;
  keyPointsCount?: number;
  factsCount?: number;
  title?: string;
  speakers?: Array<{ name: string; personality: string }>;
  lineCount?: number;
  currentLine?: number;
  totalLines?: number;
  currentSpeaker?: string;
  currentEmotion?: string;
  model?: string;
  provider?: string;
}

interface GenerationStatusProps {
  progress: GenerationProgress;
}

const STATUS_STEPS = [
  { key: 'validating', completedKey: 'validated', label: 'Analyze Topic Semantics' },
  { key: 'researching', completedKey: 'researched', label: 'Generate Research Context' },
  { key: 'scripting', completedKey: 'scripted', label: 'Generate Multi-Speaker Script' },
  { key: 'generating_audio', completedKey: 'audio_complete', label: 'Synthesize Audio (Neural TTS)' },
  { key: 'merging', completedKey: 'merged', label: 'Merge Audio Segments' },
  { key: 'uploading', completedKey: 'complete', label: 'Upload to Cloud Storage' },
];

export default function GenerationStatus({ progress }: GenerationStatusProps) {
  const getStepState = (step: typeof STATUS_STEPS[0], index: number) => {
    const currentStepIndex = STATUS_STEPS.findIndex(
      s => s.key === progress.step || s.completedKey === progress.step
    );
    
    // Check if this step is complete
    const isComplete = index < currentStepIndex || 
      (index === currentStepIndex && progress.step === step.completedKey);
    
    // Check if this step is active
    const isActive = index === currentStepIndex && progress.step === step.key;
    
    return { isComplete, isActive };
  };

  const getStepDetail = (step: typeof STATUS_STEPS[0]) => {
    switch (step.key) {
      case 'validating':
        if (progress.cleanedTopic) return progress.cleanedTopic;
        break;
      case 'researching':
        if (progress.keyPointsCount) return `${progress.keyPointsCount} key points found`;
        break;
      case 'scripting':
        if (progress.title) return `"${progress.title}" (${progress.lineCount} lines)`;
        break;
      case 'generating_audio':
        if (progress.currentLine && progress.totalLines) {
          return `Line ${progress.currentLine}/${progress.totalLines}: ${progress.currentSpeaker}`;
        }
        break;
    }
    return null;
  };
  
  return (
    <div className="linear-card rounded-xl p-5 border-t border-white/5">
      <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4 pl-1">
        Generation Process
      </h4>
      <div className="space-y-4">
        {STATUS_STEPS.map((step, index) => {
          const { isActive, isComplete } = getStepState(step, index);
          const detail = getStepDetail(step);
          
          return (
            <div key={step.key} className="flex items-start gap-3">
              {isComplete ? (
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
              ) : isActive ? (
                <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="absolute inset-0 rounded-full border border-[#06b6d4] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs transition-colors block ${
                    isComplete
                      ? 'text-[#a1a1aa] line-through decoration-[#a1a1aa]/50'
                      : isActive
                      ? 'font-medium text-white'
                      : 'text-[#a1a1aa]/50'
                  }`}
                >
                  {step.label}
                </span>
                {detail && (isActive || isComplete) && (
                  <span className="text-[10px] text-[#06b6d4] mt-0.5 block truncate">
                    {detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
