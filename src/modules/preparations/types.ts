import { z } from "zod";

export const conversationTypes = [
  "job_interview",
  "investor_pitch",
  "sales_call",
  "negotiation",
  "leadership",
  "difficult_conversation",
  "custom",
] as const;

export type ConversationType = (typeof conversationTypes)[number];

export const documentSlots = [
  "resume",
  "deck",
  "proposal",
  "contract",
  "supporting",
  "relevant",
  "extra",
] as const;

export type DocumentSlot = (typeof documentSlots)[number];

export const intakeDocumentSchema = z.object({
  id: z.string().min(1),
  slot: z.enum(documentSlots),
});

export const followUpAnswerSchema = z.object({
  field: z.string(),
  value: z.string(),
});

export const correctionSchema = z.object({
  removedFindingIds: z.array(z.string()).optional(),
  addedFacts: z.array(z.string()).optional(),
  fieldEdits: z.array(z.object({
    field: z.string(),
    value: z.string(),
  })).optional(),
});

const sharedContext = {
  documents: z.array(intakeDocumentSchema).optional(),
  followUps: z.array(followUpAnswerSchema).optional(),
  followUpsSubmitted: z.boolean().optional(),
  corrections: correctionSchema.optional(),
};

const optionalText = z.string().optional();

export const jobInterviewSchema = z.object({
  company: optionalText,
  jobTitle: optionalText,
  jobDescription: optionalText,
  portfolioUrl: optionalText,
  profileUrl: optionalText,
  interviewStage: optionalText,
  recruiterCommunication: optionalText,
  previousCommunication: optionalText,
  interviewerInformation: optionalText,
  concerns: optionalText,
  ...sharedContext,
});

export const investorPitchSchema = z.object({
  startupDescription: optionalText,
  investor: optionalText,
  fundingStage: optionalText,
  amountRaising: optionalText,
  metrics: optionalText,
  previousCommunication: optionalText,
  investorInformation: optionalText,
  objections: optionalText,
  desiredOutcome: optionalText,
  ...sharedContext,
});

export const salesCallSchema = z.object({
  client: optionalText,
  product: optionalText,
  pricing: optionalText,
  previousCommunication: optionalText,
  customerRequirements: optionalText,
  participants: optionalText,
  desiredOutcome: optionalText,
  objections: optionalText,
  ...sharedContext,
});

export const negotiationSchema = z.object({
  subject: optionalText,
  counterparty: optionalText,
  desiredOutcome: optionalText,
  minimumAcceptable: optionalText,
  constraints: optionalText,
  counterpartyInformation: optionalText,
  previousCommunication: optionalText,
  ...sharedContext,
});

export const leadershipSchema = z.object({
  people: optionalText,
  situation: optionalText,
  desiredOutcome: optionalText,
  relationship: optionalText,
  whatHappened: optionalText,
  constraints: optionalText,
  concerns: optionalText,
  ...sharedContext,
});

export const difficultConversationSchema = leadershipSchema;

export const customSchema = z.object({
  description: optionalText,
  desiredOutcome: optionalText,
  people: optionalText,
  anythingElse: optionalText,
  ...sharedContext,
});

export type IntakeContext = {
  documents?: { id: string; slot: DocumentSlot }[];
  [key: string]: unknown;
};

export type IntakeField = {
  name: string;
  label: string;
  placeholder: string;
  multiline: boolean;
};

export type FileSlotConfig = {
  slot: DocumentSlot;
  label: string;
  multiple: boolean;
};

export type PreparationPack = {
  id: ConversationType;
  label: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  hasMinimum: (context: IntakeContext, readyDocumentIds: string[]) => boolean;
  researchHints: string;
  evaluationDimensions: string[];
  counterpartObjective: string;
  behaviorNotes: string;
  fields: IntakeField[];
  fileSlots: FileSlotConfig[];
};

export type IntakeGroup = {
  title: string;
  fieldNames: string[];
  slotNames?: DocumentSlot[];
};

const intakeGroupMap: Record<ConversationType, IntakeGroup[]> = {
  job_interview: [
    { title: "Role", fieldNames: ["company", "jobTitle", "interviewStage"] },
    { title: "Materials", fieldNames: ["jobDescription"], slotNames: ["resume", "extra"] },
    { title: "People", fieldNames: ["recruiterCommunication", "previousCommunication", "interviewerInformation"] },
    { title: "You", fieldNames: ["portfolioUrl", "profileUrl", "concerns"] },
  ],
  investor_pitch: [
    { title: "The company", fieldNames: ["startupDescription", "fundingStage", "amountRaising", "metrics"] },
    { title: "Materials", fieldNames: [], slotNames: ["deck", "extra"] },
    { title: "The investor", fieldNames: ["investor", "previousCommunication", "investorInformation", "objections"] },
    { title: "You", fieldNames: ["desiredOutcome"] },
  ],
  sales_call: [
    { title: "The call", fieldNames: ["client", "product", "pricing", "desiredOutcome"] },
    { title: "Materials", fieldNames: [], slotNames: ["proposal", "supporting"] },
    { title: "People", fieldNames: ["participants", "previousCommunication", "customerRequirements", "objections"] },
  ],
  negotiation: [
    { title: "The deal", fieldNames: ["subject", "desiredOutcome", "minimumAcceptable", "constraints"] },
    { title: "Materials", fieldNames: [], slotNames: ["proposal", "contract", "supporting"] },
    { title: "The other side", fieldNames: ["counterparty", "counterpartyInformation", "previousCommunication"] },
  ],
  leadership: [
    { title: "The conversation", fieldNames: ["situation", "desiredOutcome", "whatHappened"] },
    { title: "People", fieldNames: ["people", "relationship"] },
    { title: "Limits", fieldNames: ["constraints", "concerns"] },
    { title: "Materials", fieldNames: [], slotNames: ["relevant"] },
  ],
  difficult_conversation: [
    { title: "The conversation", fieldNames: ["situation", "desiredOutcome", "whatHappened"] },
    { title: "People", fieldNames: ["people", "relationship"] },
    { title: "Limits", fieldNames: ["constraints", "concerns"] },
    { title: "Materials", fieldNames: [], slotNames: ["relevant"] },
  ],
  custom: [
    { title: "The situation", fieldNames: ["description", "desiredOutcome", "people", "anythingElse"] },
    { title: "Materials", fieldNames: [], slotNames: ["extra"] },
  ],
};

export function intakeGroups(pack: PreparationPack): Array<{
  title: string;
  fields: IntakeField[];
  slots: FileSlotConfig[];
}> {
  return intakeGroupMap[pack.id]
    .map((group) => ({
      title: group.title,
      fields: pack.fields.filter((field) => group.fieldNames.includes(field.name)),
      slots: pack.fileSlots.filter((slot) => group.slotNames?.includes(slot.slot)),
    }))
    .filter((group) => group.fields.length > 0 || group.slots.length > 0);
}

const WRITING_WINDOW_MS = 10 * 60 * 1000;

export function isRecentRunUpdate(value?: Date | string | null): boolean {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() < WRITING_WINDOW_MS;
}

export function preparationStatusLabel(status: string, runStatus?: string | null): string {
  if (status === "draft") return "Draft";
  if (status === "processing") return "Researching";
  if (status === "failed") return "Could not prepare";
  if (runStatus === "active") return "Interview";
  if (runStatus === "processing") return "Writing report";
  if (runStatus === "completed") return "Report";
  if (runStatus === "paid") return "Interview";
  if (status === "ready") return "Brief ready";
  return status;
}

export function listRunStatus(
  runs: Array<{ status: string; updatedAt?: Date | string | null }>,
): string | null {
  if (runs.length === 0) return null;
  if (runs.some((run) => run.status === "active")) return "active";
  if (runs.some((run) => run.status === "completed")) return "completed";
  const latest = runs[0];
  if (latest.status === "processing" && isRecentRunUpdate(latest.updatedAt)) {
    return "processing";
  }
  if (latest.status === "processing") return "processing";
  return latest.status;
}

export function preparationListLabels(conversationType: string, context: unknown): { company: string; role: string } {
  const ctx = context && typeof context === "object" && !Array.isArray(context)
    ? context as Record<string, unknown>
    : {};
  const pack = getPack(conversationType);
  const fallback = pack?.label || "Preparation";
  if (conversationType === "job_interview") {
    return {
      company: filled(ctx.company) || fallback,
      role: filled(ctx.jobTitle) || "Role",
    };
  }
  if (conversationType === "investor_pitch") {
    return {
      company: filled(ctx.investor) || fallback,
      role: filled(ctx.startupDescription) || "Pitch",
    };
  }
  if (conversationType === "sales_call") {
    return {
      company: filled(ctx.client) || fallback,
      role: filled(ctx.product) || "Sales call",
    };
  }
  if (conversationType === "negotiation") {
    return {
      company: filled(ctx.counterparty) || fallback,
      role: filled(ctx.subject) || "Negotiation",
    };
  }
  if (conversationType === "leadership" || conversationType === "difficult_conversation") {
    return {
      company: filled(ctx.people) || fallback,
      role: filled(ctx.desiredOutcome) || filled(ctx.situation) || fallback,
    };
  }
  return {
    company: filled(ctx.people) || fallback,
    role: filled(ctx.desiredOutcome) || filled(ctx.description) || fallback,
  };
}

const sourcePriority =
  "When a company, role, or public situation is involved, search TakeYouForward and other interview-experience pages first, then LinkedIn posts and comments, then Reddit. After those, search official pages, news, forums, blogs, and other credible public sources. Reported questions are patterns, not a script. Do not invent an interviewer.";

function filled(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasReadySlot(
  context: IntakeContext,
  slot: DocumentSlot,
  readyDocumentIds: string[],
): boolean {
  const documents = Array.isArray(context.documents) ? context.documents : [];
  return documents.some(
    (document) =>
      document.slot === slot && readyDocumentIds.includes(document.id),
  );
}

const interviewFields: IntakeField[] = [
  { name: "company", label: "Company", placeholder: "Company name", multiline: false },
  { name: "jobTitle", label: "Job title", placeholder: "Role you are interviewing for", multiline: false },
  { name: "jobDescription", label: "Job description", placeholder: "Paste the description", multiline: true },
  { name: "portfolioUrl", label: "Portfolio URL", placeholder: "https://", multiline: false },
  { name: "profileUrl", label: "GitHub or profile URL", placeholder: "https://", multiline: false },
  { name: "interviewStage", label: "Interview stage", placeholder: "Phone screen, onsite, final round", multiline: false },
  { name: "recruiterCommunication", label: "Recruiter communication", placeholder: "What the recruiter told you", multiline: true },
  { name: "previousCommunication", label: "Previous communication", placeholder: "Emails or notes from the company", multiline: true },
  { name: "interviewerInformation", label: "Known interviewer information", placeholder: "Only what you actually know", multiline: true },
  { name: "concerns", label: "Your concerns and goals", placeholder: "What you want to be ready for", multiline: true },
];

const leadershipFields = (wording: "leadership" | "difficult"): IntakeField[] => [
  { name: "people", label: "People involved", placeholder: "Who will be in the conversation", multiline: true },
  {
    name: "situation",
    label: "Situation",
    placeholder: wording === "leadership"
      ? "What is happening on the team"
      : "What has made this conversation difficult",
    multiline: true,
  },
  { name: "desiredOutcome", label: "Desired outcome", placeholder: "What you want from the conversation", multiline: true },
  { name: "relationship", label: "Existing relationship", placeholder: "How you know each other", multiline: true },
  { name: "whatHappened", label: "What has already happened", placeholder: "The facts so far", multiline: true },
  { name: "constraints", label: "Constraints", placeholder: "Limits you cannot ignore", multiline: true },
  { name: "concerns", label: "Concerns", placeholder: "What you are worried about", multiline: true },
];

export const preparationPacks: Record<ConversationType, PreparationPack> = {
  job_interview: {
    id: "job_interview",
    label: "Job interview",
    description: "A specific role at a specific company.",
    schema: jobInterviewSchema,
    hasMinimum: (context, readyDocumentIds) =>
      filled(context.company).length > 0 &&
      (filled(context.jobTitle).length > 0 ||
        filled(context.jobDescription).length > 0 ||
        hasReadySlot(context, "resume", readyDocumentIds)),
    researchHints: `${sourcePriority} Look for how this company interviews for this role and for recent public candidate experiences.`,
    evaluationDimensions: [
      "technical knowledge",
      "role competencies",
      "project depth",
      "communication",
      "behavioral answers",
      "resume credibility",
      "problem solving",
      "system design",
      "job-description gaps",
    ],
    counterpartObjective: "Determine whether the candidate appears prepared and capable for the role.",
    behaviorNotes: "Probe the candidate's real experience against the role. Do not read a question list.",
    fields: interviewFields,
    fileSlots: [
      { slot: "resume", label: "Resume", multiple: false },
      { slot: "extra", label: "Additional documents", multiple: true },
    ],
  },
  investor_pitch: {
    id: "investor_pitch",
    label: "Investor pitch",
    description: "A pitch to a specific investor or fund.",
    schema: investorPitchSchema,
    hasMinimum: (context, readyDocumentIds) =>
      filled(context.startupDescription).length > 0 ||
      hasReadySlot(context, "deck", readyDocumentIds),
    researchHints: `${sourcePriority} Look for this investor's public thesis, interviews, and how founders describe pitching them.`,
    evaluationDimensions: [
      "problem",
      "market",
      "traction",
      "business model",
      "competition",
      "defensibility",
      "founder credibility",
      "investor-specific concerns",
    ],
    counterpartObjective: "Determine whether the pitch addresses the concerns of this investor.",
    behaviorNotes: "Press on the claims a real investor would not take at face value.",
    fields: [
      { name: "startupDescription", label: "Startup description", placeholder: "What the company does", multiline: true },
      { name: "investor", label: "Investor or fund", placeholder: "Who you are pitching", multiline: false },
      { name: "fundingStage", label: "Funding stage", placeholder: "Pre-seed, seed, Series A", multiline: false },
      { name: "amountRaising", label: "Amount being raised", placeholder: "How much, and the instrument", multiline: false },
      { name: "metrics", label: "Metrics", placeholder: "The numbers you will be asked to defend", multiline: true },
      { name: "previousCommunication", label: "Previous investor communication", placeholder: "What they have already said", multiline: true },
      { name: "investorInformation", label: "Investor or company information", placeholder: "What you know about them", multiline: true },
      { name: "objections", label: "Existing objections", placeholder: "Concerns already raised", multiline: true },
      { name: "desiredOutcome", label: "Desired outcome", placeholder: "The next step you want", multiline: true },
    ],
    fileSlots: [
      { slot: "deck", label: "Pitch deck", multiple: false },
      { slot: "extra", label: "Additional documents", multiple: true },
    ],
  },
  sales_call: {
    id: "sales_call",
    label: "Sales call",
    description: "A conversation with a specific client.",
    schema: salesCallSchema,
    hasMinimum: (context, readyDocumentIds) =>
      filled(context.client).length > 0 &&
      (filled(context.product).length > 0 ||
        hasReadySlot(context, "proposal", readyDocumentIds)),
    researchHints: `${sourcePriority} Look for public experiences with this client or company, then their official pages and recent news.`,
    evaluationDimensions: [
      "discovery",
      "product understanding",
      "objection handling",
      "value communication",
      "pricing",
      "closing",
      "customer understanding",
    ],
    counterpartObjective: "Determine whether the user can handle the client's concerns and move toward the desired outcome.",
    behaviorNotes: "Stay on the client's problem, price, and alternatives.",
    fields: [
      { name: "client", label: "Client or company", placeholder: "Who you are selling to", multiline: false },
      { name: "product", label: "Product or service", placeholder: "What you are offering", multiline: true },
      { name: "pricing", label: "Pricing", placeholder: "The price you expect to defend", multiline: false },
      { name: "previousCommunication", label: "Previous communication", placeholder: "What has already been said", multiline: true },
      { name: "customerRequirements", label: "Customer requirements", placeholder: "What they said they need", multiline: true },
      { name: "participants", label: "Participants", placeholder: "Who will be on the call", multiline: true },
      { name: "desiredOutcome", label: "Desired outcome", placeholder: "The commitment you want", multiline: true },
      { name: "objections", label: "Known objections", placeholder: "Pushback you already expect", multiline: true },
    ],
    fileSlots: [
      { slot: "proposal", label: "Proposal", multiple: false },
      { slot: "supporting", label: "Supporting documents", multiple: true },
    ],
  },
  negotiation: {
    id: "negotiation",
    label: "Negotiation",
    description: "A negotiation with a known counterparty.",
    schema: negotiationSchema,
    hasMinimum: (context) =>
      filled(context.subject).length > 0 &&
      filled(context.desiredOutcome).length > 0,
    researchHints: `${sourcePriority} Research the counterparty only when they are a public organization. Do not invent private terms.`,
    evaluationDimensions: [
      "preparation",
      "clarity of objectives",
      "concessions",
      "counterparty understanding",
      "leverage",
      "communication",
      "outcome quality",
    ],
    counterpartObjective: "Determine how effectively the user protects their goals while responding to the counterparty.",
    behaviorNotes: "Know the user's desired outcome and minimum, and push against both.",
    fields: [
      { name: "subject", label: "What is being negotiated", placeholder: "The deal, offer, or disagreement", multiline: true },
      { name: "counterparty", label: "Counterparty", placeholder: "Who sits across from you", multiline: false },
      { name: "desiredOutcome", label: "Desired outcome", placeholder: "The result you want", multiline: true },
      { name: "minimumAcceptable", label: "Minimum acceptable outcome", placeholder: "The line you will not cross", multiline: true },
      { name: "constraints", label: "Known constraints", placeholder: "Limits on either side", multiline: true },
      { name: "counterpartyInformation", label: "Counterparty information", placeholder: "What you know about them", multiline: true },
      { name: "previousCommunication", label: "Previous communication", placeholder: "Offers and messages so far", multiline: true },
    ],
    fileSlots: [
      { slot: "proposal", label: "Proposal", multiple: false },
      { slot: "contract", label: "Contract", multiple: false },
      { slot: "supporting", label: "Supporting documents", multiple: true },
    ],
  },
  leadership: {
    id: "leadership",
    label: "Leadership conversation",
    description: "A conversation with people on your team.",
    schema: leadershipSchema,
    hasMinimum: (context) =>
      filled(context.situation).length > 0 &&
      filled(context.desiredOutcome).length > 0,
    researchHints: `${sourcePriority} Skip public research unless a named public organization is part of the situation.`,
    evaluationDimensions: [
      "clarity of the issue",
      "desired outcome",
      "relationship awareness",
      "constraints",
      "what was asked of the other person",
    ],
    counterpartObjective: "Determine whether the user can reach the desired outcome while staying clear about the people and the constraints.",
    behaviorNotes: "Respond as the person in the relationship, not as an interviewer.",
    fields: leadershipFields("leadership"),
    fileSlots: [
      { slot: "relevant", label: "Relevant documents", multiple: true },
    ],
  },
  difficult_conversation: {
    id: "difficult_conversation",
    label: "Difficult conversation",
    description: "A hard conversation with a specific person.",
    schema: difficultConversationSchema,
    hasMinimum: (context) =>
      filled(context.situation).length > 0 &&
      filled(context.desiredOutcome).length > 0,
    researchHints: `${sourcePriority} Skip public research unless a named public organization is part of the situation.`,
    evaluationDimensions: [
      "what happened",
      "the desired outcome",
      "constraints",
      "whether the user stayed specific",
    ],
    counterpartObjective: "Determine whether the user can say what happened, hold the desired outcome, and stay specific.",
    behaviorNotes: "Stay inside the relationship and the facts the user provided.",
    fields: leadershipFields("difficult"),
    fileSlots: [
      { slot: "relevant", label: "Relevant documents", multiple: true },
    ],
  },
  custom: {
    id: "custom",
    label: "Custom conversation",
    description: "A situation that does not fit the other types.",
    schema: customSchema,
    hasMinimum: (context) => filled(context.description).length > 0,
    researchHints: `${sourcePriority} Research only the public parts of the description. Derive the preparation from what the user wrote.`,
    evaluationDimensions: [],
    counterpartObjective: "Derive the counterpart objective from the user's description of the situation.",
    behaviorNotes: "Build the stance from the description, the desired outcome, and the people involved.",
    fields: [
      { name: "description", label: "Description of the situation", placeholder: "What conversation you are preparing for", multiline: true },
      { name: "desiredOutcome", label: "Desired outcome", placeholder: "What a good result looks like", multiline: true },
      { name: "people", label: "People involved", placeholder: "Who else is in the conversation", multiline: true },
      { name: "anythingElse", label: "Anything else", placeholder: "Context that does not fit above", multiline: true },
    ],
    fileSlots: [
      { slot: "extra", label: "Relevant documents", multiple: true },
    ],
  },
};

export function getPack(conversationType: string): PreparationPack | null {
  if (conversationTypes.includes(conversationType as ConversationType)) {
    return preparationPacks[conversationType as ConversationType];
  }
  return null;
}

export const followUpSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      field: z.string(),
    }),
  ),
});

export function limitFollowUps<T>(questions: T[]): T[] {
  return questions.slice(0, 3);
}
