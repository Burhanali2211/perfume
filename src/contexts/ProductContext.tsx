import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, ProductContextType, Review, Category } from '../types';
import {
  getProducts,
  getProductsBasic,
  getProductsMinimal,
  getFeaturedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  supabase
} from '../lib/supabase';
import { useError } from './ErrorContext';
import { productCache, categoryCache, generateCacheKey, invalidateProductCache } from '../utils/cache';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [basicLoading, setBasicLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const { setError } = useError();

  const fetchCategories = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = generateCacheKey('categories');
      const cachedCategories = categoryCache.get(cacheKey);

      if (cachedCategories) {
        setCategories(cachedCategories);
        return;
      }

      const categoriesData = await getCategories();
      setCategories(categoriesData);

      // Cache the results
      categoryCache.set(cacheKey, categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories. Please check your database connection.');
    }
  }, [setError]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 8) => {
    try {
      setFeaturedLoading(true);
      const cacheKey = generateCacheKey('featured-products', { limit });
      const cached = productCache.get(cacheKey);

      if (cached) {
        setFeaturedProducts(cached);
        setFeaturedLoading(false);
        return;
      }

      const featuredData = await getFeaturedProducts(limit);
      setFeaturedProducts(featuredData);
      productCache.set(cacheKey, featuredData);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setError('Failed to fetch featured products. Please check your database connection.');
    } finally {
      setFeaturedLoading(false);
    }
  }, [setError]);

  // Optimized loading: fetch products and categories in parallel
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setBasicLoading(true);

    try {
      // Check cache first (unless force refresh)
      const productCacheKey = generateCacheKey('products-basic');
      const categoryCacheKey = generateCacheKey('categories');

      const cachedProducts = !forceRefresh ? productCache.get(productCacheKey) : null;
      const cachedCategories = !forceRefresh ? categoryCache.get(categoryCacheKey) : null;

      if (cachedProducts && cachedCategories) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setBasicLoading(false);
        setLoading(false);
        return;
      }

      // Fetch products and categories in parallel for better performance
      const [productsResult, categoriesResult] = await Promise.allSettled([
        cachedProducts ? Promise.resolve(cachedProducts) : getProductsBasic({ limit: 20 }),
        cachedCategories ? Promise.resolve(cachedCategories) : getCategories()
      ]);

      // Handle products result
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value);
        if (!cachedProducts) {
          productCache.set(productCacheKey, productsResult.value);
        }
      } else {
        console.error('Failed to fetch products:', productsResult.reason);
        throw productsResult.reason;
      }

      // Handle categories result
      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value);
        if (!cachedCategories) {
          categoryCache.set(categoryCacheKey, categoriesResult.value);
        }
      } else {
        console.warn('Failed to fetch categories:', categoriesResult.reason);
        // Don't fail the entire operation if categories fail
      }

      setBasicLoading(false);

      // Optionally fetch full product details in background (non-blocking)
      if (!forceRefresh) {
        setDetailsLoading(true);
        setTimeout(async () => {
          try {
            const fullProductsData = await getProducts({ limit: 20 });
            setProducts(fullProductsData);
            productCache.set('products-full', fullProductsData);
          } catch (detailError) {
            console.warn('Failed to fetch full product details, using basic data:', detailError);
          } finally {
            setDetailsLoading(false);
          }
        }, 100); // Small delay to not block UI
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('infinite recursion')) {
        setError('DATABASE SETUP ERROR: Your database security policies are causing an infinite loop. This is a common setup issue. Please run the provided SQL script in your Supabase SQL Editor to fix it.');
      } else {
        setError('Failed to fetch products. Please check your database connection.');
      }
      console.error('Error fetching products:', error);
      setBasicLoading(false);
      setDetailsLoading(false);
    }
    setLoading(false);
  }, [setError]);



  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => {
    try {
      const productId = await createProduct(productData);
      if (productId) {
        // Invalidate cache and refresh
        invalidateProductCache();
        await fetchProducts(true);
      } else {
        setError('Failed to add product');
      }
    } catch (error) {
      setError('Error adding product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateProductData = async (updatedProduct: Product) => {
    try {
      const success = await updateProduct(updatedProduct);
      if (success) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(updatedProduct.id);
        await fetchProducts(true);
      } else {
        setError('Failed to update product');
      }
    } catch (error) {
      setError('Error updating product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const deleteProductData = async (productId: string) => {
    try {
      const success = await deleteProduct(productId);
      if (success) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(productId);
        await fetchProducts(true);
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      setError('Error deleting product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fetchReviewsForProduct = async (productId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      return data as Review[];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  };

  const submitReview = async (review: Omit<Review, 'id' | 'createdAt' | 'profiles'>) => {
    try {
      const success = await addReview(review.productId || review.product_id!, review.rating, review.comment || '', review.title);
      if (!success) {
        setError('Failed to submit review');
      }
    } catch (error) {
      setError('Error submitting review: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const value: ProductContextType = {
    products,
    featuredProducts,
    categories,
    addProduct,
    updateProduct: updateProductData,
    deleteProduct: deleteProductData,
    fetchReviewsForProduct,
    submitReview,
    fetchProducts,
    fetchCategories,
    fetchFeaturedProducts,
    loading,
    basicLoading,
    detailsLoading,
    featuredLoading,
    isUsingMockData: false // We're using real database data
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};
