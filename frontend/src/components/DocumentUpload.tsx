"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { docsApi } from "@/lib/api";

interface DocumentUploadProps {
  onUploaded: () => void;
}

export default function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      for (const file of acceptedFiles) {
        setUploading(true);

        try {
          await docsApi.upload(file);
          toast.success(`"${file.name}" uploaded successfully`);
          onUploaded();
        } catch (err: any) {
          toast.error(
            err.response?.data?.detail || `Failed to upload "${file.name}"`
          );
        }
      }

      setUploading(false);
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        uploading && "opacity-60 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="space-y-3">
          <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
          <p className="text-sm font-medium">Uploading & processing...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            {isDragActive ? (
              <FileText className="w-6 h-6 text-primary" />
            ) : (
              <Upload className="w-6 h-6 text-primary" />
            )}
          </div>
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop files here"
              : "Drag & drop files, or click to browse"}
          </p>
          <p className="text-xs text-muted-fg">
            PDF and DOCX files, up to 50MB each
          </p>
        </div>
      )}
    </div>
  );
}
