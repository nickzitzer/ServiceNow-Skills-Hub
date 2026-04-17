/**
 * Fix Script: 02_create_tables.js
 * Purpose: Create Skills Hub tables and their fields
 * Scope: Global
 * Idempotent: Yes - safe to re-run (checks existence before creating)
 *
 * Tables created:
 *   1. u_skill_request - Skill Request
 *   2. u_skill_profile_requirement - Skill Profile Requirement
 *   3. u_skill_category_group - Skill Category Group
 *   4. u_m2m_skill_category_group - Skill Category Group Member
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 01_create_update_set.js first
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
        // TABLE 1: u_skill_request - "Skill Request"
        // ================================================================
        gs.info('[Skills Hub] --- Creating table: u_skill_request ---');
        createTable('u_skill_request', 'Skill Request');

        createField('u_skill_request', 'u_requested_by', 'Requested By', 'reference', {
            mandatory: true, reference: 'sys_user'
        });
        createField('u_skill_request', 'u_skill_name', 'Skill Name', 'string', {
            max_length: 200, mandatory: true, display: true
        });
        createField('u_skill_request', 'u_category', 'Category', 'reference', {
            reference: 'cmn_skill_category'
        });
        createField('u_skill_request', 'u_justification', 'Justification', 'string', {
            max_length: 4000
        });
        createField('u_skill_request', 'u_status', 'Status', 'string', {
            max_length: 40, choice: 1, default_value: 'pending'
        });
        createField('u_skill_request', 'u_approved_by', 'Approved By', 'reference', {
            reference: 'sys_user'
        });
        createField('u_skill_request', 'u_approval_date', 'Approval Date', 'glide_date_time', {});
        createField('u_skill_request', 'u_rejection_reason', 'Rejection Reason', 'string', {
            max_length: 4000
        });

        createChoices('u_skill_request', 'u_status', [
            { value: 'pending', label: 'Pending', sequence: 10 },
            { value: 'approved', label: 'Approved', sequence: 20 },
            { value: 'rejected', label: 'Rejected', sequence: 30 }
        ]);

        // ================================================================
        // TABLE 2: u_skill_profile_requirement - "Skill Profile Requirement"
        // ================================================================
        gs.info('[Skills Hub] --- Creating table: u_skill_profile_requirement ---');
        createTable('u_skill_profile_requirement', 'Skill Profile Requirement');

        createField('u_skill_profile_requirement', 'u_job_title', 'Job Title', 'string', {
            max_length: 200, mandatory: true
        });
        createField('u_skill_profile_requirement', 'u_skill', 'Skill', 'reference', {
            mandatory: true, reference: 'cmn_skill'
        });
        createField('u_skill_profile_requirement', 'u_required_level', 'Required Level', 'string', {
            max_length: 40, choice: 1
        });
        createField('u_skill_profile_requirement', 'u_priority', 'Priority', 'string', {
            max_length: 40, choice: 1
        });
        createField('u_skill_profile_requirement', 'u_active', 'Active', 'boolean', {
            default_value: 'true'
        });

        createChoices('u_skill_profile_requirement', 'u_required_level', [
            { value: 'novice', label: 'Novice', sequence: 10 },
            { value: 'intermediate', label: 'Intermediate', sequence: 20 },
            { value: 'proficient', label: 'Proficient', sequence: 30 },
            { value: 'advanced', label: 'Advanced', sequence: 40 },
            { value: 'expert', label: 'Expert', sequence: 50 }
        ]);

        createChoices('u_skill_profile_requirement', 'u_priority', [
            { value: 'required', label: 'Required', sequence: 10 },
            { value: 'preferred', label: 'Preferred', sequence: 20 },
            { value: 'nice_to_have', label: 'Nice to Have', sequence: 30 }
        ]);

        // ================================================================
        // TABLE 3: u_skill_category_group - "Skill Category Group"
        // ================================================================
        gs.info('[Skills Hub] --- Creating table: u_skill_category_group ---');
        createTable('u_skill_category_group', 'Skill Category Group');

        createField('u_skill_category_group', 'u_group_name', 'Group Name', 'string', {
            max_length: 200, mandatory: true, display: true
        });
        createField('u_skill_category_group', 'u_description', 'Description', 'string', {
            max_length: 4000
        });

        // ================================================================
        // TABLE 4: u_m2m_skill_category_group - "Skill Category Group Member"
        // ================================================================
        gs.info('[Skills Hub] --- Creating table: u_m2m_skill_category_group ---');
        createTable('u_m2m_skill_category_group', 'Skill Category Group Member');

        createField('u_m2m_skill_category_group', 'u_skill', 'Skill', 'reference', {
            mandatory: true, reference: 'cmn_skill'
        });
        createField('u_m2m_skill_category_group', 'u_category_group', 'Category Group', 'reference', {
            mandatory: true, reference: 'u_skill_category_group'
        });
        createField('u_m2m_skill_category_group', 'u_category', 'Category', 'reference', {
            reference: 'cmn_skill_category'
        });

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== TABLE CREATION SUMMARY =====');
        gs.info('[Skills Hub] Tables created: ' + results.tablesCreated);
        gs.info('[Skills Hub] Tables already existed: ' + results.tablesExisted);
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
        gs.error('[Skills Hub] Fatal error in 02_create_tables: ' + e.message);
    }
})();
