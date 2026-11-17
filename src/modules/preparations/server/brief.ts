export type BriefFinding = {
  statement: string;
  category: string;
};

export type BriefArea = {
  id: string;
  label: string;
  priority: number;
  exitCriteria: string;
  documentAnchors: string[];
};

export type BriefSituation = {
  counterpartName: string;
  counterpartObjective: string;
  knownFacts: string[];
  unknowns: string[];
  areas: BriefArea[];
  patternWeights: { pattern: string; areaId: string }[];
  conversationStyle: {
    depth: string;
    skepticism: string;
    detail: string;
    pace: string;
    interruption: string;
    rationale: string;
  };
};

export type DrillStrategy = {
  weakness?: string;
  skill?: string;
  whyTheLastAnswerFailed?: string;
  whatAStrongAnswerMustShow?: string;
  differentAngle?: string;
  differentScenario?: string;
  bannedQuote?: string;
};

export type RenderBriefInput = {
  situationModel: BriefSituation;
  findings: BriefFinding[];
  durationMinutes: number;
  minutesRemaining: number;
  sessionState: unknown;
  drillStrategy: DrillStrategy | null;
  nextPracticeFocus: string | null;
};

const TOKEN_LIMIT = 8000;

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function sameFact(left: string, right: string): boolean {
  const a = normalized(left);
  const b = normalized(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function tokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function statedFacts(input: RenderBriefInput): string[] {
  const verified = input.findings.filter((finding) =>
    finding.category === "verified" || finding.category === "source_backed",
  );
  const inferred = input.findings.filter((finding) =>
    finding.category === "inference" || finding.category === "assumption",
  );
  const stated = input.situationModel.knownFacts.filter((fact) => {
    const fromResearch = input.findings.some((finding) => sameFact(fact, finding.statement));
    const isVerified = verified.some((finding) => sameFact(fact, finding.statement));
    return isVerified || !fromResearch;
  });
  for (const finding of verified) {
    if (!stated.some((fact) => sameFact(fact, finding.statement))) {
      stated.push(finding.statement);
    }
  }
  return stated.filter((fact) => !inferred.some((finding) => sameFact(fact, finding.statement) && !verified.some((item) => sameFact(fact, item.statement))));
}

function orderedAnchors(areas: BriefArea[]): string[] {
  const ordered = [...areas].sort((left, right) => left.priority - right.priority);
  const anchors: string[] = [];
  for (const area of ordered) {
    for (const anchor of area.documentAnchors) {
      const text = anchor.trim();
      if (!text || anchors.includes(text)) continue;
      anchors.push(text);
      if (anchors.length === 15) return anchors;
    }
  }
  return anchors;
}

function render(input: RenderBriefInput, anchors: string[]): string {
  const style = input.situationModel.conversationStyle;
  const stated = statedFacts(input);
  const inferences = input.findings.filter((finding) =>
    finding.category === "inference" || finding.category === "assumption",
  );
  const areas = [...input.situationModel.areas].sort((left, right) => left.priority - right.priority);
  const lines = [
    "This is practice. Never tell the user what answer to give.",
    "The user speaks first. Then open like a real meeting: a brief, appropriately formal greeting in role, then a natural invite for them to introduce themselves, their pitch, or why they are here.",
    "Do not jump into a rapid-fire interview question on the first turn. After they introduce themselves, take ownership and drive using the brief, research, objective, and conversation type.",
    "You are the counterpart in this situation, not a facilitator. Never ask what they prefer to discuss, practice, cover, or be asked. Never offer a menu of topics.",
    "Pick the next beat yourself. The user explains, defends, and answers. You question, challenge, and move the conversation.",
    "Never repeat or re-read the same question or the same spoken line twice in a row. If the last turn already asked it, move on or follow up differently.",
    "HARD LIMIT: every spoken turn is 40 words or fewer, including the first turn. Aim for 20 to 30. Count the words before you finish. Never go over 40.",
    "At most two short statements, including one question. Never stack independent questions.",
    "Do not give long explanations, introductions, or acknowledgements.",
    "Let the user speak at any length. Never cut them off, summarize them down, or ask them to be brief.",
    "Do not give unsolicited coaching, model answers, or long explanations.",
    "Challenge vague, incomplete, unsupported, or contradictory answers.",
    "If the situation is complex, ask a sharper question. Do not make a longer speech.",
    "If they try to flip the room or quiz you, stay in role: you are the other seat, not a tutor. Short redirect, then the next real question.",
    "",
    `Counterpart: ${input.situationModel.counterpartName}`,
    `Objective: ${input.situationModel.counterpartObjective}`,
    "",
    "Conversation style",
    `Depth: ${style.depth}`,
    `Skepticism: ${style.skepticism}`,
    `Detail: ${style.detail}`,
    `Pace: ${style.pace}`,
    `Interruption: ${style.interruption}`,
    style.rationale,
    "",
    `Duration: ${input.durationMinutes} minutes.`,
    "Close the conversation inside the remaining minutes.",
    "",
    "Known facts the counterpart may state",
    ...(stated.length > 0 ? stated.map((fact) => `- ${fact}`) : ["- None"]),
    "",
    "Inferences the counterpart may test and must not state as fact",
    ...(inferences.length > 0 ? inferences.map((finding) => `- ${finding.statement}`) : ["- None"]),
    "",
    "Unknowns the counterpart must not invent",
    ...(input.situationModel.unknowns.length > 0
      ? input.situationModel.unknowns.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "Document anchors",
    ...(anchors.length > 0 ? anchors.map((anchor) => `- ${anchor}`) : ["- None"]),
    "",
    "Areas and exit criteria",
    ...areas.flatMap((area) => [
      `- ${area.priority}. ${area.label}`,
      `  Exit when: ${area.exitCriteria}`,
    ]),
  ];

  if (input.situationModel.patternWeights.length > 0) {
    lines.push(
      "",
      "Reported interview tendencies, not questions",
      ...input.situationModel.patternWeights.map((item) => `- ${item.pattern} (${item.areaId})`),
    );
  }

  lines.push(
    "",
    "Do not follow a question list.",
    "A strong answer gets a harder follow-up on the same area.",
    "A vague or unsupported answer gets a demand for a concrete example.",
    "A contradiction gets challenged.",
    "A repeated weakness is tested from another angle.",
    "An area that meets its exit criteria is left.",
    "",
    "Session state",
  );

  if (input.sessionState) {
    lines.push(JSON.stringify(input.sessionState));
  }

  lines.push("", `Minutes remaining: ${input.minutesRemaining}`);

  if (input.drillStrategy) {
    const drill = input.drillStrategy;
    lines.push(
      "",
      "Weakness drill",
      `Weakness: ${drill.whyTheLastAnswerFailed || drill.weakness || drill.skill || ""}`,
      `A strong answer must show: ${drill.whatAStrongAnswerMustShow || ""}`,
      `Different angle: ${drill.differentScenario || drill.differentAngle || ""}`,
      `Do not ask this previous quote: ${drill.bannedQuote || ""}`,
    );
  }

  if (input.nextPracticeFocus) {
    lines.push(
      "",
      `Next practice focus: ${input.nextPracticeFocus}`,
      "Use the same conversation style.",
    );
  }

  return lines.join("\n");
}

export function renderBrief(input: RenderBriefInput): string {
  let anchors = orderedAnchors(input.situationModel.areas);
  let text = render(input, anchors);
  while (tokens(text) > TOKEN_LIMIT && anchors.length > 0) {
    anchors = anchors.slice(0, -1);
    text = render(input, anchors);
  }
  if (tokens(text) > TOKEN_LIMIT) {
    throw new Error("The brief is too long");
  }
  return text;
}
