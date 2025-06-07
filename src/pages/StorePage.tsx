
import React from 'react';
import { useParams } from 'react-router-dom';
import { useStores } from '@/hooks/useStores';
import StoreMenu from '@/components/public/StoreMenu';

const StorePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { stores, loading } = useStores();
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando loja...</div>
      </div>
    );
  }

  const store = stores.find(s => s.slug === slug);

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600">A loja que você está procurando não existe ou não está ativa.</p>
        </div>
      </div>
    );
  }

  return <StoreMenu store={store} />;
};

export default StorePage;
