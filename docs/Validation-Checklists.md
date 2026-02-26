# ServiceNow Development Validation Checklists

> Comprehensive checklists for validating ServiceNow development at each phase. Use these to ensure quality gates are met before proceeding.

---

## Master Checklist Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUALITY GATE PROGRESSION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [CL-01] ──▶ [CL-02] ──▶ [CL-03] ──▶ [CL-04] ──▶ [CL-05] ──▶ [CL-06]       │
│  Context    Require-    Design      Implement   Testing    Release          │
│  Setup      ments       Review      Verify      Complete   Ready            │
│                                                                              │
│  Each gate must pass before proceeding to the next phase                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CL-01: Context Setup Checklist

**When**: Before starting ANY development work
**Owner**: Developer
**Gate**: Self-verified

### Environment Verification
- [ ] ServiceNow instance accessible
- [ ] MCP server connected and responding
- [ ] User has appropriate roles (admin for dev, appropriate for testing)

### Application Scope
- [ ] Application sys_id obtained: `________________`
- [ ] Application scope set via `SN-Set-Current-Application`
- [ ] Verified scope is correct

### Update Set
- [ ] Update set exists or created
- [ ] Update set sys_id obtained: `________________`
- [ ] Update set set via `SN-Set-Update-Set`
- [ ] Update set state = "In Progress"
- [ ] Verified with `SN-Get-Current-Update-Set`

### Documentation Ready
- [ ] Requirements document available
- [ ] Design document available (if past design phase)
- [ ] Previous phase checklist completed

### Validation Command
```javascript
// Run this to verify context
SN-Get-Current-Update-Set()
// Expected: Returns your update set name and sys_id
```

**STOP** if any item fails. Resolve before proceeding.

---

## CL-02: Requirements Validation Checklist

**When**: After requirements gathering, before design
**Owner**: Analyst
**Gate**: Stakeholder sign-off

### User Story Completeness
For EACH user story:
- [ ] Has "As a [role]" statement
- [ ] Has "I want [capability]" statement
- [ ] Has "So that [value]" statement
- [ ] Has 2+ acceptance criteria
- [ ] Acceptance criteria use Given/When/Then format
- [ ] Technical notes identify affected components
- [ ] Test scenarios defined (happy path + edge cases)

### Requirements Quality
- [ ] No ambiguous language ("should", "might", "could")
- [ ] All requirements are testable
- [ ] No conflicting requirements
- [ ] Dependencies identified
- [ ] Security requirements explicit

### Traceability
- [ ] All requirements have unique IDs
- [ ] Traceability matrix started
- [ ] Requirements linked to source request

### Stakeholder Validation
- [ ] Requirements reviewed with stakeholder
- [ ] Questions/clarifications resolved
- [ ] Priority assigned to each story
- [ ] Stakeholder sign-off obtained

### Documentation Complete
- [ ] `user-stories.md` created
- [ ] `traceability-matrix.md` started
- [ ] Sign-off recorded

**STOP** if any critical item fails. Return to requirements gathering.

---

## CL-03: Design Validation Checklist

**When**: After design, before implementation
**Owner**: Architect
**Gate**: Architect + Security review

### Data Model Review
- [ ] All tables follow naming convention (`u_` prefix)
- [ ] Table inheritance appropriate (extends correct parent)
- [ ] All fields have:
  - [ ] Appropriate type
  - [ ] Correct max length
  - [ ] Proper mandatory flag
  - [ ] Meaningful label
- [ ] Relationships properly defined
- [ ] No circular dependencies
- [ ] Indexes planned for query fields

### Script Design Review
- [ ] Script Includes:
  - [ ] Follow Class.create() pattern
  - [ ] Have JSDoc comments
  - [ ] Include error handling
  - [ ] Are properly scoped
- [ ] Business Rules:
  - [ ] Have appropriate "when" trigger
  - [ ] Use .changes() where applicable
  - [ ] Have order set correctly
  - [ ] Include condition where needed
- [ ] No hardcoded values (use properties/config)

### Security Design Review
- [ ] Roles defined or identified
- [ ] ACLs planned for:
  - [ ] Table-level (read, create, write, delete)
  - [ ] Field-level (for sensitive fields)
  - [ ] Row-level (if needed)
- [ ] No over-privileged access
- [ ] Credential handling uses sys_alias
- [ ] Sensitive data identified

### Architecture Decision Records
- [ ] ADR created for each significant decision
- [ ] Alternatives documented
- [ ] Consequences (positive/negative) noted

### Design Documentation
- [ ] `data-model.md` complete
- [ ] `script-design.md` complete
- [ ] `security-design.md` complete
- [ ] ADRs saved to `/adrs/`

### Review Sign-off
- [ ] Architect review complete
- [ ] Security review complete
- [ ] Design approved

**STOP** if security review fails. Remediate before implementation.

---

## CL-04: Implementation Verification Checklist

**When**: After implementation, before testing
**Owner**: Developer (verified by peer)
**Gate**: Peer code review

### Update Set Verification
```javascript
// Run this FIRST
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<your_update_set_sys_id>",
  fields: "name,type,action,target_name"
})
```
- [ ] All expected records present
- [ ] No records in "Default" update set
- [ ] Record count matches expectation
- [ ] No duplicate records

### Table Implementation
For EACH new table:
- [ ] Table created with correct name
- [ ] Label correct
- [ ] Extends correct parent
- [ ] Sys_id recorded: `________________`

### Field Implementation
For EACH new field:
- [ ] Field created on correct table
- [ ] Type correct
- [ ] Length correct
- [ ] Mandatory flag correct
- [ ] Label correct
- [ ] Sys_id recorded: `________________`

### Script Implementation
For EACH Script Include:
- [ ] Name correct
- [ ] API name correct
- [ ] Client callable flag correct
- [ ] Code compiles without syntax errors
- [ ] Error handling present
- [ ] Logging implemented
- [ ] Sys_id recorded: `________________`

For EACH Business Rule:
- [ ] Name correct
- [ ] Table correct
- [ ] When trigger correct
- [ ] Order correct
- [ ] Active = true
- [ ] Condition correct (if any)
- [ ] Sys_id recorded: `________________`

### ACL Implementation
For EACH ACL:
- [ ] Name correct (follows pattern)
- [ ] Operation correct
- [ ] Role correct
- [ ] Admin overrides set correctly
- [ ] Script correct (if any)
- [ ] Sys_id recorded: `________________`

### Code Quality
- [ ] No hardcoded credentials
- [ ] No hardcoded URLs
- [ ] No hardcoded sys_ids in scripts
- [ ] Error handling present
- [ ] Meaningful variable names
- [ ] Comments where logic is complex
- [ ] Files < 500 lines

### Peer Review
- [ ] Code reviewed by another developer
- [ ] Review comments addressed
- [ ] Approval recorded

**STOP** if update set verification fails. Recover records before proceeding.

---

## CL-05: Testing Completion Checklist

**When**: After testing, before security review
**Owner**: QA Engineer
**Gate**: QA sign-off

### Unit Test Coverage
- [ ] All Script Include methods tested
- [ ] All Business Rules tested
- [ ] Edge cases covered
- [ ] Error scenarios tested

### Unit Test Results
| Test ID | Name | Status | Notes |
|---------|------|--------|-------|
| UT-001 | | [ ] Pass [ ] Fail | |
| UT-002 | | [ ] Pass [ ] Fail | |

- [ ] All unit tests pass
- [ ] Test results documented

### Integration Test Coverage
- [ ] End-to-end flows tested
- [ ] Cross-component interactions verified
- [ ] Data integrity validated

### Integration Test Results
| Test ID | Name | Status | Notes |
|---------|------|--------|-------|
| IT-001 | | [ ] Pass [ ] Fail | |

- [ ] All integration tests pass
- [ ] Test results documented

### Security Test Coverage
For EACH role:
- [ ] Read access tested
- [ ] Create access tested
- [ ] Write access tested
- [ ] Delete access tested
- [ ] Unauthorized access blocked

### Security Test Results
| Role | Table | Read | Create | Write | Delete | Expected | Actual |
|------|-------|------|--------|-------|--------|----------|--------|
| | | | | | | | |

- [ ] All security tests pass
- [ ] No unauthorized access possible

### Regression Testing
- [ ] Existing functionality still works
- [ ] No new errors in logs
- [ ] Performance acceptable

### Test Documentation
- [ ] `test-report.md` complete
- [ ] All defects logged
- [ ] Defect fixes verified
- [ ] No P1/P2 defects open

**STOP** if critical defects remain. Fix before security review.

---

## CL-06: Release Readiness Checklist

**When**: Before production deployment
**Owner**: Release Manager
**Gate**: Final approval

### All Previous Gates Passed
- [ ] CL-01: Context Setup ✓
- [ ] CL-02: Requirements ✓
- [ ] CL-03: Design ✓
- [ ] CL-04: Implementation ✓
- [ ] CL-05: Testing ✓

### Update Set Final Check
```javascript
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=<sys_id>",
  fields: "name,type,action"
})
```
- [ ] All records accounted for
- [ ] No extraneous records
- [ ] Update set state = "In Progress" (not prematurely completed)

### Documentation Complete
- [ ] User guide created/updated
- [ ] Technical reference created/updated
- [ ] Release notes drafted
- [ ] Knowledge articles created (if applicable)

### Approvals Obtained
- [ ] Business stakeholder approval
- [ ] Technical lead approval
- [ ] Security approval
- [ ] Change management approval (change ticket)
- [ ] Change ticket number: `________________`

### Deployment Preparation
- [ ] Target instance identified
- [ ] Deployment window scheduled
- [ ] Rollback plan documented
- [ ] Rollback tested (if applicable)
- [ ] Support team notified

### Communication Ready
- [ ] User notification drafted
- [ ] Training scheduled (if needed)
- [ ] Support documentation provided

### Post-Deployment Plan
- [ ] Smoke test script ready
- [ ] Monitoring configured
- [ ] Success criteria defined
- [ ] Escalation path documented

**STOP** if any approval missing. Obtain before deployment.

---

## Quick Validation Scripts

### Script: Verify Update Set Contents
```javascript
// Paste update_set sys_id
var usId = '<your_update_set_sys_id>';

var xml = new GlideRecord('sys_update_xml');
xml.addQuery('update_set', usId);
xml.query();

var counts = {};
while (xml.next()) {
    var type = xml.type + '';
    counts[type] = (counts[type] || 0) + 1;
}

gs.info('=== Update Set Contents ===');
gs.info('Total records: ' + xml.getRowCount());
for (var t in counts) {
    gs.info(t + ': ' + counts[t]);
}
```

### Script: Verify ACL Coverage
```javascript
var table = '<your_table>';
var operations = ['read', 'create', 'write', 'delete'];

gs.info('=== ACL Coverage for ' + table + ' ===');
operations.forEach(function(op) {
    var acl = new GlideRecord('sys_security_acl');
    acl.addQuery('name', table);
    acl.addQuery('operation', op);
    acl.query();
    gs.info(op + ': ' + (acl.hasNext() ? 'DEFINED' : 'MISSING'));
});
```

### Script: Verify Script Include Syntax
```javascript
var siName = '<script_include_name>';

try {
    var si = new global[siName]();
    gs.info('Script Include ' + siName + ': VALID - instantiates correctly');
} catch (e) {
    gs.error('Script Include ' + siName + ': INVALID - ' + e.message);
}
```

### Script: Quick Smoke Test
```javascript
// Customize for your feature
gs.info('=== Smoke Test ===');

// Test 1: Table accessible
var gr = new GlideRecord('<your_table>');
gs.info('Table accessible: ' + gr.isValid());

// Test 2: Script Include works
try {
    var si = new global.YourScriptInclude();
    gs.info('Script Include: PASS');
} catch (e) {
    gs.info('Script Include: FAIL - ' + e.message);
}

// Test 3: Business Rule fires (check logs)
gs.info('Check system logs for business rule execution');
```

---

## Checklist Usage Tips

1. **Don't Skip Items**: Each item exists for a reason
2. **Document Failures**: Note why items failed and how resolved
3. **Get Sign-offs**: Record who approved each gate
4. **Keep Evidence**: Save query results, test outputs
5. **Iterate if Needed**: Return to previous phase if issues found
6. **Update for Your Needs**: Add org-specific checks

---

## Phase Failure Recovery

### If Requirements Fail
→ Return to stakeholder interviews
→ Clarify ambiguous items
→ Re-validate acceptance criteria

### If Design Fails
→ Review requirements for missed context
→ Consult with architect/security
→ Update design documents

### If Implementation Fails (Wrong Update Set)
```javascript
SN-Move-Records-To-Update-Set({
  update_set_id: "<correct_sys_id>",
  source_update_set: "Default"
})
```

### If Testing Fails
→ Log defects with clear reproduction steps
→ Return to implementation for fixes
→ Re-run failed tests after fix
→ Do NOT proceed until tests pass

### If Release Fails
→ Execute rollback plan
→ Document what failed
→ Return to appropriate phase
→ Re-validate all subsequent phases
