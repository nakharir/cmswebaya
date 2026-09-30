import { apiClient } from './client';
import {
  EcommerceCategory,
  EcommerceProduct,
  EcommerceProductImage,
  ProductListParams,
  ProductCreatePayload,
  ProductUpdatePayload,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  LaravelResourceCollection,
  EcommerceOrder,
  OrderListParams,
} from '@/types/ecommerce';

export const ecommerceService = {
  /**
   * Get public category catalog
   * GET /api/ecommerce/categories
   */
  async getCategories(): Promise<EcommerceCategory[]> {
    const response = await apiClient.get('/ecommerce/categories');
    // Laravel returns { data: [...] } for AnonymousResourceCollection or [...]
    return response.data?.data ?? response.data ?? [];
  },

  /**
   * Get admin category list (if admin access is available)
   * GET /api/ecommerce/admin/categories
   */
  async getAdminCategories(): Promise<EcommerceCategory[]> {
    try {
      const response = await apiClient.get('/ecommerce/admin/categories');
      return response.data?.data ?? response.data ?? [];
    } catch {
      // Fallback to public categories
      return this.getCategories();
    }
  },

  /**
   * Create category (admin)
   * POST /api/ecommerce/admin/categories
   */
  async createCategory(payload: CategoryCreatePayload): Promise<EcommerceCategory> {
    const response = await apiClient.post('/ecommerce/admin/categories', payload);
    return response.data?.data ?? response.data;
  },

  /**
   * Update category (admin)
   * PUT /api/ecommerce/admin/categories/{id}
   */
  async updateCategory(id: number, payload: CategoryUpdatePayload): Promise<EcommerceCategory> {
    const response = await apiClient.put(`/ecommerce/admin/categories/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  /**
   * Delete category (admin)
   * DELETE /api/ecommerce/admin/categories/{id}
   */
  async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/ecommerce/admin/categories/${id}`);
    return response.data;
  },

  /**
   * Get paginated products
   * GET /api/ecommerce/products
   */
  async getProducts(params?: ProductListParams): Promise<LaravelResourceCollection<EcommerceProduct>> {
    const response = await apiClient.get('/ecommerce/products', {
      params,
    });
    // Response has { data: [...], links: {...}, meta: {...} }
    return response.data;
  },

  /**
   * Get single product by slug (public)
   * GET /api/ecommerce/products/{slug}
   */
  async getProductBySlug(slug: string): Promise<EcommerceProduct> {
    const response = await apiClient.get(`/ecommerce/products/${slug}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Get single product for admin by ID
   * GET /api/ecommerce/admin/products/{id}
   */
  async getAdminProduct(id: number): Promise<EcommerceProduct> {
    const response = await apiClient.get(`/ecommerce/admin/products/${id}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Create new product (admin)
   * POST /api/ecommerce/admin/products
   */
  async createProduct(payload: ProductCreatePayload): Promise<EcommerceProduct> {
    const response = await apiClient.post('/ecommerce/admin/products', payload);
    return response.data?.data ?? response.data;
  },

  /**
   * Update existing product (admin)
   * PUT /api/ecommerce/admin/products/{id}
   */
  async updateProduct(id: number, payload: ProductUpdatePayload): Promise<EcommerceProduct> {
    const response = await apiClient.put(`/ecommerce/admin/products/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  /**
   * Delete product (admin)
   * DELETE /api/ecommerce/admin/products/{id}
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete(`/ecommerce/admin/products/${id}`);
    return response.data;
  },

  /**
   * Get all images of a product
   * GET /api/ecommerce/admin/products/{productId}/images
   */
  async getProductImages(productId: number): Promise<EcommerceProductImage[]> {
    const response = await apiClient.get(`/ecommerce/admin/products/${productId}/images`);
    return response.data?.data ?? response.data ?? [];
  },

  /**
   * Upload image for a product
   * POST /api/ecommerce/admin/products/{productId}/images
   */
  async uploadProductImage(
    productId: number,
    file: File,
    options?: { alt_text?: string; is_primary?: boolean; sort_order?: number }
  ): Promise<EcommerceProductImage> {
    const formData = new FormData();
    formData.append('image', file);

    if (options?.alt_text !== undefined) {
      formData.append('alt_text', options.alt_text);
    }
    if (options?.is_primary !== undefined) {
      formData.append('is_primary', options.is_primary ? '1' : '0');
    }
    if (options?.sort_order !== undefined) {
      formData.append('sort_order', String(options.sort_order));
    }

    const response = await apiClient.post(
      `/ecommerce/admin/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data?.data ?? response.data;
  },

  /**
   * Delete product image
   * DELETE /api/ecommerce/admin/products/{productId}/images/{imageId}
   */
  async deleteProductImage(productId: number, imageId: number): Promise<{ message: string }> {
    const response = await apiClient.delete(
      `/ecommerce/admin/products/${productId}/images/${imageId}`
    );
    return response.data;
  },

  /**
   * Set primary image for a product
   * PUT /api/ecommerce/admin/products/{productId}/images/{imageId}/primary
   */
  async setPrimaryProductImage(
    productId: number,
    imageId: number
  ): Promise<EcommerceProductImage> {
    const response = await apiClient.put(
      `/ecommerce/admin/products/${productId}/images/${imageId}/primary`
    );
    return response.data?.data ?? response.data;
  },

  /**
   * Get orders for admin/operator with search, status filter, and pagination
   * GET /api/ecommerce/admin/orders
   */
  async getOrders(params?: OrderListParams): Promise<LaravelResourceCollection<EcommerceOrder>> {
    const response = await apiClient.get('/ecommerce/admin/orders', {
      params,
    });
    return response.data;
  },

  /**
   * Get order detail by ID for admin
   * GET /api/ecommerce/admin/orders/{id}
   */
  async getOrder(id: number): Promise<EcommerceOrder> {
    const response = await apiClient.get(`/ecommerce/admin/orders/${id}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Update order status
   * PUT /api/ecommerce/admin/orders/{id}
   */
  async updateOrderStatus(
    id: number,
    status: string,
    notes?: string
  ): Promise<EcommerceOrder> {
    const response = await apiClient.put(`/ecommerce/admin/orders/${id}`, {
      status,
      notes,
    });
    return response.data?.data ?? response.data;
  },
};
