"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromptFn = (defaultName: string) => Promise<string | null>;

const FilenameDialogContext = createContext<PromptFn>(async () => null);

export function useFilenameDialog() {
  return useContext(FilenameDialogContext);
}

export function FilenameDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const resolverRef = useRef<((v: string | null) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const promptFilename = useCallback((defaultName: string): Promise<string | null> => {
    setValue(defaultName);
    setOpen(true);
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirm = useCallback(() => {
    const trimmed = value.trim();
    setOpen(false);
    resolverRef.current?.(trimmed || null);
    resolverRef.current = null;
  }, [value]);

  const cancel = useCallback(() => {
    setOpen(false);
    resolverRef.current?.(null);
    resolverRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.select(), 30);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, cancel]);

  return (
    <FilenameDialogContext.Provider value={promptFilename}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
          onClick={cancel}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-sm font-semibold">파일 이름 저장</h2>
            <div className="space-y-1.5">
              <Label htmlFor="filename-input" className="text-xs">저장할 파일 이름</Label>
              <Input
                id="filename-input"
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirm();
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>취소</Button>
              <Button size="sm" onClick={confirm} disabled={!value.trim()}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </FilenameDialogContext.Provider>
  );
}
