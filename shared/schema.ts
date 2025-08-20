import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("analista"), // admin, analista, consulta
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Catálogo de itens
export const catalogItems = pgTable("catalog_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(), // OR, 6B, AD, etc.
  description: text("description").notNull(),
  brand: varchar("brand"),
  batch: varchar("batch").notNull(), // Lote obrigatório
  category: varchar("category"),
  unit: varchar("unit"), // unidade de medida
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pregões de amostras
export const sampleBiddings = pgTable("sample_biddings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  number: varchar("number").notNull().unique(), // Nº do pregão
  uasg: varchar("uasg").notNull(), // UASG
  agency: varchar("agency").notNull(), // Órgão
  sendDate: date("send_date"), // Data de envio
  trackingCode: varchar("tracking_code"), // Código de rastreio
  returnDate: date("return_date"), // Data de retorno
  willBeDeducted: boolean("will_be_deducted").default(false), // Será abatido
  status: varchar("status").default("em_andamento"), // em_andamento, aprovado, reprovado, encerrado
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens das amostras
export const sampleItems = pgTable("sample_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  biddingId: uuid("bidding_id").notNull().references(() => sampleBiddings.id, { onDelete: 'cascade' }),
  itemId: uuid("item_id").references(() => catalogItems.id),
  code: varchar("code"), // Se não estiver no catálogo
  description: text("description"), // Se não estiver no catálogo
  brand: varchar("brand"), // Se não estiver no catálogo
  batch: varchar("batch"), // Lote
  quantity: integer("quantity").notNull(),
  result: varchar("result"), // aprovado, reprovado, pendente
  reason: text("reason"), // Motivo se reprovado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pregões de processos (homologados)
export const processes = pgTable("processes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  number: varchar("number").notNull().unique(), // Nº do pregão
  contractNumber: varchar("contract_number").notNull().unique(), // Nº do contrato
  uasg: varchar("uasg").notNull(),
  agency: varchar("agency").notNull(),
  contractType: varchar("contract_type").notNull(), // registro_precos, compra_direta, dispensa, compra_direta_rp
  contractDate: date("contract_date"), // Data da ata/contrato
  validityMonths: integer("validity_months"), // Vigência em meses
  status: varchar("status").default("ativo"), // ativo, vencido, encerrado
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens arrematados do processo
export const processItems = pgTable("process_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: uuid("process_id").notNull().references(() => processes.id, { onDelete: 'cascade' }),
  itemId: uuid("item_id").references(() => catalogItems.id),
  code: varchar("code"), // Se não estiver no catálogo
  description: text("description"), // Se não estiver no catálogo
  brand: varchar("brand"), // Se não estiver no catálogo
  model: varchar("model"), // Modelo
  batch: varchar("batch"), // Lote
  awardedQuantity: integer("awarded_quantity").notNull(), // Quantidade arrematada
  committedQuantity: integer("committed_quantity").default(0), // Quantidade empenhada
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Empenhos
export const commitments = pgTable("commitments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: uuid("process_id").notNull().references(() => processes.id),
  number: varchar("number").notNull(), // Nº do empenho
  date: date("date").notNull(),
  agency: varchar("agency").notNull(), // Órgão empenhador
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Itens do empenho
export const commitmentItems = pgTable("commitment_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  commitmentId: uuid("commitment_id").notNull().references(() => commitments.id, { onDelete: 'cascade' }),
  processItemId: uuid("process_item_id").notNull().references(() => processItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relacionamentos de histórico inteligente
export const historyRelationships = pgTable("history_relationships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: uuid("item_id").notNull().references(() => catalogItems.id),
  relatedItemId: uuid("related_item_id").notNull().references(() => catalogItems.id),
  similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  createdAt: timestamp("created_at").defaultNow(),
});

// Predições ML
export const mlPredictions = pgTable("ml_predictions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleItemId: uuid("sample_item_id").references(() => sampleItems.id),
  processItemId: uuid("process_item_id").references(() => processItems.id),
  score: decimal("score", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  viable: boolean("viable").notNull(),
  modelVersion: varchar("model_version").default("1.0"),
  features: jsonb("features"), // Store input features used for prediction
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const sampleBiddingsRelations = relations(sampleBiddings, ({ many, one }) => ({
  items: many(sampleItems),
  createdByUser: one(users, {
    fields: [sampleBiddings.createdBy],
    references: [users.id],
  }),
}));

export const sampleItemsRelations = relations(sampleItems, ({ one }) => ({
  bidding: one(sampleBiddings, {
    fields: [sampleItems.biddingId],
    references: [sampleBiddings.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [sampleItems.itemId],
    references: [catalogItems.id],
  }),
  mlPrediction: one(mlPredictions, {
    fields: [sampleItems.id],
    references: [mlPredictions.sampleItemId],
  }),
}));

export const processesRelations = relations(processes, ({ many, one }) => ({
  items: many(processItems),
  commitments: many(commitments),
  createdByUser: one(users, {
    fields: [processes.createdBy],
    references: [users.id],
  }),
}));

export const processItemsRelations = relations(processItems, ({ one, many }) => ({
  process: one(processes, {
    fields: [processItems.processId],
    references: [processes.id],
  }),
  catalogItem: one(catalogItems, {
    fields: [processItems.itemId],
    references: [catalogItems.id],
  }),
  commitmentItems: many(commitmentItems),
  mlPrediction: one(mlPredictions, {
    fields: [processItems.id],
    references: [mlPredictions.processItemId],
  }),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  process: one(processes, {
    fields: [commitments.processId],
    references: [processes.id],
  }),
  items: many(commitmentItems),
  createdByUser: one(users, {
    fields: [commitments.createdBy],
    references: [users.id],
  }),
}));

export const commitmentItemsRelations = relations(commitmentItems, ({ one }) => ({
  commitment: one(commitments, {
    fields: [commitmentItems.commitmentId],
    references: [commitments.id],
  }),
  processItem: one(processItems, {
    fields: [commitmentItems.processItemId],
    references: [processItems.id],
  }),
}));

export const catalogItemsRelations = relations(catalogItems, ({ many }) => ({
  sampleItems: many(sampleItems),
  processItems: many(processItems),
  historyRelationships: many(historyRelationships, { relationName: "item" }),
  relatedHistoryRelationships: many(historyRelationships, { relationName: "relatedItem" }),
}));

export const historyRelationshipsRelations = relations(historyRelationships, ({ one }) => ({
  item: one(catalogItems, {
    fields: [historyRelationships.itemId],
    references: [catalogItems.id],
    relationName: "item",
  }),
  relatedItem: one(catalogItems, {
    fields: [historyRelationships.relatedItemId],
    references: [catalogItems.id],
    relationName: "relatedItem",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCatalogItemSchema = createInsertSchema(catalogItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSampleBiddingSchema = createInsertSchema(sampleBiddings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSampleItemSchema = createInsertSchema(sampleItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcessItemSchema = createInsertSchema(processItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommitmentSchema = createInsertSchema(commitments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommitmentItemSchema = createInsertSchema(commitmentItems).omit({
  id: true,
  createdAt: true,
});

export const insertHistoryRelationshipSchema = createInsertSchema(historyRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertMlPredictionSchema = createInsertSchema(mlPredictions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
export type SampleBidding = typeof sampleBiddings.$inferSelect;
export type InsertSampleBidding = z.infer<typeof insertSampleBiddingSchema>;
export type SampleItem = typeof sampleItems.$inferSelect;
export type InsertSampleItem = z.infer<typeof insertSampleItemSchema>;
export type Process = typeof processes.$inferSelect;
export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type ProcessItem = typeof processItems.$inferSelect;
export type InsertProcessItem = z.infer<typeof insertProcessItemSchema>;
export type Commitment = typeof commitments.$inferSelect;
export type InsertCommitment = z.infer<typeof insertCommitmentSchema>;
export type CommitmentItem = typeof commitmentItems.$inferSelect;
export type InsertCommitmentItem = z.infer<typeof insertCommitmentItemSchema>;
export type HistoryRelationship = typeof historyRelationships.$inferSelect;
export type InsertHistoryRelationship = z.infer<typeof insertHistoryRelationshipSchema>;
export type MlPrediction = typeof mlPredictions.$inferSelect;
export type InsertMlPrediction = z.infer<typeof insertMlPredictionSchema>;
