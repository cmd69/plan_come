"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileText, X, Loader2 } from "lucide-react";
import { importProductsFromCSV } from "@/actions/import-products";

export default function ImportProducts() {
  const [preview, setPreview] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPreview(text);
      setResult(null);
      const dataLines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));
      // Subtract header if present
      const first = dataLines[0]?.toLowerCase() || "";
      const hasHeader = first.includes("icon") && first.includes("name");
      setLineCount(hasHeader ? dataLines.length - 1 : dataLines.length);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    try {
      const res = await importProductsFromCSV(preview);
      setResult(res);
      if (res.imported > 0 && res.errors.length === 0) {
        // Clear after success — page will rerender with products
        setTimeout(() => {
          setPreview(null);
          setResult(null);
        }, 1500);
      }
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setLineCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Download template */}
      <a
        href="/api/import/products/template"
        download
        className="flex items-center gap-2 text-sm text-accent-text font-medium active:text-accent-hover"
      >
        <Download size={16} />
        Descargar plantilla CSV
      </a>

      {/* File input */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
        id="csv-import"
      />

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover"
        >
          <Upload size={16} />
          Importar CSV
        </button>
      ) : (
        <div className="w-full bg-surface-alt rounded-xl p-4 border border-border-default">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <FileText size={16} />
              <span className="font-medium">{lineCount} productos</span>
            </div>
            <button
              onClick={reset}
              className="p-1 text-faint active:text-tertiary"
            >
              <X size={16} />
            </button>
          </div>

          {/* Preview: first 5 data lines */}
          <div className="text-xs text-muted font-mono bg-surface rounded-lg p-2 mb-3 max-h-32 overflow-y-auto border border-border-subtle">
            {preview
              .split(/\r?\n/)
              .filter((l) => l.trim() && !l.startsWith("#"))
              .slice(0, 6)
              .map((line, i) => (
                <div key={i} className="truncate">
                  {line}
                </div>
              ))}
            {lineCount > 5 && (
              <div className="text-faint mt-1">
                ... y {lineCount - 5} más
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="text-sm mb-3 space-y-1">
              {result.imported > 0 && (
                <p className="text-accent-text font-medium">
                  {result.imported} productos importados
                </p>
              )}
              {result.skipped > 0 && (
                <p className="text-amber-600">
                  {result.skipped} duplicados omitidos
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="text-danger-text">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p>... y {result.errors.length - 5} errores más</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {(!result || result.errors.length > 0) && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-inverted text-sm font-semibold rounded-xl active:bg-accent-hover disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importar {lineCount} productos
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
