# ServiceNow Quick Reference Cards

> Copy-paste ready commands for common ServiceNow operations. Supports both **MCP Mode** and **Fix Script Mode**.

---

## Execution Mode Check (RUN FIRST)

```javascript
// Test MCP connectivity
SN-Get-Current-Instance()
```

| Result | Use |
|--------|-----|
| ✅ Returns instance | **MCP Mode** - Use SN-* commands |
| ❌ Error/unavailable | **Fix Script Mode** - Use GlideRecord scripts |

---

## Card: Session Setup (ALWAYS START HERE)

### MCP Mode
```javascript
// 1. Set Application Scope
SN-Set-Current-Application({ app_sys_id: "YOUR_APP_SYS_ID" })

// 2. Set Update Set
SN-Set-Update-Set({ update_set_sys_id: "YOUR_UPDATE_SET_SYS_ID" })

// 3. Verify (CRITICAL!)
SN-Get-Current-Update-Set()
```

### Fix Script Mode
Save to `/scripts/implementation/01_context_setup.js`:
```javascript
// Context Setup - Run in Scripts > Background
(function() {
    var appSysId = 'YOUR_APP_SYS_ID';
    var updateSetSysId = 'YOUR_UPDATE_SET_SYS_ID';

    // Set application scope
    var app = new GlideRecord('sys_app');
    if (app.get(appSysId)) {
        gs.setCurrentApplicationId(appSysId);
        gs.info('Application: ' + app.name);
    } else {
        gs.error('App not found: ' + appSysId);
        return;
    }

    // Set update set
    var us = new GlideRecord('sys_update_set');
    if (us.get(updateSetSysId)) {
        gs.setUpdateSetId(updateSetSysId);
        gs.info('Update set: ' + us.name);
    } else {
        gs.error('Update set not found: ' + updateSetSysId);
        return;
    }

    gs.info('Context ready. Current update set: ' + gs.getUpdateSetId());
})();
```

---

## Card: Discovery Commands

### List All Tables in Application
```javascript
SN-Query-Table({
  table_name: "sys_db_object",
  query: "sys_scope=APP_SYS_ID",
  fields: "name,label,sys_id,super_class"
})
```

### Get Full Table Schema
```javascript
SN-Discover-Table-Schema({
  table_name: "TABLE_NAME",
  include_relationships: true,
  include_choices: true
})
```

### List Script Includes
```javascript
SN-Query-Table({
  table_name: "sys_script_include",
  query: "sys_scope=APP_SYS_ID",
  fields: "name,api_name,client_callable,active"
})
```

### List Business Rules
```javascript
SN-Query-Table({
  table_name: "sys_script",
  query: "sys_scope=APP_SYS_ID",
  fields: "name,table,when,active,order"
})
```

### List ACLs for Table
```javascript
SN-Query-Table({
  table_name: "sys_security_acl",
  query: "nameLIKETABLE_NAME",
  fields: "name,operation,admin_overrides,active"
})
```

---

## Card: Create Table

### MCP Mode
```javascript
SN-Create-Record({
  table_name: "sys_db_object",
  data: {
    name: "u_your_table_name",
    label: "Your Table Label",
    super_class: "task",  // or: cmdb_ci, null for standalone
    is_extendable: true,
    create_module: true,
    create_mobile_module: false
  }
})
```

### Fix Script Mode
```javascript
// Create Table - Run in Scripts > Background
(function() {
    var tableName = 'u_your_table_name';
    var tableLabel = 'Your Table Label';
    var parentTable = 'task';  // or null for standalone

    // Check if exists
    var existing = new GlideRecord('sys_db_object');
    existing.addQuery('name', tableName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Table exists: ' + tableName);
        return;
    }

    // Get parent sys_id
    var parentSysId = null;
    if (parentTable) {
        var parent = new GlideRecord('sys_db_object');
        parent.addQuery('name', parentTable);
        parent.query();
        if (parent.next()) {
            parentSysId = parent.sys_id + '';
        }
    }

    // Create table
    var table = new GlideRecord('sys_db_object');
    table.initialize();
    table.name = tableName;
    table.label = tableLabel;
    if (parentSysId) {
        table.super_class = parentSysId;
    }
    table.is_extendable = true;
    table.create_module = true;
    table.create_mobile_module = false;

    var sysId = table.insert();
    if (sysId) {
        gs.info('Created table: ' + tableName + ' (sys_id: ' + sysId + ')');
    } else {
        gs.error('Failed to create table: ' + tableName);
    }
})();
```

---

## Card: Create Fields (Batch)

### MCP Mode - String Field
```javascript
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_your_table",
    element: "u_field_name",
    column_label: "Field Label",
    internal_type: "string",
    max_length: 255,
    mandatory: false,
    active: true
  }
})
```

### MCP Mode - Reference Field
```javascript
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_your_table",
    element: "u_reference_field",
    column_label: "Reference Label",
    internal_type: "reference",
    reference: "target_table_name",
    mandatory: false,
    active: true
  }
})
```

### MCP Mode - Boolean Field
```javascript
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_your_table",
    element: "u_active",
    column_label: "Active",
    internal_type: "boolean",
    default_value: "true",
    active: true
  }
})
```

### MCP Mode - Integer Field
```javascript
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_your_table",
    element: "u_count",
    column_label: "Count",
    internal_type: "integer",
    active: true
  }
})
```

### Fix Script Mode - Create Multiple Fields
```javascript
// Create Fields - Run in Scripts > Background
(function() {
    var tableName = 'u_your_table';

    // Define fields to create
    var fields = [
        { element: 'u_name', label: 'Name', type: 'string', length: 255, mandatory: true },
        { element: 'u_description', label: 'Description', type: 'string', length: 4000 },
        { element: 'u_active', label: 'Active', type: 'boolean', defaultVal: 'true' },
        { element: 'u_count', label: 'Count', type: 'integer' },
        { element: 'u_parent', label: 'Parent', type: 'reference', reference: 'sys_user' }
    ];

    fields.forEach(function(f) {
        // Check if exists
        var existing = new GlideRecord('sys_dictionary');
        existing.addQuery('name', tableName);
        existing.addQuery('element', f.element);
        existing.query();
        if (existing.hasNext()) {
            gs.info('Field exists: ' + tableName + '.' + f.element);
            return;
        }

        // Create field
        var field = new GlideRecord('sys_dictionary');
        field.initialize();
        field.name = tableName;
        field.element = f.element;
        field.column_label = f.label;
        field.internal_type = f.type;
        if (f.length) field.max_length = f.length;
        if (f.mandatory) field.mandatory = true;
        if (f.defaultVal) field.default_value = f.defaultVal;
        if (f.reference) field.reference = f.reference;
        field.active = true;

        var sysId = field.insert();
        if (sysId) {
            gs.info('Created: ' + tableName + '.' + f.element + ' (' + sysId + ')');
        } else {
            gs.error('Failed: ' + tableName + '.' + f.element);
        }
    });
})();
```

### Choice Field (with choices)
```javascript
// 1. Create field
SN-Create-Record({
  table_name: "sys_dictionary",
  data: {
    name: "u_your_table",
    element: "u_status",
    column_label: "Status",
    internal_type: "string",
    max_length: 40,
    active: true
  }
})

// 2. Create choices (batch these)
SN-Create-Record({
  table_name: "sys_choice",
  data: {
    name: "u_your_table",
    element: "u_status",
    value: "active",
    label: "Active",
    sequence: 100
  }
})
SN-Create-Record({
  table_name: "sys_choice",
  data: {
    name: "u_your_table",
    element: "u_status",
    value: "inactive",
    label: "Inactive",
    sequence: 200
  }
})
```

---

## Card: Create Script Include

### MCP Mode
```javascript
SN-Create-Record({
  table_name: "sys_script_include",
  data: {
    name: "MyScriptInclude",
    api_name: "global.MyScriptInclude",
    client_callable: false,
    active: true,
    description: "Description of what this does",
    script: `var MyScriptInclude = Class.create();
MyScriptInclude.prototype = {
    initialize: function() {
        this.LOG_SOURCE = 'MyScriptInclude';
    },

    /**
     * Description of method
     * @param {string} param1 - Description
     * @returns {Object} Result object
     */
    myMethod: function(param1) {
        try {
            // Implementation here
            return { success: true, data: null };
        } catch (e) {
            gs.error(this.LOG_SOURCE + '.myMethod: ' + e.message);
            return { success: false, error: e.message };
        }
    },

    type: 'MyScriptInclude'
};`
  }
})
```

### Fix Script Mode
```javascript
// Create Script Include - Run in Scripts > Background
(function() {
    var scriptName = 'MyScriptInclude';
    var apiName = 'global.MyScriptInclude';

    // Check if exists
    var existing = new GlideRecord('sys_script_include');
    existing.addQuery('name', scriptName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Script Include exists: ' + scriptName);
        return;
    }

    // Script code using string concatenation (no template literals)
    var scriptCode = 'var MyScriptInclude = Class.create();\n' +
        'MyScriptInclude.prototype = {\n' +
        '    initialize: function() {\n' +
        '        this.LOG_SOURCE = "MyScriptInclude";\n' +
        '    },\n' +
        '\n' +
        '    myMethod: function(param1) {\n' +
        '        try {\n' +
        '            // Implementation here\n' +
        '            return { success: true, data: null };\n' +
        '        } catch (e) {\n' +
        '            gs.error(this.LOG_SOURCE + ".myMethod: " + e.message);\n' +
        '            return { success: false, error: e.message };\n' +
        '        }\n' +
        '    },\n' +
        '\n' +
        '    type: "MyScriptInclude"\n' +
        '};';

    // Create Script Include
    var si = new GlideRecord('sys_script_include');
    si.initialize();
    si.name = scriptName;
    si.api_name = apiName;
    si.client_callable = false;
    si.active = true;
    si.description = 'Description of what this does';
    si.script = scriptCode;

    var sysId = si.insert();
    if (sysId) {
        gs.info('Created Script Include: ' + scriptName + ' (' + sysId + ')');
    } else {
        gs.error('Failed to create Script Include: ' + scriptName);
    }
})();
```

---

## Card: Create Business Rule

### MCP Mode - After Insert
```javascript
SN-Create-Record({
  table_name: "sys_script",
  data: {
    name: "My After Insert Rule",
    collection: "u_your_table",
    when: "after",
    action_insert: true,
    action_update: false,
    action_delete: false,
    action_query: false,
    order: 100,
    active: true,
    script: `(function executeRule(current, previous) {
    try {
        // Your logic here
        gs.info('After insert on ' + current.getTableName() + ': ' + current.sys_id);
    } catch (e) {
        gs.error('BR-MyRule: ' + e.message);
    }
})(current, previous);`
  }
})
```

### MCP Mode - Before Update (with condition)
```javascript
SN-Create-Record({
  table_name: "sys_script",
  data: {
    name: "My Before Update Rule",
    collection: "u_your_table",
    when: "before",
    action_insert: false,
    action_update: true,
    action_delete: false,
    action_query: false,
    order: 100,
    active: true,
    condition: "current.u_status.changes()",
    script: `(function executeRule(current, previous) {
    // Only runs when u_status changes
    if (!current.u_status.changes()) return;

    try {
        // Your logic here
    } catch (e) {
        gs.error('BR-MyRule: ' + e.message);
        current.setAbortAction(true);
    }
})(current, previous);`
  }
})
```

### Fix Script Mode - Create Business Rule
```javascript
// Create Business Rule - Run in Scripts > Background
(function() {
    var ruleName = 'My After Insert Rule';
    var tableName = 'u_your_table';

    // Check if exists
    var existing = new GlideRecord('sys_script');
    existing.addQuery('name', ruleName);
    existing.addQuery('collection', tableName);
    existing.query();
    if (existing.hasNext()) {
        gs.info('Business Rule exists: ' + ruleName);
        return;
    }

    // Script code using string concatenation (no template literals)
    var brScript = '(function executeRule(current, previous) {\n' +
        '    try {\n' +
        '        // Your logic here\n' +
        '        gs.info("After insert on " + current.getTableName() + ": " + current.sys_id);\n' +
        '    } catch (e) {\n' +
        '        gs.error("BR-MyRule: " + e.message);\n' +
        '    }\n' +
        '})(current, previous);';

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

    var sysId = br.insert();
    if (sysId) {
        gs.info('Created Business Rule: ' + ruleName + ' (' + sysId + ')');
    } else {
        gs.error('Failed to create Business Rule: ' + ruleName);
    }
})();
```

---

## Card: Create ACLs

### Table-Level ACL
```javascript
// Read ACL
SN-Create-Record({
  table_name: "sys_security_acl",
  data: {
    name: "u_your_table",
    operation: "read",
    admin_overrides: true,
    active: true,
    description: "Read access for your_table"
  }
})

// Write ACL
SN-Create-Record({
  table_name: "sys_security_acl",
  data: {
    name: "u_your_table",
    operation: "write",
    admin_overrides: true,
    active: true
  }
})

// Create ACL
SN-Create-Record({
  table_name: "sys_security_acl",
  data: {
    name: "u_your_table",
    operation: "create",
    admin_overrides: true,
    active: true
  }
})

// Delete ACL
SN-Create-Record({
  table_name: "sys_security_acl",
  data: {
    name: "u_your_table",
    operation: "delete",
    admin_overrides: true,
    active: true
  }
})
```

### Field-Level ACL
```javascript
SN-Create-Record({
  table_name: "sys_security_acl",
  data: {
    name: "u_your_table.u_sensitive_field",
    operation: "write",
    admin_overrides: true,
    active: true,
    description: "Restrict write to sensitive field"
  }
})
```

---

## Card: Create Scheduled Job

```javascript
SN-Create-Record({
  table_name: "sysauto_script",
  data: {
    name: "My Scheduled Job",
    active: true,
    run_type: "daily",  // or: periodically, weekly, monthly, once
    time: "00:00:00",   // for daily
    script: `(function() {
    try {
        gs.info('Scheduled job started');

        var gr = new GlideRecord('u_your_table');
        gr.addQuery('u_status', 'pending');
        gr.query();

        var count = 0;
        while (gr.next()) {
            // Process record
            count++;
        }

        gs.info('Scheduled job completed. Processed: ' + count);
    } catch (e) {
        gs.error('Scheduled job failed: ' + e.message);
    }
})();`
  }
})
```

---

## Card: Update Set Management

### List Update Sets
```javascript
SN-List-Update-Sets({
  query: "state=in progress"
})
```

### Verify Update Set Contents
```javascript
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=UPDATE_SET_SYS_ID",
  fields: "name,type,action,target_name"
})
```

### Move Records to Correct Update Set
```javascript
SN-Move-Records-To-Update-Set({
  update_set_id: "CORRECT_UPDATE_SET_SYS_ID",
  source_update_set: "Default"
})
```

### Count Today's Records
```javascript
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=UPDATE_SET_SYS_ID^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
  fields: "sys_id"
})
```

---

## Card: Background Script Execution

### Simple Query
```javascript
SN-Execute-Background-Script({
  script: `
    var gr = new GlideRecord('u_your_table');
    gr.query();
    gs.info('Record count: ' + gr.getRowCount());
  `,
  execution_method: "trigger"
})
```

### Test Script Include
```javascript
SN-Execute-Background-Script({
  script: `
    try {
        var si = new global.MyScriptInclude();
        var result = si.myMethod('test');
        gs.info('Result: ' + JSON.stringify(result));
    } catch (e) {
        gs.error('Test failed: ' + e.message);
    }
  `,
  execution_method: "trigger"
})
```

### Create Test Data
```javascript
SN-Execute-Background-Script({
  script: `
    var gr = new GlideRecord('u_your_table');
    gr.initialize();
    gr.u_name = 'Test Record';
    gr.u_status = 'active';
    var sysId = gr.insert();
    gs.info('Created test record: ' + sysId);
  `,
  execution_method: "trigger"
})
```

### Clean Up Test Data
```javascript
SN-Execute-Background-Script({
  script: `
    var gr = new GlideRecord('u_your_table');
    gr.addQuery('u_name', 'STARTSWITH', 'Test');
    gr.query();
    var count = 0;
    while (gr.next()) {
        gr.deleteRecord();
        count++;
    }
    gs.info('Deleted ' + count + ' test records');
  `,
  execution_method: "trigger"
})
```

---

## Card: Unit Test Template

```javascript
SN-Execute-Background-Script({
  script: `
    var T = {
      results: [],
      assertEqual: function(a, e, m) {
        var p = a === e;
        this.results.push({t:m,p:p,a:a,e:e});
        return p;
      },
      assertTrue: function(c, m) {
        this.results.push({t:m,p:c,a:c,e:true});
        return c;
      },
      report: function() {
        var pass=0, fail=0;
        this.results.forEach(function(r) {
          if(r.p) pass++; else fail++;
          gs.info((r.p?'PASS':'FAIL')+': '+r.t);
          if(!r.p) gs.info('  Expected:'+r.e+' Got:'+r.a);
        });
        gs.info('=== '+pass+' passed, '+fail+' failed ===');
        return fail===0;
      }
    };

    // YOUR TESTS HERE
    (function() {
      var si = new global.YourScript();
      T.assertTrue(si !== null, 'Script instantiates');
      T.assertEqual(typeof si.yourMethod, 'function', 'Method exists');
    })();

    T.report();
  `,
  execution_method: "trigger"
})
```

---

## Card: Variable Type Reference

| Type Code | Type Name | Use Case |
|-----------|-----------|----------|
| 1 | Yes/No | Radio buttons for 2-5 options |
| 5 | Select Box | Dropdown for 6+ options |
| 6 | Multi-line Text | Textarea |
| 7 | Checkbox | Boolean checkbox |
| 8 | Reference | Link to another table |
| 9 | Date | Date picker |
| 10 | Date/Time | DateTime picker |
| 16 | Single Line Text | Text input |
| 17 | Integer | Number input |
| 21 | List Collector | Multi-select |
| 27 | Masked | Password field |

---

## Card: Common Query Operators

| Operator | Syntax | Example |
|----------|--------|---------|
| Equals | `field=value` | `active=true` |
| Not Equals | `field!=value` | `state!=closed` |
| Contains | `fieldLIKEvalue` | `nameLIKEtest` |
| Starts With | `fieldSTARTSWITHvalue` | `nameSTARTSWITHpre_` |
| Ends With | `fieldENDSWITHvalue` | `nameENDSWITH_prod` |
| Greater Than | `field>value` | `priority>3` |
| Less Than | `field<value` | `priority<2` |
| In List | `fieldINval1,val2` | `stateINopen,pending` |
| Is Empty | `fieldISEMPTY` | `descriptionISEMPTY` |
| Is Not Empty | `fieldISNOTEMPTY` | `assignedISNOTEMPTY` |
| Today | `fieldONToday@javascript:...` | See update set query |

**Combine with**: `^` (AND), `^OR` (OR), `^NQ` (New Query)

---

## Card: Error Recovery

### Records in Wrong Update Set
```javascript
// 1. Find records in Default
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set.name=Default^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
  fields: "sys_id,name,target_name"
})

// 2. Move to correct update set
SN-Move-Records-To-Update-Set({
  update_set_id: "CORRECT_SYS_ID",
  source_update_set: "Default"
})

// 3. Verify move
SN-Query-Table({
  table_name: "sys_update_xml",
  query: "update_set=CORRECT_SYS_ID",
  fields: "sys_id,name"
})
```

### Syntax Error in Script
```javascript
// Test script in isolation
SN-Execute-Background-Script({
  script: `
    try {
      // Paste your script here to test
      gs.info('Script executed successfully');
    } catch (e) {
      gs.error('Error at: ' + e.fileName + ':' + e.lineNumber);
      gs.error('Message: ' + e.message);
    }
  `,
  execution_method: "trigger"
})
```

---

## Card: Performance Patterns

### Use GlideAggregate for Counts
```javascript
// GOOD
var ga = new GlideAggregate('incident');
ga.addQuery('state', 'open');
ga.addAggregate('COUNT');
ga.query();
if (ga.next()) {
    var count = ga.getAggregate('COUNT');
}

// BAD (slow for large tables)
var gr = new GlideRecord('incident');
gr.addQuery('state', 'open');
gr.query();
var count = gr.getRowCount();
```

### Exit Early in Business Rules
```javascript
// GOOD
(function executeRule(current, previous) {
    if (!current.u_field.changes()) return;  // Exit early
    // Logic only runs when field changed
})(current, previous);
```

### Limit Queries
```javascript
// GOOD
var gr = new GlideRecord('table');
gr.setLimit(100);  // Don't fetch unlimited records
gr.query();
```

---

## Quick Copy Templates

### New Feature Implementation
```
1. SN-Set-Current-Application
2. SN-Set-Update-Set
3. SN-Get-Current-Update-Set (verify!)
4. SN-Create-Record (tables)
5. SN-Create-Record (fields - batch)
6. SN-Create-Record (script includes)
7. SN-Create-Record (business rules)
8. SN-Create-Record (ACLs - batch)
9. SN-Query-Table (verify update set)
10. SN-Execute-Background-Script (test)
```

### Investigation Flow
```
1. SN-Discover-Table-Schema (understand structure)
2. SN-Query-Table (find records)
3. SN-Get-Record (examine specific record)
4. SN-Execute-Background-Script (debug/analyze)
```

---

## Card: Error Recovery Scripts (Fix Script Mode)

### Move Records from Default Update Set
```javascript
// Recovery: Move records from Default to correct update set
(function() {
    var correctUpdateSetId = 'YOUR_CORRECT_UPDATE_SET_SYS_ID';
    var today = new GlideDateTime();
    today.addDaysLocalTime(-1);  // Look back 1 day

    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set.name', 'Default');
    gr.addQuery('sys_created_on', '>=', today);
    gr.query();

    var count = 0;
    while (gr.next()) {
        gr.update_set = correctUpdateSetId;
        gr.update();
        count++;
        gs.info('Moved: ' + gr.name);
    }

    gs.info('Total records moved: ' + count);
})();
```

### Rollback Last Created Records
```javascript
// Recovery: Delete records created in last hour (USE WITH CAUTION)
(function() {
    var tableName = 'u_your_table';
    var hoursAgo = 1;

    var cutoff = new GlideDateTime();
    cutoff.addSeconds(-hoursAgo * 3600);

    var gr = new GlideRecord(tableName);
    gr.addQuery('sys_created_on', '>=', cutoff);
    gr.query();

    gs.info('Found ' + gr.getRowCount() + ' records to review');
    gs.info('To delete, uncomment the deleteRecord line below');

    while (gr.next()) {
        gs.info('Would delete: ' + gr.sys_id + ' - ' + gr.getDisplayValue());
        // gr.deleteRecord();  // UNCOMMENT TO ACTUALLY DELETE
    }
})();
```

### Verify Script Include Syntax
```javascript
// Validation: Test if Script Include compiles
(function() {
    var scriptName = 'YourScriptInclude';

    try {
        var si = new global[scriptName]();
        gs.info('SUCCESS: ' + scriptName + ' instantiates correctly');

        // List available methods
        for (var prop in si) {
            if (typeof si[prop] === 'function' && prop !== 'initialize') {
                gs.info('  Method: ' + prop);
            }
        }
    } catch (e) {
        gs.error('FAILED: ' + scriptName + ' - ' + e.message);
        gs.error('Line: ' + e.lineNumber);
    }
})();
```

### Export Update Set to XML
```javascript
// Export: Generate update set XML for manual deployment
(function() {
    var updateSetId = 'YOUR_UPDATE_SET_SYS_ID';

    var exporter = new UpdateSetExport();
    var xml = exporter.exportUpdateSet(updateSetId);

    gs.info('Update set exported. Length: ' + xml.length + ' characters');
    gs.info('Copy from System Logs or use Remote Update Set for transfer');
})();
```

---

## Card: Diagnostic Scripts

### Check Current Context
```javascript
// Diagnostic: Verify current application and update set
(function() {
    gs.info('=== Current Context ===');
    gs.info('User: ' + gs.getUserName());
    gs.info('Session ID: ' + gs.getSessionID());

    var appId = gs.getCurrentApplicationId();
    if (appId) {
        var app = new GlideRecord('sys_app');
        if (app.get(appId)) {
            gs.info('Application: ' + app.name + ' (' + appId + ')');
            gs.info('Scope: ' + app.scope);
        }
    } else {
        gs.info('Application: Global (no scoped app set)');
    }

    var usId = gs.getUpdateSetId();
    if (usId) {
        var us = new GlideRecord('sys_update_set');
        if (us.get(usId)) {
            gs.info('Update Set: ' + us.name + ' (' + usId + ')');
            gs.info('State: ' + us.state);
        }
    } else {
        gs.info('Update Set: Not set (will use Default)');
    }
})();
```

### Count Records by Type in Update Set
```javascript
// Diagnostic: Analyze update set contents
(function() {
    var updateSetId = 'YOUR_UPDATE_SET_SYS_ID';

    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set', updateSetId);
    gr.query();

    var counts = {};
    var total = 0;

    while (gr.next()) {
        var type = gr.type + '';
        counts[type] = (counts[type] || 0) + 1;
        total++;
    }

    gs.info('=== Update Set Analysis ===');
    gs.info('Total records: ' + total);
    gs.info('');

    var sortedTypes = Object.keys(counts).sort(function(a, b) {
        return counts[b] - counts[a];
    });

    sortedTypes.forEach(function(type) {
        gs.info('  ' + type + ': ' + counts[type]);
    });
})();
```
