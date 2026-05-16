"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password: "demo",
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const demoAccounts = [
    { email: "employee@demo.com", role: "Employee", color: "bg-blue-100 text-blue-700" },
    { email: "manager@demo.com", role: "Manager", color: "bg-green-100 text-green-700" },
    { email: "admin@demo.com", role: "Admin", color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AtomQuest</h1>
          <p className="text-slate-500 mt-2">Goal Setting & Tracking Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your email to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value="demo"
                  disabled
                  className="bg-slate-100"
                />
                <p className="text-xs text-slate-500">Demo mode: password is always &quot;demo&quot;</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-slate-700 mb-3">Demo Accounts</p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => setEmail(account.email)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-slate-50 transition-colors border ${email === account.email ? "border-primary bg-primary/5" : "border-slate-200"}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{account.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${account.color}`}>
                      {account.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
