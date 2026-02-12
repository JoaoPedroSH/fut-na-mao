
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameSessionId: integer("game_session_id").references(() => gameSessions.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  isGoalkeeper: boolean("is_goalkeeper").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  gameSessionId: integer("game_session_id").references(() => gameSessions.id, { onDelete: 'cascade' }),
  teamA: jsonb("team_a").$type<string[]>().notNull(),
  teamB: jsonb("team_b").$type<string[]>().notNull(),
  scoreA: integer("score_a").default(0),
  scoreB: integer("score_b").default(0),
  durationSeconds: integer("duration_seconds").notNull(),
  winner: text("winner"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  name: true,
  code: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  isActive: true,
  isGoalkeeper: true,
  gameSessionId: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({ 
  id: true, 
  createdAt: true 
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
