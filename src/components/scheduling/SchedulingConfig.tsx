
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { Store } from '@/types';

interface SchedulingConfigProps {
  store: Store;
  onSave: (config: Partial<Store>) => void;
}

const SchedulingConfig: React.FC<SchedulingConfigProps> = ({ store, onSave }) => {
  const [config, setConfig] = useState({
    allow_scheduling: store.allow_scheduling || false,
    same_day_cutoff_time: store.same_day_cutoff_time || '14:00',
    delivery_schedule: store.delivery_schedule || {
      monday: { start: '08:00', end: '18:00', enabled: true },
      tuesday: { start: '08:00', end: '18:00', enabled: true },
      wednesday: { start: '08:00', end: '18:00', enabled: true },
      thursday: { start: '08:00', end: '18:00', enabled: true },
      friday: { start: '08:00', end: '18:00', enabled: true },
      saturday: { start: '08:00', end: '16:00', enabled: true },
      sunday: { start: '08:00', end: '16:00', enabled: false }
    },
    pickup_schedule: store.pickup_schedule || {
      monday: { start: '08:00', end: '18:00', enabled: true },
      tuesday: { start: '08:00', end: '18:00', enabled: true },
      wednesday: { start: '08:00', end: '18:00', enabled: true },
      thursday: { start: '08:00', end: '18:00', enabled: true },
      friday: { start: '08:00', end: '18:00', enabled: true },
      saturday: { start: '08:00', end: '16:00', enabled: true },
      sunday: { start: '08:00', end: '16:00', enabled: false }
    }
  });

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const updateSchedule = (
    type: 'delivery_schedule' | 'pickup_schedule',
    day: string,
    field: string,
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [day]: {
          ...prev[type][day],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Configurações de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar agendamento */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Permitir Agendamento</Label>
              <p className="text-sm text-gray-600">
                Permite que clientes agendem pedidos para horários futuros
              </p>
            </div>
            <Switch
              checked={config.allow_scheduling}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, allow_scheduling: checked }))
              }
            />
          </div>

          {config.allow_scheduling && (
            <>
              {/* Horário limite para mesmo dia */}
              <div className="space-y-2">
                <Label>Horário Limite para Pedidos no Mesmo Dia</Label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    type="time"
                    value={config.same_day_cutoff_time}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, same_day_cutoff_time: e.target.value }))
                    }
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">
                    Após este horário, apenas agendamentos para dias futuros
                  </span>
                </div>
              </div>

              {/* Horários de Entrega */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Horários de Entrega</h3>
                <div className="space-y-3">
                  {days.map(day => (
                    <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                      
                      <Switch
                        checked={config.delivery_schedule[day.key].enabled}
                        onCheckedChange={(checked) => 
                          updateSchedule('delivery_schedule', day.key, 'enabled', checked)
                        }
                      />
                      
                      {config.delivery_schedule[day.key].enabled && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={config.delivery_schedule[day.key].start}
                              onChange={(e) => 
                                updateSchedule('delivery_schedule', day.key, 'start', e.target.value)
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">às</span>
                            <Input
                              type="time"
                              value={config.delivery_schedule[day.key].end}
                              onChange={(e) => 
                                updateSchedule('delivery_schedule', day.key, 'end', e.target.value)
                              }
                              className="w-24"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Horários de Retirada */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Horários de Retirada</h3>
                <div className="space-y-3">
                  {days.map(day => (
                    <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                      
                      <Switch
                        checked={config.pickup_schedule[day.key].enabled}
                        onCheckedChange={(checked) => 
                          updateSchedule('pickup_schedule', day.key, 'enabled', checked)
                        }
                      />
                      
                      {config.pickup_schedule[day.key].enabled && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={config.pickup_schedule[day.key].start}
                              onChange={(e) => 
                                updateSchedule('pickup_schedule', day.key, 'start', e.target.value)
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">às</span>
                            <Input
                              type="time"
                              value={config.pickup_schedule[day.key].end}
                              onChange={(e) => 
                                updateSchedule('pickup_schedule', day.key, 'end', e.target.value)
                              }
                              className="w-24"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulingConfig;
