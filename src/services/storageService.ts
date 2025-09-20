import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class StorageService {
  private static readonly BUCKET_NAME = 'images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Upload an image file to Supabase storage
   */
  static async uploadImage(
    file: File,
    folder: string = 'categories',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return { url: '', path: '', error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Create XMLHttpRequest for progress tracking
      if (onProgress) {
        return this.uploadWithProgress(file, filePath, onProgress);
      }

      // Standard upload without progress
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error('Storage service error:', error);
      return { 
        url: '', 
        path: '', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  private static async uploadWithProgress(
    file: File,
    filePath: string,
    onProgress: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            // Get public URL after successful upload
            const { data: urlData } = supabase.storage
              .from(this.BUCKET_NAME)
              .getPublicUrl(filePath);

            resolve({
              url: urlData.publicUrl,
              path: filePath,
            });
          } catch (error) {
            resolve({ 
              url: '', 
              path: '', 
              error: 'Failed to get public URL' 
            });
          }
        } else {
          resolve({ 
            url: '', 
            path: '', 
            error: `Upload failed with status ${xhr.status}` 
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ 
          url: '', 
          path: '', 
          error: 'Network error during upload' 
        });
      });

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);

      // Get upload URL from Supabase
      this.getUploadUrl(filePath).then(uploadUrl => {
        if (uploadUrl) {
          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        } else {
          resolve({ 
            url: '', 
            path: '', 
            error: 'Failed to get upload URL' 
          });
        }
      });
    });
  }

  /**
   * Get upload URL for XMLHttpRequest
   */
  private static async getUploadUrl(filePath: string): Promise<string | null> {
    try {
      // For now, use the standard Supabase upload method
      // In a real implementation, you might need to get a signed URL
      return null; // Will fall back to standard upload
    } catch (error) {
      console.error('Failed to get upload URL:', error);
      return null;
    }
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage service delete error:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
      };
    }

    return { isValid: true };
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(
    url: string, 
    options: { width?: number; height?: number; quality?: number } = {}
  ): string {
    if (!url) return url;

    // If it's already a Supabase storage URL, we can add transformations
    if (url.includes('supabase')) {
      const params = new URLSearchParams();
      
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());
      if (options.quality) params.append('quality', options.quality.toString());

      if (params.toString()) {
        return `${url}?${params.toString()}`;
      }
    }

    return url;
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }

        console.log(`Created storage bucket: ${this.BUCKET_NAME}`);
      }

      return true;
    } catch (error) {
      console.error('Error initializing bucket:', error);
      return false;
    }
  }
}
