
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus } from 'lucide-react';
import { AddonCategory } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AddonCategoriesListProps {
  categories: AddonCategory[];
  onEdit: (category: AddonCategory) => void;
  onRefresh: () => void;
}

const AddonCategoriesList: React.FC<AddonCategoriesListProps> = ({
  categories,
  onEdit,
  onRefresh
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria de adicional?')) return;

    setLoading(categoryId);
    try {
      const { error } = await supabase
        .from('addon_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Categoria excluída com sucesso!"
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categorias de Adicionais</h2>
        <Button onClick={() => onEdit({} as AddonCategory)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={loading === category.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {category.is_required && (
                  <Badge variant="destructive">Obrigatório</Badge>
                )}
                {category.is_multiple && (
                  <Badge variant="secondary">Múltipla seleção</Badge>
                )}
                {category.is_order_bump && (
                  <Badge variant="outline">Order Bump</Badge>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Mín. seleções:</span>
                  <span>{category.min_select}</span>
                </div>
                <div className="flex justify-between">
                  <span>Máx. seleções:</span>
                  <span>{category.max_select}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ordem:</span>
                  <span>{category.sort_order}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Nenhuma categoria de adicional encontrada</p>
            <Button 
              onClick={() => onEdit({} as AddonCategory)} 
              className="mt-4"
            >
              Criar primeira categoria
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddonCategoriesList;
