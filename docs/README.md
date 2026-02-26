# ServiceNow AI Development Framework

> Documentation index for AI-assisted ServiceNow development with GitHub Copilot.

## Quick Navigation

### Getting Started
Start here if you're new to the framework:
1. Read the [Main Process Guide](../Agentic-AI-ServiceNow-Development-Process-Guide.md) overview
2. Review the [Quick Reference Cards](Quick-Reference-Cards.md) for common commands
3. Use [Copilot Prompt Templates](Copilot-Prompt-Templates.md) to start working

### Document Index

| Document | Size | Purpose |
|----------|------|---------|
| [Main Process Guide](../Agentic-AI-ServiceNow-Development-Process-Guide.md) | Comprehensive | 8-phase development lifecycle, best practices, pitfalls |
| [Agent Personas](ServiceNow-Agent-Personas.md) | Reference | 7 role-based AI personas with expertise and handoffs |
| [Development Workflows](ServiceNow-Development-Workflows.md) | Detailed | Step-by-step workflows with entry/exit criteria |
| [Copilot Templates](Copilot-Prompt-Templates.md) | Practical | 40+ copy-paste prompts for common tasks |
| [Validation Checklists](Validation-Checklists.md) | Quality | 6 phase checklists with verification scripts |
| [Quick Reference](Quick-Reference-Cards.md) | Concise | MCP command snippets for rapid development |

### By Use Case

**"I need to start a new feature"**
→ [Main Process Guide](../Agentic-AI-ServiceNow-Development-Process-Guide.md) → Prerequisites

**"I need help with a specific phase"**
→ [Development Workflows](ServiceNow-Development-Workflows.md)

**"I need a prompt for Copilot"**
→ [Copilot Templates](Copilot-Prompt-Templates.md)

**"I need to verify my work"**
→ [Validation Checklists](Validation-Checklists.md)

**"I need a quick MCP command"**
→ [Quick Reference](Quick-Reference-Cards.md)

**"I want specialized AI behavior"**
→ [Agent Personas](ServiceNow-Agent-Personas.md)

### Framework Principles

1. **MCP-First**: Use MCP tools as primary method (10-100x faster)
2. **Batch Operations**: 5-43 operations per message
3. **Verify Always**: Check update set capture after every batch
4. **Test Early**: Validate after each phase
5. **Document Everything**: Capture decisions and sys_ids

### Session Startup Checklist

```javascript
// Always start every session with:
SN-Set-Current-Application({ app_sys_id: "YOUR_APP_SYS_ID" })
SN-Set-Update-Set({ update_set_sys_id: "YOUR_UPDATE_SET_SYS_ID" })
SN-Get-Current-Update-Set()  // VERIFY!
```

---

*Framework Version: 2.0 | Last Updated: 2025-02-03*
