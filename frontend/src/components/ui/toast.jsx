"use client";

import * as React from 'react';
import { Toast } from '@base-ui/react/toast';

// Base UI Toast Global Manager instance
export const toastManager = Toast.createToastManager();

// Callable toast function with full imperative API matching https://ui.shadcn.com/docs/components/base/toast
function toastFunction(props) {
  return toastManager.add(props);
}

Object.assign(toastFunction, {
  add: (props) => toastManager.add(props),
  create: (props) => toastManager.add(props),
  close: (id) => toastManager.close(id),
  dismiss: (id) => toastManager.close(id),
  update: (id, props) => toastManager.update(id, props),
  promise: (promise, options) => toastManager.promise(promise, options),

  success: (description, options = {}) =>
    toastManager.add({
      title: options.title || 'Success',
      description,
      type: 'success',
      ...options,
    }),
  error: (description, options = {}) =>
    toastManager.add({
      title: options.title || 'Error',
      description,
      type: 'error',
      ...options,
    }),
  warning: (description, options = {}) =>
    toastManager.add({
      title: options.title || 'Warning',
      description,
      type: 'warning',
      ...options,
    }),
  info: (description, options = {}) =>
    toastManager.add({
      title: options.title || 'Info',
      description,
      type: 'info',
      ...options,
    }),
  loading: (description, options = {}) =>
    toastManager.add({
      title: options.title || 'Processing...',
      description,
      type: 'loading',
      ...options,
    }),
});

export const toast = toastFunction;

export function useToast() {
  const manager = Toast.useToastManager();
  return {
    toasts: manager.toasts || [],
    toast,
    dismiss: (id) => toastManager.close(id),
  };
}

// Re-export Base UI Toast primitive parts for custom compositions
export const ToastProvider = Toast.Provider;
export const ToastPortal = Toast.Portal;
export const ToastViewport = Toast.Viewport;
export const ToastRoot = Toast.Root;
export const ToastContent = Toast.Content;
export const ToastTitle = Toast.Title;
export const ToastDescription = Toast.Description;
export const ToastAction = Toast.Action;
export const ToastClose = Toast.Close;

export { Toaster } from '@/components/ui/toaster';
