'use client';

import { useState, useEffect } from 'react';
import { getLiveFlashSales } from '@/service/firebase/database';
import { FlashSale } from '@/interfaces/flash-sale';

export function useLiveSales(refreshKey = 0) {
  const [sales, setSales] = useState<FlashSale[]>([]);

  useEffect(() => {
    let live = true;
    getLiveFlashSales().then((s) => { if (live) setSales(s); }).catch(() => {});
    return () => { live = false; };
  }, [refreshKey]);

  return sales;
}
