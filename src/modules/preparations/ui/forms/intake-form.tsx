"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { WaitingButton } from "@/components/waiting-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

import {
  intakeGroups,
  preparationPacks,
  type ConversationType,
  type IntakeContext,
} from "../../types";
import { FileDropzone, putFile, type ReadyFile } from "./file-dropzone";
import { setUnsavedNavigationBlocker } from "../unsaved-navigation";

type FollowUpQuestion = {
  question: string;
  field: string;
};

interface Props {
  packId: ConversationType;
  preparationId?: string | null;
  initialContext: IntakeContext;
  initialFiles: ReadyFile[];
  onSaved: () => void;
  onStageChange?: (stage: "details" | "followups") => void;
}

function filled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isLocalFile(file: ReadyFile) {
  return Boolean(file.file) || file.id.startsWith("local:");
}

export function IntakeForm({
  packId,
  preparationId = null,
  initialContext,
  initialFiles,
  onSaved,
  onStageChange,
}: Props) {
  const pack = preparationPacks[packId];
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState<string | null>(preparationId);
  const [files, setFiles] = useState<ReadyFile[]>(initialFiles);
  const [baselineFiles, setBaselineFiles] = useState<ReadyFile[]>(initialFiles);
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState<FollowUpQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const skipGuard = useRef(false);

  const form = useForm({
    resolver: zodResolver(pack.schema),
    defaultValues: initialContext,
  });

  const createPreparation = useMutation(trpc.preparations.create.mutationOptions({}));
  const updateContext = useMutation(trpc.preparations.updateContext.mutationOptions({}));
  const createUpload = useMutation(trpc.preparations.createUpload.mutationOptions({}));
  const confirmUpload = useMutation(trpc.preparations.confirmUpload.mutationOptions({}));
  const requestFollowUps = useMutation(trpc.preparations.requestFollowUps.mutationOptions({}));
  const submitFollowUps = useMutation(trpc.preparations.submitFollowUps.mutationOptions({}));

  const readyIds = files.map((file) => file.id);
  const watched = form.watch();
  const contextForMinimum: IntakeContext = {
    ...watched,
    documents: files.map((file) => ({ id: file.id, slot: file.slot })),
  };
  const canSubmit = pack.hasMinimum(contextForMinimum, readyIds);
  const groups = intakeGroups(pack);
  const lastStep = Math.max(0, groups.length - 1);
  const current = groups[Math.min(step, lastStep)];
  const filesDirty = files.some(isLocalFile)
    || files.length !== baselineFiles.length
    || files.some((file) => !baselineFiles.some((item) => item.id === file.id));
  const dirty = form.formState.isDirty || filesDirty;
  const pending = createPreparation.isPending
    || updateContext.isPending
    || createUpload.isPending
    || confirmUpload.isPending
    || requestFollowUps.isPending
    || submitFollowUps.isPending;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const persistOnId = async (id: string, values: IntakeContext, nextFiles: ReadyFile[]) => {
    await updateContext.mutateAsync({
      id,
      context: {
        ...values,
        documents: nextFiles.map((file) => ({ id: file.id, slot: file.slot })),
      },
    });
  };

  const flushFiles = async (id: string, currentFiles: ReadyFile[]) => {
    const next: ReadyFile[] = [];
    for (const item of currentFiles) {
      if (!item.file) {
        next.push(item);
        continue;
      }
      const created = await createUpload.mutateAsync({
        preparationId: id,
        fileName: item.file.name,
        contentType: item.file.type || "application/octet-stream",
        byteSize: item.file.size,
      });
      await putFile(
        created.uploadUrl,
        item.file,
        item.file.type || "application/octet-stream",
        () => undefined,
      );
      await confirmUpload.mutateAsync({ documentId: created.documentId });
      next.push({
        id: created.documentId,
        fileName: item.fileName,
        slot: item.slot,
      });
    }
    return next;
  };

  const ensureSaved = async (values: IntakeContext) => {
    let id = savedId;
    if (!id) {
      const created = await createPreparation.mutateAsync({
        conversationType: packId,
        title: pack.label,
      });
      id = created.id;
      setSavedId(id);
    }
    const uploaded = await flushFiles(id, files);
    setFiles(uploaded);
    setBaselineFiles(uploaded);
    await persistOnId(id, values, uploaded);
    form.reset(values);
    await queryClient.invalidateQueries(trpc.preparations.getMany.queryOptions({}));
    return id;
  };

  const goToPreparation = (id: string) => {
    skipGuard.current = true;
    router.replace(`/preparations/${id}`);
  };

  const onSaveDraft = async () => {
    try {
      const values = form.getValues();
      const id = await ensureSaved(values);
      toast.success("Saved as draft");
      if (!preparationId) {
        goToPreparation(id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this draft";
      toast.error(message);
    }
  };

  const onSubmit = async (values: IntakeContext) => {
    try {
      const id = await ensureSaved(values);
      const result = await requestFollowUps.mutateAsync({ id });
      const leftover = result.questions
        .slice(0, 3)
        .filter((question) => !filled(values[question.field]));
      if (leftover.length === 0) {
        await submitFollowUps.mutateAsync({ id, answers: [] });
        await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id }));
        onSaved();
        if (!preparationId) {
          goToPreparation(id);
        }
        return;
      }
      setQuestions(leftover);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this preparation";
      toast.error(message);
    }
  };

  const finishFollowUps = async () => {
    if (!questions || !savedId) return;
    const provided = questions
      .filter((question) => !skipped[question.field] && answers[question.field]?.trim())
      .map((question) => ({
        field: question.field,
        value: answers[question.field].trim(),
      }));
    try {
      await submitFollowUps.mutateAsync({
        id: savedId,
        answers: provided,
      });
      await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: savedId }));
      onSaved();
      if (!preparationId) {
        goToPreparation(savedId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the follow-ups";
      toast.error(message);
    }
  };

  const setLeaveHref = (href: string | null) => {
    pendingHrefRef.current = href;
  };

  const stay = () => {
    setConfirmOpen(false);
    setLeaveHref(null);
  };

  const discard = () => {
    const href = pendingHrefRef.current;
    skipGuard.current = true;
    setConfirmOpen(false);
    setLeaveHref(null);
    if (href) router.push(href);
  };

  const saveAndLeave = async () => {
    try {
      const values = form.getValues();
      const id = await ensureSaved(values);
      const href = pendingHrefRef.current;
      skipGuard.current = true;
      setConfirmOpen(false);
      setLeaveHref(null);
      if (href) {
        router.push(href);
        return;
      }
      if (!preparationId) {
        goToPreparation(id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this draft";
      toast.error(message);
    }
  };

  useEffect(() => {
    onStageChange?.(questions ? "followups" : "details");
  }, [onStageChange, questions]);

  useEffect(() => {
    setUnsavedNavigationBlocker((href) => {
      if (skipGuard.current || !dirtyRef.current) return true;
      setLeaveHref(href);
      setConfirmOpen(true);
      return false;
    });
    return () => setUnsavedNavigationBlocker(null);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (skipGuard.current || !dirtyRef.current || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-slot='dialog-content']")) return;
      const anchor = target?.closest("a");
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(`${url.pathname}${url.search}`);
      setConfirmOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (skipGuard.current || !dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  if (questions) {
    return (
      <div className="space-y-8">
        <div>
          <h6 className="font-medium">A few gaps that would change the interview</h6>
          <p className="mt-1 text-sm text-muted-foreground">Answer any of these, or skip them</p>
        </div>
        {questions.map((question) => (
          <div key={question.field} className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium">{question.question}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={pending}
                onClick={() =>
                  setSkipped((currentSkipped) => ({
                    ...currentSkipped,
                    [question.field]: !currentSkipped[question.field],
                  }))
                }
              >
                {skipped[question.field] ? "Answer" : "Skip"}
              </Button>
            </div>
            <Textarea
              value={answers[question.field] ?? ""}
              disabled={skipped[question.field] || pending}
              onChange={(event) =>
                setAnswers((currentAnswers) => ({
                  ...currentAnswers,
                  [question.field]: event.target.value,
                }))
              }
            />
          </div>
        ))}
        <WaitingButton
          type="button"
          waiting={pending}
          idle="Save preparation"
          busy="Saving"
          onClick={() => void finishFollowUps()}
        />
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-8"
          onSubmit={(event) => {
            if (step < lastStep) {
              event.preventDefault();
              setStep((currentStep) => currentStep + 1);
              return;
            }
            void form.handleSubmit((values) => void onSubmit(values))(event);
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h6 className="font-medium">{current?.title}</h6>
            <WaitingButton
              type="button"
              variant="outline"
              size="sm"
              waiting={pending}
              idle="Save as draft"
              busy="Saving"
              onClick={() => void onSaveDraft()}
            />
          </div>
          <section className="space-y-4">
            {current?.fields.map((field) => (
              <FormField
                key={field.name}
                name={field.name}
                control={form.control}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {field.multiline ? (
                        <Textarea
                          {...formField}
                          value={typeof formField.value === "string" ? formField.value : ""}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Input
                          {...formField}
                          value={typeof formField.value === "string" ? formField.value : ""}
                          placeholder={field.placeholder}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {current?.slots.map((slot) => (
              <FileDropzone
                key={slot.slot}
                preparationId={savedId}
                slot={slot.slot}
                label={slot.label}
                multiple={slot.multiple}
                files={files}
                onUploaded={(file) => {
                  const next = slot.multiple
                    ? [...files, file]
                    : [...files.filter((item) => item.slot !== slot.slot), file];
                  setFiles(next);
                  if (savedId && !file.file) {
                    void persistOnId(savedId, form.getValues(), next).catch((error: unknown) => {
                      const message = error instanceof Error ? error.message : "Could not save the file";
                      toast.error(message);
                    });
                  }
                }}
                onRemoved={(documentId) => {
                  setFiles((currentFiles) => currentFiles.filter((file) => file.id !== documentId));
                }}
              />
            ))}
          </section>
          <div className="grid grid-cols-3 items-center gap-3">
            <div>
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((currentStep) => currentStep - 1)}>
                  Back
                </Button>
              ) : null}
            </div>
            <p className="text-center text-sm tabular-nums text-muted-foreground">
              {step + 1} / {groups.length}
            </p>
            <div className="flex justify-end">
              {step >= lastStep ? (
                <WaitingButton
                  type="submit"
                  waiting={pending}
                  idle="Continue"
                  busy="Checking details"
                  disabled={!canSubmit}
                />
              ) : (
                <Button type="button" onClick={() => setStep((currentStep) => currentStep + 1)}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
      <Dialog open={confirmOpen} onOpenChange={(open) => (open ? setConfirmOpen(true) : stay())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              Stay to keep editing, discard these details, or save them as a draft
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onPointerDown={(event) => event.preventDefault()} onClick={stay}>
              Stay
            </Button>
            <Button type="button" variant="outline" onPointerDown={(event) => event.preventDefault()} onClick={discard}>
              Discard
            </Button>
            <WaitingButton
              type="button"
              waiting={pending}
              idle="Save as draft"
              busy="Saving"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => void saveAndLeave()}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
