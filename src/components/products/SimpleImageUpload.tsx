
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Star, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProductImage } from '@/types'; // Usar tipo centralizado

// Remover interface ProductImage duplicada

interface SimpleImageUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  storeId: string;
}

const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({ images, onImagesChange, storeId }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ensureBucketExists = async () => {
    try {
      // Verificar se o bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
      
      if (!bucketExists) {
        // Tentar criar o bucket
        const { error } = await supabase.storage.createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error && !error.message.includes('already exists')) {
          console.error('Erro ao criar bucket:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar bucket:', error);
      return false;
    }
  };

  // Melhorar o tratamento de erro no upload (linha 80-120)
  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    
    try {
      // Verificar se o bucket existe antes do upload
      await ensureBucketExists();
      
      const newImages: ProductImage[] = [...images];
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: `${file.name} não é uma imagem válida`,
            variant: "destructive"
          });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 5MB`,
            variant: "destructive"
          });
          continue;
        }

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Erro no upload:', error);
            toast({
              title: "Erro no upload",
              description: `Falha ao enviar ${file.name}: ${error.message}`,
              variant: "destructive"
            });
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          newImages.push({
            url: publicUrl,
            is_primary: newImages.length === 0,
            order: newImages.length
          });
          
          uploadedCount++;
        } catch (uploadError) {
          console.error('Erro no upload do arquivo:', uploadError);
          toast({
            title: "Erro no upload",
            description: `Falha ao processar ${file.name}`,
            variant: "destructive"
          });
        }
      }

      onImagesChange(newImages);
      
      if (uploadedCount > 0) {
        toast({
          title: "Imagens enviadas com sucesso!",
          description: `${uploadedCount} imagem(ns) adicionada(s)`
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro ao enviar imagens",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
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

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors duration-200">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <Label className="text-lg font-medium text-gray-900 block mb-2">
            Adicionar Imagens do Produto
          </Label>
          <p className="text-sm text-gray-500 mb-4">
            Formatos aceitos: JPG, PNG, GIF, WebP. Tamanho máximo: 5MB por imagem.
          </p>
          
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
            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Enviando...' : 'Selecionar Imagens'}
          </Button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">
              Imagens Adicionadas ({images.length})
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={`Produto ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
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
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="h-8 w-8 p-0"
                    title="Remover"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
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
    </div>
  );
};

export default SimpleImageUpload;
