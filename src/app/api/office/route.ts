import { NextResponse } from "next/server";
import { readFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const AGENT_CONFIG = {
  main: { emoji: "🦝", color: "#ff6b35", name: "Bort", role: "Boss" },
  academic: {
    emoji: "🎓",
    color: "#4ade80",
    name: "Profe",
    role: "Teacher",
  },
  infra: {
    emoji: "🔧",
    color: "#f97316",
    name: "Infra",
    role: "DevOps",
  },
  studio: {
    emoji: "🎬",
    color: "#a855f7",
    name: "Studio",
    role: "Video Editor",
  },
  social: {
    emoji: "📱",
    color: "#ec4899",
    name: "Social",
    role: "Social Media",
  },
  linkedin: {
    emoji: "💼",
    color: "#0077b5",
    name: "LinkedIn Pro",
    role: "Professional",
  },
  devclaw: {
    emoji: "👨‍💻",
    color: "#8b5cf6",
    name: "DevClaw",
    role: "Developer",
  },
  freelance: {
    emoji: "👨‍💻",
    color: "#8b5cf6",
    name: "DevClaw",
    role: "Developer",
  },
};

interface AgentSession {
  agentId: string;
  sessionId: string;
  label?: string;
  lastActivity?: string;
  createdAt?: string;
}

async function getAgentStatusFromSessions(): Promise<
  Record<string, { isActive: boolean; currentTask: string; lastSeen: number }>
> {
  try {
    // Use the working OpenClaw CLI command
    const output = execSync('openclaw sessions --json --active 60', {
      timeout: 10000,
      encoding: 'utf-8',
    });

    const data = JSON.parse(output);
    const sessions = data.sessions || [];
    
    const agentStatus: Record<
      string,
      { isActive: boolean; currentTask: string; lastSeen: number }
    > = {};

    for (const session of sessions) {
      if (!session.agentId) continue;

      const lastActivity = session.updatedAt || 0;
      const now = Date.now();
      const minutesAgo = (now - lastActivity) / 1000 / 60;

      let status = "SLEEPING";
      let currentTask = "zzZ...";

      // Determine task based on session type
      if (session.kind === 'direct' && session.key.includes('subagent')) {
        currentTask = "Running subagent";
      } else if (session.kind === 'direct' && session.key.includes('cron')) {
        currentTask = "Running cron job";
      } else if (session.kind === 'group') {
        currentTask = "In chat session";
      } else {
        currentTask = "Agent active";
      }

      if (minutesAgo < 5) {
        status = "ACTIVE";
      } else if (minutesAgo < 30) {
        status = "IDLE";
        currentTask = "Recent activity";
      } else {
        status = "SLEEPING";
        currentTask = "zzZ...";
      }

      // Keep most recent activity per agent
      if (
        !agentStatus[session.agentId] ||
        lastActivity > agentStatus[session.agentId].lastSeen
      ) {
        agentStatus[session.agentId] = {
          isActive: status === "ACTIVE",
          currentTask: `${status}: ${currentTask}`,
          lastSeen: lastActivity,
        };
      }
    }

    return agentStatus;
  } catch (error) {
    console.warn("Failed to fetch sessions via CLI:", error);
    return {};
  }
}

function getAgentStatusFromFiles(
  agentId: string,
  workspace: string
): { isActive: boolean; currentTask: string; lastSeen: number } {
  try {
    const today = new Date().toISOString().split("T")[0];
    const memoryFile = join(workspace, "memory", `${today}.md`);

    // Check if file exists
    const stat = statSync(memoryFile);
    const lastSeen = stat.mtime.getTime();
    const minutesSinceUpdate = (Date.now() - lastSeen) / 1000 / 60;

    const content = readFileSync(memoryFile, "utf-8");
    const lines = content.trim().split("\n").filter((l) => l.trim());

    let currentTask = "Idle...";
    if (lines.length > 0) {
      // Get last meaningful line (skip timestamps)
      const lastLine = lines
        .slice(-10)
        .reverse()
        .find((l) => l.length > 20 && !l.match(/^#+\s/));

      if (lastLine) {
        currentTask = lastLine.replace(/^[-*]\s*/, "").slice(0, 100);
        if (lastLine.length > 100) currentTask += "...";
      }
    }

    // Determine status based on file modification time
    if (minutesSinceUpdate < 5) {
      return { isActive: true, currentTask: `ACTIVE: ${currentTask}`, lastSeen };
    } else if (minutesSinceUpdate < 30) {
      return { isActive: false, currentTask: `IDLE: ${currentTask}`, lastSeen };
    } else {
      return { isActive: false, currentTask: "SLEEPING: zzZ...", lastSeen };
    }
  } catch (error) {
    // No memory file or error reading
    return { isActive: false, currentTask: "SLEEPING: zzZ...", lastSeen: 0 };
  }
}

export async function GET() {
  try {
    const configPath = (process.env.OPENCLAW_DIR || "/root/.openclaw") + "/openclaw.json";
    const config = JSON.parse(readFileSync(configPath, "utf-8"));

    // Try CLI sessions first, fallback to file-based
    const sessionsStatus = await getAgentStatusFromSessions();

    // Support both explicit list and implicit single-agent setups
    const agentList: any[] = config.agents?.list || [];
    if (agentList.length === 0) {
      const mainWorkspace = (process.env.OPENCLAW_DIR || "/root/.openclaw") + "/workspace";
      agentList.push({
        id: "main",
        name: process.env.NEXT_PUBLIC_AGENT_NAME || "Main",
        workspace: mainWorkspace,
      });
    }

    const agents = agentList.map((agent: any) => {
      const agentInfo = AGENT_CONFIG[agent.id as keyof typeof AGENT_CONFIG] || {
        emoji: "🤖",
        color: "#666",
        name: agent.name || agent.id,
        role: "Agent",
      };

      // Get status from sessions, or fallback to files
      let status = sessionsStatus[agent.id];
      if (!status) {
        status = getAgentStatusFromFiles(agent.id, agent.workspace);
      }

      // Map freelance -> devclaw for canvas compatibility
      const canvasId = agent.id === "freelance" ? "devclaw" : agent.id;

      return {
        id: canvasId,
        name: agentInfo.name,
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        role: agentInfo.role,
        currentTask: status.currentTask,
        isActive: status.isActive,
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error getting office data:", error);
    return NextResponse.json(
      { error: "Failed to load office data" },
      { status: 500 }
    );
  }
}
