# ServiceNow Quick Start

> AI-Assisted ServiceNow Development Framework for GitHub Copilot

A comprehensive methodology and prompt library for developing ServiceNow applications using AI assistants (GitHub Copilot, Claude, etc.) with MCP (Model Context Protocol) tools.

## What's Included

| Document | Description |
|----------|-------------|
| [Process Guide](Agentic-AI-ServiceNow-Development-Process-Guide.md) | Complete 8-phase development lifecycle |
| [Agent Personas](docs/ServiceNow-Agent-Personas.md) | 7 role-based AI personas (Analyst, Architect, Developer, QA, Security, Tech Writer, Release Manager) |
| [Workflows](docs/ServiceNow-Development-Workflows.md) | Detailed workflows with entry/exit criteria |
| [Copilot Templates](docs/Copilot-Prompt-Templates.md) | 40+ copy-paste prompts for common tasks |
| [Validation Checklists](docs/Validation-Checklists.md) | Quality gate checklists (CL-01 through CL-06) |
| [Quick Reference](docs/Quick-Reference-Cards.md) | MCP command snippets |

## Quick Start

### 1. Session Setup (Always Start Here)
```javascript
// Set your application scope
SN-Set-Current-Application({ app_sys_id: "YOUR_APP_SYS_ID" })

// Set your update set
SN-Set-Update-Set({ update_set_sys_id: "YOUR_UPDATE_SET_SYS_ID" })

// Verify!
SN-Get-Current-Update-Set()
```

### 2. Choose Your Entry Point

| I want to... | Start here |
|--------------|------------|
| Learn the framework | [Process Guide](Agentic-AI-ServiceNow-Development-Process-Guide.md) |
| Start developing | [Workflows](docs/ServiceNow-Development-Workflows.md) |
| Get a quick prompt | [Copilot Templates](docs/Copilot-Prompt-Templates.md) |
| Verify my work | [Validation Checklists](docs/Validation-Checklists.md) |
| Find a command | [Quick Reference](docs/Quick-Reference-Cards.md) |

### 3. Activate an AI Persona

Tell your AI assistant:
```
You are now acting as a ServiceNow Developer (sn-developer persona).
Your task is: [describe your task]
```

Available personas: `sn-analyst`, `sn-architect`, `sn-developer`, `sn-qa`, `sn-security`, `sn-techwriter`, `sn-release`

## Framework Principles

1. **MCP-First**: Use MCP tools as primary method (10-100x faster than UI)
2. **Batch Operations**: 5-43 operations per message
3. **Verify Always**: Check update set capture after every batch
4. **Test Early**: Validate after each phase, not at the end
5. **Document Everything**: Capture decisions and sys_ids

## Development Phases

```
Discovery → Requirements → Design → Implementation → Validation → Testing → ATF → Documentation
```

Each phase has:
- Entry criteria (what you need before starting)
- Detailed steps (what to do)
- Exit criteria (how to know you're done)
- Quality gate (who approves)

## Project Structure

When you create a new project from this template, use these folders:

```
your-project/
├── docs/                    # Framework documentation (read-only reference)
├── files/                   # Project files and exports
│   ├── update-sets/         # Update set XML exports
│   ├── schemas/             # Table schema exports
│   ├── config/              # Configuration exports
│   └── attachments/         # Supporting files
├── scripts/                 # Generated scripts
│   ├── implementation/      # Creation scripts
│   ├── testing/             # Test scripts
│   ├── utilities/           # Utility scripts
│   └── atf/                 # ATF definitions
├── knowledge/               # Project documentation
│   ├── requirements/        # User stories, acceptance criteria
│   ├── design/              # ADRs, data models
│   ├── guides/              # User/admin guides
│   ├── kb-articles/         # Knowledge base drafts
│   └── releases/            # Release notes
├── .github/                 # GitHub Copilot instructions
└── .vscode/                 # VS Code snippets
```

## IDE Integration

### GitHub Copilot
The `.github/copilot-instructions.md` file is automatically loaded by Copilot, providing ServiceNow-specific context for all your queries.

### VS Code Snippets
Type these prefixes and press Tab:

| Prefix | Description |
|--------|-------------|
| `sn-setup` | Session setup (scope + update set) |
| `sn-query` | Query table |
| `sn-create` | Create record |
| `sn-script-include` | Create Script Include |
| `sn-business-rule` | Create Business Rule |
| `sn-test` | Unit test template |
| `sn-verify` | Verify update set |
| `persona-developer` | Activate developer persona |

See `.vscode/servicenow.code-snippets` for all 30+ snippets.

## Requirements

- ServiceNow instance with admin access
- MCP server with ServiceNow tools configured
- AI assistant (GitHub Copilot recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

---

*Inspired by the [BMAD Framework](https://github.com/bmadcode/BMAD-METHOD) for agent-based workflow patterns.*
