
import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  teamA: jsonb("team_a").$type<string[]>().notNull(), // Array of player names/ids
  teamB: jsonb("team_b").$type<string[]>().notNull(),
  scoreA: integer("score_a").default(0),
  scoreB: integer("score_b").default(0),
  durationSeconds: integer("duration_seconds").notNull(),
  winner: text("winner"), // 'A', 'B', 'DRAW'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  isActive: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({ 
  id: true, 
  createdAt: true 
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
