# Knowledge

Store project knowledge and documentation here:

## Categories

### `/requirements/`
Requirements documentation:
- User stories
- Acceptance criteria
- Traceability matrix
- Stakeholder sign-offs

### `/design/`
Design documentation:
- Data model specifications
- Architecture decision records (ADRs)
- Integration designs
- Security designs

### `/guides/`
User and admin documentation:
- User guides
- Admin guides
- Technical references
- Troubleshooting guides

Current finalized Skills Hub guides:
- `guides/EXECUTIVE_OVERVIEW.md`
- `guides/END_USER_GUIDE.md`
- `guides/MANAGER_GUIDE.md`
- `guides/ADMIN_GUIDE.md`
- `guides/TECHNICAL_DESIGN.md`
- `guides/DEPLOYMENT_GUIDE.md`
- `guides/REGRESSION_TESTING_PLAYBOOK.md`

The finalized executive, user, manager, admin, and technical design guides are also generated as `.docx` and `.html` files for distribution.

### `/kb-articles/`
ServiceNow Knowledge Base articles:
- Draft articles (markdown)
- Published article references
- FAQ documents

### `/releases/`
Release documentation:
- Release notes
- Deployment checklists
- Rollback procedures

## File Templates

### User Story
See `docs/Copilot-Prompt-Templates.md` → "Doc: User Story"

### ADR
See `docs/Copilot-Prompt-Templates.md` → "Doc: ADR"

### Knowledge Article
```markdown
# [Title]

## Overview
[2-3 sentence summary]

## Who This Is For
[Target audience]

## Prerequisites
- [Requirement 1]

## Instructions
### Step 1: [Action]
[Details]

## Troubleshooting
### [Problem]
**Solution**: [Steps]

## Related Articles
- [Link]
```

## Naming Convention

```
[category]/[type]_[name]_[version].md

Examples:
- requirements/US-001_user_authentication.md
- design/ADR-001_api_versioning.md
- guides/admin_guide_v1.md
- kb-articles/KB0001_getting_started.md
- releases/release_notes_v2.0.md
```
