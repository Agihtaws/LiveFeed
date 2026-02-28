import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import type { Feed, RegisterFeedPayload, FeedStatus } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../../data/feeds.json");
const TEMP_FILE = DATA_FILE + ".tmp";

async function atomicWrite(filePath: string, tempPath: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(tempPath, data, "utf-8");
  await fs.rename(tempPath, filePath);
}

export class FeedRegistry {
  private feeds: Map<string, Feed> = new Map();
  private ready = false;

  async init(): Promise<void> {
    await this.load();
    this.ready = true;
  }

  private assertReady(): void {
    if (!this.ready) throw new Error("FeedRegistry not initialized — call await registry.init() first");
  }

  private async load(): Promise<void> {
    try {
      await fs.unlink(TEMP_FILE).catch(() => {});
      const raw = await fs.readFile(DATA_FILE, "utf-8");
      const arr = JSON.parse(raw) as Feed[];
      this.feeds = new Map(arr.map((f) => [f.id, f]));
      console.log(`[registry] loaded ${this.feeds.size} feed(s) from disk`);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn("[registry] could not parse feeds.json — starting empty", err);
      }
      this.feeds = new Map();
    }
  }

  private async save(): Promise<void> {
    const arr = [...this.feeds.values()];
    const data = JSON.stringify(arr, null, 2);
    await atomicWrite(DATA_FILE, TEMP_FILE, data);
  }

  async register(payload: RegisterFeedPayload): Promise<Feed> {
    this.assertReady();
    const feed: Feed = {
      id: uuidv4(),
      ...payload,
      createdAt: new Date().toISOString(),
      callCount: 0,
      totalEarnedAtomic: 0,
      avgLatencyMs: 0,
      lastCalledAt: null,
      status: "active",
    };
    this.feeds.set(feed.id, feed);
    await this.save();
    return feed;
  }

  getAll(): Feed[] {
    this.assertReady();
    return [...this.feeds.values()];
  }

  getById(id: string): Feed | undefined {
    this.assertReady();
    return this.feeds.get(id);
  }

  getByProvider(address: string): Feed[] {
    return this.getAll().filter(
      (f) => f.providerAddress.toLowerCase() === address.toLowerCase(),
    );
  }

  getByCategory(category: string): Feed[] {
    return this.getAll().filter((f) => f.category === category);
  }

  async updateStats(id: string, latencyMs: number, earnedAtomic: number): Promise<void> {
    this.assertReady();
    const feed = this.feeds.get(id);
    if (!feed) return;

    const prevTotal = feed.avgLatencyMs * feed.callCount;
    feed.callCount += 1;
    feed.totalEarnedAtomic += earnedAtomic;
    feed.avgLatencyMs = Math.round((prevTotal + latencyMs) / feed.callCount);
    feed.lastCalledAt = new Date().toISOString();

    await this.save();
  }

  async setStatus(id: string, status: FeedStatus): Promise<Feed | undefined> {
    this.assertReady();
    const feed = this.feeds.get(id);
    if (!feed) return undefined;
    feed.status = status;
    await this.save();
    return feed;
  }

  async delete(id: string): Promise<boolean> {
    this.assertReady();
    const existed = this.feeds.has(id);
    this.feeds.delete(id);
    await this.save();
    return existed;
  }

  categoryCounts(): Record<string, number> {
    const all = this.getAll();
    return {
      finance: all.filter((f) => f.category === "finance").length,
      sports: all.filter((f) => f.category === "sports").length,
      weather: all.filter((f) => f.category === "weather").length,
      custom: all.filter((f) => f.category === "custom").length,
    };
  }
}

export const registry = new FeedRegistry();