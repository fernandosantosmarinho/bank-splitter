import { Search, X, Filter, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Chip {
    key: string;
    label: string;
}

interface TransactionsToolbarProps {
    search: string;
    onSearchChange: (v: string) => void;
    typeFilter: 'all' | 'debit' | 'credit';
    onTypeFilterChange: (v: 'all' | 'debit' | 'credit') => void;
    chips: Chip[];
    onRemoveChip: (key: string) => void;
    onClearAll: () => void;
}

export function TransactionsToolbar({
    search,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    chips,
    onRemoveChip,
    onClearAll,
}: TransactionsToolbarProps) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search description..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border bg-background p-1 h-9">
                        <Button
                            variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => onTypeFilterChange('all')}
                            className="h-7 px-3 text-xs"
                        >
                            All
                        </Button>
                        <Button
                            variant={typeFilter === 'debit' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => onTypeFilterChange('debit')}
                            className="h-7 px-3 text-xs"
                        >
                            Debit
                        </Button>
                        <Button
                            variant={typeFilter === 'credit' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => onTypeFilterChange('credit')}
                            className="h-7 px-3 text-xs"
                        >
                            Credit
                        </Button>
                    </div>
                    {/* Optional: Add Export logic here if needed, but per instructions we keep it in the summary card */}
                </div>
            </div>

            {/* Active Filters (Chips) */}
            {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                        <Badge variant="secondary" key={chip.key} className="h-7 gap-1 pr-1.5 pl-2.5">
                            {chip.label}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 ml-1"
                                onClick={() => onRemoveChip(chip.key)}
                            >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Remove</span>
                            </Button>
                        </Badge>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={onClearAll}
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
