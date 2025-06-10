
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, SortDesc, Star, Eye, EyeOff } from 'lucide-react';
import { Category, Product } from '@/types';

interface ProductsFiltersProps {
  categories: Category[];
  products: Product[];
  onFiltersChange?: (filters: any) => void;
}

const ProductsFilters: React.FC<ProductsFiltersProps> = ({ 
  categories, 
  products, 
  onFiltersChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange?.({
      search: value,
      category: selectedCategory,
      status: statusFilter,
      sortBy,
      sortOrder
    });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onFiltersChange?.({
      search: searchTerm,
      category: value,
      status: statusFilter,
      sortBy,
      sortOrder
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    onFiltersChange?.({
      search: '',
      category: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onFiltersChange?.({
      search: searchTerm,
      category: selectedCategory,
      status: statusFilter,
      sortBy,
      sortOrder: newOrder
    });
  };

  const getProductStats = () => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const featured = products.filter(p => p.is_featured).length;
    const available = products.filter(p => p.is_available).length;
    
    return { total, active, featured, available };
  };

  const stats = getProductStats();

  return (
    <Card className="bg-white shadow-sm border-gray-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="filter-category" name="filter-category" className="w-full sm:w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filter-status" name="filter-status" className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="featured">Em Destaque</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="unavailable">Indisponíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleSortOrder}
              className="flex items-center gap-1"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Total: {stats.total}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Eye className="h-3 w-3 mr-1" />
              Ativos: {stats.active}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Star className="h-3 w-3 mr-1" />
              Destaque: {stats.featured}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Disponíveis: {stats.available}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsFilters;
