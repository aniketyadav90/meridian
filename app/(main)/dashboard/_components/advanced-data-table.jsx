"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Download,
  Edit,
  ExternalLink,
  CalendarClock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { defaultCategories, categoryColors } from "@/data/categories";
import Link from "next/link";

export function AdvancedDataTable({ transactions = [], onExportCSV }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Filtering
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Type
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const acct = (t.account?.name || "").toLowerCase();
        const amt = t.amount.toString();
        if (
          !desc.includes(query) &&
          !cat.includes(query) &&
          !acct.includes(query) &&
          !amt.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, searchTerm]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "date") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortField === "amount") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      } else if (sortField === "account") {
        valA = a.account?.name || "";
        valB = b.account?.name || "";
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getCategoryMeta = (catId) => {
    const meta = defaultCategories.find((c) => c.id === catId);
    return {
      name: meta ? meta.name : catId || "General",
      color: meta ? meta.color : categoryColors[catId] || "#64748b",
    };
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white mb-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            Detailed Transaction Ledger
            <Badge variant="secondary" className="text-xs font-normal">
              {filtered.length} Records
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Granular transactional records with full sorting, multi-attribute search, and export
          </CardDescription>
        </div>

        {/* Local Table Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="w-28">
            <Select
              value={typeFilter}
              onValueChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onExportCSV}
            className="h-8 px-2.5 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            title="Download CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/75">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  onClick={() => handleSort("date")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("description")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 select-none min-w-[160px]"
                >
                  <div className="flex items-center gap-1">
                    Description
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("category")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("account")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Account
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("type")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    Type
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer text-xs font-semibold text-slate-700 text-right select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>

                <TableHead className="text-xs font-semibold text-slate-700 text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-xs text-muted-foreground"
                  >
                    No transactions found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((tx) => {
                  const catMeta = getCategoryMeta(tx.category);
                  const isExpense = tx.type === "EXPENSE";

                  return (
                    <TableRow key={tx.id} className="hover:bg-slate-50/70 text-xs">
                      {/* Date */}
                      <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                        {format(new Date(tx.date), "MMM dd, yyyy")}
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                            {tx.description || "Untitled Transaction"}
                          </span>
                          {tx.isRecurring && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1 bg-purple-50 text-purple-700 border-purple-200"
                              title={`Recurring interval: ${tx.recurringInterval || "Regular"}`}
                            >
                              <CalendarClock className="h-2.5 w-2.5 mr-0.5" />
                              {tx.recurringInterval || "Rec"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catMeta.color }}
                          />
                          <span className="text-slate-700">{catMeta.name}</span>
                        </div>
                      </TableCell>

                      {/* Account */}
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {tx.account?.name ? (
                          <Link
                            href={`/account/${tx.accountId}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {tx.account.name}
                            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                          </Link>
                        ) : (
                          "Primary"
                        )}
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] py-0 px-1.5 font-medium ${
                            isExpense
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownRight className="h-2.5 w-2.5 mr-0.5 text-rose-600" />
                          ) : (
                            <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 text-emerald-600" />
                          )}
                          {tx.type}
                        </Badge>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right font-mono font-bold whitespace-nowrap">
                        <span className={isExpense ? "text-rose-600" : "text-emerald-600"}>
                          {isExpense ? "-" : "+"}${parseFloat(tx.amount).toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right whitespace-nowrap">
                        <Link href={`/transaction/create?edit=${tx.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-blue-600"
                            title="Edit transaction"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-2">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
