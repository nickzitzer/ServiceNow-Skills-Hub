# GitHub Copilot Instructions for ServiceNow Development

You are assisting with ServiceNow development. This framework supports **two execution modes** - always determine the mode first.

## Execution Mode Check (MANDATORY FIRST STEP)

Before ANY ServiceNow development, determine the execution mode:

```javascript
// Test MCP connectivity
SN-Get-Current-Instance()
```

| Result | Mode | Action |
|--------|------|--------|
| ✅ Returns instance info | **MCP Mode** | Use SN-* tools directly |
| ❌ Error or no MCP tools | **Fix Script Mode** | Generate scripts for manual execution |

## Core Principles

1. **Check Mode First**: Always determine MCP or Fix Script mode before starting
2. **Batch Operations**: Combine 5-43 operations (MCP) or generate consolidated scripts (Fix Script)
3. **Approval Gates**: Each phase creates deliverables - WAIT for user approval before proceeding
4. **Verify Always**: Check update set capture after every batch of changes
5. **Test Early**: Validate after each phase, not just at the end

## Approval Workflow (CRITICAL)

**Every phase must follow this pattern:**
1. Generate deliverable (document, script, or report)
2. Save to appropriate location
3. Present summary to user
4. ASK: "Please review [deliverable]. Reply 'approved' to proceed or provide feedback."
5. Wait for explicit approval
6. Only proceed after approval

## Session Setup

### MCP Mode
```javascript
SN-Set-Current-Application({ app_sys_id: "<app_sys_id>" })
SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
SN-Get-Current-Update-Set()  // Always verify!
```

### Fix Script Mode
Generate and save to `/scripts/implementation/01_context_setup.js`:
```javascript
(function() {
    var appSysId = '<application_sys_id>';
    var updateSetSysId = '<update_set_sys_id>';

    // Set application scope
    var app = new GlideRecord('sys_app');
    if (app.get(appSysId)) {
        gs.setCurrentApplicationId(appSysId);
        gs.info('Application scope set to: ' + app.name);
    } else {
        gs.error('Application not found: ' + appSysId);
        return;
    }

    // Set update set
    var us = new GlideRecord('sys_update_set');
    if (us.get(updateSetSysId)) {
        gs.setUpdateSetId(updateSetSysId);
        gs.info('Update set set to: ' + us.name);
    } else {
        gs.error('Update set not found: ' + updateSetSysId);
        return;
    }

    gs.info('Context setup complete');
})();
```

## Implementation Order

Follow this sequence to avoid dependency issues:
1. Tables (parent to child)
2. Fields (required to optional)
3. Choice values
4. Script Includes (dependencies first)
5. Business Rules (by order)
6. Client Scripts
7. UI Policies
8. ACLs (table to field level)
9. UI Components

## Code Standards

### Script Include Pattern (ServiceNow Standard)
```javascript
var ScriptName = Class.create();
ScriptName.prototype = {
    initialize: function() {
        this.LOG_SOURCE = 'ScriptName';
    },

    methodName: function(param) {
        try {
            // Implementation
            return { success: true, data: result };
        } catch (e) {
            gs.error(this.LOG_SOURCE + '.methodName: ' + e.message);
            return { success: false, error: e.message };
        }
    },

    type: 'ScriptName'
};
```

### Business Rule Pattern (ServiceNow Standard)
```javascript
(function executeRule(current, previous) {
    if (!current.field.changes()) return;  // Exit early

    try {
        // Logic here
    } catch (e) {
        gs.error('BR-Name: ' + e.message);
    }
})(current, previous);
```

**IMPORTANT**: Never use template notation like `{{variable}}`. Use string concatenation or ServiceNow message functions instead.

## MCP Mode Commands

| Command | Purpose |
|---------|---------|
| `SN-Query-Table` | Read records |
| `SN-Create-Record` | Insert records |
| `SN-Update-Record` | Modify records |
| `SN-Discover-Table-Schema` | Get full schema |
| `SN-Execute-Background-Script` | Run GlideScript |
| `SN-Move-Records-To-Update-Set` | Fix update set issues |

## Fix Script Mode Output

When MCP is unavailable, generate numbered scripts:
- `/scripts/implementation/01_context_setup.js`
- `/scripts/implementation/02_create_tables.js`
- `/scripts/implementation/03_create_fields.js`
- `/scripts/implementation/04_create_script_includes.js`
- `/scripts/implementation/05_create_business_rules.js`
- `/scripts/implementation/06_create_acls.js`
- `/scripts/implementation/07_verification.js`

Each script should:
- Be self-contained and idempotent (safe to re-run)
- Check if records exist before creating
- Log all actions with gs.info/gs.error
- Report success/failure clearly

## Security Requirements

- Never hardcode credentials or sys_ids in scripts
- Use sys_alias for external connections
- Test ACLs for each user role
- Validate all user input

## Deliverable Locations

| Phase | Deliverable | Location |
|-------|------------|----------|
| Discovery | Discovery Report | `/knowledge/requirements/discovery-report.md` |
| Requirements | User Stories | `/knowledge/requirements/user-stories.md` |
| Design | Architecture | `/knowledge/design/architecture.md` |
| Implementation | Scripts | `/scripts/implementation/` |
| Testing | Test Report | `/knowledge/guides/test-report.md` |
| Release | Release Checklist | `/knowledge/releases/release-checklist.md` |

## Available Personas

When specialized behavior is needed, users may ask you to act as:
- `sn-analyst` - Requirements and user stories
- `sn-architect` - Design and data modeling
- `sn-developer` - Implementation and coding
- `sn-qa` - Testing and validation
- `sn-security` - ACLs and security review
- `sn-techwriter` - Documentation
- `sn-release` - Deployment and release

See `docs/ServiceNow-Agent-Personas.md` for full persona definitions.

## Project Documentation

- Main guide: `Agentic-AI-ServiceNow-Development-Process-Guide.md`
- Workflows: `docs/ServiceNow-Development-Workflows.md`
- Prompt templates: `docs/Copilot-Prompt-Templates.md`
- Checklists: `docs/Validation-Checklists.md`
- Quick reference: `docs/Quick-Reference-Cards.md`
