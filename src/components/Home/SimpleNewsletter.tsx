import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Gift, Bell, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

export const SimpleNewsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showSuccess } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      showSuccess('Check your email for a special discount code.', 'Welcome to our VIP Club!');
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  const benefits = [
    {
      icon: Gift,
      title: "Exclusive Deals",
      description: "Get 20% off your first order + early access to sales"
    },
    {
      icon: Bell,
      title: "New Arrivals",
      description: "Be the first to know about new products and collections"
    },
    {
      icon: Star,
      title: "VIP Treatment",
      description: "Priority customer support and special member perks"
    }
  ];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-5 sm:top-10 left-5 sm:left-10 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-5 sm:bottom-10 right-5 sm:right-10 w-24 sm:w-32 h-24 sm:h-32 bg-blue-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 h-32 sm:h-48 bg-purple-400 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-center">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center space-x-1.5 sm:space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-medium text-xs sm:text-sm">Newsletter Exclusive</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                Join Our VIP
                <span className="block bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Shopping Club
                </span>
              </h2>
              
              <p className="text-sm sm:text-base md:text-lg opacity-90 leading-relaxed">
                Get insider access to exclusive deals, early product launches, and personalized shopping recommendations.
              </p>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-2.5 sm:space-x-3"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold mb-0.5">{benefit.title}</h3>
                    <p className="text-xs sm:text-sm opacity-80">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Right Side - Subscription Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/20"
          >
            {!isSubscribed ? (
              <div className="space-y-4 sm:space-y-5">
                <div className="text-center space-y-2.5 sm:space-y-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto">
                    <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">Get 20% Off</h3>
                  <p className="text-xs sm:text-sm opacity-80">Subscribe now and receive an instant discount on your first order!</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-3 sm:space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 text-xs sm:text-sm"
                      required
                    />
                    
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-gray-900 font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-1.5 active:from-yellow-500 active:to-pink-600 touch-manipulation"
                    >
                      <span>Join VIP Club</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </motion.button>
                  </div>
                  
                  <p className="text-[10px] sm:text-xs opacity-70 text-center">
                    No spam, unsubscribe anytime. Your email is safe with us.
                  </p>
                </form>
                
                <div className="flex items-center justify-center space-x-3 sm:space-x-4 pt-2.5 sm:pt-3 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold">250K+</p>
                    <p className="text-[10px] sm:text-xs opacity-70">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold">4.9⭐</p>
                    <p className="text-[10px] sm:text-xs opacity-70">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold">Daily</p>
                    <p className="text-[10px] sm:text-xs opacity-70">Deals</p>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 sm:space-y-5"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1.5">Welcome to the VIP Club!</h3>
                  <p className="text-xs sm:text-sm opacity-80">Check your email for your exclusive 20% discount code.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <p className="font-semibold mb-1.5 text-xs sm:text-sm">What happens next?</p>
                  <ul className="text-[10px] sm:text-xs opacity-80 space-y-1">
                    <li>• Instant 20% discount code in your inbox</li>
                    <li>• Weekly exclusive deals and offers</li>
                    <li>• Early access to new collections</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};