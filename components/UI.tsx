import React from 'react';
import { Loader2 } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold pearl-transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-full",
    md: "px-6 py-3 text-base rounded-full",
    lg: "px-8 py-4 text-lg rounded-full"
  };

  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':
        return {
          background: 'var(--navy)',
          color: 'var(--white)',
          boxShadow: '0 4px 12px rgba(26, 26, 26, 0.15)'
        };
      case 'secondary':
        return {
          background: 'var(--charcoal)',
          color: 'var(--white)',
          boxShadow: '0 2px 8px rgba(26, 26, 26, 0.1)'
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--navy)',
          border: '2px solid var(--navy)'
        };
      case 'danger':
        return {
          background: '#DC2626',
          color: 'var(--white)',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
        };
      default:
        return {};
    }
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={getVariantStyles()}
      disabled={isLoading || disabled}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = '0 8px 20px rgba(26, 26, 26, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          if (variant === 'primary') e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 26, 26, 0.15)';
        }
      }}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-semibold mb-2" 
          style={{ color: 'var(--navy)' }}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-5 py-3.5 rounded-2xl outline-none pearl-transition ${className}`}
        style={{
          border: error ? '2px solid #DC2626' : '2px solid var(--cream-dark)',
          background: 'var(--white)',
          color: 'var(--navy)',
          fontSize: '1rem'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--navy)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.08)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#DC2626' : 'var(--cream-dark)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm font-medium" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-sm font-semibold mb-2" 
          style={{ color: 'var(--navy)' }}
        >
          {label}
        </label>
      )}
      <select
        className={`w-full px-5 py-3.5 rounded-2xl outline-none pearl-transition ${className}`}
        style={{
          border: '2px solid var(--cream-dark)',
          background: 'var(--white)',
          color: 'var(--navy)',
          fontSize: '1rem'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--navy)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 26, 26, 0.08)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--cream-dark)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div 
      className={`pearl-card pearl-card-hover ${className}`}
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--card-radius)',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(26, 26, 26, 0.06)',
        border: '1px solid rgba(26, 26, 26, 0.06)'
      }}
    >
      {children}
    </div>
  );
};

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-lg"
      style={{ background: 'rgba(26, 26, 26, 0.5)' }}
    >
      <div 
        className="w-full max-w-2xl flex flex-col max-h-[90vh] animate-scale-in"
        style={{
          background: 'var(--white)',
          borderRadius: 'var(--card-radius)',
          boxShadow: '0 25px 50px rgba(26, 26, 26, 0.25)',
          border: '1px solid rgba(26, 26, 26, 0.08)'
        }}
      >
        {/* Header */}
        <div 
          className="px-8 py-6 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--cream-dark)' }}
        >
          <h3 className="font-bold text-2xl pearl-heading">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl pearl-transition hover:bg-gray-100"
            style={{ color: 'var(--navy)' }}
          >
            <span className="text-3xl font-light">&times;</span>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};