export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

export function getScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
  glow: string;
} {
  if (score >= 80) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      ring: '#10b981',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      ring: '#f59e0b',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    };
  }
  return {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    ring: '#f43f5e',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
  };
}

export function getCategoryBadge(category?: string) {
  switch (category) {
    case 'docs':
      return { label: 'DOCS', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    case 'repo':
      return { label: 'CODE', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    case 'qa':
      return { label: 'Q&A', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 'tool':
      return { label: 'TOOL', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    default:
      return { label: 'WEB', bg: 'bg-slate-700/40 text-slate-300 border-slate-600/30' };
  }
}
