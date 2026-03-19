import * as React from "react";
import { cn } from "@/lib/utils";

type SheetPosition = "right" | "center";

type SheetContextValue = {
  position: SheetPosition;
  draggable: boolean;
  modal: boolean;
  onOpenChange?: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue>({
  position: "right",
  draggable: false,
  modal: true,
});

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  position?: SheetPosition;
  /** center 모드에서만 의미 있음 */
  draggable?: boolean;
  /** modal=false면 배경/클릭차단 없이 패널만 표시 */
  modal?: boolean;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  position = "right",
  draggable = position === "center",
  modal = true,
}: SheetProps) {
  if (!open) return null;

  // Non-modal panel: don't cover the whole screen (so it can never block clicks).
  if (!modal) {
    return (
      <div
        className={cn(
          "fixed z-50 flex",
          position === "center"
            ? "inset-0 items-center justify-center p-4 pointer-events-none"
            : "inset-y-0 right-0"
        )}
      >
        <SheetContext.Provider value={{ position, draggable, modal, onOpenChange }}>
          {children}
        </SheetContext.Provider>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        modal && "bg-black/60",
        position === "center"
          ? "items-center justify-center p-4"
          : "justify-end"
      )}
      onClick={modal ? () => onOpenChange(false) : undefined}
    >
      <SheetContext.Provider value={{ position, draggable, modal, onOpenChange }}>
        {children}
      </SheetContext.Provider>
    </div>
  );
}

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function SheetContent({ className, children, ...props }: SheetContentProps) {
  const { position, draggable, modal } = React.useContext(SheetContext);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    dragging: boolean;
  } | null>(null);

  const onDragStart = React.useCallback(
    (e: React.MouseEvent) => {
      if (!(position === "center" && draggable)) return;
      if (e.button !== 0) return; // left click only
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: offset.x,
        baseY: offset.y,
        dragging: true,
      };
      e.preventDefault();
    },
    [draggable, offset.x, offset.y, position]
  );

  React.useEffect(() => {
    if (!(position === "center" && draggable)) return;

    const onMove = (ev: MouseEvent) => {
      const st = dragRef.current;
      if (!st?.dragging) return;
      setOffset({
        x: st.baseX + (ev.clientX - st.startX),
        y: st.baseY + (ev.clientY - st.startY),
      });
    };

    const onUp = () => {
      const st = dragRef.current;
      if (!st) return;
      dragRef.current = { ...st, dragging: false };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggable, position]);

  return (
    <div
      className={cn(
        position === "center"
          ? "w-full max-w-sm rounded-xl bg-background p-4 shadow-xl max-h-[85vh] overflow-y-auto"
          : "h-full w-full max-w-md bg-background p-4 shadow-xl",
        !modal && "pointer-events-auto",
        className
      )}
      style={
        position === "center" && draggable
          ? { transform: `translate(${offset.x}px, ${offset.y}px)` }
          : undefined
      }
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {position === "center" && draggable && (
        <div
          className="mb-2 flex items-center justify-center select-none cursor-move"
          onMouseDown={onDragStart}
          title="드래그해서 이동"
        >
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>
      )}
      {children}
    </div>
  );
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1 border-b pb-2", className)}>{children}</div>;
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-sm font-semibold", className)}>{children}</h2>;
}

export function SheetDescription({
  className,
  children,
}: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

