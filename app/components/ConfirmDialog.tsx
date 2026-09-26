"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useTranslations } from "next-intl";

type ConfirmOptions = {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  brand?: boolean;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 px-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            {state.title ? (
              <h2
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                {state.title}
              </h2>
            ) : null}

            <div className="mt-2 text-sm text-gray-600">{state.message}</div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-500"
              >
                {state.cancelLabel ?? t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                  state.danger
                    ? "bg-red-600 hover:bg-red-700"
                    : state.brand
                      ? "bg-brand-green hover:bg-brand-green/90"
                      : "bg-gray-900 hover:bg-gray-800"
                }`}
              >
                {state.confirmLabel ?? t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
