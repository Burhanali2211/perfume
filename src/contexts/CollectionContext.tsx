import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Collection } from '../types';
import { useNotification } from './NotificationContext';
import { supabase } from '../lib/supabase';

interface CollectionContextType {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  featuredCollections: Collection[];
  activeCollections: Collection[];
  getCollectionById: (id: string) => Collection | undefined;
  getCollectionBySlug: (slug: string) => Collection | undefined;
  addCollection: (collection: Omit<Collection, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  refreshCollections: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

// Mock data for collections
const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Royal Heritage Collection',
    slug: 'royal-heritage',
    description: 'Timeless fragrances inspired by royal traditions and ancient perfumery arts. Each bottle contains centuries of wisdom and craftsmanship, bringing you the essence of royal courts and majestic ceremonies.',
    shortDescription: 'Royal-inspired luxury attars',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    bannerImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
    type: 'heritage',
    status: 'active',
    price: 299,
    originalPrice: 399,
    discount: 25,
    productIds: ['1', '2', '3'],
    productCount: 12,
    featured: true,
    isExclusive: true,
    launchDate: new Date('2024-01-15'),
    sortOrder: 1,
    tags: ['luxury', 'heritage', 'royal', 'exclusive'],
    metaTitle: 'Royal Heritage Collection - Luxury Attars',
    metaDescription: 'Discover our Royal Heritage Collection featuring timeless fragrances inspired by royal traditions.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Seasonal Blossoms',
    slug: 'seasonal-blossoms',
    description: 'Fresh floral compositions that capture the essence of each season. From spring cherry blossoms to autumn roses, experience nature\'s beauty in every drop.',
    shortDescription: 'Seasonal floral fragrances',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    bannerImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    type: 'seasonal',
    status: 'active',
    price: 199,
    originalPrice: 249,
    discount: 20,
    productIds: ['4', '5', '6'],
    productCount: 8,
    featured: true,
    isExclusive: false,
    launchDate: new Date('2024-03-01'),
    endDate: new Date('2024-06-30'),
    sortOrder: 2,
    tags: ['floral', 'seasonal', 'fresh'],
    metaTitle: 'Seasonal Blossoms Collection - Floral Attars',
    metaDescription: 'Experience the beauty of seasonal flowers with our Seasonal Blossoms collection.',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '3',
    name: 'Limited Edition Oud',
    slug: 'limited-oud',
    description: 'Rare and precious oud compositions available for a limited time only. Sourced from the finest agarwood trees, these exclusive blends represent the pinnacle of oud craftsmanship.',
    shortDescription: 'Exclusive limited oud collection',
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400',
    bannerImage: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800',
    type: 'limited',
    status: 'coming_soon',
    price: 599,
    originalPrice: 799,
    discount: 25,
    productIds: ['7', '8'],
    productCount: 5,
    featured: true,
    isExclusive: true,
    launchDate: new Date('2024-12-01'),
    endDate: new Date('2025-02-28'),
    sortOrder: 3,
    tags: ['oud', 'limited', 'premium', 'rare'],
    metaTitle: 'Limited Edition Oud Collection - Rare Attars',
    metaDescription: 'Discover our exclusive Limited Edition Oud collection featuring rare and precious compositions.',
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: '4',
    name: 'Modern Fusion',
    slug: 'modern-fusion',
    description: 'Contemporary blends that merge traditional attars with modern perfumery techniques. Innovation meets tradition in these groundbreaking compositions.',
    shortDescription: 'Modern attar innovations',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=400',
    bannerImage: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800',
    type: 'modern',
    status: 'active',
    price: 249,
    originalPrice: 299,
    discount: 17,
    productIds: ['9', '10', '11'],
    productCount: 10,
    featured: false,
    isExclusive: false,
    sortOrder: 4,
    tags: ['modern', 'fusion', 'contemporary'],
    metaTitle: 'Modern Fusion Collection - Contemporary Attars',
    metaDescription: 'Experience the future of fragrance with our Modern Fusion collection.',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: '5',
    name: 'Signature Classics',
    slug: 'signature-classics',
    description: 'Our most beloved and iconic fragrances that have defined our brand for generations. These timeless classics continue to captivate and inspire.',
    shortDescription: 'Iconic signature fragrances',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
    bannerImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800',
    type: 'signature',
    status: 'active',
    price: 179,
    originalPrice: 199,
    discount: 10,
    productIds: ['12', '13', '14', '15'],
    productCount: 15,
    featured: true,
    isExclusive: false,
    sortOrder: 5,
    tags: ['signature', 'classic', 'bestseller'],
    metaTitle: 'Signature Classics Collection - Iconic Attars',
    metaDescription: 'Discover our most beloved Signature Classics collection featuring iconic fragrances.',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  }
];

interface CollectionProviderProps {
  children: ReactNode;
}

export const CollectionProvider: React.FC<CollectionProviderProps> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  // Fetch collections from database
  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      // If direct login is enabled, use mock data instead of trying to connect to database
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Using mock collections');
        setCollections(mockCollections);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_products(
            product_id,
            products(id, name, price, images)
          )
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Transform database data to match Collection interface
      const transformedCollections: Collection[] = (data || []).map(collection => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        shortDescription: collection.short_description,
        image: collection.image_url || '',
        bannerImage: collection.banner_image_url,
        type: collection.type,
        status: collection.status,
        price: collection.price,
        originalPrice: collection.original_price,
        discount: collection.discount_percentage,
        productIds: collection.collection_products?.map((cp: any) => cp.product_id) || [],
        productCount: collection.collection_products?.length || 0,
        featured: collection.featured,
        isExclusive: collection.is_exclusive,
        launchDate: collection.launch_date ? new Date(collection.launch_date) : undefined,
        endDate: collection.end_date ? new Date(collection.end_date) : undefined,
        sortOrder: collection.sort_order,
        tags: collection.tags || [],
        metaTitle: collection.meta_title,
        metaDescription: collection.meta_description,
        createdAt: new Date(collection.created_at),
        updatedAt: new Date(collection.updated_at)
      }));

      setCollections(transformedCollections);
    } catch (err) {
      setError('Failed to load collections');
      console.error('Error loading collections:', err);
      // Fallback to mock data if database fails
      setCollections(mockCollections);
    } finally {
      setLoading(false);
    }
  };

  // Initialize collections
  useEffect(() => {
    fetchCollections();
  }, []);

  // Computed values
  const featuredCollections = collections.filter(collection => collection.featured);
  const activeCollections = collections.filter(collection => collection.status === 'active');

  // Helper functions
  const getCollectionById = (id: string): Collection | undefined => {
    return collections.find(collection => collection.id === id);
  };

  const getCollectionBySlug = (slug: string): Collection | undefined => {
    return collections.find(collection => collection.slug === slug);
  };

  // CRUD operations
  const addCollection = async (collectionData: Omit<Collection, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>): Promise<Collection> => {
    try {
      // Transform Collection data to database format
      const dbData = {
        name: collectionData.name,
        slug: collectionData.slug || collectionData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: collectionData.description,
        short_description: collectionData.shortDescription,
        image_url: collectionData.image,
        banner_image_url: collectionData.bannerImage,
        type: collectionData.type,
        status: collectionData.status,
        price: collectionData.price,
        original_price: collectionData.originalPrice,
        discount_percentage: collectionData.discount,
        featured: collectionData.featured,
        is_exclusive: collectionData.isExclusive,
        launch_date: collectionData.launchDate?.toISOString(),
        end_date: collectionData.endDate?.toISOString(),
        sort_order: collectionData.sortOrder || 0,
        tags: collectionData.tags,
        meta_title: collectionData.metaTitle,
        meta_description: collectionData.metaDescription
      };

      const { data, error } = await supabase
        .from('collections')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      // Add products to collection if any
      if (collectionData.productIds.length > 0) {
        const collectionProducts = collectionData.productIds.map((productId, index) => ({
          collection_id: data.id,
          product_id: productId,
          sort_order: index
        }));

        const { error: productsError } = await supabase
          .from('collection_products')
          .insert(collectionProducts);

        if (productsError) throw productsError;
      }

      showNotification({
        type: 'success',
        title: 'Collection Created',
        message: `${data.name} has been successfully created.`
      });

      // Refresh collections
      await fetchCollections();

      // Return the created collection
      const newCollection: Collection = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.short_description,
        image: data.image_url || '',
        bannerImage: data.banner_image_url,
        type: data.type,
        status: data.status,
        price: data.price,
        originalPrice: data.original_price,
        discount: data.discount_percentage,
        productIds: collectionData.productIds,
        productCount: collectionData.productIds.length,
        featured: data.featured,
        isExclusive: data.is_exclusive,
        launchDate: data.launch_date ? new Date(data.launch_date) : undefined,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        sortOrder: data.sort_order,
        tags: data.tags || [],
        metaTitle: data.meta_title,
        metaDescription: data.meta_description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return newCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      const errorMessage = 'Failed to create collection';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>): Promise<Collection> => {
    try {
      const existingCollection = getCollectionById(id);
      if (!existingCollection) {
        throw new Error('Collection not found');
      }

      const updatedCollection: Collection = {
        ...existingCollection,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setCollections(prev => prev.map(collection => 
        collection.id === id ? updatedCollection : collection
      ));

      showNotification({
        type: 'success',
        title: 'Collection Updated',
        message: `${updatedCollection.name} has been successfully updated.`
      });

      return updatedCollection;
    } catch (err) {
      const errorMessage = 'Failed to update collection';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const deleteCollection = async (id: string): Promise<void> => {
    try {
      const collection = getCollectionById(id);
      if (!collection) {
        throw new Error('Collection not found');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setCollections(prev => prev.filter(c => c.id !== id));

      showNotification({
        type: 'success',
        title: 'Collection Deleted',
        message: `${collection.name} has been successfully deleted.`
      });
    } catch (err) {
      const errorMessage = 'Failed to delete collection';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: errorMessage
      });
      throw new Error(errorMessage);
    }
  };

  const refreshCollections = async (): Promise<void> => {
    await fetchCollections();
  };

  const value: CollectionContextType = {
    collections,
    loading,
    error,
    featuredCollections,
    activeCollections,
    getCollectionById,
    getCollectionBySlug,
    addCollection,
    updateCollection,
    deleteCollection,
    refreshCollections
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollections = (): CollectionContextType => {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionProvider');
  }
  return context;
};
