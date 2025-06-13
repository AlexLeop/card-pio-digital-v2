import React, { useState } from 'react';
import { Card, CardContent } from '@mui/material';
import { Button } from '@mui/material';
import { ProductCardProps } from '../types/ProductCardProps';
import ProductModal from './ProductModal';
import { CartItem } from '../types/CartItem';

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem: CartItem = {
      product,
      quantity: 1,
      addons: [],
      notes: ''
    };

    onAddToCart(cartItem);
  };

  if (!product) return null;

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Imagem do produto */}
          <div className="relative aspect-square">
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Informações do produto */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {product.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">
                R$ {product.price.toFixed(2)}
              </span>
              <Button onClick={() => setShowModal(true)}>
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do produto */}
      {showModal && (
        <ProductModal
          product={product}
          onClose={() => setShowModal(false)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
};

export default ProductCard; 