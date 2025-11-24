import React, { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from 'lib/utils'; // Assuming you have a utility function for class names
import { Badge } from 'components/ui/badge.jsx'; // Assuming you have a Badge component
import { Button } from 'components/ui/button.jsx'; // Assuming you have a Button component
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from 'components/ui/command.jsx'; // Assuming you have a Command component
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'components/ui/popover.jsx'; // Assuming you have a Popover component

const MultiSelect = ({ options, selected, onChange, className, ...props }) => {
  const [open, setOpen] = useState(false);

  const handleUnselect = (item) => {
    onChange(selected.filter((i) => i.value !== item.value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${selected.length > 0 ? 'h-full' : 'h-10'}`}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.map((item) => (
              <Badge
                variant="secondary"
                key={item.value}
                className="mr-1 mb-1"
                onClick={() => handleUnselect(item)}
              >
                {item.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnselect(item);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className={className}>
          <CommandInput placeholder="Buscar..." />
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup className="overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onChange(
                    selected.some((item) => item.value === option.value)
                      ? selected.filter((item) => item.value !== option.value)
                      : [...selected, option]
                  );
                  setOpen(true);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.some((item) => item.value === option.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;
