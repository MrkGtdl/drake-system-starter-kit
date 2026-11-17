"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Unable to sign in.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4 sm:p-6">
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-xl shadow-black/[0.04] lg:min-h-[620px] lg:grid-cols-2">
        {/* Left panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-12">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-white/[0.04] blur-2xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <span className="text-lg font-semibold tracking-tight">
              DRAKE Technologies
            </span>
          </div>

          <div className="relative z-10 max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Secure workspace access
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
                Everything you need.
                <span className="mt-1 block text-white/55">
                  All in one workspace.
                </span>
              </h1>

              <p className="max-w-sm text-sm leading-7 text-white/65">
                Manage your organization, members, permissions, and operations
                through one centralized workspace.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white/20 text-[10px] font-semibold">
                  A
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white/30 text-[10px] font-semibold">
                  B
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white/40 text-[10px] font-semibold">
                  C
                </div>
              </div>

              <p className="text-xs text-white/60">
                Built for organized and secure collaboration.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/45">
            <span>© {new Date().getFullYear()} DRAKE Technologies</span>
            <span>Secure access</span>
          </div>
        </section>

        {/* Right panel */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile brand */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <span className="font-semibold tracking-tight">
                DRAKE Technologies
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50">
                <LockKeyhole className="h-5 w-5 text-foreground" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Welcome back
                </h2>

                <p className="text-sm leading-6 text-muted-foreground">
                  Enter your credentials to access your workspace.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading}
                    className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 hover:border-foreground/25 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className="h-11 w-full rounded-lg border bg-background pl-10 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/60 hover:border-foreground/25 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-background px-3 text-muted-foreground">
                    Secure authentication
                  </span>
                </div>
              </div>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                Your account is protected by secure authentication.
                <br />
                Please keep your credentials private.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
