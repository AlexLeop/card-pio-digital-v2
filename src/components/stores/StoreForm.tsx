import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store } from '@/types';

interface StoreFormProps {
  store?: Store;
  onSave: (storeData: Omit<Store, 'id' | 'created_at'>) => Promise<any>;
  onCancel: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ store, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    slug: store?.slug || '',
    description: store?.description || '',
    whatsapp: store?.whatsapp || '',
    email: store?.email || '',
    address: store?.address || '',
    city: store?.city || '',
    state: store?.state || '',
    zip_code: store?.zip_code || '',
    logo_url: store?.logo_url || '',
    cover_image_url: store?.cover_image_url || '',
    primary_color: store?.primary_color || '#000000',
    secondary_color: store?.secondary_color || '#ffffff',
    accent_color: store?.accent_color || '#007bff',
    delivery_fee: store?.delivery_fee || 0,
    minimum_order: store?.minimum_order || 0,
    opening_time: store?.opening_time || '08:00',
    closing_time: store?.closing_time || '22:00',
    is_active: store?.is_active ?? true,
    delivery_available: store?.delivery_available ?? true,
    pickup_available: store?.pickup_available ?? true,
    accept_cash: store?.accept_cash ?? true,
    accept_credit_card: store?.accept_credit_card ?? true,
    accept_pix: store?.accept_pix ?? true,
    mercado_pago_access_token: store?.mercado_pago_access_token || '',
    mercado_pago_public_key: store?.mercado_pago_public_key || '',
    owner_id: store?.owner_id || 'default-owner-id'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    updateField('name', name);
    if (!store) {
      updateField('slug', generateSlug(name));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="delivery">Entrega</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL da Loja *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => updateField('is_active', checked)}
                />
                <Label htmlFor="is_active">Loja Ativa</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="delivery_available"
                    checked={formData.delivery_available}
                    onCheckedChange={(checked) => updateField('delivery_available', checked)}
                  />
                  <Label htmlFor="delivery_available">Entrega Disponível</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pickup_available"
                    checked={formData.pickup_available}
                    onCheckedChange={(checked) => updateField('pickup_available', checked)}
                  />
                  <Label htmlFor="pickup_available">Retirada Disponível</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    value={formData.delivery_fee}
                    onChange={(e) => updateField('delivery_fee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="minimum_order">Pedido Mínimo (R$)</Label>
                  <Input
                    id="minimum_order"
                    type="number"
                    step="0.01"
                    value={formData.minimum_order}
                    onChange={(e) => updateField('minimum_order', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening_time">Horário de Abertura</Label>
                  <Input
                    id="opening_time"
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => updateField('opening_time', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="closing_time">Horário de Fechamento</Label>
                  <Input
                    id="closing_time"
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => updateField('closing_time', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="cover_image_url">URL da Imagem de Capa</Label>
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={(e) => updateField('cover_image_url', e.target.value)}
                  placeholder="https://exemplo.com/capa.jpg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => updateField('primary_color', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => updateField('secondary_color', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="accent_color">Cor de Destaque</Label>
                  <Input
                    id="accent_color"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => updateField('accent_color', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accept_cash"
                    checked={formData.accept_cash}
                    onCheckedChange={(checked) => updateField('accept_cash', checked)}
                  />
                  <Label htmlFor="accept_cash">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accept_credit_card"
                    checked={formData.accept_credit_card}
                    onCheckedChange={(checked) => updateField('accept_credit_card', checked)}
                  />
                  <Label htmlFor="accept_credit_card">Cartão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accept_pix"
                    checked={formData.accept_pix}
                    onCheckedChange={(checked) => updateField('accept_pix', checked)}
                  />
                  <Label htmlFor="accept_pix">PIX</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configurações Mercado Pago</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    Para aceitar pagamentos com cartão e PIX, configure suas credenciais do Mercado Pago.
                  </p>
                  <p className="text-xs text-blue-600">
                    Encontre suas credenciais no painel do Mercado Pago em: Seu negócio → Configurações → Credenciais
                  </p>
                </div>
                <div>
                  <Label htmlFor="mercado_pago_public_key">Chave Pública do Mercado Pago</Label>
                  <Input
                    id="mercado_pago_public_key"
                    value={formData.mercado_pago_public_key}
                    onChange={(e) => updateField('mercado_pago_public_key', e.target.value)}
                    placeholder="TEST-... ou APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave é usada no frontend e pode ser pública
                  </p>
                </div>
                <div>
                  <Label htmlFor="mercado_pago_access_token">Access Token do Mercado Pago</Label>
                  <Input
                    id="mercado_pago_access_token"
                    type="password"
                    value={formData.mercado_pago_access_token}
                    onChange={(e) => updateField('mercado_pago_access_token', e.target.value)}
                    placeholder="TEST-... ou APP_USR-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta chave é privada e será armazenada de forma segura
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Loja'}
        </Button>
      </div>
    </form>
  );
};

export default StoreForm;
