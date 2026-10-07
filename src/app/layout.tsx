import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { WishlistProvider } from '../contexts/WishlistContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { store_name, store_description } from '@/service/constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: `%s | ${store_name}`,
    default: store_name,
  },
  description: store_description.substring(0, 160),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CurrencyProvider>
                {children}
                <Toaster position="bottom-right" />
              </CurrencyProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
