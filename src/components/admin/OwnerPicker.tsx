import { useState } from "react";
import { Check, ChevronDown, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type OwnerInstructor = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type OwnerCompany = {
  id: string;
  name: string;
  main_instructor_id: string | null;
};

export type OwnerSelection =
  | { kind: "user"; id: string }
  | { kind: "company"; id: string; mainInstructorId: string | null };

interface OwnerPickerProps {
  instructors: OwnerInstructor[];
  companies: OwnerCompany[];
  ownerType: "user" | "company" | null | undefined;
  ownerId: string | null | undefined;
  instructorId: string | null | undefined;
  onSelect: (sel: OwnerSelection) => void;
  disabled?: boolean;
  className?: string;
}

function instructorLabel(i?: OwnerInstructor): string {
  if (!i) return "";
  const name = `${i.first_name || ""} ${i.last_name || ""}`.trim();
  return name || "(No name)";
}

export default function OwnerPicker({
  instructors,
  companies,
  ownerType,
  ownerId,
  instructorId,
  onSelect,
  disabled,
  className,
}: OwnerPickerProps) {
  const [open, setOpen] = useState(false);

  const isCompany = ownerType === "company";
  const selectedCompany = isCompany ? companies.find((c) => c.id === ownerId) : undefined;
  const selectedInstructor = !isCompany
    ? instructors.find((i) => i.id === (ownerId || instructorId))
    : undefined;

  const triggerLabel = selectedCompany
    ? selectedCompany.name
    : selectedInstructor
    ? instructorLabel(selectedInstructor)
    : "Select owner...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedCompany ? (
              <Building2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
            ) : selectedInstructor ? (
              <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
            ) : null}
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search instructors or companies..." autoFocus />
          <CommandList>
            <CommandEmpty>No matches found.</CommandEmpty>
            {instructors.length > 0 && (
              <CommandGroup heading="Instructors">
                {instructors.map((inst) => {
                  const label = instructorLabel(inst);
                  const isSelected = !isCompany && (ownerId || instructorId) === inst.id;
                  return (
                    <CommandItem
                      key={`u-${inst.id}`}
                      value={`instructor ${label}`}
                      className="data-[selected=true]:bg-muted data-[selected=true]:text-foreground aria-selected:bg-muted aria-selected:text-foreground"
                      onSelect={() => {
                        onSelect({ kind: "user", id: inst.id });
                        setOpen(false);
                      }}
                    >
                      <User className="h-3.5 w-3.5 mr-2 opacity-60" />
                      <span className="truncate">{label}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {companies.length > 0 && (
              <CommandGroup heading="Companies">
                {companies.map((c) => {
                  const isSelected = isCompany && ownerId === c.id;
                  return (
                    <CommandItem
                      key={`c-${c.id}`}
                      value={`company ${c.name}`}
                      className="data-[selected=true]:bg-muted data-[selected=true]:text-foreground aria-selected:bg-muted aria-selected:text-foreground"
                      onSelect={() => {
                        onSelect({
                          kind: "company",
                          id: c.id,
                          mainInstructorId: c.main_instructor_id,
                        });
                        setOpen(false);
                      }}
                    >
                      <Building2 className="h-3.5 w-3.5 mr-2 opacity-60" />
                      <span className="truncate">{c.name}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
