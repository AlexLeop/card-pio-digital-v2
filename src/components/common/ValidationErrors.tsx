import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ValidationError } from '@/hooks/useValidation';

interface ValidationErrorsProps {
  errors: ValidationError[];
  className?: string;
}

const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors, className = '' }) => {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {error.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default ValidationErrors;
// Componente para erro de campo específico
interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError = ({ error, className = '' }: FieldErrorProps) => {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-500 mt-1 ${className}`}>
      {error}
    </p>
  );
};