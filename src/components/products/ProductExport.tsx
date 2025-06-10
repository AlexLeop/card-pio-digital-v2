
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Product, Category } from '@/types';
import { toast } from '@/hooks/use-toast';

interface ProductExportProps {
  products: Product[];
  categories: Category[];
}

const ProductExport: React.FC<ProductExportProps> = ({ products, categories }) => {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Nome',
        'Descrição',
        'Preço',
        'Preço Promocional',
        'Categoria',
        'URL da Imagem',
        'Em Destaque',
        'Disponível',
        'Ativo',
        'Tempo de Preparo',
        'Agendamento Mesmo Dia'
      ];

      const csvData = products.map(product => [
        product.name,
        product.description || '',
        product.price,
        product.sale_price || '',
        getCategoryName(product.category_id),
        product.image_url || '',
        product.is_featured ? 'Sim' : 'Não',
        product.is_available ? 'Sim' : 'Não',
        product.is_active ? 'Sim' : 'Não',
        product.preparation_time || '',
        product.allow_same_day_scheduling ? 'Sim' : 'Não'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída!",
        description: `${products.length} produtos exportados com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os produtos.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      className="flex items-center space-x-2"
    >
      <Download className="h-4 w-4" />
      <span>Exportar CSV</span>
    </Button>
  );
};

export default ProductExport;
