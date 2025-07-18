import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text, 
  overlay = false, 
  className = '' 
}) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
      <Loader className={`${sizes[size]} text-primary animate-spin`} />
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};
