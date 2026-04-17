/**
 * Fix Script: 28_create_demand_tables.js
 * Purpose: Create the demand integration table (u_story_skill_assignment) with fields and choices
 * Scope: Global
 * Idempotent: Yes - checks existence before creating tables, fields, and choices
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 27_create_update_set_phase4.js first
 *
 * Tables created:
 *   1. u_story_skill_assignment - Story Skill Assignment (M2M: story <-> skill)
 *
 * Fields:
 *   - u_story: Reference to rm_story (falls back to task if rm_story unavailable)
 *   - u_skill: Reference to cmn_skill
 *   - u_estimated_hours: Decimal
 *   - u_proficiency_required: String (choice) - novice/intermediate/proficient/advanced/expert
 *   - u_active: Boolean (default true)
 */
(function() {
    try {
        var results = {
            tablesCreated: 0,
            tablesExisted: 0,
            fieldsCreated: 0,
            fieldsExisted: 0,
            errors: []
        };

        // ================================================================
        // Helper: Create a table if it does not exist
        // ================================================================
        function createTable(tableName, tableLabel, superClass) {
            var tbl = new GlideRecord('sys_db_object');
            tbl.addQuery('name', tableName);
            tbl.query();
            if (tbl.next()) {
                gs.info('[Skills Hub] Table already exists: ' + tableName + ' (sys_id: ' + tbl.getUniqueValue() + ')');
                results.tablesExisted++;
                return tbl.getUniqueValue();
            }

            tbl.initialize();
            tbl.setValue('name', tableName);
            tbl.setValue('label', tableLabel);
            tbl.setValue('is_extendable', true);
            tbl.setValue('create_access_controls', true);
            if (superClass) {
                tbl.setValue('super_class', superClass);
            }
            var id = tbl.insert();
            if (id) {
                gs.info('[Skills Hub] Created table: ' + tableName + ' (' + id + ')');
                results.tablesCreated++;
            } else {
                var msg = 'FAILED to create table: ' + tableName;
                gs.error('[Skills Hub] ' + msg);
                results.errors.push(msg);
            }
            return id;
        }

        // ================================================================
        // Helper: Create a field (sys_dictionary entry) if it does not exist
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
            if (opts.display) {
                fld.setValue('display', true);
            }
            if (opts.default_value !== undefined) {
                fld.setValue('default_value', opts.default_value);
            }
            if (opts.reference) {
                fld.setValue('reference', opts.reference);
            }
            if (opts.choice !== undefined) {
                fld.setValue('choice', opts.choice);
            }
            if (opts.active !== undefined) {
                fld.setValue('active', opts.active);
            }

            var fid = fld.insert();
            if (fid) {
                gs.info('[Skills Hub] Created field: ' + tableName + '.' + elementName + ' (' + fid + ')');
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
        // Helper: Detect whether rm_story table exists
        // ================================================================
        function tableExists(tableName) {
            var tbl = new GlideRecord('sys_db_object');
            tbl.addQuery('name', tableName);
            tbl.query();
            return tbl.hasNext();
        }

        // ================================================================
        // TABLE: u_story_skill_assignment - "Story Skill Assignment"
        // ================================================================
        gs.info('[Skills Hub] --- Creating table: u_story_skill_assignment ---');
        createTable('u_story_skill_assignment', 'Story Skill Assignment');

        // Determine reference target for the story field
        // Prefer rm_story (Agile Development plugin) but fall back to task
        var storyRefTable = 'task';
        if (tableExists('rm_story')) {
            storyRefTable = 'rm_story';
            gs.info('[Skills Hub] rm_story table found - using rm_story as reference target for u_story field');
        } else {
            gs.info('[Skills Hub] rm_story table NOT found - falling back to task as reference target for u_story field');
        }

        createField('u_story_skill_assignment', 'u_story', 'Story', 'reference', {
            mandatory: true, reference: storyRefTable
        });
        createField('u_story_skill_assignment', 'u_skill', 'Skill', 'reference', {
            mandatory: true, reference: 'cmn_skill', display: true
        });
        createField('u_story_skill_assignment', 'u_estimated_hours', 'Estimated Hours', 'decimal', {
            max_length: 15
        });
        createField('u_story_skill_assignment', 'u_proficiency_required', 'Proficiency Required', 'string', {
            max_length: 40, choice: 1, default_value: 'intermediate'
        });
        createField('u_story_skill_assignment', 'u_active', 'Active', 'boolean', {
            default_value: 'true'
        });

        // Choice values for proficiency_required
        createChoices('u_story_skill_assignment', 'u_proficiency_required', [
            { value: 'novice', label: 'Novice', sequence: 10 },
            { value: 'intermediate', label: 'Intermediate', sequence: 20 },
            { value: 'proficient', label: 'Proficient', sequence: 30 },
            { value: 'advanced', label: 'Advanced', sequence: 40 },
            { value: 'expert', label: 'Expert', sequence: 50 }
        ]);

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== DEMAND TABLE CREATION SUMMARY =====');
        gs.info('[Skills Hub] Tables created: ' + results.tablesCreated);
        gs.info('[Skills Hub] Tables already existed: ' + results.tablesExisted);
        gs.info('[Skills Hub] Fields created: ' + results.fieldsCreated);
        gs.info('[Skills Hub] Fields already existed: ' + results.fieldsExisted);
        gs.info('[Skills Hub] Story reference target: ' + storyRefTable);
        gs.info('[Skills Hub] Errors: ' + results.errors.length);
        if (results.errors.length > 0) {
            for (var i = 0; i < results.errors.length; i++) {
                gs.error('[Skills Hub] Error: ' + results.errors[i]);
            }
        }
        gs.info('[Skills Hub] ==========================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 28_create_demand_tables: ' + e.message);
    }
})();
