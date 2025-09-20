import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Collection } from '../types';
import { useNotification } from './NotificationContext';

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

  // Initialize collections
  useEffect(() => {
    const initializeCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, this would be an API call
        setCollections(mockCollections);
      } catch (err) {
        setError('Failed to load collections');
        console.error('Error loading collections:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeCollections();
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
      const newCollection: Collection = {
        ...collectionData,
        id: Date.now().toString(),
        productCount: collectionData.productIds.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setCollections(prev => [...prev, newCollection]);
      
      showNotification({
        type: 'success',
        title: 'Collection Created',
        message: `${newCollection.name} has been successfully created.`
      });

      return newCollection;
    } catch (err) {
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
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, this would refetch from the API
      setCollections([...mockCollections]);

      showNotification({
        type: 'success',
        title: 'Collections Refreshed',
        message: 'Collection data has been refreshed successfully.'
      });
    } catch (err) {
      const errorMessage = 'Failed to refresh collections';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
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
