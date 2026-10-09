import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 rounded-lg mx-4 mt-6 md:mt-8 p-8 md:p-16 lg:p-20 shadow-sm border border-slate-800">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#164e63 1px, transparent 1px), linear-gradient(90deg, #164e63 1px, transparent 1px)', backgroundSize: '48px 48px' }}></div>
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"></div>

      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        <span className="inline-flex items-center px-4 py-1.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold text-sm mb-6 border border-cyan-500/30 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
          Nouvelle Collection 2026
        </span>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
          Découvrez notre <span className="text-cyan-400">boutique exclusive</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Trouvez les meilleurs produits tendance avec une livraison rapide sur les 58 wilayas. La qualité et l&apos;élégance à portée de clic en Algérie.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/articles"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-all shadow-lg"
          >
            <ShoppingBag size={20} className="mr-2" />
            Commencer les achats
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-transparent border-2 border-slate-700 hover:border-cyan-400 hover:text-cyan-400 rounded-md transition-all"
          >
            Voir les catégories
            <ArrowRight size={20} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
