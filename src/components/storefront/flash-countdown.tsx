'use client';

import { useState, useEffect } from 'react';

function parts(ms: number) {
  const s = Math.max(Math.floor(ms / 1000), 0);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function FlashCountdown({ endsAt, onExpire, compact = false }: { endsAt: string; onExpire?: () => void; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const target = new Date(endsAt).getTime();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = target - now;
  useEffect(() => {
    if (left <= 0) onExpire?.();
  }, [left, onExpire]);

  if (left <= 0) {
    return <span className="text-xs font-bold text-gray-400">Terminé</span>;
  }
  const p = parts(left);
  const units = [
    { v: p.d, l: 'j' },
    { v: p.h, l: 'h' },
    { v: p.m, l: 'm' },
    { v: p.s, l: 's' },
  ];
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold ${compact ? 'text-xs' : 'text-sm'} text-red-600`}>
      {units.map((u, i) => (
        <span key={i} className="bg-red-50 rounded px-1.5 py-0.5">
          {String(u.v).padStart(2, '0')}{u.l}
        </span>
      ))}
    </span>
  );
}
