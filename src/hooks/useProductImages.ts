import { Product } from '@/types';

export const useProductImages = () => {
  const getMainImage = (product: Product): string | null => {
    if (product.images && product.images.length > 0) {
      // Procurar pela imagem marcada como principal
      const primaryImage = product.images.find(img => img.is_primary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return product.image_url || null;
  };

  const getAllImages = (product: Product) => {
    const images = [];
    
    // Adicionar imagens do array
    if (product.images && product.images.length > 0) {
      images.push(...product.images);
    }
    
    // Adicionar image_url se não estiver no array
    if (product.image_url && !images.some(img => img.url === product.image_url)) {
      images.push({
        url: product.image_url,
        is_primary: images.length === 0,
        order: images.length
      });
    }
    
    return images;
  };

  return {
    getMainImage,
    getAllImages
  };
};