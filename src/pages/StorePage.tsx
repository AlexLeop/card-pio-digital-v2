
import React from 'react';
import { useParams } from 'react-router-dom';
import { useStores } from '@/hooks/useStores';
import StoreMenu from '@/components/public/StoreMenu';

// Adicionar verificações de debug
const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { stores } = useStores();
  
  console.log('StorePage - slug:', slug);
  console.log('StorePage - stores:', stores);
  
  const store = stores.find(s => s.slug === slug);
  
  console.log('StorePage - store encontrada:', store);
  
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600">A loja "{slug}" não foi encontrada.</p>
        </div>
      </div>
    );
  }
  
  return <StoreMenu store={store} />;
};

export default StorePage;
