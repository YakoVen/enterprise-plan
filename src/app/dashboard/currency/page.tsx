'use client';

import { useState, useEffect } from 'react';
import { Save, Coins } from 'lucide-react';
import { CurrencySettings, DEFAULT_CURRENCY } from '@/interfaces/currency';
import { getSetting, setSetting } from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function CurrencyPage() {
  const [cfg, setCfg] = useState<CurrencySettings>(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSetting<CurrencySettings>('currency', DEFAULT_CURRENCY).then(setCfg).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (cfg.rates.EUR <= 0 || cfg.rates.USD <= 0) {
      toast.error('Taux invalides');
      return;
    }
    setSaving(true);
    try {
      await setSetting('currency', cfg);
      toast.success('Devises sauvegardées');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-40 bg-gray-100 rounded-md animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Coins className="text-amber-500" /> Multi-devises</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50">
          <Save size={16} /> Sauvegarder
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })}
          className="rounded text-cyan-600" /> Sélecteur de devise visible en boutique
      </label>

      <div className="bg-white rounded-md border p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Devise par défaut</label>
          <select value={cfg.defaultCurrency} onChange={(e) => setCfg({ ...cfg, defaultCurrency: e.target.value as CurrencySettings['defaultCurrency'] })}
            className="w-full border rounded-md px-3 py-2 bg-white">
            <option value="DZD">DZD — Dinar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dollar</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">1 DZD = ? EUR</label>
          <input type="number" step={0.0001} min={0} value={cfg.rates.EUR}
            onChange={(e) => setCfg({ ...cfg, rates: { ...cfg.rates, EUR: Number(e.target.value) } })}
            className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">1 DZD = ? USD</label>
          <input type="number" step={0.0001} min={0} value={cfg.rates.USD}
            onChange={(e) => setCfg({ ...cfg, rates: { ...cfg.rates, USD: Number(e.target.value) } })}
            className="w-full border rounded-md px-3 py-2" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
        Exemple : 10 000 DA = {(10000 * cfg.rates.EUR).toFixed(2)} € = {(10000 * cfg.rates.USD).toFixed(2)} $. Les prix restent stockés en DZD, la conversion est indicative à l&apos;affichage.
      </div>
    </div>
  );
}
