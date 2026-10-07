'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, PackageCheck } from 'lucide-react';
import { ReturnRequest } from '@/interfaces/returns';
import { getReturns, updateReturnStatus, getOrderById, getArticle, updateArticle, logInventory } from '@/service/firebase/database';
import toast from 'react-hot-toast';

const statusLabels: Record<ReturnRequest['status'], string> = {
  requested: 'Demandée',
  approved: 'Approuvée',
  rejected: 'Refusée',
  completed: 'Terminée',
};

export default function ReturnsAdminPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState<'all' | ReturnRequest['status']>('all');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setRequests(await getReturns());
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function decide(id: string, status: 'approved' | 'rejected') {
    setActing(id);
    try {
      await updateReturnStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, decidedAt: new Date().toISOString() } : r)));
      toast.success(status === 'approved' ? 'Retour approuvé' : 'Retour refusé');
    } catch {
      toast.error('Erreur de mise à jour');
    } finally {
      setActing(null);
    }
  }

  async function complete(id: string, orderId: string) {
    setActing(id);
    try {
      // Restock ordered items back into inventory
      const order = await getOrderById(orderId);
      if (order) {
        for (const item of order.items || []) {
          try {
            const article = await getArticle(item.articleId);
            if (article && article.totalStock !== undefined) {
              await updateArticle(item.articleId, { totalStock: article.totalStock + item.quantity });
              await logInventory(item.articleId, item.quantity, 'return', 'admin');
            }
          } catch { /* per-item failure is non-blocking */ }
        }
      }
      await updateReturnStatus(id, 'completed');
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'completed' as const, decidedAt: new Date().toISOString() } : r)));
      toast.success('Retour terminé, stock réintégré');
    } catch {
      toast.error('Erreur de traitement');
    } finally {
      setActing(null);
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Retours &amp; Remboursements</h1>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'requested', 'approved', 'rejected', 'completed'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {s === 'all' ? 'Tous' : statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-bold">Commande #{r.orderId.substring(0, 8)} • {statusLabels[r.status]}</p>
                <p className="text-sm text-gray-500">Motif : {r.reason}</p>
                <p className="text-xs text-gray-400">Demandé le {r.createdAt ? r.createdAt.slice(0, 10) : ''}</p>
              </div>
              <div className="flex gap-2">
                {r.status === 'requested' && (
                  <>
                    <button onClick={() => decide(r.id, 'approved')} disabled={acting === r.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                      <CheckCircle size={16} /> Approuver
                    </button>
                    <button onClick={() => decide(r.id, 'rejected')} disabled={acting === r.id}
                      className="flex items-center gap-1 px-3 py-2 bg-white border text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50">
                      <XCircle size={16} /> Refuser
                    </button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button onClick={() => complete(r.id, r.orderId)} disabled={acting === r.id}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    <PackageCheck size={16} /> Terminer + restocker
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">Aucune demande dans cet onglet.</div>
        )}
      </div>
    </div>
  );
}
