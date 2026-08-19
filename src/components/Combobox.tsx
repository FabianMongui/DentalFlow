import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icons';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

export const Combobox = ({ value, onChange, options, placeholder = 'Buscar...', emptyLabel = 'Sin resultados.', className }: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hasEdited, setHasEdited] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const normalized = hasEdited ? query.trim().toLowerCase() : '';
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, hasEdited]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setQuery(selected?.label ?? '');
    setHasEdited(false);
    setHighlighted(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const selectOption = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, filtered.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = filtered[highlighted];
      if (option) selectOption(option);
    }
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      {open ? (
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setHasEdited(true); setHighlighted(0); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-12 bg-white border border-primary rounded-xl pl-4 pr-10 outline-none ring-2 ring-primary/20 transition-all text-sm font-medium text-slate-700"
        />
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all flex items-center text-left"
        >
          <span className={`text-sm font-medium truncate ${selected ? 'text-slate-700' : 'text-slate-400'}`}>
            {selected?.label ?? placeholder}
          </span>
        </button>
      )}
      <Icons.Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />

      {open && (
        <div className="absolute z-20 top-full mt-2 left-0 w-full max-h-64 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">{emptyLabel}</p>
          ) : (
            filtered.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => selectOption(option)}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${
                  index === highlighted ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Icons.Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
