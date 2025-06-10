
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ProductIngredientsProps {
  ingredients: string[];
  allergens: string[];
  onIngredientsChange: (ingredients: string[]) => void;
  onAllergensChange: (allergens: string[]) => void;
}

const ProductIngredients: React.FC<ProductIngredientsProps> = ({
  ingredients,
  allergens,
  onIngredientsChange,
  onAllergensChange
}) => {
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentAllergen, setCurrentAllergen] = useState('');

  const addIngredient = () => {
    if (currentIngredient && !ingredients.includes(currentIngredient)) {
      onIngredientsChange([...ingredients, currentIngredient]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(ingredients.filter(i => i !== ingredient));
  };

  const addAllergen = () => {
    if (currentAllergen && !allergens.includes(currentAllergen)) {
      onAllergensChange([...allergens, currentAllergen]);
      setCurrentAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    onAllergensChange(allergens.filter(a => a !== allergen));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Ingredientes e Alérgenos</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Ingredientes</Label>
          <div className="flex space-x-2">
            <Input
              value={currentIngredient}
              onChange={(e) => setCurrentIngredient(e.target.value)}
              placeholder="Adicionar ingrediente"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
            />
            <Button type="button" onClick={addIngredient} variant="outline">
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ingredient => (
              <Badge key={ingredient} variant="secondary" className="flex items-center gap-1">
                {ingredient}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeIngredient(ingredient)} 
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alérgenos</Label>
          <div className="flex space-x-2">
            <Input
              value={currentAllergen}
              onChange={(e) => setCurrentAllergen(e.target.value)}
              placeholder="Adicionar alérgeno"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
            />
            <Button type="button" onClick={addAllergen} variant="outline">
              Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergens.map(allergen => (
              <Badge key={allergen} variant="destructive" className="flex items-center gap-1">
                {allergen}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeAllergen(allergen)} 
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductIngredients;
