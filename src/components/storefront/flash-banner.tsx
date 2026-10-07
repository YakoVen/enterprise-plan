'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { getLiveFlashSales } from '@/service/firebase/database';
import { FlashSale } from '@/interfaces/flash-sale';
import FlashCountdown from './flash-countdown';

export default function FlashBanner() {
  const [sales, setSales] = useState<FlashSale[]>([]);

  useEffect(() => {
    getLiveFlashSales().then(setSales).catch(() => {});
  }, []);

  if (sales.length === 0) return null;
  const soonest = [...sales].sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())[0];

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
        <Zap size={16} className="fill-current" />
        <span className="font-bold">{soonest.bannerText || soonest.name}</span>
        <span className="bg-white/20 rounded-lg px-2 py-0.5">
          <FlashCountdown endsAt={soonest.endsAt} compact onExpire={() => getLiveFlashSales().then(setSales).catch(() => {})} />
        </span>
        <Link href="/bundles" className="underline font-medium hover:no-underline">Voir les offres</Link>
      </div>
    </div>
  );
}
