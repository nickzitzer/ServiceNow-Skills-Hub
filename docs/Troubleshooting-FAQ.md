# ServiceNow Development Troubleshooting FAQ

> Top 10 common issues and their solutions when using the ServiceNow Quick Start framework.

---

## Quick Diagnostic Script

Run this first to check your current context:

```javascript
// Diagnostic: Check current state
(function() {
    gs.info('=== DIAGNOSTIC CHECK ===');
    gs.info('User: ' + gs.getUserName());
    gs.info('');

    // Application
    var appId = gs.getCurrentApplicationId();
    if (appId) {
        var app = new GlideRecord('sys_app');
        if (app.get(appId)) {
            gs.info('Application: ' + app.name + ' (' + app.scope + ')');
        }
    } else {
        gs.warn('Application: NOT SET (using Global)');
    }

    // Update Set
    var usId = gs.getUpdateSetId();
    if (usId) {
        var us = new GlideRecord('sys_update_set');
        if (us.get(usId)) {
            gs.info('Update Set: ' + us.name + ' (' + us.state + ')');
        }
    } else {
        gs.warn('Update Set: NOT SET (using Default)');
    }

    gs.info('========================');
})();
```

---

## FAQ #1: Records Going to "Default" Update Set

### Symptom
Records are being created in the "Default" update set instead of your intended update set.

### Cause
- Update set not set before creating records
- Session expired and context was lost
- Running scripts in wrong scope

### Solution

**Prevention:**
```javascript
// ALWAYS set and verify context before ANY changes
SN-Set-Update-Set({ update_set_sys_id: "<your_update_set_sys_id>" })
SN-Get-Current-Update-Set()  // VERIFY!
```

**Recovery - Move records from Default:**
```javascript
(function() {
    var correctUpdateSetId = 'YOUR_CORRECT_UPDATE_SET_SYS_ID';

    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set.name', 'Default');
    gr.addQuery('sys_created_on', '>=', gs.daysAgoStart(1));
    gr.query();

    var count = 0;
    while (gr.next()) {
        gr.update_set = correctUpdateSetId;
        gr.update();
        count++;
    }

    gs.info('Moved ' + count + ' records to correct update set');
})();
```

---

## FAQ #2: Script Include Won't Instantiate

### Symptom
```
Error: global.MyScriptInclude is not a constructor
```
or
```
Error: Cannot read property 'myMethod' of undefined
```

### Cause
- Syntax error in script code
- Script Include not active
- Wrong scope/API name
- Missing `Class.create()` pattern

### Solution

**Check for syntax errors:**
```javascript
(function() {
    var scriptName = 'MyScriptInclude';

    try {
        var si = new global[scriptName]();
        gs.info('SUCCESS: Instantiation works');

        // List methods
        for (var prop in si) {
            if (typeof si[prop] === 'function') {
                gs.info('  Method: ' + prop);
            }
        }
    } catch (e) {
        gs.error('FAILED: ' + e.message);
        gs.error('Line: ' + (e.lineNumber || 'unknown'));
    }
})();
```

**Verify Script Include exists and is active:**
```javascript
var si = new GlideRecord('sys_script_include');
si.addQuery('name', 'MyScriptInclude');
si.query();
if (si.next()) {
    gs.info('Found: ' + si.name);
    gs.info('Active: ' + si.active);
    gs.info('API Name: ' + si.api_name);
} else {
    gs.error('Script Include not found');
}
```

**Correct Script Include pattern:**
```javascript
var MyScriptInclude = Class.create();
MyScriptInclude.prototype = {
    initialize: function() {
        // Constructor
    },

    myMethod: function(param) {
        // Implementation
    },

    type: 'MyScriptInclude'  // REQUIRED!
};
```

---

## FAQ #3: Business Rule Not Firing

### Symptom
Business rule doesn't execute when expected.

### Cause
- Wrong "when" setting (before/after)
- Wrong action flags (insert/update/delete)
- Condition not met
- Script error prevents execution
- Rule is inactive

### Solution

**Check Business Rule configuration:**
```javascript
(function() {
    var ruleName = 'My Business Rule';
    var tableName = 'my_table';

    var br = new GlideRecord('sys_script');
    br.addQuery('name', ruleName);
    br.addQuery('collection', tableName);
    br.query();

    if (br.next()) {
        gs.info('Rule: ' + br.name);
        gs.info('Active: ' + br.active);
        gs.info('When: ' + br.when);
        gs.info('Insert: ' + br.action_insert);
        gs.info('Update: ' + br.action_update);
        gs.info('Delete: ' + br.action_delete);
        gs.info('Condition: ' + (br.condition || 'none'));
        gs.info('Order: ' + br.order);
    } else {
        gs.error('Business Rule not found');
    }
})();
```

**Add debugging to your rule:**
```javascript
(function executeRule(current, previous) {
    gs.info('BR ENTRY: ' + current.sys_id);  // Add this temporarily

    if (!current.field.changes()) {
        gs.info('BR SKIP: field did not change');  // Debug
        return;
    }

    try {
        // Your logic
        gs.info('BR SUCCESS');  // Debug
    } catch (e) {
        gs.error('BR ERROR: ' + e.message);
    }
})(current, previous);
```

---

## FAQ #4: ACL Not Working / Access Denied

### Symptom
- Users can't access records they should
- Users CAN access records they shouldn't
- "Access denied" errors

### Cause
- ACL not created for operation
- ACL not active
- Role not assigned to user
- ACL condition too restrictive
- Admin override hiding the problem in testing

### Solution

**Check ACLs for a table:**
```javascript
(function() {
    var tableName = 'my_table';

    var acl = new GlideRecord('sys_security_acl');
    acl.addQuery('name', 'STARTSWITH', tableName);
    acl.orderBy('operation');
    acl.query();

    gs.info('=== ACLs for ' + tableName + ' ===');
    while (acl.next()) {
        gs.info(acl.name + ' | ' + acl.operation + ' | Active: ' + acl.active);
    }
})();
```

**Test access for a specific record:**
```javascript
(function() {
    var tableName = 'my_table';
    var sysId = 'RECORD_SYS_ID';

    var gr = new GlideRecord(tableName);
    gr.get(sysId);

    gs.info('Table: ' + tableName);
    gs.info('canRead: ' + gr.canRead());
    gs.info('canCreate: ' + gr.canCreate());
    gs.info('canWrite: ' + gr.canWrite());
    gs.info('canDelete: ' + gr.canDelete());
})();
```

---

## FAQ #5: MCP Tool Returns Error / No Response

### Symptom
- `SN-Get-Current-Instance()` fails
- MCP tools not responding
- Connection errors

### Cause
- MCP server not running
- Network connectivity issue
- Authentication problem
- Instance not accessible

### Solution

1. **Switch to Fix Script Mode** - Generate scripts for manual execution instead

2. **Verify instance is accessible:**
   - Open instance URL in browser
   - Check if you can log in

3. **Check MCP server logs** (if available)

4. **Use Fix Script fallback:**
   ```javascript
   // Instead of MCP, use this pattern
   (function() {
       // Your GlideRecord operations here
   })();
   ```

---

## FAQ #6: Field Not Appearing on Form

### Symptom
Created a field but it doesn't show on the form.

### Cause
- Field created but not added to form layout
- Field is inactive
- Wrong table name
- Caching issue

### Solution

**Verify field exists:**
```javascript
(function() {
    var tableName = 'my_table';
    var fieldName = 'u_my_field';

    var dict = new GlideRecord('sys_dictionary');
    dict.addQuery('name', tableName);
    dict.addQuery('element', fieldName);
    dict.query();

    if (dict.next()) {
        gs.info('Field exists: ' + dict.column_label);
        gs.info('Active: ' + dict.active);
        gs.info('Type: ' + dict.internal_type);
    } else {
        gs.error('Field NOT FOUND');
    }
})();
```

**Add field to form via script:**
```javascript
(function() {
    var tableName = 'my_table';
    var fieldName = 'u_my_field';
    var viewName = 'Default view';

    // Find the form section
    var section = new GlideRecord('sys_ui_section');
    section.addQuery('name', tableName);
    section.addQuery('view.title', viewName);
    section.query();

    if (section.next()) {
        // Check if element already exists
        var existing = new GlideRecord('sys_ui_element');
        existing.addQuery('sys_ui_section', section.sys_id);
        existing.addQuery('element', fieldName);
        existing.query();

        if (existing.hasNext()) {
            gs.info('Field already on form');
        } else {
            // Add element to form
            var elem = new GlideRecord('sys_ui_element');
            elem.initialize();
            elem.sys_ui_section = section.sys_id;
            elem.element = fieldName;
            elem.position = 0;  // Adjust as needed
            elem.insert();
            gs.info('Field added to form');
        }
    } else {
        gs.warn('Form section not found - add field manually via Form Designer');
    }
})();
```

---

## FAQ #7: Choice Values Not Showing

### Symptom
- Dropdown shows no options
- Choice field shows raw values instead of labels

### Cause
- Choices created in wrong table (`sys_choice` vs `question_choice`)
- Choices created for wrong element name
- Choices inactive
- Wrong table name in choice record

### Solution

**Check choice values:**
```javascript
(function() {
    var tableName = 'my_table';
    var elementName = 'u_my_choice_field';

    var choice = new GlideRecord('sys_choice');
    choice.addQuery('name', tableName);
    choice.addQuery('element', elementName);
    choice.orderBy('sequence');
    choice.query();

    gs.info('=== Choices for ' + tableName + '.' + elementName + ' ===');
    while (choice.next()) {
        gs.info(choice.value + ' = ' + choice.label + ' (seq: ' + choice.sequence + ', inactive: ' + choice.inactive + ')');
    }

    if (choice.getRowCount() === 0) {
        gs.warn('No choices found!');
        gs.info('Check: table name, element name, sys_choice vs question_choice');
    }
})();
```

**Remember:**
- Table fields → `sys_choice`
- Catalog variables → `question_choice`

---

## FAQ #8: Update Set Shows Wrong Record Count

### Symptom
- Update set has fewer records than expected
- Missing records after implementation

### Cause
- Records created before update set was set
- Records in different update set
- Some operations don't capture (UI changes)

### Solution

**Analyze update set contents:**
```javascript
(function() {
    var updateSetId = 'YOUR_UPDATE_SET_SYS_ID';

    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set', updateSetId);
    gr.query();

    var counts = {};
    while (gr.next()) {
        var type = gr.type + '';
        counts[type] = (counts[type] || 0) + 1;
    }

    gs.info('=== Update Set Contents ===');
    gs.info('Total: ' + gr.getRowCount());

    var sorted = Object.keys(counts).sort(function(a, b) {
        return counts[b] - counts[a];
    });

    sorted.forEach(function(type) {
        gs.info('  ' + type + ': ' + counts[type]);
    });
})();
```

**Find records in wrong update set:**
```javascript
(function() {
    var today = new GlideDateTime();
    today.addDaysLocalTime(-1);

    // Check Default update set for recent records
    var gr = new GlideRecord('sys_update_xml');
    gr.addQuery('update_set.name', 'Default');
    gr.addQuery('sys_created_on', '>=', today);
    gr.query();

    gs.info('Records in Default from last 24 hours: ' + gr.getRowCount());
    while (gr.next()) {
        gs.info('  ' + gr.name + ' (' + gr.type + ')');
    }
})();
```

---

## FAQ #9: Template Notation Not Working

### Symptom
- `{{variable}}` shows literally instead of being replaced
- Variables not substituting in scripts

### Cause
ServiceNow doesn't support `{{mustache}}` template notation in scripts.

### Solution

**Use string concatenation instead:**

```javascript
// WRONG - won't work
var message = "Hello {{name}}, your ticket is {{number}}";

// CORRECT - use concatenation
var name = current.caller_id.name;
var number = current.number;
var message = 'Hello ' + name + ', your ticket is ' + number;

// CORRECT - for longer strings
var message = 'Dear ' + name + ',\n' +
    'Your ticket ' + number + ' has been created.\n' +
    'Priority: ' + current.priority.getDisplayValue() + '\n' +
    'Thank you.';
```

**For prompt templates (in prompts, not code):**
- Use `[placeholder]` format as documented
- Replace manually before execution

---

## FAQ #10: Scheduled Job Not Running

### Symptom
- Scheduled job doesn't execute at expected time
- No evidence of execution in logs

### Cause
- Job not active
- Schedule misconfigured
- Script error
- Job locked/paused
- Time zone issue

### Solution

**Check scheduled job status:**
```javascript
(function() {
    var jobName = 'My Scheduled Job';

    var job = new GlideRecord('sysauto_script');
    job.addQuery('name', jobName);
    job.query();

    if (job.next()) {
        gs.info('Job: ' + job.name);
        gs.info('Active: ' + job.active);
        gs.info('Run Type: ' + job.run_type);
        gs.info('Next Action: ' + job.next_action);
        gs.info('Run As: ' + job.run_as.getDisplayValue());
    } else {
        gs.error('Job not found');
    }
})();
```

**Manually trigger for testing:**
```javascript
(function() {
    // Copy your scheduled job script here and run in background
    try {
        gs.info('Manual job execution started');

        // Your job logic here

        gs.info('Manual job execution completed');
    } catch (e) {
        gs.error('Job error: ' + e.message);
    }
})();
```

---

## Quick Reference: Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| `Table not found` | Table doesn't exist or wrong name | Check `sys_db_object` |
| `Field not found` | Field doesn't exist on table | Check `sys_dictionary` |
| `Access denied` | ACL blocking access | Check ACLs, test as target user |
| `is not a constructor` | Script Include syntax error | Check `Class.create()` pattern |
| `Cannot read property of undefined` | Null reference | Add null checks |
| `Invalid update set` | Update set completed or invalid | Create new or reopen |
| `Scope mismatch` | Record in wrong scope | Set correct application first |

---

## When All Else Fails

1. **Check System Logs**: System Logs > All (filter by your timeframe)
2. **Enable Debug Mode**: Add `gs.info()` statements liberally
3. **Test in Isolation**: Copy script to background scripts and run alone
4. **Compare with Working Example**: Reference the Example Project Walkthrough
5. **Clear Cache**: Sometimes ServiceNow needs a cache clear
6. **Ask for Help**: Document what you tried and the exact error

---

## Prevention Checklist

Before starting any development:

- [ ] Verified execution mode (MCP or Fix Script)
- [ ] Application scope set and verified
- [ ] Update set created, set, and verified
- [ ] All scripts are idempotent (safe to re-run)
- [ ] Error handling in all scripts
- [ ] Logging added for debugging
- [ ] Tested incrementally (not waiting until the end)
- [ ] Got approval at each phase
