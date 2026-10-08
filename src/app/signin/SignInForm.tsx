"use client";

import { useState } from "react";

import GoogleIcon from "~/components/GoogleIcon";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";
import { reloadTo } from "~/lib/utils";

export default function SignInForm({
  googleEnabled,
  initialError,
}: {
  googleEnabled: boolean;
  initialError: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Couldn't sign in");
      setPending(false);
      return;
    }
    reloadTo("/dashboard");
  };

  const signInWithGoogle = async () => {
    setPending(true);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/signin",
    });
    if (result.error) {
      setError(result.error.message ?? "Couldn't reach Google");
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={signInWithPassword}
      className="mx-auto grid w-full max-w-sm gap-4"
    >
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-sm text-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
            or
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={pending}
            onClick={signInWithGoogle}
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </Button>
          <p className="text-center text-sm text-faint">
            New here? Continue with Google to make an account.
          </p>
        </>
      )}
    </form>
  );
}
