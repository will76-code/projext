import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

export default function AdvancedSearchFilter({ data, columns, onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Apply search and filters
  const filtered = useMemo(() => {
    let result = data || [];

    // Keyword search across all text fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(term)
        )
      );
    }

    // Apply specific filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value.length > 0) {
        result = result.filter(item =>
          value.includes(String(item[key]))
        );
      }
    });

    // Sort
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortBy, sortOrder]);

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const options = {};
    columns.forEach(col => {
      if (col.filterable) {
        const values = new Set();
        data?.forEach(item => {
          if (item[col.key]) {
            values.add(String(item[col.key]));
          }
        });
        options[col.key] = Array.from(values).sort();
      }
    });
    return options;
  }, [data, columns]);

  const toggleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key]?.includes(value)
        ? prev[key].filter(v => v !== value)
        : [...(prev[key] || []), value]
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
    setSortBy(null);
  };

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  onFilter?.(filtered);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          type="text"
          placeholder="Search all fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-700/50 border-purple-500/30"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-purple-500/50"
        >
          🔍 Filters
          {activeFilterCount > 0 && <Badge className="ml-2 bg-purple-600">{activeFilterCount}</Badge>}
        </Button>
        {(searchTerm || activeFilterCount > 0 || sortBy) && (
          <Button
            size="sm"
            variant="outline"
            onClick={clearFilters}
            className="border-red-500/50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-3 space-y-3">
          {/* Sort Options */}
          <div>
            <h6 className="text-xs font-semibold text-slate-300 mb-2">Sort By</h6>
            <div className="flex gap-2 flex-wrap">
              {columns.map(col => (
                <Button
                  key={col.key}
                  size="sm"
                  variant={sortBy === col.key ? "default" : "outline"}
                  onClick={() => {
                    if (sortBy === col.key) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy(col.key);
                      setSortOrder("asc");
                    }
                  }}
                  className={sortBy === col.key ? "bg-purple-600" : "border-slate-500/50"}
                >
                  {col.label}
                  {sortBy === col.key && (
                    sortOrder === "asc" ? 
                    <ChevronUp className="w-3 h-3 ml-1" /> : 
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter By Column */}
          {columns.map(col => col.filterable && filterOptions[col.key] && (
            <div key={col.key}>
              <h6 className="text-xs font-semibold text-slate-300 mb-2">{col.label}</h6>
              <div className="flex gap-1 flex-wrap">
                {filterOptions[col.key].slice(0, 8).map(value => (
                  <Badge
                    key={value}
                    variant={filters[col.key]?.includes(value) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      filters[col.key]?.includes(value) ? "bg-purple-600" : "border-slate-500/50"
                    }`}
                    onClick={() => toggleFilter(col.key, value)}
                  >
                    {value}
                  </Badge>
                ))}
                {filterOptions[col.key].length > 8 && (
                  <span className="text-xs text-slate-500">+{filterOptions[col.key].length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Info */}
      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {data?.length || 0} results
      </p>
    </div>
  );
}