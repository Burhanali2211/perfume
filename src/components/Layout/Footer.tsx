import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Press', 'News', 'Privacy Policy', 'Terms of Service'],
    },
    {
      title: 'Customer Service',
      links: ['Help Center', 'Contact Us', 'Return Policy', 'Size Guide', 'Track Your Order', 'FAQ'],
    },
    {
      title: 'Categories',
      links: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Beauty'],
    },
    {
      title: 'Quick Links',
      links: ['New Arrivals', 'Best Sellers', 'Sale', 'Brands', 'Gift Cards', 'Wishlist'],
    },
  ];

  return (
    <footer className="bg-neutral-900 text-text-inverse">
      <div className="container-luxury section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-semibold text-text-inverse mb-6 font-luxury">Sophisticated Commerce</h3>
            <p className="text-neutral-300 mb-8 leading-relaxed max-w-md">
              Your destination for curated excellence. We bring together the finest products with uncompromising quality and sophisticated design.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-800">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-800">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-800">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200 p-2 rounded-lg hover:bg-neutral-800">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-lg font-medium mb-6 text-text-inverse">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-neutral-300 hover:text-text-inverse transition-colors duration-200 text-sm leading-relaxed">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="border-t border-neutral-800 mt-16 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Mail className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300">support@sophisticatedcommerce.com</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Phone className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300">123 Commerce St, City, State 12345</span>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-neutral-800 mt-12 pt-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            <div className="max-w-md">
              <h4 className="text-xl font-medium mb-3 text-text-inverse">Stay Connected</h4>
              <p className="text-neutral-300 leading-relaxed">Subscribe to our newsletter for exclusive access to new collections and sophisticated design insights.</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="form-input bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-neutral-500 focus:ring-neutral-400 min-w-[300px]"
              />
              <button className="btn-primary btn-lg px-8 whitespace-nowrap shadow-xl">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-neutral-400 text-sm">
              © 2025 Sophisticated Commerce. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200">Terms of Service</a>
              <a href="#" className="text-neutral-400 hover:text-text-inverse transition-colors duration-200">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
