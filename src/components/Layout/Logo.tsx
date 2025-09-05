import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
      <img 
        src={logo} 
        alt="Logo" 
        className="w-10 h-10 object-contain"
      />
      <span className="font-bold text-gray-900 text-xl tracking-tight">S.Essences</span>
    </Link>
  );
};
