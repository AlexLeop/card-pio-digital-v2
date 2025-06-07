
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Filter, Edit, Eye, Users, MapPin, Phone, Mail } from 'lucide-react';
import { Customer } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomersListProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onViewCustomer: (customer: Customer) => void;
}

const CustomersList = ({ customers, onAddCustomer, onEditCustomer, onViewCustomer }: CustomersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Gerenciar Clientes</span>
              <Badge variant="secondary">{customers.length}</Badge>
            </CardTitle>
            <Button onClick={onAddCustomer} className="gradient-bg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Último Pedido</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">
                          Total gasto: R$ {customer.totalSpent.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.address ? (
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p>{customer.address}</p>
                          {customer.city && (
                            <p className="text-gray-600">{customer.city}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {customer.orderCount} pedidos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {format(new Date(customer.lastOrder), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length} clientes
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

      {/* Estado vazio */}
      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">
              {customers.length === 0 ? (
                <div>
                  <p className="text-lg mb-2">Nenhum cliente cadastrado</p>
                  <p>Os clientes aparecerão aqui quando fizerem pedidos</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Nenhum cliente encontrado</p>
                  <p>Tente ajustar os filtros de busca</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomersList;
