'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import LayoutWrapper from '@/components/general/layout-wrapper';

export default function NotFound() {
  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-32 h-32 bg-cyan-50 rounded-full flex items-center justify-center mb-8 relative">
          <span className="text-6xl font-black text-cyan-600">404</span>
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-8 h-8 bg-purple-100 rounded-full blur-sm"></div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Page introuvable
        </h1>
        
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-10">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-all shadow-md hover:shadow-cyan-200"
          >
            <Home size={20} className="mr-2" />
            Retour à l&apos;accueil
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-cyan-700 bg-white border-2 border-cyan-100 hover:border-cyan-600 hover:bg-cyan-50 rounded-md transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            Page précédente
          </button>
        </div>
      </div>
    </LayoutWrapper>
  );
}
