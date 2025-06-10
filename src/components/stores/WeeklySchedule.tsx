
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface WeeklyScheduleProps {
  schedule: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  specialDates: Array<{
    date: string;
    open?: string;
    close?: string;
    closed: boolean;
    description?: string;
  }>;
  onScheduleChange: (day: string, field: string, value: any) => void;
  onSpecialDateAdd: () => void;
  onSpecialDateChange: (index: number, field: string, value: any) => void;
  onSpecialDateRemove: (index: number) => void;
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  schedule,
  specialDates,
  onScheduleChange,
  onSpecialDateAdd,
  onSpecialDateChange,
  onSpecialDateRemove
}) => {
  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map(day => (
            <div key={day.key} className="flex items-center space-x-4">
              <div className="w-32">
                <Label>{day.label}</Label>
              </div>
              <Switch
                checked={!schedule[day.key as keyof typeof schedule].closed}
                onCheckedChange={(checked) => onScheduleChange(day.key, 'closed', !checked)}
              />
              {!schedule[day.key as keyof typeof schedule].closed && (
                <>
                  <div className="flex items-center space-x-2">
                    <Label>Abertura:</Label>
                    <Input
                      type="time"
                      value={schedule[day.key as keyof typeof schedule].open}
                      onChange={(e) => onScheduleChange(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Fechamento:</Label>
                    <Input
                      type="time"
                      value={schedule[day.key as keyof typeof schedule].close}
                      onChange={(e) => onScheduleChange(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datas Especiais</CardTitle>
            <Button onClick={onSpecialDateAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {specialDates.map((date, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Input
                type="date"
                value={date.date}
                onChange={(e) => onSpecialDateChange(index, 'date', e.target.value)}
                className="w-40"
              />
              <Input
                placeholder="Descrição (ex: Feriado)"
                value={date.description || ''}
                onChange={(e) => onSpecialDateChange(index, 'description', e.target.value)}
                className="flex-1"
              />
              <Switch
                checked={!date.closed}
                onCheckedChange={(checked) => onSpecialDateChange(index, 'closed', !checked)}
              />
              {!date.closed && (
                <>
                  <Input
                    type="time"
                    value={date.open || ''}
                    onChange={(e) => onSpecialDateChange(index, 'open', e.target.value)}
                    className="w-32"
                  />
                  <Input
                    type="time"
                    value={date.close || ''}
                    onChange={(e) => onSpecialDateChange(index, 'close', e.target.value)}
                    className="w-32"
                  />
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSpecialDateRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {specialDates.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhuma data especial configurada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySchedule;
