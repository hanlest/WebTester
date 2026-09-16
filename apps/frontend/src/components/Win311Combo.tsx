import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Win311ComboProps = ComponentPropsWithoutRef<"select"> & {
  children: ReactNode;
};

export function Win311Combo({ children, className, ...props }: Win311ComboProps) {
  const openPicker = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const select = e.currentTarget.closest(".retro-combo")?.querySelector("select");
    if (!(select instanceof HTMLSelectElement) || select.disabled) return;
    if (typeof select.showPicker === "function") {
      select.showPicker();
    } else {
      select.click();
    }
  };

  return (
    <div className={`retro-combo${className ? ` ${className}` : ""}`}>
      <select {...props}>{children}</select>
      <span className="retro-combo-split" aria-hidden />
      <span className="retro-combo-btn" aria-hidden onPointerDown={openPicker} />
    </div>
  );
}
