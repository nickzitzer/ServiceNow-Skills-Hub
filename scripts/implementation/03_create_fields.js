/**
 * Fix Script: 03_create_fields.js
 * Purpose: Add new fields to the existing sys_user_has_skill table
 * Scope: Global
 * Idempotent: Yes - safe to re-run (checks existence before creating)
 *
 * Existing fields on sys_user_has_skill (already present, NOT touched):
 *   - u_interest_level
 *   - u_last_manager_validation
 *   - u_peer_endorsement_count
 *
 * New fields added:
 *   1. u_manager_assessed_level - String (choice), "Manager Assessed Level"
 *   2. u_validation_status - String (choice), "Validation Status", default "pending"
 *   3. u_validation_notes - Journal Input, "Validation Notes"
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 01_create_update_set.js first
 */
(function() {
    try {
        var TABLE_NAME = 'sys_user_has_skill';
        var results = {
            fieldsCreated: 0,
            fieldsExisted: 0,
            errors: []
        };

        // ================================================================
        // Helper: Create a field if it does not exist
        // ================================================================
        function createField(tableName, elementName, columnLabel, internalType, opts) {
            opts = opts || {};

            var fld = new GlideRecord('sys_dictionary');
            fld.addQuery('name', tableName);
            fld.addQuery('element', elementName);
            fld.query();
            if (fld.next()) {
                gs.info('[Skills Hub] Field already exists: ' + tableName + '.' + elementName + ' (sys_id: ' + fld.getUniqueValue() + ')');
                results.fieldsExisted++;
                return fld.getUniqueValue();
            }

            fld.initialize();
            fld.setValue('name', tableName);
            fld.setValue('element', elementName);
            fld.setValue('column_label', columnLabel);
            fld.setValue('internal_type', internalType);

            if (opts.max_length) {
                fld.setValue('max_length', opts.max_length);
            }
            if (opts.mandatory) {
                fld.setValue('mandatory', true);
            }
            if (opts.default_value !== undefined) {
                fld.setValue('default_value', opts.default_value);
            }
            if (opts.choice !== undefined) {
                fld.setValue('choice', opts.choice);
            }

            var fid = fld.insert();
            if (fid) {
                gs.info('[Skills Hub] Created field: ' + tableName + '.' + elementName + ' (sys_id: ' + fid + ')');
                results.fieldsCreated++;
            } else {
                var msg = 'FAILED to create field: ' + tableName + '.' + elementName;
                gs.error('[Skills Hub] ' + msg);
                results.errors.push(msg);
            }
            return fid;
        }

        // ================================================================
        // Helper: Create choice values for a field
        // ================================================================
        function createChoices(tableName, elementName, choices) {
            for (var i = 0; i < choices.length; i++) {
                var choice = choices[i];
                var ch = new GlideRecord('sys_choice');
                ch.addQuery('name', tableName);
                ch.addQuery('element', elementName);
                ch.addQuery('value', choice.value);
                ch.query();
                if (ch.next()) {
                    gs.info('[Skills Hub] Choice already exists: ' + tableName + '.' + elementName + ' = ' + choice.value);
                    continue;
                }

                ch.initialize();
                ch.setValue('name', tableName);
                ch.setValue('element', elementName);
                ch.setValue('value', choice.value);
                ch.setValue('label', choice.label);
                ch.setValue('sequence', choice.sequence || (i * 10));
                ch.setValue('inactive', false);
                var cid = ch.insert();
                if (cid) {
                    gs.info('[Skills Hub] Created choice: ' + tableName + '.' + elementName + ' = ' + choice.value + ' (' + cid + ')');
                } else {
                    gs.error('[Skills Hub] FAILED to create choice: ' + tableName + '.' + elementName + ' = ' + choice.value);
                }
            }
        }

        // ================================================================
        // Verify the target table exists
        // ================================================================
        var tblCheck = new GlideRecord('sys_db_object');
        tblCheck.addQuery('name', TABLE_NAME);
        tblCheck.query();
        if (!tblCheck.next()) {
            gs.error('[Skills Hub] Target table does not exist: ' + TABLE_NAME + ' - aborting.');
            return;
        }
        gs.info('[Skills Hub] Target table confirmed: ' + TABLE_NAME + ' (sys_id: ' + tblCheck.getUniqueValue() + ')');

        // ================================================================
        // FIELD 1: u_manager_assessed_level
        // String, max_length 40, choice=1, "Manager Assessed Level"
        // ================================================================
        gs.info('[Skills Hub] --- Adding field: u_manager_assessed_level ---');
        createField(TABLE_NAME, 'u_manager_assessed_level', 'Manager Assessed Level', 'string', {
            max_length: 40,
            choice: 1
        });

        createChoices(TABLE_NAME, 'u_manager_assessed_level', [
            { value: 'novice', label: 'Novice', sequence: 10 },
            { value: 'intermediate', label: 'Intermediate', sequence: 20 },
            { value: 'proficient', label: 'Proficient', sequence: 30 },
            { value: 'advanced', label: 'Advanced', sequence: 40 },
            { value: 'expert', label: 'Expert', sequence: 50 }
        ]);

        // ================================================================
        // FIELD 2: u_validation_status
        // String, max_length 40, choice=1, "Validation Status", default "pending"
        // ================================================================
        gs.info('[Skills Hub] --- Adding field: u_validation_status ---');
        createField(TABLE_NAME, 'u_validation_status', 'Validation Status', 'string', {
            max_length: 40,
            choice: 1,
            default_value: 'pending'
        });

        createChoices(TABLE_NAME, 'u_validation_status', [
            { value: 'pending', label: 'Pending', sequence: 10 },
            { value: 'validated', label: 'Validated', sequence: 20 },
            { value: 'disputed', label: 'Disputed', sequence: 30 },
            { value: 'expired', label: 'Expired', sequence: 40 }
        ]);

        // ================================================================
        // FIELD 3: u_validation_notes
        // Journal input, "Validation Notes"
        // ================================================================
        gs.info('[Skills Hub] --- Adding field: u_validation_notes ---');
        createField(TABLE_NAME, 'u_validation_notes', 'Validation Notes', 'journal_input', {});

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== FIELD CREATION SUMMARY =====');
        gs.info('[Skills Hub] Table: ' + TABLE_NAME);
        gs.info('[Skills Hub] Fields created: ' + results.fieldsCreated);
        gs.info('[Skills Hub] Fields already existed: ' + results.fieldsExisted);
        gs.info('[Skills Hub] Errors: ' + results.errors.length);
        if (results.errors.length > 0) {
            for (var i = 0; i < results.errors.length; i++) {
                gs.error('[Skills Hub] Error: ' + results.errors[i]);
            }
        }
        gs.info('[Skills Hub] =================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 03_create_fields: ' + e.message);
    }
})();
