import React from 'react';
import LayoutWrapper from '@/components/general/layout-wrapper';
import WelcomeSection from '@/components/landingpage/welcom-section';
import CategoriesPreviews from '@/components/landingpage/categories-previews';
import FeaturedProducts from '@/components/landingpage/featured-products';
import RatingsPreview from '@/components/landingpage/ratings-preview';
import StoreSection from '@/components/landingpage/store-section';
import SuggestionsPreview from '@/components/landingpage/suggestions-preview';
import { getArticles, getInventorySettings } from '@/service/firebase/database';
import { Article } from '@/interfaces/article';
import { isVisibleInStore } from '@/service/pricing';
import FlashBanner from '@/components/storefront/flash-banner';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let activeArticles: Article[] = [];

  try {
    const [articles, inv] = await Promise.all([getArticles({ active: true }), getInventorySettings()]);
    activeArticles = articles.filter((a) => isVisibleInStore(a, inv.hideOutOfStock));
  } catch {
    // Firebase not configured yet — use empty array
  }

  const featured = activeArticles.slice(0, 10);
  const suggested = activeArticles.slice(10, 14);

  return (
    <LayoutWrapper>
      <FlashBanner />
      <WelcomeSection />
      <StoreSection />
      <CategoriesPreviews />
      <FeaturedProducts products={featured} />
      <RatingsPreview />
      {suggested.length > 0 && <SuggestionsPreview products={suggested} />}
    </LayoutWrapper>
  );
}
