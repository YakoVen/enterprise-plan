'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  XCircle,
  Truck,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  Ticket,
  TrendingUp,
  Star,
  Zap,
  Gift,
  Award,
  RotateCcw,
  Boxes,
  Users,
  Coins
} from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/service/firebase/config';
import { getUserProfile } from '@/service/firebase/database';
import { canAccess, StaffArea } from '@/service/team';

const navItems: { name: string; href: string; icon: typeof LayoutDashboard; area: StaffArea }[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, area: 'orders' },
  { name: 'Analytique', href: '/dashboard/analytics', icon: TrendingUp, area: 'marketing' },
  { name: 'Articles', href: '/dashboard/articles', icon: Package, area: 'articles' },
  { name: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart, area: 'orders' },
  { name: 'Paniers abandonnés', href: '/dashboard/abandoned-carts', icon: AlertTriangle, area: 'orders' },
  { name: 'Commandes échouées', href: '/dashboard/failed-orders', icon: XCircle, area: 'orders' },
  { name: 'Retours', href: '/dashboard/returns', icon: RotateCcw, area: 'orders' },
  { name: 'Livraison', href: '/dashboard/delivery', icon: Truck, area: 'articles' },
  { name: 'Inventaire', href: '/dashboard/inventory', icon: Boxes, area: 'articles' },
  { name: 'Remises', href: '/dashboard/discounts', icon: Tag, area: 'marketing' },
  { name: 'Coupons', href: '/dashboard/coupons', icon: Ticket, area: 'marketing' },
  { name: 'Ventes flash', href: '/dashboard/flash-sales', icon: Zap, area: 'marketing' },
  { name: 'Lots & Packs', href: '/dashboard/bundles', icon: Gift, area: 'marketing' },
  { name: 'Fidélité', href: '/dashboard/loyalty', icon: Award, area: 'marketing' },
  { name: 'Devises', href: '/dashboard/currency', icon: Coins, area: 'settings' },
  { name: 'Avis clients', href: '/dashboard/reviews', icon: Star, area: 'marketing' },
  { name: 'Équipe & Rôles', href: '/dashboard/team', icon: Users, area: 'settings' },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, area: 'settings' },
];

function areaForPath(pathname: string): StaffArea {
  const match = navItems
    .filter((n) => n.href !== '/dashboard' && pathname.startsWith(n.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ? match.area : 'orders';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsAuthenticated(!!user);
        if (user) {
          try {
            const profile = await getUserProfile(user.uid);
            setRole(profile?.role || 'admin');
          } catch {
            setRole('admin');
          }
        } else {
          setRole(null);
        }
        setIsChecking(false);
      });
      return () => unsubscribe();
    } catch {
      // For development without Firebase initialized yet
      setIsChecking(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // Test mode shortcut
      if (email === 'admin@test.com' && password === 'admin123') {
         setIsAuthenticated(true);
         setRole('owner');
      } else {
         setLoginError('Identifiants invalides.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setIsAuthenticated(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-md shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-500 mt-2">Connectez-vous pour accéder au tableau de bord</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button 
              type="submit"
              className="w-full bg-cyan-500 text-slate-950 font-medium py-2.5 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const visibleNav = navItems.filter((item) => canAccess(role || undefined, item.area));
  const allowed = canAccess(role || undefined, areaForPath(pathname));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between">
        <span className="font-bold text-lg">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:flex flex-col w-full md:w-64 bg-slate-950 text-slate-300
        min-h-screen shrink-0
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-white">E-Commerce</h1>
          <p className="text-xs text-indigo-400 mt-1">Enterprise Plan</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-cyan-500 text-slate-950' 
                    : 'hover:bg-slate-800 hover:text-white'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 min-w-0 bg-gray-50 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {allowed ? children : (
            <div className="bg-white rounded-md border p-12 text-center">
              <p className="font-bold text-lg mb-2">Accès restreint</p>
              <p className="text-gray-500 text-sm">Votre rôle ne permet pas d&apos;accéder à cette section.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
