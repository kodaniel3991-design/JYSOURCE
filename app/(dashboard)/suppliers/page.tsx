"use client";

import { useCallback, useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { SupplierStatusBadge } from "@/components/common/status-badge";
import { SupplierGradeBadge } from "@/components/common/status-badge";
import { SupplierDetailSheet } from "@/components/suppliers/supplier-detail-sheet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { suppliers, getSupplierDetailById } from "@/lib/mock/suppliers";
import type { Supplier } from "@/types/supplier";
import type { SupplierDetail } from "@/types/supplier";
import { UserPlus, Eye } from "lucide-react";

const countryOptions: SelectOption[] = [
  { value: "", label: "All countries" },
  { value: "KR", label: "Korea" },
  { value: "JP", label: "Japan" },
  { value: "DE", label: "Germany" },
  { value: "CN", label: "China" },
];

const gradeOptions: SelectOption[] = [
  { value: "", label: "All grades" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

const statusOptions: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [grade, setGrade] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactName.toLowerCase().includes(search.toLowerCase());
      const matchCountry = !country || s.country === country;
      const matchGrade = !grade || s.grade === grade;
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchCountry && matchGrade && matchStatus;
    });
  }, [search, country, grade, statusFilter]);

  const selectedDetail: SupplierDetail | null = useMemo(
    () => (selectedSupplierId ? getSupplierDetailById(selectedSupplierId) ?? null : null),
    [selectedSupplierId]
  );

  const supplierColumns = useMemo(
    () => [
      {
        key: "name",
        header: "구매처명",
        minWidth: 180,
        maxWidth: 220,
        cell: (row: Supplier) => <span className="font-semibold text-slate-900 truncate">{row.name}</span>,
      },
      {
        key: "country",
        header: "국가",
        minWidth: 80,
        maxWidth: 90,
        cell: (row: Supplier) => row.country,
      },
      {
        key: "contactName",
        header: "담당자",
        minWidth: 100,
        maxWidth: 120,
        cell: (row: Supplier) => row.contactName,
      },
      {
        key: "contactPhone",
        header: "연락처",
        minWidth: 130,
        maxWidth: 150,
        cell: (row: Supplier) => (
          <span className="text-muted-foreground truncate">{row.contactPhone}</span>
        ),
      },
      {
        key: "totalSpend",
        header: "거래금액",
        align: "right" as const,
        minWidth: 120,
        maxWidth: 140,
        cell: (row: Supplier) => formatCurrency(row.totalSpend),
        cellClassName: "text-right",
        headerClassName: "text-right",
      },
      {
        key: "grade",
        header: "등급",
        minWidth: 70,
        maxWidth: 80,
        cell: (row: Supplier) => <SupplierGradeBadge grade={row.grade} />,
      },
      {
        key: "status",
        header: "상태",
        minWidth: 80,
        maxWidth: 90,
        cell: (row: Supplier) => <SupplierStatusBadge status={row.status} />,
      },
      {
        key: "action",
        header: "",
        minWidth: 90,
        maxWidth: 100,
        align: "right" as const,
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (row: Supplier) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSupplierId(row.id);
            }}
          >
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier information and performance"
        actions={
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            + Add Supplier
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search suppliers..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            type: "select",
            placeholder: "Country",
            options: countryOptions,
            value: country,
            onChange: setCountry,
          },
          {
            type: "select",
            placeholder: "Grade",
            options: gradeOptions,
            value: grade,
            onChange: setGrade,
          },
          {
            type: "select",
            placeholder: "Status",
            options: statusOptions,
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        onReset={useCallback(() => {
          setSearch("");
          setCountry("");
          setGrade("");
          setStatusFilter("");
        }, [])}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-end">
              <DataGridToolbar />
            </CardHeader>
            <CardContent className="space-y-3">
              <MasterListGrid<Supplier>
                columns={supplierColumns}
                data={filtered}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => setSelectedSupplierId(row.id)}
                emptyMessage={
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="font-medium text-slate-800">
                      조회된 구매처가 없습니다
                    </p>
                    <p>검색/필터 조건을 조정해 보세요.</p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardContent className="pt-6">
            {selectedDetail ? (
              <SupplierDetailSheet
                supplier={selectedDetail}
                onClose={() => setSelectedSupplierId(null)}
              />
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Select a supplier to view details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
