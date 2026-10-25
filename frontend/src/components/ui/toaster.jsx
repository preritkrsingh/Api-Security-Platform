"use client";

import React from 'react';
import { Toast } from '@base-ui/react/toast';
import { toastManager } from '@/components/ui/toast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <ToastList />
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="base-toast-viewport">
        {toasts.map((t) => (
          <Toast.Root key={t.id} toast={t} className="base-toast-root">
            <Toast.Content className="base-toast-content">
              <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-1">
                {t.type === 'loading' ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-spin" />
                ) : t.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : t.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : null}
                <div className="flex flex-col gap-0.5 text-left min-w-0 flex-1">
                  <Toast.Title className="text-sm font-semibold text-zinc-100 tracking-tight" />
                  <Toast.Description className="text-xs text-zinc-400 leading-relaxed" />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Toast.Action className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-100 bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/80 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 active:scale-95 cursor-pointer" />
                <Toast.Close className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 active:scale-95 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </Toast.Close>
              </div>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
