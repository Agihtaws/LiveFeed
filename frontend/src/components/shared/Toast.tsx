import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id:      number;
  type:    ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    info:    (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _id = 0;
const DURATION = 3500; // ms

// ── Icons ─────────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: "✓",
  error:   "⚠",
  info:    "ℹ",
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald/30 bg-emerald/10 text-emerald",
  error:   "border-red/30    bg-red/10    text-red",
  info:    "border-cyan/30   bg-cyan/10   text-cyan",
};

// ── Provider ──────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++_id;
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, DURATION);
  }, []);

  const toast = {
    success: (msg: string) => add("success", msg),
    error:   (msg: string) => add("error",   msg),
    info:    (msg: string) => add("info",     msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl border
              backdrop-blur-md shadow-lg font-mono text-sm
              animate-fade-up pointer-events-auto
              ${STYLES[item.type]}
            `}
          >
            <span className="shrink-0 font-bold">{ICONS[item.type]}</span>
            <span className="text-text-1">{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}