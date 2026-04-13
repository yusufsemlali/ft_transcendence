"use client";

import * as React from "react";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "@/components/ui/sonner";
import { uploadFile, type UploadResult } from "@/lib/upload";
import api from "@/lib/api/api";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ═══════════════════════════════════════
   CONTEXT / ROOT
   ═══════════════════════════════════════ */

interface FileUploaderContextType {
  uploading: boolean;
  progress: number;
  onFileSelect: (file: File) => void;
  reset: () => void;
  file: File | null;
  result: UploadResult | null;
  accept: string;
}

const FileUploaderContext = React.createContext<FileUploaderContextType | undefined>(undefined);

interface FileUploaderProps {
  children: React.ReactNode;
  onSuccess?: (result: UploadResult) => void;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
}

export function FileUploader({
  children,
  onSuccess,
  maxSizeMB = 5,
  accept = "image/*,application/pdf",
  className
}: FileUploaderProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<UploadResult | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);

  const onFileSelect = React.useCallback(async (selectedFile: File) => {
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setProgress(0);
    setUploading(true);

    try {
      const uploadResult = await uploadFile(selectedFile, {
        onProgress: setProgress
      });
      setResult(uploadResult);
      onSuccess?.(uploadResult);
      toast.success("File uploaded successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onSuccess]);

  const reset = React.useCallback(() => {
    if (result?.id) {
      api.files.deleteFile({ params: { id: result.id } }).catch(console.error);
    }
    setFile(null);
    setResult(null);
    setProgress(0);
    setUploading(false);
  }, [result]);

  return (
    <FileUploaderContext.Provider value={{ uploading, progress, onFileSelect, reset, file, result, accept }}>
      <div className={cn("flex flex-col gap-4", className)}>
        {children}
      </div>
    </FileUploaderContext.Provider>
  );
}

function useFileUploader() {
  const context = React.useContext(FileUploaderContext);
  if (!context) throw new Error("useFileUploader must be used within FileUploader");
  return context;
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════ */

export function FileUploaderContent({ className, label = "Click or drag to upload" }: { className?: string, label?: string }) {
  const { onFileSelect, uploading, accept } = useFileUploader();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFileSelect(f);
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-[oklch(1_0_0/0.1)] rounded-(--radius) transition-all duration-200 cursor-pointer",
        "bg-white/2 hover:bg-white/5",
        dragging && "border-[var(--primary)] bg-[var(--primary)]/5",
        uploading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input type="file" ref={inputRef} onChange={handleChange} className="hidden" accept={accept} />
      <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-3">cloud_upload</span>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function FileUploaderItem() {
  const { file, uploading, reset } = useFileUploader();
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  if (!file) return null;

  return (
    <div className="flex items-center gap-3 p-3 glass-card bg-white/2">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center shrink-0 border border-white/5">
        {preview ? (
          <Image src={preview} className="w-full h-full object-cover" alt="Preview" width={48} height={48} unoptimized />
        ) : (
          <span className="material-symbols-outlined text-[var(--primary)]">description</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {(file.size / 1024).toFixed(1)} KB • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
        </p>
      </div>

      {!uploading && (
        <button 
          onClick={reset}
          className="p-2 hover:bg-white/5 rounded-full text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      )}
    </div>
  );
}

export function FileUploaderProgress() {
  const { uploading, progress } = useFileUploader();

  if (!uploading) return null;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--primary)] transition-all duration-300 shadow-[0_0_8px_var(--primary)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
