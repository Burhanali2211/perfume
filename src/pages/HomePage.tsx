import React from 'react';
import { Hero } from '../components/Home/Hero';
import { CategorySection } from '../components/Home/CategorySection';
import { FeaturedProducts } from '../components/Home/FeaturedProducts';
import { TrendingSection } from '../components/Home/TrendingSection';
import { Testimonials } from '../components/Home/Testimonials';
import { RecentlyViewed } from '../components/Home/RecentlyViewed';
import { useProducts } from '../contexts/ProductContext';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Star, Truck, ShieldCheck, Clock, Headphones, Zap, Award, Users, Heart, CheckCircle, Gift, Globe, Sparkles, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

// Import banner images
import oudhCollectionBanner from '../assets/images/banners/oudh-collection-banner.jpg';
import seasonalAttarsBanner from '../assets/images/banners/seasonal-attars-banner.jpg';
import heritageBlendsBanner from '../assets/images/banners/heritage-blends-banner.jpg';
import brandStoryImage from '../assets/images/homepage/brand-story.jpg';

// Promotional Banners Section - Attar-focused offers with enhanced mobile responsiveness
const PromotionalBanners: React.FC = () => {
  const banners = [
    {
      id: 1,
      title: "Premium Oudh Collection",
      subtitle: "Authentic Cambodian & Indian Oudh",
      discount: "Up to 25% Off",
      cta: "Shop Oudh",
      link: "/categories/oudh-attars",
      bgColor: "from-purple-600 to-indigo-700",
      icon: Crown,
      image: oudhCollectionBanner
    },
    {
      id: 2,
      title: "Seasonal Attars",
      subtitle: "Limited Edition Spring Collection",
      discount: "New Arrivals",
      cta: "Explore Now",
      link: "/categories/seasonal-attars",
      bgColor: "from-blue-600 to-purple-600",
      icon: Sparkles,
      image: seasonalAttarsBanner
    },
    {
      id: 3,
      title: "Heritage Blends",
      subtitle: "Traditional Attar Craftsmanship",
      discount: "Free Shipping",
      cta: "Discover",
      link: "/categories/heritage-attars",
      bgColor: "from-indigo-600 to-blue-700",
      icon: Award,
      image: heritageBlendsBanner
    }
  ];

  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header - Enhanced Mobile Responsiveness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Exclusive Attar Collections
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-3 sm:px-0 leading-relaxed">
            Discover our curated selection of premium attars from renowned houses worldwide
          </p>
        </motion.div>

        {/* Enhanced Mobile-First Responsive Banner Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 touch-manipulation active:scale-[0.98]"
            >
              {/* Background with Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgColor}`} />
              
              {/* Background Image */}
              <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              
              {/* Content with Mobile-Optimized Layout */}
              <div className="relative p-3 sm:p-4 md:p-5 lg:p-6 h-36 sm:h-40 md:h-44 lg:h-52 xl:h-56 flex flex-col justify-between text-white">
                {/* Top Section */}
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                    <banner.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-300" />
                    <span className="text-[10px] sm:text-xs font-medium text-yellow-300 uppercase tracking-wider">
                      {banner.discount}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 leading-tight">
                    {banner.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2">
                    {banner.subtitle}
                  </p>
                </div>
                
                {/* Mobile-Optimized CTA Button */}
                <Link to={banner.link} className="inline-block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm hover:bg-white/30 transition-all duration-300 flex items-center space-x-1.5 group-hover:shadow-md active:bg-white/40 touch-manipulation"
                  >
                    <span>{banner.cta}</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
              
              {/* Decorative Elements - Responsive */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 rounded-full blur-lg" />
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-300/20 rounded-full blur-md" />
            </motion.div>
          ))}
        </div>

        {/* Enhanced Mobile-Friendly Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6 sm:mt-8 md:mt-10"
        >
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-1.5 mx-auto active:from-purple-700 active:to-purple-800 touch-manipulation"
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>View All Collections</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Special Offers Section with consistent blue theme
const SpecialOffers: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="container-luxury relative px-4 sm:px-6 lg:px-8">
        <div className="text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-2 mb-4 sm:mb-6"
          >
            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
            <span className="text-sm sm:text-base lg:text-lg font-semibold text-blue-100">Special Offers</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
          >
            Exclusive Member Benefits
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base lg:text-lg opacity-90 mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed"
          >
            Join our community and unlock premium features, early access, and exclusive discounts
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-purple-600 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center active:bg-gray-100 touch-manipulation"
              >
                <span>Shop Collection</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Brand Story Section with enhanced mobile responsiveness
const BrandStory: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4 sm:space-y-6 order-2 lg:order-1"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center space-x-1.5 sm:space-x-2 text-blue-600 font-medium">
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Our Story</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Connecting You to
                <span className="text-blue-600"> Quality & Trust</span>
              </h2>
              
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Founded with a vision to revolutionize online shopping, we've built relationships with premium brands worldwide to bring you authentic, high-quality products at competitive prices.
              </p>
              
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Every product in our catalog is carefully vetted, every seller thoroughly verified, and every transaction secured with industry-leading protection.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1.5 sm:mb-2" />
                <div className="text-lg sm:text-xl font-bold text-gray-900">1M+</div>
                <div className="text-[10px] sm:text-xs text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 mx-auto mb-1.5 sm:mb-2" />
                <div className="text-lg sm:text-xl font-bold text-gray-900">50K+</div>
                <div className="text-[10px] sm:text-xs text-gray-600">Premium Products</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <img
              src={brandStoryImage}
              alt="Our Brand Story"
              className="w-full rounded-xl sm:rounded-2xl shadow-lg"
            />
            
            <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100 max-w-[200px] sm:max-w-[240px]">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">Quality Guaranteed</p>
                  <p className="text-[10px] sm:text-xs text-gray-600">100% Authentic Products</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Enhanced Value Proposition with mobile-first responsive design
const EnhancedValueProposition: React.FC = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Bank-Level Security",
      description: "Your data and payments protected with military-grade encryption",
      stats: "99.9% Secure"
    },
    {
      icon: Zap,
      title: "Lightning Fast Delivery",
      description: "Same-day delivery in major cities, 2-day shipping nationwide",
      stats: "24-48 Hours"
    },
    {
      icon: Star,
      title: "Premium Quality",
      description: "Hand-picked products from verified premium brands worldwide",
      stats: "4.9/5 Rating"
    },
    {
      icon: Headphones,
      title: "24/7 Expert Support",
      description: "Dedicated customer success team ready to help anytime",
      stats: "<2 Min Response"
    }
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4"
          >
            Why Choose Us?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-3 sm:px-0"
          >
            We've reimagined every aspect of online shopping to deliver an experience that exceeds your expectations.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group text-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:shadow-md border border-transparent hover:border-gray-100 touch-manipulation active:bg-gray-100"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              
              <div className="mb-2 sm:mb-3">
                <div className="text-base sm:text-lg font-bold text-blue-600 mb-1">{feature.stats}</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  {feature.title}
                </h3>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const HomePage: React.FC = () => {
  const { categories, loading } = useProducts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Luxury Perfume Hero Section */}
      <Hero />
      
      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <CategorySection categories={categories} />
      )}

      {/* Promotional Banners */}
      <PromotionalBanners />

      {/* Featured Products */}
      <FeaturedProducts />
      
      {/* Brand Story */}
      <BrandStory />

      {/* Trending Section */}
      <TrendingSection />
      
      {/* Recently Viewed (if user has viewed products) */}
      <RecentlyViewed maxItems={6} className="bg-gray-50" />

      {/* Enhanced Value Proposition */}
      <EnhancedValueProposition />
      
      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      {/* <SimpleNewsletter /> */}
    </div>
  );
};

export default HomePage;
