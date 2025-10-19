"use client";

import React, { useState, useRef } from "react";
import { Upload, Camera, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface UploaderProps {
  onUpload?: (file: File) => void;
  preview?: string;
  progress?: number;
  allowCamera?: boolean;
}

export function Uploader({ onUpload, preview, progress, allowCamera = true }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onUpload?.(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearPreview = () => {
    setLocalPreview(null);
  };

  const displayPreview = preview || localPreview;

  return (
    <div className="space-y-4">
      {displayPreview ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-card">
          <img
            src={displayPreview}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/20 hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground">명함 이미지를 드래그하거나 클릭하세요</p>
              <p className="text-muted-foreground">JPG, PNG (최대 10MB)</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                파일 선택
              </Button>
              {allowCamera && (
                <Button
                  variant="secondary"
                  onClick={() => cameraInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  카메라
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">업로드 중...</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
