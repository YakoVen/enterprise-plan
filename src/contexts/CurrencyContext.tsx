'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencySettings, DEFAULT_CURRENCY, CurrencyRates, formatConverted } from '@/interfaces/currency';
import { getSetting } from '@/service/firebase/database';

interface CurrencyContextProps {
  currency: keyof CurrencyRates;
  setCurrency: (c: keyof CurrencyRates) => void;
  rates: CurrencyRates;
  enabled: boolean;
  fmt: (amountDZD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextProps>({
  currency: 'DZD',
  setCurrency: () => {},
  rates: DEFAULT_CURRENCY.rates,
  enabled: false,
  fmt: (n) => `${n.toLocaleString('fr-DZ')} DA`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CurrencySettings>(DEFAULT_CURRENCY);
  const [currency, setCurrency] = useState<keyof CurrencyRates>('DZD');

  useEffect(() => {
    getSetting<CurrencySettings>('currency', DEFAULT_CURRENCY)
      .then((s) => {
        setSettings(s);
        setCurrency(s.defaultCurrency || 'DZD');
      })
      .catch(() => {});
  }, []);

  const fmt = (amountDZD: number) => formatConverted(amountDZD, currency, settings.rates);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates: settings.rates, enabled: settings.active, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
