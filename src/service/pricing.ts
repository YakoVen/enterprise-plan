import { FlashSale } from '../interfaces/flash-sale';
import { isSaleLive } from './firebase/database';
import { Article } from '../interfaces/article';

/** Storefront visibility: hide out-of-stock when the setting is on. */
export function isVisibleInStore(a: Article, hideOOS: boolean): boolean {
  if (!hideOOS) return true;
  const stock = a.hasVariants && a.variants?.length
    ? a.variants.reduce((s, v) => s + (v.stock ?? 0), 0)
    : (a.totalStock ?? 1);
  return stock > 0;
}

export interface PricedArticle {
  id: string;
  price: number;
}

export interface SaleInfo {
  sale: FlashSale;
  salePrice: number;
  discountPct: number;
}

/** First live sale covering this article, if any. */
export function getSaleForArticle(articleId: string, sales: FlashSale[], now: Date = new Date()): FlashSale | null {
  return sales.find((s) => isSaleLive(s, now) && s.productIds.includes(articleId)) ?? null;
}

export function applySale(price: number, sale: FlashSale): { salePrice: number; discountPct: number } {
  if (sale.discountType === 'percentage') {
    const discountPct = Math.min(Math.max(sale.value, 0), 90);
    return { salePrice: Math.max(Math.round(price * (1 - discountPct / 100)), 0), discountPct };
  }
  const salePrice = Math.max(price - Math.max(sale.value, 0), 0);
  const discountPct = price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0;
  return { salePrice, discountPct };
}

/** Price customers actually pay right now (sale wins when live). */
export function effectivePrice(article: PricedArticle, sales: FlashSale[], now: Date = new Date()): { price: number; sale: SaleInfo | null } {
  const sale = getSaleForArticle(article.id, sales, now);
  if (!sale) return { price: article.price, sale: null };
  const { salePrice, discountPct } = applySale(article.price, sale);
  return { price: salePrice, sale: { sale, salePrice, discountPct } };
}

/** Revenue attributable to a sale: order items in its products bought inside its window. */
export function saleRevenue(
  sale: FlashSale,
  orders: { items: { articleId: string; price: number; quantity: number }[]; date?: string; type?: string }[]
): number {
  const start = new Date(sale.startsAt).getTime();
  const end = new Date(sale.endsAt).getTime();
  let total = 0;
  for (const o of orders) {
    if (o.type === 'failed' || !o.date) continue;
    const t = new Date(o.date).getTime();
    if (t < start || t > end) continue;
    for (const item of o.items || []) {
      if (sale.productIds.includes(item.articleId)) total += item.price * item.quantity;
    }
  }
  return total;
}
