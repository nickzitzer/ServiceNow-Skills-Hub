# Agentic AI ServiceNow Development Process Guide

> A comprehensive framework for AI-assisted ServiceNow development using MCP tools, automated testing, and systematic validation. Optimized for GitHub Copilot and AI-assisted development.

---

## Framework Documents

This guide is part of a comprehensive framework. Use these documents together:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[This Guide](Agentic-AI-ServiceNow-Development-Process-Guide.md)** | Main process reference | Phase-by-phase development |
| **[Agent Personas](docs/ServiceNow-Agent-Personas.md)** | Role-based AI prompts | Activate specialized AI behaviors |
| **[Workflows](docs/ServiceNow-Development-Workflows.md)** | Detailed workflow steps | Step-by-step execution |
| **[Copilot Templates](docs/Copilot-Prompt-Templates.md)** | Copy-paste prompts | Quick AI interactions |
| **[Validation Checklists](docs/Validation-Checklists.md)** | Quality gates | Phase completion verification |
| **[Quick Reference](docs/Quick-Reference-Cards.md)** | MCP command snippets | Common operations |

### Quick Start

1. **New to this framework?** → Read this guide (Overview + Prerequisites)
2. **Ready to develop?** → Use [Workflows](docs/ServiceNow-Development-Workflows.md) for step-by-step
3. **Need AI help?** → Copy prompts from [Copilot Templates](docs/Copilot-Prompt-Templates.md)
4. **Checking quality?** → Use [Validation Checklists](docs/Validation-Checklists.md)
5. **Need a quick command?** → See [Quick Reference](docs/Quick-Reference-Cards.md)

### 5-Minute Quick Start Checklist

```
□ Step 1: Check execution mode
  → Run: SN-Get-Current-Instance()
  → MCP works? Use SN-* commands
  → MCP fails? Generate fix scripts

□ Step 2: Gather IDs (or create new)
  → Application sys_id: ________________
  → Update Set sys_id: ________________

□ Step 3: Set context
  → MCP: SN-Set-Current-Application + SN-Set-Update-Set
  → Fix Script: Generate 01_context_setup.js

□ Step 4: Start with the Custom Scoped App prompt
  → See docs/Copilot-Prompt-Templates.md
  → Fill in your app details
  → Follow approval gates at each phase

□ Step 5: Verify after each phase
  → Check update set capture
  → Test incrementally
  → Get approval before proceeding
```

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Discovery & Analysis](#phase-1-discovery--analysis)
4. [Phase 2: Requirements Refinement](#phase-2-requirements-refinement)
5. [Phase 3: Repository Augmentation](#phase-3-repository-augmentation)
6. [Phase 4: Implementation Scripting](#phase-4-implementation-scripting)
7. [Phase 5: Validation & Refinement](#phase-5-validation--refinement)
8. [Phase 6: Automated Testing (Inline)](#phase-6-automated-testing-inline)
9. [Phase 7: ATF Conversion](#phase-7-atf-conversion)
10. [Phase 8: Documentation & Knowledge Transfer](#phase-8-documentation--knowledge-transfer)
11. [MCP Tool Reference](#mcp-tool-reference)
12. [Best Practices](#best-practices)
13. [Common Pitfalls](#common-pitfalls)
14. [Templates](#templates)

---

## Overview

This guide documents a systematic approach to ServiceNow development using AI agents with MCP (Model Context Protocol) tools. The methodology emphasizes:

- **MCP-First Development**: Using automated tools as the primary method (10-100x faster than manual UI)
- **Test-Driven Approach**: Validation at every phase, not just at the end
- **Incremental Delivery**: Small, verifiable changes with continuous verification
- **Knowledge Preservation**: Capturing decisions, patterns, and lessons learned

### Development Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENTIC SERVICENOW DEVELOPMENT LIFECYCLE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ DISCOVER │──▶│ REQUIRE  │──▶│ AUGMENT  │──▶│IMPLEMENT │──▶│ VALIDATE │  │
│  │ Phase 1  │   │ Phase 2  │   │ Phase 3  │   │ Phase 4  │   │ Phase 5  │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│       │                                                             │        │
│       │         ┌──────────┐   ┌──────────┐   ┌──────────┐         │        │
│       └────────▶│  TEST    │──▶│   ATF    │──▶│DOCUMENT  │◀────────┘        │
│    Feedback     │ Phase 6  │   │ Phase 7  │   │ Phase 8  │   Refinement     │
│                 └──────────┘   └──────────┘   └──────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Execution Mode: MCP vs Fix Scripts

This framework supports **two execution modes**. Before starting, determine which mode to use:

#### Mode Check (Run First)
```javascript
// Try to connect to MCP server
SN-Get-Current-Instance()
```

| Result | Mode | How to Proceed |
|--------|------|----------------|
| ✅ Returns instance info | **MCP Mode** | Use MCP tools directly (SN-* commands) |
| ❌ Error/No response | **Fix Script Mode** | Generate background scripts for manual execution |

#### MCP Mode (Preferred)
- Direct API calls to ServiceNow via MCP tools
- Real-time execution and feedback
- 10-100x faster than manual operations
- Use when MCP server is connected and responding

#### Fix Script Mode (Fallback)
- Generate GlideRecord scripts saved to `/scripts/implementation/`
- Execute manually via Scripts - Background in ServiceNow
- Use when MCP is unavailable or for auditable deployments
- Scripts can be reviewed/approved before execution

**IMPORTANT**: Each phase generates deliverables that require **user approval** before proceeding to the next phase. See [Approval Gates](#approval-gates) below.

---

### Environment Setup

Before beginning any ServiceNow development:

#### If MCP Mode:

1. **Verify MCP Server Connection**
   ```javascript
   // Test connectivity
   SN-Get-Current-Instance()
   ```

2. **Set Application Scope**
   ```javascript
   // ALWAYS set scope first - records will go to wrong app otherwise
   SN-Set-Current-Application({ app_sys_id: "<application_sys_id>" })
   ```

3. **Set Update Set**
   ```javascript
   // Set and verify update set before ANY changes
   SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
   SN-Get-Current-Update-Set()  // Verify!
   ```

4. **Gather Instance Context**
   ```javascript
   // Understand what exists
   SN-List-Available-Tables()
   SN-List-Update-Sets({ query: "state=in progress" })
   ```

#### If Fix Script Mode:

1. **Generate Context Setup Script**
   Save to `/scripts/implementation/01_context_setup.js`:
   ```javascript
   // Context Setup Script - Run in Scripts > Background
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

       // Verify
       gs.info('Current Update Set: ' + gs.getUpdateSetId());
       gs.info('Context setup complete');
   })();
   ```

2. **Execute in ServiceNow**
   - Navigate to System Definition > Scripts - Background
   - Paste the script
   - Click "Run script"
   - Verify output shows correct application and update set

---

### Approval Gates

**CRITICAL**: Each phase creates deliverables that MUST be reviewed and approved before proceeding.

| Phase | Deliverable | Location | Approval Required |
|-------|------------|----------|-------------------|
| Discovery | Discovery Report | `/knowledge/requirements/discovery-report.md` | ✅ User review |
| Requirements | User Stories + Traceability | `/knowledge/requirements/user-stories.md` | ✅ User approval |
| Design | Architecture + Security Design | `/knowledge/design/architecture.md` | ✅ User approval |
| Implementation | Fix Scripts OR MCP Log | `/scripts/implementation/` | ✅ User approval before execution |
| Testing | Test Report | `/knowledge/guides/test-report.md` | ✅ User approval |
| Release | Release Checklist | `/knowledge/releases/release-checklist.md` | ✅ User approval |

**Workflow**:
1. AI generates deliverable document
2. AI saves to appropriate location
3. AI presents summary and asks: **"Please review [deliverable]. Reply 'approved' to proceed or provide feedback."**
4. User reviews and approves OR provides feedback
5. If feedback: AI updates deliverable and re-presents
6. Only after approval: Proceed to next phase

### Required Information

Collect before starting any development:

| Item | Purpose | How to Obtain |
|------|---------|---------------|
| Application sys_id | Scope targeting | `SN-Query-Table({ table_name: "sys_app" })` |
| Update Set sys_id | Change tracking | `SN-List-Update-Sets()` |
| User Group sys_ids | ACL configuration | `SN-Query-Table({ table_name: "sys_user_group" })` |
| Existing table schemas | Integration planning | `SN-Discover-Table-Schema()` |

---

## Phase 1: Discovery & Analysis

**Objective**: Build a complete understanding of the current state before making changes.

### 1.1 Inventory Existing Components

```javascript
// Discover all tables in the application scope
SN-Query-Table({
  table_name: "sys_db_object",
  query: "sys_scope=<app_sys_id>",
  fields: "name,label,sys_id,super_class"
})

// Get all Script Includes
SN-Query-Table({
  table_name: "sys_script_include",
  query: "sys_scope=<app_sys_id>",
  fields: "name,api_name,client_callable,active"
})

// Get all Business Rules
SN-Query-Table({
  table_name: "sys_script",
  query: "sys_scope=<app_sys_id>",
  fields: "name,table,when,active,order"
})
```

### 1.2 Schema Discovery

For each relevant table, capture complete schema:

```javascript
SN-Discover-Table-Schema({
  table_name: "<table_name>",
  include_relationships: true,
  include_choices: true
})
```

**Output Format**: Save discovered schemas to local repository:
```
/schemas/
  ├── u_ai_provider.json
  ├── u_ai_model.json
  ├── u_ai_agent.json
  └── ...
```

### 1.3 Dependency Mapping

Identify relationships and dependencies:

```javascript
// Find all references TO a table
SN-Query-Table({
  table_name: "sys_dictionary",
  query: "reference=<target_table>",
  fields: "name,element,column_label"
})

// Find all references FROM a table
SN-Discover-Table-Schema({
  table_name: "<source_table>",
  include_relationships: true
})
```

### 1.4 Discovery Checklist

- [ ] All application tables documented
- [ ] All Script Includes cataloged
- [ ] All Business Rules mapped
- [ ] All ACLs identified
- [ ] All UI components (Pages, Widgets) listed
- [ ] All integrations (REST, SOAP, Import Sets) noted
- [ ] All scheduled jobs documented
- [ ] Dependency graph created

---

## Phase 2: Requirements Refinement

**Objective**: Transform high-level requirements into actionable, testable specifications.

### 2.1 User Story Development

Each feature should be captured as a user story:

```markdown
## User Story: [US-XXX] Title

**As a** [role]
**I want** [capability]
**So that** [benefit]

### Acceptance Criteria

1. **Given** [precondition]
   **When** [action]
   **Then** [expected result]

2. **Given** [precondition]
   **When** [action]
   **Then** [expected result]

### Technical Notes
- Dependencies: [list dependencies]
- Affected tables: [list tables]
- Security considerations: [ACL requirements]

### Test Scenarios
- Happy path: [description]
- Edge case 1: [description]
- Error case: [description]
```

### 2.2 Requirements Traceability Matrix

Maintain a mapping from requirements to implementation:

| Requirement ID | User Story | Component | Test Case | Status |
|---------------|------------|-----------|-----------|--------|
| REQ-001 | US-001 | ClevelandAI.js | TC-001 | In Progress |
| REQ-002 | US-002 | AI_Azure_OpenAI | TC-002 | Pending |

### 2.3 Technical Specification

For each user story, document:

1. **Data Model Changes**
   - New tables/fields
   - Field types and constraints
   - Choice values
   - Reference relationships

2. **Business Logic**
   - Script Include methods
   - Business Rule triggers
   - Flow Designer actions

3. **Security Model**
   - ACL requirements by role
   - Field-level security
   - Row-level filtering

4. **Integration Points**
   - REST endpoints
   - External system calls
   - Credential requirements

### 2.4 Requirements Validation Questions

Before proceeding to implementation, validate:

- [ ] Are all acceptance criteria testable?
- [ ] Are edge cases and error scenarios defined?
- [ ] Are security requirements explicit?
- [ ] Are performance expectations documented?
- [ ] Are dependencies identified and available?
- [ ] Is rollback strategy defined?

---

## Phase 3: Repository Augmentation

**Objective**: Build a complete local repository of information to enable offline analysis and script generation.

### 3.1 Schema Repository

Export and organize all schemas:

```javascript
// Batch export all application tables
const tables = ['u_ai_provider', 'u_ai_model', 'u_ai_agent', ...];

// For each table (execute in parallel where possible)
tables.forEach(table => {
  SN-Discover-Table-Schema({
    table_name: table,
    include_relationships: true,
    include_choices: true
  })
});
```

### 3.2 Code Repository

Extract all server-side code:

```javascript
// Script Includes with full code
SN-Query-Table({
  table_name: "sys_script_include",
  query: "sys_scope=<app_sys_id>",
  fields: "name,api_name,script,active,description"
})

// Business Rules with full code
SN-Query-Table({
  table_name: "sys_script",
  query: "sys_scope=<app_sys_id>",
  fields: "name,table,when,script,active,condition"
})
```

### 3.3 Configuration Repository

Capture all configuration data:

```javascript
// System Properties
SN-Query-Table({
  table_name: "sys_properties",
  query: "nameSTARTSWITHai.",
  fields: "name,value,description"
})

// Credentials/Aliases (metadata only - never export secrets!)
SN-Query-Table({
  table_name: "sys_alias",
  query: "sys_scope=<app_sys_id>",
  fields: "name,type,sys_id"
})
```

### 3.4 Repository Structure

Organize local files:

```
/repository/
  ├── /schemas/
  │   └── [table_name].json
  ├── /scripts/
  │   ├── /script_includes/
  │   │   └── [script_name].js
  │   ├── /business_rules/
  │   │   └── [rule_name].js
  │   └── /client_scripts/
  │       └── [script_name].js
  ├── /config/
  │   ├── properties.json
  │   └── aliases.json
  ├── /acls/
  │   └── [table_name]_acls.json
  └── /tests/
      ├── /inline/
      └── /atf/
```

### 3.5 Augmentation Validation

- [ ] All schemas exported and validated
- [ ] All code extracted with syntax verification
- [ ] Configuration data captured
- [ ] ACL rules documented
- [ ] Repository structure organized
- [ ] Version control initialized

---

## Phase 4: Implementation Scripting

**Objective**: Generate and execute implementation scripts using MCP tools OR fix scripts.

### 4.0 Select Execution Mode

Before implementation, confirm your execution mode:

| Mode | When to Use | Output |
|------|-------------|--------|
| **MCP Mode** | MCP server connected | Direct execution via SN-* tools |
| **Fix Script Mode** | MCP unavailable | Scripts saved to `/scripts/implementation/` |

**Fix Script Mode Workflow**:
1. Generate numbered scripts: `01_tables.js`, `02_fields.js`, etc.
2. Present scripts to user for review
3. User approves each script before execution
4. User runs scripts manually in ServiceNow (Scripts > Background)
5. Verify results and proceed

### 4.1 Implementation Order

**CRITICAL**: Follow this order to avoid dependency issues:

```
1. Application Scope (verify set)
2. Update Set (verify set)
3. Tables (parent → child order)
4. Fields (on each table)
5. Choice Values (sys_choice or question_choice)
6. Script Includes (dependencies first)
7. Business Rules (by execution order)
8. Scheduled Jobs
9. ACLs (table → field level)
10. UI Components (last)
```

### 4.2 Batch Operations

**Always batch related operations in single messages:**

```javascript
// GOOD: Multiple parallel operations
// Execute all field additions for a table in one message
SN-Create-Record({ table_name: "sys_dictionary", data: { /* field 1 */ } })
SN-Create-Record({ table_name: "sys_dictionary", data: { /* field 2 */ } })
SN-Create-Record({ table_name: "sys_dictionary", data: { /* field 3 */ } })
// ... up to 10-43 operations per batch

// BAD: Single operations with multiple messages
// Message 1: Create field 1
// Message 2: Create field 2
// (This is 10-100x slower!)
```

### 4.3 Script Templates

Choose templates based on your execution mode:

---

#### MCP Mode Templates

**Table Creation (MCP):**
```javascript
SN-Create-Record({
  table_name: "sys_db_object",
  data: {
    name: "u_ai_new_table",
    label: "AI New Table",
    super_class: "task",  // or appropriate parent
    is_extendable: true,
    create_module: true,
    create_mobile_module: false
  }
})
```

**Field Creation (MCP):**
```javascript
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_ai_new_table",
    element: "u_field_name",
    column_label: "Field Label",
    internal_type: "string",  // reference, boolean, integer, etc.
    max_length: 255,
    mandatory: false,
    active: true
  }
})
```

**Script Include (MCP):**
```javascript
SN-Create-Record({
  table_name: "sys_script_include",
  data: {
    name: "NewScriptInclude",
    api_name: "global.NewScriptInclude",
    client_callable: false,
    active: true,
    script: `var NewScriptInclude = Class.create();
NewScriptInclude.prototype = {
    initialize: function() {
    },

    myMethod: function(param) {
        // Implementation
        return result;
    },

    type: 'NewScriptInclude'
};`
  }
})
```

---

#### Fix Script Mode Templates

Save these to `/scripts/implementation/` and execute in order via Scripts > Background.

**Table Creation (Fix Script) - `02_create_tables.js`:**
```javascript
// Fix Script: Create Tables
// Run in: Scripts > Background
// Prerequisites: Context setup script (01) executed
(function() {
    gs.info('=== Creating Tables ===');

    var tableName = 'u_ai_new_table';
    var tableLabel = 'AI New Table';
    var parentTable = 'task';  // or null for standalone

    // Check if table exists
    var existing = new GlideRecord('sys_db_object');
    existing.addQuery('name', tableName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Table already exists: ' + tableName);
        return;
    }

    // Create table
    var table = new GlideRecord('sys_db_object');
    table.initialize();
    table.name = tableName;
    table.label = tableLabel;
    if (parentTable) {
        var parent = new GlideRecord('sys_db_object');
        parent.addQuery('name', parentTable);
        parent.query();
        if (parent.next()) {
            table.super_class = parent.sys_id;
        }
    }
    table.is_extendable = true;
    table.create_module = true;
    table.create_mobile_module = false;

    var tableSysId = table.insert();
    if (tableSysId) {
        gs.info('SUCCESS: Created table ' + tableName + ' (sys_id: ' + tableSysId + ')');
    } else {
        gs.error('FAILED: Could not create table ' + tableName);
    }
})();
```

**Field Creation (Fix Script) - `03_create_fields.js`:**
```javascript
// Fix Script: Create Fields
// Run in: Scripts > Background
// Prerequisites: Tables created (02)
(function() {
    gs.info('=== Creating Fields ===');

    // Define fields to create
    var fields = [
        {
            table: 'u_ai_new_table',
            element: 'u_field_name',
            label: 'Field Label',
            type: 'string',
            maxLength: 255,
            mandatory: false
        },
        {
            table: 'u_ai_new_table',
            element: 'u_description',
            label: 'Description',
            type: 'string',
            maxLength: 4000,
            mandatory: false
        }
        // Add more fields as needed
    ];

    fields.forEach(function(fieldDef) {
        // Check if field exists
        var existing = new GlideRecord('sys_dictionary');
        existing.addQuery('name', fieldDef.table);
        existing.addQuery('element', fieldDef.element);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Field already exists: ' + fieldDef.table + '.' + fieldDef.element);
            return;
        }

        // Create field
        var field = new GlideRecord('sys_dictionary');
        field.initialize();
        field.name = fieldDef.table;
        field.element = fieldDef.element;
        field.column_label = fieldDef.label;
        field.internal_type = fieldDef.type;
        if (fieldDef.maxLength) {
            field.max_length = fieldDef.maxLength;
        }
        field.mandatory = fieldDef.mandatory || false;
        field.active = true;

        var fieldSysId = field.insert();
        if (fieldSysId) {
            gs.info('SUCCESS: Created field ' + fieldDef.table + '.' + fieldDef.element + ' (sys_id: ' + fieldSysId + ')');
        } else {
            gs.error('FAILED: Could not create field ' + fieldDef.table + '.' + fieldDef.element);
        }
    });

    gs.info('=== Field Creation Complete ===');
})();
```

**Script Include (Fix Script) - `04_create_script_includes.js`:**
```javascript
// Fix Script: Create Script Includes
// Run in: Scripts > Background
// Prerequisites: Tables and fields created
(function() {
    gs.info('=== Creating Script Includes ===');

    var scriptName = 'NewScriptInclude';
    var apiName = 'global.NewScriptInclude';
    var scriptCode = 'var NewScriptInclude = Class.create();\n' +
        'NewScriptInclude.prototype = {\n' +
        '    initialize: function() {\n' +
        '        this.LOG_SOURCE = "NewScriptInclude";\n' +
        '    },\n' +
        '\n' +
        '    myMethod: function(param) {\n' +
        '        try {\n' +
        '            // Implementation\n' +
        '            return { success: true, data: null };\n' +
        '        } catch (e) {\n' +
        '            gs.error(this.LOG_SOURCE + ".myMethod: " + e.message);\n' +
        '            return { success: false, error: e.message };\n' +
        '        }\n' +
        '    },\n' +
        '\n' +
        '    type: "NewScriptInclude"\n' +
        '};';

    // Check if exists
    var existing = new GlideRecord('sys_script_include');
    existing.addQuery('name', scriptName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Script Include already exists: ' + scriptName);
        return;
    }

    // Create Script Include
    var si = new GlideRecord('sys_script_include');
    si.initialize();
    si.name = scriptName;
    si.api_name = apiName;
    si.client_callable = false;
    si.active = true;
    si.script = scriptCode;

    var siSysId = si.insert();
    if (siSysId) {
        gs.info('SUCCESS: Created Script Include ' + scriptName + ' (sys_id: ' + siSysId + ')');
    } else {
        gs.error('FAILED: Could not create Script Include ' + scriptName);
    }
})();
```

**Business Rule (Fix Script) - `05_create_business_rules.js`:**
```javascript
// Fix Script: Create Business Rules
// Run in: Scripts > Background
(function() {
    gs.info('=== Creating Business Rules ===');

    var ruleName = 'My After Insert Rule';
    var tableName = 'u_ai_new_table';
    var brScript = '(function executeRule(current, previous) {\n' +
        '    try {\n' +
        '        // Your logic here\n' +
        '        gs.info("After insert on " + current.getTableName() + ": " + current.sys_id);\n' +
        '    } catch (e) {\n' +
        '        gs.error("BR-MyRule: " + e.message);\n' +
        '    }\n' +
        '})(current, previous);';

    // Check if exists
    var existing = new GlideRecord('sys_script');
    existing.addQuery('name', ruleName);
    existing.addQuery('collection', tableName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Business Rule already exists: ' + ruleName);
        return;
    }

    // Create Business Rule
    var br = new GlideRecord('sys_script');
    br.initialize();
    br.name = ruleName;
    br.collection = tableName;
    br.when = 'after';
    br.action_insert = true;
    br.action_update = false;
    br.action_delete = false;
    br.action_query = false;
    br.order = 100;
    br.active = true;
    br.script = brScript;

    var brSysId = br.insert();
    if (brSysId) {
        gs.info('SUCCESS: Created Business Rule ' + ruleName + ' (sys_id: ' + brSysId + ')');
    } else {
        gs.error('FAILED: Could not create Business Rule ' + ruleName);
    }
})();
```

**ACLs (Fix Script) - `06_create_acls.js`:**
```javascript
// Fix Script: Create ACLs
// Run in: Scripts > Background
(function() {
    gs.info('=== Creating ACLs ===');

    var tableName = 'u_ai_new_table';
    var operations = ['read', 'create', 'write', 'delete'];

    operations.forEach(function(operation) {
        var aclName = tableName;

        // Check if exists
        var existing = new GlideRecord('sys_security_acl');
        existing.addQuery('name', aclName);
        existing.addQuery('operation', operation);
        existing.query();
        if (existing.hasNext()) {
            gs.info('ACL already exists: ' + aclName + ' (' + operation + ')');
            return;
        }

        // Create ACL
        var acl = new GlideRecord('sys_security_acl');
        acl.initialize();
        acl.name = aclName;
        acl.operation = operation;
        acl.admin_overrides = true;
        acl.active = true;
        acl.description = operation.charAt(0).toUpperCase() + operation.slice(1) + ' access for ' + tableName;

        var aclSysId = acl.insert();
        if (aclSysId) {
            gs.info('SUCCESS: Created ACL ' + aclName + ' (' + operation + ') (sys_id: ' + aclSysId + ')');
        } else {
            gs.error('FAILED: Could not create ACL ' + aclName + ' (' + operation + ')');
        }
    });

    gs.info('=== ACL Creation Complete ===');
})();
```
```

### 4.4 Sys_id Tracking

**CRITICAL**: Save all sys_ids for dependent operations:

```javascript
// Track created records
const createdRecords = {
  tables: {
    "u_ai_new_table": "sys_id_from_create_response"
  },
  fields: {
    "u_ai_new_table.u_field_name": "sys_id_from_create_response"
  },
  scripts: {
    "NewScriptInclude": "sys_id_from_create_response"
  }
};
```

### 4.5 Implementation Checkpoints

After each batch:

1. **Verify Update Set Capture**
   ```javascript
   SN-Query-Table({
     table_name: "sys_update_xml",
     query: "update_set=<update_set_sys_id>^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
     fields: "name,type,target_name"
   })
   ```

2. **Count Expected vs Actual**
   - Expected records: [count from batch]
   - Actual records: [count from query]
   - Discrepancy: [investigate if any]

3. **Spot Check Records**
   ```javascript
   SN-Get-Record({
     table_name: "<table>",
     sys_id: "<sys_id>"
   })
   ```

---

## Phase 5: Validation & Refinement

**Objective**: Verify implementation correctness and refine as needed.

### 5.1 Schema Validation

```javascript
// Verify table structure matches specification
SN-Discover-Table-Schema({
  table_name: "<implemented_table>",
  include_relationships: true
})

// Compare against specification
// - All fields present?
// - Correct types?
// - Correct labels?
// - Correct mandatory flags?
```

### 5.2 Script Validation

```javascript
// Execute background script to validate syntax
SN-Execute-Background-Script({
  script: `
    try {
      var si = new global.NewScriptInclude();
      gs.info('Script Include instantiation: SUCCESS');

      // Test method calls
      var result = si.myMethod('test');
      gs.info('Method execution: ' + (result ? 'SUCCESS' : 'FAILED'));
    } catch (e) {
      gs.error('Validation FAILED: ' + e.message);
    }
  `,
  execution_method: "trigger"
})
```

### 5.3 ACL Validation

Test access for each role:

```javascript
// Impersonate user with specific role
SN-Execute-Background-Script({
  script: `
    var impUser = gs.getUser();
    impUser.setImpersonating('<user_sys_id>');

    var gr = new GlideRecord('<table>');
    gr.addQuery('sys_id', '<test_record>');
    gr.query();

    gs.info('Can read: ' + gr.hasNext());
    gs.info('Can write: ' + gr.canWrite());
    gs.info('Can delete: ' + gr.canDelete());

    impUser.setImpersonating(null);
  `,
  execution_method: "trigger"
})
```

### 5.4 Integration Validation

```javascript
// Test REST endpoint
SN-Execute-Background-Script({
  script: `
    var rm = new sn_ws.RESTMessageV2('AI_Azure_OpenAI', 'default');
    rm.setStringParameterNoEscape('deployment', 'gpt-4');
    rm.setRequestBody(JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }));

    var response = rm.execute();
    gs.info('Status: ' + response.getStatusCode());
    gs.info('Body: ' + response.getBody().substring(0, 500));
  `,
  execution_method: "trigger"
})
```

### 5.5 Refinement Loop

```
┌─────────────────────────────────────────────┐
│            REFINEMENT CYCLE                 │
├─────────────────────────────────────────────┤
│                                             │
│   Execute Test ──▶ Analyze Results          │
│        ▲                │                   │
│        │                ▼                   │
│   Apply Fix ◀── Identify Issue              │
│        │                │                   │
│        │                ▼                   │
│        └────── Document Finding             │
│                                             │
│   Exit when: All tests pass                 │
│   Max iterations: 5 per issue               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Phase 6: Automated Testing (Inline)

**Objective**: Execute comprehensive tests using background scripts before ATF conversion.

### 6.1 Test Categories

1. **Unit Tests**: Individual function/method validation
2. **Integration Tests**: Cross-component interaction
3. **Security Tests**: ACL and role verification
4. **Performance Tests**: Response time and resource usage
5. **Edge Case Tests**: Boundary conditions and error handling

### 6.2 Unit Test Template

```javascript
SN-Execute-Background-Script({
  script: `
    // ============================================
    // UNIT TEST: [Component Name] - [Test Name]
    // ============================================

    var TestRunner = {
      results: [],

      assertEqual: function(actual, expected, message) {
        var passed = (actual === expected);
        this.results.push({
          test: message,
          passed: passed,
          actual: actual,
          expected: expected
        });
        return passed;
      },

      assertTrue: function(condition, message) {
        this.results.push({
          test: message,
          passed: condition,
          actual: condition,
          expected: true
        });
        return condition;
      },

      report: function() {
        var passed = 0, failed = 0;
        this.results.forEach(function(r) {
          if (r.passed) passed++;
          else failed++;
          gs.info((r.passed ? '✓' : '✗') + ' ' + r.test);
          if (!r.passed) {
            gs.info('  Expected: ' + r.expected);
            gs.info('  Actual: ' + r.actual);
          }
        });
        gs.info('========================================');
        gs.info('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
        return failed === 0;
      }
    };

    // ----- TEST CASES -----

    // Test 1: Basic instantiation
    (function() {
      var si = new global.ClevelandAI();
      TestRunner.assertTrue(si !== null, 'ClevelandAI instantiation');
    })();

    // Test 2: Method returns expected type
    (function() {
      var si = new global.ClevelandAI();
      var result = si.formatMessages([]);
      TestRunner.assertTrue(Array.isArray(result), 'formatMessages returns array');
    })();

    // Test 3: Error handling
    (function() {
      var si = new global.ClevelandAI();
      var result = si.processInvalidInput(null);
      TestRunner.assertEqual(result.error, true, 'Null input returns error');
    })();

    // ----- REPORT -----
    TestRunner.report();
  `,
  execution_method: "trigger"
})
```

### 6.3 Integration Test Template

```javascript
SN-Execute-Background-Script({
  script: `
    // ============================================
    // INTEGRATION TEST: [Flow Name]
    // ============================================

    gs.info('Starting integration test...');

    // Setup test data
    var testConversation = new GlideRecord('u_ai_conversation');
    testConversation.initialize();
    testConversation.u_session_id = 'TEST-' + gs.generateGUID();
    testConversation.u_user = gs.getUserID();
    var convSysId = testConversation.insert();

    try {
      // Test step 1: Create message
      var testMessage = new GlideRecord('u_ai_message');
      testMessage.initialize();
      testMessage.u_conversation = convSysId;
      testMessage.u_role = 'user';
      testMessage.u_content = 'Test message';
      var msgSysId = testMessage.insert();
      gs.info('Step 1 - Message created: ' + (msgSysId ? 'PASS' : 'FAIL'));

      // Test step 2: Invoke AI processing
      var ai = new global.ClevelandAI();
      var response = ai.processMessage(convSysId, 'Test prompt');
      gs.info('Step 2 - AI response received: ' + (response ? 'PASS' : 'FAIL'));

      // Test step 3: Verify response saved
      var respMsg = new GlideRecord('u_ai_message');
      respMsg.addQuery('u_conversation', convSysId);
      respMsg.addQuery('u_role', 'assistant');
      respMsg.query();
      gs.info('Step 3 - Response saved: ' + (respMsg.hasNext() ? 'PASS' : 'FAIL'));

    } finally {
      // Cleanup test data
      var cleanup = new GlideRecord('u_ai_conversation');
      if (cleanup.get(convSysId)) {
        cleanup.deleteRecord();
        gs.info('Cleanup: Test data removed');
      }
    }

    gs.info('Integration test complete');
  `,
  execution_method: "trigger"
})
```

### 6.4 Security Test Template

```javascript
SN-Execute-Background-Script({
  script: `
    // ============================================
    // SECURITY TEST: ACL Verification
    // ============================================

    var roles = [
      { name: 'admin', sys_id: '<admin_user_sys_id>' },
      { name: 'itil', sys_id: '<itil_user_sys_id>' },
      { name: 'user', sys_id: '<basic_user_sys_id>' }
    ];

    var tables = ['u_ai_provider', 'u_ai_model', 'u_ai_conversation'];

    roles.forEach(function(role) {
      gs.info('Testing role: ' + role.name);

      // Note: In production, use sys_user_has_role or proper impersonation
      tables.forEach(function(table) {
        var gr = new GlideRecord(table);
        gr.setLimit(1);
        gr.query();

        gs.info('  ' + table + ':');
        gs.info('    canRead: ' + gr.canRead());
        gs.info('    canCreate: ' + gr.canCreate());
        gs.info('    canWrite: ' + gr.canWrite());
        gs.info('    canDelete: ' + gr.canDelete());
      });
    });
  `,
  execution_method: "trigger"
})
```

### 6.5 Test Results Tracking

Maintain test execution log:

| Test ID | Category | Name | Status | Duration | Notes |
|---------|----------|------|--------|----------|-------|
| UT-001 | Unit | ClevelandAI instantiation | PASS | 45ms | |
| UT-002 | Unit | formatMessages array | PASS | 23ms | |
| IT-001 | Integration | Full conversation flow | PASS | 2.3s | |
| ST-001 | Security | Admin ACL access | PASS | 156ms | |

---

## Phase 7: ATF Conversion

**Objective**: Convert validated inline tests to ServiceNow Automated Test Framework (ATF) for CI/CD integration.

### 7.1 ATF Structure

```
ATF Suite: [Application Name] Tests
├── Test: Unit Tests
│   ├── Step: Server Script - ClevelandAI instantiation
│   ├── Step: Server Script - formatMessages validation
│   └── ...
├── Test: Integration Tests
│   ├── Step: Create Record - Test conversation
│   ├── Step: Server Script - Process message
│   ├── Step: Assert Record Values - Response saved
│   └── Step: Delete Record - Cleanup
└── Test: Security Tests
    ├── Step: Impersonate User - Admin
    ├── Step: Assert ACL - Can read u_ai_provider
    └── ...
```

### 7.2 Create ATF Test Suite

```javascript
SN-Create-Record({
  table_name: "sys_atf_test_suite",
  data: {
    name: "ClevelandAI Test Suite",
    description: "Comprehensive tests for ClevelandAI application",
    active: true,
    sys_scope: "<app_sys_id>"
  }
})
```

### 7.3 Create ATF Test

```javascript
SN-Create-Record({
  table_name: "sys_atf_test",
  data: {
    name: "ClevelandAI Unit Tests",
    description: "Unit tests for core ClevelandAI functions",
    active: true,
    test_suite: "<suite_sys_id>",
    sys_scope: "<app_sys_id>"
  }
})
```

### 7.4 Create ATF Test Steps

**Server Script Step:**
```javascript
SN-Create-Record({
  table_name: "sys_atf_step",
  data: {
    test: "<test_sys_id>",
    order: 100,
    active: true,
    step_config: "<server_script_config_sys_id>",
    inputs: JSON.stringify({
      script: `
        var ai = new global.ClevelandAI();
        var result = ai.formatMessages([]);

        if (!Array.isArray(result)) {
          throw new Error('Expected array, got ' + typeof result);
        }

        outputs.status = 'success';
        outputs.message = 'formatMessages returns array';
      `
    })
  }
})
```

**Record Assertion Step:**
```javascript
// Note: ATF step variables use ${} syntax for variable references
// The sys_id is passed from previous step via ATF variable binding
SN-Create-Record({
  table_name: "sys_atf_step",
  data: {
    test: "<test_sys_id>",
    order: 200,
    active: true,
    step_config: "<assert_record_values_config_sys_id>",
    inputs: JSON.stringify({
      table: "u_ai_message",
      sys_id_variable: "step_100_record_sys_id",  // Reference previous step output
      assertions: [
        { field: "u_role", operator: "is", value: "assistant" },
        { field: "u_content", operator: "is not empty" }
      ]
    })
  }
})
```

### 7.5 ATF Execution

```javascript
// Run test suite
SN-Execute-Background-Script({
  script: `
    var runner = new sn_atf.ATFTestRunner();
    var suiteId = '<suite_sys_id>';

    var result = runner.runTestSuite(suiteId);

    gs.info('Suite execution ID: ' + result.execution_id);
    gs.info('Status: ' + result.status);
  `,
  execution_method: "trigger"
})
```

### 7.6 ATF Best Practices

1. **Isolate test data**: Always create and cleanup test records
2. **Use variables**: Pass data between steps using `{{step_n.output}}`
3. **Order matters**: Set explicit order values (100, 200, 300...)
4. **Group logically**: One test per feature area
5. **Include rollback**: Add cleanup steps even if test fails

---

## Phase 8: Documentation & Knowledge Transfer

**Objective**: Create comprehensive documentation for support, users, and future development.

### 8.1 Knowledge Article Types

| Type | Audience | Purpose |
|------|----------|---------|
| User Guide | End Users | How to use features |
| Admin Guide | Administrators | Configuration and setup |
| Technical Reference | Developers | API and integration details |
| Troubleshooting | Support | Common issues and solutions |
| Release Notes | All | What's new/changed |

### 8.2 User Guide Template

```markdown
# [Feature Name] User Guide

## Overview
[Brief description of what the feature does and its benefits]

## Prerequisites
- [Required role]
- [Required configuration]

## How to Use

### Step 1: [Action]
[Description with screenshot/path]

### Step 2: [Action]
[Description with screenshot/path]

## Tips and Best Practices
- [Tip 1]
- [Tip 2]

## Frequently Asked Questions

**Q: [Common question]?**
A: [Answer]

## Related Articles
- [Link to related KB]
```

### 8.3 Technical Reference Template

```markdown
# [Component Name] Technical Reference

## Overview
[Technical description]

## Architecture
[Diagram or description of component architecture]

## API Reference

### [Method Name]
**Signature:** `methodName(param1, param2)`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | String | Yes | [Description] |
| param2 | Object | No | [Description] |

**Returns:** `{type}` - [Description]

**Example:**
\`\`\`javascript
var result = new Component().methodName('value', { opt: true });
\`\`\`

## Configuration

### System Properties
| Property | Default | Description |
|----------|---------|-------------|
| ai.property.name | value | [Description] |

## Integration Points
- [Integration 1]
- [Integration 2]

## Error Codes
| Code | Message | Resolution |
|------|---------|------------|
| AI001 | [Message] | [How to fix] |
```

### 8.4 Troubleshooting Guide Template

```markdown
# [Feature] Troubleshooting Guide

## Common Issues

### Issue: [Problem Description]

**Symptoms:**
- [What user sees]

**Cause:**
[Root cause explanation]

**Resolution:**
1. [Step 1]
2. [Step 2]

**Prevention:**
[How to avoid in future]

---

### Issue: [Another Problem]
[Same format...]

## Diagnostic Scripts

### Check [Component] Status
\`\`\`javascript
// Run in Scripts - Background
var gr = new GlideRecord('table');
gr.query();
gs.info('Count: ' + gr.getRowCount());
\`\`\`

## Escalation Path
1. L1: [Basic troubleshooting]
2. L2: [Advanced diagnostics]
3. L3: [Development team]

## Log Locations
- System Logs: [Filter criteria]
- Application Logs: [Filter criteria]
```

### 8.5 Create Knowledge Articles in ServiceNow

```javascript
SN-Create-Record({
  table_name: "kb_knowledge",
  data: {
    short_description: "ClevelandAI User Guide",
    text: "<full_article_html>",
    kb_knowledge_base: "<kb_sys_id>",
    kb_category: "<category_sys_id>",
    workflow_state: "draft",
    valid_to: "2099-12-31"
  }
})
```

### 8.6 Documentation Checklist

- [ ] User Guide - Getting Started
- [ ] User Guide - Feature walkthrough
- [ ] Admin Guide - Installation
- [ ] Admin Guide - Configuration
- [ ] Technical Reference - API documentation
- [ ] Technical Reference - Data model
- [ ] Troubleshooting Guide
- [ ] Release Notes
- [ ] Architecture diagrams
- [ ] Integration specifications

---

## MCP Tool Reference

### Quick Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `SN-Set-Current-Application` | Set scope | First, before any changes |
| `SN-Set-Update-Set` | Set update set | Second, before any changes |
| `SN-Get-Current-Update-Set` | Verify context | After setting, periodically |
| `SN-Query-Table` | Read records | Discovery, validation |
| `SN-Create-Record` | Insert records | Implementation |
| `SN-Update-Record` | Modify records | Updates, fixes |
| `SN-Get-Record` | Read single record | Validation, debugging |
| `SN-Discover-Table-Schema` | Get full schema | Discovery, planning |
| `SN-Execute-Background-Script` | Run GlideScript | Testing, complex operations |
| `SN-List-Update-Sets` | Find update sets | Setup, recovery |
| `SN-Move-Records-To-Update-Set` | Recovery | Fix update set issues |
| `SN-Get-Table-Schema` | Basic schema | Quick reference |
| `SN-Natural-Language-Search` | Find anything | Discovery |

### Batch Operation Patterns

```javascript
// Pattern 1: Parallel Creation (Independent Records)
SN-Create-Record({ table_name: "table1", data: {...} })
SN-Create-Record({ table_name: "table1", data: {...} })
SN-Create-Record({ table_name: "table1", data: {...} })
// Execute all in ONE message - parallel processing

// Pattern 2: Sequential Creation (Dependent Records)
// Message 1: Create parent
SN-Create-Record({ table_name: "parent_table", data: {...} })
// Get sys_id from response

// Message 2: Create children using parent sys_id
SN-Create-Record({ table_name: "child_table", data: { parent: "<sys_id>" } })
SN-Create-Record({ table_name: "child_table", data: { parent: "<sys_id>" } })

// Pattern 3: Bulk Update
// All independent updates in one message
SN-Update-Record({ table_name: "t", sys_id: "id1", data: {...} })
SN-Update-Record({ table_name: "t", sys_id: "id2", data: {...} })
SN-Update-Record({ table_name: "t", sys_id: "id3", data: {...} })
```

---

## Best Practices

### Development Principles

1. **MCP-First**: Use MCP tools as primary method (10-100x faster)
2. **Batch Everything**: 5-43 operations per message
3. **Verify Always**: Check update set capture after every batch
4. **Test Early**: Validate after each phase, not at the end
5. **Track Sys_ids**: Save all created record IDs for dependencies

### Code Standards

1. **Max 500 lines per file**
2. **No hardcoded credentials or URLs**
3. **Explicit error handling**
4. **Meaningful variable names**
5. **Comments for complex logic only**

### Security Standards

1. **Never export credentials**
2. **Test ACLs for each role**
3. **Use sys_alias for external connections**
4. **Validate all user input**
5. **Log security-relevant events**

### Performance Standards

1. **Index frequently queried fields**
2. **Use GlideAggregate for counts**
3. **Limit query results appropriately**
4. **Exit early in business rules (.changes())**
5. **Avoid full table scans in scheduled jobs**

---

## Common Pitfalls

### Pitfall 1: Records in Wrong Update Set

**Cause**: Forgot to set update set before changes
**Detection**: Query sys_update_xml for "Default" update set
**Recovery**:
```javascript
SN-Move-Records-To-Update-Set({
  update_set_id: "<correct_update_set>",
  source_update_set: "Default"
})
```
**Prevention**: Always verify update set before starting

### Pitfall 2: Variable Types Confusion

**Issue**: Using wrong type code for catalog variables
**Reference**:
- Type 1 = Choice (radio buttons)
- Type 5 = Select Box (dropdown)
- Type 6 = Multi-line Text
- Type 8 = Reference
- Type 16 = Single Line Text
**Prevention**: Check SN-Get-Table-Schema first

### Pitfall 3: Choice Value Tables

**Issue**: Creating choices in wrong table
**Rule**:
- Table fields → `sys_choice`
- Catalog variables → `question_choice`
**Prevention**: Identify context before creating

### Pitfall 4: UI Policy Actions via REST

**Issue**: REST API cannot link UI Policy Actions
**Workaround**: Use SN-Execute-Background-Script with setValue()
**Format**: `catalog_variable = 'IO:<variable_sys_id>'`

### Pitfall 5: GPT-5/o1 Token Parameter

**Issue**: New models use different parameter name
**Old**: `max_tokens`
**New**: `max_completion_tokens`
**Prevention**: Check model documentation

### Pitfall 6: Single-Message Operations

**Issue**: One operation per message (very slow)
**Solution**: Batch 5-43 operations per message
**Benefit**: 10-100x performance improvement

---

## Templates

### Project Initialization Checklist

```markdown
## Project: [Name]
## Date: [Date]
## Developer: [Name]

### Pre-Development
- [ ] Application sys_id obtained: _______________
- [ ] Update set created/identified: _______________
- [ ] User groups identified: _______________
- [ ] Existing schemas discovered: _______________
- [ ] Dependencies mapped: _______________

### Development Phases
- [ ] Phase 1: Discovery complete
- [ ] Phase 2: Requirements refined
- [ ] Phase 3: Repository built
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed
- [ ] Phase 6: Inline tests passed
- [ ] Phase 7: ATF tests created
- [ ] Phase 8: Documentation complete

### Sign-Off
- [ ] Code review complete
- [ ] Security review complete
- [ ] Performance validated
- [ ] Documentation reviewed
- [ ] Ready for deployment
```

### Daily Development Log

```markdown
## Date: [Date]

### Completed
- [Task 1]
- [Task 2]

### In Progress
- [Task 3] - [Status/Blocker]

### Issues Encountered
- [Issue]: [Resolution or pending]

### Tomorrow
- [Planned task 1]
- [Planned task 2]

### Sys_ids Created Today
| Component | Sys_id | Notes |
|-----------|--------|-------|
| [Name] | [ID] | [Notes] |
```

### Test Execution Report

```markdown
## Test Execution Report
## Date: [Date]
## Version: [Version]

### Summary
| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Unit | | | | |
| Integration | | | | |
| Security | | | | |
| Performance | | | | |
| **Total** | | | | |

### Failed Tests
| Test ID | Name | Error | Notes |
|---------|------|-------|-------|
| | | | |

### Recommendations
- [Recommendation 1]
- [Recommendation 2]

### Sign-Off
- [ ] All critical tests passed
- [ ] Known failures documented
- [ ] Ready for next phase
```

---

## Framework Supporting Documents

For detailed guidance, see these companion documents:

| Document | Description |
|----------|-------------|
| [ServiceNow-Agent-Personas.md](docs/ServiceNow-Agent-Personas.md) | Role-based AI personas (Analyst, Architect, Developer, QA, Security, Tech Writer, Release Manager) with expertise, responsibilities, and handoff triggers |
| [ServiceNow-Development-Workflows.md](docs/ServiceNow-Development-Workflows.md) | Detailed workflow specifications with entry/exit criteria for each development phase |
| [Copilot-Prompt-Templates.md](docs/Copilot-Prompt-Templates.md) | Copy-paste ready prompts for GitHub Copilot covering context setup, requirements, design, implementation, testing, troubleshooting, and documentation |
| [Validation-Checklists.md](docs/Validation-Checklists.md) | Quality gate checklists for each phase (CL-01 through CL-06) with verification scripts |
| [Quick-Reference-Cards.md](docs/Quick-Reference-Cards.md) | Concise MCP command snippets for common operations |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-02-03 | AI Framework | Added agent personas, workflows, Copilot templates, validation checklists, quick reference |
| 1.0 | 2025-02-03 | AI Framework | Initial 8-phase process guide |

---

## References

- [ServiceNow Developer Documentation](https://developer.servicenow.com/)
- [ServiceNow ATF Documentation](https://docs.servicenow.com/bundle/washingtondc-application-development/page/administer/auto-test-framework/concept/automated-test-framework.html)
- [BMAD Framework](https://github.com/bmadcode/BMAD-METHOD) - Inspiration for agent-based workflow patterns
- Project-specific: `ClevelandAI Gateway - TDD.pdf`

---

## Getting Help

If you get stuck:
1. Check the [Copilot Templates](docs/Copilot-Prompt-Templates.md) for ready-to-use prompts
2. Review the [Validation Checklists](docs/Validation-Checklists.md) to see what might be missing
3. Use the troubleshooting prompts to diagnose issues
4. Consult the relevant [Agent Persona](docs/ServiceNow-Agent-Personas.md) for specialized expertise

---

*This framework is a living document. Update it as new patterns, tools, or lessons are discovered.*
