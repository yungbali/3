'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type StatusState = 'operational' | 'degraded' | 'outage' | 'unknown';

interface HealthData {
  status?: string;
  version?: string;
  timestamp?: string;
  environment?: string;
  storage?: { configured: boolean; type: string };
}

interface ComponentStatus {
  id: string;
  name: string;
  status: StatusState;
  message?: string;
}

function StatusIndicator({ status }: { status: StatusState }) {
  const config = {
    operational: { color: 'bg-[#22c55e]', label: 'Operational' },
    degraded: { color: 'bg-amber-500', label: 'Degraded' },
    outage: { color: 'bg-red-500', label: 'Outage' },
    unknown: { color: 'bg-[#a1a1aa]', label: 'Unknown' },
  };
  const { color, label } = config[status];
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-[#a1a1aa]">{label}</span>
    </span>
  );
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setError(null);
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reach API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const apiHealthy = health?.status === 'healthy';
  const components: ComponentStatus[] = [
    {
      id: 'frontend',
      name: 'Frontend (Next.js)',
      status: 'operational',
      message: 'You are viewing this page',
    },
    {
      id: 'api',
      name: 'Backend API',
      status: apiHealthy ? 'operational' : error ? 'outage' : 'unknown',
      message: apiHealthy ? 'Health check passing' : error ?? 'Checking...',
    },
    {
      id: 'llm',
      name: 'AI Engine (LLM)',
      status: apiHealthy ? 'operational' : error ? 'outage' : 'unknown',
      message: apiHealthy ? 'Available via API' : 'Status derived from API',
    },
    {
      id: 'tts',
      name: 'TTS Service (Cartesia)',
      status: apiHealthy ? 'operational' : error ? 'outage' : 'unknown',
      message: apiHealthy ? 'Available via API' : 'Status derived from API',
    },
    {
      id: 'storage',
      name: 'Storage (Vercel Blob)',
      status: health?.storage?.configured ? 'operational' : 'degraded',
      message: health?.storage?.configured
        ? 'Configured — generated audio can be stored'
        : 'Not configured — audio delivered via fallback',
    },
  ];

  const overallStatus: StatusState =
    components.some((c) => c.status === 'outage')
      ? 'outage'
      : components.some((c) => c.status === 'degraded' || c.status === 'unknown')
        ? 'degraded'
        : 'operational';

  return (
    <div className="min-h-screen bg-[#050507] text-[#ededed]">
      <nav className="border-b border-white/5 bg-[#050507]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors"
          >
            <span className="text-[#06b6d4]">←</span> Back to KOTOMO
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-white tracking-tight">System Status</h1>
          <p className="text-sm text-[#a1a1aa] mt-1">
            Real-time status of KOTOMO services. Updates every 30 seconds.
          </p>
        </header>

        <div
          className={`linear-card rounded-xl p-6 flex items-center justify-between ${
            overallStatus === 'operational'
              ? 'border-[#22c55e]/30'
              : overallStatus === 'outage'
                ? 'border-red-500/30'
                : 'border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <StatusIndicator status={overallStatus} />
            <span className="text-sm font-medium text-white">
              {overallStatus === 'operational'
                ? 'All systems operational'
                : overallStatus === 'outage'
                  ? 'Service disruption'
                  : 'Partial degradation'}
            </span>
          </div>
          {health?.timestamp && (
            <span className="text-[10px] font-mono text-[#a1a1aa]">
              Last check: {new Date(health.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <section className="linear-card rounded-xl divide-y divide-white/5">
          {loading && !health ? (
            <div className="p-6 text-center text-sm text-[#a1a1aa]">
              Checking system status...
            </div>
          ) : (
            components.map((comp) => (
              <div
                key={comp.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-6"
              >
                <div>
                  <p className="text-sm font-medium text-white">{comp.name}</p>
                  {comp.message && (
                    <p className="text-xs text-[#a1a1aa] mt-0.5">{comp.message}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <StatusIndicator status={comp.status} />
                </div>
              </div>
            ))
          )}
        </section>

        <div className="pt-4">
          <Link href="/" className="text-sm font-medium text-[#06b6d4] hover:underline">
            ← Return home
          </Link>
        </div>
      </main>
    </div>
  );
}
