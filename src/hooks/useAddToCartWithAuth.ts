import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Product } from '../types';

interface UseAddToCartWithAuthReturn {
  handleAddToCart: (product: Product, quantity?: number) => void;
}

export const useAddToCartWithAuth = (): UseAddToCartWithAuthReturn => {
  const { user } = useAuth();
  const { addItem: addToCart } = useCart();
  const { showAuthModal } = useAuthModal();

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    // Check if user is authenticated
    if (user) {
      // User is logged in, add item to cart directly
      addToCart(product, quantity);
    } else {
      // User is not logged in, show authentication modal
      showAuthModal(product, 'cart');
    }
  };

  return {
    handleAddToCart
  };
};