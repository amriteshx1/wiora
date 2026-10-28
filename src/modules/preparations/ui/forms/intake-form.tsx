"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

import {
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

export function IntakeForm({
  packId,
  preparationId,
  initialContext,
  initialFiles,
  onSaved,
}: Props) {
  const pack = preparationPacks[packId];
  const trpc = useTRPC();
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
      if (result.questions.length === 0) {
        await submitFollowUps.mutateAsync({ id: preparationId, answers: [] });
        onSaved();
        return;
      }
      setQuestions(result.questions.slice(0, 3));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this preparation";
      toast.error(message);
    }
  };

  const finishFollowUps = async () => {
    if (!questions) {
      return;
    }

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
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the follow-ups";
      toast.error(message);
    }
  };

  if (questions) {
    return (
      <div className="space-y-4">
        <div>
          <h6 className="font-medium">A few gaps that would change the simulation</h6>
          <p className="text-sm text-muted-foreground">Answer any of these, or skip them.</p>
        </div>
        {questions.map((question) => (
          <div key={question.field} className="space-y-2">
            <p className="text-sm font-medium">{question.question}</p>
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
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                setSkipped((current) => ({
                  ...current,
                  [question.field]: !current[question.field],
                }))
              }
            >
              {skipped[question.field] ? "Answer instead" : "Skip"}
            </Button>
          </div>
        ))}
        <Button type="button" disabled={pending} onClick={() => void finishFollowUps()}>
          Save preparation
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
        {pack.fields.map((field) => (
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
        {pack.fileSlots.map((slot) => (
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
        <Button type="submit" disabled={!canSubmit || pending}>
          Continue
        </Button>
      </form>
    </Form>
  );
}
