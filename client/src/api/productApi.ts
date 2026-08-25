import api from './axios';
import { Product } from '../types/product';

export const productApi = {
  getProducts: async () => {
    const response = await api.get<{ success: boolean; data: Product[] }>('/products');
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: Partial<Product>) => {
    const response = await api.post<{ success: boolean; data: Product }>('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const response = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/products/${id}`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post<{ success: boolean; url: string; message: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
