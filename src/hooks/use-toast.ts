
import { toast as sonnerToast } from "sonner";
import { useState } from "react";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

type ToastState = ToastProps[];

export function toast({ title, description, variant }: ToastProps) {
  // Map our variant to sonner variant
  const type = variant === "destructive" ? "error" : "default";
  
  return sonnerToast[type](title, {
    description,
  });
}

export type { ToastState as ToastActionElement };

export const useToast = () => {
  // This is a mock implementation to satisfy the Toaster component
  // while still using Sonner for actual toast rendering
  const [toasts] = useState<ToastState>([]);
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: toasts,
  };
};
