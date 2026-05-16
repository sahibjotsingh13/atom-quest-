// src/app/(dashboard)/approvals/page.tsx
"use client";
// Manager Approvals Workflow Page

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "../../../components/ui/table";
import { Loader2, CheckCircle, XCircle, Eye, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ManagerApprovalsPage() {
  const queryClient = useQueryClient();
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const { data: teamData, isLoading } = useQuery({
    queryKey: ["managerTeam"],
    queryFn: async () => {
      const res = await fetch("/api/manager/team");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ sheetId, action, reason }: { sheetId: string; action: string; reason?: string }) => {
      const res = await fetch("/api/manager/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, action, rejectionReason: reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process approval");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerTeam"] });
      setIsRejectDialogOpen(false);
      setIsPreviewDialogOpen(false);
      setRejectionReason("");
      setSelectedSheet(null);
    },
  });

  const pendingSheets = (teamData?.members || []).filter(
    (m: any) => m.sheetStatus === "submitted"
  );

  const handleApprove = (sheetId: string) => {
    if (confirm("Are you sure you want to approve this goal sheet? This will lock it for the employee.")) {
      reviewMutation.mutate({ sheetId, action: "approve" });
    }
  };

  const handleRejectClick = (sheet: any) => {
    setSelectedSheet(sheet);
    setIsRejectDialogOpen(true);
  };

  const handlePreviewClick = (sheetId: string) => {
    // Fetch full sheet details
    fetch(`/api/manager/sheet/${sheetId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedSheet(data);
        setIsPreviewDialogOpen(true);
      });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
          <p className="text-slate-500">Review and approve goal sheets from your direct reports</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingSheets.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Submitted On</TableHead>
                        <TableHead>Goals</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSheets.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{m.firstName} {m.lastName}</p>
                              <p className="text-xs text-slate-500">{m.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {m.submittedAt ? format(new Date(m.submittedAt), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell>{m.goalCount} goals</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{m.totalWeightage}%</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${Math.min(m.totalWeightage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePreviewClick(m.sheetId)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleApprove(m.sheetId)}
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRejectClick(m)}
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Return
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                <p className="text-slate-500 max-w-xs">
                  No goal sheets are currently pending your approval.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
            <DialogDescription>
              Provide clear feedback on why this goal sheet is being returned.
              {selectedSheet?.firstName} will be able to edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Feedback / Reason (required)</Label>
              <Textarea 
                placeholder="e.g., Please align the Q3 target for the efficiency goal with the new department guidelines..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="text-[10px] text-slate-400">Minimum 10 characters.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={rejectionReason.trim().length < 10 || reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ 
                sheetId: selectedSheet.sheetId, 
                action: "reject", 
                reason: rejectionReason 
              })}
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Goal Sheet Review: {selectedSheet?.employee.firstName} {selectedSheet?.employee.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-slate-500">Employee ID</p>
                <p className="font-semibold">{selectedSheet?.employee.employeeId}</p>
              </div>
              <div>
                <p className="text-slate-500">Performance Cycle</p>
                <p className="font-semibold">{selectedSheet?.cycle.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2">Goals Overview</h3>
              {selectedSheet?.goals.map((goal: any, idx: number) => (
                <div key={goal.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">
                        Goal {idx + 1} · {goal.thrustArea?.name}
                      </Badge>
                      <h4 className="font-bold text-slate-900">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none">
                      {goal.weightage}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span>Target: <span className="font-semibold text-slate-900">
                        {goal.uomType?.code === 'timeline' 
                          ? goal.targetDate ? format(new Date(goal.targetDate), "MMM d, yyyy") : '—'
                          : `${goal.targetValue} ${goal.uomType?.name}`}
                      </span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Alert className="bg-blue-50 border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                Review all goals and weightages carefully. Once approved, the sheet will be locked and ready for quarterly check-ins.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
            <div className="flex-1" />
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200"
              onClick={() => {
                setIsPreviewDialogOpen(false);
                handleRejectClick({ 
                  sheetId: selectedSheet.id, 
                  firstName: selectedSheet.employee.firstName 
                });
              }}
            >
              Return for Rework
            </Button>
            <Button 
              onClick={() => handleApprove(selectedSheet.id)}
              disabled={reviewMutation.isPending}
            >
              Approve Goal Sheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Minimal icons used in preview
function Target({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
