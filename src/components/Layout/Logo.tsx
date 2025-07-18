import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Aperture } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex-shrink-0 group">
      <motion.div
        className="flex items-center space-x-3"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Luxury Logo Icon */}
        <motion.div
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-700 shadow-lg group-hover:shadow-xl transition-all duration-300"
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Aperture className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </motion.div>

        {/* Luxury Brand Name */}
        <motion.div className="flex flex-col">
          <h1 className="text-2xl font-display font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-800 transition-colors duration-300">
            Aura
          </h1>
          <span className="text-xs font-medium text-neutral-500 tracking-widest uppercase -mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Luxury
          </span>
        </motion.div>
      </motion.div>
    </Link>
  );
};
