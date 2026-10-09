'use client';

import { useState, useEffect } from 'react';
import { Save, Award } from 'lucide-react';
import { LoyaltyConfig, DEFAULT_LOYALTY } from '@/interfaces/loyalty';
import { getLoyaltyConfig, setSetting } from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function LoyaltyConfigPage() {
  const [cfg, setCfg] = useState<LoyaltyConfig>(DEFAULT_LOYALTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLoyaltyConfig().then(setCfg).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function updateTier(i: number, patch: Partial<LoyaltyConfig['tiers'][number]>) {
    setCfg((c) => ({ ...c, tiers: c.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  }

  async function handleSave() {
    if (cfg.spendPerPoint <= 0 || cfg.valuePerPoint < 0) {
      toast.error('Valeurs invalides');
      return;
    }
    setSaving(true);
    try {
      await setSetting('loyalty', cfg);
      toast.success('Programme sauvegarde');
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="text-amber-500" /> Programme fidélité</h1>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })}
          className="rounded text-cyan-600" /> Programme actif
      </label>

      <div className="bg-white rounded-md border p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">DA dépensés pour 1 point</label>
          <input type="number" min={1} value={cfg.spendPerPoint} onChange={(e) => setCfg({ ...cfg, spendPerPoint: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Valeur d&apos;un point (DA)</label>
          <input type="number" min={0} step={0.5} value={cfg.valuePerPoint} onChange={(e) => setCfg({ ...cfg, valuePerPoint: Number(e.target.value) })}
            className="w-full border rounded-md px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">Ex : 100 points = {(100 * cfg.valuePerPoint).toLocaleString()} DA</p>
        </div>
      </div>

      <div className="bg-white rounded-md border p-6">
        <h2 className="font-bold mb-4">Niveaux VIP</h2>
        <div className="space-y-3">
          {cfg.tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-center">
              <input value={t.name} onChange={(e) => updateTier(i, { name: e.target.value })}
                className="border rounded-md px-3 py-2 text-sm" placeholder="Nom" />
              <label className="text-sm text-gray-500">Min DA
                <input type="number" min={0} value={t.minSpend} onChange={(e) => updateTier(i, { minSpend: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1" />
              </label>
              <label className="text-sm text-gray-500">Multiplicateur
                <input type="number" min={1} step={0.5} value={t.multiplier} onChange={(e) => updateTier(i, { multiplier: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2 mt-1" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
