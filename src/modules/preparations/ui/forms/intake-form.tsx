"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { WaitingButton } from "@/components/waiting-button";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

import {
  intakeGroups,
  preparationPacks,
  type ConversationType,
  type DocumentSlot,
  type IntakeContext,
} from "../../types";
import { FileDropzone } from "./file-dropzone";

type ReadyFile = {
  id: string;
  fileName: string;
  slot: DocumentSlot;
};

type FollowUpQuestion = {
  question: string;
  field: string;
};

interface Props {
  packId: ConversationType;
  preparationId: string;
  initialContext: IntakeContext;
  initialFiles: ReadyFile[];
  onSaved: () => void;
}

function filled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function IntakeForm({
  packId,
  preparationId,
  initialContext,
  initialFiles,
  onSaved,
}: Props) {
  const pack = preparationPacks[packId];
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<ReadyFile[]>(initialFiles);
  const [questions, setQuestions] = useState<FollowUpQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});

  const form = useForm({
    resolver: zodResolver(pack.schema),
    defaultValues: initialContext,
  });

  const updateContext = useMutation(trpc.preparations.updateContext.mutationOptions({}));
  const requestFollowUps = useMutation(trpc.preparations.requestFollowUps.mutationOptions({}));
  const submitFollowUps = useMutation(trpc.preparations.submitFollowUps.mutationOptions({}));

  const readyIds = files.map((file) => file.id);
  const watched = form.watch();
  const contextForMinimum: IntakeContext = {
    ...watched,
    documents: files.map((file) => ({ id: file.id, slot: file.slot })),
  };
  const canSubmit = pack.hasMinimum(contextForMinimum, readyIds);
  const pending = updateContext.isPending || requestFollowUps.isPending || submitFollowUps.isPending;
  const groups = intakeGroups(pack);

  const persistContext = async (values: IntakeContext) => {
    const context = {
      ...values,
      documents: files.map((file) => ({ id: file.id, slot: file.slot })),
    };
    await updateContext.mutateAsync({
      id: preparationId,
      context,
    });
  };

  const onSubmit = async (values: IntakeContext) => {
    try {
      await persistContext(values);
      const result = await requestFollowUps.mutateAsync({ id: preparationId });
      const leftover = result.questions
        .slice(0, 3)
        .filter((question) => !filled(values[question.field]));
      if (leftover.length === 0) {
        await submitFollowUps.mutateAsync({ id: preparationId, answers: [] });
        await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: preparationId }));
        onSaved();
        return;
      }
      setQuestions(leftover);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this preparation";
      toast.error(message);
    }
  };

  const finishFollowUps = async () => {
    if (!questions) return;
    const provided = questions
      .filter((question) => !skipped[question.field] && answers[question.field]?.trim())
      .map((question) => ({
        field: question.field,
        value: answers[question.field].trim(),
      }));
    try {
      await submitFollowUps.mutateAsync({
        id: preparationId,
        answers: provided,
      });
      await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: preparationId }));
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the follow-ups";
      toast.error(message);
    }
  };

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
                  setSkipped((current) => ({
                    ...current,
                    [question.field]: !current[question.field],
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
                setAnswers((current) => ({
                  ...current,
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
    <Form {...form}>
      <form className="space-y-10" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
        {groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <h6 className="font-medium">{group.title}</h6>
            {group.fields.map((field) => (
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
            {group.slots.map((slot) => (
              <FileDropzone
                key={slot.slot}
                preparationId={preparationId}
                slot={slot.slot}
                label={slot.label}
                multiple={slot.multiple}
                files={files}
                onUploaded={(file) => {
                  const next = slot.multiple
                    ? [...files, file]
                    : [...files.filter((item) => item.slot !== slot.slot), file];
                  setFiles(next);
                  void updateContext.mutateAsync({
                    id: preparationId,
                    context: {
                      ...form.getValues(),
                      documents: next.map((item) => ({ id: item.id, slot: item.slot })),
                    },
                  }).catch((error: unknown) => {
                    const message = error instanceof Error ? error.message : "Could not save the file";
                    toast.error(message);
                  });
                }}
                onRemoved={(documentId) => {
                  setFiles((current) => current.filter((file) => file.id !== documentId));
                }}
              />
            ))}
          </section>
        ))}
        <WaitingButton
          type="submit"
          waiting={pending}
          idle="Continue"
          busy="Checking details"
          disabled={!canSubmit}
        />
      </form>
    </Form>
  );
}
