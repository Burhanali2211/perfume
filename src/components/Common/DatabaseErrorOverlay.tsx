import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useError } from '../../contexts/ErrorContext';

export const DatabaseErrorOverlay: React.FC = () => {
  const { error, setError } = useError();

  if (!error) return null;

  return (
    <div className="fixed inset-0 bg-red-900/95 text-white z-[200] flex items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-yellow-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Database Configuration Required</h1>
        <p className="text-xl text-red-100 mb-8">
          The application has detected a critical error with your database setup. This is caused by incorrect security policies that create an infinite loop.
        </p>
        <div className="bg-black/30 p-6 rounded-lg text-left font-mono text-sm mb-8">
          <p className="font-bold text-yellow-300 mb-2">&gt; Error Details:</p>
          <p>{error}</p>
        </div>
        <p className="text-lg text-red-100 mb-8">
          To fix this, you must run the provided SQL script in your Supabase project's SQL Editor. Please refer to the instructions provided.
        </p>
        <button
          onClick={() => setError(null)}
          className="bg-yellow-400 text-red-900 font-bold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors flex items-center mx-auto"
        >
          <X className="mr-2 h-5 w-5" />
          I will try to fix it (Dismiss)
        </button>
      </div>
    </div>
  );
};
