import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Database, ProcessedRecipe } from './types.js';
import { config } from './config.js';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

class Storage {
  private db: Low<Database>;

  constructor() {
    // Ensure data directory exists
    try {
      mkdirSync(dirname(config.dbPath), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const adapter = new JSONFile<Database>(config.dbPath);
    this.db = new Low<Database>(adapter, {
      processed: [],
      metadata: {
        lastProcessedBlock: 0,
        lastHealthCheck: Date.now(),
      },
    });
  }

  async init(): Promise<void> {
    await this.db.read();
  }

  async isProcessed(recipeId: number): Promise<boolean> {
    await this.db.read();
    return this.db.data.processed.some((r) => r.recipeId === recipeId);
  }

  async markProcessed(
    recipeId: number,
    txHash: string,
    blockNumber: number
  ): Promise<void> {
    await this.db.read();

    this.db.data.processed.push({
      recipeId,
      txHash,
      processedAt: Date.now(),
      blockNumber,
    });

    this.db.data.metadata.lastProcessedBlock = Math.max(
      this.db.data.metadata.lastProcessedBlock,
      blockNumber
    );

    await this.db.write();
  }

  async getProcessedCount(): Promise<number> {
    await this.db.read();
    return this.db.data.processed.length;
  }

  async getLastProcessedBlock(): Promise<number> {
    await this.db.read();
    return this.db.data.metadata.lastProcessedBlock;
  }

  async getProcessedRecipes(): Promise<number[]> {
    await this.db.read();
    return this.db.data.processed.map((r) => r.recipeId);
  }

  async cleanup(daysOld: number = 30): Promise<number> {
    await this.db.read();

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const originalCount = this.db.data.processed.length;

    this.db.data.processed = this.db.data.processed.filter(
      (r) => r.processedAt > cutoffTime
    );

    await this.db.write();

    return originalCount - this.db.data.processed.length;
  }

  async flush(): Promise<void> {
    await this.db.write();
  }
}

export const storage = new Storage();
