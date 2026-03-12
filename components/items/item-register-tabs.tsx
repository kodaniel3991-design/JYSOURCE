"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemClassificationForm } from "./forms/item-classification-form";
import { ItemProcurementForm } from "./forms/item-procurement-form";
import { ItemInventoryForm } from "./forms/item-inventory-form";
import { ItemTechnicalForm } from "./forms/item-technical-form";
import { ItemContactsForm } from "./forms/item-contacts-form";
import type { ItemRegisterState } from "@/types/item-register";
import type { SelectOption } from "@/lib/item-register-options";

interface ItemRegisterTabsProps {
  state: ItemRegisterState;
  onChange: (state: ItemRegisterState) => void;
  supplierOptions: SelectOption[];
}

const TAB_IDS = {
  classification: "classification",
  procurement: "procurement",
  inventory: "inventory",
  technical: "technical",
  contacts: "contacts",
} as const;

export function ItemRegisterTabs({
  state,
  onChange,
  supplierOptions,
}: ItemRegisterTabsProps) {
  const updateBasic = (section: keyof ItemRegisterState, data: unknown) => {
    onChange({ ...state, [section]: data });
  };

  return (
    <Tabs defaultValue={TAB_IDS.classification} className="w-full">
      <TabsList className="mb-4 grid h-10 w-max max-w-full grid-cols-5 gap-1 bg-muted/50 p-1">
        <TabsTrigger value={TAB_IDS.classification} className="w-full min-w-0">
          분류
        </TabsTrigger>
        <TabsTrigger value={TAB_IDS.procurement} className="w-full min-w-0">
          구매
        </TabsTrigger>
        <TabsTrigger value={TAB_IDS.inventory} className="w-full min-w-0">
          재고·창고
        </TabsTrigger>
        <TabsTrigger value={TAB_IDS.technical} className="w-full min-w-0">
          기술·포장
        </TabsTrigger>
        <TabsTrigger value={TAB_IDS.contacts} className="w-full min-w-0">
          담당·소유
        </TabsTrigger>
      </TabsList>
      <TabsContent value={TAB_IDS.classification} className="mt-0">
        <ItemClassificationForm
          data={state.classification}
          onChange={(data) => updateBasic("classification", data)}
        />
      </TabsContent>
      <TabsContent value={TAB_IDS.procurement} className="mt-0">
        <ItemProcurementForm
          data={state.procurement}
          onChange={(data) => updateBasic("procurement", data)}
          supplierOptions={supplierOptions}
        />
      </TabsContent>
      <TabsContent value={TAB_IDS.inventory} className="mt-0">
        <ItemInventoryForm
          data={state.inventory}
          onChange={(data) => updateBasic("inventory", data)}
        />
      </TabsContent>
      <TabsContent value={TAB_IDS.technical} className="mt-0">
        <ItemTechnicalForm
          data={state.technical}
          onChange={(data) => updateBasic("technical", data)}
        />
      </TabsContent>
      <TabsContent value={TAB_IDS.contacts} className="mt-0">
        <ItemContactsForm
          data={state.contacts}
          onChange={(data) => updateBasic("contacts", data)}
        />
      </TabsContent>
    </Tabs>
  );
}
