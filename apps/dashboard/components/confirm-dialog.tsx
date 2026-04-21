"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setLoading(false);
    // Use setTimeout to let any dropdown close first
    setTimeout(() => setOpen(true), 50);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    setLoading(true);
    try {
      await options.onConfirm();
    } finally {
      setLoading(false);
      setOpen(false);
      setOptions(null);
    }
  }, [options]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setOptions(null);
  }, []);

  const ConfirmDialog =
    open && options && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              onClick={handleCancel}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 9999,
                width: "360px",
                maxWidth: "calc(100% - 32px)",
                backgroundColor: "#1a1a17",
                border: "1px solid #2a2a25",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#f5f5f0",
                  marginBottom: "6px",
                }}
              >
                {options.title}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8a8a80",
                  marginBottom: "20px",
                  lineHeight: "1.5",
                }}
              >
                {options.description}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? "..." : options.confirmLabel || "Confirm"}
                </Button>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return { confirm, ConfirmDialog };
}
