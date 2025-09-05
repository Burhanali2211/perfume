import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageService, UploadProgress } from '../../services/storageService';
import { useNotification } from '../../contexts/NotificationContext';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onPathChange?: (path: string) => void;
  folder?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUrlInput?: boolean;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onPathChange,
  folder = 'categories',
  placeholder = 'Upload an image or enter URL',
  className = '',
  disabled = false,
  showUrlInput = true,
  aspectRatio = 'auto',
  maxWidth = 400,
  maxHeight = 300
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [urlInput, setUrlInput] = useState(value);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      showNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please drop an image file'
      });
    }
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(null);

    try {
      const result = await StorageService.uploadImage(
        file,
        folder,
        (progress) => setUploadProgress(progress)
      );

      if (result.error) {
        showNotification({
          type: 'error',
          title: 'Upload Failed',
          message: result.error
        });
      } else {
        onChange(result.url);
        onPathChange?.(result.path);
        setUrlInput(result.url);
        showNotification({
          type: 'success',
          title: 'Upload Successful',
          message: 'Image uploaded successfully'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Upload Error',
        message: error instanceof Error ? error.message : 'Failed to upload image'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlField(false);
      showNotification({
        type: 'success',
        title: 'Image URL Updated',
        message: 'Image URL has been updated'
      });
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    onPathChange?.('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Preview or Upload Area */}
      <div className="relative">
        {value ? (
          <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${getAspectRatioClass()}`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{ maxWidth, maxHeight }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
              }}
            />
            
            {/* Remove button */}
            {!disabled && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Upload overlay when uploading */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    {uploadProgress && (
                      <div className="text-sm">
                        {uploadProgress.percentage}%
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
              ${isDragging 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${getAspectRatioClass()}
            `}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />

            <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                  {uploadProgress && (
                    <div className="mt-2 w-full max-w-xs">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress.percentage}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
                  <p className="text-xs text-gray-500">
                    Drag & drop or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WebP up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* URL Input Section */}
      {showUrlInput && !disabled && (
        <div className="space-y-2">
          {!showUrlField ? (
            <button
              onClick={() => setShowUrlField(true)}
              className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <Link className="h-4 w-4" />
              <span>Or enter image URL</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setShowUrlField(false);
                  setUrlInput(value);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Status */}
      <AnimatePresence>
        {isUploading && uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-sm text-gray-600"
          >
            <Upload className="h-4 w-4 animate-pulse" />
            <span>
              Uploading... {uploadProgress.percentage}% 
              ({Math.round(uploadProgress.loaded / 1024)}KB / {Math.round(uploadProgress.total / 1024)}KB)
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
