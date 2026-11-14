"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WaitingButton } from "@/components/waiting-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTRPC } from "@/trpc/client";

import { researchInputsChanged } from "../../server/rerun-rules";
import { getPack, type IntakeContext } from "../../types";

type Finding = {
  id: string;
  statement: string;
  category: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
};

type Area = {
  id: string;
  label: string;
  whyItMatters: string;
  priority: number;
  exitCriteria: string;
  documentAnchors: string[];
};

type SituationModel = {
  knownFacts: string[];
  unknowns: string[];
  areas: Area[];
  conversationStyle: {
    depth: string;
    skepticism: string;
    detail: string;
    pace: string;
    interruption: string;
    rationale: string;
  };
};

type DocumentRow = {
  id: string;
  fileName: string;
  status: string;
};

interface Props {
  preparationId: string;
  conversationType: string;
  context: IntakeContext;
  model: SituationModel;
  findings: Finding[];
  documents: DocumentRow[];
}

function documentIds(context: IntakeContext): string[] {
  return Array.isArray(context.documents)
    ? context.documents.map((document) => document.id)
    : [];
}

export function SituationBrief({
  preparationId,
  conversationType,
  context,
  model,
  findings,
  documents,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const pack = getPack(conversationType);
  const [removed, setRemoved] = useState<string[]>([]);
  const [fact, setFact] = useState("");
  const [addedFacts, setAddedFacts] = useState<string[]>([]);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of pack?.fields ?? []) {
      const value = context[field.name];
      initial[field.name] = typeof value === "string" ? value : "";
    }
    return initial;
  });

  const saveCorrections = useMutation(trpc.preparations.saveCorrections.mutationOptions({}));
  const updateContext = useMutation(trpc.preparations.updateContext.mutationOptions({}));
  const rerun = useMutation(trpc.preparations.rerun.mutationOptions({}));
  const pending = saveCorrections.isPending || updateContext.isPending || rerun.isPending;
  const areas = [...model.areas].sort((left, right) => left.priority - right.priority);
  const visibleFindings = findings.filter((finding) => !removed.includes(finding.id));
  const failedDocuments = documents.filter((document) => document.status === "failed");

  const nextContext = (): IntakeContext => {
    const fieldEdits = (pack?.fields ?? [])
      .filter((field) => fields[field.name] !== (typeof context[field.name] === "string" ? context[field.name] : ""))
      .map((field) => ({ field: field.name, value: fields[field.name] }));
    const previousCorrections = context.corrections;
    const previousFacts = previousCorrections && typeof previousCorrections === "object" && "addedFacts" in previousCorrections && Array.isArray(previousCorrections.addedFacts)
      ? previousCorrections.addedFacts.filter((item): item is string => typeof item === "string")
      : [];
    return {
      ...context,
      ...fields,
      corrections: {
        removedFindingIds: removed,
        addedFacts: [...previousFacts, ...addedFacts],
        fieldEdits,
      },
    };
  };

  const willRerun = researchInputsChanged(context, nextContext(), documentIds(context), documentIds(nextContext()));

  const save = async () => {
    const payload = nextContext();
    try {
      if (willRerun) {
        await updateContext.mutateAsync({
          id: preparationId,
          context: payload,
        });
        await rerun.mutateAsync({ id: preparationId });
      } else {
        await saveCorrections.mutateAsync({
          id: preparationId,
          corrections: payload.corrections ?? { removedFindingIds: removed, addedFacts, fieldEdits: [] },
        });
      }
      await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: preparationId }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the corrections";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Review what we found, then start when it looks right</p>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline">Update details</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Update details</SheetTitle>
              <SheetDescription>
                {willRerun
                  ? "These changes will run research again"
                  : "These changes stay on this brief"}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              {(pack?.fields ?? []).map((field) => (
                <label key={field.name} className="block space-y-1 text-sm">
                  <span>{field.label}</span>
                  {field.multiline ? (
                    <Textarea
                      value={fields[field.name] ?? ""}
                      onChange={(event) => setFields((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  ) : (
                    <Input
                      value={fields[field.name] ?? ""}
                      onChange={(event) => setFields((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="flex gap-2">
                <Input
                  value={fact}
                  placeholder="Add a fact"
                  onChange={(event) => setFact(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = fact.trim();
                    if (!next) return;
                    setAddedFacts((current) => [...current, next]);
                    setFact("");
                  }}
                >
                  Add
                </Button>
              </div>
              {addedFacts.map((item) => <p key={item} className="text-sm">{item}</p>)}
            </div>
            <SheetFooter>
              <WaitingButton
                type="button"
                waiting={pending}
                idle={willRerun ? "Save and research again" : "Save updates"}
                busy="Saving"
                onClick={() => void save()}
              />
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <section className="space-y-3">
        <h6 className="font-medium">What we know</h6>
        {model.knownFacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing is confirmed yet</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {model.knownFacts.map((factItem) => <li key={factItem}>{factItem}</li>)}
          </ul>
        )}
      </section>

      {model.unknowns.length > 0 ? (
        <section className="space-y-3">
          <h6 className="font-medium">Still unclear</h6>
          <p className="text-sm text-muted-foreground">
            You can add context if this would change the interview
          </p>
          <ul className="space-y-2 text-sm">
            {model.unknowns.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ) : null}

      {visibleFindings.length > 0 ? (
        <section className="space-y-3">
          <h6 className="font-medium">From research</h6>
          <div className="divide-y border-y">
            {visibleFindings.map((finding) => (
              <div key={finding.id} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0 space-y-1 text-sm">
                  <p>{finding.statement}</p>
                  {finding.sourceUrl ? (
                    <a className="text-muted-foreground underline-offset-4 hover:underline" href={finding.sourceUrl}>
                      {finding.sourceTitle || finding.sourceUrl}
                    </a>
                  ) : finding.sourceTitle ? (
                    <p className="text-muted-foreground">{finding.sourceTitle}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => setRemoved((current) => [...current, finding.id])}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h6 className="font-medium">What will be tested</h6>
        <div className="space-y-6">
          {areas.map((area) => (
            <div key={area.id} className="space-y-1 text-sm">
              <p className="font-medium">{area.label}</p>
              <p>{area.whyItMatters}</p>
              <p className="text-muted-foreground">{area.exitCriteria}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 text-sm">
        <h6 className="font-medium">How this conversation will feel</h6>
        <p>{model.conversationStyle.rationale}</p>
        <p className="text-muted-foreground">
          {model.conversationStyle.depth} depth, {model.conversationStyle.skepticism} skepticism, {model.conversationStyle.pace} pace
        </p>
      </section>

      {failedDocuments.length > 0 ? (
        <section className="space-y-1 text-sm text-muted-foreground">
          {failedDocuments.map((document) => (
            <p key={document.id}>{document.fileName} could not be read</p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
