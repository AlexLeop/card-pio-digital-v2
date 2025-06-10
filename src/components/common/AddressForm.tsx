
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search } from 'lucide-react';
import { AddressData } from '@/types'; // Usar tipo centralizado

// Remover interface AddressData duplicada

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  errors?: Record<string, string>;
}

const AddressForm: React.FC<AddressFormProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleZipCodeSearch = async () => {
    const zipCode = value.zip_code.replace(/\D/g, '');
    
    if (zipCode.length !== 8) {
      setError('CEP deve conter 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }

      onChange({
        ...value,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      });
    } catch (err) {
      setError('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleZipCodeChange = (newZipCode: string) => {
    // Formatar CEP
    const formatted = newZipCode
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);

    onChange({
      ...value,
      zip_code: formatted
    });
  };

  const handleFieldChange = (field: keyof AddressData, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip_code">CEP *</Label>
          <div className="flex space-x-2">
            <Input
              id="zip_code"
              value={value.zip_code}
              onChange={(e) => handleZipCodeChange(e.target.value)}
              placeholder="00000-000"
              disabled={disabled}
              maxLength={9}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleZipCodeSearch}
              disabled={loading || disabled || value.zip_code.length < 9}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={value.number}
            onChange={(e) => handleFieldChange('number', e.target.value)}
            placeholder="123"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={value.complement}
            onChange={(e) => handleFieldChange('complement', e.target.value)}
            placeholder="Apto 101"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">Logradouro *</Label>
        <Input
          id="street"
          value={value.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          placeholder="Rua das Flores"
          disabled={disabled}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Bairro *</Label>
          <Input
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
            placeholder="Centro"
            disabled={disabled}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={value.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="São Paulo"
            disabled={disabled}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado *</Label>
          <Input
            id="state"
            value={value.state}
            onChange={(e) => handleFieldChange('state', e.target.value.toUpperCase())}
            placeholder="SP"
            disabled={disabled}
            maxLength={2}
            required
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressForm;
