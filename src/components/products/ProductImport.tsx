
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Category } from '@/types';

interface ProductImportProps {
  storeId: string;
  categories: Category[];
  onImportSuccess: () => void;
}

const ProductImport: React.FC<ProductImportProps> = ({ storeId, categories, onImportSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryId = (categoryName: string) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.id || null;
  };

  const validateAndParseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const requiredHeaders = ['Nome', 'Preço'];
    
    const missingHeaders = requiredHeaders.filter(required => 
      !headers.some(header => header.toLowerCase().includes(required.toLowerCase()))
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`);
    }

    const products = [];
    const parseErrors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        const product = {
          name: values[0] || '',
          description: values[1] || '',
          price: parseFloat(values[2]) || 0,
          sale_price: values[3] ? parseFloat(values[3]) : null,
          category_id: values[4] ? getCategoryId(values[4]) : null,
          image_url: values[5] || '',
          is_featured: values[6]?.toLowerCase() === 'sim',
          is_available: values[7]?.toLowerCase() !== 'não',
          is_active: values[8]?.toLowerCase() !== 'não',
          preparation_time: values[9] ? parseInt(values[9]) : null,
          allow_same_day_scheduling: values[10]?.toLowerCase() !== 'não',
          store_id: storeId
        };

        if (!product.name || product.price <= 0) {
          parseErrors.push(`Linha ${i + 1}: Nome e preço são obrigatórios`);
          continue;
        }

        products.push(product);
      } catch (error) {
        parseErrors.push(`Linha ${i + 1}: Erro ao processar dados`);
      }
    }

    return { products, errors: parseErrors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();
      const { products, errors } = validateAndParseCSV(text);
      
      setPreviewData(products);
      setErrors(errors);
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert(previewData);

      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${previewData.length} produtos importados com sucesso.`
      });

      setIsOpen(false);
      setPreviewData([]);
      setErrors([]);
      onImportSuccess();
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os produtos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Nome',
      'Descrição',
      'Preço',
      'Preço Promocional',
      'Categoria',
      'URL da Imagem',
      'Em Destaque',
      'Disponível',
      'Ativo',
      'Tempo de Preparo',
      'Agendamento Mesmo Dia'
    ];

    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_produtos.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Importar CSV</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">Arquivo CSV</Label>
            <Input
              ref={fileInputRef}
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Baixar Template</span>
          </Button>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Erros encontrados:</p>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div className="space-y-2">
              <Label>Preview dos dados ({previewData.length} produtos)</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                {previewData.slice(0, 5).map((product, index) => (
                  <div key={index} className="text-sm py-1 border-b last:border-b-0">
                    <strong>{product.name}</strong> - R$ {product.price.toFixed(2)}
                    {product.description && ` - ${product.description.substring(0, 50)}...`}
                  </div>
                ))}
                {previewData.length > 5 && (
                  <p className="text-sm text-gray-500 pt-2">
                    ... e mais {previewData.length - 5} produtos
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || previewData.length === 0 || errors.length > 0}
            >
              {loading ? 'Importando...' : 'Importar Produtos'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImport;
