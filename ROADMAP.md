# TenacitOS — Roadmap

*Dashboard for managing OpenClaw agents, cron jobs, files, memory, and more.*
*Lives at: `mission-control/` | Runs on port 3000 (systemd service)*

## What's Built

Everything checked below is implemented and has pages/API routes in the codebase.

- [x] **Dashboard** — Main overview page with metrics
- [x] **Activity Feed** — Real-time activity logging with stats (`/api/activities`)
- [x] **Cron Manager** — List, create, edit, delete, enable/disable jobs + weekly timeline + run now + run history
- [x] **File Browser** — Full workspace explorer with preview, upload, download, write, mkdir, delete
- [x] **Memory Browser** — View memory files with markdown preview + vector search (`/api/memory/search`)
- [x] **Sessions Viewer** — All sessions (main, cron, subagent, chat) with transcript viewer, token counts, model badges, filtering
- [x] **Notifications** — Bell dropdown with unread count, types (info/success/warning/error), mark read, delete
- [x] **3D Office** — Pixel art office with multiple themes (Habbo, Stardew, Zelda), animated characters, furniture
- [x] **Analytics** — Charts and stats page
- [x] **Cost Tracking** — Cost estimates page
- [x] **Skills Manager** — List installed skills, view SKILL.md details
- [x] **Terminal** — Send commands/messages to the agent
- [x] **System Monitor** — CPU/memory/services status
- [x] **Quick Actions** — One-click common operations
- [x] **Git Integration** — Git status/operations page
- [x] **Search** — Global search across the workspace
- [x] **Reports** — Report generation page
- [x] **Calendar** — Calendar view
- [x] **Auth** — Login/logout with password protection
- [x] **Weather Widget**

## Priorities — What's Next

### P0: Wire Up Real Data
Some pages exist but may use mock/placeholder data. The highest-value work is connecting them to real OpenClaw APIs.

- [ ] **Activity logger hook** — Auto-log every OpenClaw tool call to `/api/activities` (timestamp, type, description, status, duration, tokens)
- [ ] **Activity heatmap** — `ActivityHeatmap.tsx` component exists; wire it to real activity data (24x7 hour/day grid)
- [ ] **Cost tracking with real data** — Pull actual token usage per model, calculate costs, show daily/monthly totals
- [ ] **System monitor live** — Real CPU/memory/disk from the NUC, not just snapshots

### P1: Token Economics & Optimization
We spend real money on API calls. Visibility here saves dollars.

- [ ] **Token breakdown** — Input vs output vs cache tokens per model (Opus, Sonnet, MiniMax)
- [ ] **Model comparison** — "This week: $X on Opus, $Y on Sonnet" with trend lines
- [ ] **Monthly projection** — Based on current usage rate
- [ ] **Top 5 expensive tasks** — Which cron jobs / workflows consume the most

### P2: Sub-Agent Dashboard
We run subagents constantly. Zero visibility into them from TenacitOS currently.

- [ ] **Active sub-agents list** — Real-time: running, completed, failed
- [ ] **Task descriptions** — What each subagent is doing
- [ ] **Token consumption per subagent** — Which delegated tasks cost the most
- [ ] **Parent-child relationships** — Which main session spawned what

### P3: Smart Suggestions
The dashboard knows enough to give actionable advice.

- [ ] **Model routing suggestions** — "You used Opus for 12 simple tasks this week, Sonnet would save $X"
- [ ] **Cron health alerts** — "Cron job X has failed 3 times this week"
- [ ] **Usage pattern tips** — "Peak token usage at 2am, consider scheduling heavy tasks then"
- [ ] **Dismissible cards** — Apply or dismiss, learn from choices

### P4: Polish & UX
- [ ] **Cron builder visual** — Frequency picker (daily/weekly/monthly/custom) with preview of next 5 runs
- [ ] **Real-time updates** — WebSocket or SSE for live activity stream, "agent is working..." indicator
- [ ] **Notification integration** — Cron completions, subagent results, errors push to notification bell

## Ideas Parking Lot
*Cool but not prioritized. Revisit when the above is done.*

- Agent communication graph (message flow between main + subagents)
- Shareable weekly/monthly reports (PDF export)
- Integration status page (Twitter, email, etc. — connection health)
- Config editor with validation (risky but useful)

## Stack
| Component | Tech |
|-----------|------|
| Frontend | Next.js + App Router + React |
| Styling | Tailwind |
| Charts | Recharts |
| 3D | React Three Fiber (office) |
| Animations | Framer Motion |
| Storage | JSON files → SQLite (future) |
| Auth | Cookie-based login |

---
*Last updated: 2026-03-01*
