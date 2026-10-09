'use client';

import { useState, useEffect } from 'react';
import { Package, Heart, MapPin, CreditCard, ArrowRight, Award } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getOrdersByUser, getLoyaltyConfig } from '@/service/firebase/database';
import { Order } from '@/interfaces/order';
import { LoyaltyConfig, DEFAULT_LOYALTY, tierForSpend } from '@/interfaces/loyalty';

const stateLabels = ['En attente', 'Confirmée', 'Expédiée', 'Livrée'];

export default function AccountOverviewPage() {
  const { currentUser, userProfile } = useAuth();
  const { wishlist } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyCfg, setLoyaltyCfg] = useState<LoyaltyConfig>(DEFAULT_LOYALTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    Promise.all([getOrdersByUser(currentUser.uid), getLoyaltyConfig()])
      .then(([o, c]) => {
        setOrders(o.filter((x) => x.type !== 'failed'));
        setLoyaltyCfg(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'cher client';
  const totalSpend = userProfile?.totalSpend ?? orders.reduce((s, o) => s + (o.total || 0), 0);
  const points = userProfile?.loyaltyPoints ?? 0;
  const tier = tierForSpend(userProfile?.totalSpend ?? totalSpend, loyaltyCfg.tiers);
  const nextTier = [...loyaltyCfg.tiers].sort((a, b) => a.minSpend - b.minSpend).find((t) => t.minSpend > (userProfile?.totalSpend ?? totalSpend));
  const progress = nextTier ? Math.min(((userProfile?.totalSpend ?? totalSpend) / nextTier.minSpend) * 100, 100) : 100;

  const stats = [
    { name: 'Total Commandes', value: String(orders.length), icon: Package, href: '/account/orders' },
    { name: 'Total Dépensé', value: `${totalSpend.toLocaleString()} DA`, icon: CreditCard, href: '/account/orders' },
    { name: 'Articles Wishlist', value: String(wishlist.length), icon: Heart, href: '/account/wishlist' },
    { name: 'Adresses Enregistrées', value: String(userProfile?.addresses?.length ?? 0), icon: MapPin, href: '/account/addresses' },
  ];

  const recentOrders = [...orders].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bonjour, {displayName}</h1>
        <p className="text-gray-600">
          Bienvenue sur votre tableau de bord. Ici vous pouvez vérifier vos activités récentes, mettre à jour vos informations et gérer vos commandes.
        </p>
      </div>

      {loyaltyCfg.active && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-md shadow-sm p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-8 w-8" />
            <div>
              <p className="text-sm opacity-90">Programme fidélité • Niveau {userProfile?.vipTier || tier.name}</p>
              <p className="text-3xl font-bold">{points} points</p>
            </div>
          </div>
          {nextTier ? (
            <div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm mt-2 opacity-90">
                Plus que {(nextTier.minSpend - (userProfile?.totalSpend ?? totalSpend)).toLocaleString()} DA pour {nextTier.name} (x{nextTier.multiplier} points)
              </p>
            </div>
          ) : (
            <p className="text-sm opacity-90">Niveau maximum atteint — bravo !</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-md shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="h-12 w-12 bg-cyan-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                <Icon className="h-6 w-6 text-cyan-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Commandes Récentes</h2>
          <Link href="/account/orders" className="text-sm font-medium text-cyan-600 hover:text-cyan-500 flex items-center">
            Voir tout
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-gray-900">#{order.id.substring(0, 8)}</p>
                <p className="text-sm text-gray-500">{order.date ? order.date.slice(0, 10) : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{order.total.toLocaleString()} DA</p>
                <span className="text-xs text-gray-500">{stateLabels[order.state] ?? ''}</span>
              </div>
            </Link>
          ))}
          {recentOrders.length === 0 && (
            <p className="p-8 text-center text-gray-500">Aucune commande pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
