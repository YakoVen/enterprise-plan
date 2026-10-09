'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencyRates } from '@/interfaces/currency';
import CartIcon from '../cart/cart-icon';
import CartDrawer from '../cart/cart-drawer';

export default function Header() {
  const { currentUser } = useAuth();
  const { currency, setCurrency, enabled } = useCurrency();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950 border-b border-slate-800 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden text-slate-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link href="/" className="text-2xl font-bold text-white tracking-tight">
            Ma Boutique<span className="text-cyan-400">.</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-slate-300 hover:text-cyan-400 font-medium transition-colors uppercase text-sm tracking-wide">
            Accueil
          </Link>
          <Link href="/articles" className="text-slate-300 hover:text-cyan-400 font-medium transition-colors uppercase text-sm tracking-wide">
            Boutique
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center bg-slate-900 border border-slate-700 rounded-md px-3 py-1">
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48 text-white placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="text-slate-400 hover:text-cyan-400">
                <Search size={18} />
              </button>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-2 text-slate-500">
                <X size={16} />
              </button>
            </form>
          ) : (
            <button onClick={() => setIsSearchOpen(true)} className="text-slate-300 hover:text-cyan-400 p-2">
              <Search size={24} />
            </button>
          )}

          <Link href={currentUser ? '/account' : '/login'} className="text-slate-300 hover:text-cyan-400 p-2">
            <User size={24} />
          </Link>

          {enabled && (
            <select value={currency} onChange={(e) => setCurrency(e.target.value as keyof CurrencyRates)}
              className="text-sm border border-slate-700 rounded-md px-2 py-1 bg-slate-900 text-slate-200" title="Devise">
              <option value="DZD">DZD</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          )}

          <button onClick={() => setIsCartDrawerOpen(true)} className="text-slate-300 hover:text-cyan-400 p-2">
            <CartIcon />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-slate-950 border-b border-slate-800 p-4 shadow-lg flex flex-col gap-4">
          <Link
            href="/"
            className="text-slate-200 font-medium p-2 rounded-md hover:bg-slate-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Accueil
          </Link>
          <Link
            href="/articles"
            className="text-slate-200 font-medium p-2 rounded-md hover:bg-slate-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Boutique
          </Link>
        </div>
      )}

      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </header>
  );
}
