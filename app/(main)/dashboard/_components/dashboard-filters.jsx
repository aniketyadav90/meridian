import {
  Calendar,
  RotateCcw,
  Search,
  Download,
  Building,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { defaultCategories } from "@/data/categories";

export const DATE_PRESETS = [
  { value: "7D", label: "Last 7 Days" },
  { value: "30D", label: "Last 30 Days" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_MONTH", label: "Last Month" },
  { value: "90D", label: "Last 90 Days" },
  { value: "YTD", label: "Year to Date" },
  { value: "ALL", label: "All Time" },
  { value: "CUSTOM", label: "Custom Range" },
];

export function DashboardFilters({
  accounts = [],
  filters,
  onFilterChange,
  onResetFilters,
  onExportCSV,
  totalResultsCount = 0,
}) {

  const activeFilterCount =
    (filters.datePreset !== "30D" ? 1 : 0) +
    (filters.accountId !== "ALL" ? 1 : 0) +
    (filters.type !== "ALL" ? 1 : 0) +
    (filters.category !== "ALL" ? 1 : 0) +
    (filters.search.trim() ? 1 : 0) +
    (filters.datePreset === "CUSTOM" && (filters.customStart || filters.customEnd) ? 1 : 0);

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3 mb-6 transition-all">
      {/* Top Bar: Primary Slicers */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, merchants, notes..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9 h-10 bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Center/Right: Quick Slicers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Preset */}
          <div className="w-[155px]">
            <Select
              value={filters.datePreset}
              onValueChange={(val) => onFilterChange("datePreset", val)}
            >
              <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 text-xs sm:text-sm font-medium">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-blue-600 shrink-0" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Filter */}
          <div className="w-[150px]">
            <Select
              value={filters.accountId}
              onValueChange={(val) => onFilterChange("accountId", val)}
            >
              <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 text-xs sm:text-sm font-medium">
                <Building className="mr-1.5 h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                {accounts.map((ac) => (
                  <SelectItem key={ac.id} value={ac.id}>
                    {ac.name} {ac.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="w-[130px]">
            <Select
              value={filters.type}
              onValueChange={(val) => onFilterChange("type", val)}
            >
              <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 text-xs sm:text-sm font-medium">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="RECURRING">Recurring Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-[145px]">
            <Select
              value={filters.category}
              onValueChange={(val) => onFilterChange("category", val)}
            >
              <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 text-xs sm:text-sm font-medium">
                <Tag className="mr-1.5 h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="ALL">All Categories</SelectItem>
                {defaultCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced / Custom Date Toggle */}
          {filters.datePreset === "CUSTOM" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-dashed border-blue-400 bg-blue-50/50 text-blue-700 text-xs"
                >
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Custom Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-3" align="end">
                <p className="text-xs font-semibold text-slate-700">Custom Date Range</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={filters.customStart || ""}
                      onChange={(e) => onFilterChange("customStart", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={filters.customEnd || ""}
                      onChange={(e) => onFilterChange("customEnd", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-10 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}

          {/* Export CSV button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="h-10 px-3 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 ml-auto lg:ml-0"
            title="Export filtered records to CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Active Filter Badges & Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Active Filters:
          </span>
          {filters.datePreset !== "30D" && (
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs py-0.5 px-2 font-normal"
            >
              Range: {DATE_PRESETS.find((p) => p.value === filters.datePreset)?.label}
              <button
                onClick={() => onFilterChange("datePreset", "30D")}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.accountId !== "ALL" && (
            <Badge
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 text-xs py-0.5 px-2 font-normal"
            >
              Account: {accounts.find((a) => a.id === filters.accountId)?.name || filters.accountId}
              <button
                onClick={() => onFilterChange("accountId", "ALL")}
                className="ml-1 hover:text-indigo-900"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.type !== "ALL" && (
            <Badge
              variant="secondary"
              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs py-0.5 px-2 font-normal"
            >
              Type: {filters.type}
              <button
                onClick={() => onFilterChange("type", "ALL")}
                className="ml-1 hover:text-purple-900"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.category !== "ALL" && (
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs py-0.5 px-2 font-normal"
            >
              Category:{" "}
              {defaultCategories.find((c) => c.id === filters.category)?.name || filters.category}
              <button
                onClick={() => onFilterChange("category", "ALL")}
                className="ml-1 hover:text-emerald-900"
              >
                ×
              </button>
            </Badge>
          )}

          {filters.search.trim() && (
            <Badge
              variant="secondary"
              className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs py-0.5 px-2 font-normal"
            >
              Search: &quot;{filters.search}&quot;
              <button
                onClick={() => onFilterChange("search", "")}
                className="ml-1 hover:text-amber-900"
              >
                ×
              </button>
            </Badge>
          )}

          {activeFilterCount === 0 && (
            <span className="text-[11px] text-slate-400 italic">
              Showing default 30-day window across all accounts
            </span>
          )}
        </div>

        <div className="text-[11px] font-medium text-slate-500">
          Showing <span className="text-slate-900 font-bold">{totalResultsCount}</span> records
        </div>
      </div>
    </div>
  );
}
