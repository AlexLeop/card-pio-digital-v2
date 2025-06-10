
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Import, Download } from 'lucide-react';
import { ImportData } from '@/types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: ImportData) => Promise<void>;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [jsonData, setJsonData] = useState('');
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJsonImport = async () => {
    try {
      setLoading(true);
      const data = JSON.parse(jsonData);
      await onImport(data);
      toast({ title: "Dados importados com sucesso!" });
      onClose();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Verifique o formato dos dados JSON",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async () => {
    try {
      setLoading(true);
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const product: any = {};
          headers.forEach((header, index) => {
            if (header === 'price') {
              product[header] = parseFloat(values[index]) || 0;
            } else if (header === 'ingredients' || header === 'allergens') {
              product[header] = values[index] ? values[index].split(';') : [];
            } else {
              product[header] = values[index] || '';
            }
          });
          products.push(product);
        }
      }
      
      await onImport({ products });
      toast({ title: "CSV importado com sucesso!" });
      onClose();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Verifique o formato do CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      products: [
        {
          name: "Pizza Margherita",
          description: "Pizza tradicional com molho de tomate, muçarela e manjericão",
          price: 35.90,
          category: "Pizzas",
          ingredients: ["massa", "molho de tomate", "muçarela", "manjericão"],
          allergens: ["glúten", "lactose"]
        }
      ],
      categories: [
        {
          name: "Pizzas",
          description: "Pizzas tradicionais e especiais"
        }
      ],
      addons: [
        {
          name: "Queijo extra",
          description: "Porção adicional de queijo",
          price: 5.00,
          category: "Extras"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-importacao.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsvTemplate = () => {
    const csvContent = "name,description,price,category,ingredients,allergens\n" +
      "Pizza Margherita,Pizza tradicional com molho de tomate,35.90,Pizzas,massa;molho de tomate;muçarela,glúten;lactose\n" +
      "Hambúrguer Clássico,Hambúrguer com carne e salada,25.50,Lanches,pão;carne;alface;tomate,glúten";

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-produtos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Import className="h-5 w-5 mr-2" />
            Importar Dados
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="json" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="json-data">Dados em formato JSON:</Label>
              <Button variant="outline" onClick={downloadTemplate} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template JSON
              </Button>
            </div>
            <Textarea
              id="json-data"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='{"products": [{"name": "Pizza", "price": 25.90, "category": "Pizzas"}]}'
              rows={15}
              className="font-mono text-sm"
            />
            <Button onClick={handleJsonImport} disabled={loading || !jsonData.trim()}>
              {loading ? 'Importando...' : 'Importar JSON'}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="csv-data">Dados em formato CSV:</Label>
              <Button variant="outline" onClick={downloadCsvTemplate} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template CSV
              </Button>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <p>Formato: name,description,price,category,ingredients,allergens</p>
              <p>Use ponto e vírgula (;) para separar ingredientes e alérgenos</p>
            </div>
            <Textarea
              id="csv-data"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="name,description,price,category,ingredients,allergens&#10;Pizza Margherita,Pizza tradicional,35.90,Pizzas,massa;molho;queijo,glúten;lactose"
              rows={15}
              className="font-mono text-sm"
            />
            <Button onClick={handleCsvImport} disabled={loading || !csvData.trim()}>
              {loading ? 'Importando...' : 'Importar CSV'}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Estrutura dos dados:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>products:</strong> Array com produtos (name, description, price, category)</li>
            <li><strong>categories:</strong> Array com categorias (name, description)</li>
            <li><strong>addons:</strong> Array com adicionais (name, description, price, category)</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportModal;
