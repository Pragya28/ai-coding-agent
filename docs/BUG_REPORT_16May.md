# Bug Report — AI Coding Agent

**Project:** ai-coding-agent  
**Stack:** Node.js · TypeScript · pnpm · Ollama  
**Models:** `lfm2.5-thinking:1.2b` (router) · `qwen2.5-coder:3b` (all tasks)  
**Regression Date:** 16 May 2026  
**Workspace Tested:** Obsidian vault at `/Users/pragyajha/Personal/some-any-every-thing`  
**Sessions Tested:** 6 session logs across all tool types and edge cases

---

## Summary

| Severity                        | Total  | Fixed  | Deferred |
| ------------------------------- | ------ | ------ | -------- |
| 🔴 High                         | 4      | 1      | 3        |
| 🟡 Medium                       | 6      | 2      | 4        |
| 🟢 Low                          | 5      | 4      | 1        |
| 🔵 Discovered During Regression | 5      | 5      | 0        |
| **Total**                       | **20** | **12** | **8**    |

### All Bugs

| #   | Description                                                    | Severity      | Status      |
| --- | -------------------------------------------------------------- | ------------- | ----------- |
| 1   | Pipe `\|` in write content silently truncates                  | 🔴 High       | ✅ Fixed    |
| 2   | Context overflow ~100k tokens causes full hallucination        | 🔴 High       | ⏳ Deferred |
| 3   | Router classifies identical intent inconsistently              | 🟡 Medium     | ⏳ Deferred |
| 4   | Context trim log not written to session file                   | 🟢 Low        | ✅ Fixed    |
| 5   | Session end not recorded / recorded multiple times             | 🟢 Low        | ✅ Fixed    |
| 6   | `search_files` directory argument silently dropped             | 🟡 Medium     | ✅ Fixed    |
| 7   | Agent overwrites file without reading first                    | 🟢 Low        | ⏳ Deferred |
| 8   | `echo` command skips tool call entirely                        | 🔴 High       | ⏳ Deferred |
| 9   | `run ls` routes to `list_directory` instead of `run_shell`     | 🟡 Medium     | ⏳ Deferred |
| 10  | `run cat` with space in filename handled inconsistently        | 🟡 Medium     | ⏳ Deferred |
| 11  | ETIMEDOUT blamed on internet connectivity                      | 🟡 Medium     | ⏳ Deferred |
| 12  | `Max iterations reached` returned as raw string                | 🟢 Low        | ✅ Fixed    |
| 13  | Long input triggers false workspace apology                    | 🟢 Low        | ✅ Fixed    |
| 14  | `show me <topic>` never reads relevant file                    | 🟡 Medium     | ✅ Fixed    |
| 15  | Factually wrong answers from model knowledge                   | 🔴 High       | ⏳ Deferred |
| 16  | System prompt instruction leaking into agent response          | 🔵 Discovered | ✅ Fixed    |
| 17  | Logger displaying argument and secondArgument as single string | 🔵 Discovered | ✅ Fixed    |
| 18  | Model hallucinating file paths from search results             | 🔵 Discovered | ✅ Fixed    |
| 19  | `search_files` not falling back to workspace root on bad path  | 🔵 Discovered | ✅ Fixed    |
| 20  | System prompt example biasing model to wrong directory         | 🔵 Discovered | ✅ Fixed    |

---

## 🔴 High Severity

### Bug 1 — Pipe in write content silently truncates

**Status:** ✅ Fixed  
**File:** `src/utils/tool-parser.ts`  
**Description:** When writing a file with `|` in the content (e.g. `hello|world`), everything after the pipe was silently dropped. The agent reported success but the file was incomplete.  
**Fix:** Split on first pipe only for `write_file`. All other tools split normally.

---

### Bug 2 — Context overflow causes full hallucination

**Status:** ⏳ Deferred  
**File:** `src/utils/context-manager.ts`  
**Description:** At approximately 100k tokens, the model returns completely unrelated output — in one session an SVG description was returned in response to a JavaScript question.  
**Root Cause:** `qwen2.5-coder:3b` loses coherence at high context lengths.  
**Mitigation:** Deferred to paid API integration. A stronger model handles long context reliably.

---

### Bug 8 — `echo` command skips tool call

**Status:** ⏳ Deferred  
**File:** `src/agent/loop.ts` / `src/agent/chat.ts`  
**Description:** When asked to `run echo hello`, the model sometimes answers directly without calling `run_shell`. Non-deterministic — passes some sessions, fails others.  
**Root Cause:** Model non-determinism with small 3B model.  
**Mitigation:** Deferred to paid API integration.

---

### Bug 15 — Factually wrong answers from model knowledge

**Status:** ⏳ Deferred  
**File:** Inherent model limitation  
**Description:** Model gives incorrect explanations for JavaScript concepts (e.g. wrong Promise vs setTimeout execution order) when answering from its own knowledge instead of reading a file.  
**Root Cause:** `qwen2.5-coder:3b` training data quality.  
**Mitigation:** Prefer file read over memory where possible. Fully resolved with stronger model.

---

## 🟡 Medium Severity

### Bug 3 — Router classifies identical intent inconsistently

**Status:** ⏳ Deferred  
**File:** `src/agent/router.ts`  
**Description:** The same `list` phrasing routes to `file_operation` in one session and `general` in another. Non-deterministic across sessions.  
**Root Cause:** `lfm2.5-thinking:1.2b` router model is too small for consistent classification.  
**Mitigation:** Keyword overrides added for common cases. Remaining non-determinism deferred to better model.

---

### Bug 6 — `search_files` directory argument silently dropped

**Status:** ✅ Fixed  
**File:** `src/utils/tool-parser.ts` · `src/tools/search-files.ts`  
**Description:** When calling `search_files | async | 03-Domains`, the `03-Domains` argument was silently dropped and the search ran against the full workspace.  
**Root Cause:** Lazy regex `(.+?)` stopped capturing before the second pipe.  
**Fix:** Changed to greedy regex `(.+)` with newline stripping. Added `fs.existsSync` fallback in `search-files.ts` for invalid directories.

---

### Bug 9 — `run ls` routes to `list_directory` instead of `run_shell`

**Status:** ⏳ Deferred  
**File:** `src/agent/router.ts`  
**Description:** When asked to `run ls`, the router classifies as `file_operation` and the model calls `list_directory` instead of executing the shell command.  
**Root Cause:** Router model non-determinism.  
**Mitigation:** Deferred to better model.

---

### Bug 10 — `run cat` with space in filename handled inconsistently

**Status:** ⏳ Deferred  
**File:** `src/agent/loop.ts` / system prompt  
**Description:** `run cat "07-Event Loop.md"` is sometimes intercepted and converted to `read_file` (correct), sometimes passed to shell and fails (incorrect). Non-deterministic.  
**Root Cause:** Model non-determinism with rule 1 (never use `run_shell` with `cat`).  
**Mitigation:** Deferred to better model.

---

### Bug 11 — ETIMEDOUT blamed on internet connectivity

**Status:** ⏳ Deferred  
**File:** System prompt / tool error messages  
**Description:** When a shell command times out, the agent responds with "accessing the internet is outside my capabilities" instead of explaining it as a local execution timeout.  
**Root Cause:** `qwen2.5-coder:3b` ignores rule 8 in the system prompt.  
**Mitigation:** Rule added to system prompt. Deferred to stronger model for reliable enforcement.

---

### Bug 14 — `show me <topic>` never reads relevant file

**Status:** ✅ Fixed  
**File:** `src/agent/router.ts` · `src/agent/loop.ts` · `src/prompts/system.ts`  
**Description:** Prompts like "show me the event loop note" were classified as `explanation` and answered from model memory instead of reading the actual file.  
**Fix:** Added keyword override in router for `show me`, `open`, `display`. Added multi-step flow in loop — after `search_files` succeeds, model is instructed to call `read_file` on the exact path from results.

---

## 🟢 Low Severity

### Bug 4 — Context trim log not written to session file

**Status:** ✅ Fixed  
**File:** `src/utils/logger.ts` · `src/agent/chat.ts`  
**Description:** When context trimming fired, the log appeared in the terminal but was not written to the session markdown file.  
**Fix:** Passed logger into `callOllama`, called `logger.logSystem()` when trim count > 0.

---

### Bug 5 — Session end not recorded / recorded multiple times

**Status:** ✅ Fixed  
**File:** `src/main.ts`  
**Description:** Session end timestamp was either missing or duplicated up to 4 times in the log file.  
**Root Cause:** `rl.on("close")` fired multiple times.  
**Fix:** Added `sessionEnded` guard flag in `main.ts` to ensure `logSessionEnd()` is called exactly once.

---

### Bug 7 — Agent overwrites file without reading first

**Status:** ⏳ Deferred  
**File:** `src/agent/loop.ts` / system prompt  
**Description:** When asked to edit a file, the agent writes new content inferred from conversation context without first reading the existing file. Risk of data loss.  
**Root Cause:** Requires multi-step planning (read → diff → write) which the current model cannot reliably execute.  
**Mitigation:** Deferred to paid API integration with plan mode enforcement.

---

### Bug 12 — `Max iterations reached` returned as raw string

**Status:** ✅ Fixed  
**File:** `src/agent/loop.ts`  
**Description:** When the agent hit the max iteration limit, it returned the raw string "Max iterations reached." with no context about what was completed.  
**Fix:** Added summary using the last successful tool result. Returns a partial summary or a rephrasing suggestion.

---

### Bug 13 — Long input triggers false workspace apology

**Status:** ✅ Fixed  
**File:** System prompt  
**Description:** For long general knowledge questions, the model prefaced answers with "I don't have access to the workspace" even when no file access was needed.  
**Fix:** Tightened system prompt rule 6 to clarify when tools should and should not be used.

---

## 🔵 Discovered During Regression

### Bug 16 — System prompt instruction leaking into agent response

**Status:** ✅ Fixed  
**File:** `src/agent/loop.ts`  
**Description:** The internal instruction "Now show the user the EXACT contents..." was being echoed back as part of the agent's visible response.  
**Fix:** Added `.replace()` strip for known instruction phrases in response cleanup.

---

### Bug 17 — Logger displaying argument and secondArgument as single string

**Status:** ✅ Fixed  
**File:** `src/utils/logger.ts` · `src/agent/loop.ts`  
**Description:** Tool log entries showed `search_files | closure | 03-Domains/JavaScript` as a single argument string instead of correctly separating the two arguments.  
**Fix:** Updated `logTool` signature to accept `secondArgument` separately and format correctly.

---

### Bug 18 — Model hallucinating file paths from search results

**Status:** ✅ Fixed  
**File:** `src/agent/loop.ts`  
**Description:** After a successful `search_files` result, the model invented a plausible-sounding filename (e.g. `15-Closures.md`) instead of using the exact path shown in the results.  
**Fix:** Strengthened the search continuation message to explicitly instruct the model to use the exact path as shown, not guess.

---

### Bug 19 — `search_files` not falling back to workspace root on bad path

**Status:** ✅ Fixed  
**File:** `src/tools/search-files.ts`  
**Description:** When the model passed an invalid directory (e.g. `JavaScript` instead of `03-Domains/JavaScript`), the tool returned an `ENOENT` error instead of gracefully searching the workspace root.  
**Fix:** Added `fs.existsSync` check — falls back to `WORKSPACE` root when directory is not found.

---

### Bug 20 — System prompt example biasing model to wrong directory

**Status:** ✅ Fixed  
**File:** `src/prompts/system.ts`  
**Description:** The example `TOOL: search_files | hooks | 03-Domains/React` caused the model to always search in `03-Domains/React` regardless of the actual topic.  
**Fix:** Replaced with neutral examples using `03-Domains` as the base directory.

---

## Deferred Bugs — Blocked On

All 8 deferred bugs share the same root cause: **`qwen2.5-coder:3b` is too small to reliably follow complex multi-rule instructions.**

They will largely resolve when switching to a paid API with a stronger model (Claude Sonnet, GPT-4o, or Gemini Flash). No architectural changes are needed — the model router already supports provider switching via `src/agent/model-selector.ts`.

**Planned resolution:** Phase 6 — Paid API Integration.

---

_Generated: 16 May 2026_
