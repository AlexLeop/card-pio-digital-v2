
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Star, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProductImage {
  url: string;
  is_primary: boolean;
  order: number;
}

interface ImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  storeId: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange, storeId }) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: ProductImage[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name} não é uma imagem válida`,
            variant: "destructive"
          });
          continue;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 5MB`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        newImages.push({
          url: publicUrl,
          is_primary: newImages.length === 0,
          order: newImages.length
        });
      }

      onImagesChange(newImages);
      toast({
        title: "Imagens enviadas com sucesso!",
        description: `${files.length} imagem(ns) adicionada(s)`
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao enviar imagens",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    
    // Tentar remover do storage
    try {
      const url = new URL(imageToRemove.url);
      const pathParts = url.pathname.split('/');
      const bucketPath = pathParts.slice(-2).join('/'); // pegar store_id/filename
      await supabase.storage.from('product-images').remove([bucketPath]);
    } catch (error) {
      console.error('Erro ao remover imagem do storage:', error);
    }

    const newImages = images.filter((_, i) => i !== index);
    
    // Reordenar e ajustar primary se necessário
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i,
      is_primary: i === 0 || (img.is_primary && i === 0)
    }));

    onImagesChange(reorderedImages);
    
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida com sucesso"
    });
  };

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }));
    onImagesChange(newImages);
    
    toast({
      title: "Imagem principal definida",
      description: "A imagem foi definida como principal"
    });
  };

  const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= newImages.length) return;
    
    [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
    
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      order: i
    }));
    
    onImagesChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Imagens do Produto</Label>
        <p className="text-xs text-gray-500 mb-2">
          Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB por imagem.
        </p>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Enviando...' : 'Adicionar Imagens'}
          </Button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {images.length} imagem(ns) adicionada(s)
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={`Produto ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewImage(image.url)}
                  />
                </div>
                
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={image.is_primary ? "default" : "secondary"}
                    onClick={() => setPrimaryImage(index)}
                    className="h-8 w-8 p-0"
                    title="Definir como principal"
                  >
                    <Star className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewImage(image.url)}
                    className="h-8 w-8 p-0"
                    title="Visualizar"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="h-8 w-8 p-0"
                    title="Remover"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Principal
                  </div>
                )}
                
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
