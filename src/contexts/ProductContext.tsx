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
import { adminService } from '../services/adminService';
import { productService, categoryService } from '../services/backendService';
import { deduplicateRequest, batchRequests } from '../utils/apiOptimizer';

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

  // Initialize provider with optimized loading
  useEffect(() => {
    console.log('ProductProvider initialized');

    // Only set up subscriptions after initial load to prevent conflicts
    let subscriptionsInitialized = false;

    const initializeSubscriptions = () => {
      if (subscriptionsInitialized) return;
      subscriptionsInitialized = true;

      // Set up real-time subscriptions for products and categories
      const productSubscription = adminService.subscribeToUpdates('products', (payload) => {
        console.log('Real-time product update:', payload);
        // Debounce refresh to prevent excessive calls
        setTimeout(() => fetchProducts(true), 1000);
      });

      const categorySubscription = adminService.subscribeToUpdates('categories', (payload) => {
        console.log('Real-time category update:', payload);
        // Debounce refresh to prevent excessive calls
        setTimeout(() => fetchCategories(), 1000);
      });
    };

    // Initialize subscriptions after a delay to prevent blocking initial load
    const subscriptionTimer = setTimeout(initializeSubscriptions, 3000);

    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(subscriptionTimer);
      adminService.cleanup();
    };
  }, []); // Empty dependency array to prevent re-initialization

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

      // Use API optimizer to deduplicate requests
      const featuredData = await deduplicateRequest(
        `featured-products-${limit}`,
        () => getFeaturedProducts(limit)
      );

      console.log('Using featured products:', featuredData.length);
      setFeaturedProducts(featuredData);
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setError('Failed to load featured products from database');
      setFeaturedProducts([]);
      setIsUsingMockData(false);
    } finally {
      setFeaturedLoading(false);
    }
  }, [setError]);

  // Optimized loading: fetch products and categories with better error handling
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (loading && !forceRefresh) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

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
        setIsUsingMockData(false);
        return;
      }

      // If direct login is enabled, use mock data instead of trying to connect to database
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Using mock data');
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Oudh Attar',
            slug: 'oudh-attar',
            description: 'Premium Cambodian Oudh attar with long-lasting fragrance',
            shortDescription: 'Luxury Oudh fragrance',
            price: 85.99,
            originalPrice: 99.99,
            images: ['/images/products/oudh-attar.jpg'],
            stock: 25,
            minStockLevel: 5,
            sku: 'ATT-OUDH-001',
            weight: 0.03,
            dimensions: { length: 5, width: 3, height: 3 },
            rating: 4.8,
            reviewCount: 42,
            reviews: [],
            categoryId: 'oudh',
            category: 'Oudh Attars',
            sellerId: 'seller-1',
            sellerName: 'Sufi Essences',
            tags: ['oudh', 'luxury', 'long-lasting'],
            specifications: {
              concentration: '100% Natural',
              bottleSize: '30ml',
              origin: 'Cambodia'
            },
            featured: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Rose Attar',
            slug: 'rose-attar',
            description: 'Pure Bulgarian rose attar with delicate floral notes',
            shortDescription: 'Delicate floral fragrance',
            price: 65.50,
            originalPrice: 75.00,
            images: ['/images/products/rose-attar.jpg'],
            stock: 30,
            minStockLevel: 5,
            sku: 'ATT-ROSE-001',
            weight: 0.03,
            dimensions: { length: 5, width: 3, height: 3 },
            rating: 4.6,
            reviewCount: 28,
            reviews: [],
            categoryId: 'floral',
            category: 'Floral Attars',
            sellerId: 'seller-1',
            sellerName: 'Sufi Essences',
            tags: ['rose', 'floral', 'delicate'],
            specifications: {
              concentration: '100% Natural',
              bottleSize: '30ml',
              origin: 'Bulgaria'
            },
            featured: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Sandalwood Attar',
            slug: 'sandalwood-attar',
            description: 'Rich Indian sandalwood attar with warm, woody notes',
            shortDescription: 'Warm woody fragrance',
            price: 72.99,
            originalPrice: 82.99,
            images: ['/images/products/sandalwood-attar.jpg'],
            stock: 20,
            minStockLevel: 5,
            sku: 'ATT-SANDAL-001',
            weight: 0.03,
            dimensions: { length: 5, width: 3, height: 3 },
            rating: 4.7,
            reviewCount: 35,
            reviews: [],
            categoryId: 'woody',
            category: 'Woody Attars',
            sellerId: 'seller-1',
            sellerName: 'Sufi Essences',
            tags: ['sandalwood', 'woody', 'warm'],
            specifications: {
              concentration: '100% Natural',
              bottleSize: '30ml',
              origin: 'India'
            },
            featured: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const mockCategories: Category[] = [
          {
            id: 'oudh',
            name: 'Oudh Attars',
            slug: 'oudh-attars',
            description: 'Premium Oudh-based fragrances',
            image: '/images/categories/oudh-category.jpg',
            productCount: 15,
            parentId: undefined,
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'floral',
            name: 'Floral Attars',
            slug: 'floral-attars',
            description: 'Delicate floral fragrances',
            image: '/images/categories/floral-category.jpg',
            productCount: 12,
            parentId: undefined,
            sortOrder: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'woody',
            name: 'Woody Attars',
            slug: 'woody-attars',
            description: 'Warm and earthy woody fragrances',
            image: '/images/categories/woody-category.jpg',
            productCount: 10,
            parentId: undefined,
            sortOrder: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        setProducts(mockProducts);
        setCategories(mockCategories);
        setIsUsingMockData(true);
        setBasicLoading(false);
        setLoading(false);
        return;
      }

      // Try to fetch from database with timeout
      console.log('Attempting to fetch products from database');

      const fetchWithTimeout = async (promise: Promise<any>, timeout = 30000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      try {
        // Use API optimizer to deduplicate and batch requests
        const [productsResult, categoriesResult] = await batchRequests([
          {
            key: 'products-basic-20',
            fn: () => getProductsBasic({ limit: 20 })
          },
          {
            key: 'categories-all',
            fn: () => getCategories()
          }
        ]);

        console.log('Database fetch results:', {
          productsCount: productsResult.length,
          categoriesCount: categoriesResult.length
        });

        // If we get data from database, use it
        setProducts(productsResult);
        productCache.set(productCacheKey, productsResult);

        setCategories(categoriesResult);
        categoryCache.set(categoryCacheKey, categoriesResult);
        setIsUsingMockData(false);

        setBasicLoading(false);

        // Fetch additional products in background if needed
        if (!forceRefresh && productsResult.length >= 20) {
          setTimeout(async () => {
            try {
              setDetailsLoading(true);
              const additionalProducts = await getProductsBasic({ limit: 50, offset: 20 });
              if (additionalProducts.length > 0) {
                setProducts(prev => [...prev, ...additionalProducts]);
                productCache.set('products-full', [...productsResult, ...additionalProducts]);
              }
            } catch (detailError) {
              console.warn('Failed to fetch additional products:', detailError);
            } finally {
              setDetailsLoading(false);
            }
          }, 2000); // Delay to not block UI
        }

      } catch (dbError) {
        console.error('Database fetch error:', dbError);

        if (dbError instanceof Error && dbError.message.includes('infinite recursion')) {
          setError('DATABASE SETUP ERROR: Your database security policies are causing an infinite loop. Please run the provided SQL script in your Supabase SQL Editor to fix it.');
        } else if (dbError instanceof Error && dbError.message.includes('timeout')) {
          setError('Database connection timeout. Please check your internet connection.');
        } else {
          setError('Failed to load data from database. Please try refreshing the page.');
        }

        setProducts([]);
        setCategories([]);
        setIsUsingMockData(false);
      }

    } catch (error) {
      console.error('Error in fetchProducts:', error);
      setError('An unexpected error occurred while loading data.');
      setProducts([]);
      setCategories([]);
      setIsUsingMockData(false);
    } finally {
      setLoading(false);
      setBasicLoading(false);
    }
  }, [setError, loading]); // Added loading to dependencies to prevent race conditions



  // Initial data fetch - only run once on mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isMounted) {
        await fetchProducts();
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  // Featured products fetch - only run once on mount
  useEffect(() => {
    let isMounted = true;

    const initializeFeatured = async () => {
      if (isMounted) {
        await fetchFeaturedProducts();
      }
    };

    initializeFeatured();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) => {
    try {
      // Use enhanced backend service with validation
      const newProduct = await productService.create(productData);
      if (newProduct) {
        // Invalidate cache and refresh
        invalidateProductCache();
        await fetchProducts(true);
        console.log('✅ Product created successfully:', newProduct);
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
      // Use enhanced backend service with validation
      const result = await productService.update(updatedProduct.id, updatedProduct);
      if (result) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(updatedProduct.id);
        await fetchProducts(true);
        console.log('✅ Product updated successfully:', result);
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
      // Use enhanced backend service
      const success = await productService.delete(productId);
      if (success) {
        // Invalidate cache for this specific product and refresh
        invalidateProductCache(productId);
        await fetchProducts(true);
        console.log('✅ Product deleted successfully');
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
      const success = await addReview(review);
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
      const success = await updateCategory(updatedCategory.id, updatedCategory);
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