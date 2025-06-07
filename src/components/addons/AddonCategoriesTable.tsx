
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { AddonCategory, ProductAddon } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AddonCategoriesTableProps {
  categories: AddonCategory[];
  addons: ProductAddon[];
  onEditCategory: (category: AddonCategory) => void;
  onEditAddon: (addon: ProductAddon) => void;
  onAddCategory: () => void;
  onAddAddon: (categoryId?: string) => void;
  onRefresh: () => void;
}

const AddonCategoriesTable: React.FC<AddonCategoriesTableProps> = ({
  categories,
  addons,
  onEditCategory,
  onEditAddon,
  onAddCategory,
  onAddAddon,
  onRefresh
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + itemsPerPage);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteCategory = async (categoryId: string) => {
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

  const handleDeleteAddon = async (addonId: string) => {
    if (!confirm('Tem certeza que deseja excluir este adicional?')) return;

    setLoading(addonId);
    try {
      const { error } = await supabase
        .from('addon_items')
        .delete()
        .eq('id', addonId);

      if (error) throw error;

      toast({
        title: "Adicional excluído com sucesso!"
      });

      onRefresh();
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir adicional",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const getCategoryAddons = (categoryId: string) => {
    return addons.filter(addon => addon.addon_category_id === categoryId);
  };

  const getUncategorizedAddons = () => {
    return addons.filter(addon => !addon.addon_category_id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categorias de Adicionais</h2>
        <div className="flex space-x-2">
          <Button onClick={onAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
          <Button variant="outline" onClick={() => onAddAddon()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Adicional
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Configurações</TableHead>
                <TableHead>Adicionais</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.map((category) => {
                const categoryAddons = getCategoryAddons(category.id);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <React.Fragment key={category.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {category.is_required && (
                            <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                          )}
                          {category.is_multiple && (
                            <Badge variant="secondary" className="text-xs">Múltipla</Badge>
                          )}
                          {category.is_order_bump && (
                            <Badge variant="outline" className="text-xs">Order Bump</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {categoryAddons.length} itens
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddAddon(category.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={loading === category.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-gray-50 p-4 border-l-4 border-blue-200">
                            <h4 className="font-medium mb-3">Adicionais desta categoria:</h4>
                            {categoryAddons.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryAddons.map((addon) => (
                                  <div key={addon.id} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-sm">{addon.name}</h5>
                                      <div className="flex space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => onEditAddon(addon)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteAddon(addon.id)}
                                          disabled={loading === addon.id}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {addon.description && (
                                      <p className="text-xs text-gray-600 mb-2">{addon.description}</p>
                                    )}
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">R$ {addon.price.toFixed(2)}</span>
                                      <Badge variant={addon.is_available ? "default" : "secondary"} className="text-xs">
                                        {addon.is_available ? "Disponível" : "Indisponível"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Nenhum adicional nesta categoria</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, categories.length)} de {categories.length} categorias
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adicionais sem categoria */}
      {getUncategorizedAddons().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionais sem categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getUncategorizedAddons().map((addon) => (
                <div key={addon.id} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">{addon.name}</h5>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAddon(addon)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddon(addon.id)}
                        disabled={loading === addon.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {addon.description && (
                    <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">R$ {addon.price.toFixed(2)}</span>
                    <Badge variant={addon.is_available ? "default" : "secondary"}>
                      {addon.is_available ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Nenhuma categoria de adicional encontrada</p>
            <Button onClick={onAddCategory}>
              Criar primeira categoria
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddonCategoriesTable;
