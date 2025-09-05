import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showSuccess } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      showSuccess('Thank you for subscribing to our newsletter.', 'Successfully Subscribed!');
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="section-padding bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white"
        >
          <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="h-10 w-10 text-neutral-300" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-luxury">
            Stay Connected
          </h2>
          <p className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Subscribe to our newsletter for exclusive access to new collections, sophisticated design insights, and curated offers.
            Join our community of discerning customers.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row max-w-lg mx-auto gap-4"
          >
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="form-input w-full text-lg bg-white border-neutral-300 focus:border-neutral-500 focus:ring-neutral-300"
                required
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary btn-lg flex items-center space-x-2 px-8 shadow-xl"
            >
              {isSubscribed ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Subscribe</span>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-neutral-400"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Exclusive Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">No Spam Promise</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">Unsubscribe Anytime</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
