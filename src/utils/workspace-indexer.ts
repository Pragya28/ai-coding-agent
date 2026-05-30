import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  createIgnoreMatcher,
  DEFAULT_IGNORED,
} from "./ignore-patterns/ignore-patterns";

const INDEX_DIR = path.resolve(".agent-index");
const MAX_INDEX_AGE_DAYS = 7;
const MAX_COMMITS_SINCE_INDEX = 20;
const CLEANUP_AGE_DAYS = 15;

export interface WorkspaceIndex {
  workspace: string;
  generated: string;
  commitHash: string;
  fileCount: number;
  folderCount: number;
  ignored: string[];
  tree: Record<string, unknown>;
}

// ---- Utilities ----

function workspaceHash(workspacePath: string): string {
  return crypto
    .createHash("md5")
    .update(workspacePath)
    .digest("hex")
    .slice(0, 8);
}

function indexFilePath(workspacePath: string): string {
  return path.join(INDEX_DIR, `${workspaceHash(workspacePath)}.json`);
}

function ensureIndexDir() {
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
  }
}

// ---- Git utilities ----

function getCurrentCommitHash(workspacePath: string): string {
  try {
    const { execSync } = require("child_process");
    return execSync("git rev-parse HEAD", {
      cwd: workspacePath,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function getCommitsSince(workspacePath: string, since: string): number {
  try {
    const { execSync } = require("child_process");
    const output = execSync(`git rev-list ${since}..HEAD --count`, {
      cwd: workspacePath,
      encoding: "utf-8",
    }).trim();
    return parseInt(output, 10) || 0;
  } catch {
    return 0;
  }
}

// ---- Index staleness ----

function isIndexStale(
  index: WorkspaceIndex,
  workspacePath: string,
  forceReindex: boolean,
): { stale: boolean; reason: string } {
  if (forceReindex) {
    return { stale: true, reason: "--reindex flag" };
  }

  // Check age
  const generated = new Date(index.generated);
  const ageMs = Date.now() - generated.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > MAX_INDEX_AGE_DAYS) {
    return {
      stale: true,
      reason: `index older than ${MAX_INDEX_AGE_DAYS} days`,
    };
  }

  // Check commits
  if (index.commitHash !== "unknown") {
    const commitsSince = getCommitsSince(workspacePath, index.commitHash);
    if (commitsSince >= MAX_COMMITS_SINCE_INDEX) {
      return {
        stale: true,
        reason: `${commitsSince} commits since last index`,
      };
    }
  }

  return { stale: false, reason: "fresh" };
}

// ---- Cleanup old indexes ----

function cleanupOldIndexes() {
  if (!fs.existsSync(INDEX_DIR)) return;

  const files = fs.readdirSync(INDEX_DIR);
  const cutoff = Date.now() - CLEANUP_AGE_DAYS * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = path.join(INDEX_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
    }
  }
}

// ---- Tree builder ----

function buildTree(
  dir: string,
  workspacePath: string,
  ig: ReturnType<typeof createIgnoreMatcher>,
  stats: { files: number; folders: number },
): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(workspacePath, fullPath);

    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      stats.folders++;
      const subtree = buildTree(fullPath, workspacePath, ig, stats);
      tree[entry.name] = subtree;
    } else {
      stats.files++;
      // Store files as array under parent
      if (!Array.isArray(tree["__files__"])) {
        tree["__files__"] = [];
      }
      (tree["__files__"] as string[]).push(entry.name);
    }
  }

  return tree;
}

// ---- Tree renderer ----

export function renderTree(
  tree: Record<string, unknown>,
  indent: string = "",
): string {
  const lines: string[] = [];
  const files = tree["__files__"] as string[] | undefined;
  const dirs = Object.keys(tree).filter((k) => k !== "__files__");

  for (const dir of dirs.sort()) {
    lines.push(`${indent}📁 ${dir}/`);
    lines.push(renderTree(tree[dir] as Record<string, unknown>, indent + "  "));
  }

  if (files) {
    for (const file of files.sort()) {
      lines.push(`${indent}📄 ${file}`);
    }
  }

  return lines.join("\n");
}

// ---- Flat file list for system prompt ----

export function flatFileList(
  tree: Record<string, unknown>,
  prefix: string = "",
): string[] {
  const files: string[] = [];
  const fileList = tree["__files__"] as string[] | undefined;
  const dirs = Object.keys(tree).filter((k) => k !== "__files__");

  for (const dir of dirs.sort()) {
    files.push(
      ...flatFileList(
        tree[dir] as Record<string, unknown>,
        prefix ? `${prefix}/${dir}` : dir,
      ),
    );
  }

  if (fileList) {
    for (const file of fileList.sort()) {
      files.push(prefix ? `${prefix}/${file}` : file);
    }
  }

  return files;
}

// ---- Main export ----

export async function loadOrBuildIndex(
  workspacePath: string,
  forceReindex: boolean = false,
): Promise<{
  index: WorkspaceIndex;
  fromCache: boolean;
  staleReason?: string;
}> {
  ensureIndexDir();
  cleanupOldIndexes();

  const indexPath = indexFilePath(workspacePath);

  // Try loading existing index
  if (fs.existsSync(indexPath) && !forceReindex) {
    try {
      const raw = fs.readFileSync(indexPath, "utf-8");
      const existing = JSON.parse(raw) as WorkspaceIndex;
      const { stale, reason } = isIndexStale(existing, workspacePath, false);

      if (!stale) {
        return { index: existing, fromCache: true };
      } else {
        // Rebuild with stale reason
        const index = await buildIndex(workspacePath);
        return { index, fromCache: false, staleReason: reason };
      }
    } catch {
      // Corrupted index — rebuild
    }
  }

  const index = await buildIndex(workspacePath);
  return {
    index,
    fromCache: false,
    staleReason: forceReindex ? "--reindex flag" : "no cache found",
  };
}

async function buildIndex(workspacePath: string): Promise<WorkspaceIndex> {
  const ig = createIgnoreMatcher(workspacePath);
  const stats = { files: 0, folders: 0 };
  const tree = buildTree(workspacePath, workspacePath, ig, stats);
  const commitHash = getCurrentCommitHash(workspacePath);

  const index: WorkspaceIndex = {
    workspace: workspacePath,
    generated: new Date().toISOString(),
    commitHash,
    fileCount: stats.files,
    folderCount: stats.folders,
    ignored: DEFAULT_IGNORED,
    tree,
  };

  // Save to cache
  const indexPath = indexFilePath(workspacePath);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");

  return index;
}
