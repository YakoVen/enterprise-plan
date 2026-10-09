import { Suspense } from 'react';
import ArticlesListing from '@/components/articles-page/articles-listing';
import { getArticles, getInventorySettings } from '@/service/firebase/database';
import { isVisibleInStore } from '@/service/pricing';

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;
  const [articles, inv] = await Promise.all([getArticles({ active: true }), getInventorySettings()]);
  const visible = articles.filter((a) => isVisibleInStore(a, inv.hideOutOfStock));
  const q = (search || '').toLowerCase();
  const filtered = q
    ? visible.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    : visible;

  return (
    <div>
      <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="h-64 bg-gray-100 rounded-md animate-pulse" /></div>}>
        <ArticlesListing initialArticles={filtered} />
      </Suspense>
    </div>
  );
}
