'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart } from 'lucide-react';
import { getBundles, getArticles } from '@/service/firebase/database';
import { Bundle } from '@/interfaces/bundle';
import { Article } from '@/interfaces/article';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

function prorate(bundlePrice: number, prices: number[]): number[] {
  const sum = prices.reduce((s, p) => s + p, 0);
  if (sum <= 0) return prices.map(() => 0);
  const out = prices.map((p) => Math.round((bundlePrice * p) / sum));
  out[out.length - 1] += bundlePrice - out.reduce((s, v) => s + v, 0);
  return out;
}

export default function BundlesPage() {
  const { addItem } = useCart();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Record<string, Article>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [b, a] = await Promise.all([getBundles(true), getArticles({ active: true })]);
        setBundles(b);
        setProducts(Object.fromEntries(a.map((p) => [p.id, p])));
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function bundleStock(b: Bundle): number {
    let min = Infinity;
    for (const id of b.productIds) {
      const p = products[id];
      if (!p || !p.active) return 0;
      min = Math.min(min, p.totalStock ?? 1);
    }
    return min === Infinity ? 0 : min;
  }

  function handleAdd(b: Bundle) {
    const items = b.productIds.map((id) => products[id]).filter(Boolean);
    if (items.length !== b.productIds.length) {
      toast.error('Un produit du lot est indisponible');
      return;
    }
    if (bundleStock(b) <= 0) {
      toast.error('Lot en rupture de stock');
      return;
    }
    const prices = prorate(b.bundlePrice, items.map((p) => p.price));
    items.forEach((p, i) => {
      addItem({
        articleId: p.id,
        title: p.title,
        price: prices[i],
        thumbnail: p.thumbnail,
        quantity: 1,
        variantName: `Lot : ${b.name}`,
      });
    });
    toast.success('Lot ajouté au panier !');
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />)}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Lots &amp; Packs</h1>
      <p className="text-gray-500 mb-8">Des produits groupés à prix réduit. Disponible uniquement si tous les articles sont en stock.</p>

      {bundles.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun lot disponible pour le moment.</p>
          <Link href="/articles" className="text-cyan-600 font-medium hover:underline">Voir la boutique</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map((b) => {
            const items = b.productIds.map((id) => products[id]).filter(Boolean);
            const sum = items.reduce((s, p) => s + p.price, 0);
            const savings = Math.max(sum - b.bundlePrice, 0);
            const inStock = bundleStock(b) > 0;
            return (
              <div key={b.id} className="bg-white rounded-lg border overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{b.name}</h2>
                    {savings > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">-{savings.toLocaleString()} DA</span>}
                  </div>
                  {b.description && <p className="text-sm text-gray-500 mb-4">{b.description}</p>}
                  <ul className="space-y-2 mb-4">
                    {items.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 text-sm">
                        {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-100" />}
                        <span className="flex-1 truncate">{p.title}</span>
                        <span className="text-gray-500">{p.price.toLocaleString()} DA</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {sum > b.bundlePrice && <span className="text-sm text-gray-400 line-through block">{sum.toLocaleString()} DA</span>}
                      <span className="text-2xl font-bold text-cyan-600">{b.bundlePrice.toLocaleString()} DA</span>
                    </div>
                    <button onClick={() => handleAdd(b)} disabled={!inStock}
                      className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-3 rounded-md font-bold hover:bg-cyan-700 disabled:opacity-50">
                      <ShoppingCart size={18} /> {inStock ? 'Ajouter le lot' : 'Rupture'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
