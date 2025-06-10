
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, MapPin, Phone } from 'lucide-react';
import { Store } from '@/types';

interface StoreCardProps {
  store: Store;
  onEdit: (store: Store) => void;
  onView: (store: Store) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onEdit, onView }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <CardTitle className="text-lg">{store.name}</CardTitle>
              <p className="text-sm text-gray-600">/loja/{store.slug}</p>
            </div>
          </div>
          <Badge variant={store.is_active ? "default" : "secondary"}>
            {store.is_active ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {store.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{store.description}</p>
        )}

        <div className="space-y-2">
          {store.address && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{store.address}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{store.whatsapp}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={store.delivery_available ? "text-green-600" : "text-gray-400"}>
            Delivery
          </Badge>
          <Badge variant="outline" className={store.pickup_available ? "text-green-600" : "text-gray-400"}>
            Retirada
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(store)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(store)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreCard;
