"use client";

import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface ImportancePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

export function ImportancePicker({ value, onChange, label = "중요도" }: ImportancePickerProps) {
  const levels = [
    { value: "1", label: "1", color: "text-muted-foreground" },
    { value: "2", label: "2", color: "text-muted-foreground" },
    { value: "3", label: "3", color: "text-foreground" },
    { value: "4", label: "4", color: "text-warning" },
    { value: "5", label: "5", color: "text-destructive" },
  ];

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="flex items-center gap-4">
          {levels.map((level) => (
            <div key={level.value} className="flex items-center gap-2">
              <RadioGroupItem value={level.value} id={`importance-${level.value}`} />
              <Label
                htmlFor={`importance-${level.value}`}
                className={`cursor-pointer ${level.color}`}
              >
                {level.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
