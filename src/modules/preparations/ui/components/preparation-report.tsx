"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BookOpenTextIcon, ClockFadingIcon, FileTextIcon, FileVideoIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/trpc/client";

import { RunAsk } from "./run-ask";
import { RunTranscript } from "./run-transcript";

type Weakness = {
  id: string;
  whatWentWrong: string;
  whyItWasProblematic: string;
  whatWasExpected: string;
  whatAStrongAnswerWouldHaveDemonstrated: string;
  missingEvidence: string;
  quote: string;
  startTs?: number;
};

type Report = {
  objectiveJudgment: string;
  preparedness: string;
  dimensions: { name: string; assessment: string; quote: string | null; startTs?: number }[];
  strengths: { statement: string; quote: string; startTs?: number }[];
  demonstrated: string[];
  uncertain: string[];
  weaknesses: Weakness[];
  moments: { id: string; kind: string; statement: string; quote: string; startTs?: number }[];
  counterpartConcerns: string[];
  nextPractice: { focus: string; why: string; suggestedMinutes: number };
};

interface Props {
  runId: string;
  recordingUrl: string | null;
  report: Report;
}

export function PreparationReport({ runId, recordingUrl, report }: Props) {
  const trpc = useTRPC();
  const [tab, setTab] = useState("report");
  const [focusTs, setFocusTs] = useState<number | null>(null);
  const drill = useMutation(trpc.runs.createDrill.mutationOptions({}));
  const nextPractice = useMutation(trpc.runs.createNextPractice.mutationOptions({}));
  const checkout = useMutation(trpc.runs.createCheckoutForExisting.mutationOptions({}));
  const pending = drill.isPending || nextPractice.isPending || checkout.isPending;

  const payFor = async (createdRunId: string) => {
    const result = await checkout.mutateAsync({ runId: createdRunId });
    window.location.assign(result.url);
  };

  const practice = async (weaknessId: string) => {
    try {
      const created = await drill.mutateAsync({ runId, weaknessId });
      await payFor(created.runId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Practice could not be opened");
    }
  };

  const practiceNext = async () => {
    try {
      const created = await nextPractice.mutateAsync({ runId });
      await payFor(created.runId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Next practice could not be opened");
    }
  };

  const openMoment = (startTs?: number) => {
    if (startTs == null) return;
    setFocusTs(startTs);
    setTab("transcript");
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="bg-white rounded-lg border px-3">
        <ScrollArea>
          <TabsList className="p-0 bg-background justify-start rounded-none h-13">
            <TabsTrigger value="report" className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full">
              <BookOpenTextIcon />
              Report
            </TabsTrigger>
            <TabsTrigger value="moments" className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full">
              <ClockFadingIcon />
              Moments
            </TabsTrigger>
            <TabsTrigger value="transcript" className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full">
              <FileTextIcon />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="recording" className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full">
              <FileVideoIcon />
              Recording
            </TabsTrigger>
            <TabsTrigger value="ask" className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full">
              <SparklesIcon />
              Ask
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <TabsContent value="report">
        <div className="space-y-6 rounded-lg border bg-white px-4 py-5">
          <div>
            <h2 className="text-2xl font-medium">{report.objectiveJudgment}</h2>
            <p className="mt-2 text-sm">{report.preparedness}</p>
          </div>
          <section className="space-y-2">
            <h3 className="font-medium">Dimensions</h3>
            {report.dimensions.map((item) => (
              <p key={item.name} className="text-sm"><span className="font-medium">{item.name}.</span> {item.assessment}</p>
            ))}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Strengths</h3>
            {report.strengths.map((item) => (
              <p key={item.statement} className="text-sm">{item.statement}</p>
            ))}
          </section>
          <section className="space-y-1">
            <h3 className="font-medium">Demonstrated</h3>
            {report.demonstrated.map((item) => <p key={item} className="text-sm">{item}</p>)}
          </section>
          <section className="space-y-1">
            <h3 className="font-medium">Uncertain</h3>
            {report.uncertain.map((item) => <p key={item} className="text-sm">{item}</p>)}
          </section>
          <section className="space-y-3">
            <h3 className="font-medium">What to practice</h3>
            {report.weaknesses.map((item) => (
              <div key={item.id} className="space-y-1 rounded-md border p-3 text-sm">
                <p>{item.whatWentWrong}</p>
                <p>{item.whyItWasProblematic}</p>
                <p>{item.whatWasExpected}</p>
                <p>{item.whatAStrongAnswerWouldHaveDemonstrated}</p>
                {item.missingEvidence ? <p>{item.missingEvidence}</p> : null}
                <Button type="button" variant="outline" disabled={pending} onClick={() => void practice(item.id)}>
                  Practice This Again
                </Button>
              </div>
            ))}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Counterpart concerns</h3>
            {report.counterpartConcerns.map((item) => <p key={item} className="text-sm">{item}</p>)}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Next practice</h3>
            <p className="text-sm">{report.nextPractice.focus}</p>
            <p className="text-sm text-muted-foreground">{report.nextPractice.why}</p>
            <Button type="button" disabled={pending} onClick={() => void practiceNext()}>
              Practice for {report.nextPractice.suggestedMinutes} minutes
            </Button>
          </section>
        </div>
      </TabsContent>
      <TabsContent value="moments">
        <div className="space-y-3 rounded-lg border bg-white px-4 py-5">
          {report.moments.map((moment) => (
            <button key={moment.id} type="button" className="block w-full rounded-md border p-3 text-left text-sm" onClick={() => openMoment(moment.startTs)}>
              <p className="font-medium">{moment.kind}</p>
              <p className="mt-1">{moment.statement}</p>
            </button>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="transcript">
        <RunTranscript runId={runId} focusTs={focusTs} />
      </TabsContent>
      <TabsContent value="recording">
        <div className="rounded-lg border bg-white px-4 py-5">
          {recordingUrl ? <video src={recordingUrl} className="w-full rounded-lg" controls /> : <p className="text-sm">The recording is not ready yet.</p>}
        </div>
      </TabsContent>
      <TabsContent value="ask">
        <RunAsk runId={runId} />
      </TabsContent>
    </Tabs>
  );
}
