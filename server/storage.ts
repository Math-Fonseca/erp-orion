import {
  users,
  catalogItems,
  sampleBiddings,
  sampleItems,
  processes,
  processItems,
  commitments,
  commitmentItems,
  historyRelationships,
  mlPredictions,
  type User,
  type UpsertUser,
  type CatalogItem,
  type InsertCatalogItem,
  type SampleBidding,
  type InsertSampleBidding,
  type SampleItem,
  type InsertSampleItem,
  type Process,
  type InsertProcess,
  type ProcessItem,
  type InsertProcessItem,
  type Commitment,
  type InsertCommitment,
  type CommitmentItem,
  type InsertCommitmentItem,
  type HistoryRelationship,
  type InsertHistoryRelationship,
  type MlPrediction,
  type InsertMlPrediction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or, like, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Catalog operations
  getCatalogItems(): Promise<CatalogItem[]>;
  getCatalogItem(id: string): Promise<CatalogItem | undefined>;
  createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem>;
  updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem>;
  deleteCatalogItem(id: string): Promise<void>;
  searchCatalogItems(query: string): Promise<CatalogItem[]>;
  
  // Sample bidding operations
  getSampleBiddings(): Promise<SampleBidding[]>;
  getSampleBidding(id: string): Promise<SampleBidding | undefined>;
  createSampleBidding(bidding: InsertSampleBidding): Promise<SampleBidding>;
  updateSampleBidding(id: string, bidding: Partial<InsertSampleBidding>): Promise<SampleBidding>;
  deleteSampleBidding(id: string): Promise<void>;
  
  // Sample item operations
  getSampleItems(biddingId: string): Promise<SampleItem[]>;
  getSampleItem(id: string): Promise<SampleItem | undefined>;
  createSampleItem(item: InsertSampleItem): Promise<SampleItem>;
  updateSampleItem(id: string, item: Partial<InsertSampleItem>): Promise<SampleItem>;
  deleteSampleItem(id: string): Promise<void>;
  
  // Process operations
  getProcesses(): Promise<Process[]>;
  getProcess(id: string): Promise<Process | undefined>;
  createProcess(process: InsertProcess): Promise<Process>;
  updateProcess(id: string, process: Partial<InsertProcess>): Promise<Process>;
  deleteProcess(id: string): Promise<void>;
  getExpiringProcesses(days: number): Promise<Process[]>;
  
  // Process item operations
  getProcessItems(processId: string): Promise<ProcessItem[]>;
  getProcessItem(id: string): Promise<ProcessItem | undefined>;
  createProcessItem(item: InsertProcessItem): Promise<ProcessItem>;
  updateProcessItem(id: string, item: Partial<InsertProcessItem>): Promise<ProcessItem>;
  deleteProcessItem(id: string): Promise<void>;
  
  // Commitment operations
  getCommitments(processId?: string): Promise<Commitment[]>;
  getCommitment(id: string): Promise<Commitment | undefined>;
  createCommitment(commitment: InsertCommitment): Promise<Commitment>;
  updateCommitment(id: string, commitment: Partial<InsertCommitment>): Promise<Commitment>;
  deleteCommitment(id: string): Promise<void>;
  
  // Commitment item operations
  getCommitmentItems(commitmentId: string): Promise<CommitmentItem[]>;
  createCommitmentItem(item: InsertCommitmentItem): Promise<CommitmentItem>;
  updateCommitmentItem(id: string, item: Partial<InsertCommitmentItem>): Promise<CommitmentItem>;
  deleteCommitmentItem(id: string): Promise<void>;
  
  // History and ML operations
  getHistoryRelationships(itemId: string): Promise<HistoryRelationship[]>;
  createHistoryRelationship(relationship: InsertHistoryRelationship): Promise<HistoryRelationship>;
  getMlPrediction(sampleItemId?: string, processItemId?: string): Promise<MlPrediction | undefined>;
  createMlPrediction(prediction: InsertMlPrediction): Promise<MlPrediction>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    ongoingSamples: number;
    approvalRate: number;
    activeProcesses: number;
    commitmentPercentage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Catalog operations
  async getCatalogItems(): Promise<CatalogItem[]> {
    return await db.select().from(catalogItems).orderBy(asc(catalogItems.code));
  }

  async getCatalogItem(id: string): Promise<CatalogItem | undefined> {
    const [item] = await db.select().from(catalogItems).where(eq(catalogItems.id, id));
    return item;
  }

  async createCatalogItem(item: InsertCatalogItem): Promise<CatalogItem> {
    const [created] = await db.insert(catalogItems).values(item).returning();
    return created;
  }

  async updateCatalogItem(id: string, item: Partial<InsertCatalogItem>): Promise<CatalogItem> {
    const [updated] = await db
      .update(catalogItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(catalogItems.id, id))
      .returning();
    return updated;
  }

  async deleteCatalogItem(id: string): Promise<void> {
    await db.delete(catalogItems).where(eq(catalogItems.id, id));
  }

  async searchCatalogItems(query: string): Promise<CatalogItem[]> {
    return await db
      .select()
      .from(catalogItems)
      .where(
        or(
          like(catalogItems.code, `%${query}%`),
          like(catalogItems.description, `%${query}%`),
          like(catalogItems.brand, `%${query}%`)
        )
      )
      .orderBy(asc(catalogItems.code));
  }

  // Sample bidding operations
  async getSampleBiddings(): Promise<SampleBidding[]> {
    return await db
      .select()
      .from(sampleBiddings)
      .orderBy(desc(sampleBiddings.createdAt));
  }

  async getSampleBidding(id: string): Promise<SampleBidding | undefined> {
    const [bidding] = await db.select().from(sampleBiddings).where(eq(sampleBiddings.id, id));
    return bidding;
  }

  async createSampleBidding(bidding: InsertSampleBidding): Promise<SampleBidding> {
    const [created] = await db.insert(sampleBiddings).values(bidding).returning();
    return created;
  }

  async updateSampleBidding(id: string, bidding: Partial<InsertSampleBidding>): Promise<SampleBidding> {
    const [updated] = await db
      .update(sampleBiddings)
      .set({ ...bidding, updatedAt: new Date() })
      .where(eq(sampleBiddings.id, id))
      .returning();
    return updated;
  }

  async deleteSampleBidding(id: string): Promise<void> {
    await db.delete(sampleBiddings).where(eq(sampleBiddings.id, id));
  }

  // Sample item operations
  async getSampleItems(biddingId: string): Promise<SampleItem[]> {
    return await db
      .select()
      .from(sampleItems)
      .where(eq(sampleItems.biddingId, biddingId))
      .orderBy(asc(sampleItems.createdAt));
  }

  async getSampleItem(id: string): Promise<SampleItem | undefined> {
    const [item] = await db.select().from(sampleItems).where(eq(sampleItems.id, id));
    return item;
  }

  async createSampleItem(item: InsertSampleItem): Promise<SampleItem> {
    const [created] = await db.insert(sampleItems).values(item).returning();
    return created;
  }

  async updateSampleItem(id: string, item: Partial<InsertSampleItem>): Promise<SampleItem> {
    const [updated] = await db
      .update(sampleItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(sampleItems.id, id))
      .returning();
    return updated;
  }

  async deleteSampleItem(id: string): Promise<void> {
    await db.delete(sampleItems).where(eq(sampleItems.id, id));
  }

  // Process operations
  async getProcesses(): Promise<Process[]> {
    return await db
      .select()
      .from(processes)
      .orderBy(desc(processes.createdAt));
  }

  async getProcess(id: string): Promise<Process | undefined> {
    const [process] = await db.select().from(processes).where(eq(processes.id, id));
    return process;
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    const [created] = await db.insert(processes).values(process).returning();
    return created;
  }

  async updateProcess(id: string, process: Partial<InsertProcess>): Promise<Process> {
    const [updated] = await db
      .update(processes)
      .set({ ...process, updatedAt: new Date() })
      .where(eq(processes.id, id))
      .returning();
    return updated;
  }

  async deleteProcess(id: string): Promise<void> {
    await db.delete(processes).where(eq(processes.id, id));
  }

  async getExpiringProcesses(days: number): Promise<Process[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return await db
      .select()
      .from(processes)
      .where(
        and(
          eq(processes.status, 'ativo'),
          lte(
            sql`${processes.contractDate} + INTERVAL '1 month' * ${processes.validityMonths}`,
            cutoffDate
          )
        )
      )
      .orderBy(asc(sql`${processes.contractDate} + INTERVAL '1 month' * ${processes.validityMonths}`));
  }

  // Process item operations
  async getProcessItems(processId: string): Promise<ProcessItem[]> {
    return await db
      .select()
      .from(processItems)
      .where(eq(processItems.processId, processId))
      .orderBy(asc(processItems.createdAt));
  }

  async getProcessItem(id: string): Promise<ProcessItem | undefined> {
    const [item] = await db.select().from(processItems).where(eq(processItems.id, id));
    return item;
  }

  async createProcessItem(item: InsertProcessItem): Promise<ProcessItem> {
    const [created] = await db.insert(processItems).values(item).returning();
    return created;
  }

  async updateProcessItem(id: string, item: Partial<InsertProcessItem>): Promise<ProcessItem> {
    const [updated] = await db
      .update(processItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(processItems.id, id))
      .returning();
    return updated;
  }

  async deleteProcessItem(id: string): Promise<void> {
    await db.delete(processItems).where(eq(processItems.id, id));
  }

  // Commitment operations
  async getCommitments(processId?: string): Promise<Commitment[]> {
    const query = db.select().from(commitments);
    
    if (processId) {
      return await query
        .where(eq(commitments.processId, processId))
        .orderBy(desc(commitments.date));
    }
    
    return await query.orderBy(desc(commitments.date));
  }

  async getCommitment(id: string): Promise<Commitment | undefined> {
    const [commitment] = await db.select().from(commitments).where(eq(commitments.id, id));
    return commitment;
  }

  async createCommitment(commitment: InsertCommitment): Promise<Commitment> {
    const [created] = await db.insert(commitments).values(commitment).returning();
    return created;
  }

  async updateCommitment(id: string, commitment: Partial<InsertCommitment>): Promise<Commitment> {
    const [updated] = await db
      .update(commitments)
      .set({ ...commitment, updatedAt: new Date() })
      .where(eq(commitments.id, id))
      .returning();
    return updated;
  }

  async deleteCommitment(id: string): Promise<void> {
    await db.delete(commitments).where(eq(commitments.id, id));
  }

  // Commitment item operations
  async getCommitmentItems(commitmentId: string): Promise<CommitmentItem[]> {
    return await db
      .select()
      .from(commitmentItems)
      .where(eq(commitmentItems.commitmentId, commitmentId))
      .orderBy(asc(commitmentItems.createdAt));
  }

  async createCommitmentItem(item: InsertCommitmentItem): Promise<CommitmentItem> {
    const [created] = await db.insert(commitmentItems).values(item).returning();
    return created;
  }

  async updateCommitmentItem(id: string, item: Partial<InsertCommitmentItem>): Promise<CommitmentItem> {
    const [updated] = await db
      .update(commitmentItems)
      .set(item)
      .where(eq(commitmentItems.id, id))
      .returning();
    return updated;
  }

  async deleteCommitmentItem(id: string): Promise<void> {
    await db.delete(commitmentItems).where(eq(commitmentItems.id, id));
  }

  // History and ML operations
  async getHistoryRelationships(itemId: string): Promise<HistoryRelationship[]> {
    return await db
      .select()
      .from(historyRelationships)
      .where(eq(historyRelationships.itemId, itemId))
      .orderBy(desc(historyRelationships.similarityScore));
  }

  async createHistoryRelationship(relationship: InsertHistoryRelationship): Promise<HistoryRelationship> {
    const [created] = await db.insert(historyRelationships).values(relationship).returning();
    return created;
  }

  async getMlPrediction(sampleItemId?: string, processItemId?: string): Promise<MlPrediction | undefined> {
    if (sampleItemId) {
      const [prediction] = await db
        .select()
        .from(mlPredictions)
        .where(eq(mlPredictions.sampleItemId, sampleItemId));
      return prediction;
    }
    
    if (processItemId) {
      const [prediction] = await db
        .select()
        .from(mlPredictions)
        .where(eq(mlPredictions.processItemId, processItemId));
      return prediction;
    }
    
    return undefined;
  }

  async createMlPrediction(prediction: InsertMlPrediction): Promise<MlPrediction> {
    const [created] = await db.insert(mlPredictions).values(prediction).returning();
    return created;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    ongoingSamples: number;
    approvalRate: number;
    activeProcesses: number;
    commitmentPercentage: number;
  }> {
    // Count ongoing samples
    const [ongoingSamplesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sampleBiddings)
      .where(eq(sampleBiddings.status, 'em_andamento'));

    // Calculate approval rate
    const [totalSamplesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sampleItems)
      .where(sql`${sampleItems.result} IS NOT NULL`);

    const [approvedSamplesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sampleItems)
      .where(eq(sampleItems.result, 'aprovado'));

    // Count active processes
    const [activeProcessesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(processes)
      .where(eq(processes.status, 'ativo'));

    // Calculate commitment percentage
    const [totalValueResult] = await db
      .select({ 
        totalAwarded: sql<number>`sum(${processItems.awardedQuantity} * ${processItems.unitPrice})`,
        totalCommitted: sql<number>`sum(${processItems.committedQuantity} * ${processItems.unitPrice})`
      })
      .from(processItems)
      .innerJoin(processes, eq(processItems.processId, processes.id))
      .where(eq(processes.status, 'ativo'));

    const ongoingSamples = ongoingSamplesResult?.count || 0;
    const approvalRate = totalSamplesResult?.count > 0 
      ? Math.round(((approvedSamplesResult?.count || 0) / totalSamplesResult.count) * 100)
      : 0;
    const activeProcesses = activeProcessesResult?.count || 0;
    const commitmentPercentage = totalValueResult?.totalAwarded > 0
      ? Math.round(((totalValueResult?.totalCommitted || 0) / totalValueResult.totalAwarded) * 100)
      : 0;

    return {
      ongoingSamples,
      approvalRate,
      activeProcesses,
      commitmentPercentage,
    };
  }
}

export const storage = new DatabaseStorage();
