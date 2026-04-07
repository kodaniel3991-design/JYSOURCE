"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCachedState } from "@/lib/hooks/use-cached-state";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
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
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from "@/components/common/action-buttons";
import { DataGridToolbar } from "@/components/common/data-grid-toolbar";
import { MasterListGrid, type MasterListGridColumn } from "@/components/common/master-list-grid";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Search,
  RotateCcw,
  Download,
  Check,
} from "lucide-react";
import type { ItemRegisterBasicInfo } from "@/types/item-register";
import { defaultItemRegisterState } from "@/types/item-register";
import type { StorageLocationRecord } from "@/lib/mock/storage-locations";
import { apiPath } from "@/lib/api-path";

const ItemRegisterSheet = dynamic(
  () =>
    import("@/components/items/item-register-sheet").then((m) => ({
      default: m.ItemRegisterSheet,
    })),
  { ssr: false }
);

type ItemStatusCategory = "사용(양산)" | "사양화" | "설계변경" | "사용안함" | "삭제" | "개발" | "ACTIVE" | "INACTIVE" | "BLOCKED";

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
  /** 등록일자 (품목목록등록일자) */
  registeredAt?: string;
  /** 리비전 일자 (품목목록보수일자) */
  revisionDate?: string;
  /** 구매단가 */
  purchaseUnitPrice?: number;
  /** 통화코드 */
  currencyCode?: string;
  /** 최종입고일자 (품목최종입고일자) */
  lastReceiptDate?: string;
  /** 창고 (창고코드) */
  warehouse?: string;
  /** 저장위치 (재고저장위치코드) */
  storageLocation?: string;
  /** 품목.xls / 품목가공.xls 대응 필드 */
  purchaseUnitCode?: string;
  purchaseUnitConversion?: string;
  lastReceiptUnitPrice?: number;
  salesUnitPrice?: number;
  standardCost?: number;
  procurementLeadTime?: string | number;
  standardLotSize?: number;
  lastShipmentDate?: string;
  productId?: string;
  unitProductionQty?: number;
  itemJitCategory?: string;
  itemImportCategory?: string;
  itemExportCategory?: string;
  receiptToShipImmediate?: string;
  shipWarehouse?: string;
  shipStorageLocation?: string;
  imageFileName?: string;
  drawingFileName?: string;
  /** 품목.xls 전용 */
  drawingSize?: string;
  manufacturerName?: string;
  buyerCode?: string;
  salesRepCode?: string;
  requirementRepCode?: string;
  valueCategoryCode?: string;
  materialOrderPolicyCode?: string;
  maxLotSize?: number;
  minLotSize?: number;
  safetyStock?: number;
  reorderPoint?: number;
  avgDefectRate?: string | number;
  inventoryCountCycle?: string | number;
  hsCode?: string;
  imageInfo?: string;
  drawingInfo?: string;
  itemUserTypeCode?: string;
  yieldRate?: string | number;
  customerWarehouse?: string;
  internalUnitPrice?: number;
  hNoDiameter?: string | number;
  lNoSpecificGravity?: string | number;
  deliveryContainer?: string;
  receiptContainer?: string;
}

interface ItemFilterState {
  itemNo: string;
  itemName: string;
  supplierName: string;
  itemStatusCategory: string;
  specification: string;
  form: string;
  type: string;
  supplierItemNo: string;
  supplierCode: string;
  drawingNo: string;
  vehicleModel: string;
  material: string;
  warehouse: string;
  currencyCode: string;
  businessUnit: string;
  packQty: string;
  itemUserCategoryCode: string;
  itemUsageClassificationCode: string;
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
  "사용(양산)": "success",
  "사양화": "secondary",
  "설계변경": "secondary",
  "사용안함": "secondary",
  "삭제": "destructive",
  "개발": "secondary",
  ACTIVE: "success",
  INACTIVE: "secondary",
  BLOCKED: "destructive",
};

export default function ItemsPage() {
  const [rows, setRows] = useCachedState<ItemMasterRecord[]>("items/rows", []);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useCachedState<boolean>("items/hasSearched", false);

  // 코드→명칭 lookup 데이터
  const [itemTypeCodeMap, setItemTypeCodeMap] = useState<Record<string, string>>({});
  const [itemTypeMap, setItemTypeMap] = useState<Record<string, string>>({});
  const [modelCodeMap, setModelCodeMap] = useState<Record<string, string>>({});
  const [warehouseMap, setWarehouseMap] = useState<Record<string, string>>({});
  const [plantMap, setPlantMap] = useState<Record<string, string>>({});
  const [storageLocations, setStorageLocations] = useState<StorageLocationRecord[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(apiPath("/api/item-type-codes")).then((r) => r.json()),
      fetch(apiPath("/api/item-types")).then((r) => r.json()),
      fetch(apiPath("/api/model-codes")).then((r) => r.json()),
      fetch(apiPath("/api/common-codes?category=warehouse")).then((r) => r.json()),
      fetch(apiPath("/api/common-codes?category=plant")).then((r) => r.json()),
      fetch(apiPath("/api/storage-locations")).then((r) => r.json()),
    ]).then(([formData, typeData, modelData, whData, plantData, slData]) => {
      if (formData.ok)
        setItemTypeCodeMap(Object.fromEntries((formData.items as { ItemTypeCode: string; ItemTypeName: string }[]).map((x) => [x.ItemTypeCode, x.ItemTypeName])));
      if (typeData.ok)
        setItemTypeMap(Object.fromEntries((typeData.items as { ItemTypeCode: string; ItemTypeName: string }[]).map((x) => [x.ItemTypeCode, x.ItemTypeName])));
      if (modelData.ok)
        setModelCodeMap(Object.fromEntries((modelData.items as { ModelCode: string; ModelName: string }[]).map((x) => [x.ModelCode, x.ModelName])));
      if (whData.ok)
        setWarehouseMap(Object.fromEntries((whData.items as { Code: string; Name: string }[]).map((x) => [x.Code, x.Name])));
      if (plantData.ok)
        setPlantMap(Object.fromEntries((plantData.items as { Code: string; Name: string }[]).map((x) => [x.Code, x.Name])));
      if (slData.ok)
        setStorageLocations(slData.items as StorageLocationRecord[]);
    }).catch(() => {});
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiPath("/api/items"));
      const data = await r.json();
      if (data.ok) {
        setRows(
            data.items.map((it: any) => ({
              id: String(it.ItemId),
              itemNo: it.ItemNo ?? "",
              itemName: it.ItemName ?? "",
              specification: it.Specification ?? "",
              form: it.Form ?? "",
              type: it.Type ?? "",
              unit: it.Unit ?? "EA",
              supplierItemNo: it.SupplierItemNo ?? "",
              drawingNo: it.DrawingNo ?? "",
              supplierCode: it.SupplierCode ?? "",
              supplierName: it.SupplierName ?? "",
              itemStatusCategory: (it.ItemStatusCategory ?? "ACTIVE") as ItemStatusCategory,
              salesUnitCode: it.SalesUnitCode ?? "",
              unitConversion: it.UnitConversion ?? "",
              itemWeight: it.ItemWeight ?? 0,
              drawingFlag: Boolean(it.DrawingNo),
              materialFlag: false,
              repairFlag: false,
              miscFlag: false,
              workingItemNo: it.WorkingItemNo ?? "",
              itemSelection: it.ItemSelection ?? "",
              owner: it.Owner ?? "",
              itemUserCategoryCode: it.ItemUserCategoryCode ?? "",
              material: it.Material ?? "",
              vehicleModel: it.VehicleModel ?? "",
              itemUsageClassificationCode: it.ItemUsageClassificationCode ?? "",
              businessUnit: it.BusinessUnit ?? "",
              packQty: it.PackQty ?? 0,
              hasImage: false,
              hasDrawing: Boolean(it.DrawingNo),
              updatedAt: it.UpdatedAt ? new Date(it.UpdatedAt).toLocaleString("ko-KR") : "",
              updatedBy: it.UpdatedBy ?? "",
              purchaseUnitPrice: it.PurchaseUnitPrice ?? undefined,
              salesUnitPrice: it.SalesUnitPrice ?? undefined,
              currencyCode: it.CurrencyCode ?? undefined,
              lastReceiptUnitPrice: it.LastReceiptUnitPrice ?? undefined,
              standardCost: it.StandardCost ?? undefined,
              internalUnitPrice: it.InternalUnitPrice ?? undefined,
              buyerCode: it.BuyerCode ?? undefined,
              salesRepCode: it.SalesRepCode ?? undefined,
              requirementRepCode: it.RequirementRepCode ?? undefined,
              valueCategoryCode: it.ValueCategoryCode ?? undefined,
              materialOrderPolicyCode: it.MaterialOrderPolicyCode ?? undefined,
              procurementLeadTime: it.ProcurementLeadTime ?? undefined,
              standardLotSize: it.StandardLotSize ?? undefined,
              minLotSize: it.MinLotSize ?? undefined,
              safetyStock: it.SafetyStock ?? undefined,
              reorderPoint: it.ReorderPoint ?? undefined,
              avgDefectRate: it.AvgDefectRate ?? undefined,
              inventoryCountCycle: it.InventoryCountCycle ?? undefined,
              drawingSize: it.DrawingSize ?? undefined,
              manufacturerName: it.ManufacturerName ?? undefined,
              productId: it.ProductId ?? undefined,
              unitProductionQty: it.UnitProductionQty ?? undefined,
              hNoDiameter: it.HNoDiameter ?? undefined,
              lNoSpecificGravity: it.LNoSpecificGravity ?? undefined,
              customerWarehouse: it.CustomerWarehouse ?? undefined,
              deliveryContainer: it.DeliveryContainer ?? undefined,
              receiptContainer: it.ReceiptContainer ?? undefined,
              warehouse: it.Warehouse ?? "",
              storageLocation: it.StorageLocation ?? "",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
  }, []);
  const [filters, setFilters] = useCachedState<ItemFilterState>("items/filters", {
    itemNo: "",
    itemName: "",
    supplierName: "",
    itemStatusCategory: "",
    specification: "",
    form: "",
    type: "",
    supplierItemNo: "",
    supplierCode: "",
    drawingNo: "",
    vehicleModel: "",
    material: "",
    warehouse: "",
    currencyCode: "",
    businessUnit: "",
    packQty: "",
    itemUserCategoryCode: "",
    itemUsageClassificationCode: "",
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMasterRecord | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gridSettingsOpen, setGridSettingsOpen] = useState(false);
  const [gridSettingsTab, setGridSettingsTab] = useState<
    "export" | "sort" | "columns" | "view"
  >("sort");
  const [sortKey, setSortKey] = useCachedState<keyof ItemMasterRecord>("items/sortKey", "itemNo");
  const [sortDir, setSortDir] = useCachedState<"asc" | "desc">("items/sortDir", "asc");
  const [stripedRows, setStripedRows] = useCachedState<boolean>("items/stripedRows", true);
  const [compactView, setCompactView] = useCachedState<boolean>("items/compactView", true);
  const [excelSheetOpen, setExcelSheetOpen] = useState(false);
  const [excelResultMessage, setExcelResultMessage] = useState<string | null>(
    null
  );
  const [excelSelectedFile, setExcelSelectedFile] = useState<File | null>(null);
  const [excelRegisterDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [excelManager, setExcelManager] = useState("");
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const getItemByNo = useCallback((itemNo: string): (Partial<ItemRegisterBasicInfo> & { specification?: string; drawingNo?: string }) | null => {
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
      itemNo: "",
      itemName: "",
      supplierName: "",
      itemStatusCategory: "",
      specification: "",
      form: "",
      type: "",
      supplierItemNo: "",
      supplierCode: "",
      drawingNo: "",
      vehicleModel: "",
      material: "",
      warehouse: "",
      currencyCode: "",
      businessUnit: "",
      packQty: "",
      itemUserCategoryCode: "",
      itemUsageClassificationCode: "",
    });
  };

  const filteredItems = useMemo(() => {
    return rows.filter((it) => {
      const f = filters;
      const inc = (a: string | null | undefined, b: string) =>
        (a ?? "").toLowerCase().includes(b.toLowerCase());
      const eq = (a: string | null | undefined, b: string) =>
        (a ?? "") === b;
      if (f.itemNo && !inc(it.itemNo, f.itemNo)) return false;
      if (f.itemName && !inc(it.itemName, f.itemName)) return false;
      if (f.supplierName && !inc(it.supplierName, f.supplierName)) return false;
      if (f.itemStatusCategory && !eq(it.itemStatusCategory, f.itemStatusCategory)) return false;
      if (f.specification && !inc(it.specification, f.specification)) return false;
      if (f.form && !eq(it.form, f.form)) return false;
      if (f.type && !eq(it.type, f.type)) return false;
      if (f.supplierItemNo && !inc(it.supplierItemNo, f.supplierItemNo)) return false;
      if (f.supplierCode && !inc(it.supplierCode, f.supplierCode)) return false;
      if (f.drawingNo && !inc(it.drawingNo, f.drawingNo)) return false;
      if (f.vehicleModel && !inc(it.vehicleModel, f.vehicleModel)) return false;
      if (f.material && !inc(it.material, f.material)) return false;
      if (f.warehouse && !eq(it.warehouse, f.warehouse)) return false;
      if (f.currencyCode && !eq(it.currencyCode, f.currencyCode)) return false;
      if (f.businessUnit && !eq(it.businessUnit, f.businessUnit)) return false;
      if (f.packQty && it.packQty !== Number(f.packQty)) return false;
      if (f.itemUserCategoryCode && !eq(it.itemUserCategoryCode, f.itemUserCategoryCode)) return false;
      if (f.itemUsageClassificationCode && !eq(it.itemUsageClassificationCode, f.itemUsageClassificationCode)) return false;
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


  /** 품목관리 Data Grid 컬럼 정의 (품목.xls 컬럼 순서·헤더 반영) */
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
      { key: "form", header: "형태", minWidth: 110, cell: (it: ItemMasterRecord) => it.form ? `${it.form}-${itemTypeCodeMap[it.form] ?? ""}` : "-" },
      { key: "type", header: "유형", minWidth: 110, cell: (it: ItemMasterRecord) => it.type ? `${it.type}-${itemTypeMap[it.type] ?? ""}` : "-" },
      { key: "unit", header: "단위", minWidth: 60, cell: (it: ItemMasterRecord) => it.unit ?? "-" },
      { key: "drawingNo", header: "도면번호", minWidth: 100, cell: (it: ItemMasterRecord) => it.drawingNo ?? "-" },
      { key: "supplierCode", header: "거래처번호", minWidth: 110, cell: (it: ItemMasterRecord) => it.supplierCode ?? "-" },
      { key: "supplierName", header: "거래처명", minWidth: 120, cell: (it: ItemMasterRecord) => it.supplierName ?? "-" },
      {
        key: "itemStatusCategory",
        header: "품목상태구분",
        minWidth: 100,
        cell: (it: ItemMasterRecord) => (
          <Badge
            variant={statusBadgeVariant[it.itemStatusCategory]}
            className="text-[10px]"
          >
            {it.itemStatusCategory === "ACTIVE"
              ? "사용(양산)"
              : it.itemStatusCategory === "INACTIVE"
                ? "사용안함"
                : it.itemStatusCategory === "BLOCKED"
                  ? "삭제"
                  : it.itemStatusCategory}
          </Badge>
        ),
      },
      { key: "purchaseUnitCode", header: "구매단위코드", minWidth: 100, cell: (it: ItemMasterRecord) => it.purchaseUnitCode ?? "-" },
      { key: "purchaseUnitConversion", header: "구매단위변환계수", minWidth: 120, cell: (it: ItemMasterRecord) => it.purchaseUnitConversion ?? "-" },
      { key: "salesUnitCode", header: "판매단위코드", minWidth: 100, cell: (it: ItemMasterRecord) => it.salesUnitCode ?? "-" },
      { key: "drawingSize", header: "품목도면크기", minWidth: 100, cell: (it: ItemMasterRecord) => it.drawingSize ?? "-" },
      { key: "manufacturerName", header: "품목제작사명", minWidth: 110, cell: (it: ItemMasterRecord) => it.manufacturerName ?? "-" },
      { key: "registeredAt", header: "품목목록등록일자", minWidth: 120, cell: (it: ItemMasterRecord) => it.registeredAt ?? "-" },
      { key: "revisionDate", header: "품목목록보수일자", minWidth: 120, cell: (it: ItemMasterRecord) => it.revisionDate ?? "-" },
      { key: "itemJitCategory", header: "품목JIT구분", minWidth: 100, cell: (it: ItemMasterRecord) => it.itemJitCategory ?? "-" },
      { key: "buyerCode", header: "구매담당자코드", minWidth: 110, cell: (it: ItemMasterRecord) => it.buyerCode ?? "-" },
      { key: "salesRepCode", header: "영업담당자코드", minWidth: 110, cell: (it: ItemMasterRecord) => it.salesRepCode ?? "-" },
      { key: "requirementRepCode", header: "소요담당자코드", minWidth: 110, cell: (it: ItemMasterRecord) => it.requirementRepCode ?? "-" },
      { key: "itemImportCategory", header: "품목수입구분", minWidth: 100, cell: (it: ItemMasterRecord) => it.itemImportCategory ?? "-" },
      { key: "itemExportCategory", header: "품목수출구분", minWidth: 100, cell: (it: ItemMasterRecord) => it.itemExportCategory ?? "-" },
      {
        key: "purchaseUnitPrice",
        header: "구매단가",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.purchaseUnitPrice != null ? it.purchaseUnitPrice.toLocaleString("ko-KR") : "-",
      },
      {
        key: "lastReceiptUnitPrice",
        header: "최종입고단가",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.lastReceiptUnitPrice != null ? it.lastReceiptUnitPrice.toLocaleString("ko-KR") : "-",
      },
      {
        key: "salesUnitPrice",
        header: "판매단가",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.salesUnitPrice != null ? it.salesUnitPrice.toLocaleString("ko-KR") : "-",
      },
      {
        key: "standardCost",
        header: "품목표준원가",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.standardCost != null ? it.standardCost.toLocaleString("ko-KR") : "-",
      },
      { key: "valueCategoryCode", header: "가치분류코드", minWidth: 100, cell: (it: ItemMasterRecord) => it.valueCategoryCode ?? "-" },
      { key: "currencyCode", header: "통화코드", minWidth: 80, cell: (it: ItemMasterRecord) => it.currencyCode ?? "-" },
      { key: "materialOrderPolicyCode", header: "자재발주방침코드", minWidth: 120, cell: (it: ItemMasterRecord) => it.materialOrderPolicyCode ?? "-" },
      { key: "procurementLeadTime", header: "품목조달기간", minWidth: 110, cell: (it: ItemMasterRecord) => it.procurementLeadTime ?? "-" },
      {
        key: "maxLotSize",
        header: "품목최대LOT크기",
        minWidth: 120,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.maxLotSize != null ? it.maxLotSize.toLocaleString("ko-KR") : "-",
      },
      {
        key: "standardLotSize",
        header: "품목표준LOT크기",
        minWidth: 120,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.standardLotSize != null ? it.standardLotSize.toLocaleString("ko-KR") : "-",
      },
      {
        key: "minLotSize",
        header: "품목최소LOT크기",
        minWidth: 120,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.minLotSize != null ? it.minLotSize.toLocaleString("ko-KR") : "-",
      },
      {
        key: "safetyStock",
        header: "품목안전재고량",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.safetyStock != null ? it.safetyStock.toLocaleString("ko-KR") : "-",
      },
      {
        key: "reorderPoint",
        header: "품목재발주점",
        minWidth: 110,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.reorderPoint != null ? it.reorderPoint.toLocaleString("ko-KR") : "-",
      },
      { key: "avgDefectRate", header: "품목평균불량률", minWidth: 110, cell: (it: ItemMasterRecord) => (it.avgDefectRate != null ? String(it.avgDefectRate) : "-") },
      { key: "inventoryCountCycle", header: "품목재고실사주기", minWidth: 120, cell: (it: ItemMasterRecord) => (it.inventoryCountCycle != null ? String(it.inventoryCountCycle) : "-") },
      { key: "lastShipmentDate", header: "품목최종출고일자", minWidth: 120, cell: (it: ItemMasterRecord) => it.lastShipmentDate ?? "-" },
      { key: "lastReceiptDate", header: "품목최종입고일자", minWidth: 120, cell: (it: ItemMasterRecord) => it.lastReceiptDate ?? "-" },
      { key: "productId", header: "상품ID", minWidth: 100, cell: (it: ItemMasterRecord) => it.productId ?? "-" },
      {
        key: "unitProductionQty",
        header: "단위생산량",
        minWidth: 100,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.unitProductionQty != null ? it.unitProductionQty.toLocaleString("ko-KR") : "-",
      },
      { key: "hsCode", header: "HS코드", minWidth: 90, cell: (it: ItemMasterRecord) => it.hsCode ?? "-" },
      { key: "warehouse", header: "창고코드", minWidth: 90, cell: (it: ItemMasterRecord) => it.warehouse ?? "-" },
      { key: "storageLocation", header: "재고저장위치코드", minWidth: 120, cell: (it: ItemMasterRecord) => it.storageLocation ?? "-" },
      { key: "imageInfo", header: "이미지", minWidth: 80, cell: (it: ItemMasterRecord) => it.imageInfo ?? (it.hasImage ? "Y" : "-") },
      { key: "drawingInfo", header: "도면", minWidth: 80, cell: (it: ItemMasterRecord) => it.drawingInfo ?? (it.hasDrawing ? "Y" : "-") },
      { key: "vehicleModel", header: "모델", minWidth: 100, cell: (it: ItemMasterRecord) => it.vehicleModel ?? "-" },
      { key: "itemUserTypeCode", header: "품목사용자구분코드", minWidth: 130, cell: (it: ItemMasterRecord) => it.itemUserTypeCode ?? "-" },
      { key: "receiptToShipImmediate", header: "입고즉시출고여부", minWidth: 120, cell: (it: ItemMasterRecord) => it.receiptToShipImmediate ?? "-" },
      { key: "shipWarehouse", header: "출고창고", minWidth: 90, cell: (it: ItemMasterRecord) => it.shipWarehouse ?? "-" },
      { key: "shipStorageLocation", header: "출고저장위치", minWidth: 100, cell: (it: ItemMasterRecord) => it.shipStorageLocation ?? "-" },
      { key: "imageFileName", header: "이미지파일이름", minWidth: 120, cell: (it: ItemMasterRecord) => it.imageFileName ?? "-" },
      { key: "drawingFileName", header: "도면파일이름", minWidth: 120, cell: (it: ItemMasterRecord) => it.drawingFileName ?? it.drawingNo ?? "-" },
      { key: "yieldRate", header: "수율", minWidth: 80, cell: (it: ItemMasterRecord) => (it.yieldRate != null ? String(it.yieldRate) : "-") },
      { key: "customerWarehouse", header: "고객하치장", minWidth: 90, cell: (it: ItemMasterRecord) => it.customerWarehouse ?? "-" },
      {
        key: "internalUnitPrice",
        header: "사내단가",
        minWidth: 100,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.internalUnitPrice != null ? it.internalUnitPrice.toLocaleString("ko-KR") : "-",
      },
      { key: "hNoDiameter", header: "H-no(직경)", minWidth: 90, cell: (it: ItemMasterRecord) => (it.hNoDiameter != null ? String(it.hNoDiameter) : "-") },
      { key: "lNoSpecificGravity", header: "L-no(비중)", minWidth: 90, cell: (it: ItemMasterRecord) => (it.lNoSpecificGravity != null ? String(it.lNoSpecificGravity) : "-") },
      { key: "businessUnit", header: "사업장", minWidth: 110, cell: (it: ItemMasterRecord) => it.businessUnit ? `${it.businessUnit}-${plantMap[it.businessUnit] ?? ""}` : "-" },
      {
        key: "packQty",
        header: "포장수량",
        minWidth: 90,
        align: "right" as const,
        cellClassName: "text-right",
        cell: (it: ItemMasterRecord) =>
          it.packQty != null ? it.packQty.toLocaleString("ko-KR") : "-",
      },
      { key: "deliveryContainer", header: "납품용기", minWidth: 90, cell: (it: ItemMasterRecord) => it.deliveryContainer ?? "-" },
      { key: "receiptContainer", header: "납입용기", minWidth: 90, cell: (it: ItemMasterRecord) => it.receiptContainer ?? "-" },
    ] as const,
    [itemTypeCodeMap, itemTypeMap, plantMap]
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() =>
    allItemColumns.map((c) => c.key)
  );

  const itemColumns = useMemo(() => {
    const set = new Set(visibleColumnKeys);
    const cols = allItemColumns.filter((c) => {
      if (!set.has(c.key)) return false;
      if (sortedItems.length === 0) return true;
      return sortedItems.some((row) => {
        const val = (row as unknown as Record<string, unknown>)[c.key];
        return val !== null && val !== undefined && val !== "";
      });
    });
    const filtered = cols.length > 0 ? cols : allItemColumns.slice(0, 1);
    const noCol: MasterListGridColumn<ItemMasterRecord> = {
      key: "__no__",
      header: "No",
      minWidth: 48,
      maxWidth: 48,
      headerClassName: "text-center",
      cellClassName: "text-center text-muted-foreground",
      cell: (_row, index) => index + 1,
    };
    return [noCol, ...filtered];
  }, [allItemColumns, visibleColumnKeys, sortedItems]);

  const sortOptions = useMemo(
    () =>
      allItemColumns.map((c) => ({
        value: c.key,
        label: c.header,
      })),
    [allItemColumns]
  );

  const exportExcel = useCallback(async () => {
    const cols = itemColumns;
    // 페이징이 아닌, 현재 검색·정렬이 적용된 전체 목록을 내보내기
    const rows = sortedItems;

    // 스타일 적용을 위해 xlsx-js-style 사용
    const XLSX = await import("xlsx-js-style");
    const header = cols.map((c) => c.header);
    const data = rows.map((r) =>
      cols.map((c) => {
        const value = (r as any)[c.key];
        return value == null ? "" : value;
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

    // 전체 셀 글자 크기를 10pt로 통일
    Object.keys(ws).forEach((cellAddr) => {
      if (cellAddr.startsWith("!")) return;
      const cell = (ws as any)[cellAddr];
      if (!cell) return;
      const prevStyle = cell.s ?? {};
      cell.s = {
        ...prevStyle,
        font: {
          ...(prevStyle.font ?? {}),
          sz: 10,
        },
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "품목");

    const fileName = `items_${new Date().toISOString().slice(0, 10)}.xlsx`;
    (XLSX as any).writeFile(wb, fileName);
  }, [itemColumns, sortedItems]);

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
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
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

        // 핵심 키 컬럼 (필수)
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

        // 나머지 컬럼 인덱스 (있으면 매핑, 없으면 생략)
        const specIdx = findIndex(["규격", "spec", "specification", "규격명"]);
        const formIdx = findIndex(["형태"]);
        const typeIdx = findIndex(["유형"]);
        const unitIdx = findIndex(["단위"]);
        const supplierItemNoIdx = findIndex(["거래처품목번호"]);
        const drawingNoIdx = findIndex(["도면번호"]);
        const supplierCodeIdx = findIndex(["거래처번호"]);
        const supplierNameIdx = findIndex(["거래처명"]);
        const itemStatusIdx = findIndex(["품목상태구분"]);
        const purchaseUnitCodeIdx = findIndex(["구매단위코드"]);
        const purchaseUnitConvIdx = findIndex(["구매단위변환계수"]);
        const salesUnitCodeIdx = findIndex(["판매단위코드"]);
        const salesUnitConvIdx = findIndex(["판매단위변환계수"]);
        const itemWeightIdx = findIndex(["품목중량"]);
        const drawingSizeIdx = findIndex(["품목도면크기"]);
        const materialIdx = findIndex(["품목재질명"]);
        const manufacturerIdx = findIndex(["품목제작사명"]);
        const registeredAtIdx = findIndex(["품목목록등록일자"]);
        const revisionDateIdx = findIndex(["품목목록보수일자"]);
        const itemJitIdx = findIndex(["품목jit구분"]);
        const buyerCodeIdx = findIndex(["구매담당자코드"]);
        const salesRepCodeIdx = findIndex(["영업담당자코드"]);
        const requirementRepCodeIdx = findIndex(["소요담당자코드"]);
        const itemImportIdx = findIndex(["품목수입구분"]);
        const itemExportIdx = findIndex(["품목수출구분"]);
        const purchaseUnitPriceIdx = findIndex(["구매단가"]);
        const lastReceiptUnitPriceIdx = findIndex(["최종입고단가"]);
        const salesUnitPriceIdx = findIndex(["판매단가"]);
        const standardCostIdx = findIndex(["품목표준원가"]);
        const valueCategoryIdx = findIndex(["가치분류코드"]);
        const currencyCodeIdx = findIndex(["통화코드"]);
        const materialOrderPolicyIdx = findIndex(["자재발주방침코드"]);
        const procurementLeadTimeIdx = findIndex(["품목조달기간"]);
        const maxLotSizeIdx = findIndex(["품목최대lot크기"]);
        const standardLotSizeIdx = findIndex(["품목표준lot크기"]);
        const minLotSizeIdx = findIndex(["품목최소lot크기"]);
        const safetyStockIdx = findIndex(["품목안전재고량"]);
        const reorderPointIdx = findIndex(["품목재발주점"]);
        const avgDefectRateIdx = findIndex(["품목평균불량률"]);
        const inventoryCountCycleIdx = findIndex(["품목재고실사주기"]);
        const lastShipmentDateIdx = findIndex(["품목최종출고일자"]);
        const lastReceiptDateIdx = findIndex(["품목최종입고일자"]);
        const productIdIdx = findIndex(["상품id"]);
        const unitProductionQtyIdx = findIndex(["단위생산량"]);
        const hsCodeIdx = findIndex(["hs코드"]);
        const warehouseIdx = findIndex(["창고코드"]);
        const storageLocationIdx = findIndex(["재고저장위치코드"]);
        const imageIdx = findIndex(["이미지"]);
        const drawingIdx = findIndex(["도면"]);
        const vehicleModelIdx = findIndex(["모델"]);
        const itemUserCategoryIdx = findIndex(["품목사용자분류코드"]);
        const itemUserTypeIdx = findIndex(["품목사용자구분코드"]);
        const receiptToShipIdx = findIndex(["입고즉시출고여부"]);
        const shipWarehouseIdx = findIndex(["출고창고"]);
        const shipStorageLocationIdx = findIndex(["출고저장위치"]);
        const imageFileNameIdx = findIndex(["이미지파일이름"]);
        const drawingFileNameIdx = findIndex(["도면파일이름"]);
        const yieldRateIdx = findIndex(["수율"]);
        const customerWarehouseIdx = findIndex(["고객하치장"]);
        const internalUnitPriceIdx = findIndex(["사내단가"]);
        const hNoIdx = findIndex(["h-no(직경)"]);
        const lNoIdx = findIndex(["l-no(비중)"]);
        const businessUnitIdx = findIndex(["사업장"]);
        const packQtyIdx = findIndex(["포장수량"]);
        const deliveryContainerIdx = findIndex(["납품용기"]);
        const receiptContainerIdx = findIndex(["납입용기"]);

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

        const getString = (row: any[], idx: number) => {
          if (idx < 0) return "";
          const v = row[idx];
          if (v instanceof Date) return v.toISOString().slice(0, 10);
          return String(v ?? "").trim();
        };
        const getNumber = (row: any[], idx: number): number | undefined => {
          if (idx < 0) return undefined;
          const raw = String(row[idx] ?? "").replace(/,/g, "").trim();
          if (!raw) return undefined;
          const n = Number(raw);
          return Number.isNaN(n) ? undefined : n;
        };

        body.forEach((row) => {
          const itemNo = getString(row, itemNoIdx);
          const itemName = getString(row, itemNameIdx);
          const specification = getString(row, specIdx);

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

          const rawStatus = getString(row, itemStatusIdx);
          const status: ItemStatusCategory =
            rawStatus === "사용(양산)" || rawStatus === "사용" || rawStatus === ""
              ? "ACTIVE"
              : rawStatus === "사용안함"
                ? "INACTIVE"
                : "BLOCKED"; // 예: 사양화 등

          newItems.push({
            id,
            itemNo,
            itemName,
            specification,
            form: getString(row, formIdx),
            type: getString(row, typeIdx),
            unit: getString(row, unitIdx) || "EA",
            supplierItemNo: getString(row, supplierItemNoIdx),
            drawingNo: getString(row, drawingNoIdx),
            supplierCode: getString(row, supplierCodeIdx),
            supplierName: getString(row, supplierNameIdx),
            itemStatusCategory: status,
            salesUnitCode: getString(row, salesUnitCodeIdx) || "EA",
            unitConversion: getString(row, salesUnitConvIdx) || "1 EA = 1 EA",
            itemWeight: getNumber(row, itemWeightIdx) ?? 0,
            drawingFlag: !!getString(row, drawingIdx),
            materialFlag: !!getString(row, materialIdx),
            repairFlag: false,
            miscFlag: false,
            workingItemNo: "",
            itemSelection: "",
            owner: "",
            itemUserCategoryCode: getString(row, itemUserCategoryIdx),
            material: getString(row, materialIdx),
            vehicleModel: getString(row, vehicleModelIdx),
            itemUsageClassificationCode: "",
            businessUnit: getString(row, businessUnitIdx),
            packQty: getNumber(row, packQtyIdx) ?? 0,
            hasImage: !!getString(row, imageIdx),
            hasDrawing: !!getString(row, drawingIdx),
            updatedAt: nowStr,
            updatedBy: "EXCEL 업로드",
            registeredAt: getString(row, registeredAtIdx),
            revisionDate: getString(row, revisionDateIdx),
            purchaseUnitPrice: getNumber(row, purchaseUnitPriceIdx),
            currencyCode: getString(row, currencyCodeIdx),
            lastReceiptDate: getString(row, lastReceiptDateIdx),
            warehouse: getString(row, warehouseIdx),
            storageLocation: getString(row, storageLocationIdx),
            purchaseUnitCode: getString(row, purchaseUnitCodeIdx),
            purchaseUnitConversion: getString(row, purchaseUnitConvIdx),
            lastReceiptUnitPrice: getNumber(row, lastReceiptUnitPriceIdx),
            salesUnitPrice: getNumber(row, salesUnitPriceIdx),
            standardCost: getNumber(row, standardCostIdx),
            procurementLeadTime:
              getNumber(row, procurementLeadTimeIdx) ??
              getString(row, procurementLeadTimeIdx),
            standardLotSize: getNumber(row, standardLotSizeIdx),
            lastShipmentDate: getString(row, lastShipmentDateIdx),
            productId: getString(row, productIdIdx),
            unitProductionQty: getNumber(row, unitProductionQtyIdx),
            itemJitCategory: getString(row, itemJitIdx),
            itemImportCategory: getString(row, itemImportIdx),
            itemExportCategory: getString(row, itemExportIdx),
            shipWarehouse: getString(row, shipWarehouseIdx),
            shipStorageLocation: getString(row, shipStorageLocationIdx),
            imageFileName: getString(row, imageFileNameIdx),
            drawingFileName: getString(row, drawingFileNameIdx),
            drawingSize: getString(row, drawingSizeIdx),
            manufacturerName: getString(row, manufacturerIdx),
            buyerCode: getString(row, buyerCodeIdx),
            salesRepCode: getString(row, salesRepCodeIdx),
            requirementRepCode: getString(row, requirementRepCodeIdx),
            valueCategoryCode: getString(row, valueCategoryIdx),
            materialOrderPolicyCode: getString(row, materialOrderPolicyIdx),
            maxLotSize: getNumber(row, maxLotSizeIdx),
            minLotSize: getNumber(row, minLotSizeIdx),
            safetyStock: getNumber(row, safetyStockIdx),
            reorderPoint: getNumber(row, reorderPointIdx),
            avgDefectRate:
              getNumber(row, avgDefectRateIdx) ??
              getString(row, avgDefectRateIdx),
            inventoryCountCycle:
              getNumber(row, inventoryCountCycleIdx) ??
              getString(row, inventoryCountCycleIdx),
            hsCode: getString(row, hsCodeIdx),
            imageInfo: getString(row, imageIdx),
            drawingInfo: getString(row, drawingIdx),
            itemUserTypeCode: getString(row, itemUserTypeIdx),
            yieldRate:
              getNumber(row, yieldRateIdx) ?? getString(row, yieldRateIdx),
            customerWarehouse: getString(row, customerWarehouseIdx),
            internalUnitPrice: getNumber(row, internalUnitPriceIdx),
            hNoDiameter:
              getNumber(row, hNoIdx) ?? getString(row, hNoIdx),
            lNoSpecificGravity:
              getNumber(row, lNoIdx) ?? getString(row, lNoIdx),
            deliveryContainer: getString(row, deliveryContainerIdx),
            receiptContainer: getString(row, receiptContainerIdx),
          });
        });

        const totalRows = body.length;

        if (!added) {
          setExcelResultMessage(
            `추가된 품목이 없습니다.\n- 전체 행: ${totalRows}행\n- 중복 품목번호: ${duplicate}행\n- 필수값(품목번호/품목명) 누락: ${invalid}행`
          );
          return;
        }

        // DB 저장
        try {
          const res = await fetch(apiPath("/api/items/import"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: newItems }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => null)) as
              | { message?: string }
              | null;
            setExcelResultMessage(
              data?.message ??
                "DB에 저장하는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요."
            );
          } else {
            setRows((prev) => [...newItems, ...prev]);

            setExcelSelectedFile(null);
            if (excelFileInputRef.current) excelFileInputRef.current.value = "";
            setExcelResultMessage(
              `업로드 결과\n- 전체 행: ${totalRows}행\n- 신규 등록: ${added}행\n- 중복 품목번호로 건너뜀: ${duplicate}행\n- 필수값(품목번호/품목명) 누락: ${invalid}행`
            );
          }
        } catch (e) {
          console.error(e);
          setExcelResultMessage(
            "DB에 연결할 수 없습니다. 서버 설정을 확인해 주세요."
          );
        }
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
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-6 overflow-hidden">
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
              onDelete={async () => {
                if (!selectedRowId) return;
                const target = rows.find((r) => r.id === selectedRowId);
                if (!target) return;
                const ok = window.confirm(
                  `선택한 품목을 삭제하시겠습니까?\n\n품목번호: ${target.itemNo}\n품목명: ${target.itemName}`
                );
                if (!ok) return;
                const res = await fetch(apiPath(`/api/items/${selectedRowId}`), { method: "DELETE" });
                const data = await res.json();
                if (!data.ok) { alert("삭제 실패: " + data.message); return; }
                setRows((prev) => prev.filter((r) => r.id !== selectedRowId));
                setSelectedRowId(null);
    
              }}
              editDisabled={!selectedRowId}
              deleteDisabled={!selectedRowId}
            />
            <PrimaryActionButton
              size="sm"
              className="ml-1 flex items-center gap-1 text-xs"
              onClick={() => {
                setExcelResultMessage(null);
                setExcelSheetOpen(true);
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              EXCEL 업로드
            </PrimaryActionButton>
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
              <Button size="sm" onClick={handleSearch} disabled={loading}>
                <Search className="mr-1.5 h-4 w-4" />
                {loading ? "조회 중..." : "검색"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
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
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="규격"
                  value={filters.specification}
                  onChange={(v) => handleFilterChange("specification", v)}
                />
                <Field
                  label="형태"
                  value={filters.form}
                  onChange={(v) => handleFilterChange("form", v)}
                />
                <Field
                  label="유형"
                  value={filters.type}
                  onChange={(v) => handleFilterChange("type", v)}
                />
                <Field
                  label="거래처품목번호"
                  value={filters.supplierItemNo}
                  onChange={(v) => handleFilterChange("supplierItemNo", v)}
                />
                <Field
                  label="거래처번호"
                  value={filters.supplierCode}
                  onChange={(v) => handleFilterChange("supplierCode", v)}
                />
                <Field
                  label="도면번호"
                  value={filters.drawingNo}
                  onChange={(v) => handleFilterChange("drawingNo", v)}
                />
                <Field
                  label="모델(차종)"
                  value={filters.vehicleModel}
                  onChange={(v) => handleFilterChange("vehicleModel", v)}
                />
                <Field
                  label="재질"
                  value={filters.material}
                  onChange={(v) => handleFilterChange("material", v)}
                />
                <Field
                  label="창고코드"
                  value={filters.warehouse}
                  onChange={(v) => handleFilterChange("warehouse", v)}
                />
                <Field
                  label="통화코드"
                  value={filters.currencyCode}
                  onChange={(v) => handleFilterChange("currencyCode", v)}
                />
                <Field
                  label="사업장"
                  value={filters.businessUnit}
                  onChange={(v) => handleFilterChange("businessUnit", v)}
                />
                <Field
                  label="포장수량"
                  value={filters.packQty}
                  onChange={(v) => handleFilterChange("packQty", v)}
                />
                <Field
                  label="품목사용자분류코드"
                  value={filters.itemUserCategoryCode}
                  onChange={(v) =>
                    handleFilterChange("itemUserCategoryCode", v)
                  }
                />
                <Field
                  label="품목사용분류코드"
                  value={filters.itemUsageClassificationCode}
                  onChange={(v) =>
                    handleFilterChange("itemUsageClassificationCode", v)
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXCEL 업로드 시트 (참고 디자인: 2열 폼, 양식 다운로드, 업로드 파일 영역, 하단 액션) */}
      <Sheet
        open={excelSheetOpen}
        onOpenChange={(open) => {
          setExcelSheetOpen(open);
          if (!open) {
            setExcelSelectedFile(null);
            setExcelResultMessage(null);
          }
        }}
        position="center"
      >
        <SheetContent className="sm:max-w-2xl sm:max-h-[90vh] flex flex-col bg-white">
          <SheetHeader>
            <div className="flex flex-row items-start justify-between gap-4">
              <div>
                <SheetTitle>EXCEL 일괄 업로드</SheetTitle>
                <SheetDescription className="mt-1">
                품목번호, 품목명, 규격을 포함한 EXCEL 파일을 업로드하여 품목을 일괄 등록합니다.
                </SheetDescription>
              </div>
              <PrimaryActionButton
              type="button"
              size="sm"
              className="shrink-0"
              onClick={async () => {
                // 스타일을 지원하는 xlsx-js-style 사용 (다운로드 전용)
                const XLSX = await import("xlsx-js-style");
                const wb = XLSX.utils.book_new();
                const headers = allItemColumns.map((c) => c.header);
                const ws = XLSX.utils.aoa_to_sheet([headers]);

                // 헤더 셀에 연한 파란색 배경 적용
                const headerColor = "9DC3E6"; // 첨부 이미지와 유사한 라이트 블루
                for (let c = 0; c < headers.length; c += 1) {
                  const addr = (XLSX.utils as any).encode_cell({ r: 0, c });
                  const cell = (ws as any)[addr];
                  if (cell) {
                    (cell as any).s = {
                      fill: {
                        patternType: "solid",
                        fgColor: { rgb: headerColor },
                      },
                      font: {
                        bold: true,
                        sz: 8, // 8pt
                        color: { rgb: "000000" },
                      },
                      alignment: { horizontal: "center", vertical: "center" },
                    };
                  }
                }

                XLSX.utils.book_append_sheet(wb, ws, "품목");
                (XLSX as any).writeFile(wb, "품목_양식.xlsx");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              품목 양식 다운로드
            </PrimaryActionButton>
            </div>
          </SheetHeader>

          <div className="mt-4 flex-1 overflow-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-2">
                <Label className="text-slate-700">담당자</Label>
                <Input
                  value={excelManager}
                  onChange={(e) => setExcelManager(e.target.value)}
                  placeholder="담당자"
                  className="border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">등록일자</Label>
                <DateInput
                  value={excelRegisterDate}
                  readOnly
                  className="border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-700">업로드 파일</Label>
                <div className="flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 bg-rose-50/80 dark:bg-rose-950/20">
                  <input
                    ref={excelFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setExcelSelectedFile(file ?? null);
                      setExcelResultMessage(null);
                    }}
                  />
                  <Input
                    readOnly
                    value={excelSelectedFile?.name ?? ""}
                    placeholder="파일을 선택하세요"
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 border-slate-300 dark:border-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => excelFileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 border-slate-300 dark:border-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => {
                      setExcelSelectedFile(null);
                      if (excelFileInputRef.current) excelFileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {excelResultMessage && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:bg-slate-900/50 dark:border-slate-700">
                {excelResultMessage}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t pt-4">
            <PrimaryActionButton
              size="sm"
              onClick={() => {
                if (excelSelectedFile) void handleExcelFile(excelSelectedFile);
                else setExcelResultMessage("업로드할 파일을 선택해 주세요.");
              }}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              업로드
            </PrimaryActionButton>
            <PrimaryActionButton
              size="sm"
              onClick={() => setExcelSheetOpen(false)}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              닫기
            </PrimaryActionButton>
          </div>
        </SheetContent>
      </Sheet>

      {/* 테이블 */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1">
            <MasterListGrid<ItemMasterRecord>
              columns={itemColumns}
              data={sortedItems}
              keyExtractor={(it) => it.id}
              onRowClick={(row) => setSelectedRowId(row.id)}
              onRowDoubleClick={(row) => {
                setEditingItem(row);
                setEditSheetOpen(true);
                setSelectedRowId(null);
              }}
              selectedRowId={selectedRowId}
              variant={stripedRows ? "striped" : "default"}
              virtual
              getRowClassName={() => {
                const density = compactView ? "" : "h-10";
                return [density].filter(Boolean).join(" ");
              }}
              maxHeight="100%"
              emptyMessage={
                !hasSearched ? "검색 버튼을 클릭하면 조회됩니다." :
                loading ? "조회 중..." :
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-slate-800">조회된 품목이 없습니다</p>
                  <p>필터를 조정하거나 새 품목을 등록해 보세요.</p>
                  <div className="mt-2 flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      <RotateCcw className="mr-1.5 h-4 w-4" />
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
          </div>
          {sortedItems.length > 0 && (
            <div className="shrink-0 border-t pt-3 pb-1 text-[11px] text-muted-foreground">
              <span className="font-semibold">{sortedItems.length.toLocaleString("ko-KR")}</span>건
            </div>
          )}
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
                  검색/정렬된 전체 품목 데이터가 EXCEL 파일(.xlsx)로 다운로드됩니다.
                </p>
                <Button size="sm" onClick={() => void exportExcel()}>
                  EXCEL 내보내기
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
        onSave={async (state) => {
          const toNum = (v: string) => (v && !isNaN(Number(v)) ? Number(v) : null);
          const payload = {
            // Basic
            itemNo: state.basicInfo.itemNo,
            itemName: state.basicInfo.itemName,
            itemStatusCategory: state.basicInfo.itemStatusCategory ?? "ACTIVE",
            form: state.basicInfo.itemForm || null,
            type: state.basicInfo.itemType || null,
            vehicleModel: state.basicInfo.productModel || null,
            supplierCode: state.basicInfo.supplierId || null,
            currencyCode: state.basicInfo.currencyCode || null,
            purchaseUnitPrice: toNum(state.basicInfo.purchaseUnitPrice),
            warehouse: state.basicInfo.warehouse || null,
            storageLocation: state.basicInfo.storageLocation || null,
            updatedBy: "사용자",
            // Classification
            specification: state.classification.specification || null,
            drawingNo: state.classification.drawingNo || null,
            itemUserCategoryCode: state.classification.itemUserCategoryCode || null,
            itemUsageClassificationCode: state.classification.itemUsageClassificationCode || null,
            material: state.classification.material || null,
            manufacturerName: state.classification.manufacturer || null,
            productId: state.classification.commerceProductId || null,
            valueCategoryCode: state.classification.valueCategory || null,
            // Procurement
            supplierItemNo: state.procurement.supplierItemNo || null,
            buyerCode: state.procurement.purchaseManager || null,
            salesRepCode: state.procurement.salesManager || null,
            requirementRepCode: state.procurement.requirementManager || null,
            salesUnitPrice: toNum(state.procurement.salesUnitPrice),
            materialOrderPolicyCode: state.procurement.orderPolicy || null,
            lastReceiptUnitPrice: toNum(state.procurement.lastReceiptUnitPrice),
            standardCost: toNum(state.procurement.standardCost),
            internalUnitPrice: toNum(state.procurement.internalPrice),
            businessUnit: state.basicInfo.plant || null,
            // Inventory
            unitProductionQty: toNum(state.inventory.unitProductionQty),
            minLotSize: toNum(state.inventory.minLot),
            standardLotSize: toNum(state.inventory.standardLot),
            safetyStock: toNum(state.inventory.safetyStock),
            avgDefectRate: toNum(state.inventory.defectRate),
            procurementLeadTime: toNum(state.inventory.leadTimeDays),
            reorderPoint: toNum(state.inventory.reorderPoint),
            inventoryCountCycle: toNum(state.inventory.cycleCountPeriod),
            deliveryContainer: state.inventory.deliveryContainer || null,
            // Technical
            unit: state.technical.salesUnit || "EA",
            salesUnitCode: state.technical.salesUnit || "EA",
            unitConversion: state.technical.salesUnitConversion || null,
            itemWeight: toNum(state.technical.weightKg),
            drawingSize: state.technical.drawingSize || null,
            packQty: toNum(state.technical.packQty),
            customerWarehouse: state.technical.customerSpec || null,
            hNoDiameter: state.technical.hNo || null,
            lNoSpecificGravity: state.technical.lNo || null,
            receiptContainer: state.technical.deliveryContainer || null,
          };
          const res = await fetch(apiPath("/api/items"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!data.ok) { alert("저장 실패: " + data.message); return; }
          const now = new Date();
          const created: ItemMasterRecord = {
            id: String(data.id),
            itemNo: state.basicInfo.itemNo,
            itemName: state.basicInfo.itemName,
            specification: state.classification.specification,
            form: state.basicInfo.itemForm,
            type: state.basicInfo.itemType,
            unit: state.technical.salesUnit || "EA",
            supplierItemNo: state.procurement.supplierItemNo,
            drawingNo: state.classification.drawingNo,
            supplierCode: state.basicInfo.supplierId,
            supplierName: "",
            itemStatusCategory: (state.basicInfo.itemStatusCategory as ItemStatusCategory) ?? "ACTIVE",
            salesUnitCode: state.technical.salesUnit || "EA",
            unitConversion: state.technical.salesUnitConversion,
            itemWeight: toNum(state.technical.weightKg) ?? 0,
            drawingFlag: Boolean(state.classification.drawingNo),
            materialFlag: false, repairFlag: false, miscFlag: false,
            workingItemNo: "", itemSelection: "", owner: "",
            itemUserCategoryCode: state.classification.itemUserCategoryCode,
            material: state.classification.material,
            vehicleModel: state.basicInfo.productModel,
            itemUsageClassificationCode: state.classification.itemUsageClassificationCode,
            businessUnit: state.basicInfo.plant,
            packQty: toNum(state.technical.packQty) ?? 0,
            hasImage: false, hasDrawing: Boolean(state.classification.drawingNo),
            updatedAt: now.toLocaleString("ko-KR"),
            updatedBy: "사용자",
          };
          setRows((prev) => [created, ...prev]);
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
                  itemForm: editingItem.form ?? "",
                  itemFormName: itemTypeCodeMap[editingItem.form ?? ""] ?? "",
                  itemType: editingItem.type ?? "",
                  itemTypeName: itemTypeMap[editingItem.type ?? ""] ?? "",
                  productModel: editingItem.vehicleModel ?? "",
                  productModelName: modelCodeMap[editingItem.vehicleModel ?? ""] ?? "",
                  supplierId: editingItem.supplierCode ?? "",
                  supplierName: editingItem.supplierName ?? "",
                  currencyCode: editingItem.currencyCode ?? "KRW",
                  purchaseUnitPrice: editingItem.purchaseUnitPrice != null ? String(editingItem.purchaseUnitPrice) : "",
                  warehouse: editingItem.warehouse ?? "",
                  warehouseName: warehouseMap[editingItem.warehouse ?? ""] || editingItem.warehouse || "",
                  storageLocation: editingItem.storageLocation ?? "",
                  storageLocationName: storageLocations.find((s) => s.WarehouseCode === editingItem.warehouse && s.StorageLocationCode === editingItem.storageLocation)?.StorageLocationName || editingItem.storageLocation || "",
                  plant: editingItem.businessUnit ?? "",
                  plantName: plantMap[editingItem.businessUnit ?? ""] ?? "",
                },
                classification: {
                  ...defaultItemRegisterState.classification,
                  specification: editingItem.specification ?? "",
                  drawingNo: editingItem.drawingNo ?? "",
                },
              }
            : undefined
        }
        onSave={async (state) => {
          if (!editingItem) return;
          const toNum = (v: string | undefined) => (v && !isNaN(Number(v)) ? Number(v) : null);
          const payload = {
            itemNo: state.basicInfo.itemNo,
            itemName: state.basicInfo.itemName,
            itemStatusCategory: state.basicInfo.itemStatusCategory ?? "ACTIVE",
            form: state.basicInfo.itemForm || null,
            type: state.basicInfo.itemType || null,
            vehicleModel: state.basicInfo.productModel || null,
            supplierCode: state.basicInfo.supplierId || null,
            currencyCode: state.basicInfo.currencyCode || null,
            purchaseUnitPrice: toNum(state.basicInfo.purchaseUnitPrice),
            warehouse: state.basicInfo.warehouse || null,
            storageLocation: state.basicInfo.storageLocation || null,
            updatedBy: "사용자",
            specification: state.classification.specification || null,
            drawingNo: state.classification.drawingNo || null,
            itemUserCategoryCode: state.classification.itemUserCategoryCode || null,
            itemUsageClassificationCode: state.classification.itemUsageClassificationCode || null,
            material: state.classification.material || null,
            manufacturerName: state.classification.manufacturer || null,
            productId: state.classification.commerceProductId || null,
            valueCategoryCode: state.classification.valueCategory || null,
            supplierItemNo: state.procurement.supplierItemNo || null,
            buyerCode: state.procurement.purchaseManager || null,
            salesRepCode: state.procurement.salesManager || null,
            requirementRepCode: state.procurement.requirementManager || null,
            salesUnitPrice: toNum(state.procurement.salesUnitPrice),
            materialOrderPolicyCode: state.procurement.orderPolicy || null,
            lastReceiptUnitPrice: toNum(state.procurement.lastReceiptUnitPrice),
            standardCost: toNum(state.procurement.standardCost),
            internalUnitPrice: toNum(state.procurement.internalPrice),
            businessUnit: state.basicInfo.plant || null,
            unitProductionQty: toNum(state.inventory.unitProductionQty),
            minLotSize: toNum(state.inventory.minLot),
            standardLotSize: toNum(state.inventory.standardLot),
            safetyStock: toNum(state.inventory.safetyStock),
            avgDefectRate: toNum(state.inventory.defectRate),
            procurementLeadTime: toNum(state.inventory.leadTimeDays),
            reorderPoint: toNum(state.inventory.reorderPoint),
            inventoryCountCycle: toNum(state.inventory.cycleCountPeriod),
            deliveryContainer: state.inventory.deliveryContainer || null,
            unit: state.technical.salesUnit || "EA",
            salesUnitCode: state.technical.salesUnit || "EA",
            unitConversion: state.technical.salesUnitConversion || null,
            itemWeight: toNum(state.technical.weightKg),
            drawingSize: state.technical.drawingSize || null,
            packQty: toNum(state.technical.packQty),
            customerWarehouse: state.technical.customerSpec || null,
            hNoDiameter: state.technical.hNo || null,
            lNoSpecificGravity: state.technical.lNo || null,
            receiptContainer: state.technical.deliveryContainer || null,
          };
          const res = await fetch(apiPath(`/api/items/${editingItem.id}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!data.ok) { alert("수정 실패: " + data.message); return; }
          const now = new Date();
          setRows((prev) =>
            prev.map((r) =>
              r.id !== editingItem.id
                ? r
                : {
                    ...r,
                    itemNo: payload.itemNo,
                    itemName: payload.itemName,
                    specification: payload.specification ?? "",
                    drawingNo: payload.drawingNo ?? "",
                    itemStatusCategory: payload.itemStatusCategory as ItemStatusCategory,
                    form: payload.form ?? "",
                    type: payload.type ?? "",
                    vehicleModel: payload.vehicleModel ?? "",
                    itemUserCategoryCode: payload.itemUserCategoryCode ?? "",
                    itemUsageClassificationCode: payload.itemUsageClassificationCode ?? "",
                    material: payload.material ?? "",
                    businessUnit: payload.businessUnit ?? "",
                    supplierCode: payload.supplierCode ?? "",
                    supplierItemNo: payload.supplierItemNo ?? "",
                    unit: payload.unit ?? "EA",
                    salesUnitCode: payload.salesUnitCode ?? "EA",
                    unitConversion: payload.unitConversion ?? "",
                    itemWeight: payload.itemWeight ?? 0,
                    packQty: payload.packQty ?? 0,
                    drawingFlag: Boolean(payload.drawingNo),
                    hasDrawing: Boolean(payload.drawingNo),
                    updatedAt: now.toLocaleString("ko-KR"),
                    updatedBy: "사용자",
                  }
            )
          );
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

