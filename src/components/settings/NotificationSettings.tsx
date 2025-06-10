import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Mail, Smartphone } from 'lucide-react';

interface NotificationSettingsProps {
  storeId: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ storeId }) => {
  const { settings, updateSettings, checkStockLevels } = useNotifications(storeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-alerts">Alertas por Email</Label>
            </div>
            <Switch
              id="email-alerts"
              checked={settings.enableEmailAlerts}
              onCheckedChange={(checked) => updateSettings({ enableEmailAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <Label htmlFor="push-notifications">Notificações Push</Label>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.enablePushNotifications}
              onCheckedChange={(checked) => updateSettings({ enablePushNotifications: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Limite de Estoque Baixo</Label>
            <Input
              id="threshold"
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => updateSettings({ lowStockThreshold: parseInt(e.target.value) })}
              min="1"
              max="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo de Verificação (minutos)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.checkInterval}
              onChange={(e) => updateSettings({ checkInterval: parseInt(e.target.value) })}
              min="5"
              max="1440"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={checkStockLevels} className="w-full">
            Verificar Estoque Agora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;