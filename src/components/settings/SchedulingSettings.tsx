
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { WeeklySchedule } from './WeeklySchedule';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SchedulingSettingsProps {
  storeId: string;
  onSave: () => void;
}

const SchedulingSettings: React.FC<SchedulingSettingsProps> = ({ storeId, onSave }) => {
  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  // ADICIONAR ESTADO PARA AS CONFIGURAÇÕES
  const [settings, setSettings] = useState({
    allow_scheduling: false,
    same_day_cutoff_time: '',
    weekly_schedule: {},
    special_dates: [],
    delivery_schedule: {}
  });
  
  const [loading, setLoading] = useState(false);

  // CARREGAR CONFIGURAÇÕES DO BANCO
  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;

      if (store) {
        // Usar os dados do banco ou inicializar com valores vazios
        setSettings({
          allow_scheduling: store.allow_scheduling || false,
          same_day_cutoff_time: store.same_day_cutoff_time || '',
          weekly_schedule: store.weekly_schedule || {},
          special_dates: store.special_dates || [],
          delivery_schedule: store.delivery_schedule || {}
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de agendamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO PARA ATUALIZAR CONFIGURAÇÕES
  const onSettingChange = async (field: string, value: any) => {
    try {
      setSettings(prev => ({ ...prev, [field]: value }));
      
      const { error } = await supabase
        .from('stores')
        .update({ [field]: value })
        .eq('id', storeId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração.",
        variant: "destructive"
      });
    }
  };

  const updateWeeklySchedule = (day: string, field: string, value: any) => {
    const updatedSchedule = {
      ...settings.weekly_schedule,
      [day]: {
        ...settings.weekly_schedule[day as keyof typeof settings.weekly_schedule],
        [field]: value
      }
    };
    onSettingChange('weekly_schedule', updatedSchedule);
  };

  const addSpecialDate = () => {
    const newSpecialDates = [
      ...settings.special_dates,
      {
        date: '',
        closed: false,
        description: ''
      }
    ];
    onSettingChange('special_dates', newSpecialDates);
  };

  const updateSpecialDate = (index: number, field: string, value: any) => {
    const updatedDates = settings.special_dates.map((date, i) => 
      i === index ? { ...date, [field]: value } : date
    );
    onSettingChange('special_dates', updatedDates);
  };

  const removeSpecialDate = (index: number) => {
    const updatedDates = settings.special_dates.filter((_, i) => i !== index);
    onSettingChange('special_dates', updatedDates);
  };

  const addDeliverySlot = () => {
    const newSlotId = `slot_${Date.now()}`;
    const updatedSchedule = {
      ...settings.delivery_schedule,
      [newSlotId]: { start: '', end: '', enabled: true }
    };
    onSettingChange('delivery_schedule', updatedSchedule);
  };

  const updateDeliverySlot = (slotId: string, field: string, value: any) => {
    const updatedSchedule = {
      ...settings.delivery_schedule,
      [slotId]: {
        ...settings.delivery_schedule[slotId],
        [field]: value
      }
    };
    onSettingChange('delivery_schedule', updatedSchedule);
  };

  const removeDeliverySlot = (slotId: string) => {
    const { [slotId]: removed, ...updatedSchedule } = settings.delivery_schedule;
    onSettingChange('delivery_schedule', updatedSchedule);
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Configurações de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow_scheduling">Permitir Agendamento</Label>
            <Switch
              id="allow_scheduling"
              checked={settings.allow_scheduling}
              onCheckedChange={(checked) => onSettingChange('allow_scheduling', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="same_day_cutoff_time">Horário Limite para Pedidos do Mesmo Dia</Label>
            <Input
              id="same_day_cutoff_time"
              type="time"
              value={settings.same_day_cutoff_time}
              onChange={(e) => onSettingChange('same_day_cutoff_time', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Após este horário, pedidos só poderão ser agendados para o próximo dia
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horários por Dia da Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento por Dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map(day => (
            <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
              <div className="w-32">
                <Label className="font-medium">{day.label}</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Aberto:</Label>
                <Switch
                  checked={!settings.weekly_schedule[day.key as keyof typeof settings.weekly_schedule]?.closed}
                  onCheckedChange={(checked) => updateWeeklySchedule(day.key, 'closed', !checked)}
                />
              </div>

              {!settings.weekly_schedule[day.key as keyof typeof settings.weekly_schedule]?.closed && (
                <>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Abertura:</Label>
                    <Input
                      type="time"
                      value={settings.weekly_schedule[day.key as keyof typeof settings.weekly_schedule]?.open || '08:00'}
                      onChange={(e) => updateWeeklySchedule(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Fechamento:</Label>
                    <Input
                      type="time"
                      value={settings.weekly_schedule[day.key as keyof typeof settings.weekly_schedule]?.close || '22:00'}
                      onChange={(e) => updateWeeklySchedule(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Horários de Entrega */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Horários de Entrega</CardTitle>
            <Button onClick={addDeliverySlot} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Horário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.delivery_schedule).map(([slotId, slot]) => (
            <div key={slotId} className="flex items-center space-x-4 p-3 border rounded-lg">
              <Switch
                checked={slot.enabled}
                onCheckedChange={(checked) => updateDeliverySlot(slotId, 'enabled', checked)}
              />
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm">De:</Label>
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateDeliverySlot(slotId, 'start', e.target.value)}
                  className="w-32"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Até:</Label>
                <Input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateDeliverySlot(slotId, 'end', e.target.value)}
                  className="w-32"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => removeDeliverySlot(slotId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {Object.keys(settings.delivery_schedule).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhum horário de entrega configurado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Datas Especiais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datas Especiais</CardTitle>
            <Button onClick={addSpecialDate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.special_dates.map((date, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
              <Input
                type="date"
                value={date.date}
                onChange={(e) => updateSpecialDate(index, 'date', e.target.value)}
                className="w-40"
              />
              
              <Input
                placeholder="Descrição (ex: Feriado)"
                value={date.description || ''}
                onChange={(e) => updateSpecialDate(index, 'description', e.target.value)}
                className="flex-1"
              />
              
              <div className="flex items-center space-x-2">
                <Label className="text-sm">Aberto:</Label>
                <Switch
                  checked={!date.closed}
                  onCheckedChange={(checked) => updateSpecialDate(index, 'closed', !checked)}
                />
              </div>

              {!date.closed && (
                <>
                  <Input
                    type="time"
                    placeholder="Abertura"
                    value={date.open || ''}
                    onChange={(e) => updateSpecialDate(index, 'open', e.target.value)}
                    className="w-32"
                  />
                  <Input
                    type="time"
                    placeholder="Fechamento"
                    value={date.close || ''}
                    onChange={(e) => updateSpecialDate(index, 'close', e.target.value)}
                    className="w-32"
                  />
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => removeSpecialDate(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {settings.special_dates.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhuma data especial configurada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingSettings;
