import React from 'react';
import { Hero } from '../components/Home/Hero';
import { CategorySection } from '../components/Home/CategorySection';
import { FeaturedProducts } from '../components/Home/FeaturedProducts';
import { TrendingSection } from '../components/Home/TrendingSection';
import { RecentlyViewed } from '../components/Home/RecentlyViewed';
import { ProductRecommendations } from '../components/Product/ProductRecommendations';
import { Testimonials } from '../components/Home/Testimonials';
import { NewsletterSection } from '../components/Home/NewsletterSection';
import { useProducts } from '../contexts/ProductContext';
import { HomepageTrustSection } from '../components/Trust';

export const HomePage: React.FC = () => {
  const { categories } = useProducts();

  return (
    <div className="space-y-0">
      <Hero />
      <div className="space-y-12 md:space-y-16">
        <CategorySection categories={categories} />
        <FeaturedProducts />

        {/* Recently Viewed Products */}
        <RecentlyViewed maxItems={6} layout="horizontal" />

        {/* Personalized Recommendations */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductRecommendations
            type="you-may-like"
            title="Recommended for You"
            subtitle="Discover products tailored to your interests"
            maxItems={8}
            layout="grid"
            showAddToCart={true}
          />
        </div>

        <TrendingSection />

        {/* Trust Signals Section */}
        <HomepageTrustSection />

        {/* New Arrivals */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductRecommendations
            type="you-may-like"
            title="New Arrivals"
            subtitle="Fresh products just added to our collection"
            maxItems={6}
            layout="horizontal"
            showAddToCart={true}
          />
        </div>

        <Testimonials />
        <NewsletterSection />
      </div>
    </div>
  );
};
