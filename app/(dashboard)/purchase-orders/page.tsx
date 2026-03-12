"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { FilterBar } from "@/components/common/filter-bar";
import { POStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchaseOrderSummaries, poStatusLabels } from "@/lib/mock/purchase-orders";
import { suppliers } from "@/lib/mock/suppliers";
import type { PurchaseOrderSummary, POStatus } from "@/types/purchase";
import { FileText, MoreHorizontal } from "lucide-react";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";

const statusOptions: SelectOption[] = Object.entries(poStatusLabels).map(
  ([value, label]) => ({ value, label })
);
const supplierOptions: SelectOption[] = suppliers.map((s) => ({
  value: s.id,
  label: s.name,
}));

const PAGE_SIZE = 10;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return purchaseOrderSummaries.filter((po) => {
      const matchSearch =
        !search ||
        po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = !supplierId || po.supplierId === supplierId;
      const matchStatus = !status || po.status === status;
      return matchSearch && matchSupplier && matchStatus;
    });
  }, [search, supplierId, status]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalOrders = purchaseOrderSummaries.length;
  const openOrders = useMemo(
    () =>
      purchaseOrderSummaries.filter(
        (po) =>
          po.status === "draft" ||
          po.status === "approved" ||
          po.status === "issued" ||
          po.status === "partial_receipt"
      ).length,
    []
  );
  const delayedOrders = 3;

  const resetFilters = useCallback(() => {
    setSearch("");
    setSupplierId("");
    setStatus("");
    setPage(1);
  }, []);

  const handleSupplierChange = useCallback((v: string) => {
    setSupplierId(v);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((v: string) => {
    setStatus(v);
    setPage(1);
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "poNumber",
        header: "PO 번호",
        minWidth: 120,
        maxWidth: 140,
        cell: (row: PurchaseOrderSummary) => (
          <span className="font-medium text-primary">{row.poNumber}</span>
        ),
      },
      { key: "supplierName", header: "공급사", minWidth: 160, maxWidth: 200 },
      {
        key: "itemCount",
        header: "품목수",
        minWidth: 80,
        maxWidth: 80,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (row: PurchaseOrderSummary) => `${row.itemCount}건`,
      },
      {
        key: "totalAmount",
        header: "총금액",
        minWidth: 140,
        maxWidth: 160,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (row: PurchaseOrderSummary) => formatCurrency(row.totalAmount),
      },
      {
        key: "dueDate",
        header: "납기일",
        minWidth: 110,
        maxWidth: 110,
        cell: (row: PurchaseOrderSummary) => formatDate(row.dueDate),
      },
      {
        key: "status",
        header: "상태",
        minWidth: 110,
        maxWidth: 110,
        cell: (row: PurchaseOrderSummary) => <POStatusBadge status={row.status} />,
      },
      { key: "assignedTo", header: "담당자", minWidth: 100, maxWidth: 120 },
      {
        key: "action",
        header: "",
        minWidth: 60,
        maxWidth: 60,
        cell: (row: PurchaseOrderSummary) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/purchase-orders/${row.id}`);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="구매오더 현황"
        description="전체 구매오더를 조회하고 상태를 관리합니다."
        actions={
          <Link href="/purchase-orders/create">
            <Button size="sm">
              <FileText className="mr-2 h-4 w-4" />
              신규 구매오더
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              전체 발주 건수
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              진행 중 발주
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              납기 지연 발주
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">
              {delayedOrders}
            </p>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        searchPlaceholder="PO 번호, 공급사명 검색..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            type: "select",
            placeholder: "공급사",
            options: supplierOptions,
            value: supplierId,
            onChange: handleSupplierChange,
          },
          {
            type: "select",
            placeholder: "상태",
            options: statusOptions,
            value: status,
            onChange: handleStatusChange,
          },
        ]}
        onReset={resetFilters}
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-end">
          <DataGridToolbar />
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<PurchaseOrderSummary>
              columns={columns}
              data={paginated}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => router.push(`/purchase-orders/${row.id}`)}
              pagination={{
                page,
                pageSize: PAGE_SIZE,
                total: filtered.length,
                onPageChange: setPage,
              }}
              variant="striped"
              maxHeight="100%"
              emptyMessage="조건에 맞는 구매오더가 없습니다."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
