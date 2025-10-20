"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";

interface MultiSelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  placeholder = "선택하세요",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  const handleRemove = (optionValue: string) => {
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start bg-input-background border-input text-foreground hover:bg-muted"
          >
            {selectedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.map((label, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {label}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(value[index]);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="max-h-64 overflow-auto p-2">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => handleToggle(option.value)}
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <span className="flex-1">{option.label}</span>
                {value.includes(option.value) && <Check className="w-4 h-4 text-primary" />}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
