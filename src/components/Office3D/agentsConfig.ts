/**
 * Office 3D — Agent Configuration
 *
 * This file defines the visual layout of agents in the 3D office.
 * Names, emojis and roles are loaded at runtime from the OpenClaw API
 * (/api/agents → openclaw.json), so you only need to set positions and colors here.
 *
 * Agent IDs correspond to workspace directory suffixes:
 *   id: "main"     → workspace/          (main agent)
 *   id: "studio"   → workspace-studio/
 *   id: "infra"    → workspace-infra/
 *   etc.
 *
 * Add, remove or reposition agents to match your own OpenClaw setup.
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  position: [number, number, number]; // x, y, z
  color: string;
  role: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: "main",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Bort",
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🦝",
    position: [0, 0, 0], // Center — main desk
    color: "#FFCC00",
    role: "Main Agent",
  },
];

export const DEFAULT_AGENT_STATE: AgentState = {
  id: "unknown",
  status: "idle",
  currentTask: "Idle...",
  model: "sonnet",
  tokensPerHour: 0,
  tasksInQueue: 0,
  uptime: 0,
};

export type AgentStatus = "idle" | "working" | "thinking" | "error";

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string; // opus, sonnet, haiku
  tokensPerHour?: number;
  tasksInQueue?: number;
  uptime?: number; // days
}
