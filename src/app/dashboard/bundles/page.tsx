'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Package } from 'lucide-react';
import AvailableButton from '@/components/dashboard/widget/available-button';
import { Bundle } from '@/interfaces/bundle';
import { getBundles, createBundle, updateBundle, deleteBundle, getArticles } from '@/service/firebase/database';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', productIds: [] as string[], bundlePrice: 0, active: true };

export default function BundlesAdminPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [b, a] = await Promise.all([getBundles(), getArticles({ active: true })]);
      setBundles(b);
      setProducts(a.map((p) => ({ id: p.id, title: p.title, price: p.price })));
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  function openModal(b: Bundle | null = null) {
    if (b) {
      setEditingId(b.id);
      setForm({ name: b.name, description: b.description || '', productIds: b.productIds, bundlePrice: b.bundlePrice, active: b.active });
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

  const selectedSum = form.productIds.reduce((s, id) => s + (products.find((p) => p.id === id)?.price ?? 0), 0);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.productIds.length < 2 || form.bundlePrice <= 0) {
      toast.error('Nom, au moins 2 produits et prix requis');
      return;
    }
    if (form.bundlePrice >= selectedSum) {
      toast.error(`Le prix du lot doit être inférieur à ${selectedSum.toLocaleString()} DA`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        productIds: form.productIds,
        bundlePrice: Number(form.bundlePrice),
        active: form.active,
        createdAt: new Date().toISOString(),
      };
      if (editingId) {
        await updateBundle(editingId, payload);
        toast.success('Lot mis à jour');
      } else {
        await createBundle(payload);
        toast.success('Lot créé');
      }
      setModal(false);
      await load();
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(b: Bundle) {
    try {
      await updateBundle(b.id, { active: !b.active });
      await load();
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce lot ?')) return;
    try {
      await deleteBundle(id);
      await load();
      toast.success('Lot supprimé');
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
        <h1 className="text-2xl font-bold">Lots &amp; Packs</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700">
          <Plus size={18} /> Nouveau lot
        </button>
      </div>

      <div className="space-y-4">
        {bundles.map((b) => (
          <div key={b.id} className="bg-white rounded-md border p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Package size={20} /></div>
              <div>
                <h3 className="font-bold">{b.name}</h3>
                <p className="text-sm text-gray-500">{b.productIds.length} produits • {b.bundlePrice.toLocaleString()} DA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AvailableButton isActive={b.active} onClick={() => handleToggle(b)} />
              <button onClick={() => openModal(b)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg"><Edit size={16} /></button>
              <button onClick={() => handleDelete(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {bundles.length === 0 && (
          <div className="bg-white rounded-md border p-12 text-center text-gray-500">Aucun lot. Créez-en un pour augmenter le panier moyen.</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Modifier' : 'Nouveau'} lot</h2>
              <button type="button" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-md px-3 py-2" placeholder="Pack Bureau" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-md px-3 py-2" placeholder="Tout pour le télétravail" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Produits (min 2) — total : {selectedSum.toLocaleString()} DA</label>
              <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)}
                      className="rounded text-cyan-600" />
                    <span className="flex-1 truncate">{p.title}</span>
                    <span className="text-gray-500">{p.price.toLocaleString()} DA</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix du lot (DA)</label>
              <input type="number" min={1} value={form.bundlePrice || ''} onChange={(e) => setForm({ ...form, bundlePrice: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded text-cyan-600" /> Actif
            </label>
            <button type="submit" disabled={saving} className="w-full bg-cyan-600 text-white py-3 rounded-md font-bold hover:bg-cyan-700 disabled:opacity-50">
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
