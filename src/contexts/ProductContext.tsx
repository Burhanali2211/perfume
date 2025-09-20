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
  supabase,
  createCategory,
  updateCategory,
  deleteCategory
} from '../lib/supabase';
import { useError } from './ErrorContext';
import { productCache, categoryCache, generateCacheKey, invalidateProductCache, invalidateCategoryCache } from '../utils/cache';

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
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const { setError } = useError();

  // Debug: Log initial state
  useEffect(() => {
    console.log('ProductProvider initialized');
  }, []);

  // Debug: Log when products/categories change
  useEffect(() => {
    console.log('Products state updated:', products.length);
  }, [products]);

  useEffect(() => {
    console.log('Categories state updated:', categories.length);
  }, [categories]);

  useEffect(() => {
    console.log('Loading state updated:', { loading, basicLoading, detailsLoading });
  }, [loading, basicLoading, detailsLoading]);

  useEffect(() => {
    console.log('Using mock data state updated:', isUsingMockData);
  }, [isUsingMockData]);

  const fetchCategories = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = generateCacheKey('categories');
      const cachedCategories = categoryCache.get(cacheKey);

      if (cachedCategories) {
        console.log('Using cached categories');
        setCategories(cachedCategories as Category[]);
        return;
      }

      const categoriesData = await getCategories();

      console.log('Using database categories:', categoriesData.length);
      setCategories(categoriesData);
      setIsUsingMockData(false);

      // Cache the results
      categoryCache.set(cacheKey, categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories from database');
      setCategories([]);
      setIsUsingMockData(false);
    }
  }, [setError]);

  const fetchFeaturedProducts = useCallback(async (limit: number = 8) => {
    try {
      setFeaturedLoading(true);
      const cacheKey = generateCacheKey('featured-products', { limit });
      const cached = productCache.get(cacheKey);

      if (cached) {
        console.log('Using cached featured products');
        setFeaturedProducts(cached as Product[]);
        setFeaturedLoading(false);
        return;
      }

      const featuredData = await getFeaturedProducts(limit);

      console.log('Using database featured products:', featuredData.length);
      setFeaturedProducts(featuredData);
      setIsUsingMockData(false);
      productCache.set(cacheKey, featuredData);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setError('Failed to load featured products from database');
      setFeaturedProducts([]);
      setIsUsingMockData(false);
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
        console.log('Using cached products and categories');
        setProducts(cachedProducts as Product[]);
        setCategories(cachedCategories as Category[]);
        setBasicLoading(false);
        setLoading(false);
        return;
      }

      // Try to fetch from database first
      try {
        console.log('Attempting to fetch products from database');
        const [productsResult, categoriesResult] = await Promise.all([
          getProductsBasic({ limit: 50 }),
          getCategories()
        ]);

        console.log('Database fetch results:', { 
          productsCount: productsResult.length, 
          categoriesCount: categoriesResult.length 
        });

        // If we get data from database, use it
        console.log('Using database products');
        setProducts(productsResult);
        productCache.set(productCacheKey, productsResult);
        setIsUsingMockData(false);

        console.log('Using database categories');
        setCategories(categoriesResult);
        categoryCache.set(categoryCacheKey, categoriesResult);
        setIsUsingMockData(false);
      } catch (dbError) {
        // If database fetch fails, show error but don't use mock data
        console.log('Database error:', dbError);
        setError('Failed to load data from database');
        setProducts([]);
        setCategories([]);
        setIsUsingMockData(false);
      }

      setBasicLoading(false);

      // Optionally fetch full product details in background (non-blocking)
      if (!forceRefresh) {
        setDetailsLoading(true);
        setTimeout(async () => {
          try {
            const fullProductsData = await getProducts({ limit: 50 });
            console.log('Fetched full product details:', fullProductsData.length);
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
        console.log('Database error');
        setError('Failed to load data from database');
        setProducts([]);
        setCategories([]);
        setIsUsingMockData(false);
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
      // Try to use database
      const productId = await createProduct(productData);
      if (productId) {
        // Invalidate cache and refresh
        invalidateProductCache();
        await fetchProducts(true);
      } else {
        setError('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Error adding product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateProductData = async (updatedProduct: Product) => {
    try {
      // Try database
      const success = await updateProduct(updatedProduct);
      if (success) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(updatedProduct.id);
        await fetchProducts(true);
      } else {
        setError('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error updating product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const deleteProductData = async (productId: string) => {
    try {
      // Try database
      const success = await deleteProduct(productId);
      if (success) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(productId);
        await fetchProducts(true);
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
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

  const addCategory = async (categoryData: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Try to use database
      const categoryId = await createCategory(categoryData);
      if (categoryId) {
        // Invalidate cache and refresh
        invalidateCategoryCache();
        await fetchCategories();
        return Promise.resolve();
      } else {
        setError('Failed to add category');
        return Promise.reject(new Error('Failed to add category'));
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Error adding category: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return Promise.reject(error);
    }
  };

  const updateCategoryData = async (updatedCategory: Category) => {
    try {
      // Try database
      const success = await updateCategory(updatedCategory);
      if (success) {
        // Invalidate cache and refresh
        invalidateCategoryCache();
        await fetchCategories();
        return Promise.resolve();
      } else {
        setError('Failed to update category');
        return Promise.reject(new Error('Failed to update category'));
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Error updating category: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return Promise.reject(error);
    }
  };

  const deleteCategoryData = async (categoryId: string) => {
    try {
      // Try database
      const success = await deleteCategory(categoryId);
      if (success) {
        // Invalidate cache and refresh
        invalidateCategoryCache();
        await fetchCategories();
        return Promise.resolve();
      } else {
        setError('Failed to delete category - it may have products associated with it');
        return Promise.reject(new Error('Failed to delete category'));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Error deleting category: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return Promise.reject(error);
    }
  };

  // Add the new functions to the context value
  const contextValue: ProductContextType = {
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
    isUsingMockData,
    addCategory,
    updateCategory: updateCategoryData,
    deleteCategory: deleteCategoryData
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};