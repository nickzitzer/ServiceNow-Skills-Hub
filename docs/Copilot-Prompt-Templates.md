# GitHub Copilot Prompt Templates for ServiceNow Development

> Copy-paste ready prompts for AI-assisted ServiceNow development. Each prompt is designed to activate specific capabilities and produce consistent, high-quality outputs.

## How to Use These Prompts

1. **Copy** the prompt template
2. **Replace** bracketed placeholders `[like this]` with your specifics
3. **Paste** into GitHub Copilot Chat or your AI assistant
4. **Iterate** by providing feedback and refinements

**Important**: These prompts support both MCP Mode and Fix Script Mode. The AI will automatically detect which mode to use and generate appropriate outputs.

---

## Category: Custom Scoped Application (Complete Workflow)

### Prompt: Create New Custom Scoped Application (COMPREHENSIVE)
```
I need to create a new custom scoped ServiceNow application from scratch.

**Application Details**:
- Application Name: [Your App Name]
- Application Scope: [x_yourco_appname] (e.g., x_acme_inventory)
- Vendor Prefix: [yourco] (your company prefix, e.g., acme)
- Description: [Brief description of what the app does]

**Core Functionality**:
[Describe the main purpose and features of the application]

**Key Tables Needed**:
- [Table 1]: [Purpose]
- [Table 2]: [Purpose]
- [Add more as needed]

**User Roles**:
- [role_name]: [What they can do]
- [admin_role]: [Administrative access]

**Integration Requirements** (if any):
- [External system or API]
- [ServiceNow module integration]

Please follow this workflow with APPROVAL GATES at each step:

**PHASE 1: Discovery & Planning**
1. Analyze requirements
2. Identify dependencies on existing ServiceNow components
3. Create discovery report
4. DELIVERABLE: Save discovery-report.md to /knowledge/requirements/
5. WAIT for my approval before proceeding

**PHASE 2: Application Setup**
1. Determine execution mode (MCP or Fix Script)
2. Generate scripts to create:
   - Application record (sys_app)
   - Application scope
   - Update set for development
3. DELIVERABLE: Save setup scripts or execute via MCP
4. WAIT for my approval before proceeding

**PHASE 3: Data Model**
1. Design table structure with proper inheritance
2. Design fields with appropriate types
3. Design relationships between tables
4. Design choice values
5. DELIVERABLE: Save data-model.md to /knowledge/design/
6. Generate implementation scripts
7. WAIT for my approval before executing

**PHASE 4: Business Logic**
1. Design Script Includes for reusable logic
2. Design Business Rules for automation
3. Design Scheduled Jobs if needed
4. DELIVERABLE: Save scripts to /scripts/implementation/
5. WAIT for my approval before executing

**PHASE 5: Security**
1. Create application roles
2. Create ACLs for all tables
3. Create field-level ACLs for sensitive data
4. DELIVERABLE: Save security-design.md to /knowledge/design/
5. WAIT for my approval before executing

**PHASE 6: UI Components**
1. Create application menu and modules
2. Create forms and lists
3. Create UI Policies if needed
4. DELIVERABLE: Document UI components
5. WAIT for my approval before executing

**PHASE 7: Testing**
1. Generate unit test scripts
2. Generate integration test scripts
3. Generate security test scripts
4. DELIVERABLE: Save test-report.md to /knowledge/guides/
5. WAIT for my approval before proceeding

**PHASE 8: Documentation**
1. Create user guide
2. Create admin guide
3. Create technical reference
4. DELIVERABLE: Save documentation to /knowledge/guides/

Remember:
- Use ServiceNow standard code patterns (Class.create, IIFE for BR)
- Never use template notation like curly braces
- All scripts must be idempotent (safe to re-run)
- Check for existing records before creating
- Log all operations with gs.info/gs.error
```

---

## Category: Context Setup

### Prompt: Initialize ServiceNow Session
```
I'm working on a ServiceNow development project. Please help me set up the context.

**Application**: [Application Name]
**App Sys_id**: [sys_id]
**Update Set**: [Update Set Name]
**Update Set Sys_id**: [sys_id]
**Instance**: [instance_name.service-now.com]

First, determine the execution mode:
1. Try MCP connectivity (SN-Get-Current-Instance)
2. If MCP works: Use MCP tools directly
3. If MCP unavailable: Generate fix scripts for manual execution

Then set up context:
1. Set the application scope
2. Set the update set
3. Verify the context is correct

DELIVERABLE: Either execute via MCP or generate /scripts/implementation/01_context_setup.js
WAIT for my approval before any additional changes.
```

### Prompt: Discover Existing Application
```
I need to understand an existing ServiceNow application before making changes.

**Application Name**: [name]
**Application Sys_id**: [sys_id]

Please discover and document:
1. All tables in this application scope
2. All Script Includes
3. All Business Rules
4. All scheduled jobs
5. Key relationships and dependencies

**Execution Mode**: Check MCP availability first
- If MCP: Use SN-Query-Table and SN-Discover-Table-Schema
- If Fix Script: Generate discovery script for manual execution

DELIVERABLE: Save discovery-report.md to /knowledge/requirements/
WAIT for my approval before proceeding to design.
```

---

## Category: Requirements

### Prompt: Create User Story
```
Create a ServiceNow user story for the following requirement:

**Feature**: [Brief description of what's needed]
**User Role**: [Who will use this - e.g., ITIL user, admin, end user]
**Business Value**: [Why this matters]

Please create a user story with:
1. Standard format (As a... I want... So that...)
2. 3-5 acceptance criteria in Given/When/Then format
3. Technical notes (affected tables, scripts, security)
4. Test scenarios (happy path, edge cases, error cases)

Use the user story template from our development guide.
```

### Prompt: Analyze Requirements for Feasibility
```
Analyze the following requirement for ServiceNow feasibility:

**Requirement**: [Description]

Please evaluate:
1. Can this be done with out-of-box ServiceNow features?
2. What customization is required?
3. Which tables/scripts would be affected?
4. What are the security implications?
5. Are there any platform limitations?
6. What's the estimated complexity (low/medium/high)?

Use SN-Discover-Table-Schema and SN-Query-Table to validate assumptions.
```

---

## Category: Design

### Prompt: Design Data Model
```
Design a ServiceNow data model for:

**Purpose**: [What this data structure will support]
**Key Entities**: [List the main concepts, e.g., Provider, Model, Conversation]
**Relationships**: [How entities relate, e.g., Provider has many Models]

Please provide:
1. Table definitions (name, label, extends)
2. Field definitions (name, type, required, description)
3. Relationship diagram (text-based)
4. Choice values if applicable
5. Index recommendations

Follow ServiceNow naming conventions (u_ prefix for custom fields).
Consider performance and upgrade safety.
```

### Prompt: Design Script Include
```
Design a ServiceNow Script Include for:

**Name**: [ScriptIncludeName]
**Purpose**: [What it does]
**Methods Needed**:
- [method1]: [description]
- [method2]: [description]

Please provide:
1. Full Script Include code with JSDoc comments
2. Error handling pattern
3. Logging approach
4. Unit test outline
5. Usage example

Follow the standard Script Include pattern with Class.create().
Include try-catch blocks and meaningful error messages.
```

### Prompt: Design ACL Strategy
```
Design an ACL strategy for:

**Table**: [table_name]
**Roles**:
- [role1]: [what they should be able to do]
- [role2]: [what they should be able to do]

Please provide:
1. ACL records needed (table, field, row level)
2. Role definitions if new roles needed
3. Conditions/scripts for complex rules
4. Test scenarios for each role

Consider both UI and API access.
Follow least-privilege principle.
```

---

## Category: Implementation

### Prompt: Create Table and Fields
```
Create a ServiceNow table with the following specification:

**Table Name**: [u_table_name]
**Label**: [Table Label]
**Extends**: [task, or cmdb_ci, or none]

**Fields**:
| Name | Label | Type | Required | Description |
|------|-------|------|----------|-------------|
| [u_field1] | [Label] | [string/reference/etc] | [Yes/No] | [desc] |

**Execution Mode**: Check MCP availability first

**If MCP Mode**:
1. Generate SN-Create-Record commands for the table
2. Generate SN-Create-Record commands for each field (batch)
3. Generate SN-Create-Record commands for any choice values
4. Execute verification query

**If Fix Script Mode**:
1. Generate /scripts/implementation/02_create_tables.js
2. Generate /scripts/implementation/03_create_fields.js
3. Generate /scripts/implementation/04_create_choices.js (if needed)
4. Generate /scripts/implementation/verify_tables.js

DELIVERABLE: Scripts or executed commands
WAIT for my approval before proceeding.
```

### Prompt: Create Business Rule
```
Create a ServiceNow Business Rule:

**Name**: [Rule Name]
**Table**: [table_name]
**When**: [before/after] [insert/update/delete]
**Condition**: [when should it run, or "always"]

**What it should do**:
[Describe the business logic]

**Execution Mode**: Check MCP availability first

Please provide:
1. Complete Business Rule script using IIFE pattern
2. MCP command OR Fix Script to create it
3. Test script to validate it works
4. Considerations for performance

Follow ServiceNow best practices:
- Use .changes() for efficiency
- Include try/catch error handling
- Add meaningful logging with gs.info/gs.error
- Never use template notation

DELIVERABLE: Script saved to /scripts/implementation/05_create_business_rules.js
WAIT for my approval before executing.
```

### Prompt: Create REST Integration
```
Create a ServiceNow REST integration:

**External API**: [API name/URL]
**Authentication**: [API Key / OAuth / Basic]
**Operations Needed**:
- [operation1]: [endpoint, method, purpose]
- [operation2]: [endpoint, method, purpose]

**Execution Mode**: Check MCP availability first

Please provide:
1. REST Message configuration (sys_rest_message)
2. HTTP Methods for each operation (sys_rest_message_fn)
3. Script Include wrapper using Class.create pattern
4. Error handling with try/catch
5. Test script to verify connectivity

Security requirements:
- Use sys_alias for credentials (never hardcode)
- Validate all inputs
- Log all API calls

DELIVERABLE:
- MCP commands OR fix scripts for REST Message setup
- Script Include code saved to /scripts/implementation/
WAIT for my approval before executing.
```

### Prompt: Batch Implementation
```
I need to create multiple related records. Please batch these operations:

**Records to Create**:
[List records - e.g., 5 fields for table X, 3 business rules, etc.]

**Execution Mode**: Check MCP availability first

**If MCP Mode**:
- Generate all SN-Create-Record commands in a single message
- Group related operations together
- Track sys_ids for dependent records
- Generate verification query after creation
- Target: 5-20 operations per batch

**If Fix Script Mode**:
- Generate consolidated fix script with all records
- Include existence checks (idempotent)
- Track sys_ids in script output
- Include verification at end
- Save to /scripts/implementation/ with appropriate name

DELIVERABLE: Execution log or script file
WAIT for my approval before proceeding.
```

---

## Category: Testing

### Prompt: Create Unit Tests
```
Create inline unit tests for:

**Script Include**: [name]
**Methods to Test**: [list methods]

Please generate a background script that:
1. Sets up test data
2. Tests each method with multiple scenarios
3. Includes assertions for expected outcomes
4. Cleans up test data
5. Reports pass/fail results

Use this test runner pattern:
- TestRunner.assertEqual(actual, expected, message)
- TestRunner.assertTrue(condition, message)
- TestRunner.report()
```

### Prompt: Create Integration Tests
```
Create an integration test for this flow:

**Flow**: [Describe the end-to-end scenario]
**Start**: [What triggers it]
**End**: [Expected final state]
**Steps**:
1. [step 1]
2. [step 2]
3. [step 3]

Please generate a background script that:
1. Creates realistic test data
2. Executes the flow step by step
3. Validates each intermediate state
4. Verifies the final outcome
5. Cleans up all test data (even on failure)

Use try-finally to ensure cleanup.
```

### Prompt: Create Security Tests
```
Create security tests for:

**Table**: [table_name]
**Roles to Test**:
- [role1]: should have [permissions]
- [role2]: should have [permissions]
- [unauthorized]: should have [no access]

Please generate background scripts that:
1. Test each CRUD operation for each role
2. Verify row-level security if applicable
3. Check field-level ACLs
4. Document expected vs actual access
5. Report any security gaps

Test both successful access and proper denial.
```

### Prompt: Convert to ATF
```
Convert these inline tests to ServiceNow ATF:

**Inline Test Script**:
```
[Paste your working inline test]
```

Please generate:
1. SN-Create-Record for sys_atf_test_suite
2. SN-Create-Record for sys_atf_test
3. SN-Create-Record for each sys_atf_step
4. Proper step ordering
5. Variable passing between steps

Map inline assertions to ATF step types:
- Server script assertions → Run Server Side Script step
- Record checks → Assert Record Values step
- Record creation → Create Record step
```

---

## Category: Troubleshooting

### Prompt: Debug Script Issue
```
I'm having an issue with a ServiceNow script:

**Script Type**: [Script Include / Business Rule / etc.]
**Script Name**: [name]
**Error Message**: [paste error]
**What It Should Do**: [expected behavior]
**What It Actually Does**: [actual behavior]

Please help me:
1. Analyze the error
2. Identify likely causes
3. Suggest fixes
4. Provide a test script to verify the fix
```

### Prompt: Fix Update Set Issue
```
Records went to the wrong update set:

**Correct Update Set**: [name] - [sys_id]
**Wrong Update Set**: [name, likely "Default"]
**Records Affected**: [approximate count or description]

Please help me:
1. Query sys_update_xml to find affected records
2. Generate SN-Update-Record commands to move them
3. Verify the move was successful
4. Prevent this in the future

Use batch operations for efficiency.
```

### Prompt: Diagnose Performance Issue
```
I have a performance issue:

**Component**: [Business Rule / Script Include / etc.]
**Symptom**: [slow response, timeout, etc.]
**When It Happens**: [trigger condition]
**Data Volume**: [approximate record counts]

Please help me:
1. Identify likely performance bottlenecks
2. Suggest diagnostic queries/scripts
3. Recommend optimizations
4. Provide before/after comparison approach

Consider: indexing, query optimization, GlideAggregate, caching.
```

---

## Category: Documentation

### Prompt: Generate User Guide
```
Create a user guide for:

**Feature**: [name]
**Audience**: [end users / admins / developers]
**Purpose**: [what the feature does]

Please create documentation including:
1. Overview (2-3 sentences)
2. Prerequisites
3. Step-by-step instructions with screenshots placeholders
4. Tips and best practices
5. FAQ (3-5 common questions)
6. Troubleshooting section

Write for [technical level] audience.
Keep it concise but complete.
```

### Prompt: Generate Technical Reference
```
Create technical reference documentation for:

**Component**: [Script Include / API / etc.]
**Name**: [name]

Please document:
1. Purpose and overview
2. Architecture/design notes
3. API reference (methods, parameters, returns)
4. Configuration options
5. Integration points
6. Error codes and handling
7. Example usage

Use standard technical documentation format.
Include code examples.
```

### Prompt: Generate Release Notes
```
Create release notes for:

**Version**: [version number]
**Release Date**: [date]
**Update Set**: [name]

**Changes Made**:
[List changes - new features, fixes, improvements]

Please create release notes including:
1. Summary
2. New Features (with brief descriptions)
3. Bug Fixes
4. Known Issues
5. Upgrade Notes (if any)
6. Technical Details (for admins)

Keep user-facing language clear and jargon-free.
```

---

## Category: Persona Activation

### Prompt: Activate Analyst Persona
```
You are now acting as a ServiceNow Business Analyst (sn-analyst persona).

Your expertise:
- Requirements gathering and documentation
- User story development
- Process analysis
- Gap analysis

Your task: [Describe what you need analyzed]

Please follow the analyst workflow:
1. Ask clarifying questions if needed
2. Document findings in structured format
3. Create user stories with acceptance criteria
4. Identify technical implications

Output should be ready for handoff to the architect.
```

### Prompt: Activate Architect Persona
```
You are now acting as a ServiceNow Technical Architect (sn-architect persona).

Your expertise:
- Data model design
- Integration architecture
- Security design
- Performance optimization

Your task: [Describe what needs to be designed]

Please follow the architect workflow:
1. Review requirements/user stories
2. Design data model
3. Design scripts and integrations
4. Design security model
5. Create ADRs for key decisions

Output should be ready for developer implementation.
```

### Prompt: Activate Developer Persona
```
You are now acting as a ServiceNow Developer (sn-developer persona).

Your expertise:
- GlideRecord and server-side scripting
- Client-side development
- REST integrations
- Platform configuration

Your task: [Describe what needs to be built]

Please follow the developer workflow:
1. Set context (app scope, update set)
2. Implement in proper order (tables → fields → scripts → ACLs)
3. Batch operations (5-20 per message)
4. Track sys_ids
5. Verify update set capture

Output working code with inline validation tests.
```

### Prompt: Activate QA Persona
```
You are now acting as a ServiceNow QA Engineer (sn-qa persona).

Your expertise:
- Test strategy and planning
- Automated testing (ATF)
- Security testing
- Regression testing

Your task: [Describe what needs to be tested]

Please follow the QA workflow:
1. Create test plan
2. Write unit tests (inline scripts)
3. Write integration tests
4. Write security tests
5. Document results

Output complete test scripts ready for execution.
```

---

## Quick Reference: Common Patterns

### Pattern: Query and Iterate
```
Query [table_name] for [condition], then for each record:
1. [action 1]
2. [action 2]

Generate the appropriate SN-Query-Table and processing logic.
```

### Pattern: Create with Dependencies
```
Create these records in dependency order:
1. [parent record]
2. [child records that reference parent]
3. [records that reference children]

Generate SN-Create-Record commands, using returned sys_ids for dependencies.
```

### Pattern: Validate and Report
```
Validate [component/feature] by:
1. Checking [validation 1]
2. Checking [validation 2]
3. Reporting results

Generate a background script that performs validation and outputs results.
```

---

## Tips for Effective Prompts

1. **Be Specific**: Include table names, field names, sys_ids when known
2. **Provide Context**: Explain the business purpose, not just technical need
3. **Request Format**: Specify output format (markdown, code, MCP commands)
4. **Set Constraints**: Mention any limitations or requirements
5. **Ask for Verification**: Always request validation steps
6. **Iterate**: Refine based on initial outputs

---

## Prompt Chaining Examples

### Example: Feature Implementation Chain
```
Prompt 1 (Analyst): "Create user story for [feature]"
→ Output: User story with acceptance criteria

Prompt 2 (Architect): "Design data model for user story US-001"
→ Output: Table and field specifications

Prompt 3 (Developer): "Implement data model from design doc"
→ Output: SN-Create-Record commands

Prompt 4 (QA): "Create tests for implemented feature"
→ Output: Test scripts

Prompt 5 (Tech Writer): "Create user guide for feature"
→ Output: Documentation
```
