
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Clock, Truck, Package } from 'lucide-react';
import { Store } from '@/types';

interface StoreViewModalProps {
  store: Store | null;
  onClose: () => void;
  onEdit?: (store: Store) => void;
}

const StoreViewModal: React.FC<StoreViewModalProps> = ({
  store,
  onClose,
  onEdit
}) => {
  if (!store) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{store.name}</span>
            <Badge variant={store.is_active ? "default" : "secondary"}>
              {store.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {store.logo_url && (
                <div className="flex justify-center mb-4">
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </div>
              )}
              
              <div>
                <span className="font-medium">Nome:</span>
                <span className="ml-2">{store.name}</span>
              </div>
              
              <div>
                <span className="font-medium">Slug:</span>
                <span className="ml-2 text-blue-600">/loja/{store.slug}</span>
              </div>

              {store.description && (
                <div>
                  <span className="font-medium">Descrição:</span>
                  <p className="mt-1 text-gray-600">{store.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Contato</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">WhatsApp:</span>
                <span>{store.whatsapp}</span>
              </div>

              {store.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span>{store.email}</span>
                </div>
              )}

              {store.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <span className="font-medium">Endereço:</span>
                    <p className="text-gray-600">{store.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4" />
                  <span>Delivery</span>
                </div>
                <Badge variant={store.delivery_available ? "default" : "secondary"}>
                  {store.delivery_available ? "Disponível" : "Indisponível"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Retirada</span>
                </div>
                <Badge variant={store.pickup_available ? "default" : "secondary"}>
                  {store.pickup_available ? "Disponível" : "Indisponível"}
                </Badge>
              </div>

              {store.delivery_fee !== null && (
                <div className="flex justify-between">
                  <span className="font-medium">Taxa de Entrega:</span>
                  <span>R$ {(store.delivery_fee || 0).toFixed(2)}</span>
                </div>
              )}

              {store.minimum_order !== null && (
                <div className="flex justify-between">
                  <span className="font-medium">Pedido Mínimo:</span>
                  <span>R$ {(store.minimum_order || 0).toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Horários de Funcionamento */}
          {(store.opening_time || store.closing_time) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Horários</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="font-medium">Funcionamento:</span>
                  <span>
                    {store.opening_time} - {store.closing_time}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Data de Criação:</span>
                <span className="ml-2">
                  {new Date(store.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {store.primary_color && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Cor Primária:</span>
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: store.primary_color }}
                  />
                  <span>{store.primary_color}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {onEdit && (
              <Button onClick={() => onEdit(store)}>
                Editar Loja
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreViewModal;
