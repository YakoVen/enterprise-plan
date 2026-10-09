'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, CheckCircle2, Clock, Package, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getOrderById, getReturnByOrder, createReturnRequest } from '@/service/firebase/database';
import { Order } from '@/interfaces/order';
import { ReturnRequest } from '@/interfaces/returns';
import toast from 'react-hot-toast';

const stateLabels = ['Commande passée', 'Confirmée', 'Expédiée', 'Livrée'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [existingReturn, setExistingReturn] = useState<ReturnRequest | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  useEffect(() => {
    if (authLoading || !id) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    Promise.all([getOrderById(id), getReturnByOrder(id)])
      .then(([o, r]) => {
        if (!o || (o.userId && o.userId !== currentUser.uid)) {
          setNotFound(true);
        } else {
          setOrder(o);
          setExistingReturn(r);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, currentUser, authLoading, router]);

  async function handleReturnRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !returnReason.trim()) {
      toast.error('Indiquez un motif');
      return;
    }
    setReturning(true);
    try {
      const req = await createReturnRequest({
        orderId: order.id,
        userId: currentUser?.uid,
        reason: returnReason.trim(),
        status: 'requested',
        createdAt: new Date().toISOString(),
      });
      setExistingReturn({ id: req, orderId: order.id, reason: returnReason.trim(), status: 'requested', createdAt: new Date().toISOString() });
      setShowReturnForm(false);
      toast.success('Demande de retour envoyée');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setReturning(false);
    }
  }

  if (loading || authLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />)}</div>;
  }

  if (notFound || !order) {
    return (
      <div className="bg-white rounded-md border p-12 text-center">
        <p className="text-gray-500 mb-4">Commande introuvable.</p>
        <Link href="/account/orders" className="text-cyan-600 font-medium hover:underline">Retour aux commandes</Link>
      </div>
    );
  }

  const timeline = stateLabels.map((label, i) => ({
    status: label,
    date: order.trackingHistory?.find((h) => h.status === i)?.timestamp || '',
    completed: order.state >= i,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/account/orders" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commande #{order.id.substring(0, 8)}</h1>
          <p className="text-sm text-gray-500">Passée le {order.date}</p>
        </div>
      </div>

      {/* Visual Status Pipeline */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Suivi de commande</h2>
        <div className="relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200" />
          <div className="absolute top-4 left-6 h-0.5 bg-cyan-600 transition-all"
            style={{ width: `calc(${(order.state / (stateLabels.length - 1)) * 100}% - 3rem)` }} />

          <div className="relative flex justify-between">
            {timeline.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center relative z-10 ${
                  step.completed ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900 text-center">{step.status}</p>
                {step.date && <p className="text-xs text-gray-500 text-center">{step.date}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Return request */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Retour / Remboursement</h2>
        {existingReturn ? (
          <p className="text-sm text-gray-600">
            Demande {existingReturn.status === 'requested' ? 'en cours d&apos;examen' : existingReturn.status === 'approved' ? 'approuvée' : existingReturn.status === 'rejected' ? 'refusée' : 'terminée'}
            {' '}• Motif : {existingReturn.reason}
            {existingReturn.adminNote && <> • Note : {existingReturn.adminNote}</>}
          </p>
        ) : order.state >= 1 ? (
          showReturnForm ? (
            <form onSubmit={handleReturnRequest} className="space-y-3">
              <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={2}
                placeholder="Motif du retour..." className="w-full border rounded-md px-3 py-2 text-sm" required />
              <div className="flex gap-2">
                <button type="submit" disabled={returning}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-cyan-700 disabled:opacity-50">
                  {returning ? 'Envoi...' : 'Envoyer la demande'}
                </button>
                <button type="button" onClick={() => setShowReturnForm(false)}
                  className="px-4 py-2 border rounded-md text-sm">Annuler</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowReturnForm(true)}
              className="flex items-center gap-2 text-sm font-medium text-cyan-600 hover:underline">
              <RotateCcw size={16} /> Demander un retour
            </button>
          )
        ) : (
          <p className="text-sm text-gray-500">Disponible une fois la commande confirmée.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items List */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Articles ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <div key={`${item.articleId}-${item.variantId || i}`} className="p-6 flex items-center py-4">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                    {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                    <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                  </div>
                  <div className="text-right font-medium text-gray-900">
                    {item.price * item.quantity} DA
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé des coûts</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{order.subtotal} DA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{order.deliveryFee} DA</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>-{order.discount} DA</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                <span>Total</span>
                <span>{order.total} DA</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <h2 className="text-lg font-bold text-gray-900">Adresse de livraison</h2>
            </div>
            <address className="not-italic text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{order.name}</p>
              <p>{order.address}</p>
              <p>{order.commune}, {order.wilaya}</p>
              <p className="pt-2">{order.phone}</p>
            </address>
          </div>
        </div>
      </div>
    </div>
  );
}
