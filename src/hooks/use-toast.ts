
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function toast({ title, description, variant }: ToastProps) {
  // Map our variant to sonner variant
  const type = variant === "destructive" ? "error" : "default";
  
  return sonnerToast[type](title, {
    description,
  });
}

type ToastActionElement = React.ReactElement;

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
};

export type { ToastProps, ToastActionElement };
