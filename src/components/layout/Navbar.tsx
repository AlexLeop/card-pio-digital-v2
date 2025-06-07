
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Painel Administrativo</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Perfil
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
