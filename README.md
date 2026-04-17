# ServiceNow Skills Hub

> Cleveland Clinic's ServiceNow-based skills management platform — skill tracking, peer endorsement, manager validation, gamification, and workforce analytics.

A custom ServiceNow Service Portal application that gives employees, managers, and leadership a single place to catalog skills, surface experts, validate proficiency, and close capability gaps. Built on OOB ServiceNow tables where possible, with targeted extensions for endorsement, tiering, and demand planning.

## Features

- **My Profile** — personal skill portfolio with proficiency, endorsements, and gamification tier
- **Find an Expert** — search across 500+ skills in the healthcare taxonomy (Epic, Microsoft, leadership, governance, professional)
- **Manager Matrix** — team skill coverage, validation queue, and gap analysis
- **Tier System** — calculated gamification (Starter → Luminary) with zero new tables, driven by owned skills, proficiency, endorsements, and manager validation
- **Demand & Gap Analysis** — Performance Analytics indicators, capacity dashboards, and skill-demand linkage
- **Skill Requests** — catalog item + workflow for adding new skills with manager approval

## Architecture

| Layer | Component |
|-------|-----------|
| Data | `sys_user_has_skill` (OOB) + custom: `u_m2m_skill_endorsement`, `u_peer_endorsement_count`, `u_validation_status`, demand tables |
| Logic | `SkillsHubUtils` Script Include (tier calc, search, validation), business rules, scheduled jobs |
| UI | Service Portal widgets: `Skills-Hub-My-Profile`, `Skills-Hub-Find-Expert`, `Skills-Hub-Manager-Matrix`, leaderboard, gap analysis |
| Analytics | PA indicators + dashboard (phase 4) |
| Security | Role-based ACLs (user, manager, admin) at table and field level |

See [`knowledge/guides/TECHNICAL_DESIGN.md`](knowledge/guides/TECHNICAL_DESIGN.md) for the full design and [`knowledge/design/SKILLS-HUB-ROADMAP.md`](knowledge/design/SKILLS-HUB-ROADMAP.md) for the phased plan.

## Repository Layout

```
ServiceNow-Skills-Hub/
├── scripts/
│   ├── implementation/      # 38 phased fix scripts (01..38) + taxonomy seed data
│   ├── widget-patches/      # Widget client/server/template/CSS patches
│   ├── utilities/           # extract-update-set-v3.js
│   └── testing/             # Unit/integration/security tests
├── files/
│   ├── update-sets/extracted/   # Categorized markdown + extracted widget source
│   └── attachments/             # Solution Overview, Architecture deck, Skills Taxonomy
├── knowledge/
│   ├── design/              # Roadmap
│   └── guides/              # Admin, Manager, End User, Deployment, Regression Testing, Technical Design (.md + .docx)
├── docs/                    # Framework reference (personas, workflows, prompts, checklists)
└── .github/ .vscode/        # Copilot instructions and ServiceNow code snippets
```

## Implementation Phases

Scripts in `scripts/implementation/` are numbered in execution order across four phases:

| Phase | Scripts | Scope |
|-------|---------|-------|
| **1 — Foundation** | `01`–`09` | Update set, tables, fields, choices, roles, business rules, ACLs, seed data, verification |
| **2 — Process & Workflow** | `10`–`17` | Catalog item, workflow, notifications, widget server scripts, scheduled jobs |
| **3 — UI & Tiering** | `18`–`26` | Tier system, leaderboard, skill grouping, nav modules, tab navigation |
| **4 — Analytics** | `27`–`33` | Demand tables, PA indicators, dashboard, gap analysis, skill detection |
| **UX Pass** | `34`–`38` | User stories, tile grouping, Find-Expert updates, UX fixes |

Seed data: `seed_01_categories.js`, `seed_02_skills_batch[1-5].js`, `seed_03_links_[01-10]*.js`, `seed_04_split_shared_skills.js`.

## Deployment

See [`knowledge/guides/DEPLOYMENT_GUIDE.md`](knowledge/guides/DEPLOYMENT_GUIDE.md) for the full runbook. Short version:

1. Create/select an update set in the target instance
2. Run scripts in numeric order from **Scripts > Background** (Global scope)
3. Verify each phase with its `*_verification*.js` script before proceeding
4. Run the regression suite from [`knowledge/guides/REGRESSION_TESTING_PLAYBOOK.md`](knowledge/guides/REGRESSION_TESTING_PLAYBOOK.md)

## Execution Modes

The repo supports two modes for applying changes:

- **MCP Mode** (preferred) — drive ServiceNow directly via `SN-*` MCP tools (10–100× faster than UI)
- **Fix Script Mode** (fallback) — run the numbered scripts manually in Background Scripts

Check connectivity before starting:

```javascript
SN-Get-Current-Instance()
SN-Set-Current-Application({ app_sys_id: "<global_or_app_sys_id>" })
SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
SN-Get-Current-Update-Set()  // always verify
```

## Guides

| Audience | Document |
|----------|----------|
| End Users | [END_USER_GUIDE.md](knowledge/guides/END_USER_GUIDE.md) |
| Managers | [MANAGER_GUIDE.md](knowledge/guides/MANAGER_GUIDE.md) |
| Admins | [ADMIN_GUIDE.md](knowledge/guides/ADMIN_GUIDE.md) |
| Deployment | [DEPLOYMENT_GUIDE.md](knowledge/guides/DEPLOYMENT_GUIDE.md) |
| QA / Regression | [REGRESSION_TESTING_PLAYBOOK.md](knowledge/guides/REGRESSION_TESTING_PLAYBOOK.md) |
| Technical Design | [TECHNICAL_DESIGN.md](knowledge/guides/TECHNICAL_DESIGN.md) |

## AI-Assisted Development Framework

This repo also ships with the reusable framework used to build it. See:

- [Process Guide](Agentic-AI-ServiceNow-Development-Process-Guide.md) — 8-phase lifecycle
- [Agent Personas](docs/ServiceNow-Agent-Personas.md) — analyst, architect, developer, QA, security, tech writer, release
- [Workflows](docs/ServiceNow-Development-Workflows.md), [Copilot Templates](docs/Copilot-Prompt-Templates.md), [Validation Checklists](docs/Validation-Checklists.md), [Quick Reference](docs/Quick-Reference-Cards.md)
- `.vscode/servicenow.code-snippets` — 30+ snippets (`sn-setup`, `sn-query`, `sn-script-include`, etc.)
- `.github/copilot-instructions.md` — auto-loaded ServiceNow context for Copilot

## Requirements

- ServiceNow instance with admin access (Global scope)
- Service Portal enabled
- Performance Analytics (for phase 4 dashboards)
- Optional: MCP server with ServiceNow tools for MCP-mode execution
- `node` + `npm install` for `scripts/utilities/extract-update-set-v3.js` (uses `xml2js`)

## License

MIT License — see [LICENSE](LICENSE).
