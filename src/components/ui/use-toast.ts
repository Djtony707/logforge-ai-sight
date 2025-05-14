
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast } from "sonner";

// Enhanced toast interface with standardized methods
export const useToast = () => {
  const { toast: originalToast } = useToastHook();
  
  return {    
    // System notifications
    system: (title: string, message?: string) => {
      toast(title, {
        description: message,
      });
    },
    
    // Success notifications
    success: (title: string, message?: string) => {
      toast.success(title, {
        description: message,
      });
    },
    
    // Error notifications
    error: (title: string, message?: string) => {
      toast.error(title, {
        description: message,
      });
    },
    
    // Warning notifications
    warning: (title: string, message?: string) => {
      toast.warning(title, {
        description: message,
      });
    },
    
    // Info notifications
    info: (title: string, message?: string) => {
      toast.info(title, {
        description: message,
      });
    },
    
    // Loading notifications
    loading: (title: string, message?: string) => {
      return toast.loading(title, {
        description: message,
      });
    },
    
    // Promise-based toast
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
      }
    ) => {
      return toast.promise(promise, {
        loading: { description: loading },
        success: {
          description: typeof success === "function" 
            ? (data) => success(data as T) 
            : success,
        },
        error: {
          description: typeof error === "function" 
            ? (err) => error(err) 
            : error,
        },
      });
    },
  };
};

// Re-export the direct toast function for simpler use cases
export { toast };
