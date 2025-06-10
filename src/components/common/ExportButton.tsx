import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Database } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  generateReport: (data: any[]) => any;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  generateReport, 
  disabled = false 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json') => {
    if (data.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há dados disponíveis para exportação.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      if (format === 'csv') {
        const reportData = generateReport(data);
        exportToCSV(reportData);
      } else {
        const timestamp = new Date().toISOString().split('T')[0];
        exportToJSON(data, `dados_${timestamp}`);
      }
      
      toast({
        title: "Exportação concluída",
        description: `Dados exportados em formato ${format.toUpperCase()} com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Database className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;