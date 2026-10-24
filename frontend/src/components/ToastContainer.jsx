import React from 'react';
import { CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-auto pointer-events-none select-none font-sans">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isDelete = toast.type === 'delete';

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-[#0c0c0e]/95 text-white shadow-2xl backdrop-blur-md animate-toast-in transition-all cursor-pointer group hover:border-neutral-700"
          >
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : isDelete ? (
              <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-neutral-400 shrink-0" />
            )}

            <span className="text-xs text-neutral-200 font-medium leading-normal pr-1">
              {toast.message}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
              className="text-neutral-500 hover:text-white p-0.5 rounded transition-colors shrink-0 ml-auto"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
