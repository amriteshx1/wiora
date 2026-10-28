import { nanoid } from "nanoid";

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

export const agents = pgTable("agents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  instructions: text("instructions").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetingStatus = pgEnum("meeting_status",[
  "upcoming",
  "active",
  "completed",
  "processing",
  "cancelled"
]);

export const meetings = pgTable("meetings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  status: meetingStatus("status").notNull().default("upcoming"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  transcriptUrl: text("transcript_url"),
  recordingUrl: text("recording_url"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const preparations = pgTable(
  "preparations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conversationType: text("conversation_type").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("draft"),
    processingStep: text("processing_step"),
    context: jsonb("context").notNull().default(sql`'{}'::jsonb`),
    situationModel: jsonb("situation_model"),
    situationVersion: integer("situation_version").notNull().default(1),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("preparations_user_id_idx").on(table.userId)],
);

export const preparationDocuments = pgTable("preparation_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  preparationId: text("preparation_id")
    .notNull()
    .references(() => preparations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  status: text("status").notNull().default("pending"),
  extractedText: text("extracted_text").notNull().default(""),
  reading: jsonb("reading"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const researchFindings = pgTable("research_findings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  preparationId: text("preparation_id")
    .notNull()
    .references(() => preparations.id, { onDelete: "cascade" }),
  statement: text("statement").notNull(),
  category: text("category").notNull(),
  sourceUrl: text("source_url"),
  sourceTitle: text("source_title"),
  query: text("query"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const simulationRuns = pgTable(
  "simulation_runs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    preparationId: text("preparation_id")
      .notNull()
      .references(() => preparations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    sourceWeaknessId: text("source_weakness_id"),
    sourceRunId: text("source_run_id"),
    drillStrategy: jsonb("drill_strategy"),
    situationVersion: integer("situation_version").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: text("status").notNull(),
    polarCheckoutId: text("polar_checkout_id"),
    polarOrderId: text("polar_order_id").unique(),
    paidAt: timestamp("paid_at"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    hardEndAt: timestamp("hard_end_at"),
    briefText: text("brief_text"),
    sessionState: jsonb("session_state"),
    transcriptUrl: text("transcript_url"),
    recordingUrl: text("recording_url"),
    report: jsonb("report"),
    counterpartName: text("counterpart_name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("simulation_runs_user_id_idx").on(table.userId),
    index("simulation_runs_status_idx").on(table.status),
    index("simulation_runs_polar_order_id_idx").on(table.polarOrderId),
  ],
);

export const sessionTurns = pgTable(
  "session_turns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    runId: text("run_id")
      .notNull()
      .references(() => simulationRuns.id, { onDelete: "cascade" }),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    startedAt: timestamp("started_at").notNull(),
  },
  (table) => [
    unique("session_turns_dedupe").on(
      table.runId,
      table.speaker,
      table.startedAt,
      table.text,
    ),
  ],
);
