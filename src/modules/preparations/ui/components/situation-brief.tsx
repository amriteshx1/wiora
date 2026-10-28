"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const save = async () => {
    const fieldEdits = (pack?.fields ?? [])
      .filter((field) => fields[field.name] !== (typeof context[field.name] === "string" ? context[field.name] : ""))
      .map((field) => ({ field: field.name, value: fields[field.name] }));
    const previousCorrections = context.corrections;
    const previousFacts = previousCorrections && typeof previousCorrections === "object" && "addedFacts" in previousCorrections && Array.isArray(previousCorrections.addedFacts)
      ? previousCorrections.addedFacts.filter((item): item is string => typeof item === "string")
      : [];
    const nextContext: IntakeContext = {
      ...context,
      ...fields,
      corrections: {
        removedFindingIds: removed,
        addedFacts: [...previousFacts, ...addedFacts],
        fieldEdits,
      },
    };
    const changed = researchInputsChanged(context, nextContext, documentIds(context), documentIds(nextContext));

    try {
      if (changed) {
        await updateContext.mutateAsync({
          id: preparationId,
          context: nextContext,
        });
        await rerun.mutateAsync({ id: preparationId });
      } else {
        await saveCorrections.mutateAsync({
          id: preparationId,
          corrections: {
            removedFindingIds: removed,
            addedFacts,
            fieldEdits,
          },
        });
      }
      await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: preparationId }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save the corrections";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h6 className="font-medium">Known facts</h6>
        {model.knownFacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No facts are confirmed yet.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {model.knownFacts.map((factItem) => <li key={factItem}>{factItem}</li>)}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h6 className="font-medium">Unknowns</h6>
        {model.unknowns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing important is marked unknown.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {model.unknowns.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h6 className="font-medium">Research</h6>
        {visibleFindings.map((finding) => (
          <div key={finding.id} className="rounded-md border p-3 text-sm">
            <p>{finding.statement}</p>
            <p className="mt-2 text-muted-foreground">
              {finding.category}
              {finding.sourceTitle ? ` · ${finding.sourceTitle}` : ""}
            </p>
            {finding.sourceUrl ? (
              <a className="mt-1 inline-block underline" href={finding.sourceUrl}>
                {finding.sourceUrl}
              </a>
            ) : null}
            <div>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setRemoved((current) => [...current, finding.id])}
              >
                Remove finding
              </Button>
            </div>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h6 className="font-medium">What will be tested</h6>
        {areas.map((area) => (
          <div key={area.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">{area.priority}. {area.label}</p>
            <p className="mt-1">{area.whyItMatters}</p>
            <p className="mt-2 text-muted-foreground">{area.exitCriteria}</p>
            {area.documentAnchors.map((anchor) => (
              <p key={anchor} className="mt-2">{anchor}</p>
            ))}
          </div>
        ))}
      </section>
      <section className="space-y-2 text-sm">
        <h6 className="font-medium">How this conversation will feel</h6>
        <p>Depth: {model.conversationStyle.depth}</p>
        <p>Skepticism: {model.conversationStyle.skepticism}</p>
        <p>Detail: {model.conversationStyle.detail}</p>
        <p>Pace: {model.conversationStyle.pace}</p>
        <p>Interruption: {model.conversationStyle.interruption}</p>
        <p>{model.conversationStyle.rationale}</p>
      </section>
      {failedDocuments.length > 0 ? (
        <section className="space-y-2 text-sm">
          {failedDocuments.map((document) => (
            <p key={document.id}>{document.fileName} could not be read.</p>
          ))}
        </section>
      ) : null}
      <section className="space-y-3">
        <h6 className="font-medium">Correct the brief</h6>
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
            Add fact
          </Button>
        </div>
        {addedFacts.map((item) => <p key={item} className="text-sm">{item}</p>)}
        <Button type="button" disabled={pending} onClick={() => void save()}>
          Save corrections
        </Button>
      </section>
    </div>
  );
}
