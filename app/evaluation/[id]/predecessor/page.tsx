"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, FileText, ArrowRight, SkipForward } from "lucide-react";

export default function PredecessorUpload() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      alert("Please upload a PDF, Word document, or text file.");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalyzing(true);

    try {
      const supabase = createClient();

      // Upload file to Supabase Storage
      const fileName = `${evaluationId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("evaluations")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("evaluations").getPublicUrl(fileName);

      // Extract text from file (simplified - in production, use proper PDF/DOCX parsing)
      const text = await file.text().catch(() => "");

      // Call AI to extract structured admin data
      let adminData: any = {};
      if (text.length > 50) {
        try {
          const response = await fetch('/api/ai/extract-predecessor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, evaluationId }),
          });

          if (response.ok) {
            const data = await response.json();
            adminData = data.adminData || {};
            console.log('Extracted admin data:', adminData);
          }
        } catch (err) {
          console.error('Error extracting predecessor data:', err);
        }
      }

      // Save URL and extracted data
      const { error: updateError } = await supabase
        .from("evaluations")
        .update({
          predecessor_file_url: publicUrl,
          predecessor_analysis: {
            uploaded_at: new Date().toISOString(),
            filename: file.name,
            tone: "professional",
            style: "results-oriented",
            admin_data: adminData,
          },
        })
        .eq("id", evaluationId);

      if (updateError) {
        throw updateError;
      }

      // Navigate to admin data screen
      router.push(`/evaluation/${evaluationId}/admin`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSkip = () => {
    router.push(`/evaluation/${evaluationId}/admin`);
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">Upload Predecessor Evaluation</h1>
          <p className="text-gray-400">
            Optional: Upload your previous evaluation to help AI match tone and style
          </p>
        </div>

        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/20 bg-white/10"
            }`}
          >
            <Upload className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              Drop your file here or click to browse
            </h3>
            <p className="mb-6 text-sm text-gray-400">
              Supports PDF, Word (.doc, .docx), or text files up to 10MB
            </p>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
            />
            <label
              htmlFor="file-upload"
              className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
            >
              Choose File
            </label>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-4">
                <FileText className="h-10 w-10 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">{file.name}</h3>
                  <p className="text-sm text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                disabled={uploading}
                className="text-gray-400 hover:text-white disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {analyzing && (
              <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm font-medium text-blue-400">
                    Analyzing predecessor evaluation...
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  AI is learning the tone and style from your previous evaluation
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload & Continue"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleSkip}
            disabled={uploading}
            className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
            Skip this step
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/10 p-6">
          <h3 className="mb-4 font-semibold text-white">Why upload a predecessor?</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>AI learns your rater's writing style and tone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Better consistency across evaluations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>More personalized bullet suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Optional - you can skip if you don't have one</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

