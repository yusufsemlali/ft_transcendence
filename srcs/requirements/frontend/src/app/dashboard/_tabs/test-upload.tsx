"use client";

import { useState } from "react";
import { 
  FileUploader, 
  FileUploaderContent, 
  FileUploaderItem, 
  FileUploaderProgress 
} from "@/components/ui/file-uploader";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";

interface UploadedFile {
  id: string;
  url: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

export function TestUploadTab() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSuccess = (fileData: UploadedFile) => {
    setUploadedFiles((prev: UploadedFile[]) => [fileData, ...prev]);
  };

  const deleteFile = async (id: string) => {
    try {
      const res = await api.files.deleteFile({ params: { id } });
      if (res.status === 200) {
        toast.success("File deleted");
        setUploadedFiles((prev: UploadedFile[]) => prev.filter((f: UploadedFile) => f.id !== id));
      } else {
        toast.error("Failed to delete file");
      }
    } catch (err) {
      toast.error("Error deleting file");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>Media Service Test</h2>
        <p style={{ color: "var(--text-muted)" }}>Testing the new Shadcn-style compound FileUploader.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        
        <div className="flex flex-col gap-4">
          <div className="dashboard-stat-label">Upload New Media</div>
          <FileUploader onSuccess={handleSuccess}>
            <FileUploaderContent label="Drop your assets here" />
            <FileUploaderProgress />
            <FileUploaderItem />
          </FileUploader>
        </div>
        
        <div className="glass-card" style={{ padding: "24px", minHeight: "300px" }}>
            <div className="dashboard-stat-label" style={{ marginBottom: "16px" }}>Upload Gallery ({uploadedFiles.length})</div>
            
            {uploadedFiles.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-muted)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "40px", marginBottom: "8px" }}>image_not_supported</span>
                    <p style={{ fontSize: "14px" }}>No uploads yet</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {uploadedFiles.map((file: UploadedFile) => {
                        if (!file) return null;
                        return (
                        <div key={file.id} className="glass-card" style={{ padding: "12px", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: "12px" }}>
                            <img src={file.url} style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.originalName}</div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{(file.sizeBytes / 1024).toFixed(1)} KB • {file.mimeType}</div>
                            </div>
                            <button 
                                onClick={() => deleteFile(file.id)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                                onMouseOver={(e) => (e.currentTarget.style.color = "var(--error)")}
                                onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                            </button>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

