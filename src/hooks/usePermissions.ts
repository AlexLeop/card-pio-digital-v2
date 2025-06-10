import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'manager' | 'employee';

export interface Permission {
  canViewReports: boolean;
  canManageStock: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canViewAllStores: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canViewReports: true,
    canManageStock: true,
    canExportData: true,
    canManageUsers: true,
    canViewAllStores: true
  },
  manager: {
    canViewReports: true,
    canManageStock: true,
    canExportData: true,
    canManageUsers: false,
    canViewAllStores: false
  },
  employee: {
    canViewReports: false,
    canManageStock: false,
    canExportData: false,
    canManageUsers: false,
    canViewAllStores: false
  }
};

export const usePermissions = () => {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [permissions, setPermissions] = useState<Permission>(ROLE_PERMISSIONS.employee);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Temporariamente definir como admin
        const role = (user.user_metadata?.role as UserRole) || 'admin';
        setUserRole(role);
        setPermissions(ROLE_PERMISSIONS[role]);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  return {
    userRole,
    permissions,
    hasPermission,
    loading
  };
};