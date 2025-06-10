
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Grid3X3,
  Plus
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stores', label: 'Lojas', icon: Store },
    { id: 'categories', label: 'Categorias', icon: Grid3X3 },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'addons', label: 'Adicionais', icon: Plus },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <Card className={`fixed left-0 top-0 h-full z-40 transition-transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 w-64 rounded-none border-r`}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Cardápio Digital</h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </Card>
  );
};

export default Sidebar;
