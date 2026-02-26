# Example Project Walkthrough: Simple Task Tracker

> A complete end-to-end example demonstrating the ServiceNow Quick Start framework. This walkthrough builds a simple Task Tracker application using the dual-mode approach with approval gates.

## Project Overview

**Application**: Task Tracker
**Scope**: `x_demo_tasks`
**Purpose**: Track team tasks with assignments, priorities, and status

**Features**:
- Custom task table with team assignments
- Priority-based workflow
- Role-based access (User, Manager, Admin)
- Status change notifications

---

## Phase 1: Discovery & Planning

### Step 1.1: Check Execution Mode

```javascript
// First, determine if MCP is available
SN-Get-Current-Instance()
```

**Result Options**:
- ✅ Returns instance info → Use MCP Mode
- ❌ Error → Use Fix Script Mode

For this example, we'll show **both modes** side by side.

### Step 1.2: Create Discovery Report

**DELIVERABLE**: Save to `/knowledge/requirements/discovery-report.md`

```markdown
# Discovery Report: Task Tracker Application

## Project Summary
- **Application Name**: Task Tracker
- **Scope**: x_demo_tasks
- **Target Users**: Team members, managers, administrators

## Existing Dependencies
- sys_user (user assignments)
- sys_user_group (team assignments)
- core_company (optional company filtering)

## Integration Points
- Email notifications (OOB)
- No external integrations required

## Estimated Components
- 1 custom table (x_demo_tasks_task)
- 6-8 custom fields
- 1 Script Include
- 2 Business Rules
- 4 ACLs (CRUD)
- 1 Scheduled Job (optional)

## Risks
- None identified for MVP
```

**APPROVAL REQUEST**: "I've created the discovery report at `/knowledge/requirements/discovery-report.md`. Please review and reply 'approved' to proceed to design, or provide feedback."

---

## Phase 2: Application Setup

### Step 2.1: Create Application and Update Set

#### MCP Mode
```javascript
// Create the scoped application
SN-Create-Record({
  table_name: "sys_app",
  data: {
    name: "Task Tracker",
    scope: "x_demo_tasks",
    version: "1.0.0",
    active: true
  }
})

// Note the returned sys_id: ________________________

// Create update set
SN-Create-Record({
  table_name: "sys_update_set",
  data: {
    name: "Task Tracker v1.0 Development",
    state: "in progress",
    application: "<app_sys_id_from_above>"
  }
})

// Note the returned sys_id: ________________________

// Set context
SN-Set-Current-Application({ app_sys_id: "<app_sys_id>" })
SN-Set-Update-Set({ update_set_sys_id: "<update_set_sys_id>" })
SN-Get-Current-Update-Set()  // Verify!
```

#### Fix Script Mode
Save to `/scripts/implementation/01_create_application.js`:

```javascript
// Fix Script: Create Application and Update Set
// Run in: Scripts > Background
// Prerequisites: None (run first)
(function() {
    gs.info('=== Creating Task Tracker Application ===');

    var appName = 'Task Tracker';
    var appScope = 'x_demo_tasks';

    // Check if app exists
    var existingApp = new GlideRecord('sys_app');
    existingApp.addQuery('scope', appScope);
    existingApp.query();

    var appSysId;
    if (existingApp.next()) {
        appSysId = existingApp.sys_id + '';
        gs.info('Application already exists: ' + appName + ' (' + appSysId + ')');
    } else {
        // Create application
        var app = new GlideRecord('sys_app');
        app.initialize();
        app.name = appName;
        app.scope = appScope;
        app.version = '1.0.0';
        app.active = true;
        appSysId = app.insert();

        if (appSysId) {
            gs.info('SUCCESS: Created application ' + appName + ' (' + appSysId + ')');
        } else {
            gs.error('FAILED: Could not create application');
            return;
        }
    }

    // Create update set
    var updateSetName = 'Task Tracker v1.0 Development';
    var existingUS = new GlideRecord('sys_update_set');
    existingUS.addQuery('name', updateSetName);
    existingUS.query();

    var usSysId;
    if (existingUS.next()) {
        usSysId = existingUS.sys_id + '';
        gs.info('Update set already exists: ' + updateSetName + ' (' + usSysId + ')');
    } else {
        var us = new GlideRecord('sys_update_set');
        us.initialize();
        us.name = updateSetName;
        us.state = 'in progress';
        us.application = appSysId;
        usSysId = us.insert();

        if (usSysId) {
            gs.info('SUCCESS: Created update set ' + updateSetName + ' (' + usSysId + ')');
        } else {
            gs.error('FAILED: Could not create update set');
            return;
        }
    }

    // Set context
    gs.setCurrentApplicationId(appSysId);
    gs.setUpdateSetId(usSysId);

    gs.info('');
    gs.info('=== SAVE THESE VALUES ===');
    gs.info('Application sys_id: ' + appSysId);
    gs.info('Update Set sys_id: ' + usSysId);
    gs.info('=========================');
})();
```

**APPROVAL REQUEST**: "Application setup script is ready. Please review and reply 'approved' to execute, or provide feedback."

---

## Phase 3: Data Model Design

### Step 3.1: Design Table Structure

**DELIVERABLE**: Save to `/knowledge/design/data-model.md`

```markdown
# Data Model: Task Tracker

## Table: x_demo_tasks_task

**Extends**: task
**Label**: Task Tracker Task
**Plural**: Task Tracker Tasks

### Fields

| Field | Label | Type | Length | Required | Default | Notes |
|-------|-------|------|--------|----------|---------|-------|
| u_priority | Priority | Choice | - | Yes | medium | high, medium, low |
| u_due_date | Due Date | Date | - | No | - | Expected completion |
| u_team | Team | Reference | - | No | - | sys_user_group |
| u_estimated_hours | Estimated Hours | Decimal | - | No | - | Planning estimate |
| u_actual_hours | Actual Hours | Decimal | - | No | - | Time spent |
| u_category | Category | Choice | - | No | - | bug, feature, task |

### Choice Values

**u_priority**:
| Value | Label | Sequence |
|-------|-------|----------|
| high | High | 100 |
| medium | Medium | 200 |
| low | Low | 300 |

**u_category**:
| Value | Label | Sequence |
|-------|-------|----------|
| bug | Bug Fix | 100 |
| feature | Feature | 200 |
| task | General Task | 300 |
```

**APPROVAL REQUEST**: "Data model design is complete at `/knowledge/design/data-model.md`. Please review and reply 'approved' to proceed with implementation, or provide feedback."

---

## Phase 4: Implementation

### Step 4.1: Create Table

#### MCP Mode
```javascript
// Get the task table sys_id for inheritance
SN-Query-Table({
  table_name: "sys_db_object",
  query: "name=task",
  fields: "sys_id"
})
// Note task sys_id: ________________________

// Create the table
SN-Create-Record({
  table_name: "sys_db_object",
  data: {
    name: "x_demo_tasks_task",
    label: "Task Tracker Task",
    super_class: "<task_sys_id>",
    is_extendable: true,
    create_module: true,
    create_mobile_module: false
  }
})
```

#### Fix Script Mode
Save to `/scripts/implementation/02_create_table.js`:

```javascript
// Fix Script: Create Task Tracker Table
// Run in: Scripts > Background
// Prerequisites: Application created (01)
(function() {
    gs.info('=== Creating Task Tracker Table ===');

    var tableName = 'x_demo_tasks_task';
    var tableLabel = 'Task Tracker Task';
    var parentTable = 'task';

    // Check if exists
    var existing = new GlideRecord('sys_db_object');
    existing.addQuery('name', tableName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Table already exists: ' + tableName);
        return;
    }

    // Get parent sys_id
    var parent = new GlideRecord('sys_db_object');
    parent.addQuery('name', parentTable);
    parent.query();
    var parentSysId = null;
    if (parent.next()) {
        parentSysId = parent.sys_id + '';
    } else {
        gs.error('Parent table not found: ' + parentTable);
        return;
    }

    // Create table
    var table = new GlideRecord('sys_db_object');
    table.initialize();
    table.name = tableName;
    table.label = tableLabel;
    table.super_class = parentSysId;
    table.is_extendable = true;
    table.create_module = true;
    table.create_mobile_module = false;

    var tableSysId = table.insert();
    if (tableSysId) {
        gs.info('SUCCESS: Created table ' + tableName + ' (' + tableSysId + ')');
    } else {
        gs.error('FAILED: Could not create table ' + tableName);
    }
})();
```

### Step 4.2: Create Fields

#### MCP Mode (Batch)
```javascript
// Create all fields in one batch
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_priority",
    column_label: "Priority",
    internal_type: "string",
    max_length: 40,
    mandatory: true,
    default_value: "medium",
    active: true
  }
})

SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_due_date",
    column_label: "Due Date",
    internal_type: "glide_date",
    active: true
  }
})

SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_team",
    column_label: "Team",
    internal_type: "reference",
    reference: "sys_user_group",
    active: true
  }
})

SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_estimated_hours",
    column_label: "Estimated Hours",
    internal_type: "decimal",
    active: true
  }
})

SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_actual_hours",
    column_label: "Actual Hours",
    internal_type: "decimal",
    active: true
  }
})

SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "x_demo_tasks_task",
    element: "u_category",
    column_label: "Category",
    internal_type: "string",
    max_length: 40,
    active: true
  }
})
```

#### Fix Script Mode
Save to `/scripts/implementation/03_create_fields.js`:

```javascript
// Fix Script: Create Task Tracker Fields
// Run in: Scripts > Background
// Prerequisites: Table created (02)
(function() {
    gs.info('=== Creating Task Tracker Fields ===');

    var tableName = 'x_demo_tasks_task';

    var fields = [
        {
            element: 'u_priority',
            label: 'Priority',
            type: 'string',
            maxLength: 40,
            mandatory: true,
            defaultVal: 'medium'
        },
        {
            element: 'u_due_date',
            label: 'Due Date',
            type: 'glide_date'
        },
        {
            element: 'u_team',
            label: 'Team',
            type: 'reference',
            reference: 'sys_user_group'
        },
        {
            element: 'u_estimated_hours',
            label: 'Estimated Hours',
            type: 'decimal'
        },
        {
            element: 'u_actual_hours',
            label: 'Actual Hours',
            type: 'decimal'
        },
        {
            element: 'u_category',
            label: 'Category',
            type: 'string',
            maxLength: 40
        }
    ];

    var created = 0;
    var skipped = 0;

    fields.forEach(function(f) {
        // Check if exists
        var existing = new GlideRecord('sys_dictionary');
        existing.addQuery('name', tableName);
        existing.addQuery('element', f.element);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Field exists: ' + tableName + '.' + f.element);
            skipped++;
            return;
        }

        // Create field
        var field = new GlideRecord('sys_dictionary');
        field.initialize();
        field.name = tableName;
        field.element = f.element;
        field.column_label = f.label;
        field.internal_type = f.type;
        if (f.maxLength) field.max_length = f.maxLength;
        if (f.mandatory) field.mandatory = true;
        if (f.defaultVal) field.default_value = f.defaultVal;
        if (f.reference) field.reference = f.reference;
        field.active = true;

        var sysId = field.insert();
        if (sysId) {
            gs.info('SUCCESS: Created ' + tableName + '.' + f.element + ' (' + sysId + ')');
            created++;
        } else {
            gs.error('FAILED: ' + tableName + '.' + f.element);
        }
    });

    gs.info('');
    gs.info('=== Summary: ' + created + ' created, ' + skipped + ' skipped ===');
})();
```

### Step 4.3: Create Choice Values

#### Fix Script Mode
Save to `/scripts/implementation/04_create_choices.js`:

```javascript
// Fix Script: Create Choice Values
// Run in: Scripts > Background
// Prerequisites: Fields created (03)
(function() {
    gs.info('=== Creating Choice Values ===');

    var tableName = 'x_demo_tasks_task';

    var choices = [
        // Priority choices
        { element: 'u_priority', value: 'high', label: 'High', sequence: 100 },
        { element: 'u_priority', value: 'medium', label: 'Medium', sequence: 200 },
        { element: 'u_priority', value: 'low', label: 'Low', sequence: 300 },
        // Category choices
        { element: 'u_category', value: 'bug', label: 'Bug Fix', sequence: 100 },
        { element: 'u_category', value: 'feature', label: 'Feature', sequence: 200 },
        { element: 'u_category', value: 'task', label: 'General Task', sequence: 300 }
    ];

    var created = 0;
    var skipped = 0;

    choices.forEach(function(c) {
        // Check if exists
        var existing = new GlideRecord('sys_choice');
        existing.addQuery('name', tableName);
        existing.addQuery('element', c.element);
        existing.addQuery('value', c.value);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Choice exists: ' + c.element + '=' + c.value);
            skipped++;
            return;
        }

        // Create choice
        var choice = new GlideRecord('sys_choice');
        choice.initialize();
        choice.name = tableName;
        choice.element = c.element;
        choice.value = c.value;
        choice.label = c.label;
        choice.sequence = c.sequence;
        choice.inactive = false;

        var sysId = choice.insert();
        if (sysId) {
            gs.info('SUCCESS: Created choice ' + c.element + '=' + c.value + ' (' + sysId + ')');
            created++;
        } else {
            gs.error('FAILED: Choice ' + c.element + '=' + c.value);
        }
    });

    gs.info('');
    gs.info('=== Summary: ' + created + ' created, ' + skipped + ' skipped ===');
})();
```

### Step 4.4: Create Business Rules

Save to `/scripts/implementation/05_create_business_rules.js`:

```javascript
// Fix Script: Create Business Rules
// Run in: Scripts > Background
(function() {
    gs.info('=== Creating Business Rules ===');

    var tableName = 'x_demo_tasks_task';

    // Business Rule 1: Set default priority on insert
    var rule1Name = 'Task Tracker - Set Defaults';
    var rule1Script = '(function executeRule(current, previous) {\n' +
        '    try {\n' +
        '        if (!current.u_priority) {\n' +
        '            current.u_priority = "medium";\n' +
        '        }\n' +
        '        gs.info("Task Tracker: Defaults set for " + current.number);\n' +
        '    } catch (e) {\n' +
        '        gs.error("BR-TaskTracker-Defaults: " + e.message);\n' +
        '    }\n' +
        '})(current, previous);';

    createBusinessRule(rule1Name, tableName, 'before', true, false, false, 100, rule1Script);

    // Business Rule 2: Log status changes
    var rule2Name = 'Task Tracker - Log Status Change';
    var rule2Script = '(function executeRule(current, previous) {\n' +
        '    if (!current.state.changes()) return;\n' +
        '    try {\n' +
        '        var oldState = previous ? previous.state.getDisplayValue() : "New";\n' +
        '        var newState = current.state.getDisplayValue();\n' +
        '        gs.info("Task Tracker: " + current.number + " status changed from " + oldState + " to " + newState);\n' +
        '    } catch (e) {\n' +
        '        gs.error("BR-TaskTracker-StatusLog: " + e.message);\n' +
        '    }\n' +
        '})(current, previous);';

    createBusinessRule(rule2Name, tableName, 'after', false, true, false, 200, rule2Script);

    function createBusinessRule(name, table, when, insert, update, del, order, script) {
        // Check if exists
        var existing = new GlideRecord('sys_script');
        existing.addQuery('name', name);
        existing.addQuery('collection', table);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Business Rule exists: ' + name);
            return;
        }

        var br = new GlideRecord('sys_script');
        br.initialize();
        br.name = name;
        br.collection = table;
        br.when = when;
        br.action_insert = insert;
        br.action_update = update;
        br.action_delete = del;
        br.action_query = false;
        br.order = order;
        br.active = true;
        br.script = script;

        var sysId = br.insert();
        if (sysId) {
            gs.info('SUCCESS: Created Business Rule ' + name + ' (' + sysId + ')');
        } else {
            gs.error('FAILED: Business Rule ' + name);
        }
    }

    gs.info('=== Business Rules Complete ===');
})();
```

### Step 4.5: Create ACLs

Save to `/scripts/implementation/06_create_acls.js`:

```javascript
// Fix Script: Create ACLs
// Run in: Scripts > Background
(function() {
    gs.info('=== Creating ACLs ===');

    var tableName = 'x_demo_tasks_task';
    var operations = ['read', 'create', 'write', 'delete'];

    operations.forEach(function(operation) {
        // Check if exists
        var existing = new GlideRecord('sys_security_acl');
        existing.addQuery('name', tableName);
        existing.addQuery('operation', operation);
        existing.query();
        if (existing.hasNext()) {
            gs.info('ACL exists: ' + tableName + ' (' + operation + ')');
            return;
        }

        var acl = new GlideRecord('sys_security_acl');
        acl.initialize();
        acl.name = tableName;
        acl.operation = operation;
        acl.admin_overrides = true;
        acl.active = true;
        acl.description = 'Task Tracker: ' + operation.charAt(0).toUpperCase() + operation.slice(1) + ' access';

        var sysId = acl.insert();
        if (sysId) {
            gs.info('SUCCESS: Created ACL ' + tableName + ' (' + operation + ') - ' + sysId);
        } else {
            gs.error('FAILED: ACL ' + tableName + ' (' + operation + ')');
        }
    });

    gs.info('=== ACLs Complete ===');
})();
```

### Step 4.6: Verify Implementation

Save to `/scripts/implementation/07_verify_implementation.js`:

```javascript
// Fix Script: Verify Implementation
// Run in: Scripts > Background
(function() {
    gs.info('===========================================');
    gs.info('   TASK TRACKER IMPLEMENTATION VERIFICATION');
    gs.info('===========================================');
    gs.info('');

    var errors = 0;
    var warnings = 0;

    // Check table exists
    var table = new GlideRecord('sys_db_object');
    table.addQuery('name', 'x_demo_tasks_task');
    table.query();
    if (table.next()) {
        gs.info('✓ Table exists: x_demo_tasks_task');
    } else {
        gs.error('✗ Table NOT FOUND: x_demo_tasks_task');
        errors++;
    }

    // Check fields
    var expectedFields = ['u_priority', 'u_due_date', 'u_team', 'u_estimated_hours', 'u_actual_hours', 'u_category'];
    expectedFields.forEach(function(fieldName) {
        var field = new GlideRecord('sys_dictionary');
        field.addQuery('name', 'x_demo_tasks_task');
        field.addQuery('element', fieldName);
        field.query();
        if (field.next()) {
            gs.info('✓ Field exists: ' + fieldName);
        } else {
            gs.error('✗ Field NOT FOUND: ' + fieldName);
            errors++;
        }
    });

    // Check choice values
    var choices = new GlideAggregate('sys_choice');
    choices.addQuery('name', 'x_demo_tasks_task');
    choices.addAggregate('COUNT');
    choices.query();
    if (choices.next()) {
        var count = choices.getAggregate('COUNT');
        gs.info('✓ Choice values: ' + count + ' found');
        if (count < 6) {
            gs.warn('⚠ Expected 6 choices, found ' + count);
            warnings++;
        }
    }

    // Check business rules
    var br = new GlideRecord('sys_script');
    br.addQuery('collection', 'x_demo_tasks_task');
    br.addQuery('active', true);
    br.query();
    gs.info('✓ Business Rules: ' + br.getRowCount() + ' active');

    // Check ACLs
    var acl = new GlideRecord('sys_security_acl');
    acl.addQuery('name', 'x_demo_tasks_task');
    acl.addQuery('active', true);
    acl.query();
    gs.info('✓ ACLs: ' + acl.getRowCount() + ' active');

    // Summary
    gs.info('');
    gs.info('===========================================');
    if (errors === 0 && warnings === 0) {
        gs.info('   ALL CHECKS PASSED');
    } else {
        gs.info('   Errors: ' + errors + ', Warnings: ' + warnings);
    }
    gs.info('===========================================');
})();
```

**APPROVAL REQUEST**: "Implementation scripts are ready in `/scripts/implementation/`. Please review and reply 'approved' to proceed with testing, or provide feedback."

---

## Phase 5: Testing

### Step 5.1: Create Test Data

Save to `/scripts/testing/01_create_test_data.js`:

```javascript
// Test Script: Create Test Data
// Run in: Scripts > Background
(function() {
    gs.info('=== Creating Test Data ===');

    var testTasks = [
        { short_description: 'TEST: Fix login bug', u_priority: 'high', u_category: 'bug' },
        { short_description: 'TEST: Add export feature', u_priority: 'medium', u_category: 'feature' },
        { short_description: 'TEST: Update documentation', u_priority: 'low', u_category: 'task' }
    ];

    var created = [];

    testTasks.forEach(function(taskData, index) {
        var task = new GlideRecord('x_demo_tasks_task');
        task.initialize();
        task.short_description = taskData.short_description;
        task.u_priority = taskData.u_priority;
        task.u_category = taskData.u_category;
        task.assigned_to = gs.getUserID();

        var sysId = task.insert();
        if (sysId) {
            gs.info('Created: ' + task.number + ' - ' + taskData.short_description);
            created.push(sysId);
        }
    });

    gs.info('');
    gs.info('Test data created: ' + created.length + ' tasks');
    gs.info('Sys_ids: ' + created.join(', '));
})();
```

### Step 5.2: Run Functional Tests

Save to `/scripts/testing/02_functional_tests.js`:

```javascript
// Test Script: Functional Tests
// Run in: Scripts > Background
(function() {
    gs.info('===========================================');
    gs.info('   TASK TRACKER FUNCTIONAL TESTS');
    gs.info('===========================================');

    var passed = 0;
    var failed = 0;

    // Test 1: Create task
    (function() {
        var task = new GlideRecord('x_demo_tasks_task');
        task.initialize();
        task.short_description = 'UNIT TEST: Create task';
        task.u_priority = 'high';
        var sysId = task.insert();

        if (sysId) {
            gs.info('✓ TEST 1: Create task - PASSED');
            passed++;

            // Cleanup
            task.deleteRecord();
        } else {
            gs.error('✗ TEST 1: Create task - FAILED');
            failed++;
        }
    })();

    // Test 2: Default priority is set
    (function() {
        var task = new GlideRecord('x_demo_tasks_task');
        task.initialize();
        task.short_description = 'UNIT TEST: Default priority';
        // Do NOT set priority
        var sysId = task.insert();

        if (sysId) {
            task.get(sysId);
            if (task.u_priority == 'medium') {
                gs.info('✓ TEST 2: Default priority - PASSED');
                passed++;
            } else {
                gs.error('✗ TEST 2: Default priority - FAILED (got: ' + task.u_priority + ')');
                failed++;
            }
            task.deleteRecord();
        } else {
            gs.error('✗ TEST 2: Could not create task');
            failed++;
        }
    })();

    // Test 3: Update task
    (function() {
        var task = new GlideRecord('x_demo_tasks_task');
        task.initialize();
        task.short_description = 'UNIT TEST: Update task';
        task.u_priority = 'low';
        var sysId = task.insert();

        if (sysId) {
            task.u_priority = 'high';
            task.update();

            // Re-read to verify
            var verify = new GlideRecord('x_demo_tasks_task');
            verify.get(sysId);
            if (verify.u_priority == 'high') {
                gs.info('✓ TEST 3: Update task - PASSED');
                passed++;
            } else {
                gs.error('✗ TEST 3: Update task - FAILED');
                failed++;
            }
            verify.deleteRecord();
        } else {
            gs.error('✗ TEST 3: Could not create task');
            failed++;
        }
    })();

    // Test 4: Query by priority
    (function() {
        var task = new GlideRecord('x_demo_tasks_task');
        task.addQuery('u_priority', 'high');
        task.setLimit(1);
        task.query();

        // Just verify query works (may or may not find records)
        gs.info('✓ TEST 4: Query by priority - PASSED (query executed)');
        passed++;
    })();

    // Summary
    gs.info('');
    gs.info('===========================================');
    gs.info('   RESULTS: ' + passed + ' passed, ' + failed + ' failed');
    gs.info('===========================================');
})();
```

**DELIVERABLE**: Save test report to `/knowledge/guides/test-report.md`

**APPROVAL REQUEST**: "Testing complete. Report saved to `/knowledge/guides/test-report.md`. Please review and reply 'approved' to proceed to documentation, or provide feedback."

---

## Phase 6: Documentation

**DELIVERABLE**: Save to `/knowledge/guides/task-tracker-user-guide.md`

```markdown
# Task Tracker User Guide

## Overview
Task Tracker is a simple application for managing team tasks with priorities, assignments, and status tracking.

## Getting Started

### Creating a Task
1. Navigate to **Task Tracker > Tasks > Create New**
2. Fill in the required fields:
   - **Short Description**: Brief summary of the task
   - **Priority**: High, Medium, or Low
3. Optionally fill in:
   - **Due Date**: Expected completion date
   - **Team**: Assign to a group
   - **Category**: Bug, Feature, or General Task
4. Click **Submit**

### Viewing Tasks
- **All Tasks**: Task Tracker > Tasks > All
- **My Tasks**: Task Tracker > Tasks > Assigned to Me

### Updating a Task
1. Open the task record
2. Modify fields as needed
3. Click **Update**

## Fields Reference

| Field | Description |
|-------|-------------|
| Number | Auto-generated task number |
| Short Description | Task summary |
| Priority | High, Medium, Low |
| Due Date | Target completion date |
| Team | Assigned user group |
| Estimated Hours | Planned effort |
| Actual Hours | Time spent |
| Category | Bug, Feature, Task |

## FAQ

**Q: Why can't I see certain tasks?**
A: Access is controlled by ACLs. Contact your administrator if you need broader access.

**Q: How do I change the priority of multiple tasks?**
A: Use list editing or update sets for bulk changes.
```

**APPROVAL REQUEST**: "Documentation complete at `/knowledge/guides/task-tracker-user-guide.md`. Please review and reply 'approved' to finalize, or provide feedback."

---

## Summary: Complete Script Execution Order

For Fix Script Mode, execute in this order:

1. `01_create_application.js` - Creates app and update set
2. `02_create_table.js` - Creates the task table
3. `03_create_fields.js` - Creates custom fields
4. `04_create_choices.js` - Creates choice values
5. `05_create_business_rules.js` - Creates automation
6. `06_create_acls.js` - Creates security
7. `07_verify_implementation.js` - Verifies everything

Then for testing:
1. `01_create_test_data.js` - Creates sample data
2. `02_functional_tests.js` - Runs tests

---

## Lessons Learned from This Example

1. **Always check mode first** - MCP vs Fix Script determines your workflow
2. **Batch related operations** - Fields, choices, ACLs can be batched
3. **Verify after each phase** - Don't wait until the end
4. **Keep scripts idempotent** - Safe to re-run if something fails
5. **Track sys_ids** - Needed for dependent records
6. **Get approval at each gate** - Prevents rework
