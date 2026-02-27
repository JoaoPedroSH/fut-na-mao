
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Sessions
  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      // Ensure we always create a new one with a unique code if requested
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.sessions.get.path, async (req, res) => {
    const session = await storage.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  });

  app.delete(api.sessions.delete.path, async (req, res) => {
    await storage.deleteSession(Number(req.params.id));
    res.status(204).send();
  });

  // Players
  app.get(api.players.list.path, async (req, res) => {
    const players = await storage.getPlayers(Number(req.params.sessionId));
    res.json(players);
  });

  app.post(api.players.create.path, async (req, res) => {
    try {
      const input = api.players.create.input.parse(req.body);
      const player = await storage.createPlayer({ ...input, gameSessionId: Number(req.params.sessionId) });
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.players.delete.path, async (req, res) => {
    await storage.deletePlayer(Number(req.params.id));
    res.status(204).send();
  });

  // Matches
  app.get(api.matches.list.path, async (req, res) => {
    const matches = await storage.getMatches(Number(req.params.sessionId));
    res.json(matches);
  });

  app.post(api.matches.create.path, async (req, res) => {
    try {
      const input = api.matches.create.input.parse(req.body);
      const match = await storage.createMatch({ ...input, gameSessionId: Number(req.params.sessionId) });
      res.status(201).json(match);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
