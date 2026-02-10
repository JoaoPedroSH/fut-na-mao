
import { db } from "./db";
import {
  players,
  matches,
  type InsertPlayer,
  type InsertMatch,
  type Player,
  type Match
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Players
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  // Matches
  getMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
}

export class DatabaseStorage implements IStorage {
  // Players
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players).orderBy(desc(players.createdAt));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.createdAt));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }
}

export const storage = new DatabaseStorage();
