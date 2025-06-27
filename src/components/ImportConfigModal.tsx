'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MiniLoadingScreen from "./MiniLoadingScreen";

interface ImportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (file: File) => Promise<void>;
}

const ImportConfigModal = ({ open, onOpenChange, onFileUpload }: ImportConfigModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadedFile(file);

    try {
      await onFileUpload(file);
      toast({
        title: "Configuration Imported!",
        description: `Successfully imported configuration from ${file.name}`,
      });
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setUploadError(errorMessage);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center">
            <Upload className="h-5 w-5 mr-2 text-purple-400" />
            Import Configuration
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Upload an existing agent configuration file to populate your settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-white/20 hover:border-white/40'
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".json,.yaml,.yml"
              className="hidden"
              id="config-upload-modal"
            />
            
            {isUploading ? (
              <MiniLoadingScreen
                message="Uploading configuration file..."
                overlay={false}
                icon="logo"
                size="small"
                animated={true}
              />
            ) : uploadedFile && !uploadError ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto" />
                <p className="text-white font-medium">{uploadedFile.name}</p>
                <p className="text-green-400 text-sm">Successfully uploaded</p>
              </div>
            ) : uploadError ? (
              <div className="space-y-2">
                <XCircle className="h-8 w-8 text-red-400 mx-auto" />
                <p className="text-red-400 text-sm">{uploadError}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="h-8 w-8 text-white/40 mx-auto" />
                <p className="text-white/70">
                  Drag and drop your configuration file here, or{' '}
                  <label
                    htmlFor="config-upload-modal"
                    className="text-purple-400 hover:text-purple-300 cursor-pointer underline"
                  >
                    browse files
                  </label>
                </p>
                <p className="text-white/50 text-xs">
                  Supports .json, .yaml, and .yml files
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              Cancel
            </Button>
            {uploadedFile && !uploadError && (
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportConfigModal;
