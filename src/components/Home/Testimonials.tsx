import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonialsData = [
  {
    quote: "This is the best online store I've ever used. The quality is amazing and the shipping is incredibly fast. I'm a customer for life!",
    name: 'Sarah Johnson',
    role: 'Fashion Blogger',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
  {
    quote: "I was skeptical at first, but ShopHub exceeded all my expectations. The customer service is top-notch and the product selection is vast.",
    name: 'Michael Chen',
    role: 'Tech Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
  {
    quote: "A fantastic shopping experience from start to finish. The website is beautiful and easy to navigate. Highly recommended!",
    name: 'Emily Rodriguez',
    role: 'Home Decorator',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
    rating: 5,
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Loved by Thousands
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            See what our happy customers have to say about their experience with ShopHub.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 flex flex-col"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 text-lg leading-relaxed flex-grow">
                "{testimonial.quote}"
              </blockquote>
              <div className="mt-8 flex items-center">
                <img src={testimonial.avatar} alt={testimonial.name} className="h-14 w-14 rounded-full object-cover" />
                <div className="ml-4">
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
