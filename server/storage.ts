
import { db } from "./db";
import {
  players,
  matches,
  gameSessions,
  type InsertPlayer,
  type InsertMatch,
  type Player,
  type Match,
  type GameSession,
  type InsertGameSession
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Sessions
  createSession(session: InsertGameSession): Promise<GameSession>;
  getSessionByCode(code: string): Promise<GameSession | undefined>;
  deleteSession(id: number): Promise<void>;

  // Players
  getPlayers(sessionId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  deletePlayer(id: number): Promise<void>;

  // Matches
  getMatches(sessionId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
}

export class DatabaseStorage implements IStorage {
  // Sessions
  async createSession(session: InsertGameSession): Promise<GameSession> {
    const [newSession] = await db.insert(gameSessions).values(session).returning();
    return newSession;
  }
  async getSessionByCode(code: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.code, code));
    return session;
  }
  async deleteSession(id: number): Promise<void> {
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  }

  // Players
  async getPlayers(sessionId: number): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.gameSessionId, sessionId)).orderBy(desc(players.createdAt));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [newPlayer] = await db.insert(players).values(player).returning();
    return newPlayer;
  }

  async deletePlayer(id: number): Promise<void> {
    await db.delete(players).where(eq(players.id, id));
  }

  // Matches
  async getMatches(sessionId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.gameSessionId, sessionId)).orderBy(desc(matches.createdAt));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }
}

export const storage = new DatabaseStorage();
