"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { CrudActions } from "@/components/common/crud-actions";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid } from "@/components/common/master-list-grid";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
} from "lucide-react";
import type { ItemRegisterBasicInfo } from "@/types/item-register";
import { defaultItemRegisterState } from "@/types/item-register";

const ItemRegisterSheet = dynamic(
  () =>
    import("@/components/items/item-register-sheet").then((m) => ({
      default: m.ItemRegisterSheet,
    })),
  { ssr: false }
);

type ItemStatusCategory = "ACTIVE" | "INACTIVE" | "BLOCKED";

interface ItemMasterRecord {
  id: string;
  itemNo: string;
  itemName: string;
  specification: string;
  form: string;
  type: string;
  unit: string;
  supplierItemNo: string;
  drawingNo: string;
  supplierCode: string;
  supplierName: string;
  itemStatusCategory: ItemStatusCategory;
  salesUnitCode: string;
  unitConversion: string;
  itemWeight: number;
  drawingFlag: boolean;
  materialFlag: boolean;
  repairFlag: boolean;
  miscFlag: boolean;
  workingItemNo: string;
  itemSelection: string;
  owner: string;
  itemUserCategoryCode: string;
  material: string;
  vehicleModel: string;
  itemUsageClassificationCode: string;
  businessUnit: string;
  packQty: number;
  hasImage: boolean;
  hasDrawing: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface ItemFilterState {
  workingItemNo: string;
  itemNo: string;
  itemName: string;
  supplierName: string;
  itemSelection: string;
  owner: string;
  itemUserCategoryCode: string;
  material: string;
  containsItemNo: string;
  vehicleModel: string;
  specification: string;
  itemStatusCategory: string;
  type: string;
  itemUsageClassificationCode: string;
  supplierItemNo: string;
  businessUnit: string;
  packQty: string;
  drawingNo: string;
  reload: boolean;
  excludeMold: boolean;
  searchAll: boolean;
}

const ITEMS: ItemMasterRecord[] = [
  {
    id: "ITM-0001",
    itemNo: "OC-FR-RH-C-BEIGE",
    itemName: "OVERCARPET FR RH C/BEIGE",
    specification: "FR RH, CARPET, C-BEIGE",
    form: "ASSY",
    type: "TRIM",
    unit: "EA",
    supplierItemNo: "HY-OC-001",
    drawingNo: "DRW-OC-001",
    supplierCode: "S-HYUNDAI",
    supplierName: "현대모듈",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 1.25,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-OC-001",
    itemSelection: "양산",
    owner: "김대리",
    itemUserCategoryCode: "INT",
    material: "PP+CARPET",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "INT-TRIM",
    businessUnit: "완성차",
    packQty: 20,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-10 14:32",
    updatedBy: "김대리",
  },
  {
    id: "ITM-0002",
    itemNo: "OC-RR-LH-BLACK",
    itemName: "OVERCARPET RR LH BLACK",
    specification: "RR LH, CARPET, BLACK",
    form: "ASSY",
    type: "TRIM",
    unit: "EA",
    supplierItemNo: "HY-OC-002",
    drawingNo: "DRW-OC-002",
    supplierCode: "S-HYUNDAI",
    supplierName: "현대모듈",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 1.18,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-OC-002",
    itemSelection: "양산",
    owner: "김대리",
    itemUserCategoryCode: "INT",
    material: "PP+CARPET",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "INT-TRIM",
    businessUnit: "완성차",
    packQty: 20,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-09 10:15",
    updatedBy: "김대리",
  },
  {
    id: "ITM-0003",
    itemNo: "NVH-PAD-ASSY-FR",
    itemName: "NVH PAD ASSY FRONT FLOOR",
    specification: "FR FLOOR NVH PAD",
    form: "ASSY",
    type: "NVH",
    unit: "EA",
    supplierItemNo: "NVH-001",
    drawingNo: "DRW-NVH-001",
    supplierCode: "S-NVH",
    supplierName: "NVH코리아",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 2.8,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-NVH-001",
    itemSelection: "양산",
    owner: "박과장",
    itemUserCategoryCode: "NVH",
    material: "PU FOAM",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "NVH-FLOOR",
    businessUnit: "완성차",
    packQty: 10,
    hasImage: false,
    hasDrawing: true,
    updatedAt: "2026-03-08 09:10",
    updatedBy: "박과장",
  },
  {
    id: "ITM-0004",
    itemNo: "BS-ASSY-FR-001",
    itemName: "BUMPER SIDE ASSY FR LH",
    specification: "FR LH, BUMPER SIDE",
    form: "ASSY",
    type: "EXTERIOR",
    unit: "EA",
    supplierItemNo: "BS-001",
    drawingNo: "DRW-BS-001",
    supplierCode: "S-EXTERIOR",
    supplierName: "외장부품",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 3.2,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-BS-001",
    itemSelection: "양산",
    owner: "이대리",
    itemUserCategoryCode: "EXT",
    material: "PP+GF",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "EXT-BUMPER",
    businessUnit: "완성차",
    packQty: 8,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-07 16:20",
    updatedBy: "이대리",
  },
  {
    id: "ITM-0005",
    itemNo: "CLP-DASH-MAIN",
    itemName: "CLUSTER PANEL DASH MAIN",
    specification: "DASH, CLUSTER BEZEL",
    form: "ASSY",
    type: "TRIM",
    unit: "EA",
    supplierItemNo: "CLP-001",
    drawingNo: "DRW-CLP-001",
    supplierCode: "S-HYUNDAI",
    supplierName: "현대모듈",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 0.95,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-CLP-001",
    itemSelection: "양산",
    owner: "김대리",
    itemUserCategoryCode: "INT",
    material: "ABS",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "INT-TRIM",
    businessUnit: "완성차",
    packQty: 24,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-06 11:00",
    updatedBy: "김대리",
  },
  {
    id: "ITM-0006",
    itemNo: "WIR-HARN-ENG-01",
    itemName: "WIRE HARNESS ENGINE ROOM",
    specification: "ENG ROOM, MAIN HARNESS",
    form: "HARNESS",
    type: "ELECTRICAL",
    unit: "EA",
    supplierItemNo: "WH-ENG-01",
    drawingNo: "DRW-WH-001",
    supplierCode: "S-YURA",
    supplierName: "유라코리아",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 4.5,
    drawingFlag: true,
    materialFlag: false,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-WH-001",
    itemSelection: "양산",
    owner: "최과장",
    itemUserCategoryCode: "ELEC",
    material: "PVC/CU",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "ELEC-HARNESS",
    businessUnit: "완성차",
    packQty: 4,
    hasImage: false,
    hasDrawing: true,
    updatedAt: "2026-03-05 14:30",
    updatedBy: "최과장",
  },
  {
    id: "ITM-0007",
    itemNo: "GASKET-EXH-MANIF",
    itemName: "GASKET EXHAUST MANIFOLD",
    specification: "EXH MANIFOLD, METAL GASKET",
    form: "PART",
    type: "ENGINE",
    unit: "EA",
    supplierItemNo: "GEX-001",
    drawingNo: "DRW-GEX-001",
    supplierCode: "S-FTG",
    supplierName: "FTG코리아",
    itemStatusCategory: "INACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 0.35,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-GEX-001",
    itemSelection: "양산",
    owner: "박과장",
    itemUserCategoryCode: "ENG",
    material: "STEEL",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "ENG-EXHAUST",
    businessUnit: "완성차",
    packQty: 50,
    hasImage: false,
    hasDrawing: true,
    updatedAt: "2026-03-04 09:45",
    updatedBy: "박과장",
  },
  {
    id: "ITM-0008",
    itemNo: "MOLD-INJ-TRIM-01",
    itemName: "MOLD INJECTION TRIM PAD",
    specification: "TRIM PAD, INJECTION",
    form: "PART",
    type: "TRIM",
    unit: "EA",
    supplierItemNo: "MIP-001",
    drawingNo: "DRW-MIP-001",
    supplierCode: "S-HYUNDAI",
    supplierName: "현대모듈",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 1.8,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: true,
    workingItemNo: "W-MIP-001",
    itemSelection: "양산",
    owner: "김대리",
    itemUserCategoryCode: "INT",
    material: "PP",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "INT-TRIM",
    businessUnit: "완성차",
    packQty: 16,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-03 13:15",
    updatedBy: "김대리",
  },
  {
    id: "ITM-0009",
    itemNo: "BRK-PAD-FR-001",
    itemName: "BRAKE PAD FRONT SET",
    specification: "FRONT, DISC BRAKE PAD",
    form: "SET",
    type: "CHASSIS",
    unit: "SET",
    supplierItemNo: "BPF-001",
    drawingNo: "DRW-BPF-001",
    supplierCode: "S-BRAKE",
    supplierName: "브레이크텍",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "SET",
    unitConversion: "1 SET = 2 EA",
    itemWeight: 2.1,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-BPF-001",
    itemSelection: "양산",
    owner: "정과장",
    itemUserCategoryCode: "CHAS",
    material: "SINTERED",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "CHAS-BRAKE",
    businessUnit: "완성차",
    packQty: 12,
    hasImage: false,
    hasDrawing: true,
    updatedAt: "2026-03-02 10:00",
    updatedBy: "정과장",
  },
  {
    id: "ITM-0010",
    itemNo: "LAMP-HEAD-LH-01",
    itemName: "HEAD LAMP ASSY LH",
    specification: "LH, HALOGEN HEAD LAMP",
    form: "ASSY",
    type: "LAMP",
    unit: "EA",
    supplierItemNo: "HL-LH-01",
    drawingNo: "DRW-HL-001",
    supplierCode: "S-LAMP",
    supplierName: "라이트론",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 5.2,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-HL-001",
    itemSelection: "양산",
    owner: "한대리",
    itemUserCategoryCode: "LAMP",
    material: "PC/GLASS",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "LAMP-HEAD",
    businessUnit: "완성차",
    packQty: 6,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-03-01 15:20",
    updatedBy: "한대리",
  },
  {
    id: "ITM-0011",
    itemNo: "SEAT-FR-LH-ASSY-01",
    itemName: "FRONT SEAT ASSY LH",
    specification: "FR LH, SEAT ASSY",
    form: "ASSY",
    type: "INTERIOR",
    unit: "EA",
    supplierItemNo: "ST-001",
    drawingNo: "DRW-ST-001",
    supplierCode: "S-SEAT",
    supplierName: "시트코리아",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 18.6,
    drawingFlag: true,
    materialFlag: false,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-ST-001",
    itemSelection: "양산",
    owner: "오대리",
    itemUserCategoryCode: "INT",
    material: "STEEL+FOAM+FABRIC",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "INT-SEAT",
    businessUnit: "완성차",
    packQty: 2,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-02-28 09:05",
    updatedBy: "오대리",
  },
  {
    id: "ITM-0012",
    itemNo: "GLS-WND-FR-01",
    itemName: "WINDSHIELD GLASS FRONT",
    specification: "FRONT WINDSHIELD, LAMINATED",
    form: "PART",
    type: "GLASS",
    unit: "EA",
    supplierItemNo: "GLS-WS-01",
    drawingNo: "DRW-GLS-010",
    supplierCode: "S-GLASS",
    supplierName: "글라스텍",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 12.3,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-GLS-010",
    itemSelection: "양산",
    owner: "최과장",
    itemUserCategoryCode: "GLS",
    material: "LAMINATED GLASS",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "GLS-WINDSHIELD",
    businessUnit: "완성차",
    packQty: 1,
    hasImage: false,
    hasDrawing: true,
    updatedAt: "2026-02-27 13:40",
    updatedBy: "최과장",
  },
  {
    id: "ITM-0013",
    itemNo: "BAT-12V-60AH-01",
    itemName: "BATTERY 12V 60AH",
    specification: "12V, 60AH, MF BATTERY",
    form: "PART",
    type: "ELECTRICAL",
    unit: "EA",
    supplierItemNo: "BAT-60-01",
    drawingNo: "DRW-BAT-060",
    supplierCode: "S-BATTERY",
    supplierName: "배터리원",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 14.8,
    drawingFlag: false,
    materialFlag: true,
    repairFlag: false,
    miscFlag: false,
    workingItemNo: "W-BAT-060",
    itemSelection: "양산",
    owner: "정대리",
    itemUserCategoryCode: "ELEC",
    material: "LEAD-ACID",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "ELEC-BATTERY",
    businessUnit: "완성차",
    packQty: 1,
    hasImage: true,
    hasDrawing: false,
    updatedAt: "2026-02-26 17:10",
    updatedBy: "정대리",
  },
  {
    id: "ITM-0014",
    itemNo: "TIR-235-55R19-01",
    itemName: "TIRE 235/55R19",
    specification: "235/55R19, ALL-SEASON",
    form: "PART",
    type: "CHASSIS",
    unit: "EA",
    supplierItemNo: "TIR-235-19",
    drawingNo: "DRW-TIR-235",
    supplierCode: "S-TIRE",
    supplierName: "타이어프라임",
    itemStatusCategory: "INACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 10.9,
    drawingFlag: false,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-TIR-235",
    itemSelection: "양산",
    owner: "박과장",
    itemUserCategoryCode: "CHAS",
    material: "RUBBER+STEEL",
    vehicleModel: "SUV-A",
    itemUsageClassificationCode: "CHAS-TIRE",
    businessUnit: "완성차",
    packQty: 4,
    hasImage: false,
    hasDrawing: false,
    updatedAt: "2026-02-25 08:55",
    updatedBy: "박과장",
  },
  {
    id: "ITM-0015",
    itemNo: "ECU-ENG-CTRL-01",
    itemName: "ECU ENGINE CONTROL UNIT",
    specification: "ENGINE ECU, CONTROLLER",
    form: "ASSY",
    type: "ELECTRICAL",
    unit: "EA",
    supplierItemNo: "ECU-ENG-01",
    drawingNo: "DRW-ECU-001",
    supplierCode: "S-ECU",
    supplierName: "컨트롤시스템즈",
    itemStatusCategory: "ACTIVE",
    salesUnitCode: "EA",
    unitConversion: "1 EA = 1 EA",
    itemWeight: 0.78,
    drawingFlag: true,
    materialFlag: true,
    repairFlag: true,
    miscFlag: false,
    workingItemNo: "W-ECU-001",
    itemSelection: "양산",
    owner: "이과장",
    itemUserCategoryCode: "ELEC",
    material: "PCB+ALUMINUM CASE",
    vehicleModel: "SEDAN-B",
    itemUsageClassificationCode: "ELEC-ECU",
    businessUnit: "완성차",
    packQty: 1,
    hasImage: true,
    hasDrawing: true,
    updatedAt: "2026-02-24 15:30",
    updatedBy: "이과장",
  },
];

const statusBadgeVariant: Record<
  ItemStatusCategory,
  "success" | "secondary" | "destructive"
> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

export default function ItemsPage() {
  const [rows, setRows] = useState<ItemMasterRecord[]>(ITEMS);
  const [filters, setFilters] = useState<ItemFilterState>({
    workingItemNo: "",
    itemNo: "",
    itemName: "",
    supplierName: "",
    itemSelection: "",
    owner: "",
    itemUserCategoryCode: "",
    material: "",
    containsItemNo: "",
    vehicleModel: "",
    specification: "",
    itemStatusCategory: "",
    type: "",
    itemUsageClassificationCode: "",
    supplierItemNo: "",
    businessUnit: "",
    packQty: "",
    drawingNo: "",
    reload: false,
    excludeMold: false,
    searchAll: false,
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMasterRecord | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useState<keyof ItemMasterRecord>("itemNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [stripedRows, setStripedRows] = useState(true);
  const [compactView, setCompactView] = useState(true);
  const [excelSheetOpen, setExcelSheetOpen] = useState(false);
  const [excelResultMessage, setExcelResultMessage] = useState<string | null>(
    null
  );

  const getItemByNo = useCallback((itemNo: string): Partial<ItemRegisterBasicInfo> | null => {
    const found = rows.find((it) => it.itemNo === itemNo);
    if (!found) return null;
    return {
      itemNo: found.itemNo,
      itemName: found.itemName,
      itemStatusCategory: found.itemStatusCategory,
      specification: found.specification,
      drawingNo: found.drawingNo,
    };
  }, [rows]);

  const handleFilterChange = <K extends keyof ItemFilterState>(
    key: K,
    value: ItemFilterState[K]
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
      ...filters,
      workingItemNo: "",
      itemNo: "",
      itemName: "",
      supplierName: "",
      itemSelection: "",
      owner: "",
      itemUserCategoryCode: "",
      material: "",
      containsItemNo: "",
      vehicleModel: "",
      specification: "",
      itemStatusCategory: "",
      type: "",
      itemUsageClassificationCode: "",
      supplierItemNo: "",
      businessUnit: "",
      packQty: "",
      drawingNo: "",
    });
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    return rows.filter((it) => {
      const f = filters;
      if (f.workingItemNo && !it.workingItemNo.includes(f.workingItemNo))
        return false;
      if (f.itemNo && !it.itemNo.includes(f.itemNo)) return false;
      if (
        f.itemName &&
        !it.itemName.toLowerCase().includes(f.itemName.toLowerCase())
      )
        return false;
      if (f.supplierName && !it.supplierName.includes(f.supplierName))
        return false;
      if (f.itemSelection && it.itemSelection !== f.itemSelection) return false;
      if (f.owner && it.owner !== f.owner) return false;
      if (
        f.itemUserCategoryCode &&
        it.itemUserCategoryCode !== f.itemUserCategoryCode
      )
        return false;
      if (f.material && !it.material.includes(f.material)) return false;
      if (f.containsItemNo && !it.itemNo.includes(f.containsItemNo))
        return false;
      if (f.vehicleModel && !it.vehicleModel.includes(f.vehicleModel))
        return false;
      if (f.specification && !it.specification.includes(f.specification))
        return false;
      if (
        f.itemStatusCategory &&
        it.itemStatusCategory !== f.itemStatusCategory
      )
        return false;
      if (f.type && it.type !== f.type) return false;
      if (
        f.itemUsageClassificationCode &&
        it.itemUsageClassificationCode !== f.itemUsageClassificationCode
      )
        return false;
      if (f.supplierItemNo && !it.supplierItemNo.includes(f.supplierItemNo))
        return false;
      if (f.businessUnit && it.businessUnit !== f.businessUnit) return false;
      if (f.packQty && it.packQty !== Number(f.packQty)) return false;
      if (f.drawingNo && !it.drawingNo.includes(f.drawingNo)) return false;
      return true;
    });
  }, [filters, rows]);

  const sortedItems = useMemo(() => {
    const copy = [...filteredItems];
    copy.sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;

      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredItems, sortDir, sortKey]);

  const total = sortedItems.length;
  const start = (page - 1) * pageSize;
  const paged = sortedItems.slice(start, start + pageSize);

  const allItemColumns = useMemo(
    () =>
      [
      {
        key: "itemNo",
        header: "품목번호",
        minWidth: 140,
        maxWidth: 140,
        cell: (it: ItemMasterRecord) => it.itemNo,
        cellClassName: "font-semibold text-slate-900 truncate",
      },
      {
        key: "itemName",
        header: "품목명",
        minWidth: 200,
        maxWidth: 200,
        cell: (it: ItemMasterRecord) => it.itemName,
        cellClassName: "text-slate-800 truncate",
      },
      {
        key: "specification",
        header: "규격",
        minWidth: 160,
        maxWidth: 160,
        cell: (it: ItemMasterRecord) => it.specification,
        cellClassName: "text-muted-foreground truncate",
      },
      { key: "form", header: "형태", cell: (it: ItemMasterRecord) => it.form },
      { key: "type", header: "유형", cell: (it: ItemMasterRecord) => it.type },
      { key: "unit", header: "단위", cell: (it: ItemMasterRecord) => it.unit },
      {
        key: "supplierItemNo",
        header: "거래처품목번호",
        minWidth: 120,
        maxWidth: 120,
        cell: (it: ItemMasterRecord) => it.supplierItemNo,
        cellClassName: "truncate",
      },
      {
        key: "drawingNo",
        header: "도면번호",
        minWidth: 110,
        maxWidth: 110,
        cell: (it: ItemMasterRecord) => it.drawingNo,
        cellClassName: "truncate",
      },
      {
        key: "supplierCode",
        header: "거래처번호",
        cell: (it: ItemMasterRecord) => it.supplierCode,
      },
      {
        key: "itemStatusCategory",
        header: "품목상태구분",
        minWidth: 90,
        cell: (it: ItemMasterRecord) => (
          <Badge
            variant={statusBadgeVariant[it.itemStatusCategory]}
            className="text-[10px]"
          >
            {it.itemStatusCategory === "ACTIVE"
              ? "활성"
              : it.itemStatusCategory === "INACTIVE"
                ? "비활성"
                : "차단"}
          </Badge>
        ),
      },
      {
        key: "salesUnitCode",
        header: "매단위코드",
        cell: (it: ItemMasterRecord) => it.salesUnitCode,
      },
      {
        key: "unitConversion",
        header: "단위변환",
        cell: (it: ItemMasterRecord) => it.unitConversion,
      },
      {
        key: "itemWeight",
        header: "품목중량(kg)",
        align: "right" as const,
        cell: (it: ItemMasterRecord) => it.itemWeight.toFixed(2),
        cellClassName: "text-right",
      },
      {
        key: "drawingFlag",
        header: "목록도면",
        cell: (it: ItemMasterRecord) => (it.drawingFlag ? "Y" : "N"),
      },
      {
        key: "materialFlag",
        header: "목록재질",
        cell: (it: ItemMasterRecord) => (it.materialFlag ? "Y" : "N"),
      },
      {
        key: "repairFlag",
        header: "목록보수",
        cell: (it: ItemMasterRecord) => (it.repairFlag ? "Y" : "N"),
      },
      {
        key: "miscFlag",
        header: "목록기타",
        cell: (it: ItemMasterRecord) => (it.miscFlag ? "Y" : "N"),
      },
    ] as const,
    []
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    allItemColumns.map((c) => c.key)
  );

  const itemColumns = useMemo(() => {
    const set = new Set(visibleColumnKeys);
    const cols = allItemColumns.filter((c) => set.has(c.key));
    return cols.length > 0 ? cols : allItemColumns.slice(0, 1);
  }, [allItemColumns, visibleColumnKeys]);

  const sortOptions = useMemo(
    () =>
      allItemColumns.map((c) => ({
        value: c.key,
        label: c.header,
      })),
    [allItemColumns]
  );

  const exportCsv = useCallback(() => {
    const cols = itemColumns;
    const rows = paged;
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = cols.map((c) => escape(c.header)).join(",");
    const body = rows
      .map((r) =>
        cols
          .map((c) => escape((r as Record<string, unknown>)[c.key]))
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [itemColumns, paged]);

  const toggleSortDir = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  const handleExcelFile = useCallback(
    async (file: File) => {
      try {
        // 1. 파일 타입/크기 검증
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["xlsx", "xls"].includes(ext)) {
          setExcelResultMessage(
            "지원하지 않는 파일 형식입니다. .xlsx 또는 .xls 형식의 EXCEL 파일을 선택해 주세요."
          );
          return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          setExcelResultMessage(
            "파일 용량이 5MB를 초과합니다. 파일을 나누거나 용량을 줄여서 다시 시도해 주세요."
          );
          return;
        }

        const XLSX = await import("xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          setExcelResultMessage("워크북에 시트가 없습니다.");
          return;
        }
        const sheet = workbook.Sheets[firstSheet];
        const rows2D: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (!rows2D.length) {
          setExcelResultMessage("시트에 데이터가 없습니다.");
          return;
        }

        const [rawHeader, ...body] = rows2D;
        if (!body.length) {
          setExcelResultMessage("헤더 행만 있고, 데이터 행이 없습니다.");
          return;
        }

        const normalizeHeader = (h: unknown) =>
          String(h ?? "").replace(/\s+/g, "").toLowerCase();

        const header = rawHeader.map(normalizeHeader);

        const findIndex = (candidates: string[]) =>
          header.findIndex((h) => candidates.includes(h));

        // 허용되는 헤더 이름(한글/영문)을 넉넉하게 정의
        const itemNoIdx = findIndex([
          "품목번호",
          "품번",
          "itemno",
          "item_no",
          "itemnumber",
        ]);
        const itemNameIdx = findIndex([
          "품목명",
          "품명",
          "itemname",
          "item_name",
          "description",
        ]);
        const specIdx = findIndex([
          "규격",
          "spec",
          "specification",
          "규격명",
        ]);

        if (itemNoIdx < 0 || itemNameIdx < 0) {
          setExcelResultMessage(
            "헤더 행에서 필수 컬럼을 찾을 수 없습니다. '품목번호/품번(itemNo)'와 '품목명/품명(itemName)' 컬럼을 포함해 주세요."
          );
          return;
        }

        const now = new Date();
        const nowStr = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(
          2,
          "0"
        )} ${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;

        let added = 0;
        let duplicate = 0;
        let invalid = 0;
        const newItems: ItemMasterRecord[] = [];

        body.forEach((row) => {
          const itemNo = String(row[itemNoIdx] ?? "").trim();
          const itemName = String(row[itemNameIdx] ?? "").trim();
          const specification =
            specIdx >= 0 ? String(row[specIdx] ?? "").trim() : "";

          if (!itemNo || !itemName) {
            invalid += 1;
            return;
          }

          // 중복 품목번호는 건너뜀
          if (rows.some((it) => it.itemNo === itemNo)) {
            duplicate += 1;
            return;
          }

          added += 1;
          const id = `ITM-BULK-${String(Date.now())}-${added}`;

          newItems.push({
            id,
            itemNo,
            itemName,
            specification,
            form: "",
            type: "",
            unit: "EA",
            supplierItemNo: "",
            drawingNo: "",
            supplierCode: "",
            supplierName: "",
            itemStatusCategory: "ACTIVE",
            salesUnitCode: "EA",
            unitConversion: "1 EA = 1 EA",
            itemWeight: 0,
            drawingFlag: false,
            materialFlag: false,
            repairFlag: false,
            miscFlag: false,
            workingItemNo: "",
            itemSelection: "",
            owner: "",
            itemUserCategoryCode: "",
            material: "",
            vehicleModel: "",
            itemUsageClassificationCode: "",
            businessUnit: "",
            packQty: 0,
            hasImage: false,
            hasDrawing: false,
            updatedAt: nowStr,
            updatedBy: "EXCEL 업로드",
          });
        });

        const totalRows = body.length;

        if (!added) {
          setExcelResultMessage(
            `추가된 품목이 없습니다.\n- 전체 행: ${totalRows}행\n- 중복 품목번호: ${duplicate}행\n- 필수값(품목번호/품목명) 누락: ${invalid}행`
          );
          return;
        }

        setRows((prev) => [...newItems, ...prev]);
        setPage(1);
        setExcelResultMessage(
          `업로드 결과\n- 전체 행: ${totalRows}행\n- 신규 등록: ${added}행\n- 중복 품목번호로 건너뜀: ${duplicate}행\n- 필수값(품목번호/품목명) 누락: ${invalid}행`
        );
      } catch (err) {
        console.error(err);
        setExcelResultMessage(
          "EXCEL 파일을 처리하는 중 오류가 발생했습니다. 파일 형식과 헤더 구성을 다시 확인해 주세요."
        );
      }
    },
    [rows]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="품목관리"
        description="품목 마스터, 도면, 거래처 품목 정보를 검색·관리·유지합니다"
        actions={
          <div className="flex gap-2">
            <CrudActions
              onRegister={() => setRegisterSheetOpen(true)}
              onEdit={() => {
                if (!selectedRowId) return;
                const item = rows.find((r) => r.id === selectedRowId) ?? null;
                if (!item) return;
                setEditingItem(item);
                setEditSheetOpen(true);
                setSelectedRowId(null);
              }}
              onDelete={() => {
                if (!selectedRowId) return;
                const target = rows.find((r) => r.id === selectedRowId);
                if (!target) return;
                const ok = window.confirm(
                  `선택한 품목을 삭제하시겠습니까?\n\n품목번호: ${target.itemNo}\n품목명: ${target.itemName}`
                );
                if (!ok) return;
                setRows((prev) => prev.filter((r) => r.id !== selectedRowId));
                setSelectedRowId(null);
                setPage(1);
              }}
              editDisabled={!selectedRowId}
              deleteDisabled={!selectedRowId}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-1 flex items-center gap-1 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={() => {
                setExcelResultMessage(null);
                setExcelSheetOpen(true);
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              EXCEL 업로드
            </Button>
          </div>
        }
      />

      {/* 검색 패널: 기본 4개 + 추가 검색 접기/펼치기 */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2">
          <CardTitle className="text-base shrink-0">품목 검색</CardTitle>
          <p className="text-xs text-muted-foreground">
            자주 쓰는 조건만 입력 후 검색하세요. 상세 조건은 아래에서 펼칠 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="text-xs">
          {/* 기본 검색: 품목번호, 품목명, 거래처, 품목상황 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="품목번호"
              value={filters.itemNo}
              onChange={(v) => handleFilterChange("itemNo", v)}
            />
            <Field
              label="품목명"
              value={filters.itemName}
              onChange={(v) => handleFilterChange("itemName", v)}
            />
            <Field
              label="거래처"
              value={filters.supplierName}
              onChange={(v) => handleFilterChange("supplierName", v)}
            />
            <Field
              label="품목상태구분"
              value={filters.itemStatusCategory}
              onChange={(v) => handleFilterChange("itemStatusCategory", v)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">검색</Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                필터 초기화
              </Button>
              <p className="text-[11px] text-muted-foreground">
                총{" "}
                <span className="font-semibold">{filteredItems.length}</span>건의
                품목이 조회되었습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showAdvancedFilters ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  추가 검색 조건 접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  추가 검색 조건 펼치기
                </>
              )}
            </button>
          </div>

          {/* 추가 검색 조건 (접기/펼치기) */}
          {showAdvancedFilters && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="작업할품목번호"
                  value={filters.workingItemNo}
                  onChange={(v) => handleFilterChange("workingItemNo", v)}
                />
                <Field
                  label="품목선택"
                  value={filters.itemSelection}
                  onChange={(v) => handleFilterChange("itemSelection", v)}
                />
                <Field
                  label="영업/구매담당"
                  value={filters.owner}
                  onChange={(v) => handleFilterChange("owner", v)}
                />
                <Field
                  label="품목사용자구분코드"
                  value={filters.itemUserCategoryCode}
                  onChange={(v) =>
                    handleFilterChange("itemUserCategoryCode", v)
                  }
                />
                <Field
                  label="재질"
                  value={filters.material}
                  onChange={(v) => handleFilterChange("material", v)}
                />
                <Field
                  label="품목번호(포함)"
                  value={filters.containsItemNo}
                  onChange={(v) => handleFilterChange("containsItemNo", v)}
                />
                <Field
                  label="모델(차종)"
                  value={filters.vehicleModel}
                  onChange={(v) => handleFilterChange("vehicleModel", v)}
                />
                <Field
                  label="규격"
                  value={filters.specification}
                  onChange={(v) => handleFilterChange("specification", v)}
                />
                <Field
                  label="품목유형"
                  value={filters.type}
                  onChange={(v) => handleFilterChange("type", v)}
                />
                <Field
                  label="품목사용분류코드"
                  value={filters.itemUsageClassificationCode}
                  onChange={(v) =>
                    handleFilterChange("itemUsageClassificationCode", v)
                  }
                />
                <Field
                  label="거래처품목번호"
                  value={filters.supplierItemNo}
                  onChange={(v) => handleFilterChange("supplierItemNo", v)}
                />
                <Field
                  label="사업구분"
                  value={filters.businessUnit}
                  onChange={(v) => handleFilterChange("businessUnit", v)}
                />
                <Field
                  label="포장수량"
                  value={filters.packQty}
                  onChange={(v) => handleFilterChange("packQty", v)}
                />
                <Field
                  label="도면번호"
                  value={filters.drawingNo}
                  onChange={(v) => handleFilterChange("drawingNo", v)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t pt-3">
                <CheckboxWithLabel
                  label="재조회 (변경작업시)"
                  checked={filters.reload}
                  onChange={(v) => handleFilterChange("reload", v)}
                />
                <CheckboxWithLabel
                  label="금형제외"
                  checked={filters.excludeMold}
                  onChange={(v) => handleFilterChange("excludeMold", v)}
                />
                <CheckboxWithLabel
                  label="전체검색"
                  checked={filters.searchAll}
                  onChange={(v) => handleFilterChange("searchAll", v)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXCEL 업로드 시트 (작은 중앙 모달) */}
      <Sheet
        open={excelSheetOpen}
        onOpenChange={setExcelSheetOpen}
        position="center"
      >
        <SheetContent className="sm:max-w-2xl sm:h-[75vh]">
          <SheetHeader>
            <SheetTitle>EXCEL 일괄 업로드</SheetTitle>
            <SheetDescription className="text-xs">
              품목번호, 품목명, 규격을 포함한 EXCEL 파일을 업로드하여 품목을
              일괄 등록합니다. (헤더 행에 '품목번호', '품목명', '규격' 사용)
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-slate-700">
                1. 업로드할 파일 선택
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="text-[11px]"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleExcelFile(file);
                  // 동일 파일 재업로드를 위해 input 초기화
                  e.target.value = "";
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                첫 번째 시트의 데이터를 사용하며, 기존 품목번호와 중복되는 행은
                건너뜁니다.
              </p>
            </div>
            {excelResultMessage && (
              <div className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-800">
                {excelResultMessage}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 테이블 */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-end">
          <DataGridToolbar
            active={gridSettingsOpen ? gridSettingsTab : undefined}
            onExport={() => {
              setGridSettingsTab("export");
              setGridSettingsOpen(true);
            }}
            onSort={() => {
              setGridSettingsTab("sort");
              setGridSettingsOpen(true);
              toggleSortDir();
            }}
            onColumns={() => {
              setGridSettingsTab("columns");
              setGridSettingsOpen(true);
            }}
            onView={() => {
              setGridSettingsTab("view");
              setGridSettingsOpen(true);
              setStripedRows((v) => !v);
            }}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <MasterListGrid<ItemMasterRecord>
            columns={itemColumns}
            data={paged}
            keyExtractor={(it) => it.id}
            onRowClick={(row) => setSelectedRowId(row.id)}
            selectedRowId={selectedRowId}
            variant={stripedRows ? "striped" : "default"}
            getRowClassName={(_, index) => {
              const density = compactView ? "" : "h-10";
              return [density].filter(Boolean).join(" ");
            }}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: setPage,
            }}
            emptyMessage={
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-slate-800">
                  조회된 품목이 없습니다
                </p>
                <p>필터를 조정하거나 새 품목을 등록해 보세요.</p>
                <div className="mt-2 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    필터 초기화
                  </Button>
                  <Button size="sm" onClick={() => setRegisterSheetOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    품목 등록
                  </Button>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Sheet
        open={gridSettingsOpen}
        onOpenChange={setGridSettingsOpen}
        position="center"
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>그리드 설정</SheetTitle>
            <SheetDescription className="text-xs">
              내보내기 · 정렬 · 컬럼 · 보기 설정
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-5 text-xs">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={gridSettingsTab === "export" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("export")}
              >
                내보내기
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "sort" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("sort")}
              >
                정렬
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "columns" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("columns")}
              >
                컬럼
              </Button>
              <Button
                size="sm"
                variant={gridSettingsTab === "view" ? "default" : "outline"}
                onClick={() => setGridSettingsTab("view")}
              >
                보기
              </Button>
            </div>

            {gridSettingsTab === "export" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  현재 페이지({page}페이지) 데이터가 CSV로 다운로드됩니다.
                </p>
                <Button size="sm" onClick={exportCsv}>
                  CSV 내보내기
                </Button>
              </div>
            )}

            {gridSettingsTab === "sort" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">정렬 기준</Label>
                  <Select
                    className="h-9 text-xs"
                    value={String(sortKey)}
                    options={sortOptions}
                    onChange={(v) => setSortKey(v as keyof ItemMasterRecord)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSortDir}>
                    {sortDir === "asc" ? "오름차순" : "내림차순"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    정렬은 즉시 목록에 적용됩니다.
                  </p>
                </div>
              </div>
            )}

            {gridSettingsTab === "columns" && (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  표시할 컬럼을 선택하세요. (최소 1개 유지)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allItemColumns.map((c) => {
                    const checked = visibleColumnKeys.includes(c.key);
                    return (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked;
                            setVisibleColumnKeys((prev) => {
                              if (next) return Array.from(new Set([...prev, c.key]));
                              const filtered = prev.filter((k) => k !== c.key);
                              return filtered.length > 0 ? filtered : prev;
                            });
                          }}
                        />
                        <span className="text-[11px]">{c.header}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisibleColumnKeys(allItemColumns.map((c) => c.key))}
                  >
                    전체 선택
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisibleColumnKeys(["itemNo", "itemName", "specification"])}
                  >
                    기본값
                  </Button>
                </div>
              </div>
            )}

            {gridSettingsTab === "view" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">줄무늬 표시</span>
                  <Checkbox
                    checked={stripedRows}
                    onChange={(e) => setStripedRows(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">컴팩트 보기</span>
                  <Checkbox
                    checked={compactView}
                    onChange={(e) => setCompactView(e.target.checked)}
                  />
                </label>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ItemRegisterSheet
        open={registerSheetOpen}
        onOpenChange={setRegisterSheetOpen}
        getItemByNo={getItemByNo}
        onSave={(state) => {
          const now = new Date();
          const id = `ITM-${String(rows.length + 1).padStart(4, "0")}`;
          const created: ItemMasterRecord = {
            id,
            itemNo: state.basicInfo.itemNo,
            itemName: state.basicInfo.itemName,
            specification: state.basicInfo.specification,
            form: "",
            type: "",
            unit: "EA",
            supplierItemNo: "",
            drawingNo: state.basicInfo.drawingNo,
            supplierCode: "",
            supplierName: "",
            itemStatusCategory: (state.basicInfo.itemStatusCategory as ItemStatusCategory) ?? "ACTIVE",
            salesUnitCode: "EA",
            unitConversion: "1 EA = 1 EA",
            itemWeight: 0,
            drawingFlag: Boolean(state.basicInfo.drawingNo),
            materialFlag: false,
            repairFlag: false,
            miscFlag: false,
            workingItemNo: "",
            itemSelection: "",
            owner: "",
            itemUserCategoryCode: "",
            material: "",
            vehicleModel: "",
            itemUsageClassificationCode: "",
            businessUnit: "",
            packQty: 0,
            hasImage: false,
            hasDrawing: Boolean(state.basicInfo.drawingNo),
            updatedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
              now.getDate()
            ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
              now.getMinutes()
            ).padStart(2, "0")}`,
            updatedBy: "사용자",
          };
          setRows((prev) => [created, ...prev]);
          setPage(1);
        }}
      />

      <ItemRegisterSheet
        open={editSheetOpen}
        onOpenChange={(o) => {
          setEditSheetOpen(o);
          if (!o) setEditingItem(null);
        }}
        mode="edit"
        getItemByNo={getItemByNo}
        initialState={
          editingItem
            ? {
                ...defaultItemRegisterState,
                basicInfo: {
                  ...defaultItemRegisterState.basicInfo,
                  itemNo: editingItem.itemNo,
                  itemName: editingItem.itemName,
                  itemStatusCategory: editingItem.itemStatusCategory,
                  specification: editingItem.specification,
                  drawingNo: editingItem.drawingNo,
                },
              }
            : undefined
        }
        onSave={(state) => {
          if (!editingItem) return;
          const now = new Date();
          const updatedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
            now.getDate()
          ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}`;
          setRows((prev) =>
            prev.map((r) =>
              r.id !== editingItem.id
                ? r
                : {
                    ...r,
                    itemNo: state.basicInfo.itemNo,
                    itemName: state.basicInfo.itemName,
                    itemStatusCategory: state.basicInfo.itemStatusCategory as ItemStatusCategory,
                    specification: state.basicInfo.specification,
                    drawingNo: state.basicInfo.drawingNo,
                    drawingFlag: Boolean(state.basicInfo.drawingNo),
                    hasDrawing: Boolean(state.basicInfo.drawingNo),
                    updatedAt,
                    updatedBy: "사용자",
                  }
            )
          );
          setPage(1);
        }}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[14px] text-slate-600">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs"
      />
    </div>
  );
}

function CheckboxWithLabel({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[14px] text-slate-600">
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5"
      />
      {label}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold text-slate-700">{title}</h3>
      <div className="space-y-1 rounded-md border bg-slate-50 px-3 py-2">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium text-slate-800 text-right">
        {value || "-"}
      </span>
    </div>
  );
}

