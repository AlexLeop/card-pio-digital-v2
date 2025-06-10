
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store } from '@/types';
import SchedulingSettings from './SchedulingSettings';

interface SettingsPageProps {
  onSave: () => void;
  storeId: string; // Adicionar esta prop
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onSave, storeId }) => {
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  
  // Inicializar horários semanais se não existirem
  const initializeWeeklySchedule = () => {
    if (!store?.weekly_schedule) {
      const defaultSchedule = {
        monday: { open: '08:00', close: '22:00', closed: false },
        tuesday: { open: '08:00', close: '22:00', closed: false },
        wednesday: { open: '08:00', close: '22:00', closed: false },
        thursday: { open: '08:00', close: '22:00', closed: false },
        friday: { open: '08:00', close: '22:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: false }
      };
      setStore(prev => prev ? { ...prev, weekly_schedule: defaultSchedule } : null);
    }
  };

  const initializeDeliverySchedule = () => {
    if (!store?.delivery_schedule) {
      const defaultSchedule = {
        monday: { start: '08:00', end: '22:00', enabled: true },
        tuesday: { start: '08:00', end: '22:00', enabled: true },
        wednesday: { start: '08:00', end: '22:00', enabled: true },
        thursday: { start: '08:00', end: '22:00', enabled: true },
        friday: { start: '08:00', end: '22:00', enabled: true },
        saturday: { start: '08:00', end: '22:00', enabled: true },
        sunday: { start: '08:00', end: '22:00', enabled: true }
      };
      setStore(prev => prev ? { ...prev, delivery_schedule: defaultSchedule } : null);
    }
  };

  const updateWeeklySchedule = (day: string, field: string, value: any) => {
    setStore(prev => {
      if (!prev) return null;
      const updatedSchedule = {
        ...prev.weekly_schedule,
        [day]: {
          ...prev.weekly_schedule?.[day],
          [field]: value
        }
      };
      return { ...prev, weekly_schedule: updatedSchedule };
    });
  };

  const updateDeliverySchedule = (day: string, field: string, value: any) => {
    setStore(prev => {
      if (!prev) return null;
      const updatedSchedule = {
        ...prev.delivery_schedule,
        [day]: {
          ...prev.delivery_schedule?.[day],
          [field]: value
        }
      };
      return { ...prev, delivery_schedule: updatedSchedule };
    });
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  useEffect(() => {
    if (store) {
      initializeWeeklySchedule();
      initializeDeliverySchedule();
    }
  }, [store?.id]);

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const fetchStoreData = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId) // Usar storeId em vez de currentStoreId
        .single();

      if (error) throw error;
      setStore(data);
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da loja",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!store) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: store.name,
          description: store.description,
          email: store.email,
          whatsapp: store.whatsapp,
          address: store.address,
          city: store.city,
          state: store.state,
          zip: store.zip,
          delivery_available: store.delivery_available,
          pickup_available: store.pickup_available,
          accept_cash: store.accept_cash,
          accept_credit_card: store.accept_credit_card,
          accept_pix: store.accept_pix,
          delivery_fee: store.delivery_fee,
          minimum_order: store.minimum_order,
          allow_scheduling: store.allow_scheduling,
          opening_time: store.opening_time,
          closing_time: store.closing_time,
          mercado_pago_public_key: store.mercado_pago_public_key,
          mercado_pago_access_token: store.mercado_pago_access_token,
          pickup_address: store.pickup_address,
          pickup_instructions: store.pickup_instructions
        })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso."
      });
      onSave();
    } catch (error) {
      console.error('Error saving store settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configurações da Loja</h1>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja</Label>
              <Input
                id="name"
                value={store.name}
                onChange={(e) => setStore(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={store.description || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={store.email || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, email: e.target.value } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={store.whatsapp}
                onChange={(e) => setStore(prev => prev ? { ...prev, whatsapp: e.target.value } : null)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={store.address || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, address: e.target.value } : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={store.city || ''}
                  onChange={(e) => setStore(prev => prev ? { ...prev, city: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={store.state || ''}
                  onChange={(e) => setStore(prev => prev ? { ...prev, state: e.target.value } : null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={store.zip_code || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, zip_code: e.target.value } : null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="delivery_available">Entrega Disponível</Label>
              <Switch
                id="delivery_available"
                checked={store.delivery_available}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, delivery_available: checked } : null)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pickup_available">Retirada Disponível</Label>
              <Switch
                id="pickup_available"
                checked={store.pickup_available}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, pickup_available: checked } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                value={store.delivery_fee || 0}
                onChange={(e) => setStore(prev => prev ? { ...prev, delivery_fee: parseFloat(e.target.value) || 0 } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_order">Pedido Mínimo (R$)</Label>
              <Input
                id="minimum_order"
                type="number"
                step="0.01"
                value={store.minimum_order || 0}
                onChange={(e) => setStore(prev => prev ? { ...prev, minimum_order: parseFloat(e.target.value) || 0 } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_address">Endereço para Retirada</Label>
              <Input
                id="pickup_address"
                value={store.pickup_address || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, pickup_address: e.target.value } : null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_instructions">Instruções para Retirada</Label>
              <Textarea
                id="pickup_instructions"
                value={store.pickup_instructions || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, pickup_instructions: e.target.value } : null)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="accept_cash">Aceitar Dinheiro</Label>
              <Switch
                id="accept_cash"
                checked={store.accept_cash}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, accept_cash: checked } : null)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="accept_credit_card">Aceitar Cartão de Crédito</Label>
              <Switch
                id="accept_credit_card"
                checked={store.accept_credit_card}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, accept_credit_card: checked } : null)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="accept_pix">Aceitar PIX</Label>
              <Switch
                id="accept_pix"
                checked={store.accept_pix}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, accept_pix: checked } : null)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="mercado_pago_public_key">Mercado Pago - Chave Pública</Label>
              <Input
                id="mercado_pago_public_key"
                value={store.mercado_pago_public_key || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, mercado_pago_public_key: e.target.value } : null)}
                placeholder="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mercado_pago_access_token">Mercado Pago - Access Token</Label>
              <Input
                id="mercado_pago_access_token"
                type="password"
                value={store.mercado_pago_access_token || ''}
                onChange={(e) => setStore(prev => prev ? { ...prev, mercado_pago_access_token: e.target.value } : null)}
                placeholder="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
          </CardContent>
        </Card>

        {/* Horário de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle>Horário de Funcionamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allow_scheduling">Permitir Agendamento</Label>
              <Switch
                id="allow_scheduling"
                checked={store.allow_scheduling}
                onCheckedChange={(checked) => setStore(prev => prev ? { ...prev, allow_scheduling: checked } : null)}
              />
            </div>

            {/* Configurações Avançadas de Agendamento */}
            {store.allow_scheduling && (
            <SchedulingSettings 
              storeId={storeId}
              onSave={() => {
                toast({
                  title: "Sucesso!",
                  description: "Configurações de horário salvas com sucesso."
                });
              }}
            />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening_time">Horário de Abertura</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={store.opening_time || ''}
                  onChange={(e) => setStore(prev => prev ? { ...prev, opening_time: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_time">Horário de Fechamento</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={store.closing_time || ''}
                  onChange={(e) => setStore(prev => prev ? { ...prev, closing_time: e.target.value } : null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? 'Salvando...' : 'Salvar Todas as Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
