# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClevelandAI is a custom ServiceNow application (Global Scope) that provides a gateway to Azure OpenAI. It features:
- **Provider/Model pattern** for multi-LLM support
- **ReAct agent loop** for tool execution (max 5 iterations)
- **Bring Your Own Key** architecture via `sys_alias` credentials
- Deep integration with ServiceNow automation (Flow Designer, Virtual Agent)

## Architecture

```
User Input → Interface (VA/Flow/UI) → ClevelandAI (Script Include) →
Provider API (Azure) → ClevelandAI (Process/Tool Loop) → Response
```

**Core Script Include:** `global.ClevelandAI` - orchestrates API calls and tool execution loop
**Client Wrapper:** `global.ClevelandAIAjax` - GlideAjax wrapper for UI Pages

## Data Model

All tables use `u_ai_` prefix in Global scope:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `u_ai_provider` | Connection config | `u_name`, `u_base_url`, `u_connection_alias` |
| `u_ai_model` | LLM configuration | `u_deployment_name`, `u_provider`, `u_default_temperature` |
| `u_ai_agent` | Persona with tools | `u_name`, `u_system_prompt`, `u_model` |
| `u_ai_function` | Executable tools | `u_name`, `u_script_include`, `u_method_name`, `u_parameters_schema` |
| `u_ai_m2m_agent_function` | Agent↔Function M2M | `u_agent`, `u_function` |
| `u_ai_prompt_template` | Reusable prompts | `u_name`, `u_template` (supports `{{var}}`) |
| `u_ai_conversation` | Chat session parent | `u_session_id`, `u_user`, `u_model`, `u_total_cost` |
| `u_ai_message` | Individual turns | `u_conversation`, `u_role`, `u_content`, `u_tool_calls` |
| `u_ai_usage_log` | API audit trail | `u_request_payload`, `u_response_payload`, `u_cost` |

## ServiceNow MCP Development

Use MCP tools as the primary development method (10-100x faster than UI).

### Set Context First
```javascript
// Always set scope and update set before making changes
SN-Set-Current-Application({ app_sys_id: "..." });
SN-Set-Update-Set({ update_set_sys_id: "..." });
SN-Get-Current-Update-Set();  // Verify
```

### Common Operations
```javascript
// Query tables
SN-Query-Table({ table_name: "u_ai_model", query: "u_active=true" })

// Create records
SN-Create-Record({ table_name: "u_ai_function", data: {...} })

// Discover schema
SN-Discover-Table-Schema({ table_name: "u_ai_agent", include_relationships: true })

// Execute scripts for operations REST can't handle
SN-Execute-Background-Script({ script: "...", execution_method: "trigger" })
```

### Update Set Management
```javascript
// List update sets
SN-List-Update-Sets({ query: "state=in progress" })

// Move records if they land in wrong update set
SN-Move-Records-To-Update-Set({
  update_set_id: "<target_sys_id>",
  source_update_set: "Default"
})
```

## Azure OpenAI Integration

- **Endpoint:** `https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions`
- **API Version:** `2024-05-01-preview` (via `ai.azure.api_version` property)
- **Auth:** `Authorization: Bearer <Key>` via `sn_cc.StandardCredentialsProvider`
- **REST Message:** `AI_Azure_OpenAI`
- **Connection Alias:** `AI_Azure_OpenAI`

GPT-5/o1 models require `max_completion_tokens` instead of `max_tokens`.

## Interfaces

- **Virtual Agent:** "Ask ClevelandAI" topic block
- **Flow Designer:** "Ask ClevelandAI" action
- **Developer UI:** `ai_chat_playground` UI Page

## Tool (Function) Execution

Tools are executed via `global[scriptName]` pattern. To add a new tool:
1. Create Script Include (must be Global scope accessible)
2. Create `u_ai_function` record with JSON Schema for parameters
3. Link to agent via `u_ai_m2m_agent_function`

## ACLs

- **Admin:** Full CRUD on config tables (`u_ai_provider`, `u_ai_model`, `u_ai_function`)
- **User/ITIL:** Read/Write on runtime tables (`u_ai_conversation`, `u_ai_message`)

## Files in This Repository

- `ClevelandAI Gateway - TDD.pdf` - Technical Design Document
- `ClevelandAI Prompts.pdf` - Development prompts for platform expansion
- `sys_remote_update_set_*.xml` - ServiceNow Update Set export

## Update Set Info

**Name:** `NZ - STRY0449153 - Enable Multi-Model AI`
**Components:** 9 tables, 4 Script Includes, REST Message, ACLs, VA Topics, Flow Action, UI Page
