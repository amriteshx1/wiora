"use client";

import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { OctagonAlertIcon } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { WaitingButton } from "@/components/waiting-button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AuthShell,
  authGhostBtn,
  authPrimaryBtn,
} from "@/modules/auth/ui/components/auth-shell";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const SignInView = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);

    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: "/preparations",
      },
      {
        onSuccess: () => {
          setPending(false);
          router.push("/preparations");
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
        },
      },
    );
  };

  const onSocial = (provider: "github" | "google") => {
    setError(null);
    setPending(true);

    authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/preparations",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
        },
      },
    );
  };

  return (
    <AuthShell title="Sign in" subtitle="Continue a preparation">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="xyz@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!!error && (
            <Alert className="border-none bg-destructive/10">
              <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          <WaitingButton
            waiting={pending}
            idle="Sign in"
            busy="Signing in"
            type="submit"
            className={`w-full ${authPrimaryBtn}`}
          />
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-[var(--wiora-rule)]">
            <span className="relative z-10 bg-[var(--wiora-paper)] px-2 text-[var(--wiora-mute)]">
              Or continue with
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              disabled={pending}
              onClick={() => onSocial("google")}
              variant="outline"
              type="button"
              className={authGhostBtn}
            >
              <FaGoogle />
            </Button>
            <Button
              disabled={pending}
              onClick={() => onSocial("github")}
              variant="outline"
              type="button"
              className={authGhostBtn}
            >
              <FaGithub />
            </Button>
          </div>
          <p className="text-center text-sm text-[var(--wiora-mute)]">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-[var(--wiora-ink)] underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </form>
      </Form>
    </AuthShell>
  );
};
