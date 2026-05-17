// src/components/admin/ReportExport.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

export function ReportExport() {
  const [cycleId, setCycleId] = useState("");
  const [exporting, setExporting] = useState<"excel" | "csv" | null>(null);

  const { data: cycles = [] } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cycles");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleExport = async (format: "excel" | "csv") => {
    if (!cycleId) return;
    setExporting(format);
    
    try {
      const endpoint = format === "excel" ? "/api/admin/reports/achievement" : "/api/admin/reports/csv";
      const res = await fetch(`${endpoint}?cycleId=${cycleId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `achievement_report_${cycleId}.${format === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8 font-sans-body">
      <div className="glass rounded-2xl p-6 md:p-8 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 pb-6 border-b border-skin-800 mb-6">
          <div className="p-3.5 bg-accent/10 rounded-xl border border-accent/20 shadow-inner">
            <FileSpreadsheet className="w-6 h-6 text-accent-light" />
          </div>
          <h2 className="text-2xl font-serif-display font-bold text-skin-50 bg-gradient-to-r from-skin-50 to-accent-light bg-clip-text text-transparent tracking-tight">
            Export Achievement Report
          </h2>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-skin-200 uppercase tracking-wider block">Select Appraisal Cycle</label>
            <Select value={cycleId} onValueChange={(val) => setCycleId(val || "")}>
              <SelectTrigger className="w-full max-w-md bg-skin-950 border-skin-700 text-skin-100 focus:ring-accent-default focus:border-accent-default shadow-sm py-6 text-base">
                <SelectValue placeholder="Select Cycle..." />
              </SelectTrigger>
              <SelectContent className="bg-skin-900 border-skin-700 text-skin-100 shadow-xl shadow-black/40">
                {cycles.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="focus:bg-skin-800 focus:text-skin-50 py-3">
                    <span className="font-bold">{c.name}</span> <span className="text-skin-400 text-xs ml-2">({c.fiscalYear})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              onClick={() => handleExport("excel")}
              disabled={!cycleId || exporting !== null}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-600/20 rounded-xl px-6 py-6 text-base transition-all duration-300"
            >
              {exporting === "excel" ? (
                <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5 mr-2.5" />
              )}
              Export Excel Report
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={!cycleId || exporting !== null}
              className="border-skin-700 text-skin-200 hover:bg-skin-800 hover:text-skin-100 rounded-xl px-6 py-6 text-base font-semibold shadow-sm transition-all duration-300"
            >
              {exporting === "csv" ? (
                <Loader2 className="w-5 h-5 mr-2.5 animate-spin text-accent-light" />
              ) : (
                <FileText className="w-5 h-5 mr-2.5 text-accent-light" />
              )}
              Export CSV Format
            </Button>
          </div>

          {!cycleId && (
            <p className="text-sm font-medium text-amber-400/90 glass p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 inline-block shadow-inner">
              ⚠️ Please select an appraisal cycle above to activate the export options.
            </p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 bg-skin-900/60 border border-skin-800 shadow-lg relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3 pb-6 border-b border-skin-800 mb-6">
          <div className="p-3 bg-skin-800 rounded-xl border border-skin-700 shadow-inner">
            <FileText className="w-6 h-6 text-skin-300" />
          </div>
          <h3 className="text-xl font-serif-display font-bold text-skin-50 tracking-tight">Report Contents & Structure</h3>
        </div>
        
        <div className="space-y-4 text-base text-skin-300 leading-relaxed max-w-3xl font-sans-body">
          <p className="font-bold text-skin-100">The exported comprehensive achievement report includes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="glass p-4 rounded-xl bg-skin-800/30 border border-skin-700 shadow-inner space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-accent-light"></span> Employee ID & Full Name
              </div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-accent-light"></span> Department & Direct Manager
              </div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-accent-light"></span> Goal Title & Thrust Area
              </div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-accent-light"></span> UoM Type & Planned Target
              </div>
            </div>
            <div className="glass p-4 rounded-xl bg-skin-800/30 border border-skin-700 shadow-inner space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Actual Achievement & Progress Score
              </div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Goal Weightage & Current Status
              </div>
              <div className="flex items-center gap-2.5 text-sm font-bold text-skin-50">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Q1 - Q4 Quarterly Actuals & Status
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
