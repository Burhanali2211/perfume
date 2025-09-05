import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import logo from '../../assets/images/logo.png';

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
      links: ['Oudh Attars', 'Floral Attars', 'Musk Attars', 'Amber Attars', 'Sandalwood Attars', 'Heritage Attars'],
    },
    {
      title: 'Quick Links',
      links: ['New Arrivals', 'Best Sellers', 'Sale', 'Brands', 'Gift Cards', 'Wishlist'],
    },
  ];

  return (
    <footer className="bg-neutral-900 text-text-inverse">
      <div className="container-luxury section-padding">
        {/* Updated grid layout for better responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 md:gap-10 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-8 h-8 object-contain"
              />
              <h3 className="text-2xl font-semibold text-text-inverse font-luxury">S.Essences</h3>
            </div>
            <p className="text-neutral-300 mb-8 leading-relaxed max-w-md">
              Your destination for curated excellence. We bring together the finest products with uncompromising quality and sophisticated design.
            </p>
            <div className="flex space-x-4">
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

          {/* Footer Links - Updated for better responsiveness */}
          {footerSections.map((section, index) => (
            <div key={section.title} className={`${index === 0 ? 'md:col-span-1' : ''} ${index === 1 ? 'md:col-span-1' : ''}`}>
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

        {/* Contact Info - Updated for better responsiveness */}
        <div className="border-t border-neutral-800 mt-12 md:mt-16 pt-8 md:pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Mail className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300 text-sm md:text-base">support@sophisticatedcommerce.com</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <Phone className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300 text-sm md:text-base">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-400" />
              </div>
              <span className="text-neutral-300 text-sm md:text-base">123 Commerce St, City, State 12345</span>
            </div>
          </div>
        </div>

        {/* Copyright - Updated for better responsiveness */}
        <div className="border-t border-neutral-800 mt-8 md:mt-12 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-neutral-400 text-sm">
              © 2025 S.Essences. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6 text-sm">
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
