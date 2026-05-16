// src/app/(dashboard)/admin/sheets/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Lock, Unlock, FileText, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AdminSheetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ["adminSheets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sheets");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const unlockSheet = useMutation({
    mutationFn: async ({ sheetId, reason }: { sheetId: string; reason: string }) => {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unlock sheet");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSheets"] });
      setIsUnlockDialogOpen(false);
      setUnlockReason("");
      setSelectedSheet(null);
    },
  });

  const filteredSheets = sheets.filter((sheet: any) => {
    const matchesSearch =
      sheet.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sheet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-purple-100 text-purple-700",
    approved: "bg-green-100 text-green-700",
    locked: "bg-amber-100 text-amber-700",
  };

  const handleUnlockClick = (sheet: any) => {
    setSelectedSheet(sheet);
    setIsUnlockDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Goal Sheets</h1>
            <p className="text-slate-500">Manage and monitor all employee goal sheets</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheets.map((sheet: any) => (
                    <TableRow key={sheet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sheet.employee.firstName} {sheet.employee.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sheet.employee.employeeId} · {sheet.employee.department?.name || "No Dept"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{sheet.cycle.name}</TableCell>
                      <TableCell>{sheet.goals.length}</TableCell>
                      <TableCell>{Number(sheet.totalWeightage).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge className={statusColors[sheet.status]}>
                          {sheet.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sheet.status === "locked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleUnlockClick(sheet)}
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Unlock
                          </Button>
                        )}
                        {sheet.status !== "locked" && (
                          <div className="flex items-center text-slate-400 text-xs gap-1">
                            <Lock className="w-3 h-3" />
                            Editable
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredSheets.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No goal sheets found matching your criteria</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Unlock Dialog */}
      <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Goal Sheet</DialogTitle>
            <DialogDescription>
              This will return the sheet for {selectedSheet?.employee.firstName} to 'Approved' status,
              allowing the employee to make further check-ins or edits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Unlocking (required)</Label>
              <Textarea
                placeholder="e.g., Requested revision for Q1 targets..."
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                rows={3}
              />
              <p className="text-[10px] text-slate-400">
                Minimum 10 characters. This will be recorded in the audit log and sent to the employee.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unlockReason.trim().length < 10 || unlockSheet.isPending}
              onClick={() => unlockSheet.mutate({ sheetId: selectedSheet.id, reason: unlockReason })}
            >
              {unlockSheet.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              Confirm Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
