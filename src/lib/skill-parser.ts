import fs from 'fs';
import path from 'path';

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  source: 'workspace' | 'system';
  homepage?: string;
  emoji?: string;
  fileCount: number;
  fullContent: string;
  files: string[];
  agents: string[]; // which agents/workspaces have this skill
}

interface FrontMatter {
  name?: string;
  description?: string;
  homepage?: string;
  metadata?: {
    openclaw?: {
      emoji?: string;
    };
  };
}

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/home/ahodson/.openclaw';
const SYSTEM_SKILLS_PATH = '/home/ahodson/.npm-global/lib/node_modules/openclaw/skills';
const WORKSPACE_SKILLS_PATH = path.join(OPENCLAW_DIR, 'workspace', 'skills');

/**
 * Parse SKILL.md front matter (YAML between --- delimiters)
 */
function parseFrontMatter(content: string): { frontMatter: FrontMatter; body: string } {
  const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  
  if (!frontMatterMatch) {
    return { frontMatter: {}, body: content };
  }

  const yamlContent = frontMatterMatch[1];
  const body = frontMatterMatch[2];
  
  const frontMatter: FrontMatter = {};
  
  const nameMatch = yamlContent.match(/^name:\s*(.+)$/m);
  if (nameMatch) frontMatter.name = nameMatch[1].trim();
  
  const descMatch = yamlContent.match(/^description:\s*(.+)$/m);
  if (descMatch) frontMatter.description = descMatch[1].trim();
  
  const homepageMatch = yamlContent.match(/^homepage:\s*(.+)$/m);
  if (homepageMatch) frontMatter.homepage = homepageMatch[1].trim();
  
  const emojiMatch = yamlContent.match(/"emoji":\s*"([^"]+)"/);
  if (emojiMatch) {
    frontMatter.metadata = { openclaw: { emoji: emojiMatch[1] } };
  }
  
  return { frontMatter, body };
}

/**
 * Extract first paragraph as description if no front matter description
 */
function extractFirstParagraph(body: string): string {
  const lines = body.split('\n');
  let inParagraph = false;
  let paragraph = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('#')) {
      if (inParagraph) break;
      continue;
    }
    
    if (!trimmed && !inParagraph) continue;
    
    if (trimmed && !inParagraph) {
      inParagraph = true;
      paragraph = trimmed;
      continue;
    }
    
    if (trimmed && inParagraph) {
      paragraph += ' ' + trimmed;
      continue;
    }
    
    if (!trimmed && inParagraph) break;
  }
  
  return paragraph || 'No description available';
}

/**
 * Count files in a skill folder (excluding hidden files)
 */
function countFiles(skillPath: string): { count: number; files: string[] } {
  try {
    const files: string[] = [];
    
    function scanDir(dir: string, prefix: string = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), relativePath);
        } else {
          files.push(relativePath);
        }
      }
    }
    
    scanDir(skillPath);
    return { count: files.length, files };
  } catch {
    return { count: 0, files: [] };
  }
}

/**
 * Parse a single skill from its directory
 */
export function parseSkill(skillPath: string, skillName: string, source: 'workspace' | 'system', agents: string[] = []): SkillInfo | null {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const { frontMatter, body } = parseFrontMatter(content);
    const { count, files } = countFiles(skillPath);
    
    return {
      id: skillName,
      name: frontMatter.name || skillName,
      description: frontMatter.description || extractFirstParagraph(body),
      location: skillPath,
      source,
      homepage: frontMatter.homepage,
      emoji: frontMatter.metadata?.openclaw?.emoji,
      fileCount: count,
      fullContent: content,
      files,
      agents,
    };
  } catch {
    return null;
  }
}

/**
 * Build a map of skill-name -> [agentId] by scanning workspace skill dirs
 * For single-agent setups, this will map skills to ['main']
 */
function buildAgentSkillMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();

  // For single-agent setup, just check the main workspace skills directory
  try {
    if (fs.existsSync(WORKSPACE_SKILLS_PATH)) {
      const skillDirs = fs.readdirSync(WORKSPACE_SKILLS_PATH, { withFileTypes: true });
      for (const d of skillDirs) {
        if (d.isDirectory()) {
          map.set(d.name, ['main']);
        }
      }
    }
  } catch (error) {
    console.warn('Error scanning workspace skills:', error);
  }

  return map;
}

/**
 * Scan all skills from both system and workspace directories
 */
export function scanAllSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];
  
  try {
    const agentSkillMap = buildAgentSkillMap();
    
    // Scan system skills
    if (fs.existsSync(SYSTEM_SKILLS_PATH)) {
      const systemSkillDirs = fs.readdirSync(SYSTEM_SKILLS_PATH, { withFileTypes: true });
      for (const dir of systemSkillDirs) {
        if (dir.isDirectory()) {
          const skillPath = path.join(SYSTEM_SKILLS_PATH, dir.name);
          const skill = parseSkill(skillPath, dir.name, 'system', []);
          if (skill) {
            skills.push(skill);
          }
        }
      }
    }
    
    // Scan workspace skills
    if (fs.existsSync(WORKSPACE_SKILLS_PATH)) {
      const workspaceSkillDirs = fs.readdirSync(WORKSPACE_SKILLS_PATH, { withFileTypes: true });
      for (const dir of workspaceSkillDirs) {
        if (dir.isDirectory()) {
          const skillPath = path.join(WORKSPACE_SKILLS_PATH, dir.name);
          const agents = agentSkillMap.get(dir.name) || ['main'];
          const skill = parseSkill(skillPath, dir.name, 'workspace', agents);
          if (skill) {
            skills.push(skill);
          }
        }
      }
    }
    
    // Sort by source (workspace first), then name
    skills.sort((a, b) => {
      if (a.source !== b.source) {
        return a.source === 'workspace' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
  } catch (error) {
    console.error('Error scanning skills:', error);
  }
  
  return skills;
}