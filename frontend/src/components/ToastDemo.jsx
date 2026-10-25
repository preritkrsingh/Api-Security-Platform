"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

export function ToastDemo() {
  function showToast() {
    const id = toast.add({
      title: 'Event created',
      description: 'Sunday, December 3 at 9:00 AM',
      actionProps: {
        children: 'Undo',
        onClick() {
          toast.close(id);
        },
      },
    });
  }

  function showSuccess() {
    toast.add({
      title: 'API Key Created',
      description: 'Your production token is ready for use.',
      type: 'success',
    });
  }

  function showError() {
    toast.add({
      title: 'Security Anomaly Detected',
      description: 'IP 198.51.100.24 triggered rate limit protection.',
      type: 'error',
    });
  }

  function showPromise() {
    const task = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.3 ? resolve({ name: 'Risk Assessment v2' }) : reject(new Error('Network timeout'));
      }, 1800);
    });

    toast.promise(task, {
      loading: {
        title: 'Evaluating API Traffic...',
        description: 'Analyzing anomaly vectors with ML engine',
      },
      success: {
        title: 'Evaluation Complete',
        description: 'Zero high-risk threats detected in current window.',
      },
      error: {
        title: 'Analysis Failed',
        description: 'Unable to reach threat intelligence stream.',
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={showToast}>
        Show Action Toast
      </Button>
      <Button variant="outline" onClick={showSuccess}>
        Success
      </Button>
      <Button variant="outline" onClick={showError}>
        Error
      </Button>
      <Button variant="outline" onClick={showPromise}>
        Promise Toast
      </Button>
    </div>
  );
}
