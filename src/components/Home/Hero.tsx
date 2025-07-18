import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Truck, Users, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';


export const Hero: React.FC = () => {
  const [currentOffer, setCurrentOffer] = useState(0);
  // Rotating offers for scarcity/urgency
  const offers = [
    { text: "Free shipping on orders over $50", icon: Truck },
    { text: "30-day money-back guarantee", icon: Shield },
    { text: "24/7 customer support", icon: Users }
  ];

  // Rotate offers every 4 seconds
  useEffect(() => {
    const offerTimer = setInterval(() => {
      setCurrentOffer(prev => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(offerTimer);
  }, [offers.length]);

  return (
    <section className="relative min-h-screen bg-background-primary overflow-hidden">
      {/* Sophisticated Luxury Background - Minimal and Elegant */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary/30 to-background-primary"></div>

        {/* Minimal geometric pattern - extremely subtle */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23292524' fill-opacity='0.3'%3E%3Cpath d='M60 60c0-16.569-13.431-30-30-30s-30 13.431-30 30 13.431 30 30 30 30-13.431 30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      {/* Refined Trust Bar - Sophisticated and Minimal */}
      <div className="relative z-10 bg-gradient-to-r from-neutral-50 via-background-tertiary to-neutral-50 border-b border-neutral-200/40 py-4 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-12 text-sm">
            <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-neutral-100 rounded-full border border-neutral-200">
                  {React.createElement(offers[currentOffer].icon, { className: "h-4 w-4 text-neutral-600" })}
                </div>
                <span className="font-medium tracking-wide text-neutral-700">{offers[currentOffer].text}</span>
              </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column - Refined Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-8"
          >
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center space-x-3 bg-neutral-50 text-neutral-700 px-4 py-2 rounded-full border border-neutral-200"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Trusted by 50,000+ customers worldwide</span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-neutral-900 leading-tight tracking-tight">
                <span className="block">Sophisticated</span>
                <span className="block text-neutral-600">Commerce</span>
                <span className="block font-medium">Redefined</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl">
                Experience the pinnacle of craftsmanship and design. Each piece in our collection is
                meticulously curated to exceed your highest expectations.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-neutral-600">4.9 from 12,000+ reviews</span>
            </div>

            {/* Call-to-Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/products">
                <button className="btn-primary btn-lg flex items-center space-x-2 shadow-xl hover:shadow-2xl">
                  <span>Explore Collection</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>

              <Link to="/deals">
                <button className="btn-secondary btn-lg">
                  View Deals
                </button>
              </Link>
            </motion.div>

            {/* Security Badges */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2 text-neutral-600">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Secure Checkout</span>
              </div>
              <div className="flex items-center space-x-2 text-neutral-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Lifetime Guarantee</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Product Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&h=600&fit=crop&auto=format&q=90"
                alt="Premium Featured Product"
                className="w-full max-w-lg mx-auto rounded-xl shadow-lg"
              />

              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="absolute -top-4 -right-4 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
              >
                30% OFF
              </motion.div>

              {/* Stock Indicator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border border-neutral-200"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900">In Stock</div>
                    <div className="text-xs text-neutral-600">Limited Edition</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Customer Testimonial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 lg:px-8 pb-16"
      >
        <div className="bg-neutral-50 rounded-xl p-8 max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src="https://api.dicebear.com/8.x/avataaars/svg?seed=Sarah"
              alt="Customer"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-medium text-neutral-900">Sarah Johnson</p>
              <p className="text-sm text-neutral-600">Verified Customer</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <p className="text-neutral-700 leading-relaxed italic">
            "Absolutely exceptional quality and service. Every piece I've purchased has exceeded my expectations."
          </p>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-light text-neutral-900">50K+</p>
              <p className="text-neutral-600 text-sm mt-1">Customers</p>
            </div>
            <div>
              <p className="text-3xl font-light text-neutral-900">10K+</p>
              <p className="text-neutral-600 text-sm mt-1">Products</p>
            </div>
            <div>
              <p className="text-3xl font-light text-neutral-900">99%</p>
              <p className="text-neutral-600 text-sm mt-1">Satisfaction</p>
            </div>
            <div>
              <p className="text-3xl font-light text-neutral-900">24/7</p>
              <p className="text-neutral-600 text-sm mt-1">Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
