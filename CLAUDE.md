# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a **dual-purpose repository**: (1) a reusable framework/template for AI-assisted ServiceNow development, and (2) the working project for **ClevelandAI**, a custom ServiceNow application (Global Scope) providing an Azure OpenAI gateway with multi-model support, ReAct agent loop, and BYOK architecture via `sys_alias`.

## Repository Structure

```
├── Agentic-AI-ServiceNow-Development-Process-Guide.md  # Main 8-phase process guide
├── docs/                    # Framework reference docs (personas, workflows, templates, checklists)
├── files/
│   ├── update-sets/         # Update set XML exports + extracted output
│   ├── schemas/             # Table schema JSON exports
│   └── config/              # Configuration exports
├── scripts/
│   ├── implementation/      # Numbered fix scripts (01_tables.js, 02_fields.js, etc.)
│   ├── testing/             # Unit/integration/security test scripts
│   ├── utilities/           # Utility scripts (extract-update-set-v3.js, etc.)
│   └── atf/                 # ATF test definitions
├── knowledge/               # Project docs (requirements, design, guides, releases)
├── .github/copilot-instructions.md  # Copilot-specific instructions (also applies here)
└── .vscode/servicenow.code-snippets # 30+ VS Code snippets (sn-setup, sn-query, etc.)
```

## Two Execution Modes

Before any ServiceNow work, determine the mode:

```javascript
SN-Get-Current-Instance()  // Test MCP connectivity
```

- **MCP Mode** (preferred): Use `SN-*` MCP tools directly for 10-100x faster execution
- **Fix Script Mode** (fallback): Generate numbered scripts in `/scripts/implementation/` for manual execution in ServiceNow's Scripts > Background

## Session Setup (Always First)

```javascript
SN-Set-Current-Application({ app_sys_id: "<app_sys_id>" })
SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
SN-Get-Current-Update-Set()  // ALWAYS verify
```

## ClevelandAI Architecture

```
User Input → Interface (VA/Flow/UI) → ClevelandAI (Script Include) →
Provider API (Azure) → ClevelandAI (Process/Tool Loop) → Response
```

- **Core Script Include:** `global.ClevelandAI` — orchestrates API calls and tool execution loop (max 5 iterations)
- **Client Wrapper:** `global.ClevelandAIAjax` — GlideAjax wrapper for `ai_chat_playground` UI Page
- **Azure endpoint:** `https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions`
- **API version:** `2024-05-01-preview` (via `ai.azure.api_version` property)
- **Auth:** `Authorization: Bearer <Key>` via `sn_cc.StandardCredentialsProvider`
- **REST Message/Alias:** `AI_Azure_OpenAI`

GPT-5/o1 models require `max_completion_tokens` instead of `max_tokens`.

## Data Model

All tables use `u_ai_` prefix in Global scope:

| Table | Purpose |
|-------|---------|
| `u_ai_provider` | Connection config (base URL, connection alias) |
| `u_ai_model` | LLM config (deployment name, temperature) |
| `u_ai_agent` | Persona with system prompt + linked tools |
| `u_ai_function` | Executable tools (script include, method, JSON schema) |
| `u_ai_m2m_agent_function` | Agent↔Function M2M |
| `u_ai_prompt_template` | Reusable prompts with `{{var}}` substitution |
| `u_ai_conversation` | Chat session parent (session ID, user, cost) |
| `u_ai_message` | Individual turns (role, content, tool_calls) |
| `u_ai_usage_log` | API audit trail (request/response payloads, cost) |

## Tool (Function) Execution

Tools are executed via `global[scriptName]` pattern. To add a new tool:
1. Create a Global scope Script Include
2. Create a `u_ai_function` record with JSON Schema for parameters
3. Link to agent via `u_ai_m2m_agent_function`

## Implementation Order (Critical)

Always follow this sequence to avoid dependency issues:
1. Set Application Scope → 2. Set Update Set → 3. Tables (parent→child) → 4. Fields → 5. Choice values → 6. Script Includes (dependencies first) → 7. Business Rules → 8. Scheduled Jobs → 9. ACLs (table→field) → 10. UI Components

## MCP Batch Operations

Batch 5-43 independent operations in a single message. Always verify update set capture after each batch:

```javascript
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<sys_id>^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
  fields: "name,type,target_name"
})
```

## Approval Workflow

Each development phase produces deliverables that **require user approval** before proceeding. Present summary, save to appropriate location, and explicitly ask for approval.

## Key Framework Documents

| Document | Purpose |
|----------|---------|
| `Agentic-AI-ServiceNow-Development-Process-Guide.md` | Main 8-phase lifecycle |
| `docs/ServiceNow-Agent-Personas.md` | 7 AI personas (analyst, architect, developer, qa, security, techwriter, release) |
| `docs/ServiceNow-Development-Workflows.md` | Detailed workflows with entry/exit criteria |
| `docs/Copilot-Prompt-Templates.md` | 40+ copy-paste prompts |
| `docs/Validation-Checklists.md` | Quality gate checklists (CL-01 through CL-06) |
| `docs/Quick-Reference-Cards.md` | MCP command snippets for both modes |

## Utility Scripts

```bash
# Extract update set XML into categorized markdown + script files
node scripts/utilities/extract-update-set-v3.js <input.xml> <output-dir>
# Requires: npm install xml2js
```

## ServiceNow Code Patterns

Script Includes use `Class.create()` with `LOG_SOURCE` and try-catch:
```javascript
var Name = Class.create();
Name.prototype = {
    initialize: function() { this.LOG_SOURCE = 'Name'; },
    method: function(param) {
        try { return { success: true, data: result }; }
        catch (e) { gs.error(this.LOG_SOURCE + '.method: ' + e.message); return { success: false, error: e.message }; }
    },
    type: 'Name'
};
```

Business Rules use early exit with `.changes()`:
```javascript
(function executeRule(current, previous) {
    if (!current.field.changes()) return;
    // logic
})(current, previous);
```

**Never use template notation** (`{{variable}}`) in ServiceNow scripts — use string concatenation.

## Common Pitfalls

- **Wrong update set:** Always verify with `SN-Get-Current-Update-Set()` before changes. Recovery: `SN-Move-Records-To-Update-Set`
- **Variable types:** Type 1 = Choice (radio), Type 5 = Select Box (dropdown), Type 6 = Multi-line, Type 8 = Reference, Type 16 = Single Line
- **Choice tables:** Table field choices → `sys_choice`; Catalog variable choices → `question_choice`
- **UI Policy Actions:** Cannot be linked via REST API. Use `SN-Execute-Background-Script` with `setValue()` and format `IO:<variable_sys_id>`

## ACLs

- **Admin:** Full CRUD on config tables (`u_ai_provider`, `u_ai_model`, `u_ai_function`)
- **User/ITIL:** Read/Write on runtime tables (`u_ai_conversation`, `u_ai_message`)

## Update Set Info

**Name:** `NZ - STRY0449153 - Enable Multi-Model AI`
**Components:** 9 tables, 4 Script Includes, REST Message, ACLs, VA Topics, Flow Action, UI Page
