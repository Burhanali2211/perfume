/**
 * Comprehensive Data Validation Service
 * Provides client-side and server-side validation for all CRUD operations
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

class ValidationService {
  /**
   * Validate email format
   */
  validateEmail(email: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED'
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'INVALID_FORMAT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!password) {
      errors.push({
        field: 'password',
        message: 'Password is required',
        code: 'REQUIRED'
      });
    } else {
      if (password.length < 8) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 8 characters long',
          code: 'MIN_LENGTH'
        });
      }

      if (!/(?=.*[a-z])/.test(password)) {
        errors.push({
          field: 'password',
          message: 'Password must contain at least one lowercase letter',
          code: 'MISSING_LOWERCASE'
        });
      }

      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push({
          field: 'password',
          message: 'Password must contain at least one uppercase letter',
          code: 'MISSING_UPPERCASE'
        });
      }

      if (!/(?=.*\d)/.test(password)) {
        errors.push({
          field: 'password',
          message: 'Password must contain at least one number',
          code: 'MISSING_NUMBER'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate product data
   */
  validateProduct(product: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields
    if (!product.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Product name is required',
        code: 'REQUIRED'
      });
    }

    if (!product.price || product.price <= 0) {
      errors.push({
        field: 'price',
        message: 'Price must be greater than 0',
        code: 'INVALID_PRICE'
      });
    }

    if (!product.categoryId) {
      errors.push({
        field: 'categoryId',
        message: 'Category is required',
        code: 'REQUIRED'
      });
    }

    // Slug validation
    if (product.slug) {
      if (!/^[a-z0-9-]+$/.test(product.slug)) {
        errors.push({
          field: 'slug',
          message: 'Slug can only contain lowercase letters, numbers, and hyphens',
          code: 'INVALID_SLUG'
        });
      }
    }

    // Stock validation
    if (product.stock !== undefined && product.stock < 0) {
      errors.push({
        field: 'stock',
        message: 'Stock cannot be negative',
        code: 'INVALID_STOCK'
      });
    }

    // Original price validation
    if (product.originalPrice && product.originalPrice <= product.price) {
      errors.push({
        field: 'originalPrice',
        message: 'Original price must be higher than current price',
        code: 'INVALID_ORIGINAL_PRICE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate category data
   */
  validateCategory(category: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!category.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Category name is required',
        code: 'REQUIRED'
      });
    }

    if (category.slug && !/^[a-z0-9-]+$/.test(category.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
        code: 'INVALID_SLUG'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user data
   */
  validateUser(user: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!user.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        code: 'REQUIRED'
      });
    }

    // Email validation
    const emailValidation = this.validateEmail(user.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Role validation
    if (user.role && !['admin', 'seller', 'customer'].includes(user.role)) {
      errors.push({
        field: 'role',
        message: 'Invalid role specified',
        code: 'INVALID_ROLE'
      });
    }

    // Phone validation
    if (user.phone && !/^\+?[\d\s\-\(\)]+$/.test(user.phone)) {
      errors.push({
        field: 'phone',
        message: 'Please enter a valid phone number',
        code: 'INVALID_PHONE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate order data
   */
  validateOrder(order: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!order.userId) {
      errors.push({
        field: 'userId',
        message: 'User ID is required',
        code: 'REQUIRED'
      });
    }

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Order must contain at least one item',
        code: 'REQUIRED'
      });
    } else {
      order.items.forEach((item: Record<string, unknown>, index: number) => {
        if (!item.productId) {
          errors.push({
            field: `items[${index}].productId`,
            message: 'Product ID is required for each item',
            code: 'REQUIRED'
          });
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push({
            field: `items[${index}].quantity`,
            message: 'Quantity must be greater than 0',
            code: 'INVALID_QUANTITY'
          });
        }

        if (!item.price || item.price <= 0) {
          errors.push({
            field: `items[${index}].price`,
            message: 'Price must be greater than 0',
            code: 'INVALID_PRICE'
          });
        }
      });
    }

    if (!order.total || order.total <= 0) {
      errors.push({
        field: 'total',
        message: 'Order total must be greater than 0',
        code: 'INVALID_TOTAL'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate collection data
   */
  validateCollection(collection: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!collection.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Collection name is required',
        code: 'REQUIRED'
      });
    }

    if (collection.slug && !/^[a-z0-9-]+$/.test(collection.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
        code: 'INVALID_SLUG'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate offer data
   */
  validateOffer(offer: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!offer.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Offer title is required',
        code: 'REQUIRED'
      });
    }

    if (offer.discountType === 'percentage' && (offer.discountValue < 0 || offer.discountValue > 100)) {
      errors.push({
        field: 'discountValue',
        message: 'Percentage discount must be between 0 and 100',
        code: 'INVALID_PERCENTAGE'
      });
    }

    if (offer.discountType === 'fixed' && offer.discountValue <= 0) {
      errors.push({
        field: 'discountValue',
        message: 'Fixed discount must be greater than 0',
        code: 'INVALID_AMOUNT'
      });
    }

    if (offer.startDate && offer.endDate && new Date(offer.startDate) >= new Date(offer.endDate)) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date',
        code: 'INVALID_DATE_RANGE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate any object based on type
   */
  validate(type: string, data: Record<string, unknown>): ValidationResult {
    switch (type) {
      case 'product':
        return this.validateProduct(data);
      case 'category':
        return this.validateCategory(data);
      case 'user':
        return this.validateUser(data);
      case 'order':
        return this.validateOrder(data);
      case 'collection':
        return this.validateCollection(data);
      case 'offer':
        return this.validateOffer(data);
      default:
        return {
          isValid: false,
          errors: [{
            field: 'type',
            message: `Unknown validation type: ${type}`,
            code: 'UNKNOWN_TYPE'
          }]
        };
    }
  }
}

export const validationService = new ValidationService();
export default validationService;
