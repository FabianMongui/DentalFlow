import React, { Children, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icons';

interface FakeChangeEvent {
  target: { value: string };
}

interface SelectProps {
  value: string;
  onChange: (event: FakeChangeEvent) => void;
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

interface ParsedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type OptionElementProps = { value?: string; children?: React.ReactNode; disabled?: boolean };

const parseOptions = (children: React.ReactNode): ParsedOption[] => {
  const options: ParsedOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionElementProps>(child)) return;
    const label = typeof child.props.children === 'string' ? child.props.children : String(child.props.children ?? '');
    const value = child.props.value !== undefined ? String(child.props.value) : label;
    options.push({ value, label, disabled: child.props.disabled });
  });
  return options;
};

export const Select = ({ value, onChange, children, className = '', wrapperClassName = '', disabled = false }: SelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => parseOptions(children), [children]);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectOption = (option: ParsedOption) => {
    if (option.disabled) return;
    onChange({ target: { value: option.value } });
    setOpen(false);
  };

  return (
    <div className={`relative ${wrapperClassName}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`appearance-none bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-left text-slate-700 ${open ? 'ring-2 ring-primary bg-white' : ''} ${className}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
      </button>
      <Icons.ChevronDown className={`w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />

      {open && !disabled && (
        <div className="absolute z-20 top-full mt-2 left-0 w-full max-h-64 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => selectOption(option)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${
                option.value === value ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
              } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Icons.Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
