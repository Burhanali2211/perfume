import { useAuth } from '../contexts/AuthContext';
import { useCompare } from '../contexts/CompareContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Product } from '../types';

interface UseAddToCompareWithAuthReturn {
  handleAddToCompare: (product: Product) => void;
}

export const useAddToCompareWithAuth = (): UseAddToCompareWithAuthReturn => {
  const { user } = useAuth();
  const { addItem: addToCompare } = useCompare();
  const { showAuthModal } = useAuthModal();

  const handleAddToCompare = (product: Product) => {
    // Check if user is authenticated
    if (user) {
      // User is logged in, add item to compare directly
      addToCompare(product);
    } else {
      // User is not logged in, show authentication modal
      showAuthModal(product, 'compare');
    }
  };

  return {
    handleAddToCompare
  };
};