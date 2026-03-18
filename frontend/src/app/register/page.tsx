"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { HardHat, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_name: "",
    company_slug: "",
  });
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from company name
    if (field === "company_name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, company_slug: slug, company_name: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        tenant: {
          name: form.company_name,
          slug: form.company_slug,
        },
      });
      setAuth(data.access_token, data.user);
      toast.success("Account created! Welcome aboard.");
      router.push("/dashboard/chat");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <HardHat className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">ConstructAI</span>
        </Link>

        <div className="bg-background border border-border rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-fg text-sm mb-6">
            Set up your company workspace in seconds
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="john@acmebuilders.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Min 8 characters"
              />
            </div>

            <hr className="border-border" />

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                placeholder="Acme Builders Inc"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Company Slug
              </label>
              <input
                type="text"
                required
                pattern="^[a-z0-9-]+$"
                value={form.company_slug}
                onChange={(e) => update("company_slug", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition font-mono text-sm"
                placeholder="acme-builders"
              />
              <p className="text-xs text-muted-fg mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-fg mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
