"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export default function SetupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const create = api.setup.createUsername.useMutation({
    onSuccess: () => router.push("/dashboard"),
  });

  return (
    <form
      className="grid max-w-lg gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({ username });
      }}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Input
          required
          autoFocus
          aria-label="Username"
          placeholder="3 to 20 letters, numbers or _"
          className="h-[52px]"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Continue"}
        </Button>
      </div>
      {create.error && (
        <p className="text-sm text-danger">{create.error.message}</p>
      )}
    </form>
  );
}
