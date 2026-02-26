# ServiceNow Development Workflows

> Structured workflows with clear entry criteria, steps, exit criteria, and quality gates. Designed for AI-assisted development with GitHub Copilot.

## Execution Mode Support

This workflow supports **two execution modes**:

| Mode | When to Use | Output Format |
|------|-------------|---------------|
| **MCP Mode** | MCP server connected | Direct SN-* tool execution |
| **Fix Script Mode** | MCP unavailable | Scripts saved to `/scripts/` for manual execution |

**Check Mode First**: Before starting any workflow, verify MCP connectivity with `SN-Get-Current-Instance()`.

## Approval Gates (CRITICAL)

**Every workflow phase requires explicit user approval before proceeding.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPROVAL WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. AI completes phase work                                                  │
│           │                                                                  │
│           ▼                                                                  │
│  2. AI saves deliverable to designated location                              │
│           │                                                                  │
│           ▼                                                                  │
│  3. AI presents summary and asks:                                            │
│     "Please review [deliverable]. Reply 'approved' to proceed               │
│      or provide feedback."                                                   │
│           │                                                                  │
│           ▼                                                                  │
│  4. User reviews deliverable                                                 │
│           │                                                                  │
│      ┌────┴────┐                                                             │
│      │         │                                                             │
│      ▼         ▼                                                             │
│  APPROVED   FEEDBACK ──▶ AI updates deliverable ──▶ Return to step 3        │
│      │                                                                       │
│      ▼                                                                       │
│  5. Proceed to next phase                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SERVICENOW DEVELOPMENT WORKFLOWS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WF-01: Discovery    ──▶ APPROVAL ──▶ Discovery report, Schema inventory    │
│           │                                                                  │
│           ▼                                                                  │
│  WF-02: Requirements ──▶ APPROVAL ──▶ User stories, Acceptance criteria     │
│           │                                                                  │
│           ▼                                                                  │
│  WF-03: Design       ──▶ APPROVAL ──▶ Architecture, Data model, ADRs        │
│           │                                                                  │
│           ▼                                                                  │
│  WF-04: Implementation ▶ APPROVAL ──▶ Code, Configuration, Update set       │
│           │                                                                  │
│           ▼                                                                  │
│  WF-05: Testing      ──▶ APPROVAL ──▶ Test results, Defect fixes            │
│           │                                                                  │
│           ▼                                                                  │
│  WF-06: Security     ──▶ APPROVAL ──▶ Security approval, ACL validation     │
│           │                                                                  │
│           ▼                                                                  │
│  WF-07: Documentation ─▶ APPROVAL ──▶ User guide, Tech docs, KB articles    │
│           │                                                                  │
│           ▼                                                                  │
│  WF-08: Release      ──▶ APPROVAL ──▶ Production deployment                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WF-01: Discovery Workflow

**Purpose**: Build complete understanding of current state before making changes.

### Entry Criteria
- [ ] Project/feature request received
- [ ] Stakeholders identified
- [ ] ServiceNow instance access confirmed
- [ ] Application scope identified

### Steps

#### Step 1: Set Context
```javascript
// ALWAYS start here
SN-Get-Current-Instance()
SN-Set-Current-Application({ app_sys_id: "<app_sys_id>" })
```

#### Step 2: Inventory Tables
```javascript
SN-Query-Table({
  table_name: "sys_db_object",
  query: "sys_scope=<app_sys_id>",
  fields: "name,label,sys_id,super_class"
})
```

**Record output as**:
```markdown
## Table Inventory

| Table Name | Label | Parent | Purpose |
|------------|-------|--------|---------|
| u_table_1 | Table 1 | task | [describe] |
```

#### Step 3: Discover Schemas
```javascript
// For each relevant table
SN-Discover-Table-Schema({
  table_name: "<table>",
  include_relationships: true,
  include_choices: true
})
```

**Record output as**: Save to `/schemas/<table_name>.json`

#### Step 4: Inventory Scripts
```javascript
// Script Includes
SN-Query-Table({
  table_name: "sys_script_include",
  query: "sys_scope=<app_sys_id>",
  fields: "name,api_name,client_callable,active,description"
})

// Business Rules
SN-Query-Table({
  table_name: "sys_script",
  query: "sys_scope=<app_sys_id>",
  fields: "name,table,when,active,order"
})
```

#### Step 5: Map Dependencies
```javascript
// Find references TO key tables
SN-Query-Table({
  table_name: "sys_dictionary",
  query: "reference=<table>",
  fields: "name,element,column_label"
})
```

### Exit Criteria
- [ ] All application tables documented
- [ ] All Script Includes cataloged
- [ ] All Business Rules mapped
- [ ] Dependencies identified
- [ ] Discovery report created

### Output Artifacts
1. `discovery-report.md` - Summary of findings
2. `/schemas/*.json` - Table schemas
3. `dependency-map.md` - Relationship diagram

### Quality Gate
**Reviewer**: SN Architect
**Checklist**:
- [ ] No tables missed
- [ ] Relationships accurate
- [ ] Dependencies complete

---

## WF-02: Requirements Workflow

**Purpose**: Transform business needs into testable specifications.

### Entry Criteria
- [ ] Discovery workflow complete
- [ ] Business stakeholder available
- [ ] Problem statement defined

### Steps

#### Step 1: Elicit Requirements
Interview stakeholders using:
```markdown
## Requirements Gathering Questions

1. What problem are we solving?
2. Who are the users? What are their roles?
3. What do users need to DO? (capabilities)
4. What data do they need to SEE? (information)
5. What are the success criteria?
6. What are the constraints (timeline, budget, technical)?
7. What happens if this fails? (error scenarios)
8. What existing processes does this affect?
```

#### Step 2: Create User Stories
For each capability:
```markdown
## US-[NNN]: [Title]

**As a** [role]
**I want** [capability]
**So that** [business value]

### Acceptance Criteria
1. **Given** [precondition]
   **When** [action]
   **Then** [expected result]

2. **Given** [precondition]
   **When** [action]
   **Then** [expected result]

### Technical Notes
- Affected tables: [list]
- Affected scripts: [list]
- Security requirements: [ACL needs]

### Test Scenarios
- **Happy path**: [description]
- **Edge case**: [description]
- **Error case**: [description]
```

#### Step 3: Build Traceability Matrix
```markdown
## Requirements Traceability Matrix

| Req ID | User Story | Component | Test Case | Priority | Status |
|--------|------------|-----------|-----------|----------|--------|
| REQ-001 | US-001 | ClevelandAI.js | TC-001 | High | Draft |
```

#### Step 4: Validate with Stakeholder
- Review each user story
- Confirm acceptance criteria
- Prioritize stories

### Exit Criteria
- [ ] All requirements captured as user stories
- [ ] Acceptance criteria defined for each story
- [ ] Test scenarios identified
- [ ] Stakeholder sign-off obtained
- [ ] Traceability matrix complete

### Output Artifacts
1. `user-stories.md` - All user stories
2. `traceability-matrix.md` - Requirements tracking
3. `requirements-signoff.md` - Stakeholder approval

### Quality Gate
**Reviewer**: Business Stakeholder + SN Analyst
**Checklist**:
- [ ] All stories have acceptance criteria
- [ ] Stories are testable
- [ ] No ambiguous requirements

---

## WF-03: Design Workflow

**Purpose**: Create technical design that satisfies requirements.

### Entry Criteria
- [ ] Requirements workflow complete
- [ ] User stories approved
- [ ] Technical constraints understood

### Steps

#### Step 1: Design Data Model
```markdown
## Data Model Design

### New Tables
| Table | Purpose | Parent | Fields |
|-------|---------|--------|--------|
| u_new_table | [purpose] | [parent] | [count] |

### New Fields (Existing Tables)
| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| [table] | u_field | [type] | [purpose] |

### Relationships
[Diagram or description]
```

#### Step 2: Design Scripts
```markdown
## Script Design

### Script Includes
| Name | Purpose | Methods | Client Callable |
|------|---------|---------|-----------------|
| NewScript | [purpose] | method1(), method2() | No |

### Business Rules
| Name | Table | When | Purpose |
|------|-------|------|---------|
| NewRule | [table] | after insert | [purpose] |
```

#### Step 3: Design Security
```markdown
## Security Design

### Roles
| Role | Description | Includes |
|------|-------------|----------|
| x_app.user | Basic access | itil |

### ACLs
| Table | Operation | Role | Condition |
|-------|-----------|------|-----------|
| u_table | read | x_app.user | None |
| u_table | write | x_app.admin | [condition] |
```

#### Step 4: Create Architecture Decision Records
For significant decisions:
```markdown
## ADR-[NNN]: [Decision Title]

### Status
Proposed

### Context
[Problem/situation requiring decision]

### Decision
[The choice made]

### Consequences
- Positive: [benefits]
- Negative: [tradeoffs]
- Risks: [risks and mitigations]

### Alternatives Considered
1. [Alternative]: [why rejected]
```

### Exit Criteria
- [ ] Data model designed
- [ ] Scripts designed
- [ ] Security model designed
- [ ] ADRs created for key decisions
- [ ] Design reviewed

### Output Artifacts
1. `data-model.md` - Table and field designs
2. `script-design.md` - Script specifications
3. `security-design.md` - ACL and role design
4. `adrs/*.md` - Architecture decision records

### Quality Gate
**Reviewer**: SN Architect + SN Security Reviewer
**Checklist**:
- [ ] Design satisfies all requirements
- [ ] Security model adequate
- [ ] Performance considered
- [ ] Upgrade-safe patterns used

---

## WF-04: Implementation Workflow

**Purpose**: Build the solution according to design.

### Entry Criteria
- [ ] Design workflow complete
- [ ] Design approved
- [ ] Update set created
- [ ] Development instance available
- [ ] **Execution mode determined (MCP or Fix Script)**

### Steps

#### Step 0: Determine Execution Mode
```javascript
// Test MCP connectivity
SN-Get-Current-Instance()
```

| Result | Mode | Proceed With |
|--------|------|--------------|
| ✅ Success | MCP Mode | Direct SN-* commands |
| ❌ Error | Fix Script Mode | Generate scripts to `/scripts/implementation/` |

---

#### Step 1: Set Context (CRITICAL)

**MCP Mode:**
```javascript
SN-Set-Current-Application({ app_sys_id: "<app_sys_id>" })
SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
SN-Get-Current-Update-Set()  // VERIFY!
```

**Fix Script Mode:**
Generate `/scripts/implementation/01_context_setup.js`:
```javascript
(function() {
    var appSysId = '<app_sys_id>';
    var updateSetSysId = '<update_set_sys_id>';

    var app = new GlideRecord('sys_app');
    if (app.get(appSysId)) {
        gs.setCurrentApplicationId(appSysId);
        gs.info('Application set: ' + app.name);
    } else {
        gs.error('Application not found');
        return;
    }

    var us = new GlideRecord('sys_update_set');
    if (us.get(updateSetSysId)) {
        gs.setUpdateSetId(updateSetSysId);
        gs.info('Update set set: ' + us.name);
    } else {
        gs.error('Update set not found');
        return;
    }

    gs.info('Context setup complete');
})();
```

**DELIVERABLE**: Context verified (MCP) or script ready (Fix Script)
**APPROVAL**: "Context is ready. Approve to proceed with table creation."

---

#### Step 2: Implement in Order
Follow this sequence to avoid dependency issues:

```
1. Tables (parent → child)
2. Fields (required → optional)
3. Choice values
4. Script Includes (dependencies first)
5. Business Rules (by order)
6. Client Scripts
7. UI Policies
8. ACLs (table → field)
9. UI Components
```

**Fix Script Numbering**:
- `01_context_setup.js`
- `02_create_tables.js`
- `03_create_fields.js`
- `04_create_choices.js`
- `05_create_script_includes.js`
- `06_create_business_rules.js`
- `07_create_client_scripts.js`
- `08_create_ui_policies.js`
- `09_create_acls.js`
- `10_create_ui_components.js`
- `11_verification.js`

---

#### Step 3: Batch Operations

**MCP Mode:**
```javascript
// Multiple operations in one message (5-43 per batch)
SN-Create-Record({ table_name: "sys_dictionary", data: { /*field1*/ } })
SN-Create-Record({ table_name: "sys_dictionary", data: { /*field2*/ } })
SN-Create-Record({ table_name: "sys_dictionary", data: { /*field3*/ } })
```

**Fix Script Mode:**
Consolidate all related operations in one script:
```javascript
(function() {
    gs.info('=== Creating Fields ===');

    var fields = [
        { table: 'u_table', element: 'u_field1', label: 'Field 1', type: 'string' },
        { table: 'u_table', element: 'u_field2', label: 'Field 2', type: 'integer' }
    ];

    fields.forEach(function(f) {
        var existing = new GlideRecord('sys_dictionary');
        existing.addQuery('name', f.table);
        existing.addQuery('element', f.element);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Exists: ' + f.table + '.' + f.element);
            return;
        }

        var gr = new GlideRecord('sys_dictionary');
        gr.initialize();
        gr.name = f.table;
        gr.element = f.element;
        gr.column_label = f.label;
        gr.internal_type = f.type;
        gr.active = true;
        var id = gr.insert();
        gs.info('Created: ' + f.table + '.' + f.element + ' (' + id + ')');
    });
})();
```

**DELIVERABLE**: Scripts in `/scripts/implementation/` OR MCP execution log
**APPROVAL**: "Implementation scripts ready. Approve to execute OR review scripts before running."

---

#### Step 4: Track Sys_ids
```markdown
## Created Records

| Type | Name | Sys_id | Notes |
|------|------|--------|-------|
| Table | u_new_table | abc123 | Created |
| Field | u_new_table.u_field | def456 | Created |
```

---

#### Step 5: Verify Update Set Capture

**MCP Mode:**
```javascript
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<id>^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
  fields: "name,type,target_name"
})
```

**Fix Script Mode:**
Generate `/scripts/implementation/11_verification.js`:
```javascript
(function() {
    gs.info('=== Update Set Verification ===');

    var updateSetId = '<update_set_sys_id>';
    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set', updateSetId);
    gr.query();

    var counts = {};
    while (gr.next()) {
        var type = gr.type + '';
        counts[type] = (counts[type] || 0) + 1;
    }

    gs.info('Total records: ' + gr.getRowCount());
    for (var t in counts) {
        gs.info('  ' + t + ': ' + counts[t]);
    }
})();
```

### Exit Criteria
- [ ] All components implemented
- [ ] All records in correct update set
- [ ] Sys_ids documented
- [ ] Code follows standards
- [ ] No syntax errors
- [ ] **User approved implementation**

### Output Artifacts
1. `implementation-log.md` - What was created
2. `sys-ids.md` - Record tracking
3. `/scripts/implementation/*.js` - Fix scripts (if Fix Script mode)
4. Update set (in ServiceNow)

### Quality Gate
**Reviewer**: SN Developer (peer)
**Checklist**:
- [ ] Code follows standards
- [ ] Error handling present
- [ ] No hardcoded values
- [ ] Update set complete
- [ ] **User approved before execution**

---

## WF-05: Testing Workflow

**Purpose**: Validate implementation meets requirements.

### Entry Criteria
- [ ] Implementation workflow complete
- [ ] Code reviewed
- [ ] Test data plan ready

### Steps

#### Step 1: Unit Testing
```javascript
SN-Execute-Background-Script({
  script: `
    var TestRunner = {
      results: [],
      assertEqual: function(actual, expected, msg) {
        var pass = actual === expected;
        this.results.push({test: msg, pass: pass, actual: actual, expected: expected});
        return pass;
      },
      report: function() {
        var passed = 0, failed = 0;
        this.results.forEach(function(r) {
          if (r.pass) passed++; else failed++;
          gs.info((r.pass ? 'PASS' : 'FAIL') + ': ' + r.test);
        });
        gs.info('Results: ' + passed + ' passed, ' + failed + ' failed');
        return failed === 0;
      }
    };

    // TEST CASES
    (function() {
      var si = new global.MyScript();
      TestRunner.assertEqual(typeof si.myMethod, 'function', 'myMethod exists');
    })();

    TestRunner.report();
  `,
  execution_method: "trigger"
})
```

#### Step 2: Integration Testing
Test end-to-end flows with test data creation and cleanup.

#### Step 3: Security Testing
```javascript
// Test ACL restrictions
SN-Execute-Background-Script({
  script: `
    var gr = new GlideRecord('<table>');
    gr.setLimit(1);
    gr.query();
    gs.info('canRead: ' + gr.canRead());
    gs.info('canCreate: ' + gr.canCreate());
    gs.info('canWrite: ' + gr.canWrite());
    gs.info('canDelete: ' + gr.canDelete());
  `
})
```

#### Step 4: Document Results
```markdown
## Test Execution Report

### Summary
| Category | Total | Pass | Fail | Skip |
|----------|-------|------|------|------|
| Unit | 10 | 9 | 1 | 0 |
| Integration | 5 | 5 | 0 | 0 |
| Security | 8 | 8 | 0 | 0 |

### Failed Tests
| Test | Error | Resolution |
|------|-------|------------|
| TC-003 | Null check missing | Fixed in commit abc |
```

### Exit Criteria
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Security tests pass
- [ ] Test report complete
- [ ] Defects resolved or documented

### Output Artifacts
1. `test-report.md` - Execution results
2. `defect-log.md` - Issues found and status

### Quality Gate
**Reviewer**: SN QA Engineer
**Checklist**:
- [ ] Test coverage adequate
- [ ] All P1 tests pass
- [ ] No critical defects open

---

## WF-06: Security Review Workflow

**Purpose**: Validate security controls are adequate.

### Entry Criteria
- [ ] Implementation complete
- [ ] Testing complete
- [ ] Security design available

### Steps

#### Step 1: Review ACLs
```javascript
SN-Query-Table({
  table_name: "sys_security_acl",
  query: "nameLIKE<app_prefix>",
  fields: "name,operation,admin_overrides,script,active"
})
```

#### Step 2: Test Access by Role
For each role, verify appropriate access.

#### Step 3: Code Security Review
Check for:
- [ ] No hardcoded credentials
- [ ] Input validation
- [ ] SQL/XSS injection prevention
- [ ] Proper error handling (no info leakage)

#### Step 4: Document Findings
```markdown
## Security Review Report

### Findings
| ID | Severity | Finding | Recommendation | Status |
|----|----------|---------|----------------|--------|
| S-001 | Medium | Missing input validation | Add validation | Fixed |

### Approval
- [ ] All critical findings resolved
- [ ] Risk accepted for remaining items
- [ ] Security approved
```

### Exit Criteria
- [ ] All ACLs reviewed
- [ ] Role testing complete
- [ ] Code review complete
- [ ] Critical findings resolved
- [ ] Security sign-off obtained

### Quality Gate
**Reviewer**: SN Security Reviewer
**Checklist**:
- [ ] No critical vulnerabilities
- [ ] ACLs properly scoped
- [ ] Sensitive data protected

---

## WF-07: Documentation Workflow

**Purpose**: Create documentation for users, admins, and developers.

### Entry Criteria
- [ ] Implementation complete
- [ ] Testing complete
- [ ] Feature stable

### Steps

#### Step 1: Create User Guide
```markdown
# [Feature] User Guide

## Overview
[What it does, why it exists]

## Getting Started
[Prerequisites, access requirements]

## How to Use
[Step-by-step instructions]

## FAQ
[Common questions]
```

#### Step 2: Create Technical Reference
```markdown
# [Component] Technical Reference

## Architecture
[How it works]

## API Reference
[Methods, parameters, returns]

## Configuration
[Properties, settings]

## Troubleshooting
[Common issues, solutions]
```

#### Step 3: Create Knowledge Articles
```javascript
SN-Create-Record({
  table_name: "kb_knowledge",
  data: {
    short_description: "[Title]",
    text: "<article_html>",
    kb_knowledge_base: "<kb_sys_id>",
    workflow_state: "draft"
  }
})
```

### Exit Criteria
- [ ] User guide complete
- [ ] Technical reference complete
- [ ] KB articles created
- [ ] Documentation reviewed

### Quality Gate
**Reviewer**: SN Tech Writer + Subject Matter Expert
**Checklist**:
- [ ] Accurate and complete
- [ ] Clear for target audience
- [ ] No jargon unexplained

---

## WF-08: Release Workflow

**Purpose**: Deploy changes to production safely.

### Entry Criteria
- [ ] All workflows complete
- [ ] All approvals obtained
- [ ] Change ticket approved
- [ ] Rollback plan ready

### Steps

#### Step 1: Pre-Deployment Verification
```javascript
// Verify update set contents
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<id>",
  fields: "name,type,action"
})
```

#### Step 2: Preview and Resolve
- Preview update set on target
- Resolve any conflicts
- Document resolutions

#### Step 3: Deploy
- Commit update set
- Monitor for errors
- Verify deployment

#### Step 4: Post-Deployment
```markdown
## Deployment Checklist

### Verification
- [ ] All records deployed
- [ ] No errors in logs
- [ ] Smoke tests pass
- [ ] Users can access

### Communication
- [ ] Release notes published
- [ ] Users notified
- [ ] Support informed

### Monitoring
- [ ] Alerts configured
- [ ] Dashboards updated
```

### Exit Criteria
- [ ] Deployment successful
- [ ] Smoke tests pass
- [ ] No critical issues
- [ ] Documentation published

### Quality Gate
**Reviewer**: SN Release Manager
**Checklist**:
- [ ] Change ticket closed
- [ ] Deployment verified
- [ ] Rollback not needed

---

## Workflow Quick Reference

| Workflow | Owner | Inputs | Outputs | Gate |
|----------|-------|--------|---------|------|
| WF-01 Discovery | Analyst | Request | Discovery Report | Architect |
| WF-02 Requirements | Analyst | Discovery | User Stories | Stakeholder |
| WF-03 Design | Architect | Requirements | Design Docs | Architect + Security |
| WF-04 Implementation | Developer | Design | Code + Update Set | Peer Developer |
| WF-05 Testing | QA | Implementation | Test Report | QA |
| WF-06 Security | Security | Implementation | Security Approval | Security |
| WF-07 Documentation | Tech Writer | Feature | Docs + KB | SME |
| WF-08 Release | Release Mgr | All Approvals | Production Deploy | Release Mgr |
