"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenTextIcon, ClockFadingIcon, FileTextIcon, FileVideoIcon, MessageSquareIcon } from "lucide-react";

import { LoadingState } from "@/components/loading-state";
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
  const [tab, setTab] = useState("report");
  const [focusTs, setFocusTs] = useState<number | null>(null);

  const openMoment = (startTs?: number) => {
    if (startTs == null) return;
    setFocusTs(startTs);
    setTab("transcript");
  };

  const tabClass =
    "h-full rounded-none border-b-2 border-transparent bg-background px-4 text-muted-foreground shadow-none data-[state=active]:h-9 data-[state=active]:rounded-md data-[state=active]:border-b-0 data-[state=active]:bg-muted data-[state=active]:px-3 data-[state=active]:text-foreground data-[state=active]:shadow-none";

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <div className="rounded-[24px] border bg-background px-2 md:px-4">
        <ScrollArea>
          <TabsList className="h-12 w-full items-center justify-start gap-2 rounded-none bg-background p-0">
            <TabsTrigger value="report" className={tabClass}>
              <BookOpenTextIcon />
              Report
            </TabsTrigger>
            <TabsTrigger value="moments" className={tabClass}>
              <ClockFadingIcon />
              Moments
            </TabsTrigger>
            <TabsTrigger value="transcript" className={tabClass}>
              <FileTextIcon />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="recording" className={tabClass}>
              <FileVideoIcon />
              Recording
            </TabsTrigger>
            <TabsTrigger value="ask" className={tabClass}>
              <MessageSquareIcon />
              Ask
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <TabsContent value="report">
        <div className="space-y-10 rounded-[24px] border bg-background px-4 py-6 md:px-8">
          <div>
            <h2 className="text-2xl font-medium">{report.objectiveJudgment}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{report.preparedness}</p>
          </div>
          <section className="space-y-3">
            <h3 className="font-medium">Dimensions</h3>
            {report.dimensions.map((item) => (
              <div key={item.name} className="space-y-1 text-sm">
                <p className="font-medium">{item.name}</p>
                <p>{item.assessment}</p>
                {item.quote ? (
                  <button type="button" className="text-left text-muted-foreground underline-offset-4 hover:underline" onClick={() => openMoment(item.startTs)}>
                    “{item.quote}”
                  </button>
                ) : null}
              </div>
            ))}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Strengths</h3>
            {report.strengths.map((item) => (
              <p key={item.statement} className="text-sm">{item.statement}</p>
            ))}
          </section>
          <section className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">Demonstrated</h3>
              {report.demonstrated.map((item) => <p key={item} className="text-sm">{item}</p>)}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Uncertain</h3>
              {report.uncertain.map((item) => <p key={item} className="text-sm">{item}</p>)}
            </div>
          </section>
          <section className="space-y-4">
            <div>
              <h3 className="font-medium">What to practice</h3>
              <p className="mt-1 text-sm text-muted-foreground">Each practice is another 30-minute interview and uses one credit</p>
            </div>
            {report.weaknesses.map((item) => (
              <div key={item.id} className="space-y-3 border-t py-4 text-sm">
                <p><span className="text-muted-foreground">What went wrong. </span>{item.whatWentWrong}</p>
                <p><span className="text-muted-foreground">Why it mattered. </span>{item.whyItWasProblematic}</p>
                <p><span className="text-muted-foreground">What was expected. </span>{item.whatWasExpected}</p>
                <p><span className="text-muted-foreground">A stronger answer. </span>{item.whatAStrongAnswerWouldHaveDemonstrated}</p>
                {item.missingEvidence ? <p><span className="text-muted-foreground">Missing. </span>{item.missingEvidence}</p> : null}
                {item.quote ? (
                  <button type="button" className="text-left text-muted-foreground underline-offset-4 hover:underline" onClick={() => openMoment(item.startTs)}>
                    “{item.quote}”
                  </button>
                ) : null}
              </div>
            ))}
          </section>
          <section className="space-y-2">
            <h3 className="font-medium">Counterpart concerns</h3>
            {report.counterpartConcerns.map((item) => <p key={item} className="text-sm">{item}</p>)}
          </section>
          <section className="space-y-3">
            <h3 className="font-medium">Next practice</h3>
            <p className="text-sm">{report.nextPractice.focus}</p>
            <p className="text-sm text-muted-foreground">{report.nextPractice.why}</p>
          </section>
        </div>
      </TabsContent>
      <TabsContent value="moments">
        <div className="divide-y rounded-[24px] border bg-background">
          {report.moments.map((moment) => (
            <button key={moment.id} type="button" className="block w-full p-5 text-left" onClick={() => openMoment(moment.startTs)}>
              <p className="text-xs font-medium capitalize text-muted-foreground">{moment.kind}</p>
              <p className="mt-2 text-sm leading-relaxed">{moment.statement}</p>
              {moment.quote ? (
                <p className="mt-3 text-sm text-muted-foreground">“{moment.quote}”</p>
              ) : null}
            </button>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="transcript">
        {tab === "transcript" ? <RunTranscript runId={runId} focusTs={focusTs} /> : null}
      </TabsContent>
      <TabsContent value="recording">
        {tab === "recording" ? <RunRecording runId={runId} recordingUrl={recordingUrl} /> : null}
      </TabsContent>
      <TabsContent value="ask">
        {tab === "ask" ? <RunAsk runId={runId} /> : null}
      </TabsContent>
    </Tabs>
  );
}

function RunRecording({ runId, recordingUrl }: { runId: string; recordingUrl: string | null }) {
  const trpc = useTRPC();
  const { data, isPending } = useQuery({
    ...trpc.runs.getRecording.queryOptions({ runId }),
    refetchInterval: (query) => query.state.data?.url ? false : 4000,
    initialData: recordingUrl ? { url: recordingUrl } : undefined,
  });
  const url = data?.url ?? recordingUrl;

  if (isPending && !url) {
    return (
      <div className="rounded-md border bg-background">
        <LoadingState title="Opening recording" description="This is prepared after the interview ends" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="rounded-md border bg-background px-4 py-5">
        <p className="text-sm text-muted-foreground">The recording is still being prepared</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background px-4 py-5">
      <video src={url} className="w-full rounded-md" controls />
    </div>
  );
}
