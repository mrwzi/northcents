"use client";

import { useEffect, useRef, useState } from "react";

export function ActionMenu({
  label,
  actionLabel,
  onAction,
  provider = false,
}: Readonly<{
  label: string;
  actionLabel: string;
  onAction: () => void;
  provider?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeWhenOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div
      className={`action-menu${provider ? " provider-action-menu" : ""}`}
      ref={root}
    >
      <button
        className="action-menu-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        •••
      </button>
      {open && (
        <div className="action-menu-popover" role="menu">
          <button
            className="account-remove-button"
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAction();
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
