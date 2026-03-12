"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { formatCurrency, formatDate } from "@/lib/utils";
import { purchaseOrders, poStatusLabels } from "@/lib/mock/purchase-orders";
import { Search, RotateCcw } from "lucide-react";
import type { PurchaseOrder, POItem } from "@/types/purchase";

type ReceiptStatusRow = {
  id: string;
  poNumber: string;
  modelCode: string;
  displayGroupLabel?: string;
  itemCode: string;
  itemName: string;
  specification: string;
  unit: string;
  orderQty: number;
  orderAmount: number;
  receiveQty: number;
  receiveAmount: number;
  unreceivedQty: number;
  unreceivedAmount: number;
  receiptRate: number;
  dueDate: string;
  status: PurchaseOrder["status"];
  supplierId: string;
  supplierName: string;
  rowKind?: "data" | "subtotal" | "total";
};

export default function PurchaseReceiptStatusPage() {
  type SearchParams = {
    plant: string;
    viewMode: "차종별" | "거래처별";
    fromDueDate: string;
    toDueDate: string;
    fromOrderDate: string;
    toOrderDate: string;
  };

  const initialParams: SearchParams = {
    plant: "",
    viewMode: "차종별",
    fromDueDate: "",
    toDueDate: "",
    fromOrderDate: "",
    toOrderDate: "",
  };

  const [draft, setDraft] = useState<SearchParams>(initialParams);
  const [criteria, setCriteria] = useState<SearchParams>(initialParams);

  const rows: ReceiptStatusRow[] = useMemo(() => {
    const getRate = (po: PurchaseOrder) => {
      switch (po.status) {
        case "partial_receipt":
          return 60;
        case "closed":
          return 100;
        default:
          return 0;
      }
    };

    const rows: ReceiptStatusRow[] = [];
    for (const po of purchaseOrders) {
      const rate = getRate(po);
      const items = Array.isArray(po.items) ? po.items : [];
      for (const item of items as POItem[]) {
        const orderAmount = item.amount;
        const receiveQty = Math.round((item.quantity * rate) / 100);
        const receiveAmount = Math.round((orderAmount * rate) / 100);
        const unreceivedQty = item.quantity - receiveQty;
        const unreceivedAmount = orderAmount - receiveAmount;
        const modelCode = item.itemCode.slice(0, 3); // 데모용 차종 코드

        rows.push({
          id: `${po.id}-${item.id}`,
          poNumber: po.poNumber,
          modelCode,
          itemCode: item.itemCode,
          itemName: item.itemName,
          specification: "",
          unit: "EA",
          orderQty: item.quantity,
          orderAmount,
          receiveQty,
          receiveAmount,
          unreceivedQty,
          unreceivedAmount,
          receiptRate: rate,
          dueDate: po.dueDate,
          status: po.status,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          rowKind: "data",
        });
      }
    }
    return rows;
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const due = new Date(row.dueDate);
      const matchDueFrom =
        !criteria.fromDueDate || due >= new Date(criteria.fromDueDate);
      const matchDueTo =
        !criteria.toDueDate || due <= new Date(criteria.toDueDate);

      const po = purchaseOrders.find((p) => p.poNumber === row.poNumber);
      const orderDate = po ? new Date(po.createdAt) : null;
      const matchOrderFrom =
        !criteria.fromOrderDate ||
        !orderDate ||
        orderDate >= new Date(criteria.fromOrderDate);
      const matchOrderTo =
        !criteria.toOrderDate ||
        !orderDate ||
        orderDate <= new Date(criteria.toOrderDate);

      return (
        matchDueFrom &&
        matchDueTo &&
        matchOrderFrom &&
        matchOrderTo
      );
    });
  }, [rows, criteria]);

  const totalOrdered = filtered.reduce(
    (sum, r) => sum + r.orderAmount,
    0
  );
  const totalReceived = filtered.reduce(
    (sum, r) => sum + r.receiveAmount,
    0
  );
  const overallRate =
    totalOrdered === 0
      ? 0
      : Math.round((totalReceived / totalOrdered) * 100);

  const displayRows = useMemo(() => {
    const mode = criteria.viewMode;

    // 집계 없이 전체 행만 보여줄 모드가 없으므로,
    // 차종별/거래처별 모두 그룹 집계 + SUB TOTAL/TOTAL 구성
    const getGroupKey = (row: ReceiptStatusRow) =>
      mode === "거래처별"
        ? row.supplierName || "-"
        : row.modelCode || "-";

    const getHeaderLabel = (row: ReceiptStatusRow) =>
      mode === "거래처별" ? row.supplierName : row.modelCode;

    const byKey = new Map<string, ReceiptStatusRow[]>();
    for (const row of filtered) {
      const key = getGroupKey(row);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(row);
    }

    const keys = Array.from(byKey.keys()).sort((a, b) =>
      a.localeCompare(b, "ko-KR")
    );

    const result: ReceiptStatusRow[] = [];

    let grandOrderQty = 0;
    let grandOrderAmt = 0;
    let grandRecvQty = 0;
    let grandRecvAmt = 0;
    let grandUnrecvQty = 0;
    let grandUnrecvAmt = 0;

    for (const key of keys) {
      const groupRows = byKey.get(key)!;
      let groupOrderQty = 0;
      let groupOrderAmt = 0;
      let groupRecvQty = 0;
      let groupRecvAmt = 0;
      let groupUnrecvQty = 0;
      let groupUnrecvAmt = 0;

      groupRows.forEach((row, index) => {
        const showLabel = index === 0 ? getHeaderLabel(row) : "";
        const dataRow: ReceiptStatusRow = {
          ...row,
          displayGroupLabel: showLabel,
          rowKind: "data",
        };
        result.push(dataRow);

        groupOrderQty += row.orderQty;
        groupOrderAmt += row.orderAmount;
        groupRecvQty += row.receiveQty;
        groupRecvAmt += row.receiveAmount;
        groupUnrecvQty += row.unreceivedQty;
        groupUnrecvAmt += row.unreceivedAmount;
      });

      grandOrderQty += groupOrderQty;
      grandOrderAmt += groupOrderAmt;
      grandRecvQty += groupRecvQty;
      grandRecvAmt += groupRecvAmt;
      grandUnrecvQty += groupUnrecvQty;
      grandUnrecvAmt += groupUnrecvAmt;

      const groupRate =
        groupOrderAmt === 0
          ? 0
          : Math.round((groupRecvAmt / groupOrderAmt) * 100);

      const subtotalRow: ReceiptStatusRow = {
        id: `subtotal-${mode}-${key}`,
        poNumber: "",
        modelCode: mode === "거래처별" ? "" : key,
        displayGroupLabel: "[SUB TOTAL]",
        itemCode: "",
        itemName: "",
        specification: "",
        unit: "",
        orderQty: groupOrderQty,
        orderAmount: groupOrderAmt,
        receiveQty: groupRecvQty,
        receiveAmount: groupRecvAmt,
        unreceivedQty: groupUnrecvQty,
        unreceivedAmount: groupUnrecvAmt,
        receiptRate: groupRate,
        dueDate: "",
        status: "closed",
        supplierId: "",
        supplierName: mode === "거래처별" ? key : "",
        rowKind: "subtotal",
      };
      result.push(subtotalRow);
    }

    const totalRate =
      grandOrderAmt === 0
        ? 0
        : Math.round((grandRecvAmt / grandOrderAmt) * 100);

    const totalRow: ReceiptStatusRow = {
      id: `total-${mode}-all`,
      poNumber: "",
      modelCode: "",
      displayGroupLabel: "[TOTAL]",
      itemCode: "",
      itemName: "",
      specification: "",
      unit: "",
      orderQty: grandOrderQty,
      orderAmount: grandOrderAmt,
      receiveQty: grandRecvQty,
      receiveAmount: grandRecvAmt,
      unreceivedQty: grandUnrecvQty,
      unreceivedAmount: grandUnrecvAmt,
      receiptRate: totalRate,
      dueDate: "",
      status: "closed",
      supplierId: "",
      supplierName: "",
      rowKind: "total",
    };
    result.push(totalRow);

    return result;
  }, [filtered, criteria.viewMode]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="발주대비 입고현황"
        description="사업장, 입고예정일자, 공급사 및 상태 조건으로 발주대비 입고현황을 조회합니다. (데모)"
      />

      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            검색 조건
          </span>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-[12px] text-slate-600">사업장</span>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={draft.plant}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, plant: e.target.value }))
                }
              >
                <option value="">전체</option>
                <option value="gimhae">김해공장</option>
                <option value="ulsan">울산공장</option>
                <option value="pyeongtaek">평택공장</option>
              </select>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] text-slate-600">입고예정일자</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={draft.fromDueDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      fromDueDate: e.target.value,
                    }))
                  }
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">~</span>
                <input
                  type="date"
                  value={draft.toDueDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      toDueDate: e.target.value,
                    }))
                  }
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] text-slate-600">발주일자</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={draft.fromOrderDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      fromOrderDate: e.target.value,
                    }))
                  }
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                />
                <span className="text-[11px] text-muted-foreground">~</span>
                <input
                  type="date"
                  value={draft.toOrderDate}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      toOrderDate: e.target.value,
                    }))
                  }
                  className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[12px] text-slate-600">조회구분</span>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={draft.viewMode}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    viewMode: e.target.value as SearchParams["viewMode"],
                  }))
                }
              >
                <option value="차종별">차종별</option>
                <option value="거래처별">거래처별</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setCriteria(draft);
                }}
                className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <Search className="mr-1.5 h-4 w-4" />
                검색
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(initialParams);
                  setCriteria(initialParams);
                }}
                className="text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                필터 초기화
              </Button>
            </div>
            <div className="text-[11px] text-muted-foreground">
              발주금액 합계{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(totalOrdered)}
              </span>
              , 입고금액 합계(추정){" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(totalReceived)}
              </span>
              , 발주대비 입고율(추정){" "}
              <span className="font-semibold text-foreground">
                {overallRate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="min-h-0 flex-1">
            <MasterListGrid<ReceiptStatusRow>
              columns={[
                {
                  key: "modelCode",
                  header: criteria.viewMode === "거래처별" ? "거래처" : "차종",
                  minWidth: 120,
                  cell: (row) =>
                    row.displayGroupLabel ??
                    (criteria.viewMode === "거래처별"
                      ? row.supplierName
                      : row.modelCode),
                },
                {
                  key: "itemCode",
                  header: "품목번호",
                  minWidth: 140,
                },
                {
                  key: "itemName",
                  header: "품명",
                  minWidth: 220,
                },
                {
                  key: "specification",
                  header: "규격",
                  minWidth: 160,
                },
                {
                  key: "orderQty",
                  header: "발주량",
                  minWidth: 100,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => row.orderQty.toLocaleString("ko-KR"),
                },
                {
                  key: "orderAmount",
                  header: "발주금액",
                  minWidth: 140,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.orderAmount),
                },
                {
                  key: "receiveQty",
                  header: "입고량",
                  minWidth: 100,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => row.receiveQty.toLocaleString("ko-KR"),
                },
                {
                  key: "receiveAmount",
                  header: "입고금액",
                  minWidth: 140,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.receiveAmount),
                },
                {
                  key: "unreceivedAmount",
                  header: "미입금액",
                  minWidth: 140,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => formatCurrency(row.unreceivedAmount),
                },
                {
                  key: "receiptRate",
                  header: "미입율(%)",
                  minWidth: 100,
                  align: "right",
                  cellClassName: "text-right",
                  cell: (row) => `${100 - row.receiptRate}%`,
                },
              ]}
              data={displayRows}
              keyExtractor={(row) => row.id}
              maxHeight="100%"
              getRowClassName={(row) =>
                row.rowKind === "total"
                  ? "bg-fuchsia-100 dark:bg-fuchsia-900/60 font-semibold"
                  : row.rowKind === "subtotal"
                    ? "bg-amber-50 dark:bg-amber-900/60 font-semibold"
                    : ""
              }
              pagination={
                displayRows.length > 0
                  ? {
                      page: 1,
                      pageSize: displayRows.length,
                      total: displayRows.length,
                      // 페이지를 고정하여 컨트롤이 나타나지 않도록 함
                      onPageChange: () => {},
                    }
                  : undefined
              }
              emptyMessage="조건에 맞는 발주대비 입고현황이 없습니다."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

