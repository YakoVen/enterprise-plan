'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Zap } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { FlashSale } from '@/interfaces/flash-sale';
import { getFlashSales, createFlashSale, updateFlashSale, deleteFlashSale, isSaleLive, getArticles, getOrders } from '@/service/firebase/database';
import { saleRevenue } from '@/service/pricing';
import { Order } from '@/interfaces/order';
import FlashCountdown from '@/components/storefront/flash-countdown';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', productIds: [] as string[], discountType: 'percentage' as FlashSale['discountType'],
  value: 20, startsAt: '', endsAt: '', active: true, bannerText: '',
};

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [s, o, a] = await Promise.all([getFlashSales(), getOrders(), getArticles({ active: true })]);
      setSales(s);
      setOrders(o);
      setProducts(a.map((p) => ({ id: p.id, title: p.title, price: p.price })));
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  function openModal(sale: FlashSale | null = null) {
    if (sale) {
      setEditingId(sale.id);
      setForm({
        name: sale.name, productIds: sale.productIds, discountType: sale.discountType,
        value: sale.value, startsAt: toLocalInput(sale.startsAt), endsAt: toLocalInput(sale.endsAt),
        active: sale.active, bannerText: sale.bannerText || '',
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setModal(true);
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.productIds.length === 0 || form.value <= 0 || !form.startsAt || !form.endsAt) {
      toast.error('Nom, produits, valeur et période requis');
      return;
    }
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      toast.error('La fin doit être après le début');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        productIds: form.productIds,
        discountType: form.discountType,
        value: Number(form.value),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        active: form.active,
        bannerText: form.bannerText.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      if (editingId) {
        await updateFlashSale(editingId, payload);
        toast.success('Vente mise à jour');
      } else {
        await createFlashSale(payload);
        toast.success('Vente flash créée');
      }
      setModal(false);
      await load();
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s: FlashSale) {
    try {
      await updateFlashSale(s.id, { active: !s.active });
      await load();
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette vente flash ?')) return;
    try {
      await deleteFlashSale(id);
      await load();
      toast.success('Vente supprimée');
    } catch {
      toast.error('Erreur de suppression');
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ventes flash</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700">
          <Plus size={18} /> Nouvelle vente
        </button>
      </div>

      <div className="space-y-4">
        {sales.map((s) => {
          const live = isSaleLive(s);
          const revenue = saleRevenue(s, orders);
          return (
            <div key={s.id} className="bg-white rounded-md border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${live ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Zap size={20} className={live ? 'fill-current' : ''} />
                  </div>
                  <div>
                    <h3 className="font-bold">{s.name}</h3>
                    <p className="text-sm text-gray-500">
                      {s.discountType === 'percentage' ? `${s.value}%` : `${s.value} DA`} • {s.productIds.length} produit{s.productIds.length > 1 ? 's' : ''} • CA: {revenue.toLocaleString()} DA
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {live ? <FlashCountdown endsAt={s.endsAt} /> : (
                    <span className="text-xs font-bold text-gray-400">{new Date(s.endsAt) < new Date() ? 'Terminée' : s.active ? 'Programmée' : 'Inactive'}</span>
                  )}
                  <AvailableButton isActive={s.active} onClick={() => handleToggle(s)} />
                  <button onClick={() => openModal(s)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
        {sales.length === 0 && (
          <div className="bg-white rounded-md border p-12 text-center text-gray-500">Aucune vente flash. Créez-en une pour booster vos ventes.</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Modifier' : 'Nouvelle'} vente flash</h2>
              <button type="button" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-md px-3 py-2" placeholder="Flash Weekend" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as FlashSale['discountType'] })}
                  className="w-full border rounded-md px-3 py-2 bg-white">
                  <option value="percentage">% Pourcentage</option>
                  <option value="fixed">DA Fixe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valeur</label>
                <input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Début</label>
                <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fin</label>
                <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full border rounded-md px-3 py-2" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Texte bannière (optionnel)</label>
              <input value={form.bannerText} onChange={(e) => setForm({ ...form, bannerText: e.target.value })}
                className="w-full border rounded-md px-3 py-2" placeholder="-30% ce weekend seulement !" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Produits ({form.productIds.length} sélectionnés)</label>
              <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)}
                      className="rounded text-cyan-600" />
                    <span className="flex-1 truncate">{p.title}</span>
                    <span className="text-gray-500">{p.price.toLocaleString()} DA</span>
                  </label>
                ))}
                {products.length === 0 && <p className="p-4 text-sm text-gray-500">Aucun produit actif.</p>}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded text-cyan-600" /> Actif
            </label>
            <p className="text-xs text-gray-500">Les prix reviennent automatiquement à la normale hors période — aucune action requise.</p>
            <button type="submit" disabled={saving} className="w-full bg-cyan-600 text-white py-3 rounded-md font-bold hover:bg-cyan-700 disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
