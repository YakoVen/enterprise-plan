'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, EyeOff, Bell, History, Save } from 'lucide-react';
import { Article } from '@/interfaces/article';
import { InventorySettings, DEFAULT_INVENTORY, RestockRequest, InventoryLog } from '@/interfaces/returns';
import {
  getArticles, getInventorySettings, setSetting, getRestockRequests,
  markRestockNotified, getInventoryLog,
} from '@/service/firebase/database';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState<InventorySettings>(DEFAULT_INVENTORY);
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [log, setLog] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [a, s, r, l] = await Promise.all([
        getArticles(), getInventorySettings(), getRestockRequests(true), getInventoryLog(undefined, 30),
      ]);
      setArticles(a);
      setSettings(s);
      setRequests(r);
      setLog(l);
      setTitles(Object.fromEntries(a.map((x) => [x.id, x.title])));
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await setSetting('inventory', settings);
      toast.success('Paramètres sauvegardés');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleNotified(id: string) {
    try {
      await markRestockNotified(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success('Marqué comme notifié');
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  const lowStock = articles.filter((a) => {
    const stock = a.hasVariants && a.variants?.length ? a.variants.reduce((s, v) => s + (v.stock ?? 0), 0) : (a.totalStock ?? 1);
    return stock > 0 && stock <= settings.lowThreshold;
  });
  const outOfStock = articles.filter((a) => {
    const stock = a.hasVariants && a.variants?.length ? a.variants.reduce((s, v) => s + (v.stock ?? 0), 0) : (a.totalStock ?? 1);
    return stock <= 0;
  });

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventaire avancé</h1>

      <div className="bg-white rounded-md border p-6 flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium">Seuil stock faible
          <input type="number" min={1} value={settings.lowThreshold}
            onChange={(e) => setSettings({ ...settings, lowThreshold: Number(e.target.value) })}
            className="block w-32 mt-1 border rounded-md px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium pb-2">
          <input type="checkbox" checked={settings.hideOutOfStock}
            onChange={(e) => setSettings({ ...settings, hideOutOfStock: e.target.checked })}
            className="rounded text-cyan-600" />
          <span className="flex items-center gap-1"><EyeOff size={16} /> Masquer les ruptures en boutique</span>
        </label>
        <button onClick={handleSaveSettings} disabled={saving}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50">
          <Save size={16} /> Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-md border overflow-hidden">
          <h2 className="font-bold p-6 pb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Stock faible ({lowStock.length})</h2>
          <div className="divide-y max-h-80 overflow-y-auto">
            {lowStock.map((a) => (
              <Link key={a.id} href={`/dashboard/articles/${a.id}`} className="flex justify-between px-6 py-3 hover:bg-gray-50 text-sm">
                <span className="truncate">{a.title}</span>
                <span className="font-bold text-orange-600">{a.totalStock ?? '?'} restants</span>
              </Link>
            ))}
            {lowStock.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">Aucun article en stock faible.</p>}
          </div>
        </div>

        <div className="bg-white rounded-md border overflow-hidden">
          <h2 className="font-bold p-6 pb-2">Ruptures ({outOfStock.length})</h2>
          <div className="divide-y max-h-80 overflow-y-auto">
            {outOfStock.map((a) => (
              <Link key={a.id} href={`/dashboard/articles/${a.id}`} className="flex justify-between px-6 py-3 hover:bg-gray-50 text-sm">
                <span className="truncate">{a.title}</span>
                <span className="font-bold text-red-600">Épuisé</span>
              </Link>
            ))}
            {outOfStock.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">Aucune rupture.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <h2 className="font-bold p-6 pb-2 flex items-center gap-2"><Bell size={18} className="text-cyan-600" /> Alertes réassort ({requests.length})</h2>
        <div className="divide-y">
          {requests.map((r) => (
            <div key={r.id} className="flex justify-between items-center px-6 py-3 text-sm">
              <div>
                <p className="font-medium">{titles[r.articleId] || r.articleId}</p>
                <p className="text-gray-500">{r.contact} • {r.createdAt ? r.createdAt.slice(0, 10) : ''}</p>
              </div>
              <button onClick={() => handleNotified(r.id)} className="text-cyan-600 text-sm font-medium hover:underline">Marquer notifié</button>
            </div>
          ))}
          {requests.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">Aucune demande en attente.</p>}
        </div>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <h2 className="font-bold p-6 pb-2 flex items-center gap-2"><History size={18} className="text-gray-500" /> Journal des mouvements</h2>
        <div className="divide-y max-h-80 overflow-y-auto">
          {log.map((l) => (
            <div key={l.id} className="flex justify-between px-6 py-2.5 text-sm">
              <span className="truncate">{titles[l.articleId] || l.articleId} <span className="text-gray-400">• {l.reason}</span></span>
              <span className={`font-bold ${l.change < 0 ? 'text-red-600' : 'text-green-600'}`}>{l.change > 0 ? '+' : ''}{l.change}</span>
            </div>
          ))}
          {log.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">Aucun mouvement enregistré.</p>}
        </div>
      </div>
    </div>
  );
}
