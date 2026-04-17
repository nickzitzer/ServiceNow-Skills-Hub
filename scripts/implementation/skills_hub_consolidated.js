/**
 * =============================================================================
 * Skills Hub - Consolidated Fix Script
 * =============================================================================
 *
 * File: skills_hub_consolidated.js
 * Purpose: Single consolidated fix script containing all Skills Hub implementation
 *          scripts merged in dependency order. Run this once in ServiceNow
 *          Scripts - Background (Global scope) to deploy the entire Skills Hub.
 *
 * Date: 2026-03-25
 * Scope: Global
 *
 * IDEMPOTENT: Yes - every section checks for existing records before creating.
 *             Safe to re-run without creating duplicates.
 *
 * ASSUMPTION: The update set is already created and set as current before running.
 *             (Use 01_create_update_set.js or set manually via Update Sets UI.)
 *
 * SECTIONS (23 total):
 *   Section  1: Tables (02)                       - Custom tables and inline fields/choices
 *   Section  2: Fields (03)                       - Additional fields on sys_user_has_skill
 *   Section  3: Choices (04)                      - Choice values for all Skills Hub fields
 *   Section  4: Roles (05)                        - skill_admin and skill_manager roles
 *   Section  5: Business Rules (06)               - Endorsement, validation, and sync rules
 *   Section  6: ACLs (07)                         - Role-based access controls
 *   Section  7: Seed Data (08)                    - Profile requirements, category groups, properties
 *   Section  8: Catalog Item (11)                 - Request New Skill catalog item
 *   Section  9: Workflow Business Rules (12)       - RITM-to-skill-request and approval rules
 *   Section 10: Notifications (13)                - Email notification templates
 *   Section 11: SkillsHubUtils Method Injection (14) - Phase 2 methods (validate, dispute, etc.)
 *   Section 12: Scheduled Jobs (16)               - Monthly validation reminder
 *   Section 13: Tier System Injection (19)        - calculateUserTier method
 *   Section 14: Leaderboard Widget (21)           - Team/department leaderboard widget
 *   Section 15: Skill Grouping Logic (22)         - SkillsHubGrouping Script Include
 *   Section 16: Nav Modules (24)                  - Application menu and navigation modules
 *   Section 17: Tab Navigation Widget (25)        - Horizontal tab bar widget
 *   Section 18: Demand Tables (28)                - u_story_skill_assignment table
 *   Section 19: PA Indicators (29)                - Performance Analytics indicators/breakdowns
 *   Section 20: PA Dashboard (30)                 - PA dashboard with tabs and widgets
 *   Section 21: Gap Analysis Widget (31)          - Supply vs demand gap analysis widget
 *   Section 22: Skill Detection (32)              - SkillsHubDetection Script Include
 *   Section 23: User Stories (34)                 - rm_story records for Skills Hub backlog
 *
 * =============================================================================
 */
(function() {
    var _masterStart = new GlideDateTime();
    var _sectionResults = [];

    gs.info('[Skills Hub] ============================================================');
    gs.info('[Skills Hub]  CONSOLIDATED FIX SCRIPT - STARTING');
    gs.info('[Skills Hub]  Timestamp: ' + _masterStart.getDisplayValue());
    gs.info('[Skills Hub]  Total sections: 23');
    gs.info('[Skills Hub] ============================================================');


    // ==================================================================
    // SECTION  1: TABLES (02)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 1: TABLES (02) ==========');
    try {
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

        _sectionResults.push({ section: 1, name: 'TABLES (02)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 1: TABLES (02) - COMPLETE ==========');
    } catch (_sectionErr1) {
        gs.error('[Skills Hub] SECTION 1 FATAL ERROR (TABLES (02)): ' + _sectionErr1.message);
        _sectionResults.push({ section: 1, name: 'TABLES (02)', status: 'ERROR: ' + _sectionErr1.message });
    }


    // ==================================================================
    // SECTION  2: FIELDS (03)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 2: FIELDS (03) ==========');
    try {
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

        _sectionResults.push({ section: 2, name: 'FIELDS (03)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 2: FIELDS (03) - COMPLETE ==========');
    } catch (_sectionErr2) {
        gs.error('[Skills Hub] SECTION 2 FATAL ERROR (FIELDS (03)): ' + _sectionErr2.message);
        _sectionResults.push({ section: 2, name: 'FIELDS (03)', status: 'ERROR: ' + _sectionErr2.message });
    }


    // ==================================================================
    // SECTION  3: CHOICES (04)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 3: CHOICES (04) ==========');
    try {
        try {
                var created = 0;
                var skipped = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] === Creating Choice Values ===');
        
                /**
                 * Creates a choice record if it does not already exist.
                 * @param {string} tableName - The table the choice belongs to
                 * @param {string} elementName - The field/element name
                 * @param {string} value - The stored value
                 * @param {string} label - The display label
                 * @param {number} sequence - The sort order
                 */
                function createChoice(tableName, elementName, value, label, sequence) {
                    try {
                        var gr = new GlideRecord('sys_choice');
                        gr.addQuery('name', tableName);
                        gr.addQuery('element', elementName);
                        gr.addQuery('value', value);
                        gr.query();
                        if (gr.hasNext()) {
                            gs.info('[Skills Hub] Choice exists: ' + tableName + '.' + elementName + ' = ' + value);
                            skipped++;
                            return;
                        }
                        gr.initialize();
                        gr.name = tableName;
                        gr.element = elementName;
                        gr.value = value;
                        gr.label = label;
                        gr.sequence = sequence;
                        gr.language = 'en';
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created choice: ' + tableName + '.' + elementName + ' = ' + value + ' (' + id + ')');
                            created++;
                        } else {
                            gs.error('[Skills Hub] Failed to create choice: ' + tableName + '.' + elementName + ' = ' + value);
                            errors++;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating choice ' + tableName + '.' + elementName + ' = ' + value + ': ' + e.message);
                        errors++;
                    }
                }
        
                // ---------------------------------------------------------------
                // Table: sys_user_has_skill
                // ---------------------------------------------------------------
                gs.info('[Skills Hub] --- sys_user_has_skill choices ---');
        
                // Field: u_manager_assessed_level
                createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'novice', 'Novice', 100);
                createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'intermediate', 'Intermediate', 200);
                createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'proficient', 'Proficient', 300);
                createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'advanced', 'Advanced', 400);
                createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'expert', 'Expert', 500);
        
                // Field: u_validation_status
                createChoice('sys_user_has_skill', 'u_validation_status', 'pending', 'Pending', 100);
                createChoice('sys_user_has_skill', 'u_validation_status', 'validated', 'Validated', 200);
                createChoice('sys_user_has_skill', 'u_validation_status', 'disputed', 'Disputed', 300);
                createChoice('sys_user_has_skill', 'u_validation_status', 'expired', 'Expired', 400);
        
                // ---------------------------------------------------------------
                // Table: u_skill_request
                // ---------------------------------------------------------------
                gs.info('[Skills Hub] --- u_skill_request choices ---');
        
                // Field: u_status
                createChoice('u_skill_request', 'u_status', 'pending', 'Pending', 100);
                createChoice('u_skill_request', 'u_status', 'approved', 'Approved', 200);
                createChoice('u_skill_request', 'u_status', 'rejected', 'Rejected', 300);
        
                // ---------------------------------------------------------------
                // Table: u_skill_profile_requirement
                // ---------------------------------------------------------------
                gs.info('[Skills Hub] --- u_skill_profile_requirement choices ---');
        
                // Field: u_required_level
                createChoice('u_skill_profile_requirement', 'u_required_level', 'novice', 'Novice', 100);
                createChoice('u_skill_profile_requirement', 'u_required_level', 'intermediate', 'Intermediate', 200);
                createChoice('u_skill_profile_requirement', 'u_required_level', 'proficient', 'Proficient', 300);
                createChoice('u_skill_profile_requirement', 'u_required_level', 'advanced', 'Advanced', 400);
                createChoice('u_skill_profile_requirement', 'u_required_level', 'expert', 'Expert', 500);
        
                // Field: u_priority
                createChoice('u_skill_profile_requirement', 'u_priority', 'required', 'Required', 100);
                createChoice('u_skill_profile_requirement', 'u_priority', 'preferred', 'Preferred', 200);
                createChoice('u_skill_profile_requirement', 'u_priority', 'nice_to_have', 'Nice to Have', 300);
        
                // ---------------------------------------------------------------
                // Summary
                // ---------------------------------------------------------------
                var total = created + skipped + errors;
                gs.info('[Skills Hub] === Choice Creation Complete ===');
                gs.info('[Skills Hub] Total processed: ' + total);
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
                gs.info('[Skills Hub] Errors: ' + errors);
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in choice creation script: ' + e.message);
            }

        _sectionResults.push({ section: 3, name: 'CHOICES (04)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 3: CHOICES (04) - COMPLETE ==========');
    } catch (_sectionErr3) {
        gs.error('[Skills Hub] SECTION 3 FATAL ERROR (CHOICES (04)): ' + _sectionErr3.message);
        _sectionResults.push({ section: 3, name: 'CHOICES (04)', status: 'ERROR: ' + _sectionErr3.message });
    }


    // ==================================================================
    // SECTION  4: ROLES (05)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 4: ROLES (05) ==========');
    try {
        try {
                gs.info('[Skills Hub] Starting role creation...');
        
                // ============================================================
                // 1. skill_admin
                // ============================================================
                var skillAdminId = '';
                var grAdmin = new GlideRecord('sys_user_role');
                grAdmin.addQuery('name', 'skill_admin');
                grAdmin.query();
                if (grAdmin.next()) {
                    skillAdminId = grAdmin.sys_id.toString();
                    gs.info('[Skills Hub] Role "skill_admin" already exists (' + skillAdminId + ')');
                } else {
                    grAdmin.initialize();
                    grAdmin.name = 'skill_admin';
                    grAdmin.description = 'Can approve skill requests and manage skill configuration';
                    grAdmin.elevated_privilege = false;
                    skillAdminId = grAdmin.insert();
                    gs.info('[Skills Hub] Created role "skill_admin" (' + skillAdminId + ')');
                }
        
                // ============================================================
                // 2. skill_manager
                // ============================================================
                var skillManagerId = '';
                var grManager = new GlideRecord('sys_user_role');
                grManager.addQuery('name', 'skill_manager');
                grManager.query();
                if (grManager.next()) {
                    skillManagerId = grManager.sys_id.toString();
                    gs.info('[Skills Hub] Role "skill_manager" already exists (' + skillManagerId + ')');
                } else {
                    grManager.initialize();
                    grManager.name = 'skill_manager';
                    grManager.description = 'Can validate and assess direct reports\' skills';
                    grManager.elevated_privilege = false;
                    skillManagerId = grManager.insert();
                    gs.info('[Skills Hub] Created role "skill_manager" (' + skillManagerId + ')');
                }
        
                // ============================================================
                // 3. skill_manager contains skill_user
                // ============================================================
                var grSkillUser = new GlideRecord('sys_user_role');
                grSkillUser.addQuery('name', 'skill_user');
                grSkillUser.query();
        
                if (!grSkillUser.next()) {
                    gs.error('[Skills Hub] skill_user role not found by name. Skipping role-contains relationship.');
                } else {
                    var skillUserSysId = grSkillUser.getUniqueValue();
                    // Check if the contains relationship already exists
                    var grContains = new GlideRecord('sys_user_role_contains');
                    grContains.addQuery('role', skillManagerId);
                    grContains.addQuery('contains', skillUserSysId);
                    grContains.query();
                    if (grContains.next()) {
                        gs.info('[Skills Hub] Role-contains relationship (skill_manager -> skill_user) already exists (' + grContains.sys_id.toString() + ')');
                    } else {
                        grContains.initialize();
                        grContains.role = skillManagerId;
                        grContains.contains = skillUserSysId;
                        var containsId = grContains.insert();
                        gs.info('[Skills Hub] Created role-contains relationship (skill_manager -> skill_user) (' + containsId + ')');
                    }
                }
        
                gs.info('[Skills Hub] Role creation complete.');
            } catch (e) {
                gs.error('[Skills Hub] Role creation failed: ' + e.message);
            }

        _sectionResults.push({ section: 4, name: 'ROLES (05)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 4: ROLES (05) - COMPLETE ==========');
    } catch (_sectionErr4) {
        gs.error('[Skills Hub] SECTION 4 FATAL ERROR (ROLES (05)): ' + _sectionErr4.message);
        _sectionResults.push({ section: 4, name: 'ROLES (05)', status: 'ERROR: ' + _sectionErr4.message });
    }


    // ==================================================================
    // SECTION  5: BUSINESS RULES (06)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 5: BUSINESS RULES (06) ==========');
    try {
        try {
                var created = 0;
                var skipped = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] === Creating Business Rules ===');
        
                /**
                 * Creates a business rule if it does not already exist.
                 * @param {object} config - Business rule configuration
                 * @param {string} config.name - Rule name
                 * @param {string} config.collection - Target table
                 * @param {string} config.when - When to run (before/after)
                 * @param {boolean} config.action_insert - Run on insert
                 * @param {boolean} config.action_update - Run on update
                 * @param {boolean} config.action_delete - Run on delete
                 * @param {number} config.order - Execution order
                 * @param {string} config.script - Rule script
                 * @param {boolean} [config.active] - Active flag (default true)
                 * @param {string} [config.filter_condition] - Filter condition
                 * @returns {string|null} sys_id of created/existing record
                 */
                function createBusinessRule(config) {
                    try {
                        var gr = new GlideRecord('sys_script');
                        gr.addQuery('name', config.name);
                        gr.addQuery('collection', config.collection);
                        gr.query();
                        if (gr.next()) {
                            gs.info('[Skills Hub] Business rule exists: "' + config.name + '" on ' + config.collection + ' (' + gr.sys_id.toString() + ')');
                            skipped++;
                            return gr.sys_id.toString();
                        }
                        gr.initialize();
                        gr.name = config.name;
                        gr.collection = config.collection;
                        gr.when = config.when || 'after';
                        gr.action_insert = config.action_insert || false;
                        gr.action_update = config.action_update || false;
                        gr.action_delete = config.action_delete || false;
                        gr.action_query = false;
                        gr.order = config.order || 100;
                        gr.active = (config.active !== undefined) ? config.active : true;
                        gr.script = config.script;
                        if (config.filter_condition) {
                            gr.filter_condition = config.filter_condition;
                        }
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created business rule: "' + config.name + '" on ' + config.collection + ' (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] Failed to create business rule: "' + config.name + '" on ' + config.collection);
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating business rule "' + config.name + '": ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                // ============================================================
                // 1. Increment Endorsement Count
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Increment Endorsement Count',
                    collection: 'u_m2m_skill_endorsement',
                    when: 'after',
                    action_insert: true,
                    action_update: false,
                    action_delete: false,
                    order: 100,
                    script: '(function executeRule(current, previous) {\n' +
                        '    try {\n' +
                        '        var skillRec = new GlideRecord(\'sys_user_has_skill\');\n' +
                        '        if (skillRec.get(current.u_skill_record)) {\n' +
                        '            var count = parseInt(skillRec.u_peer_endorsement_count) || 0;\n' +
                        '            skillRec.u_peer_endorsement_count = count + 1;\n' +
                        '            skillRec.update();\n' +
                        '            gs.info(\'[Skills Hub] Endorsement count incremented for \' + skillRec.skill.name + \' to \' + (count + 1));\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-IncrementEndorsement: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 2. Decrement Endorsement Count
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Decrement Endorsement Count',
                    collection: 'u_m2m_skill_endorsement',
                    when: 'after',
                    action_insert: false,
                    action_update: false,
                    action_delete: true,
                    order: 100,
                    script: '(function executeRule(current, previous) {\n' +
                        '    try {\n' +
                        '        var skillRec = new GlideRecord(\'sys_user_has_skill\');\n' +
                        '        if (skillRec.get(current.u_skill_record)) {\n' +
                        '            var count = parseInt(skillRec.u_peer_endorsement_count) || 0;\n' +
                        '            if (count > 0) {\n' +
                        '                skillRec.u_peer_endorsement_count = count - 1;\n' +
                        '                skillRec.update();\n' +
                        '                gs.info(\'[Skills Hub] Endorsement count decremented for \' + skillRec.skill.name + \' to \' + (count - 1));\n' +
                        '            }\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-DecrementEndorsement: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 3. Prevent Self Endorsement
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Prevent Self Endorsement',
                    collection: 'u_m2m_skill_endorsement',
                    when: 'before',
                    action_insert: true,
                    action_update: false,
                    action_delete: false,
                    order: 100,
                    script: '(function executeRule(current, previous) {\n' +
                        '    try {\n' +
                        '        var skillRec = new GlideRecord(\'sys_user_has_skill\');\n' +
                        '        if (skillRec.get(current.u_skill_record)) {\n' +
                        '            if (current.u_endorser == skillRec.user) {\n' +
                        '                gs.addErrorMessage(\'You cannot endorse your own skill.\');\n' +
                        '                current.setAbortAction(true);\n' +
                        '                gs.info(\'[Skills Hub] Blocked self-endorsement attempt by \' + current.u_endorser.getDisplayValue());\n' +
                        '            }\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-PreventSelfEndorsement: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 4. Prevent Duplicate Endorsement
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Prevent Duplicate Endorsement',
                    collection: 'u_m2m_skill_endorsement',
                    when: 'before',
                    action_insert: true,
                    action_update: false,
                    action_delete: false,
                    order: 200,
                    script: '(function executeRule(current, previous) {\n' +
                        '    try {\n' +
                        '        var existing = new GlideRecord(\'u_m2m_skill_endorsement\');\n' +
                        '        existing.addQuery(\'u_endorser\', current.u_endorser);\n' +
                        '        existing.addQuery(\'u_skill_record\', current.u_skill_record);\n' +
                        '        existing.query();\n' +
                        '        if (existing.hasNext()) {\n' +
                        '            gs.addErrorMessage(\'You have already endorsed this skill.\');\n' +
                        '            current.setAbortAction(true);\n' +
                        '            gs.info(\'[Skills Hub] Blocked duplicate endorsement by \' + current.u_endorser.getDisplayValue());\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-PreventDuplicateEndorsement: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 5. Set Validation Status on Manager Validate
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Set Validation Status on Manager Validate',
                    collection: 'sys_user_has_skill',
                    when: 'before',
                    action_insert: false,
                    action_update: true,
                    action_delete: false,
                    order: 100,
                    filter_condition: 'u_last_manager_validationCHANGES',
                    script: '(function executeRule(current, previous) {\n' +
                        '    if (!current.u_last_manager_validation.changes()) return;\n' +
                        '    try {\n' +
                        '        if (!current.u_last_manager_validation.nil()) {\n' +
                        '            current.u_validation_status = \'validated\';\n' +
                        '            gs.info(\'[Skills Hub] Validation status set to validated for \' + current.skill.name + \' (\' + current.user.name + \')\');\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-SetValidationStatus: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 6. Sync Cross-Category Skill Scores
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Sync Cross-Category Skill Scores',
                    collection: 'sys_user_has_skill',
                    when: 'after',
                    action_insert: false,
                    action_update: true,
                    action_delete: false,
                    order: 200,
                    filter_condition: 'skill_levelCHANGES',
                    script: '(function executeRule(current, previous) {\n' +
                        '    if (!current.skill_level.changes()) return;\n' +
                        '    try {\n' +
                        '        var skillName = current.skill.name.toString();\n' +
                        '        var userId = current.user.toString();\n' +
                        '        var newLevel = current.skill_level.toString();\n' +
                        '        \n' +
                        '        var gr = new GlideRecord(\'sys_user_has_skill\');\n' +
                        '        gr.addQuery(\'user\', userId);\n' +
                        '        gr.addQuery(\'skill.name\', skillName);\n' +
                        '        gr.addQuery(\'sys_id\', \'!=\', current.sys_id);\n' +
                        '        gr.query();\n' +
                        '        \n' +
                        '        var synced = 0;\n' +
                        '        while (gr.next()) {\n' +
                        '            gr.skill_level = newLevel;\n' +
                        '            gr.update();\n' +
                        '            synced++;\n' +
                        '        }\n' +
                        '        if (synced > 0) {\n' +
                        '            gs.info(\'[Skills Hub] Synced proficiency for "\' + skillName + \'" across \' + synced + \' additional category assignments\');\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-SyncCrossCategory: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 7. Skill Expiration Check (Scheduled Job)
                // ============================================================
                (function createScheduledJob() {
                    try {
                        var grJob = new GlideRecord('sysauto_script');
                        grJob.addQuery('name', 'Skills Hub - Skill Expiration Check');
                        grJob.query();
                        if (grJob.next()) {
                            gs.info('[Skills Hub] Scheduled job "Skills Hub - Skill Expiration Check" already exists (' + grJob.sys_id.toString() + ')');
                            skipped++;
                            return;
                        }
                        grJob.initialize();
                        grJob.name = 'Skills Hub - Skill Expiration Check';
                        grJob.run_type = 'daily';
                        grJob.run_time = '02:00:00';
                        grJob.active = true;
                        grJob.script = '(function() {\n' +
                            '    try {\n' +
                            '        gs.info(\'[Skills Hub] Starting skill expiration check\');\n' +
                            '        var cutoff = new GlideDateTime();\n' +
                            '        cutoff.addMonthsLocalTime(-12);\n' +
                            '        \n' +
                            '        var gr = new GlideRecord(\'sys_user_has_skill\');\n' +
                            '        gr.addQuery(\'u_validation_status\', \'!=\', \'expired\');\n' +
                            '        gr.addNotNullQuery(\'u_last_manager_validation\');\n' +
                            '        gr.addQuery(\'u_last_manager_validation\', \'<\', cutoff);\n' +
                            '        gr.query();\n' +
                            '        \n' +
                            '        var expired = 0;\n' +
                            '        while (gr.next()) {\n' +
                            '            gr.u_validation_status = \'expired\';\n' +
                            '            gr.update();\n' +
                            '            expired++;\n' +
                            '        }\n' +
                            '        gs.info(\'[Skills Hub] Expired \' + expired + \' skill validations older than 12 months\');\n' +
                            '    } catch (e) {\n' +
                            '        gs.error(\'[Skills Hub] ExpirationJob: \' + e.message);\n' +
                            '    }\n' +
                            '})();';
                        var jobId = grJob.insert();
                        if (jobId) {
                            gs.info('[Skills Hub] Created scheduled job "Skills Hub - Skill Expiration Check" (' + jobId + ')');
                            created++;
                        } else {
                            gs.error('[Skills Hub] Failed to create scheduled job "Skills Hub - Skill Expiration Check"');
                            errors++;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating scheduled job: ' + e.message);
                        errors++;
                    }
                })();
        
                // ---------------------------------------------------------------
                // Summary
                // ---------------------------------------------------------------
                var total = created + skipped + errors;
                gs.info('[Skills Hub] === Business Rule Creation Complete ===');
                gs.info('[Skills Hub] Total processed: ' + total);
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
                gs.info('[Skills Hub] Errors: ' + errors);
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in business rule creation script: ' + e.message);
            }

        _sectionResults.push({ section: 5, name: 'BUSINESS RULES (06)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 5: BUSINESS RULES (06) - COMPLETE ==========');
    } catch (_sectionErr5) {
        gs.error('[Skills Hub] SECTION 5 FATAL ERROR (BUSINESS RULES (06)): ' + _sectionErr5.message);
        _sectionResults.push({ section: 5, name: 'BUSINESS RULES (06)', status: 'ERROR: ' + _sectionErr5.message });
    }


    // ==================================================================
    // SECTION  6: ACLS (07)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 6: ACLS (07) ==========');
    try {
        try {
                var created = 0;
                var skipped = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] === Creating ACLs ===');
        
                /**
                 * Creates an ACL if it does not already exist.
                 * @param {object} config - ACL configuration
                 * @param {string} config.name - ACL name (table or table.field)
                 * @param {string} config.operation - Operation (read/write/create/delete)
                 * @param {boolean} [config.admin_overrides] - Admin overrides flag (default true)
                 * @param {boolean} [config.advanced] - Advanced script flag (default false)
                 * @param {string} [config.script] - Advanced script body
                 * @param {string} [config.description] - ACL description
                 * @param {string} [config.type] - ACL type (default 'record')
                 * @returns {string|null} sys_id of created/existing record
                 */
                function createACL(config) {
                    try {
                        var gr = new GlideRecord('sys_security_acl');
                        gr.addQuery('name', config.name);
                        gr.addQuery('operation', config.operation);
                        gr.query();
                        if (gr.next()) {
                            gs.info('[Skills Hub] ACL exists: ' + config.name + ' (' + config.operation + ') (' + gr.sys_id.toString() + ')');
                            skipped++;
                            return gr.sys_id.toString();
                        }
                        gr.initialize();
                        gr.name = config.name;
                        gr.operation = config.operation;
                        gr.admin_overrides = (config.admin_overrides !== undefined) ? config.admin_overrides : true;
                        gr.active = true;
                        gr.type = config.type || 'record';
                        gr.advanced = config.advanced || false;
                        if (config.script) {
                            gr.script = config.script;
                        }
                        if (config.description) {
                            gr.description = config.description;
                        }
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created ACL: ' + config.name + ' (' + config.operation + ') (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] Failed to create ACL: ' + config.name + ' (' + config.operation + ')');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating ACL ' + config.name + ' (' + config.operation + '): ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                /**
                 * Adds a role to an ACL if the mapping does not already exist.
                 * @param {string} aclId - sys_id of the ACL
                 * @param {string} roleName - Name of the role to add
                 */
                function addACLRole(aclId, roleName) {
                    try {
                        if (!aclId) {
                            gs.error('[Skills Hub] Cannot add role "' + roleName + '": ACL sys_id is null');
                            return;
                        }
                        // Look up role sys_id
                        var role = new GlideRecord('sys_user_role');
                        role.addQuery('name', roleName);
                        role.query();
                        if (!role.next()) {
                            gs.error('[Skills Hub] Role not found: ' + roleName);
                            errors++;
                            return;
                        }
        
                        var gr = new GlideRecord('sys_security_acl_role');
                        gr.addQuery('sys_security_acl', aclId);
                        gr.addQuery('sys_user_role', role.sys_id);
                        gr.query();
                        if (gr.hasNext()) {
                            gs.info('[Skills Hub] ACL role exists: ' + roleName + ' on ACL ' + aclId);
                            return;
                        }
                        gr.initialize();
                        gr.sys_security_acl = aclId;
                        gr.sys_user_role = role.sys_id;
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Added role "' + roleName + '" to ACL (' + id + ')');
                        } else {
                            gs.error('[Skills Hub] Failed to add role "' + roleName + '" to ACL ' + aclId);
                            errors++;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error adding role "' + roleName + '" to ACL: ' + e.message);
                        errors++;
                    }
                }
        
                // ============================================================
                // 1. u_m2m_skill_endorsement - read (skill_user)
                // ============================================================
                var aclEndorsementRead = createACL({
                    name: 'u_m2m_skill_endorsement',
                    operation: 'read',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Endorsement read: skill_user'
                });
                addACLRole(aclEndorsementRead, 'skill_user');
        
                // ============================================================
                // 2. u_m2m_skill_endorsement - create (skill_user, endorser must be current user)
                // ============================================================
                var aclEndorsementCreate = createACL({
                    name: 'u_m2m_skill_endorsement',
                    operation: 'create',
                    admin_overrides: true,
                    advanced: true,
                    script: 'answer = current.u_endorser == gs.getUserID() || gs.hasRole(\'admin\');',
                    description: 'Endorsement create: skill_user, endorser must be current user'
                });
                addACLRole(aclEndorsementCreate, 'skill_user');
        
                // ============================================================
                // 3. u_m2m_skill_endorsement - write (skill_user)
                // ============================================================
                var aclEndorsementWrite = createACL({
                    name: 'u_m2m_skill_endorsement',
                    operation: 'write',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Endorsement write: skill_user'
                });
                addACLRole(aclEndorsementWrite, 'skill_user');
        
                // ============================================================
                // 4. u_m2m_skill_endorsement - delete (skill_user, endorser must be current user or admin)
                // ============================================================
                var aclEndorsementDelete = createACL({
                    name: 'u_m2m_skill_endorsement',
                    operation: 'delete',
                    admin_overrides: true,
                    advanced: true,
                    script: 'answer = current.u_endorser == gs.getUserID() || gs.hasRole(\'admin\');',
                    description: 'Endorsement delete: endorser must be current user or admin'
                });
                addACLRole(aclEndorsementDelete, 'skill_user');
        
                // ============================================================
                // 5. sys_user_has_skill.u_manager_assessed_level - write (manager only)
                // ============================================================
                createACL({
                    name: 'sys_user_has_skill.u_manager_assessed_level',
                    operation: 'write',
                    type: 'record',
                    admin_overrides: true,
                    advanced: true,
                    script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
                    description: 'Manager assessed level: only manager or admin'
                });
        
                // ============================================================
                // 6. sys_user_has_skill.u_validation_status - write (manager only)
                // ============================================================
                createACL({
                    name: 'sys_user_has_skill.u_validation_status',
                    operation: 'write',
                    type: 'record',
                    admin_overrides: true,
                    advanced: true,
                    script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
                    description: 'Validation status: only manager or admin'
                });
        
                // ============================================================
                // 7. sys_user_has_skill.u_validation_notes - write (manager only)
                // ============================================================
                createACL({
                    name: 'sys_user_has_skill.u_validation_notes',
                    operation: 'write',
                    type: 'record',
                    admin_overrides: true,
                    advanced: true,
                    script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
                    description: 'Validation notes: only manager or admin'
                });
        
                // ============================================================
                // 8. u_skill_request - create (skill_user)
                // ============================================================
                var aclSkillRequestCreate = createACL({
                    name: 'u_skill_request',
                    operation: 'create',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Skill request create: any authenticated skill_user'
                });
                addACLRole(aclSkillRequestCreate, 'skill_user');
        
                // ============================================================
                // 9. u_skill_request - read (skill_user)
                // ============================================================
                var aclSkillRequestRead = createACL({
                    name: 'u_skill_request',
                    operation: 'read',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Skill request read: skill_user'
                });
                addACLRole(aclSkillRequestRead, 'skill_user');
        
                // ============================================================
                // 10. u_skill_request - write (skill_admin)
                // ============================================================
                var aclSkillRequestWrite = createACL({
                    name: 'u_skill_request',
                    operation: 'write',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Skill request write: skill_admin only'
                });
                addACLRole(aclSkillRequestWrite, 'skill_admin');
        
                // ============================================================
                // 11. u_skill_request - delete (admin)
                // ============================================================
                var aclSkillRequestDelete = createACL({
                    name: 'u_skill_request',
                    operation: 'delete',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Skill request delete: admin only'
                });
                addACLRole(aclSkillRequestDelete, 'admin');
        
                // ============================================================
                // 12. u_skill_profile_requirement - read (skill_user)
                // ============================================================
                var aclProfileReqRead = createACL({
                    name: 'u_skill_profile_requirement',
                    operation: 'read',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Profile requirement read: skill_user'
                });
                addACLRole(aclProfileReqRead, 'skill_user');
        
                // ============================================================
                // 13. u_skill_profile_requirement - create (admin)
                // ============================================================
                var aclProfileReqCreate = createACL({
                    name: 'u_skill_profile_requirement',
                    operation: 'create',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Profile requirement create: admin only'
                });
                addACLRole(aclProfileReqCreate, 'admin');
        
                // ============================================================
                // 14. u_skill_profile_requirement - write (admin)
                // ============================================================
                var aclProfileReqWrite = createACL({
                    name: 'u_skill_profile_requirement',
                    operation: 'write',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Profile requirement write: admin only'
                });
                addACLRole(aclProfileReqWrite, 'admin');
        
                // ============================================================
                // 15. u_skill_profile_requirement - delete (admin)
                // ============================================================
                var aclProfileReqDelete = createACL({
                    name: 'u_skill_profile_requirement',
                    operation: 'delete',
                    admin_overrides: true,
                    advanced: false,
                    description: 'Profile requirement delete: admin only'
                });
                addACLRole(aclProfileReqDelete, 'admin');
        
                // ---------------------------------------------------------------
                // Summary
                // ---------------------------------------------------------------
                var total = created + skipped + errors;
                gs.info('[Skills Hub] === ACL Creation Complete ===');
                gs.info('[Skills Hub] Total processed: ' + total);
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
                gs.info('[Skills Hub] Errors: ' + errors);
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in ACL creation script: ' + e.message);
            }

        _sectionResults.push({ section: 6, name: 'ACLS (07)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 6: ACLS (07) - COMPLETE ==========');
    } catch (_sectionErr6) {
        gs.error('[Skills Hub] SECTION 6 FATAL ERROR (ACLS (07)): ' + _sectionErr6.message);
        _sectionResults.push({ section: 6, name: 'ACLS (07)', status: 'ERROR: ' + _sectionErr6.message });
    }


    // ==================================================================
    // SECTION  7: SEED DATA (08)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 7: SEED DATA (08) ==========');
    try {
        try {
                var results = {
                    requirementsCreated: 0,
                    requirementsSkipped: 0,
                    groupsCreated: 0,
                    groupsSkipped: 0,
                    propertiesCreated: 0,
                    propertiesSkipped: 0,
                    skillsCreated: 0,
                    errors: []
                };
        
                gs.info('[Skills Hub] ===== STARTING SEED DATA =====');
        
                // ================================================================
                // Helper: Get or create a cmn_skill record by name
                // ================================================================
                function getOrCreateSkill(skillName) {
                    var gr = new GlideRecord('cmn_skill');
                    gr.addQuery('name', skillName);
                    gr.query();
                    if (gr.next()) {
                        return gr.getUniqueValue();
                    }
                    gr.initialize();
                    gr.name = skillName;
                    var id = gr.insert();
                    if (id) {
                        gs.info('[Skills Hub] Created cmn_skill: ' + skillName + ' (' + id + ')');
                        results.skillsCreated++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create cmn_skill: ' + skillName);
                        results.errors.push('Failed to create skill: ' + skillName);
                    }
                    return id;
                }
        
                // ================================================================
                // Helper: Create a profile requirement if it does not already exist
                // ================================================================
                function seedRequirement(jobTitle, skillName, requiredLevel, priority) {
                    try {
                        var skillId = getOrCreateSkill(skillName);
                        if (!skillId) return;
        
                        var gr = new GlideRecord('u_skill_profile_requirement');
                        gr.addQuery('u_job_title', jobTitle);
                        gr.addQuery('u_skill', skillId);
                        gr.query();
                        if (gr.hasNext()) {
                            gs.info('[Skills Hub] Requirement exists: ' + jobTitle + ' / ' + skillName);
                            results.requirementsSkipped++;
                            return;
                        }
                        gr.initialize();
                        gr.u_job_title = jobTitle;
                        gr.u_skill = skillId;
                        gr.u_required_level = requiredLevel;
                        gr.u_priority = priority;
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created requirement: ' + jobTitle + ' / ' + skillName + ' (' + id + ')');
                            results.requirementsCreated++;
                        } else {
                            var msg = 'FAILED to create requirement: ' + jobTitle + ' / ' + skillName;
                            gs.error('[Skills Hub] ' + msg);
                            results.errors.push(msg);
                        }
                    } catch (e) {
                        var errMsg = 'Error creating requirement "' + jobTitle + ' / ' + skillName + '": ' + e.message;
                        gs.error('[Skills Hub] ' + errMsg);
                        results.errors.push(errMsg);
                    }
                }
        
                // ================================================================
                // SKILL PROFILE REQUIREMENTS (5 sample records)
                // ================================================================
                gs.info('[Skills Hub] --- Seeding Skill Profile Requirements ---');
        
                seedRequirement('Software Engineer', 'JavaScript', 'proficient', 'required');
                seedRequirement('Software Engineer', 'ServiceNow', 'intermediate', 'preferred');
                seedRequirement('Team Lead', 'Leadership', 'advanced', 'required');
                seedRequirement('Business Analyst', 'Requirements Analysis', 'proficient', 'required');
                seedRequirement('DevOps Engineer', 'CI/CD', 'proficient', 'required');
        
                // ================================================================
                // SKILL CATEGORY GROUP (1 sample group)
                // ================================================================
                gs.info('[Skills Hub] --- Seeding Skill Category Group ---');
        
                var groupName = 'Full Stack Development';
                var grp = new GlideRecord('u_skill_category_group');
                grp.addQuery('u_group_name', groupName);
                grp.query();
                if (grp.hasNext()) {
                    gs.info('[Skills Hub] Category group exists: ' + groupName);
                    results.groupsSkipped++;
                } else {
                    grp.initialize();
                    grp.u_group_name = groupName;
                    grp.u_description = 'Cross-category group combining front-end, back-end, and infrastructure skills';
                    var groupId = grp.insert();
                    if (groupId) {
                        gs.info('[Skills Hub] Created category group: ' + groupName + ' (' + groupId + ')');
                        results.groupsCreated++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create category group: ' + groupName);
                        results.errors.push('Failed to create category group: ' + groupName);
                    }
                }
        
                // ================================================================
                // TIER SYSTEM PROPERTIES (2 system properties)
                // ================================================================
                gs.info('[Skills Hub] --- Seeding Tier System Properties ---');
        
                function seedProperty(propName, propValue, propDescription) {
                    try {
                        var pr = new GlideRecord('sys_properties');
                        pr.addQuery('name', propName);
                        pr.query();
                        if (pr.hasNext()) {
                            gs.info('[Skills Hub] Property exists: ' + propName);
                            results.propertiesSkipped++;
                            return;
                        }
                        pr.initialize();
                        pr.name = propName;
                        pr.value = propValue;
                        pr.description = propDescription;
                        pr.type = 'string';
                        var id = pr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created property: ' + propName + ' (' + id + ')');
                            results.propertiesCreated++;
                        } else {
                            var msg = 'FAILED to create property: ' + propName;
                            gs.error('[Skills Hub] ' + msg);
                            results.errors.push(msg);
                        }
                    } catch (e) {
                        var errMsg = 'Error creating property "' + propName + '": ' + e.message;
                        gs.error('[Skills Hub] ' + errMsg);
                        results.errors.push(errMsg);
                    }
                }
        
                // Tier configuration — scoring weights and tier thresholds
                var tierConfig = JSON.stringify({
                    scoring: {
                        per_skill: 10,
                        proficiency: { novice: 2, intermediate: 5, proficient: 10, advanced: 20, expert: 35 },
                        endorsement_received: 5,
                        endorsement_given: 3,
                        manager_validated: 15,
                        skill_added_this_quarter: 8
                    },
                    tiers: [
                        { name: 'Starter', min: 0, max: 49, icon: 'fa-seedling', description: 'Just getting started' },
                        { name: 'Contributor', min: 50, max: 149, icon: 'fa-hand-holding-heart', description: 'Building your portfolio' },
                        { name: 'Specialist', min: 150, max: 299, icon: 'fa-star', description: 'Deep expertise emerging' },
                        { name: 'Trailblazer', min: 300, max: 499, icon: 'fa-fire', description: 'Leading by example' },
                        { name: 'Luminary', min: 500, max: 999999, icon: 'fa-sun', description: 'Organizational skill champion' }
                    ]
                });
        
                seedProperty(
                    'skills_hub.tier_config',
                    tierConfig,
                    'Skills Hub tier system configuration (JSON). Defines scoring weights and tier thresholds.'
                );
        
                seedProperty(
                    'skills_hub.scoring_enabled',
                    'true',
                    'Skills Hub tier scoring enabled flag. Set to false to disable tier calculations.'
                );
        
                // ================================================================
                // Summary
                // ================================================================
                gs.info('[Skills Hub] ===== SEED DATA SUMMARY =====');
                gs.info('[Skills Hub] Skills created (cmn_skill): ' + results.skillsCreated);
                gs.info('[Skills Hub] Requirements created: ' + results.requirementsCreated);
                gs.info('[Skills Hub] Requirements skipped (already existed): ' + results.requirementsSkipped);
                gs.info('[Skills Hub] Category groups created: ' + results.groupsCreated);
                gs.info('[Skills Hub] Category groups skipped (already existed): ' + results.groupsSkipped);
                gs.info('[Skills Hub] Properties created: ' + results.propertiesCreated);
                gs.info('[Skills Hub] Properties skipped (already existed): ' + results.propertiesSkipped);
                gs.info('[Skills Hub] Errors: ' + results.errors.length);
                if (results.errors.length > 0) {
                    for (var i = 0; i < results.errors.length; i++) {
                        gs.error('[Skills Hub] Error: ' + results.errors[i]);
                    }
                }
                gs.info('[Skills Hub] ================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 08_seed_data: ' + e.message);
            }

        _sectionResults.push({ section: 7, name: 'SEED DATA (08)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 7: SEED DATA (08) - COMPLETE ==========');
    } catch (_sectionErr7) {
        gs.error('[Skills Hub] SECTION 7 FATAL ERROR (SEED DATA (08)): ' + _sectionErr7.message);
        _sectionResults.push({ section: 7, name: 'SEED DATA (08)', status: 'ERROR: ' + _sectionErr7.message });
    }


    // ==================================================================
    // SECTION  8: CATALOG ITEM (11)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 8: CATALOG ITEM (11) ==========');
    try {
        try {
                var created = 0;
                var existed = 0;
                var errors = 0;
        
                // ============================================================
                // 1. Find the Service Catalog
                // ============================================================
                var catalogId = '';
                var catalog = new GlideRecord('sc_catalog');
                catalog.addQuery('title', 'Service Catalog');
                catalog.query();
        
                if (catalog.next()) {
                    catalogId = catalog.getUniqueValue();
                    gs.info('[Skills Hub] Found Service Catalog (sys_id: ' + catalogId + ')');
                } else {
                    gs.error('[Skills Hub] Service Catalog not found. Cannot create catalog item.');
                    return;
                }
        
                // ============================================================
                // 2. Find or create "Skills Hub" category
                // ============================================================
                var categoryId = '';
                var existingCat = new GlideRecord('sc_category');
                existingCat.addQuery('title', 'Skills Hub');
                existingCat.query();
        
                if (existingCat.next()) {
                    categoryId = existingCat.getUniqueValue();
                    gs.info('[Skills Hub] Category already exists: Skills Hub (sys_id: ' + categoryId + ')');
                    existed++;
                } else {
                    var newCat = new GlideRecord('sc_category');
                    newCat.initialize();
                    newCat.setValue('title', 'Skills Hub');
                    newCat.setValue('description', 'Skills Hub catalog items for skill requests, endorsements, and management');
                    newCat.setValue('sc_catalog', catalogId);
                    newCat.setValue('active', true);
                    categoryId = newCat.insert();
        
                    if (categoryId) {
                        gs.info('[Skills Hub] Created category: Skills Hub (sys_id: ' + categoryId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create category: Skills Hub');
                        errors++;
                        return;
                    }
                }
        
                // ============================================================
                // 3. Find or create "Request New Skill" catalog item
                // ============================================================
                var catItemId = '';
                var existingItem = new GlideRecord('sc_cat_item');
                existingItem.addQuery('name', 'Request New Skill');
                existingItem.query();
        
                if (existingItem.next()) {
                    catItemId = existingItem.getUniqueValue();
                    gs.info('[Skills Hub] Catalog item already exists: Request New Skill (sys_id: ' + catItemId + ')');
                    existed++;
                } else {
                    var newItem = new GlideRecord('sc_cat_item');
                    newItem.initialize();
                    newItem.setValue('name', 'Request New Skill');
                    newItem.setValue('short_description', 'Request a new skill to be added to the Skills Hub');
                    newItem.setValue('description', 'Use this form to request that a new skill be added to the Skills Hub catalog. Your request will be reviewed by a Skills Administrator.');
                    newItem.setValue('category', categoryId);
                    newItem.setValue('active', true);
                    catItemId = newItem.insert();
        
                    if (catItemId) {
                        gs.info('[Skills Hub] Created catalog item: Request New Skill (sys_id: ' + catItemId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create catalog item: Request New Skill');
                        errors++;
                        return;
                    }
                }
        
                // ============================================================
                // 4. Create catalog variables
                // ============================================================
                var variables = [
                    {
                        name: 'u_skill_name',
                        question_text: 'Skill Name',
                        type: 16,           // Single Line Text
                        mandatory: true,
                        order: 100,
                        reference: ''
                    },
                    {
                        name: 'u_skill_category',
                        question_text: 'Category',
                        type: 8,            // Reference
                        mandatory: true,
                        order: 200,
                        reference: 'cmn_skill_category'
                    },
                    {
                        name: 'u_justification',
                        question_text: 'Justification',
                        type: 6,            // Multi-line Text
                        mandatory: true,
                        order: 300,
                        reference: ''
                    }
                ];
        
                for (var i = 0; i < variables.length; i++) {
                    var v = variables[i];
        
                    // Check if variable already exists for this catalog item
                    var existingVar = new GlideRecord('item_option_new');
                    existingVar.addQuery('cat_item', catItemId);
                    existingVar.addQuery('name', v.name);
                    existingVar.query();
        
                    if (existingVar.next()) {
                        gs.info('[Skills Hub] Variable already exists: ' + v.name + ' (sys_id: ' + existingVar.getUniqueValue() + ')');
                        existed++;
                    } else {
                        var newVar = new GlideRecord('item_option_new');
                        newVar.initialize();
                        newVar.setValue('cat_item', catItemId);
                        newVar.setValue('name', v.name);
                        newVar.setValue('question_text', v.question_text);
                        newVar.setValue('type', v.type);
                        newVar.setValue('mandatory', v.mandatory);
                        newVar.setValue('order', v.order);
        
                        if (v.reference) {
                            newVar.setValue('reference', v.reference);
                        }
        
                        var varId = newVar.insert();
        
                        if (varId) {
                            gs.info('[Skills Hub] Created variable: ' + v.name + ' (type: ' + v.type + ', sys_id: ' + varId + ')');
                            created++;
                        } else {
                            gs.error('[Skills Hub] FAILED to create variable: ' + v.name);
                            errors++;
                        }
                    }
                }
        
                // ============================================================
                // Summary
                // ============================================================
                gs.info('[Skills Hub] ===== CATALOG ITEM SUMMARY =====');
                gs.info('[Skills Hub] Category sys_id: ' + categoryId);
                gs.info('[Skills Hub] Catalog Item sys_id: ' + catItemId);
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Already existed: ' + existed);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] =================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 11_create_catalog_item: ' + e.message);
            }

        _sectionResults.push({ section: 8, name: 'CATALOG ITEM (11)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 8: CATALOG ITEM (11) - COMPLETE ==========');
    } catch (_sectionErr8) {
        gs.error('[Skills Hub] SECTION 8 FATAL ERROR (CATALOG ITEM (11)): ' + _sectionErr8.message);
        _sectionResults.push({ section: 8, name: 'CATALOG ITEM (11)', status: 'ERROR: ' + _sectionErr8.message });
    }


    // ==================================================================
    // SECTION  9: WORKFLOW BUSINESS RULES (12)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 9: WORKFLOW BUSINESS RULES (12) ==========');
    try {
        try {
                var created = 0;
                var existed = 0;
                var errors = 0;
        
                // ================================================================
                // Helper: Create or skip a business rule (by name + collection)
                // ================================================================
                function createBusinessRule(config) {
                    var gr = new GlideRecord('sys_script');
                    gr.addQuery('name', config.name);
                    gr.addQuery('collection', config.collection);
                    gr.query();
        
                    if (gr.next()) {
                        gs.info('[Skills Hub] Business rule already exists: "' + config.name + '" on ' + config.collection + ' (sys_id: ' + gr.getUniqueValue() + ')');
                        existed++;
                        return gr.getUniqueValue();
                    }
        
                    gr.initialize();
                    gr.setValue('name', config.name);
                    gr.setValue('collection', config.collection);
                    gr.setValue('when', config.when || 'after');
                    gr.setValue('action_insert', config.action_insert || false);
                    gr.setValue('action_update', config.action_update || false);
                    gr.setValue('action_delete', config.action_delete || false);
                    gr.setValue('action_query', config.action_query || false);
                    gr.setValue('order', config.order || 100);
                    gr.setValue('active', true);
                    gr.setValue('script', config.script);
        
                    if (config.filter_condition) {
                        gr.setValue('filter_condition', config.filter_condition);
                    }
        
                    var id = gr.insert();
                    if (id) {
                        gs.info('[Skills Hub] Created business rule: "' + config.name + '" on ' + config.collection + ' (sys_id: ' + id + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create business rule: "' + config.name + '" on ' + config.collection);
                        errors++;
                    }
                    return id;
                }
        
                // ============================================================
                // 1. Skills Hub - Create Skill Request on RITM
                //    Table: sc_req_item | When: After Insert
                //    Creates a u_skill_request record when a "Request New Skill"
                //    catalog item is ordered.
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Create Skill Request on RITM',
                    collection: 'sc_req_item',
                    when: 'after',
                    action_insert: true,
                    action_update: false,
                    action_delete: false,
                    action_query: false,
                    order: 100,
                    script: '(function executeRule(current, previous) {\n' +
                        '    // Only process "Request New Skill" catalog items\n' +
                        '    if (current.cat_item.name != \'Request New Skill\') return;\n' +
                        '\n' +
                        '    try {\n' +
                        '        var req = new GlideRecord(\'u_skill_request\');\n' +
                        '        req.initialize();\n' +
                        '        req.u_requested_by = current.request.requested_for;\n' +
                        '        req.u_skill_name = current.variables.u_skill_name;\n' +
                        '        req.u_category = current.variables.u_skill_category;\n' +
                        '        req.u_justification = current.variables.u_justification;\n' +
                        '        req.u_status = \'pending\';\n' +
                        '        var reqId = req.insert();\n' +
                        '\n' +
                        '        if (reqId) {\n' +
                        '            gs.info(\'[Skills Hub] Created skill request: \' + reqId + \' for RITM: \' + current.number);\n' +
                        '        } else {\n' +
                        '            gs.error(\'[Skills Hub] Failed to create skill request for RITM: \' + current.number);\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-CreateSkillRequest: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // 2. Skills Hub - Process Skill Request Approval
                //    Table: u_skill_request | When: Before Update
                //    When u_status changes to approved:
                //      - Create cmn_skill record if it does not already exist
                //      - Stamp u_approved_by and u_approval_date
                //    When u_status changes to rejected:
                //      - Stamp u_approved_by and u_approval_date
                // ============================================================
                createBusinessRule({
                    name: 'Skills Hub - Process Skill Request Approval',
                    collection: 'u_skill_request',
                    when: 'before',
                    action_insert: false,
                    action_update: true,
                    action_delete: false,
                    action_query: false,
                    order: 100,
                    filter_condition: 'u_statusCHANGES',
                    script: '(function executeRule(current, previous) {\n' +
                        '    if (!current.u_status.changes()) return;\n' +
                        '\n' +
                        '    try {\n' +
                        '        if (current.u_status == \'approved\') {\n' +
                        '            // Create the cmn_skill if it does not already exist\n' +
                        '            var existing = new GlideRecord(\'cmn_skill\');\n' +
                        '            existing.addQuery(\'name\', current.u_skill_name.toString());\n' +
                        '            existing.query();\n' +
                        '\n' +
                        '            if (!existing.hasNext()) {\n' +
                        '                var skill = new GlideRecord(\'cmn_skill\');\n' +
                        '                skill.initialize();\n' +
                        '                skill.name = current.u_skill_name;\n' +
                        '                skill.category = current.u_category;\n' +
                        '                var skillId = skill.insert();\n' +
                        '                if (skillId) {\n' +
                        '                    gs.info(\'[Skills Hub] Created new skill: \' + current.u_skill_name + \' (sys_id: \' + skillId + \')\');\n' +
                        '                } else {\n' +
                        '                    gs.error(\'[Skills Hub] Failed to create skill: \' + current.u_skill_name);\n' +
                        '                }\n' +
                        '            } else {\n' +
                        '                gs.info(\'[Skills Hub] Skill already exists, skipping creation: \' + current.u_skill_name);\n' +
                        '            }\n' +
                        '\n' +
                        '            // Stamp approval metadata\n' +
                        '            current.u_approved_by = gs.getUserID();\n' +
                        '            current.u_approval_date = new GlideDateTime();\n' +
                        '            gs.info(\'[Skills Hub] Skill request approved: \' + current.u_skill_name + \' by \' + gs.getUserDisplayName());\n' +
                        '\n' +
                        '        } else if (current.u_status == \'rejected\') {\n' +
                        '            // Stamp rejection metadata\n' +
                        '            current.u_approved_by = gs.getUserID();\n' +
                        '            current.u_approval_date = new GlideDateTime();\n' +
                        '            gs.info(\'[Skills Hub] Skill request rejected: \' + current.u_skill_name + \' by \' + gs.getUserDisplayName());\n' +
                        '        }\n' +
                        '    } catch (e) {\n' +
                        '        gs.error(\'[Skills Hub] BR-ProcessSkillApproval: \' + e.message);\n' +
                        '    }\n' +
                        '})(current, previous);'
                });
        
                // ============================================================
                // Summary
                // ============================================================
                gs.info('[Skills Hub] ===== WORKFLOW BUSINESS RULES SUMMARY =====');
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Already existed: ' + existed);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] ===============================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 12_create_workflow: ' + e.message);
            }

        _sectionResults.push({ section: 9, name: 'WORKFLOW BUSINESS RULES (12)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 9: WORKFLOW BUSINESS RULES (12) - COMPLETE ==========');
    } catch (_sectionErr9) {
        gs.error('[Skills Hub] SECTION 9 FATAL ERROR (WORKFLOW BUSINESS RULES (12)): ' + _sectionErr9.message);
        _sectionResults.push({ section: 9, name: 'WORKFLOW BUSINESS RULES (12)', status: 'ERROR: ' + _sectionErr9.message });
    }


    // ==================================================================
    // SECTION 10: NOTIFICATIONS (13)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 10: NOTIFICATIONS (13) ==========');
    try {
        try {
                var created = 0;
                var existed = 0;
                var errors = 0;
        
                // ================================================================
                // Helper: Create or skip an email notification (by name)
                // ================================================================
                function createNotification(config) {
                    var gr = new GlideRecord('sysevent_email_action');
                    gr.addQuery('name', config.name);
                    gr.query();
        
                    if (gr.next()) {
                        gs.info('[Skills Hub] Notification already exists: "' + config.name + '" (sys_id: ' + gr.getUniqueValue() + ')');
                        existed++;
                        return gr.getUniqueValue();
                    }
        
                    gr.initialize();
                    gr.setValue('name', config.name);
                    gr.setValue('collection', config.collection);
                    gr.setValue('action_insert', config.action_insert || false);
                    gr.setValue('action_update', config.action_update || false);
                    gr.setValue('action_delete', false);
                    gr.setValue('active', true);
        
                    if (config.condition) {
                        gr.setValue('condition', config.condition);
                    }
                    if (config.recipient_fields) {
                        gr.setValue('recipient_fields', config.recipient_fields);
                    }
        
                    gr.setValue('subject', config.subject);
                    gr.setValue('message_html', config.message_html);
        
                    // Content type for HTML email
                    gr.setValue('content_type', 'text/html');
        
                    var id = gr.insert();
                    if (id) {
                        gs.info('[Skills Hub] Created notification: "' + config.name + '" (sys_id: ' + id + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create notification: "' + config.name + '"');
                        errors++;
                    }
                    return id;
                }
        
                // ============================================================
                // 1. Skills Hub - Skill Request Submitted
                //    Fires on insert of u_skill_request when status = pending
                //    Sends to the requester confirming submission
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Request Submitted',
                    collection: 'u_skill_request',
                    action_insert: true,
                    action_update: false,
                    condition: 'u_status=pending',
                    recipient_fields: 'u_requested_by',
                    subject: 'Skills Hub: Your Skill Request Has Been Submitted',
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #333333; margin-top: 0;">Skill Request Submitted</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Your request to add a new skill has been submitted and is awaiting review by a Skills Administrator.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Justification</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_justification}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">Pending Review</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'You will be notified when your request has been reviewed.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // 2. Skills Hub - Skill Request Approved
                //    Fires on update of u_skill_request when status changes to approved
                //    Sends to the requester confirming approval
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Request Approved',
                    collection: 'u_skill_request',
                    action_insert: false,
                    action_update: true,
                    condition: 'u_statusCHANGESTOapproved',
                    recipient_fields: 'u_requested_by',
                    subject: 'Skills Hub: Your Skill Request Has Been Approved',
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #2e7d32; margin-top: 0;">Skill Request Approved</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Congratulations! Your request to add a new skill has been approved. The skill is now available in the Skills Hub catalog.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Approved By</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approved_by.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Approval Date</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approval_date}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #2e7d32; font-weight: bold;">Approved</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'You can now add this skill to your profile through the Skills Hub.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // 3. Skills Hub - Skill Request Rejected
                //    Fires on update of u_skill_request when status changes to rejected
                //    Sends to the requester informing of rejection
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Request Rejected',
                    collection: 'u_skill_request',
                    action_insert: false,
                    action_update: true,
                    condition: 'u_statusCHANGESTOrejected',
                    recipient_fields: 'u_requested_by',
                    subject: 'Skills Hub: Your Skill Request Was Not Approved',
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #c62828; margin-top: 0;">Skill Request Not Approved</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Unfortunately, your request to add a new skill was not approved at this time.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Reason</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_rejection_reason}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Reviewed By</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approved_by.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Review Date</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approval_date}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #c62828; font-weight: bold;">Not Approved</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'If you believe this skill should be reconsidered, please contact your Skills Administrator or submit a new request with additional justification.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // 4. Skills Hub - Skill Validated by Manager
                //    Fires on update of sys_user_has_skill when validation_status
                //    changes to "validated"
                //    Sends to the skill owner (user field)
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Validated by Manager',
                    collection: 'sys_user_has_skill',
                    action_insert: false,
                    action_update: true,
                    condition: 'u_validation_statusCHANGESTOvalidated',
                    recipient_fields: 'user',
                    subject: 'Skills Hub: Your Skill Has Been Validated',
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #2e7d32; margin-top: 0;">Skill Validated</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Great news! Your manager has validated one of your skills in the Skills Hub.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Proficiency Level</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill_level}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Validation Date</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_last_manager_validation}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #2e7d32; font-weight: bold;">Validated</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Manager-validated skills carry additional weight in the Skills Hub and contribute toward your tier ranking.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // 5. Skills Hub - Skill Disputed by Manager
                //    Fires on update of sys_user_has_skill when validation_status
                //    changes to "disputed"
                //    Sends to the skill owner (user field) with manager's notes
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Disputed by Manager',
                    collection: 'sys_user_has_skill',
                    action_insert: false,
                    action_update: true,
                    condition: 'u_validation_statusCHANGESTOdisputed',
                    recipient_fields: 'user',
                    subject: 'Skills Hub: Your Skill Assessment Has Been Disputed',
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #e68a00; margin-top: 0;">Skill Assessment Disputed</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Your manager has reviewed one of your skills and has a different assessment of your proficiency level. ' +
                        'Please review the details below and discuss with your manager if needed.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 180px; border: 1px solid #e0e0e0;">Skill</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Your Self-Assessment</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill_level}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Manager Assessment</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_manager_assessed_level}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Manager Notes</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_validation_notes}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">Disputed</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Consider discussing this with your manager to align on your skill development goals. ' +
                        'You can view your full skill profile in the <a href="/sp?id=skills_hub" style="color: #0072CE;">Skills Hub</a>.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // 6. Skills Hub - Skill Endorsed
                //    Fires on insert of u_m2m_skill_endorsement
                //    Sends to the skill owner (via u_skill_record.user reference)
                //    Note: recipient_fields traverses the reference chain
                //    u_skill_record -> sys_user_has_skill.user -> sys_user
                // ============================================================
                createNotification({
                    name: 'Skills Hub - Skill Endorsed',
                    collection: 'u_m2m_skill_endorsement',
                    action_insert: true,
                    action_update: false,
                    recipient_fields: 'u_skill_record.user',
                    subject: "Skills Hub: You've Been Endorsed!",
                    message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #1565c0; margin-top: 0;">You Have a New Endorsement!</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'A colleague has endorsed one of your skills in the Skills Hub.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_record.skill.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Endorsed By</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_endorser.name}</td></tr>' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Date</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${sys_created_on}</td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Peer endorsements strengthen your skill profile and contribute toward your tier ranking in the Skills Hub.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                });
        
                // ============================================================
                // Summary
                // ============================================================
                gs.info('[Skills Hub] ===== NOTIFICATIONS SUMMARY =====');
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Already existed: ' + existed);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] =======================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 13_create_notifications: ' + e.message);
            }

        _sectionResults.push({ section: 10, name: 'NOTIFICATIONS (13)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 10: NOTIFICATIONS (13) - COMPLETE ==========');
    } catch (_sectionErr10) {
        gs.error('[Skills Hub] SECTION 10 FATAL ERROR (NOTIFICATIONS (13)): ' + _sectionErr10.message);
        _sectionResults.push({ section: 10, name: 'NOTIFICATIONS (13)', status: 'ERROR: ' + _sectionErr10.message });
    }


    // ==================================================================
    // SECTION 11: SKILLSHUBUTILS METHOD INJECTION (14)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 11: SKILLSHUBUTILS METHOD INJECTION (14) ==========');
    try {
        try {
                gs.info('[Skills Hub] Starting 14_update_skills_hub_utils...');
        
                // ============================================================
                // 1. Find the existing SkillsHubUtils Script Include
                // ============================================================
                var si = new GlideRecord('sys_script_include');
                si.addQuery('name', 'SkillsHubUtils');
                si.query();
        
                if (!si.next()) {
                    gs.error('[Skills Hub] SkillsHubUtils Script Include not found. Cannot add Phase 2 methods.');
                    return;
                }
        
                var siSysId = si.getUniqueValue();
                gs.info('[Skills Hub] Found SkillsHubUtils (sys_id: ' + siSysId + ')');
        
                var currentScript = si.script.toString();
        
                // ============================================================
                // 2. Check if Phase 2 methods already exist (idempotency)
                // ============================================================
                if (currentScript.indexOf('validateSkill') > -1) {
                    gs.info('[Skills Hub] SkillsHubUtils already contains Phase 2 methods (validateSkill found). Skipping.');
                    return;
                }
        
                // ============================================================
                // 3. Build the new methods string
                // ============================================================
                // Using string concatenation to avoid template literal issues in ServiceNow.
                // Single quotes inside the injected code are NOT escaped here because
                // this entire block is a JavaScript string value assigned to a GlideRecord
                // field -- it is NOT parsed as nested JS.  We build the string with
                // double-quote delimiters and embed single quotes directly.
        
                var NL = '\n';
                var T4 = '    '; // 4-space indent (matches existing style)
        
                var newMethods = '';
                newMethods += NL;
                newMethods += T4 + '/* ===== Phase 2: Process & Workflow Methods ===== */' + NL;
                newMethods += NL;
        
                // ----- validateSkill -----
                newMethods += T4 + '/**' + NL;
                newMethods += T4 + ' * Validate a direct report\'s skill (manager action).' + NL;
                newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name' + NL;
                newMethods += T4 + ' * Returns JSON: { success: bool, message/error: string }' + NL;
                newMethods += T4 + ' */' + NL;
                newMethods += T4 + 'validateSkill: function() {' + NL;
                newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
                newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
                newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + '// Verify caller is the user\'s manager' + NL;
                newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
                newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized - you are not this user\\\'s manager\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
                newMethods += T4 + T4 + 'gr.query();' + NL;
                newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'validated\';' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_last_manager_validation = new GlideDateTime();' + NL;
                newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
                newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Skill validated: \' + skillName + \' for user \' + userId);' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true, message: \'Skill validated\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
                newMethods += T4 + '},' + NL;
                newMethods += NL;
        
                // ----- disputeSkill -----
                newMethods += T4 + '/**' + NL;
                newMethods += T4 + ' * Dispute a direct report\'s skill (manager action).' + NL;
                newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name, sysparm_notes (optional), sysparm_assessed_level (optional)' + NL;
                newMethods += T4 + ' * Returns JSON: { success: bool, message/error: string }' + NL;
                newMethods += T4 + ' */' + NL;
                newMethods += T4 + 'disputeSkill: function() {' + NL;
                newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
                newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
                newMethods += T4 + T4 + 'var notes = this.getParameter(\'sysparm_notes\') || \'\';' + NL;
                newMethods += T4 + T4 + 'var assessedLevel = this.getParameter(\'sysparm_assessed_level\') || \'\';' + NL;
                newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
                newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
                newMethods += T4 + T4 + 'gr.query();' + NL;
                newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'disputed\';' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_validation_notes = notes;' + NL;
                newMethods += T4 + T4 + T4 + 'if (assessedLevel) {' + NL;
                newMethods += T4 + T4 + T4 + T4 + 'gr.u_manager_assessed_level = assessedLevel;' + NL;
                newMethods += T4 + T4 + T4 + '}' + NL;
                newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
                newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Skill disputed: \' + skillName + \' for user \' + userId);' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true, message: \'Skill disputed\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
                newMethods += T4 + '},' + NL;
                newMethods += NL;
        
                // ----- bulkValidate -----
                newMethods += T4 + '/**' + NL;
                newMethods += T4 + ' * Bulk-validate all pending skills for a direct report (manager action).' + NL;
                newMethods += T4 + ' * Params: sysparm_user_id' + NL;
                newMethods += T4 + ' * Returns JSON: { success: bool, count: number }' + NL;
                newMethods += T4 + ' */' + NL;
                newMethods += T4 + 'bulkValidate: function() {' + NL;
                newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
                newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
                newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var count = 0;' + NL;
                newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'u_validation_status\', \'!=\', \'validated\');' + NL;
                newMethods += T4 + T4 + 'gr.query();' + NL;
                newMethods += T4 + T4 + 'while (gr.next()) {' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'validated\';' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_last_manager_validation = new GlideDateTime();' + NL;
                newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
                newMethods += T4 + T4 + T4 + 'count++;' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += T4 + T4 + 'gs.info(\'[Skills Hub] Bulk validated \' + count + \' skills for user \' + userId);' + NL;
                newMethods += T4 + T4 + 'return JSON.stringify({ success: true, count: count });' + NL;
                newMethods += T4 + '},' + NL;
                newMethods += NL;
        
                // ----- setManagerAssessment -----
                newMethods += T4 + '/**' + NL;
                newMethods += T4 + ' * Set manager-assessed proficiency level for a skill (manager action).' + NL;
                newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name, sysparm_level' + NL;
                newMethods += T4 + ' * Returns JSON: { success: bool }' + NL;
                newMethods += T4 + ' */' + NL;
                newMethods += T4 + 'setManagerAssessment: function() {' + NL;
                newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
                newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
                newMethods += T4 + T4 + 'var level = this.getParameter(\'sysparm_level\');' + NL;
                newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
                newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
                newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
                newMethods += T4 + T4 + 'gr.query();' + NL;
                newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
                newMethods += T4 + T4 + T4 + 'gr.u_manager_assessed_level = level;' + NL;
                newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
                newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Manager assessment set: \' + skillName + \' = \' + level + \' for user \' + userId);' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill not found\' });' + NL;
                newMethods += T4 + '},' + NL;
                newMethods += NL;
        
                // ----- endorseSkill -----
                newMethods += T4 + '/**' + NL;
                newMethods += T4 + ' * Endorse a peer\'s skill (any authenticated user).' + NL;
                newMethods += T4 + ' * Params: sysparm_skill_record_id (sys_id of sys_user_has_skill)' + NL;
                newMethods += T4 + ' * Returns JSON: { success: bool, endorsement_id/error: string }' + NL;
                newMethods += T4 + ' */' + NL;
                newMethods += T4 + 'endorseSkill: function() {' + NL;
                newMethods += T4 + T4 + 'var skillRecordId = this.getParameter(\'sysparm_skill_record_id\');' + NL;
                newMethods += T4 + T4 + 'var endorserId = gs.getUserID();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + '// Get the skill record to check owner' + NL;
                newMethods += T4 + T4 + 'var skillRec = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethods += T4 + T4 + 'if (!skillRec.get(skillRecordId)) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + '// Prevent self-endorsement' + NL;
                newMethods += T4 + T4 + 'if (skillRec.user.toString() == endorserId) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Cannot endorse your own skill\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + '// Check for duplicate endorsement' + NL;
                newMethods += T4 + T4 + 'var dup = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
                newMethods += T4 + T4 + 'dup.addQuery(\'u_skill_record\', skillRecordId);' + NL;
                newMethods += T4 + T4 + 'dup.addQuery(\'u_endorser\', endorserId);' + NL;
                newMethods += T4 + T4 + 'dup.query();' + NL;
                newMethods += T4 + T4 + 'if (dup.hasNext()) {' + NL;
                newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'You have already endorsed this skill\' });' + NL;
                newMethods += T4 + T4 + '}' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + '// Create endorsement record' + NL;
                newMethods += T4 + T4 + 'var endorse = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
                newMethods += T4 + T4 + 'endorse.initialize();' + NL;
                newMethods += T4 + T4 + 'endorse.u_skill_record = skillRecordId;' + NL;
                newMethods += T4 + T4 + 'endorse.u_endorser = endorserId;' + NL;
                newMethods += T4 + T4 + 'var id = endorse.insert();' + NL;
                newMethods += NL;
                newMethods += T4 + T4 + 'gs.info(\'[Skills Hub] Endorsement created: \' + id + \' by \' + endorserId);' + NL;
                newMethods += T4 + T4 + 'return JSON.stringify({ success: true, endorsement_id: id });' + NL;
                newMethods += T4 + '},' + NL;
                newMethods += NL;
        
                // ============================================================
                // 4. Inject the new methods into the existing script
                // ============================================================
                var insertionMarker = "type: 'SkillsHubUtils'";
                var insertionPoint = currentScript.indexOf(insertionMarker);
        
                if (insertionPoint < 0) {
                    // Try double-quote variant
                    insertionMarker = 'type: "SkillsHubUtils"';
                    insertionPoint = currentScript.indexOf(insertionMarker);
                }
        
                if (insertionPoint < 0) {
                    gs.error('[Skills Hub] Could not find insertion point (type: \'SkillsHubUtils\') in script. Aborting.');
                    return;
                }
        
                var updatedScript = currentScript.substring(0, insertionPoint) + newMethods + T4 + currentScript.substring(insertionPoint);
        
                si.script = updatedScript;
                si.update();
        
                gs.info('[Skills Hub] ===== SCRIPT INCLUDE UPDATE SUMMARY =====');
                gs.info('[Skills Hub] SkillsHubUtils sys_id: ' + siSysId);
                gs.info('[Skills Hub] Methods added: validateSkill, disputeSkill, bulkValidate, setManagerAssessment, endorseSkill');
                gs.info('[Skills Hub] Original script length: ' + currentScript.length);
                gs.info('[Skills Hub] Updated script length: ' + updatedScript.length);
                gs.info('[Skills Hub] ==========================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 14_update_skills_hub_utils: ' + e.message);
            }

        _sectionResults.push({ section: 11, name: 'SKILLSHUBUTILS METHOD INJECTION (14)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 11: SKILLSHUBUTILS METHOD INJECTION (14) - COMPLETE ==========');
    } catch (_sectionErr11) {
        gs.error('[Skills Hub] SECTION 11 FATAL ERROR (SKILLSHUBUTILS METHOD INJECTION (14)): ' + _sectionErr11.message);
        _sectionResults.push({ section: 11, name: 'SKILLSHUBUTILS METHOD INJECTION (14)', status: 'ERROR: ' + _sectionErr11.message });
    }


    // ==================================================================
    // SECTION 12: SCHEDULED JOBS (16)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 12: SCHEDULED JOBS (16) ==========');
    try {
        try {
                var created = 0;
                var existed = 0;
                var errors = 0;
        
                // ================================================================
                // Helper: Create or skip a scheduled job (by name)
                // ================================================================
                function createScheduledJob(config) {
                    var gr = new GlideRecord('sysauto_script');
                    gr.addQuery('name', config.name);
                    gr.query();
        
                    if (gr.next()) {
                        gs.info('[Skills Hub] Scheduled job already exists: "' + config.name + '" (sys_id: ' + gr.getUniqueValue() + ')');
                        existed++;
                        return gr.getUniqueValue();
                    }
        
                    gr.initialize();
                    gr.setValue('name', config.name);
                    gr.setValue('active', true);
                    gr.setValue('run_type', config.run_type);
                    gr.setValue('script', config.script);
        
                    if (config.run_dayofmonth) {
                        gr.setValue('run_dayofmonth', config.run_dayofmonth);
                    }
                    if (config.run_dayofweek) {
                        gr.setValue('run_dayofweek', config.run_dayofweek);
                    }
                    if (config.run_time) {
                        gr.setValue('run_time', config.run_time);
                    }
        
                    var id = gr.insert();
                    if (id) {
                        gs.info('[Skills Hub] Created scheduled job: "' + config.name + '" (sys_id: ' + id + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create scheduled job: "' + config.name + '"');
                        errors++;
                    }
                    return id;
                }
        
                // ============================================================
                // 1. Skills Hub - Monthly Validation Reminder
                //    Runs monthly on the 1st at 08:00
                //    Finds managers with direct reports who have unvalidated
                //    skills and queues a reminder event for each.
                // ============================================================
                createScheduledJob({
                    name: 'Skills Hub - Monthly Validation Reminder',
                    run_type: 'monthly',
                    run_dayofmonth: 1,
                    run_time: '08:00:00',
                    script:
                        '// Find all managers with direct reports who have unvalidated skills\n' +
                        'var managers = {};\n' +
                        '\n' +
                        'var gr = new GlideRecord(\'sys_user_has_skill\');\n' +
                        'gr.addQuery(\'u_validation_status\', \'!=\', \'validated\');\n' +
                        'gr.addQuery(\'user.active\', true);\n' +
                        'gr.addQuery(\'user.manager\', \'!=\', \'\');\n' +
                        'gr.query();\n' +
                        '\n' +
                        'while (gr.next()) {\n' +
                        '    var managerId = gr.user.manager.toString();\n' +
                        '    var managerName = gr.user.manager.getDisplayValue();\n' +
                        '    var managerEmail = gr.user.manager.email.toString();\n' +
                        '\n' +
                        '    if (!managers[managerId]) {\n' +
                        '        managers[managerId] = {\n' +
                        '            name: managerName,\n' +
                        '            email: managerEmail,\n' +
                        '            pendingCount: 0,\n' +
                        '            employees: {}\n' +
                        '        };\n' +
                        '    }\n' +
                        '\n' +
                        '    var empName = gr.user.getDisplayValue();\n' +
                        '    if (!managers[managerId].employees[empName]) {\n' +
                        '        managers[managerId].employees[empName] = 0;\n' +
                        '    }\n' +
                        '    managers[managerId].employees[empName]++;\n' +
                        '    managers[managerId].pendingCount++;\n' +
                        '}\n' +
                        '\n' +
                        '// Send reminder to each manager\n' +
                        'for (var mid in managers) {\n' +
                        '    var mgr = managers[mid];\n' +
                        '    if (mgr.pendingCount > 0) {\n' +
                        '        gs.eventQueue(\'skills_hub.validation_reminder\', null, mid, mgr.pendingCount.toString());\n' +
                        '        gs.info(\'[Skills Hub] Validation reminder queued for manager: \' + mgr.name + \' (\' + mgr.pendingCount + \' pending)\');\n' +
                        '    }\n' +
                        '}\n'
                });
        
                // ============================================================
                // 2. Register system event: skills_hub.validation_reminder
                //    Used by the Monthly Validation Reminder job to trigger
                //    notification emails to managers.
                // ============================================================
                var evt = new GlideRecord('sysevent_register');
                evt.addQuery('event_name', 'skills_hub.validation_reminder');
                evt.query();
        
                if (evt.next()) {
                    gs.info('[Skills Hub] Event registration already exists: skills_hub.validation_reminder (sys_id: ' + evt.getUniqueValue() + ')');
                    existed++;
                } else {
                    evt.initialize();
                    evt.setValue('event_name', 'skills_hub.validation_reminder');
                    evt.setValue('description', 'Skills Hub - Monthly validation reminder event for managers');
                    var evtId = evt.insert();
        
                    if (evtId) {
                        gs.info('[Skills Hub] Created event registration: skills_hub.validation_reminder (sys_id: ' + evtId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create event registration: skills_hub.validation_reminder');
                        errors++;
                    }
                }
        
                // ============================================================
                // 3. Create notification for skills_hub.validation_reminder event
                //    Sends a summary email to the manager listing employees
                //    with unvalidated skills.
                //    parm1 = manager sys_id, parm2 = pending count
                // ============================================================
                var notif = new GlideRecord('sysevent_email_action');
                notif.addQuery('name', 'Skills Hub - Monthly Validation Reminder');
                notif.query();
        
                if (notif.next()) {
                    gs.info('[Skills Hub] Notification already exists: "Skills Hub - Monthly Validation Reminder" (sys_id: ' + notif.getUniqueValue() + ')');
                    existed++;
                } else {
                    notif.initialize();
                    notif.setValue('name', 'Skills Hub - Monthly Validation Reminder');
                    notif.setValue('event_name', 'skills_hub.validation_reminder');
                    notif.setValue('active', true);
                    notif.setValue('content_type', 'text/html');
                    notif.setValue('subject', 'Skills Hub: Team Skills Awaiting Your Validation');
        
                    // event parm1 = manager sys_id (used as recipient)
                    // event parm2 = pending skill count (used in template)
                    notif.setValue('event_parm_1', 'true');
        
                    notif.setValue('message_html',
                        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                        '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                        '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                        '</div>' +
                        '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                        '<h2 style="color: #333333; margin-top: 0;">Monthly Validation Reminder</h2>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'You have team members with skills that have not yet been validated. ' +
                        'Regular skill validation helps maintain accurate skill data across the organization.</p>' +
                        '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                        '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 180px; border: 1px solid #e0e0e0;">Pending Validations</td>' +
                        '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">${event.parm2} skill(s)</span></td></tr>' +
                        '</table>' +
                        '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                        'Please visit the <a href="/sp?id=skills_hub&tab=manager" style="color: #0072CE;">Skills Hub Manager View</a> ' +
                        'to review and validate your team\'s skills.</p>' +
                        '</div>' +
                        '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                        'This is an automated monthly reminder from the Skills Hub. Please do not reply directly to this email.' +
                        '</div></div>'
                    );
        
                    var notifId = notif.insert();
                    if (notifId) {
                        gs.info('[Skills Hub] Created notification: "Skills Hub - Monthly Validation Reminder" (sys_id: ' + notifId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create notification: "Skills Hub - Monthly Validation Reminder"');
                        errors++;
                    }
                }
        
                // ============================================================
                // Summary
                // ============================================================
                gs.info('[Skills Hub] ===== SCHEDULED JOBS SUMMARY =====');
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Already existed: ' + existed);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] =====================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 16_create_scheduled_jobs: ' + e.message);
            }

        _sectionResults.push({ section: 12, name: 'SCHEDULED JOBS (16)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 12: SCHEDULED JOBS (16) - COMPLETE ==========');
    } catch (_sectionErr12) {
        gs.error('[Skills Hub] SECTION 12 FATAL ERROR (SCHEDULED JOBS (16)): ' + _sectionErr12.message);
        _sectionResults.push({ section: 12, name: 'SCHEDULED JOBS (16)', status: 'ERROR: ' + _sectionErr12.message });
    }


    // ==================================================================
    // SECTION 13: TIER SYSTEM INJECTION (19)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 13: TIER SYSTEM INJECTION (19) ==========');
    try {
        try {
                gs.info('[Skills Hub] ===== STARTING 19_create_tier_system =====');
        
                // ============================================================
                // 1. Find the existing SkillsHubUtils Script Include
                // ============================================================
                var si = new GlideRecord('sys_script_include');
                si.addQuery('name', 'SkillsHubUtils');
                si.query();
        
                if (!si.next()) {
                    gs.error('[Skills Hub] SkillsHubUtils Script Include not found. Cannot add calculateUserTier.');
                    return;
                }
        
                var siSysId = si.getUniqueValue();
                gs.info('[Skills Hub] Found SkillsHubUtils (sys_id: ' + siSysId + ')');
        
                var currentScript = si.script.toString();
        
                // ============================================================
                // 2. Idempotency check
                // ============================================================
                if (currentScript.indexOf('calculateUserTier') > -1) {
                    gs.info('[Skills Hub] SkillsHubUtils already contains calculateUserTier method. Skipping.');
                    return;
                }
        
                // ============================================================
                // 3. Build the new method string
                // ============================================================
                var NL = '\n';
                var T4 = '    '; // 4-space indent (matches existing style)
        
                var newMethod = '';
                newMethod += NL;
                newMethod += T4 + '/* ===== Phase 3: Tier System ===== */' + NL;
                newMethod += NL;
                newMethod += T4 + '/**' + NL;
                newMethod += T4 + ' * Calculate the gamification tier for a user based on their skill activity.' + NL;
                newMethod += T4 + ' * Params: sysparm_user_id (optional, defaults to current user)' + NL;
                newMethod += T4 + ' * Returns JSON: {' + NL;
                newMethod += T4 + ' *   points: number,' + NL;
                newMethod += T4 + ' *   tier_name: string,' + NL;
                newMethod += T4 + ' *   tier_icon: string,' + NL;
                newMethod += T4 + ' *   next_tier_name: string,' + NL;
                newMethod += T4 + ' *   next_tier_threshold: number,' + NL;
                newMethod += T4 + ' *   progress_percent: number' + NL;
                newMethod += T4 + ' * }' + NL;
                newMethod += T4 + ' */' + NL;
                newMethod += T4 + 'calculateUserTier: function() {' + NL;
                newMethod += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\') || gs.getUserID();' + NL;
                newMethod += T4 + T4 + 'var totalPoints = 0;' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// Proficiency bonus lookup' + NL;
                newMethod += T4 + T4 + 'var proficiencyBonus = {' + NL;
                newMethod += T4 + T4 + T4 + '\'novice\': 2,' + NL;
                newMethod += T4 + T4 + T4 + '\'intermediate\': 5,' + NL;
                newMethod += T4 + T4 + T4 + '\'proficient\': 10,' + NL;
                newMethod += T4 + T4 + T4 + '\'advanced\': 20,' + NL;
                newMethod += T4 + T4 + T4 + '\'expert\': 35' + NL;
                newMethod += T4 + T4 + '};' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// Calculate quarter start date' + NL;
                newMethod += T4 + T4 + 'var now = new GlideDateTime();' + NL;
                newMethod += T4 + T4 + 'var currentMonth = parseInt(now.getMonthLocalTime(), 10);' + NL;
                newMethod += T4 + T4 + 'var currentYear = parseInt(now.getYearLocalTime(), 10);' + NL;
                newMethod += T4 + T4 + 'var quarterStartMonth;' + NL;
                newMethod += T4 + T4 + 'if (currentMonth <= 3) {' + NL;
                newMethod += T4 + T4 + T4 + 'quarterStartMonth = 1;' + NL;
                newMethod += T4 + T4 + '} else if (currentMonth <= 6) {' + NL;
                newMethod += T4 + T4 + T4 + 'quarterStartMonth = 4;' + NL;
                newMethod += T4 + T4 + '} else if (currentMonth <= 9) {' + NL;
                newMethod += T4 + T4 + T4 + 'quarterStartMonth = 7;' + NL;
                newMethod += T4 + T4 + '} else {' + NL;
                newMethod += T4 + T4 + T4 + 'quarterStartMonth = 10;' + NL;
                newMethod += T4 + T4 + '}' + NL;
                newMethod += T4 + T4 + 'var monthStr = (quarterStartMonth < 10) ? \'0\' + quarterStartMonth : \'\' + quarterStartMonth;' + NL;
                newMethod += T4 + T4 + 'var quarterStart = new GlideDateTime(currentYear + \'-\' + monthStr + \'-01 00:00:00\');' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// 1-5. Query user skills and calculate points' + NL;
                newMethod += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                newMethod += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
                newMethod += T4 + T4 + 'gr.query();' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + 'while (gr.next()) {' + NL;
                newMethod += T4 + T4 + T4 + '// 1. Skills owned: +10 each' + NL;
                newMethod += T4 + T4 + T4 + 'totalPoints += 10;' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + T4 + '// 2. Proficiency bonus' + NL;
                newMethod += T4 + T4 + T4 + 'var level = (gr.getValue(\'skill_level\') || \'novice\').toLowerCase();' + NL;
                newMethod += T4 + T4 + T4 + 'if (proficiencyBonus.hasOwnProperty(level)) {' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'totalPoints += proficiencyBonus[level];' + NL;
                newMethod += T4 + T4 + T4 + '}' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + T4 + '// 3. Endorsements received: +5 per endorsement' + NL;
                newMethod += T4 + T4 + T4 + 'var endorseCount = parseInt(gr.getValue(\'u_peer_endorsement_count\') || \'0\', 10);' + NL;
                newMethod += T4 + T4 + T4 + 'totalPoints += endorseCount * 5;' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + T4 + '// 5. Manager-validated skill: +15' + NL;
                newMethod += T4 + T4 + T4 + 'var valStatus = gr.getValue(\'u_validation_status\') || \'\';' + NL;
                newMethod += T4 + T4 + T4 + 'if (valStatus === \'validated\') {' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'totalPoints += 15;' + NL;
                newMethod += T4 + T4 + T4 + '}' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + T4 + '// 6. Skills added this quarter: +8 bonus each' + NL;
                newMethod += T4 + T4 + T4 + 'var createdOn = new GlideDateTime(gr.getValue(\'sys_created_on\') || \'\');' + NL;
                newMethod += T4 + T4 + T4 + 'if (createdOn.compareTo(quarterStart) >= 0) {' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'totalPoints += 8;' + NL;
                newMethod += T4 + T4 + T4 + '}' + NL;
                newMethod += T4 + T4 + '}' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// 4. Endorsements given: +3 per endorsement given' + NL;
                newMethod += T4 + T4 + 'var givenGr = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
                newMethod += T4 + T4 + 'givenGr.addQuery(\'u_endorser\', userId);' + NL;
                newMethod += T4 + T4 + 'givenGr.query();' + NL;
                newMethod += T4 + T4 + 'var endorsementsGiven = 0;' + NL;
                newMethod += T4 + T4 + 'while (givenGr.next()) {' + NL;
                newMethod += T4 + T4 + T4 + 'endorsementsGiven++;' + NL;
                newMethod += T4 + T4 + '}' + NL;
                newMethod += T4 + T4 + 'totalPoints += endorsementsGiven * 3;' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// Tier definitions' + NL;
                newMethod += T4 + T4 + 'var tiers = [' + NL;
                newMethod += T4 + T4 + T4 + '{ name: \'Starter\',      icon: \'fa-seedling\',              min: 0,   max: 49 },' + NL;
                newMethod += T4 + T4 + T4 + '{ name: \'Contributor\',   icon: \'fa-hand-holding-heart\',    min: 50,  max: 149 },' + NL;
                newMethod += T4 + T4 + T4 + '{ name: \'Specialist\',    icon: \'fa-star\',                  min: 150, max: 299 },' + NL;
                newMethod += T4 + T4 + T4 + '{ name: \'Trailblazer\',   icon: \'fa-fire\',                  min: 300, max: 499 },' + NL;
                newMethod += T4 + T4 + T4 + '{ name: \'Luminary\',      icon: \'fa-sun\',                   min: 500, max: 999999 }' + NL;
                newMethod += T4 + T4 + '];' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// Determine current tier' + NL;
                newMethod += T4 + T4 + 'var currentTier = tiers[0];' + NL;
                newMethod += T4 + T4 + 'var currentTierIndex = 0;' + NL;
                newMethod += T4 + T4 + 'for (var i = 0; i < tiers.length; i++) {' + NL;
                newMethod += T4 + T4 + T4 + 'if (totalPoints >= tiers[i].min && totalPoints <= tiers[i].max) {' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'currentTier = tiers[i];' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'currentTierIndex = i;' + NL;
                newMethod += T4 + T4 + T4 + T4 + 'break;' + NL;
                newMethod += T4 + T4 + T4 + '}' + NL;
                newMethod += T4 + T4 + '}' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + '// Determine next tier and progress' + NL;
                newMethod += T4 + T4 + 'var nextTierName = \'\';' + NL;
                newMethod += T4 + T4 + 'var nextTierThreshold = 0;' + NL;
                newMethod += T4 + T4 + 'var progressPercent = 100;' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + 'if (currentTierIndex < tiers.length - 1) {' + NL;
                newMethod += T4 + T4 + T4 + 'var nextTier = tiers[currentTierIndex + 1];' + NL;
                newMethod += T4 + T4 + T4 + 'nextTierName = nextTier.name;' + NL;
                newMethod += T4 + T4 + T4 + 'nextTierThreshold = nextTier.min;' + NL;
                newMethod += T4 + T4 + T4 + 'var tierRange = currentTier.max - currentTier.min + 1;' + NL;
                newMethod += T4 + T4 + T4 + 'var pointsInTier = totalPoints - currentTier.min;' + NL;
                newMethod += T4 + T4 + T4 + 'progressPercent = Math.round((pointsInTier / tierRange) * 100);' + NL;
                newMethod += T4 + T4 + T4 + 'if (progressPercent > 100) progressPercent = 100;' + NL;
                newMethod += T4 + T4 + T4 + 'if (progressPercent < 0) progressPercent = 0;' + NL;
                newMethod += T4 + T4 + '}' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + 'var result = {' + NL;
                newMethod += T4 + T4 + T4 + 'points: totalPoints,' + NL;
                newMethod += T4 + T4 + T4 + 'tier_name: currentTier.name,' + NL;
                newMethod += T4 + T4 + T4 + 'tier_icon: currentTier.icon,' + NL;
                newMethod += T4 + T4 + T4 + 'next_tier_name: nextTierName,' + NL;
                newMethod += T4 + T4 + T4 + 'next_tier_threshold: nextTierThreshold,' + NL;
                newMethod += T4 + T4 + T4 + 'progress_percent: progressPercent' + NL;
                newMethod += T4 + T4 + '};' + NL;
                newMethod += NL;
                newMethod += T4 + T4 + 'gs.info(\'[Skills Hub] Tier calculated for user \' + userId + \': \' + currentTier.name + \' (\' + totalPoints + \' pts)\');' + NL;
                newMethod += T4 + T4 + 'return JSON.stringify(result);' + NL;
                newMethod += T4 + '},' + NL;
                newMethod += NL;
        
                // ============================================================
                // 4. Inject the new method into the existing script
                // ============================================================
                var insertionMarker = "type: 'SkillsHubUtils'";
                var insertionPoint = currentScript.indexOf(insertionMarker);
        
                if (insertionPoint < 0) {
                    // Try double-quote variant
                    insertionMarker = 'type: "SkillsHubUtils"';
                    insertionPoint = currentScript.indexOf(insertionMarker);
                }
        
                if (insertionPoint < 0) {
                    gs.error('[Skills Hub] Could not find insertion point (type: \'SkillsHubUtils\') in script. Aborting.');
                    return;
                }
        
                var updatedScript = currentScript.substring(0, insertionPoint) + newMethod + T4 + currentScript.substring(insertionPoint);
        
                si.script = updatedScript;
                si.update();
        
                gs.info('[Skills Hub] ===== TIER SYSTEM UPDATE SUMMARY =====');
                gs.info('[Skills Hub] SkillsHubUtils sys_id: ' + siSysId);
                gs.info('[Skills Hub] Method added: calculateUserTier');
                gs.info('[Skills Hub] Original script length: ' + currentScript.length);
                gs.info('[Skills Hub] Updated script length: ' + updatedScript.length);
                gs.info('[Skills Hub] Tiers: Starter (0-49), Contributor (50-149), Specialist (150-299), Trailblazer (300-499), Luminary (500+)');
                gs.info('[Skills Hub] Point sources: skills (+10), proficiency bonus, endorsements received (+5), given (+3), validated (+15), quarterly (+8)');
                gs.info('[Skills Hub] ============================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 19_create_tier_system: ' + e.message);
            }

        _sectionResults.push({ section: 13, name: 'TIER SYSTEM INJECTION (19)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 13: TIER SYSTEM INJECTION (19) - COMPLETE ==========');
    } catch (_sectionErr13) {
        gs.error('[Skills Hub] SECTION 13 FATAL ERROR (TIER SYSTEM INJECTION (19)): ' + _sectionErr13.message);
        _sectionResults.push({ section: 13, name: 'TIER SYSTEM INJECTION (19)', status: 'ERROR: ' + _sectionErr13.message });
    }


    // ==================================================================
    // SECTION 14: LEADERBOARD WIDGET (21)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 14: LEADERBOARD WIDGET (21) ==========');
    try {
        try {
                gs.info('[Skills Hub] ===== STARTING LEADERBOARD WIDGET CREATION (Script 21) =====');
        
                var WIDGET_ID = 'skills-hub-leaderboard';
                var WIDGET_NAME = 'Skills Hub - Leaderboard';
        
                // ================================================================
                // 1. Idempotency check
                // ================================================================
                var existing = new GlideRecord('sp_widget');
                existing.addQuery('id', WIDGET_ID);
                existing.query();
        
                if (existing.next()) {
                    gs.info('[Skills Hub] Leaderboard widget already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // Also check by name
                var existingByName = new GlideRecord('sp_widget');
                existingByName.addQuery('name', WIDGET_NAME);
                existingByName.query();
        
                if (existingByName.next()) {
                    gs.info('[Skills Hub] Leaderboard widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // ================================================================
                // 2. Build SERVER SCRIPT
                // ================================================================
                var NL = '\n';
                var serverScript = '';
                serverScript += '(function() {' + NL;
                serverScript += '    var scope = "team";' + NL;
                serverScript += '    if (input && input.action == "switch") {' + NL;
                serverScript += '        scope = input.scope || "team";' + NL;
                serverScript += '    } else if (input && input.scope) {' + NL;
                serverScript += '        scope = input.scope;' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    var me = gs.getUserID();' + NL;
                serverScript += '    data.scope = scope;' + NL;
                serverScript += '    data.leaders = [];' + NL;
                serverScript += '    data.my_user_id = me;' + NL;
                serverScript += '    data.empty = false;' + NL;
                serverScript += '' + NL;
                serverScript += '    // Get current user info' + NL;
                serverScript += '    var userGR = new GlideRecord("sys_user");' + NL;
                serverScript += '    userGR.get(me);' + NL;
                serverScript += '    var myDept = userGR.department.toString();' + NL;
                serverScript += '    var myManager = userGR.manager.toString();' + NL;
                serverScript += '' + NL;
                serverScript += '    // Collect target users based on scope' + NL;
                serverScript += '    var ugr = new GlideRecord("sys_user");' + NL;
                serverScript += '    ugr.addActiveQuery();' + NL;
                serverScript += '    if (scope == "team") {' + NL;
                serverScript += '        if (!myManager) {' + NL;
                serverScript += '            data.empty = true;' + NL;
                serverScript += '            data.empty_message = "No manager assigned. Cannot determine team.";' + NL;
                serverScript += '            return;' + NL;
                serverScript += '        }' + NL;
                serverScript += '        ugr.addQuery("manager", myManager);' + NL;
                serverScript += '    } else {' + NL;
                serverScript += '        if (!myDept) {' + NL;
                serverScript += '            data.empty = true;' + NL;
                serverScript += '            data.empty_message = "No department assigned. Cannot determine department peers.";' + NL;
                serverScript += '            return;' + NL;
                serverScript += '        }' + NL;
                serverScript += '        ugr.addQuery("department", myDept);' + NL;
                serverScript += '    }' + NL;
                serverScript += '    ugr.setLimit(50);' + NL;
                serverScript += '    ugr.query();' + NL;
                serverScript += '' + NL;
                serverScript += '    var userMap = {};' + NL;
                serverScript += '    var targetUserIds = [];' + NL;
                serverScript += '    while (ugr.next()) {' + NL;
                serverScript += '        var uid = ugr.getUniqueValue();' + NL;
                serverScript += '        var fullName = ugr.name.toString();' + NL;
                serverScript += '        var nameParts = fullName.split(" ");' + NL;
                serverScript += '        var initials = "";' + NL;
                serverScript += '        if (nameParts.length >= 2) {' + NL;
                serverScript += '            initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();' + NL;
                serverScript += '        } else if (nameParts.length == 1) {' + NL;
                serverScript += '            initials = nameParts[0].charAt(0).toUpperCase();' + NL;
                serverScript += '        }' + NL;
                serverScript += '' + NL;
                serverScript += '        targetUserIds.push(uid);' + NL;
                serverScript += '        userMap[uid] = {' + NL;
                serverScript += '            sys_id: uid,' + NL;
                serverScript += '            name: fullName,' + NL;
                serverScript += '            title: ugr.title.toString() || "Employee",' + NL;
                serverScript += '            initials: initials,' + NL;
                serverScript += '            avatar: ugr.photo.getDisplayValue() || "",' + NL;
                serverScript += '            points: 0,' + NL;
                serverScript += '            skill_count: 0,' + NL;
                serverScript += '            endorsement_count: 0,' + NL;
                serverScript += '            tier_name: "",' + NL;
                serverScript += '            tier_icon: ""' + NL;
                serverScript += '        };' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    if (targetUserIds.length == 0) {' + NL;
                serverScript += '        data.empty = true;' + NL;
                serverScript += '        data.empty_message = "No users found in your " + scope + ".";' + NL;
                serverScript += '        return;' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Proficiency bonus map' + NL;
                serverScript += '    var profBonus = {' + NL;
                serverScript += '        "novice": 2,' + NL;
                serverScript += '        "intermediate": 5,' + NL;
                serverScript += '        "proficient": 10,' + NL;
                serverScript += '        "advanced": 20,' + NL;
                serverScript += '        "expert": 35' + NL;
                serverScript += '    };' + NL;
                serverScript += '' + NL;
                serverScript += '    // Calculate quarter start for bonus' + NL;
                serverScript += '    var now = new GlideDateTime();' + NL;
                serverScript += '    var currentMonth = parseInt(now.getMonthLocalTime(), 10);' + NL;
                serverScript += '    var quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;' + NL;
                serverScript += '    var quarterStart = new GlideDateTime();' + NL;
                serverScript += '    quarterStart.setDisplayValue(now.getYearLocalTime() + "-" + (quarterStartMonth < 10 ? "0" : "") + quarterStartMonth + "-01 00:00:00");' + NL;
                serverScript += '    var quarterStartVal = quarterStart.getValue();' + NL;
                serverScript += '' + NL;
                serverScript += '    // Query all skills for target users' + NL;
                serverScript += '    var skillGr = new GlideRecord("sys_user_has_skill");' + NL;
                serverScript += '    skillGr.addQuery("user", "IN", targetUserIds.join(","));' + NL;
                serverScript += '    skillGr.query();' + NL;
                serverScript += '' + NL;
                serverScript += '    while (skillGr.next()) {' + NL;
                serverScript += '        var skillUser = skillGr.user.toString();' + NL;
                serverScript += '        if (!userMap[skillUser]) continue;' + NL;
                serverScript += '' + NL;
                serverScript += '        var entry = userMap[skillUser];' + NL;
                serverScript += '        entry.skill_count++;' + NL;
                serverScript += '' + NL;
                serverScript += '        // +10 per skill owned' + NL;
                serverScript += '        entry.points += 10;' + NL;
                serverScript += '' + NL;
                serverScript += '        // Proficiency bonus' + NL;
                serverScript += '        var level = skillGr.skill_level.toString().toLowerCase();' + NL;
                serverScript += '        if (profBonus[level]) {' + NL;
                serverScript += '            entry.points += profBonus[level];' + NL;
                serverScript += '        }' + NL;
                serverScript += '' + NL;
                serverScript += '        // +5 per endorsement received' + NL;
                serverScript += '        var endorseCount = parseInt(skillGr.getValue("u_peer_endorsement_count") || "0", 10);' + NL;
                serverScript += '        entry.points += endorseCount * 5;' + NL;
                serverScript += '        entry.endorsement_count += endorseCount;' + NL;
                serverScript += '' + NL;
                serverScript += '        // +15 per validated skill' + NL;
                serverScript += '        var valStatus = skillGr.getValue("u_validation_status") || "";' + NL;
                serverScript += '        if (valStatus == "validated") {' + NL;
                serverScript += '            entry.points += 15;' + NL;
                serverScript += '        }' + NL;
                serverScript += '' + NL;
                serverScript += '        // +8 per skill added this quarter' + NL;
                serverScript += '        var createdOn = skillGr.getValue("sys_created_on") || "";' + NL;
                serverScript += '        if (createdOn && createdOn >= quarterStartVal) {' + NL;
                serverScript += '            entry.points += 8;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Add endorsements given (+3 each) for all target users' + NL;
                serverScript += '    var egGr = new GlideRecord("u_m2m_skill_endorsement");' + NL;
                serverScript += '    egGr.addQuery("u_endorser", "IN", targetUserIds.join(","));' + NL;
                serverScript += '    egGr.query();' + NL;
                serverScript += '    while (egGr.next()) {' + NL;
                serverScript += '        var endorser = egGr.u_endorser.toString();' + NL;
                serverScript += '        if (userMap[endorser]) {' + NL;
                serverScript += '            userMap[endorser].points += 3;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Tier determination function' + NL;
                serverScript += '    function getTier(points) {' + NL;
                serverScript += '        if (points >= 500) return { name: "Luminary", icon: "fa-sun" };' + NL;
                serverScript += '        if (points >= 300) return { name: "Trailblazer", icon: "fa-fire" };' + NL;
                serverScript += '        if (points >= 150) return { name: "Specialist", icon: "fa-star" };' + NL;
                serverScript += '        if (points >= 50) return { name: "Contributor", icon: "fa-hand-holding-heart" };' + NL;
                serverScript += '        return { name: "Starter", icon: "fa-seedling" };' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Build sorted leaders array' + NL;
                serverScript += '    var leaders = [];' + NL;
                serverScript += '    for (var userId in userMap) {' + NL;
                serverScript += '        if (userMap.hasOwnProperty(userId)) {' + NL;
                serverScript += '            var u = userMap[userId];' + NL;
                serverScript += '            var tier = getTier(u.points);' + NL;
                serverScript += '            u.tier_name = tier.name;' + NL;
                serverScript += '            u.tier_icon = tier.icon;' + NL;
                serverScript += '            leaders.push(u);' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Sort descending by points, then by name alphabetically for ties' + NL;
                serverScript += '    leaders.sort(function(a, b) {' + NL;
                serverScript += '        if (b.points != a.points) return b.points - a.points;' + NL;
                serverScript += '        return (a.name > b.name) ? 1 : (a.name < b.name) ? -1 : 0;' + NL;
                serverScript += '    });' + NL;
                serverScript += '' + NL;
                serverScript += '    // Assign rank' + NL;
                serverScript += '    for (var i = 0; i < leaders.length; i++) {' + NL;
                serverScript += '        leaders[i].rank = i + 1;' + NL;
                serverScript += '        leaders[i].is_current_user = (leaders[i].sys_id == me);' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    data.leaders = leaders;' + NL;
                serverScript += '    data.total_users = leaders.length;' + NL;
                serverScript += '})();';
        
                // ================================================================
                // 3. Build CLIENT SCRIPT
                // ================================================================
                var clientScript = '';
                clientScript += 'api.controller = function($scope, spUtil) {' + NL;
                clientScript += '    var c = this;' + NL;
                clientScript += '' + NL;
                clientScript += '    c.activeScope = c.data.scope || "team";' + NL;
                clientScript += '' + NL;
                clientScript += '    c.switchScope = function(newScope) {' + NL;
                clientScript += '        if (newScope == c.activeScope) return;' + NL;
                clientScript += '        c.activeScope = newScope;' + NL;
                clientScript += '        c.data.loading = true;' + NL;
                clientScript += '        c.server.get({ action: "switch", scope: newScope }).then(function(response) {' + NL;
                clientScript += '            c.data.leaders = response.data.leaders;' + NL;
                clientScript += '            c.data.scope = response.data.scope;' + NL;
                clientScript += '            c.data.empty = response.data.empty;' + NL;
                clientScript += '            c.data.empty_message = response.data.empty_message;' + NL;
                clientScript += '            c.data.total_users = response.data.total_users;' + NL;
                clientScript += '            c.data.loading = false;' + NL;
                clientScript += '        });' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    c.getRankClass = function(rank) {' + NL;
                clientScript += '        if (rank == 1) return "rank-gold";' + NL;
                clientScript += '        if (rank == 2) return "rank-silver";' + NL;
                clientScript += '        if (rank == 3) return "rank-bronze";' + NL;
                clientScript += '        return "";' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    c.getRankIcon = function(rank) {' + NL;
                clientScript += '        if (rank == 1) return "fa-trophy";' + NL;
                clientScript += '        if (rank == 2) return "fa-medal";' + NL;
                clientScript += '        if (rank == 3) return "fa-award";' + NL;
                clientScript += '        return "";' + NL;
                clientScript += '    };' + NL;
                clientScript += '};';
        
                // ================================================================
                // 4. Build TEMPLATE
                // ================================================================
                var template = '';
                template += '<div class="leaderboard-widget">' + NL;
                template += '    <div class="leaderboard-header">' + NL;
                template += '        <h3 class="leaderboard-title"><i class="fa fa-trophy"></i> Skill Leaderboard</h3>' + NL;
                template += '        <div class="scope-toggle">' + NL;
                template += '            <button class="btn btn-sm" ' + NL;
                template += '                    ng-class="{\'btn-primary\': c.activeScope == \'team\', \'btn-default\': c.activeScope != \'team\'}" ' + NL;
                template += '                    ng-click="c.switchScope(\'team\')">' + NL;
                template += '                <i class="fa fa-users"></i> My Team' + NL;
                template += '            </button>' + NL;
                template += '            <button class="btn btn-sm" ' + NL;
                template += '                    ng-class="{\'btn-primary\': c.activeScope == \'department\', \'btn-default\': c.activeScope != \'department\'}" ' + NL;
                template += '                    ng-click="c.switchScope(\'department\')">' + NL;
                template += '                <i class="fa fa-building"></i> Department' + NL;
                template += '            </button>' + NL;
                template += '        </div>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <div class="leaderboard-loading" ng-if="c.data.loading">' + NL;
                template += '        <i class="fa fa-spinner fa-spin"></i> Loading...' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <div class="leaderboard-empty" ng-if="c.data.empty && !c.data.loading">' + NL;
                template += '        <i class="fa fa-info-circle"></i>' + NL;
                template += '        <p>{{c.data.empty_message || "No data available."}}</p>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <div class="leaderboard-table-wrap" ng-if="!c.data.empty && !c.data.loading">' + NL;
                template += '        <table class="leaderboard-table">' + NL;
                template += '            <thead>' + NL;
                template += '                <tr>' + NL;
                template += '                    <th class="col-rank">Rank</th>' + NL;
                template += '                    <th class="col-user">User</th>' + NL;
                template += '                    <th class="col-points">Points</th>' + NL;
                template += '                    <th class="col-tier">Tier</th>' + NL;
                template += '                    <th class="col-skills">Skills</th>' + NL;
                template += '                </tr>' + NL;
                template += '            </thead>' + NL;
                template += '            <tbody>' + NL;
                template += '                <tr ng-repeat="leader in c.data.leaders track by leader.sys_id" ' + NL;
                template += '                    ng-class="{\'current-user-row\': leader.is_current_user}">' + NL;
                template += '                    <td class="col-rank">' + NL;
                template += '                        <span class="rank-number" ng-class="c.getRankClass(leader.rank)">' + NL;
                template += '                            <i class="fa" ng-class="c.getRankIcon(leader.rank)" ng-if="leader.rank <= 3"></i>' + NL;
                template += '                            <span ng-if="leader.rank > 3">{{leader.rank}}</span>' + NL;
                template += '                        </span>' + NL;
                template += '                    </td>' + NL;
                template += '                    <td class="col-user">' + NL;
                template += '                        <div class="user-cell">' + NL;
                template += '                            <div class="user-avatar" ng-if="!leader.avatar">{{leader.initials}}</div>' + NL;
                template += '                            <img class="user-avatar-img" ng-if="leader.avatar" ng-src="{{leader.avatar}}" alt="{{leader.name}}" />' + NL;
                template += '                            <div class="user-info">' + NL;
                template += '                                <div class="user-name">{{leader.name}}</div>' + NL;
                template += '                                <div class="user-title">{{leader.title}}</div>' + NL;
                template += '                            </div>' + NL;
                template += '                        </div>' + NL;
                template += '                    </td>' + NL;
                template += '                    <td class="col-points">' + NL;
                template += '                        <span class="points-value">{{leader.points}}</span>' + NL;
                template += '                    </td>' + NL;
                template += '                    <td class="col-tier">' + NL;
                template += '                        <span class="tier-badge-mini">' + NL;
                template += '                            <i class="fa {{leader.tier_icon}}"></i>' + NL;
                template += '                            <span>{{leader.tier_name}}</span>' + NL;
                template += '                        </span>' + NL;
                template += '                    </td>' + NL;
                template += '                    <td class="col-skills">' + NL;
                template += '                        <span class="skills-count">{{leader.skill_count}}</span>' + NL;
                template += '                    </td>' + NL;
                template += '                </tr>' + NL;
                template += '            </tbody>' + NL;
                template += '        </table>' + NL;
                template += '        <div class="leaderboard-footer">' + NL;
                template += '            <span class="total-label">{{c.data.total_users}} users in your {{c.data.scope}}</span>' + NL;
                template += '        </div>' + NL;
                template += '    </div>' + NL;
                template += '</div>';
        
                // ================================================================
                // 5. Build CSS
                // ================================================================
                var css = '';
                css += '/* ===== Skills Hub Leaderboard Widget ===== */' + NL;
                css += '.leaderboard-widget {' + NL;
                css += '    font-family: "Source Sans Pro", Arial, sans-serif;' + NL;
                css += '}' + NL;
                css += '.leaderboard-header {' + NL;
                css += '    display: flex;' + NL;
                css += '    justify-content: space-between;' + NL;
                css += '    align-items: center;' + NL;
                css += '    margin-bottom: 16px;' + NL;
                css += '    flex-wrap: wrap;' + NL;
                css += '    gap: 8px;' + NL;
                css += '}' + NL;
                css += '.leaderboard-title {' + NL;
                css += '    font-size: 1.3em;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    color: #333333;' + NL;
                css += '    margin: 0;' + NL;
                css += '}' + NL;
                css += '.leaderboard-title .fa {' + NL;
                css += '    color: #f0ad4e;' + NL;
                css += '    margin-right: 6px;' + NL;
                css += '}' + NL;
                css += '.scope-toggle .btn {' + NL;
                css += '    margin-left: 4px;' + NL;
                css += '    border-radius: 20px;' + NL;
                css += '    padding: 4px 14px;' + NL;
                css += '    font-size: 0.85em;' + NL;
                css += '}' + NL;
                css += '.scope-toggle .btn-primary {' + NL;
                css += '    background-color: #0072CE;' + NL;
                css += '    border-color: #0072CE;' + NL;
                css += '}' + NL;
                css += '.leaderboard-loading {' + NL;
                css += '    text-align: center;' + NL;
                css += '    padding: 40px 0;' + NL;
                css += '    color: #888888;' + NL;
                css += '    font-size: 1.1em;' + NL;
                css += '}' + NL;
                css += '.leaderboard-empty {' + NL;
                css += '    text-align: center;' + NL;
                css += '    padding: 40px 20px;' + NL;
                css += '    color: #999999;' + NL;
                css += '}' + NL;
                css += '.leaderboard-empty .fa {' + NL;
                css += '    font-size: 2em;' + NL;
                css += '    margin-bottom: 10px;' + NL;
                css += '    display: block;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table-wrap {' + NL;
                css += '    overflow-x: auto;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table {' + NL;
                css += '    width: 100%;' + NL;
                css += '    border-collapse: separate;' + NL;
                css += '    border-spacing: 0 4px;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table thead th {' + NL;
                css += '    font-size: 0.8em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    text-transform: uppercase;' + NL;
                css += '    color: #888888;' + NL;
                css += '    padding: 8px 12px;' + NL;
                css += '    border-bottom: 2px solid #e0e0e0;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table tbody tr {' + NL;
                css += '    background: #ffffff;' + NL;
                css += '    transition: background 0.15s ease;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table tbody tr:hover {' + NL;
                css += '    background: #f8f9fa;' + NL;
                css += '}' + NL;
                css += '.leaderboard-table td {' + NL;
                css += '    padding: 10px 12px;' + NL;
                css += '    vertical-align: middle;' + NL;
                css += '    border-bottom: 1px solid #f0f0f0;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Rank column */' + NL;
                css += '.col-rank {' + NL;
                css += '    width: 60px;' + NL;
                css += '    text-align: center;' + NL;
                css += '}' + NL;
                css += '.rank-number {' + NL;
                css += '    display: inline-flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    justify-content: center;' + NL;
                css += '    width: 32px;' + NL;
                css += '    height: 32px;' + NL;
                css += '    border-radius: 50%;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    font-size: 0.9em;' + NL;
                css += '    color: #666666;' + NL;
                css += '    background: #f0f0f0;' + NL;
                css += '}' + NL;
                css += '.rank-gold {' + NL;
                css += '    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);' + NL;
                css += '    color: #ffffff;' + NL;
                css += '    font-size: 1.1em;' + NL;
                css += '    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);' + NL;
                css += '}' + NL;
                css += '.rank-silver {' + NL;
                css += '    background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);' + NL;
                css += '    color: #ffffff;' + NL;
                css += '    font-size: 1.05em;' + NL;
                css += '    box-shadow: 0 2px 6px rgba(192, 192, 192, 0.4);' + NL;
                css += '}' + NL;
                css += '.rank-bronze {' + NL;
                css += '    background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%);' + NL;
                css += '    color: #ffffff;' + NL;
                css += '    font-size: 1em;' + NL;
                css += '    box-shadow: 0 2px 6px rgba(205, 127, 50, 0.4);' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* User column */' + NL;
                css += '.user-cell {' + NL;
                css += '    display: flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    gap: 10px;' + NL;
                css += '}' + NL;
                css += '.user-avatar {' + NL;
                css += '    width: 36px;' + NL;
                css += '    height: 36px;' + NL;
                css += '    border-radius: 50%;' + NL;
                css += '    background-color: #0072CE;' + NL;
                css += '    color: #ffffff;' + NL;
                css += '    display: flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    justify-content: center;' + NL;
                css += '    font-size: 0.85em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    flex-shrink: 0;' + NL;
                css += '}' + NL;
                css += '.user-avatar-img {' + NL;
                css += '    width: 36px;' + NL;
                css += '    height: 36px;' + NL;
                css += '    border-radius: 50%;' + NL;
                css += '    object-fit: cover;' + NL;
                css += '    flex-shrink: 0;' + NL;
                css += '}' + NL;
                css += '.user-info {' + NL;
                css += '    min-width: 0;' + NL;
                css += '}' + NL;
                css += '.user-name {' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #333333;' + NL;
                css += '    font-size: 0.95em;' + NL;
                css += '    white-space: nowrap;' + NL;
                css += '    overflow: hidden;' + NL;
                css += '    text-overflow: ellipsis;' + NL;
                css += '}' + NL;
                css += '.user-title {' + NL;
                css += '    font-size: 0.8em;' + NL;
                css += '    color: #999999;' + NL;
                css += '    white-space: nowrap;' + NL;
                css += '    overflow: hidden;' + NL;
                css += '    text-overflow: ellipsis;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Points column */' + NL;
                css += '.points-value {' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    font-size: 1.1em;' + NL;
                css += '    color: #0072CE;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Tier column */' + NL;
                css += '.tier-badge-mini {' + NL;
                css += '    display: inline-flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    gap: 6px;' + NL;
                css += '    padding: 3px 10px;' + NL;
                css += '    border-radius: 12px;' + NL;
                css += '    background: #f0f7ff;' + NL;
                css += '    font-size: 0.85em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #0072CE;' + NL;
                css += '}' + NL;
                css += '.tier-badge-mini .fa {' + NL;
                css += '    font-size: 1.1em;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Skills count */' + NL;
                css += '.skills-count {' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #555555;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Current user highlight */' + NL;
                css += '.current-user-row {' + NL;
                css += '    background: #e8f4fd !important;' + NL;
                css += '    border-left: 3px solid #0072CE;' + NL;
                css += '}' + NL;
                css += '.current-user-row .user-name {' + NL;
                css += '    color: #0072CE;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Footer */' + NL;
                css += '.leaderboard-footer {' + NL;
                css += '    text-align: center;' + NL;
                css += '    padding: 12px 0 4px;' + NL;
                css += '    font-size: 0.8em;' + NL;
                css += '    color: #aaaaaa;' + NL;
                css += '}';
        
                // ================================================================
                // 6. Create the widget record
                // ================================================================
                var widgetGR = new GlideRecord('sp_widget');
                widgetGR.initialize();
                widgetGR.setValue('name', WIDGET_NAME);
                widgetGR.setValue('id', WIDGET_ID);
                widgetGR.setValue('script', serverScript);
                widgetGR.setValue('client_script', clientScript);
                widgetGR.setValue('template', template);
                widgetGR.setValue('css', css);
        
                var widgetSysId = widgetGR.insert();
        
                if (widgetSysId) {
                    gs.info('[Skills Hub] Leaderboard widget created successfully (sys_id: ' + widgetSysId + ')');
                } else {
                    gs.error('[Skills Hub] FAILED to create leaderboard widget');
                    return;
                }
        
                // ================================================================
                // 7. Summary
                // ================================================================
                gs.info('[Skills Hub] ===== LEADERBOARD WIDGET CREATION SUMMARY =====');
                gs.info('[Skills Hub] Widget name: ' + WIDGET_NAME);
                gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
                gs.info('[Skills Hub] Widget sys_id: ' + widgetSysId);
                gs.info('[Skills Hub] Server script: tier point calculation for team/department');
                gs.info('[Skills Hub] Client script: scope toggle (team/department)');
                gs.info('[Skills Hub] Template: leaderboard table with rank, user, points, tier, skills');
                gs.info('[Skills Hub] CSS: gold/silver/bronze ranks, current user highlight, tier badges');
                gs.info('[Skills Hub] ================================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 21_create_leaderboard_widget: ' + e.message);
            }

        _sectionResults.push({ section: 14, name: 'LEADERBOARD WIDGET (21)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 14: LEADERBOARD WIDGET (21) - COMPLETE ==========');
    } catch (_sectionErr14) {
        gs.error('[Skills Hub] SECTION 14 FATAL ERROR (LEADERBOARD WIDGET (21)): ' + _sectionErr14.message);
        _sectionResults.push({ section: 14, name: 'LEADERBOARD WIDGET (21)', status: 'ERROR: ' + _sectionErr14.message });
    }


    // ==================================================================
    // SECTION 15: SKILL GROUPING LOGIC (22)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 15: SKILL GROUPING LOGIC (22) ==========');
    try {
        try {
                gs.info('[Skills Hub] Starting 22_create_skill_grouping_logic...');
        
                // ============================================================
                // 1. Check if SkillsHubGrouping already exists
                // ============================================================
                var existing = new GlideRecord('sys_script_include');
                existing.addQuery('name', 'SkillsHubGrouping');
                existing.query();
        
                if (existing.next()) {
                    gs.info('[Skills Hub] SkillsHubGrouping Script Include already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // ============================================================
                // 2. Build the Script Include body
                // ============================================================
                var NL = '\n';
                var T = '    ';  // 4-space indent
        
                var script = '';
                script += 'var SkillsHubGrouping = Class.create();' + NL;
                script += 'SkillsHubGrouping.prototype = {' + NL;
                script += NL;
                script += T + 'initialize: function() {},' + NL;
                script += NL;
        
                // ----- getGroupsForSkill -----
                script += T + '/**' + NL;
                script += T + ' * Get all category groups a skill belongs to.' + NL;
                script += T + ' * @param {string} skillSysId - sys_id of a cmn_skill record' + NL;
                script += T + ' * @returns {Array} Array of { group_sys_id, group_name, categories: [{sys_id, name}] }' + NL;
                script += T + ' */' + NL;
                script += T + 'getGroupsForSkill: function(skillSysId) {' + NL;
                script += T + T + 'var groupMap = {};' + NL;
                script += T + T + 'var results = [];' + NL;
                script += NL;
                script += T + T + 'if (!skillSysId) {' + NL;
                script += T + T + T + 'gs.warn(\'[Skills Hub] getGroupsForSkill: No skillSysId provided\');' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + '// First, get the skill name so we can find all cmn_skill records with that name' + NL;
                script += T + T + 'var skillGR = new GlideRecord(\'cmn_skill\');' + NL;
                script += T + T + 'if (!skillGR.get(skillSysId)) {' + NL;
                script += T + T + T + 'gs.warn(\'[Skills Hub] getGroupsForSkill: Skill not found: \' + skillSysId);' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'var skillName = skillGR.getValue(\'name\');' + NL;
                script += NL;
                script += T + T + '// Find all cmn_skill records with the same name' + NL;
                script += T + T + 'var allSkillIds = [];' + NL;
                script += T + T + 'var sameNameGR = new GlideRecord(\'cmn_skill\');' + NL;
                script += T + T + 'sameNameGR.addQuery(\'name\', skillName);' + NL;
                script += T + T + 'sameNameGR.query();' + NL;
                script += T + T + 'while (sameNameGR.next()) {' + NL;
                script += T + T + T + 'allSkillIds.push(sameNameGR.getUniqueValue());' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + '// Query the M2M table for all these skill IDs' + NL;
                script += T + T + 'var m2mGR = new GlideRecord(\'u_m2m_skill_category_group\');' + NL;
                script += T + T + 'm2mGR.addQuery(\'u_skill\', \'IN\', allSkillIds.join(\',\'));' + NL;
                script += T + T + 'm2mGR.query();' + NL;
                script += NL;
                script += T + T + 'while (m2mGR.next()) {' + NL;
                script += T + T + T + 'var groupId = m2mGR.getValue(\'u_category_group\');' + NL;
                script += T + T + T + 'var groupName = m2mGR.getDisplayValue(\'u_category_group\');' + NL;
                script += T + T + T + 'var catId = m2mGR.getValue(\'u_category\');' + NL;
                script += T + T + T + 'var catName = m2mGR.getDisplayValue(\'u_category\');' + NL;
                script += NL;
                script += T + T + T + 'if (!groupMap[groupId]) {' + NL;
                script += T + T + T + T + 'groupMap[groupId] = {' + NL;
                script += T + T + T + T + T + 'group_sys_id: groupId,' + NL;
                script += T + T + T + T + T + 'group_name: groupName,' + NL;
                script += T + T + T + T + T + 'categories: []' + NL;
                script += T + T + T + T + '};' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'groupMap[groupId].categories.push({' + NL;
                script += T + T + T + T + 'sys_id: catId,' + NL;
                script += T + T + T + T + 'name: catName' + NL;
                script += T + T + T + '});' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + '// Convert map to array' + NL;
                script += T + T + 'for (var gid in groupMap) {' + NL;
                script += T + T + T + 'if (groupMap.hasOwnProperty(gid)) {' + NL;
                script += T + T + T + T + 'results.push(groupMap[gid]);' + NL;
                script += T + T + T + '}' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'return results;' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- getSkillsInGroup -----
                script += T + '/**' + NL;
                script += T + ' * Get all skills in a category group.' + NL;
                script += T + ' * @param {string} groupSysId - sys_id of a u_skill_category_group record' + NL;
                script += T + ' * @returns {Array} Array of { skill_sys_id, skill_name, category_sys_id, category_name }' + NL;
                script += T + ' */' + NL;
                script += T + 'getSkillsInGroup: function(groupSysId) {' + NL;
                script += T + T + 'var results = [];' + NL;
                script += NL;
                script += T + T + 'if (!groupSysId) {' + NL;
                script += T + T + T + 'gs.warn(\'[Skills Hub] getSkillsInGroup: No groupSysId provided\');' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'var m2mGR = new GlideRecord(\'u_m2m_skill_category_group\');' + NL;
                script += T + T + 'm2mGR.addQuery(\'u_category_group\', groupSysId);' + NL;
                script += T + T + 'm2mGR.query();' + NL;
                script += NL;
                script += T + T + 'while (m2mGR.next()) {' + NL;
                script += T + T + T + 'results.push({' + NL;
                script += T + T + T + T + 'skill_sys_id: m2mGR.getValue(\'u_skill\'),' + NL;
                script += T + T + T + T + 'skill_name: m2mGR.getDisplayValue(\'u_skill\'),' + NL;
                script += T + T + T + T + 'category_sys_id: m2mGR.getValue(\'u_category\'),' + NL;
                script += T + T + T + T + 'category_name: m2mGR.getDisplayValue(\'u_category\')' + NL;
                script += T + T + T + '});' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'return results;' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- addSkillToCategories -----
                script += T + '/**' + NL;
                script += T + ' * Add a skill for a user across multiple categories.' + NL;
                script += T + ' * For each category, finds the cmn_skill with the same name in that category' + NL;
                script += T + ' * and creates a sys_user_has_skill record if not already present.' + NL;
                script += T + ' * @param {string} userSysId - sys_id of the user' + NL;
                script += T + ' * @param {string} skillSysId - sys_id of the source cmn_skill record' + NL;
                script += T + ' * @param {Array} categorySysIds - Array of cmn_skill_category sys_ids' + NL;
                script += T + ' * @returns {Object} { added: number, skipped: number, errors: [] }' + NL;
                script += T + ' */' + NL;
                script += T + 'addSkillToCategories: function(userSysId, skillSysId, categorySysIds) {' + NL;
                script += T + T + 'var result = { added: 0, skipped: 0, errors: [] };' + NL;
                script += NL;
                script += T + T + 'if (!userSysId || !skillSysId || !categorySysIds || categorySysIds.length === 0) {' + NL;
                script += T + T + T + 'result.errors.push(\'Missing required parameters\');' + NL;
                script += T + T + T + 'return result;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + '// Get the skill name from the source skill' + NL;
                script += T + T + 'var sourceSkill = new GlideRecord(\'cmn_skill\');' + NL;
                script += T + T + 'if (!sourceSkill.get(skillSysId)) {' + NL;
                script += T + T + T + 'result.errors.push(\'Source skill not found: \' + skillSysId);' + NL;
                script += T + T + T + 'return result;' + NL;
                script += T + T + '}' + NL;
                script += T + T + 'var skillName = sourceSkill.getValue(\'name\');' + NL;
                script += NL;
                script += T + T + 'for (var i = 0; i < categorySysIds.length; i++) {' + NL;
                script += T + T + T + 'var catId = categorySysIds[i];' + NL;
                script += NL;
                script += T + T + T + '// Find the cmn_skill with this name in the target category' + NL;
                script += T + T + T + 'var targetSkill = new GlideRecord(\'cmn_skill\');' + NL;
                script += T + T + T + 'targetSkill.addQuery(\'name\', skillName);' + NL;
                script += T + T + T + 'targetSkill.addQuery(\'category\', catId);' + NL;
                script += T + T + T + 'targetSkill.query();' + NL;
                script += NL;
                script += T + T + T + 'if (!targetSkill.next()) {' + NL;
                script += T + T + T + T + 'gs.warn(\'[Skills Hub] addSkillToCategories: No skill named "\' + skillName + \'" found in category \' + catId);' + NL;
                script += T + T + T + T + 'result.errors.push(\'Skill "\' + skillName + \'" not found in category \' + catId);' + NL;
                script += T + T + T + T + 'continue;' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'var targetSkillId = targetSkill.getUniqueValue();' + NL;
                script += NL;
                script += T + T + T + '// Check if user already has this skill' + NL;
                script += T + T + T + 'var existCheck = new GlideRecord(\'sys_user_has_skill\');' + NL;
                script += T + T + T + 'existCheck.addQuery(\'user\', userSysId);' + NL;
                script += T + T + T + 'existCheck.addQuery(\'skill\', targetSkillId);' + NL;
                script += T + T + T + 'existCheck.query();' + NL;
                script += NL;
                script += T + T + T + 'if (existCheck.hasNext()) {' + NL;
                script += T + T + T + T + 'gs.info(\'[Skills Hub] addSkillToCategories: User already has skill "\' + skillName + \'" in category \' + catId + \' - skipping\');' + NL;
                script += T + T + T + T + 'result.skipped++;' + NL;
                script += T + T + T + T + 'continue;' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + '// Create the sys_user_has_skill record' + NL;
                script += T + T + T + 'var newRec = new GlideRecord(\'sys_user_has_skill\');' + NL;
                script += T + T + T + 'newRec.initialize();' + NL;
                script += T + T + T + 'newRec.setValue(\'user\', userSysId);' + NL;
                script += T + T + T + 'newRec.setValue(\'skill\', targetSkillId);' + NL;
                script += T + T + T + 'var insertId = newRec.insert();' + NL;
                script += NL;
                script += T + T + T + 'if (insertId) {' + NL;
                script += T + T + T + T + 'gs.info(\'[Skills Hub] addSkillToCategories: Added skill "\' + skillName + \'" (category \' + catId + \') for user \' + userSysId);' + NL;
                script += T + T + T + T + 'result.added++;' + NL;
                script += T + T + T + '} else {' + NL;
                script += T + T + T + T + 'gs.error(\'[Skills Hub] addSkillToCategories: Failed to insert sys_user_has_skill for skill "\' + skillName + \'" in category \' + catId);' + NL;
                script += T + T + T + T + 'result.errors.push(\'Insert failed for skill "\' + skillName + \'" in category \' + catId);' + NL;
                script += T + T + T + '}' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'gs.info(\'[Skills Hub] addSkillToCategories complete: added=\' + result.added + \', skipped=\' + result.skipped + \', errors=\' + result.errors.length);' + NL;
                script += T + T + 'return result;' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- getUserSkillsGrouped -----
                script += T + '/**' + NL;
                script += T + ' * Get a user\'s skills grouped by skill name.' + NL;
                script += T + ' * @param {string} userSysId - sys_id of the user' + NL;
                script += T + ' * @returns {Array} Sorted array of { skill_name, entries: [{sys_id, category, level, endorsements}] }' + NL;
                script += T + ' */' + NL;
                script += T + 'getUserSkillsGrouped: function(userSysId) {' + NL;
                script += T + T + 'var groupMap = {};' + NL;
                script += T + T + 'var results = [];' + NL;
                script += NL;
                script += T + T + 'if (!userSysId) {' + NL;
                script += T + T + T + 'gs.warn(\'[Skills Hub] getUserSkillsGrouped: No userSysId provided\');' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
                script += T + T + 'gr.addQuery(\'user\', userSysId);' + NL;
                script += T + T + 'gr.orderBy(\'skill.name\');' + NL;
                script += T + T + 'gr.query();' + NL;
                script += NL;
                script += T + T + 'while (gr.next()) {' + NL;
                script += T + T + T + 'var sName = gr.getDisplayValue(\'skill\');' + NL;
                script += T + T + T + 'var category = gr.getDisplayValue(\'skill.category\');' + NL;
                script += T + T + T + 'var level = gr.getDisplayValue(\'skill_level\');' + NL;
                script += T + T + T + 'var endorsements = parseInt(gr.getValue(\'u_peer_endorsement_count\')) || 0;' + NL;
                script += NL;
                script += T + T + T + 'if (!groupMap[sName]) {' + NL;
                script += T + T + T + T + 'groupMap[sName] = {' + NL;
                script += T + T + T + T + T + 'skill_name: sName,' + NL;
                script += T + T + T + T + T + 'entries: []' + NL;
                script += T + T + T + T + '};' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'groupMap[sName].entries.push({' + NL;
                script += T + T + T + T + 'sys_id: gr.getUniqueValue(),' + NL;
                script += T + T + T + T + 'category: category,' + NL;
                script += T + T + T + T + 'level: level,' + NL;
                script += T + T + T + T + 'endorsements: endorsements' + NL;
                script += T + T + T + '});' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + '// Convert map to sorted array' + NL;
                script += T + T + 'var names = [];' + NL;
                script += T + T + 'for (var n in groupMap) {' + NL;
                script += T + T + T + 'if (groupMap.hasOwnProperty(n)) {' + NL;
                script += T + T + T + T + 'names.push(n);' + NL;
                script += T + T + T + '}' + NL;
                script += T + T + '}' + NL;
                script += T + T + 'names.sort();' + NL;
                script += NL;
                script += T + T + 'for (var j = 0; j < names.length; j++) {' + NL;
                script += T + T + T + 'results.push(groupMap[names[j]]);' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'return results;' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- type -----
                script += T + 'type: \'SkillsHubGrouping\'' + NL;
                script += '};' + NL;
        
                // ============================================================
                // 3. Create the Script Include record
                // ============================================================
                var si = new GlideRecord('sys_script_include');
                si.initialize();
                si.setValue('name', 'SkillsHubGrouping');
                si.setValue('api_name', 'global.SkillsHubGrouping');
                si.setValue('client_callable', false);
                si.setValue('active', true);
                si.setValue('access', 'public');
                si.setValue('description', 'Skills Hub - Cross-category skill grouping utility. Provides methods for querying skill category groups, adding skills across categories, and retrieving grouped user skills.');
                si.setValue('script', script);
        
                var siId = si.insert();
        
                if (siId) {
                    gs.info('[Skills Hub] Created SkillsHubGrouping Script Include (sys_id: ' + siId + ')');
                } else {
                    gs.error('[Skills Hub] FAILED to create SkillsHubGrouping Script Include');
                    return;
                }
        
                // ============================================================
                // 4. Summary
                // ============================================================
                gs.info('[Skills Hub] ===== SCRIPT 22 SUMMARY =====');
                gs.info('[Skills Hub] Script Include: SkillsHubGrouping');
                gs.info('[Skills Hub] API Name: global.SkillsHubGrouping');
                gs.info('[Skills Hub] sys_id: ' + siId);
                gs.info('[Skills Hub] Client Callable: false');
                gs.info('[Skills Hub] Methods: getGroupsForSkill, getSkillsInGroup, addSkillToCategories, getUserSkillsGrouped');
                gs.info('[Skills Hub] Script length: ' + script.length + ' chars');
                gs.info('[Skills Hub] =============================');
        
            } catch (e) {
                gs.error('[Skills Hub] Error in 22_create_skill_grouping_logic: ' + e.message);
            }

        _sectionResults.push({ section: 15, name: 'SKILL GROUPING LOGIC (22)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 15: SKILL GROUPING LOGIC (22) - COMPLETE ==========');
    } catch (_sectionErr15) {
        gs.error('[Skills Hub] SECTION 15 FATAL ERROR (SKILL GROUPING LOGIC (22)): ' + _sectionErr15.message);
        _sectionResults.push({ section: 15, name: 'SKILL GROUPING LOGIC (22)', status: 'ERROR: ' + _sectionErr15.message });
    }


    // ==================================================================
    // SECTION 16: NAV MODULES (24)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 16: NAV MODULES (24) ==========');
    try {
        try {
                var created = 0;
                var existed = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] ===== STARTING 24_create_nav_modules =====');
                gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        
                // ================================================================
                // 1. Find or create the Application Menu
                // ================================================================
                var menuId = '';
                var existingMenu = new GlideRecord('sys_app_application');
                existingMenu.addQuery('title', 'Skills Hub');
                existingMenu.query();
        
                if (existingMenu.next()) {
                    menuId = existingMenu.getUniqueValue();
                    gs.info('[Skills Hub] Application menu already exists: Skills Hub (sys_id: ' + menuId + ')');
                    existed++;
                } else {
                    var newMenu = new GlideRecord('sys_app_application');
                    newMenu.initialize();
                    newMenu.setValue('title', 'Skills Hub');
                    newMenu.setValue('hint', 'Manage your skills portfolio, find experts, and track team competencies');
                    newMenu.setValue('category', 'Custom Applications');
                    newMenu.setValue('active', true);
                    newMenu.setValue('order', 1000);
                    newMenu.setValue('device_type', 'browser');
                    menuId = newMenu.insert();
        
                    if (menuId) {
                        gs.info('[Skills Hub] Created application menu: Skills Hub (sys_id: ' + menuId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create application menu: Skills Hub');
                        errors++;
                        return;
                    }
                }
        
                // ================================================================
                // 2. Create navigation modules (4 required)
                // ================================================================
                var modules = [
                    {
                        title: 'My Profile',
                        order: 100,
                        link_type: 'URL',
                        args: '/sp?id=skills_hub&tab=profile'
                    },
                    {
                        title: 'Manager View',
                        order: 200,
                        link_type: 'URL',
                        args: '/sp?id=skills_hub&tab=manager'
                    },
                    {
                        title: 'Find Expert',
                        order: 300,
                        link_type: 'URL',
                        args: '/sp?id=skills_hub&tab=expert'
                    },
                    {
                        title: 'Leaderboard',
                        order: 400,
                        link_type: 'URL',
                        args: '/sp?id=skills_hub&tab=leaderboard'
                    }
                ];
        
                for (var i = 0; i < modules.length; i++) {
                    var mod = modules[i];
        
                    var existingMod = new GlideRecord('sys_app_module');
                    existingMod.addQuery('application', menuId);
                    existingMod.addQuery('title', mod.title);
                    existingMod.query();
        
                    if (existingMod.next()) {
                        gs.info('[Skills Hub] Module already exists: "' + mod.title + '" (sys_id: ' + existingMod.getUniqueValue() + ')');
                        existed++;
                    } else {
                        var newMod = new GlideRecord('sys_app_module');
                        newMod.initialize();
                        newMod.setValue('title', mod.title);
                        newMod.setValue('application', menuId);
                        newMod.setValue('order', mod.order);
                        newMod.setValue('link_type', mod.link_type);
                        newMod.setValue('arguments', mod.args);
                        newMod.setValue('active', true);
                        var modId = newMod.insert();
        
                        if (modId) {
                            gs.info('[Skills Hub] Created module: "' + mod.title + '" -> ' + mod.args + ' (sys_id: ' + modId + ')');
                            created++;
                        } else {
                            gs.error('[Skills Hub] FAILED to create module: "' + mod.title + '"');
                            errors++;
                        }
                    }
                }
        
                // ================================================================
                // 3. Create Service Portal page "skills_hub"
                // ================================================================
                gs.info('[Skills Hub] --- Creating Portal Page ---');
        
                var existingPage = new GlideRecord('sp_page');
                existingPage.addQuery('id', 'skills_hub');
                existingPage.query();
        
                if (existingPage.next()) {
                    gs.info('[Skills Hub] Portal page "skills_hub" already exists (sys_id: ' + existingPage.getUniqueValue() + ')');
                    existed++;
                } else {
                    var newPage = new GlideRecord('sp_page');
                    newPage.initialize();
                    newPage.setValue('id', 'skills_hub');
                    newPage.setValue('title', 'Skills Hub');
                    newPage.setValue('description', 'Central hub for managing skills, finding experts, and tracking team competencies');
                    var pageId = newPage.insert();
        
                    if (pageId) {
                        gs.info('[Skills Hub] Created portal page: skills_hub (sys_id: ' + pageId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create portal page');
                        errors++;
                    }
                }
        
                // ================================================================
                // Summary
                // ================================================================
                gs.info('[Skills Hub] ===== NAV MODULES SUMMARY =====');
                gs.info('[Skills Hub] Application Menu sys_id: ' + menuId);
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Already existed: ' + existed);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] ================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 24_create_nav_modules: ' + e.message);
            }

        _sectionResults.push({ section: 16, name: 'NAV MODULES (24)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 16: NAV MODULES (24) - COMPLETE ==========');
    } catch (_sectionErr16) {
        gs.error('[Skills Hub] SECTION 16 FATAL ERROR (NAV MODULES (24)): ' + _sectionErr16.message);
        _sectionResults.push({ section: 16, name: 'NAV MODULES (24)', status: 'ERROR: ' + _sectionErr16.message });
    }


    // ==================================================================
    // SECTION 17: TAB NAVIGATION WIDGET (25)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 17: TAB NAVIGATION WIDGET (25) ==========');
    try {
        try {
                gs.info('[Skills Hub] ===== STARTING 25_create_tab_navigation =====');
                gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        
                var WIDGET_ID = 'skills-hub-tabs';
                var WIDGET_NAME = 'Skills Hub - Tab Navigation';
        
                // ================================================================
                // 1. Idempotency check
                // ================================================================
                var existing = new GlideRecord('sp_widget');
                existing.addQuery('id', WIDGET_ID);
                existing.query();
        
                if (existing.next()) {
                    gs.info('[Skills Hub] Tab navigation widget already exists (sys_id: ' + existing.getUniqueValue() + ') - skipping creation');
                    gs.info('[Skills Hub] To recreate, delete the existing widget first.');
                    return;
                }
        
                // Also check by name
                var existingByName = new GlideRecord('sp_widget');
                existingByName.addQuery('name', WIDGET_NAME);
                existingByName.query();
        
                if (existingByName.next()) {
                    gs.info('[Skills Hub] Tab navigation widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + ') - skipping creation');
                    return;
                }
        
                // ================================================================
                // 2. Build Server Script
                //    Determines which tabs to show based on user role.
                //    Managers see "Manager View"; everyone sees Profile/Find Expert/Leaderboard.
                // ================================================================
                var serverScript = ''
                    + '(function() {\n'
                    + '    var userId = gs.getUserID();\n'
                    + '\n'
                    + '    // Check if user is a manager (has direct reports)\n'
                    + '    var isManager = false;\n'
                    + '    var reportGR = new GlideRecord("sys_user");\n'
                    + '    reportGR.addQuery("manager", userId);\n'
                    + '    reportGR.addQuery("active", true);\n'
                    + '    reportGR.setLimit(1);\n'
                    + '    reportGR.query();\n'
                    + '    if (reportGR.hasNext()) {\n'
                    + '        isManager = true;\n'
                    + '    }\n'
                    + '\n'
                    + '    // Build tab list\n'
                    + '    data.tabs = [];\n'
                    + '    data.tabs.push({ id: "profile", label: "My Profile", icon: "fa-user" });\n'
                    + '\n'
                    + '    if (isManager) {\n'
                    + '        data.tabs.push({ id: "manager", label: "Manager View", icon: "fa-users-cog" });\n'
                    + '    }\n'
                    + '\n'
                    + '    data.tabs.push({ id: "expert", label: "Find Expert", icon: "fa-search" });\n'
                    + '    data.tabs.push({ id: "leaderboard", label: "Leaderboard", icon: "fa-trophy" });\n'
                    + '\n'
                    + '    // Read tab from URL parameter\n'
                    + '    var urlTab = $sp.getParameter("tab") || "profile";\n'
                    + '    data.activeTab = urlTab;\n'
                    + '\n'
                    + '    // Mark correct tab active (validate that the tab exists for this user)\n'
                    + '    var validTab = false;\n'
                    + '    for (var i = 0; i < data.tabs.length; i++) {\n'
                    + '        if (data.tabs[i].id == urlTab) {\n'
                    + '            data.tabs[i].active = true;\n'
                    + '            validTab = true;\n'
                    + '        } else {\n'
                    + '            data.tabs[i].active = false;\n'
                    + '        }\n'
                    + '    }\n'
                    + '\n'
                    + '    // Fallback to profile if requested tab is not available\n'
                    + '    if (!validTab && data.tabs.length > 0) {\n'
                    + '        data.tabs[0].active = true;\n'
                    + '        data.activeTab = data.tabs[0].id;\n'
                    + '    }\n'
                    + '\n'
                    + '    data.isManager = isManager;\n'
                    + '})();\n';
        
                // ================================================================
                // 3. Build Client Script
                //    Handles tab click and broadcasts event to load appropriate content.
                // ================================================================
                var clientScript = ''
                    + 'function($rootScope) {\n'
                    + '    /* jshint esversion: 5 */\n'
                    + '    var c = this;\n'
                    + '\n'
                    + '    c.switchTab = function(tabId) {\n'
                    + '        for (var i = 0; i < c.data.tabs.length; i++) {\n'
                    + '            c.data.tabs[i].active = (c.data.tabs[i].id === tabId);\n'
                    + '        }\n'
                    + '        c.data.activeTab = tabId;\n'
                    + '\n'
                    + '        // Update URL without page reload\n'
                    + '        var url = \'?id=skills_hub&tab=\' + tabId;\n'
                    + '        window.history.replaceState({}, \'\', url);\n'
                    + '\n'
                    + '        // Broadcast tab change event for content widgets\n'
                    + '        $rootScope.$broadcast(\'skills-hub-tab-change\', tabId);\n'
                    + '    };\n'
                    + '}\n';
        
                // ================================================================
                // 4. Build Template
                //    Horizontal tab bar with icons.
                // ================================================================
                var template = ''
                    + '<div class="skills-hub-tabs">\n'
                    + '    <div class="tab-header">\n'
                    + '        <h2 class="page-title">\n'
                    + '            <i class="fa fa-cubes"></i> Skills Hub\n'
                    + '        </h2>\n'
                    + '    </div>\n'
                    + '    <ul class="nav nav-tabs skills-tabs">\n'
                    + '        <li ng-repeat="tab in c.data.tabs" ng-class="{active: tab.active}">\n'
                    + '            <a href="javascript:void(0)" ng-click="c.switchTab(tab.id)">\n'
                    + '                <i class="fa" ng-class="tab.icon"></i>\n'
                    + '                <span class="tab-label">{{tab.label}}</span>\n'
                    + '            </a>\n'
                    + '        </li>\n'
                    + '    </ul>\n'
                    + '</div>\n';
        
                // ================================================================
                // 5. Build CSS
                //    Tab styling matching ServiceNow portal design patterns,
                //    active tab indicator, and responsive layout.
                // ================================================================
                var css = ''
                    + '/* Skills Hub - Tab Navigation */\n'
                    + '\n'
                    + '.skills-hub-tabs {\n'
                    + '    margin-bottom: 0;\n'
                    + '    padding: 20px 20px 0 20px;\n'
                    + '    background-color: #fff;\n'
                    + '}\n'
                    + '\n'
                    + '/* Page Title */\n'
                    + '.skills-hub-tabs .page-title {\n'
                    + '    font-size: 28px;\n'
                    + '    font-weight: 600;\n'
                    + '    color: #333;\n'
                    + '    margin: 0 0 20px 0;\n'
                    + '    padding: 0;\n'
                    + '}\n'
                    + '\n'
                    + '.skills-hub-tabs .page-title i {\n'
                    + '    color: #0072CE;\n'
                    + '    margin-right: 8px;\n'
                    + '}\n'
                    + '\n'
                    + '/* Tab Bar */\n'
                    + '.skills-hub-tabs .skills-tabs {\n'
                    + '    border-bottom: 2px solid #0072CE;\n'
                    + '    margin-bottom: 0;\n'
                    + '}\n'
                    + '\n'
                    + '.skills-hub-tabs .skills-tabs > li {\n'
                    + '    margin-bottom: -2px;\n'
                    + '}\n'
                    + '\n'
                    + '.skills-hub-tabs .skills-tabs > li > a {\n'
                    + '    color: #555;\n'
                    + '    font-size: 14px;\n'
                    + '    font-weight: 500;\n'
                    + '    padding: 10px 20px;\n'
                    + '    border: 2px solid transparent;\n'
                    + '    border-bottom: none;\n'
                    + '    border-radius: 4px 4px 0 0;\n'
                    + '    background-color: transparent;\n'
                    + '    transition: color 0.2s, background-color 0.2s, border-color 0.2s;\n'
                    + '}\n'
                    + '\n'
                    + '.skills-hub-tabs .skills-tabs > li > a:hover,\n'
                    + '.skills-hub-tabs .skills-tabs > li > a:focus {\n'
                    + '    color: #0072CE;\n'
                    + '    background-color: #f0f7ff;\n'
                    + '    border-color: #ddd #ddd transparent;\n'
                    + '}\n'
                    + '\n'
                    + '.skills-hub-tabs .skills-tabs > li > a i {\n'
                    + '    margin-right: 6px;\n'
                    + '    font-size: 13px;\n'
                    + '}\n'
                    + '\n'
                    + '/* Active Tab Indicator */\n'
                    + '.skills-hub-tabs .skills-tabs > li.active > a,\n'
                    + '.skills-hub-tabs .skills-tabs > li.active > a:hover,\n'
                    + '.skills-hub-tabs .skills-tabs > li.active > a:focus {\n'
                    + '    color: #0072CE;\n'
                    + '    font-weight: 600;\n'
                    + '    background-color: #fff;\n'
                    + '    border: 2px solid #0072CE;\n'
                    + '    border-bottom-color: #fff;\n'
                    + '    cursor: default;\n'
                    + '}\n'
                    + '\n'
                    + '/* Responsive - Tablet */\n'
                    + '@media (max-width: 767px) {\n'
                    + '    .skills-hub-tabs .page-title {\n'
                    + '        font-size: 22px;\n'
                    + '        margin-bottom: 15px;\n'
                    + '    }\n'
                    + '\n'
                    + '    .skills-hub-tabs .skills-tabs > li > a {\n'
                    + '        font-size: 12px;\n'
                    + '        padding: 8px 12px;\n'
                    + '    }\n'
                    + '\n'
                    + '    .skills-hub-tabs .skills-tabs > li > a i {\n'
                    + '        display: block;\n'
                    + '        text-align: center;\n'
                    + '        margin-right: 0;\n'
                    + '        margin-bottom: 4px;\n'
                    + '        font-size: 16px;\n'
                    + '    }\n'
                    + '}\n'
                    + '\n'
                    + '/* Responsive - Mobile */\n'
                    + '@media (max-width: 480px) {\n'
                    + '    .skills-hub-tabs .skills-tabs {\n'
                    + '        display: flex;\n'
                    + '        flex-wrap: nowrap;\n'
                    + '        overflow-x: auto;\n'
                    + '        -webkit-overflow-scrolling: touch;\n'
                    + '    }\n'
                    + '\n'
                    + '    .skills-hub-tabs .skills-tabs > li {\n'
                    + '        flex-shrink: 0;\n'
                    + '    }\n'
                    + '\n'
                    + '    .skills-hub-tabs .skills-tabs > li > a .tab-label {\n'
                    + '        display: none;\n'
                    + '    }\n'
                    + '\n'
                    + '    .skills-hub-tabs .skills-tabs > li > a i {\n'
                    + '        font-size: 18px;\n'
                    + '        margin-right: 0;\n'
                    + '    }\n'
                    + '}\n';
        
                // ================================================================
                // 6. Create the widget record
                // ================================================================
                var newWidget = new GlideRecord('sp_widget');
                newWidget.initialize();
                newWidget.setValue('id', WIDGET_ID);
                newWidget.setValue('name', WIDGET_NAME);
                newWidget.setValue('script', serverScript);
                newWidget.setValue('client_script', clientScript);
                newWidget.setValue('template', template);
                newWidget.setValue('css', css);
                newWidget.setValue('internal', false);
                newWidget.setValue('data_table', '');
                var widgetSysId = newWidget.insert();
        
                if (widgetSysId) {
                    gs.info('[Skills Hub] Created tab navigation widget: ' + WIDGET_NAME + ' (sys_id: ' + widgetSysId + ')');
                    gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
                } else {
                    gs.error('[Skills Hub] FAILED to create tab navigation widget');
                }
        
                // ================================================================
                // Summary
                // ================================================================
                gs.info('[Skills Hub] ===== SCRIPT 25 SUMMARY =====');
                gs.info('[Skills Hub] Widget sys_id: ' + (widgetSysId || 'FAILED'));
                gs.info('[Skills Hub] Features:');
                gs.info('[Skills Hub]   - Role-based Manager View tab (only for users with direct reports)');
                gs.info('[Skills Hub]   - Tab icons: fa-user, fa-users-cog, fa-search, fa-trophy');
                gs.info('[Skills Hub]   - $rootScope broadcast on tab change');
                gs.info('[Skills Hub]   - Responsive CSS with mobile scroll');
                gs.info('[Skills Hub] =============================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 25_create_tab_navigation: ' + e.message);
            }

        _sectionResults.push({ section: 17, name: 'TAB NAVIGATION WIDGET (25)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 17: TAB NAVIGATION WIDGET (25) - COMPLETE ==========');
    } catch (_sectionErr17) {
        gs.error('[Skills Hub] SECTION 17 FATAL ERROR (TAB NAVIGATION WIDGET (25)): ' + _sectionErr17.message);
        _sectionResults.push({ section: 17, name: 'TAB NAVIGATION WIDGET (25)', status: 'ERROR: ' + _sectionErr17.message });
    }


    // ==================================================================
    // SECTION 18: DEMAND TABLES (28)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 18: DEMAND TABLES (28) ==========');
    try {
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

        _sectionResults.push({ section: 18, name: 'DEMAND TABLES (28)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 18: DEMAND TABLES (28) - COMPLETE ==========');
    } catch (_sectionErr18) {
        gs.error('[Skills Hub] SECTION 18 FATAL ERROR (DEMAND TABLES (28)): ' + _sectionErr18.message);
        _sectionResults.push({ section: 18, name: 'DEMAND TABLES (28)', status: 'ERROR: ' + _sectionErr18.message });
    }


    // ==================================================================
    // SECTION 19: PA INDICATORS (29)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 19: PA INDICATORS (29) ==========');
    try {
        try {
                var created = 0;
                var skipped = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] === Creating PA Indicators & Breakdowns ===');
        
                // ================================================================
                // Pre-flight: Check if PA tables exist
                // ================================================================
                function paTableExists(tableName) {
                    var tbl = new GlideRecord('sys_db_object');
                    tbl.addQuery('name', tableName);
                    tbl.query();
                    return tbl.hasNext();
                }
        
                if (!paTableExists('pa_indicators')) {
                    gs.warn('[Skills Hub] PA table "pa_indicators" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping PA indicator creation.');
                    gs.warn('[Skills Hub] To resolve: Activate the "Performance Analytics - Content Pack" plugin, then re-run this script.');
                    return;
                }
        
                if (!paTableExists('pa_breakdowns')) {
                    gs.warn('[Skills Hub] PA table "pa_breakdowns" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping PA breakdown creation.');
                    return;
                }
        
                // ================================================================
                // Helper: Create a PA indicator if it does not already exist
                // ================================================================
                function createIndicator(config) {
                    try {
                        var gr = new GlideRecord('pa_indicators');
                        gr.addQuery('name', config.name);
                        gr.query();
                        if (gr.next()) {
                            gs.info('[Skills Hub] PA Indicator already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                            skipped++;
                            return gr.getUniqueValue();
                        }
        
                        gr.initialize();
                        gr.setValue('name', config.name);
                        gr.setValue('description', config.description || '');
        
                        // Indicator type: 1 = collect, 2 = derive/formula, 3 = manual
                        if (config.type !== undefined) {
                            gr.setValue('type', config.type);
                        }
        
                        if (config.cube) {
                            gr.setValue('cube', config.cube);
                        }
        
                        if (config.fact_table) {
                            gr.setValue('fact_table', config.fact_table);
                        }
        
                        if (config.aggregate) {
                            gr.setValue('aggregate', config.aggregate);
                        }
        
                        if (config.conditions) {
                            gr.setValue('conditions', config.conditions);
                        }
        
                        if (config.frequency) {
                            gr.setValue('frequency', config.frequency);
                        }
        
                        if (config.active !== undefined) {
                            gr.setValue('active', config.active);
                        } else {
                            gr.setValue('active', true);
                        }
        
                        if (config.direction) {
                            gr.setValue('direction', config.direction);
                        }
        
                        if (config.formula) {
                            gr.setValue('formula', config.formula);
                        }
        
                        if (config.script) {
                            gr.setValue('script', config.script);
                        }
        
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created PA Indicator: "' + config.name + '" (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] FAILED to create PA Indicator: "' + config.name + '"');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating indicator "' + config.name + '": ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                // ================================================================
                // Helper: Create a PA breakdown if it does not already exist
                // ================================================================
                function createBreakdown(config) {
                    try {
                        var gr = new GlideRecord('pa_breakdowns');
                        gr.addQuery('name', config.name);
                        gr.query();
                        if (gr.next()) {
                            gs.info('[Skills Hub] PA Breakdown already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                            skipped++;
                            return gr.getUniqueValue();
                        }
        
                        gr.initialize();
                        gr.setValue('name', config.name);
                        gr.setValue('description', config.description || '');
        
                        if (config.fact_table) {
                            gr.setValue('fact_table', config.fact_table);
                        }
        
                        if (config.dimension) {
                            gr.setValue('dimension', config.dimension);
                        }
        
                        if (config.active !== undefined) {
                            gr.setValue('active', config.active);
                        } else {
                            gr.setValue('active', true);
                        }
        
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created PA Breakdown: "' + config.name + '" (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] FAILED to create PA Breakdown: "' + config.name + '"');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating breakdown "' + config.name + '": ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                // ================================================================
                // Helper: Link an indicator to a breakdown (pa_indicator_breakdowns)
                // ================================================================
                function linkIndicatorBreakdown(indicatorId, breakdownId, indicatorName, breakdownName) {
                    if (!indicatorId || !breakdownId) {
                        gs.warn('[Skills Hub] Skipping breakdown link - missing indicator or breakdown ID for "' + indicatorName + '" / "' + breakdownName + '"');
                        return null;
                    }
        
                    try {
                        var tableName = 'pa_indicator_breakdowns';
                        if (!paTableExists(tableName)) {
                            gs.warn('[Skills Hub] Table "' + tableName + '" not found. Skipping indicator-breakdown link.');
                            return null;
                        }
        
                        var gr = new GlideRecord(tableName);
                        gr.addQuery('indicator', indicatorId);
                        gr.addQuery('breakdown', breakdownId);
                        gr.query();
                        if (gr.next()) {
                            gs.info('[Skills Hub] Indicator-breakdown link already exists: "' + indicatorName + '" <-> "' + breakdownName + '"');
                            skipped++;
                            return gr.getUniqueValue();
                        }
        
                        gr.initialize();
                        gr.setValue('indicator', indicatorId);
                        gr.setValue('breakdown', breakdownId);
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Linked indicator "' + indicatorName + '" to breakdown "' + breakdownName + '" (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] FAILED to link indicator "' + indicatorName + '" to breakdown "' + breakdownName + '"');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error linking indicator-breakdown: ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                // ================================================================
                // Create Breakdowns
                // ================================================================
                gs.info('[Skills Hub] --- Creating PA Breakdowns ---');
        
                var bdDeptId = createBreakdown({
                    name: 'Skills Hub - By Department',
                    description: 'Break down Skills Hub indicators by user department',
                    fact_table: 'sys_user_has_skill',
                    dimension: 'user.department'
                });
        
                var bdLevelId = createBreakdown({
                    name: 'Skills Hub - By Proficiency Level',
                    description: 'Break down Skills Hub indicators by skill proficiency level',
                    fact_table: 'sys_user_has_skill',
                    dimension: 'skill_level'
                });
        
                // ================================================================
                // Indicator 1: Skills Supply
                // ================================================================
                gs.info('[Skills Hub] --- Creating PA Indicators ---');
        
                var indSupplyId = createIndicator({
                    name: 'Skills Hub - Skills Supply',
                    description: 'Count of active user skill records. Measures total skills supply across the organization.',
                    type: 1,
                    fact_table: 'sys_user_has_skill',
                    aggregate: 'COUNT',
                    conditions: 'user.active=true',
                    frequency: 'daily',
                    direction: 'maximize',
                    active: true
                });
        
                // ================================================================
                // Indicator 2: Endorsement Velocity
                // ================================================================
                var indEndorsementId = createIndicator({
                    name: 'Skills Hub - Endorsement Velocity',
                    description: 'Count of peer endorsements. Tracks endorsement activity velocity across the organization.',
                    type: 1,
                    fact_table: 'u_m2m_skill_endorsement',
                    aggregate: 'COUNT',
                    frequency: 'daily',
                    direction: 'maximize',
                    active: true
                });
        
                // ================================================================
                // Indicator 3: Validation Rate
                // ================================================================
                var indValidationId = createIndicator({
                    name: 'Skills Hub - Validation Rate',
                    description: 'Count of manager-validated skills for active users. Measures validation coverage.',
                    type: 1,
                    fact_table: 'sys_user_has_skill',
                    aggregate: 'COUNT',
                    conditions: 'u_validation_status=validated^user.active=true',
                    frequency: 'daily',
                    direction: 'maximize',
                    active: true
                });
        
                // ================================================================
                // Indicator 4: Skill Growth
                // ================================================================
                var indGrowthId = createIndicator({
                    name: 'Skills Hub - Skill Growth',
                    description: 'Count of user skill records for active users. Tracks growth of skill assignments over time.',
                    type: 1,
                    fact_table: 'sys_user_has_skill',
                    aggregate: 'COUNT',
                    conditions: 'user.active=true',
                    frequency: 'daily',
                    direction: 'maximize',
                    active: true
                });
        
                // ================================================================
                // Indicator 5: Skills Demand
                // ================================================================
                var indDemandId = createIndicator({
                    name: 'Skills Hub - Skills Demand',
                    description: 'Count of active story-skill assignments. Measures demand for skills from project work.',
                    type: 1,
                    fact_table: 'u_story_skill_assignment',
                    aggregate: 'COUNT',
                    conditions: 'u_active=true',
                    frequency: 'daily',
                    direction: 'minimize',
                    active: true
                });
        
                // ================================================================
                // Indicator 6: Capacity Utilization (Scripted)
                // ================================================================
                var capacityScript = '(function() {\n' +
                    '    try {\n' +
                    '        // Calculate supply: count of active user skills\n' +
                    '        var supplyGA = new GlideAggregate(\'sys_user_has_skill\');\n' +
                    '        supplyGA.addQuery(\'user.active\', true);\n' +
                    '        supplyGA.addAggregate(\'COUNT\');\n' +
                    '        supplyGA.query();\n' +
                    '        var supply = 0;\n' +
                    '        if (supplyGA.next()) {\n' +
                    '            supply = parseInt(supplyGA.getAggregate(\'COUNT\')) || 0;\n' +
                    '        }\n' +
                    '        \n' +
                    '        // Calculate demand: count of active story-skill assignments\n' +
                    '        var demandGA = new GlideAggregate(\'u_story_skill_assignment\');\n' +
                    '        demandGA.addQuery(\'u_active\', true);\n' +
                    '        demandGA.addAggregate(\'COUNT\');\n' +
                    '        demandGA.query();\n' +
                    '        var demand = 0;\n' +
                    '        if (demandGA.next()) {\n' +
                    '            demand = parseInt(demandGA.getAggregate(\'COUNT\')) || 0;\n' +
                    '        }\n' +
                    '        \n' +
                    '        // Capacity utilization = (supply / demand) * 100, capped at 100\n' +
                    '        var utilization = 0;\n' +
                    '        if (demand > 0) {\n' +
                    '            utilization = Math.round((supply / demand) * 100);\n' +
                    '        } else if (supply > 0) {\n' +
                    '            utilization = 100; // Supply exists but no demand\n' +
                    '        }\n' +
                    '        \n' +
                    '        return utilization;\n' +
                    '    } catch (e) {\n' +
                    '        gs.error(\'[Skills Hub] Capacity Utilization script error: \' + e.message);\n' +
                    '        return 0;\n' +
                    '    }\n' +
                    '})();';
        
                var indCapacityId = createIndicator({
                    name: 'Skills Hub - Capacity Utilization',
                    description: 'Ratio of skills supply to demand expressed as a percentage. Supply / Demand * 100. Scripted indicator computing real-time capacity utilization.',
                    type: 2,
                    frequency: 'daily',
                    direction: 'maximize',
                    active: true,
                    script: capacityScript
                });
        
                // ================================================================
                // Link Indicators to Breakdowns
                // ================================================================
                gs.info('[Skills Hub] --- Linking Indicators to Breakdowns ---');
        
                // Skills Supply - both breakdowns
                linkIndicatorBreakdown(indSupplyId, bdDeptId, 'Skills Supply', 'By Department');
                linkIndicatorBreakdown(indSupplyId, bdLevelId, 'Skills Supply', 'By Proficiency Level');
        
                // Endorsement Velocity - department breakdown
                linkIndicatorBreakdown(indEndorsementId, bdDeptId, 'Endorsement Velocity', 'By Department');
        
                // Validation Rate - both breakdowns
                linkIndicatorBreakdown(indValidationId, bdDeptId, 'Validation Rate', 'By Department');
                linkIndicatorBreakdown(indValidationId, bdLevelId, 'Validation Rate', 'By Proficiency Level');
        
                // Skill Growth - both breakdowns
                linkIndicatorBreakdown(indGrowthId, bdDeptId, 'Skill Growth', 'By Department');
                linkIndicatorBreakdown(indGrowthId, bdLevelId, 'Skill Growth', 'By Proficiency Level');
        
                // Skills Demand - department breakdown
                linkIndicatorBreakdown(indDemandId, bdDeptId, 'Skills Demand', 'By Department');
        
                // Capacity Utilization - department breakdown
                linkIndicatorBreakdown(indCapacityId, bdDeptId, 'Capacity Utilization', 'By Department');
        
                // ================================================================
                // Summary
                // ================================================================
                gs.info('[Skills Hub] ===== PA INDICATORS & BREAKDOWNS SUMMARY =====');
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] ===============================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 29_create_pa_indicators: ' + e.message);
            }

        _sectionResults.push({ section: 19, name: 'PA INDICATORS (29)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 19: PA INDICATORS (29) - COMPLETE ==========');
    } catch (_sectionErr19) {
        gs.error('[Skills Hub] SECTION 19 FATAL ERROR (PA INDICATORS (29)): ' + _sectionErr19.message);
        _sectionResults.push({ section: 19, name: 'PA INDICATORS (29)', status: 'ERROR: ' + _sectionErr19.message });
    }


    // ==================================================================
    // SECTION 20: PA DASHBOARD (30)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 20: PA DASHBOARD (30) ==========');
    try {
        try {
                var created = 0;
                var skipped = 0;
                var errors = 0;
        
                gs.info('[Skills Hub] === Creating PA Dashboard ===');
        
                // ================================================================
                // Pre-flight: Check if PA tables exist
                // ================================================================
                function paTableExists(tableName) {
                    var tbl = new GlideRecord('sys_db_object');
                    tbl.addQuery('name', tableName);
                    tbl.query();
                    return tbl.hasNext();
                }
        
                if (!paTableExists('pa_dashboards')) {
                    gs.warn('[Skills Hub] PA table "pa_dashboards" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping dashboard creation.');
                    gs.warn('[Skills Hub] To resolve: Activate the "Performance Analytics - Content Pack" plugin, then re-run this script.');
                    return;
                }
        
                // Determine which tab table is available
                // Newer instances use pa_m2m_dashboard_tabs, older may use pa_dashboard_tabs
                var tabTableName = '';
                if (paTableExists('pa_m2m_dashboard_tabs')) {
                    tabTableName = 'pa_m2m_dashboard_tabs';
                } else if (paTableExists('pa_dashboard_tabs')) {
                    tabTableName = 'pa_dashboard_tabs';
                } else {
                    gs.warn('[Skills Hub] Neither "pa_m2m_dashboard_tabs" nor "pa_dashboard_tabs" found. Cannot create dashboard tabs.');
                    gs.warn('[Skills Hub] Dashboard record will be created but tabs/widgets may need manual configuration.');
                }
        
                var widgetTableName = '';
                if (paTableExists('pa_widgets')) {
                    widgetTableName = 'pa_widgets';
                } else {
                    gs.warn('[Skills Hub] PA table "pa_widgets" not found. Widgets will not be created.');
                }
        
                // ================================================================
                // Helper: Look up a PA indicator sys_id by name
                // ================================================================
                function getIndicatorId(indicatorName) {
                    var gr = new GlideRecord('pa_indicators');
                    gr.addQuery('name', indicatorName);
                    gr.query();
                    if (gr.next()) {
                        return gr.getUniqueValue();
                    }
                    gs.warn('[Skills Hub] PA Indicator not found: "' + indicatorName + '" - was 29_create_pa_indicators.js run first?');
                    return null;
                }
        
                // ================================================================
                // 1. Create the Dashboard
                // ================================================================
                gs.info('[Skills Hub] --- Creating PA Dashboard ---');
        
                var dashboardId = '';
                var dashGr = new GlideRecord('pa_dashboards');
                dashGr.addQuery('name', 'Skills Hub - Analytics Dashboard');
                dashGr.query();
        
                if (dashGr.next()) {
                    dashboardId = dashGr.getUniqueValue();
                    gs.info('[Skills Hub] PA Dashboard already exists: "Skills Hub - Analytics Dashboard" (' + dashboardId + ')');
                    skipped++;
                } else {
                    dashGr.initialize();
                    dashGr.setValue('name', 'Skills Hub - Analytics Dashboard');
                    dashGr.setValue('description', 'Skills Hub analytics dashboard providing visibility into skills supply, demand, endorsement activity, validation coverage, and capacity utilization across the organization.');
                    dashGr.setValue('active', true);
                    dashboardId = dashGr.insert();
        
                    if (dashboardId) {
                        gs.info('[Skills Hub] Created PA Dashboard: "Skills Hub - Analytics Dashboard" (' + dashboardId + ')');
                        created++;
                    } else {
                        gs.error('[Skills Hub] FAILED to create PA Dashboard: "Skills Hub - Analytics Dashboard"');
                        errors++;
                    }
                }
        
                if (!dashboardId) {
                    gs.error('[Skills Hub] Cannot proceed without dashboard. Aborting tab and widget creation.');
                    return;
                }
        
                // ================================================================
                // 2. Create Dashboard Tabs
                // ================================================================
                var tabIds = {};
        
                function createTab(tabName, tabOrder) {
                    if (!tabTableName) {
                        gs.warn('[Skills Hub] No tab table available. Skipping tab: "' + tabName + '"');
                        return null;
                    }
        
                    try {
                        var gr = new GlideRecord(tabTableName);
                        gr.addQuery('dashboard', dashboardId);
                        gr.addQuery('tab_title', tabName);
                        gr.query();
        
                        if (gr.next()) {
                            gs.info('[Skills Hub] Dashboard tab already exists: "' + tabName + '" (' + gr.getUniqueValue() + ')');
                            skipped++;
                            return gr.getUniqueValue();
                        }
        
                        gr.initialize();
                        gr.setValue('dashboard', dashboardId);
                        gr.setValue('tab_title', tabName);
                        gr.setValue('order', tabOrder);
                        gr.setValue('active', true);
                        var id = gr.insert();
        
                        if (id) {
                            gs.info('[Skills Hub] Created dashboard tab: "' + tabName + '" (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] FAILED to create dashboard tab: "' + tabName + '"');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating tab "' + tabName + '": ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                gs.info('[Skills Hub] --- Creating Dashboard Tabs ---');
        
                tabIds.overview = createTab('Overview', 100);
                tabIds.demand = createTab('Demand Analysis', 200);
                tabIds.capacity = createTab('Capacity', 300);
        
                // ================================================================
                // 3. Create Widgets
                // ================================================================
                function createWidget(config) {
                    if (!widgetTableName) {
                        gs.warn('[Skills Hub] No widget table available. Skipping widget: "' + config.name + '"');
                        return null;
                    }
        
                    try {
                        var gr = new GlideRecord(widgetTableName);
                        gr.addQuery('name', config.name);
                        gr.query();
        
                        if (gr.next()) {
                            gs.info('[Skills Hub] PA Widget already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                            skipped++;
                            return gr.getUniqueValue();
                        }
        
                        gr.initialize();
                        gr.setValue('name', config.name);
        
                        if (config.indicator) {
                            gr.setValue('indicator', config.indicator);
                        }
        
                        if (config.visualization) {
                            gr.setValue('visualization', config.visualization);
                        }
        
                        if (config.type) {
                            gr.setValue('type', config.type);
                        }
        
                        if (config.tab) {
                            gr.setValue('tab', config.tab);
                        }
        
                        if (config.order !== undefined) {
                            gr.setValue('order', config.order);
                        }
        
                        if (config.active !== undefined) {
                            gr.setValue('active', config.active);
                        } else {
                            gr.setValue('active', true);
                        }
        
                        if (config.description) {
                            gr.setValue('description', config.description);
                        }
        
                        var id = gr.insert();
                        if (id) {
                            gs.info('[Skills Hub] Created PA Widget: "' + config.name + '" (' + id + ')');
                            created++;
                            return id;
                        } else {
                            gs.error('[Skills Hub] FAILED to create PA Widget: "' + config.name + '"');
                            errors++;
                            return null;
                        }
                    } catch (e) {
                        gs.error('[Skills Hub] Error creating widget "' + config.name + '": ' + e.message);
                        errors++;
                        return null;
                    }
                }
        
                // Look up all indicator sys_ids
                gs.info('[Skills Hub] --- Looking up PA Indicator sys_ids ---');
        
                var indSupplyId = getIndicatorId('Skills Hub - Skills Supply');
                var indEndorsementId = getIndicatorId('Skills Hub - Endorsement Velocity');
                var indValidationId = getIndicatorId('Skills Hub - Validation Rate');
                var indGrowthId = getIndicatorId('Skills Hub - Skill Growth');
                var indDemandId = getIndicatorId('Skills Hub - Skills Demand');
                var indCapacityId = getIndicatorId('Skills Hub - Capacity Utilization');
        
                gs.info('[Skills Hub] --- Creating Dashboard Widgets ---');
        
                // -- Overview Tab Widgets --
                createWidget({
                    name: 'Skills Hub - Skills Supply Overview',
                    indicator: indSupplyId,
                    visualization: 'bar',
                    tab: tabIds.overview,
                    order: 100,
                    description: 'Bar chart showing total skills supply (count of active user skill records)'
                });
        
                createWidget({
                    name: 'Skills Hub - Endorsement Velocity Overview',
                    indicator: indEndorsementId,
                    visualization: 'line',
                    tab: tabIds.overview,
                    order: 200,
                    description: 'Line chart tracking endorsement activity velocity over time'
                });
        
                createWidget({
                    name: 'Skills Hub - Validation Rate Overview',
                    indicator: indValidationId,
                    visualization: 'gauge',
                    tab: tabIds.overview,
                    order: 300,
                    description: 'Gauge showing percentage of skills validated by managers'
                });
        
                // -- Demand Analysis Tab Widgets --
                createWidget({
                    name: 'Skills Hub - Skills Demand Chart',
                    indicator: indDemandId,
                    visualization: 'bar',
                    tab: tabIds.demand,
                    order: 100,
                    description: 'Bar chart showing skills demand from story-skill assignments'
                });
        
                createWidget({
                    name: 'Skills Hub - Skill Growth Trend',
                    indicator: indGrowthId,
                    visualization: 'line',
                    tab: tabIds.demand,
                    order: 200,
                    description: 'Line chart tracking new skill assignments over time'
                });
        
                // -- Capacity Tab Widgets --
                createWidget({
                    name: 'Skills Hub - Capacity Utilization Gauge',
                    indicator: indCapacityId,
                    visualization: 'gauge',
                    tab: tabIds.capacity,
                    order: 100,
                    description: 'Gauge showing overall capacity utilization ratio (supply / demand)'
                });
        
                createWidget({
                    name: 'Skills Hub - Gap Analysis',
                    indicator: indDemandId,
                    visualization: 'list',
                    tab: tabIds.capacity,
                    order: 200,
                    description: 'Table/list view showing skills where demand exceeds supply, ranked by gap severity'
                });
        
                // ================================================================
                // Summary
                // ================================================================
                gs.info('[Skills Hub] ===== PA DASHBOARD CREATION SUMMARY =====');
                gs.info('[Skills Hub] Dashboard: Skills Hub - Analytics Dashboard (' + dashboardId + ')');
                gs.info('[Skills Hub] Tab table used: ' + (tabTableName || 'NONE'));
                gs.info('[Skills Hub] Widget table used: ' + (widgetTableName || 'NONE'));
                gs.info('[Skills Hub] Tabs: Overview (' + (tabIds.overview || 'N/A') + '), Demand Analysis (' + (tabIds.demand || 'N/A') + '), Capacity (' + (tabIds.capacity || 'N/A') + ')');
                gs.info('[Skills Hub] Created: ' + created);
                gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
                gs.info('[Skills Hub] Errors: ' + errors);
                gs.info('[Skills Hub] ============================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 30_create_pa_dashboard: ' + e.message);
            }

        _sectionResults.push({ section: 20, name: 'PA DASHBOARD (30)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 20: PA DASHBOARD (30) - COMPLETE ==========');
    } catch (_sectionErr20) {
        gs.error('[Skills Hub] SECTION 20 FATAL ERROR (PA DASHBOARD (30)): ' + _sectionErr20.message);
        _sectionResults.push({ section: 20, name: 'PA DASHBOARD (30)', status: 'ERROR: ' + _sectionErr20.message });
    }


    // ==================================================================
    // SECTION 21: GAP ANALYSIS WIDGET (31)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 21: GAP ANALYSIS WIDGET (31) ==========');
    try {
        try {
                gs.info('[Skills Hub] ===== STARTING GAP ANALYSIS WIDGET CREATION (Script 31) =====');
        
                var WIDGET_ID = 'skills-hub-gap-analysis';
                var WIDGET_NAME = 'Skills Hub - Gap Analysis';
        
                // ================================================================
                // 1. Idempotency check
                // ================================================================
                var existing = new GlideRecord('sp_widget');
                existing.addQuery('id', WIDGET_ID);
                existing.query();
        
                if (existing.next()) {
                    gs.info('[Skills Hub] Gap Analysis widget already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // Also check by name
                var existingByName = new GlideRecord('sp_widget');
                existingByName.addQuery('name', WIDGET_NAME);
                existingByName.query();
        
                if (existingByName.next()) {
                    gs.info('[Skills Hub] Gap Analysis widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // ================================================================
                // 2. Build SERVER SCRIPT
                // ================================================================
                var NL = '\n';
                var serverScript = '';
                serverScript += '(function() {' + NL;
                serverScript += '    data.gaps = [];' + NL;
                serverScript += '    data.summary = { totalSkills: 0, criticalGaps: 0, warnings: 0, balanced: 0 };' + NL;
                serverScript += '' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    // 1. Calculate SUPPLY: count of users per skill at each proficiency level' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    var supplyMap = {};' + NL;
                serverScript += '' + NL;
                serverScript += '    var sg = new GlideRecord("sys_user_has_skill");' + NL;
                serverScript += '    sg.addQuery("user.active", true);' + NL;
                serverScript += '    sg.query();' + NL;
                serverScript += '    while (sg.next()) {' + NL;
                serverScript += '        var skillName = sg.skill.name.toString();' + NL;
                serverScript += '        if (!skillName) continue;' + NL;
                serverScript += '        if (!supplyMap[skillName]) {' + NL;
                serverScript += '            supplyMap[skillName] = {' + NL;
                serverScript += '                total: 0,' + NL;
                serverScript += '                byLevel: { Novice: 0, Intermediate: 0, Proficient: 0, Advanced: 0, Expert: 0 }' + NL;
                serverScript += '            };' + NL;
                serverScript += '        }' + NL;
                serverScript += '        supplyMap[skillName].total++;' + NL;
                serverScript += '        var level = sg.skill_level.toString();' + NL;
                serverScript += '        if (supplyMap[skillName].byLevel.hasOwnProperty(level)) {' + NL;
                serverScript += '            supplyMap[skillName].byLevel[level]++;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    // 2. Calculate DEMAND: count of story assignments per skill' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    var demandMap = {};' + NL;
                serverScript += '' + NL;
                serverScript += '    var dg = new GlideRecord("u_story_skill_assignment");' + NL;
                serverScript += '    dg.addQuery("u_active", true);' + NL;
                serverScript += '    dg.query();' + NL;
                serverScript += '    while (dg.next()) {' + NL;
                serverScript += '        var dSkillName = dg.u_skill.name.toString();' + NL;
                serverScript += '        if (!dSkillName) continue;' + NL;
                serverScript += '        if (!demandMap[dSkillName]) {' + NL;
                serverScript += '            demandMap[dSkillName] = 0;' + NL;
                serverScript += '        }' + NL;
                serverScript += '        demandMap[dSkillName]++;' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    // 3. Build a unified list of all skills in supply OR demand' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    var allSkills = {};' + NL;
                serverScript += '    var skillKey;' + NL;
                serverScript += '    for (skillKey in supplyMap) {' + NL;
                serverScript += '        if (supplyMap.hasOwnProperty(skillKey)) {' + NL;
                serverScript += '            allSkills[skillKey] = true;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '    for (skillKey in demandMap) {' + NL;
                serverScript += '        if (demandMap.hasOwnProperty(skillKey)) {' + NL;
                serverScript += '            allSkills[skillKey] = true;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    // 4. Calculate GAP = supply - demand for each skill' + NL;
                serverScript += '    //    severity: critical (gap < -5), warning (gap < 0), balanced (gap >= 0)' + NL;
                serverScript += '    // ============================================' + NL;
                serverScript += '    for (var sName in allSkills) {' + NL;
                serverScript += '        if (!allSkills.hasOwnProperty(sName)) continue;' + NL;
                serverScript += '' + NL;
                serverScript += '        var supplyCount = (supplyMap[sName]) ? supplyMap[sName].total : 0;' + NL;
                serverScript += '        var demandCount = demandMap[sName] || 0;' + NL;
                serverScript += '        var gap = supplyCount - demandCount;' + NL;
                serverScript += '' + NL;
                serverScript += '        var severity = "balanced";' + NL;
                serverScript += '        if (gap < -5) {' + NL;
                serverScript += '            severity = "critical";' + NL;
                serverScript += '        } else if (gap < 0) {' + NL;
                serverScript += '            severity = "warning";' + NL;
                serverScript += '        }' + NL;
                serverScript += '' + NL;
                serverScript += '        data.gaps.push({' + NL;
                serverScript += '            skillName: sName,' + NL;
                serverScript += '            supplyCount: supplyCount,' + NL;
                serverScript += '            demandCount: demandCount,' + NL;
                serverScript += '            gap: gap,' + NL;
                serverScript += '            severity: severity' + NL;
                serverScript += '        });' + NL;
                serverScript += '    }' + NL;
                serverScript += '' + NL;
                serverScript += '    // Sort by gap ascending (worst gaps first) then by skill name' + NL;
                serverScript += '    data.gaps.sort(function(a, b) {' + NL;
                serverScript += '        if (a.gap !== b.gap) {' + NL;
                serverScript += '            return a.gap - b.gap;' + NL;
                serverScript += '        }' + NL;
                serverScript += '        return (a.skillName > b.skillName) ? 1 : (a.skillName < b.skillName) ? -1 : 0;' + NL;
                serverScript += '    });' + NL;
                serverScript += '' + NL;
                serverScript += '    // Build summary counts' + NL;
                serverScript += '    data.summary.totalSkills = data.gaps.length;' + NL;
                serverScript += '    for (var g = 0; g < data.gaps.length; g++) {' + NL;
                serverScript += '        var sev = data.gaps[g].severity;' + NL;
                serverScript += '        if (sev === "critical") {' + NL;
                serverScript += '            data.summary.criticalGaps++;' + NL;
                serverScript += '        } else if (sev === "warning") {' + NL;
                serverScript += '            data.summary.warnings++;' + NL;
                serverScript += '        } else {' + NL;
                serverScript += '            data.summary.balanced++;' + NL;
                serverScript += '        }' + NL;
                serverScript += '    }' + NL;
                serverScript += '})();';
        
                // ================================================================
                // 3. Build CLIENT SCRIPT
                // ================================================================
                var clientScript = '';
                clientScript += 'api.controller = function($scope) {' + NL;
                clientScript += '    var c = this;' + NL;
                clientScript += '' + NL;
                clientScript += '    // Filter state' + NL;
                clientScript += '    c.severityFilter = "all";' + NL;
                clientScript += '' + NL;
                clientScript += '    // Sort state' + NL;
                clientScript += '    c.sortField = "gap";' + NL;
                clientScript += '    c.sortAscending = true;' + NL;
                clientScript += '' + NL;
                clientScript += '    /**' + NL;
                clientScript += '     * Set the severity filter and refresh the filtered list.' + NL;
                clientScript += '     * @param {string} severity - "all", "critical", "warning", or "balanced"' + NL;
                clientScript += '     */' + NL;
                clientScript += '    c.filterBySeverity = function(severity) {' + NL;
                clientScript += '        c.severityFilter = severity;' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    /**' + NL;
                clientScript += '     * Return the filtered and sorted list of gap records.' + NL;
                clientScript += '     */' + NL;
                clientScript += '    c.getFilteredGaps = function() {' + NL;
                clientScript += '        var gaps = c.data.gaps || [];' + NL;
                clientScript += '' + NL;
                clientScript += '        // Apply severity filter' + NL;
                clientScript += '        if (c.severityFilter !== "all") {' + NL;
                clientScript += '            gaps = gaps.filter(function(g) {' + NL;
                clientScript += '                return g.severity === c.severityFilter;' + NL;
                clientScript += '            });' + NL;
                clientScript += '        }' + NL;
                clientScript += '' + NL;
                clientScript += '        // Apply sort' + NL;
                clientScript += '        var field = c.sortField;' + NL;
                clientScript += '        var asc = c.sortAscending;' + NL;
                clientScript += '        gaps = gaps.slice().sort(function(a, b) {' + NL;
                clientScript += '            var valA = a[field];' + NL;
                clientScript += '            var valB = b[field];' + NL;
                clientScript += '            if (typeof valA === "string") {' + NL;
                clientScript += '                return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);' + NL;
                clientScript += '            }' + NL;
                clientScript += '            return asc ? (valA - valB) : (valB - valA);' + NL;
                clientScript += '        });' + NL;
                clientScript += '' + NL;
                clientScript += '        return gaps;' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    /**' + NL;
                clientScript += '     * Toggle sort by a field. If already sorting by this field, reverse direction.' + NL;
                clientScript += '     * @param {string} field - "gap" or "skillName"' + NL;
                clientScript += '     */' + NL;
                clientScript += '    c.sortBy = function(field) {' + NL;
                clientScript += '        if (c.sortField === field) {' + NL;
                clientScript += '            c.sortAscending = !c.sortAscending;' + NL;
                clientScript += '        } else {' + NL;
                clientScript += '            c.sortField = field;' + NL;
                clientScript += '            c.sortAscending = (field === "skillName");' + NL;
                clientScript += '        }' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    /**' + NL;
                clientScript += '     * Return CSS class for a severity badge.' + NL;
                clientScript += '     */' + NL;
                clientScript += '    c.getSeverityClass = function(severity) {' + NL;
                clientScript += '        switch (severity) {' + NL;
                clientScript += '            case "critical": return "badge-critical";' + NL;
                clientScript += '            case "warning": return "badge-warning";' + NL;
                clientScript += '            case "balanced": return "badge-balanced";' + NL;
                clientScript += '            default: return "badge-balanced";' + NL;
                clientScript += '        }' + NL;
                clientScript += '    };' + NL;
                clientScript += '' + NL;
                clientScript += '    /**' + NL;
                clientScript += '     * Check if a filter button is active.' + NL;
                clientScript += '     */' + NL;
                clientScript += '    c.isActiveFilter = function(severity) {' + NL;
                clientScript += '        return c.severityFilter === severity;' + NL;
                clientScript += '    };' + NL;
                clientScript += '};';
        
                // ================================================================
                // 4. Build TEMPLATE
                // ================================================================
                var template = '';
                template += '<div class="gap-analysis-widget">' + NL;
                template += '' + NL;
                template += '    <!-- Header -->' + NL;
                template += '    <div class="gap-header">' + NL;
                template += '        <h3 class="gap-title"><i class="fa fa-balance-scale"></i> Skill Gap Analysis</h3>' + NL;
                template += '        <p class="gap-subtitle">Supply vs demand for each skill, ranked by severity</p>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <!-- Summary Cards -->' + NL;
                template += '    <div class="summary-cards">' + NL;
                template += '        <div class="summary-card">' + NL;
                template += '            <div class="summary-value">{{c.data.summary.totalSkills}}</div>' + NL;
                template += '            <div class="summary-label">Total Skills</div>' + NL;
                template += '        </div>' + NL;
                template += '        <div class="summary-card card-critical">' + NL;
                template += '            <div class="summary-value">{{c.data.summary.criticalGaps}}</div>' + NL;
                template += '            <div class="summary-label">Critical Gaps</div>' + NL;
                template += '        </div>' + NL;
                template += '        <div class="summary-card card-warning">' + NL;
                template += '            <div class="summary-value">{{c.data.summary.warnings}}</div>' + NL;
                template += '            <div class="summary-label">Warnings</div>' + NL;
                template += '        </div>' + NL;
                template += '        <div class="summary-card card-balanced">' + NL;
                template += '            <div class="summary-value">{{c.data.summary.balanced}}</div>' + NL;
                template += '            <div class="summary-label">Balanced</div>' + NL;
                template += '        </div>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <!-- Filter Buttons -->' + NL;
                template += '    <div class="filter-bar">' + NL;
                template += '        <span class="filter-label">Filter:</span>' + NL;
                template += '        <button class="btn btn-sm filter-btn" ng-class="{\'active\': c.isActiveFilter(\'all\')}" ng-click="c.filterBySeverity(\'all\')">All</button>' + NL;
                template += '        <button class="btn btn-sm filter-btn filter-critical" ng-class="{\'active\': c.isActiveFilter(\'critical\')}" ng-click="c.filterBySeverity(\'critical\')">Critical</button>' + NL;
                template += '        <button class="btn btn-sm filter-btn filter-warning" ng-class="{\'active\': c.isActiveFilter(\'warning\')}" ng-click="c.filterBySeverity(\'warning\')">Warning</button>' + NL;
                template += '        <button class="btn btn-sm filter-btn filter-balanced" ng-class="{\'active\': c.isActiveFilter(\'balanced\')}" ng-click="c.filterBySeverity(\'balanced\')">Balanced</button>' + NL;
                template += '        <span class="sort-controls">' + NL;
                template += '            <span class="filter-label">Sort:</span>' + NL;
                template += '            <button class="btn btn-sm sort-btn" ng-class="{\'active\': c.sortField === \'gap\'}" ng-click="c.sortBy(\'gap\')">Gap Amount</button>' + NL;
                template += '            <button class="btn btn-sm sort-btn" ng-class="{\'active\': c.sortField === \'skillName\'}" ng-click="c.sortBy(\'skillName\')">Skill Name</button>' + NL;
                template += '        </span>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <!-- Empty State -->' + NL;
                template += '    <div class="gap-empty" ng-if="c.getFilteredGaps().length === 0">' + NL;
                template += '        <i class="fa fa-check-circle fa-3x"></i>' + NL;
                template += '        <p class="gap-empty-title">No Results</p>' + NL;
                template += '        <p class="gap-empty-desc">No skill gaps match the current filter.</p>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '    <!-- Gap Table -->' + NL;
                template += '    <div class="gap-table-wrap" ng-if="c.getFilteredGaps().length > 0">' + NL;
                template += '        <table class="gap-table">' + NL;
                template += '            <thead>' + NL;
                template += '                <tr>' + NL;
                template += '                    <th class="col-skill" ng-click="c.sortBy(\'skillName\')" style="cursor:pointer;">Skill Name <i class="fa fa-sort"></i></th>' + NL;
                template += '                    <th class="col-supply">Supply</th>' + NL;
                template += '                    <th class="col-demand">Demand</th>' + NL;
                template += '                    <th class="col-gap" ng-click="c.sortBy(\'gap\')" style="cursor:pointer;">Gap <i class="fa fa-sort"></i></th>' + NL;
                template += '                    <th class="col-severity">Severity</th>' + NL;
                template += '                </tr>' + NL;
                template += '            </thead>' + NL;
                template += '            <tbody>' + NL;
                template += '                <tr ng-repeat="gap in c.getFilteredGaps() track by gap.skillName">' + NL;
                template += '                    <td class="col-skill">{{gap.skillName}}</td>' + NL;
                template += '                    <td class="col-supply">{{gap.supplyCount}}</td>' + NL;
                template += '                    <td class="col-demand">{{gap.demandCount}}</td>' + NL;
                template += '                    <td class="col-gap" ng-class="{\'gap-negative\': gap.gap < 0}">{{gap.gap}}</td>' + NL;
                template += '                    <td class="col-severity">' + NL;
                template += '                        <span class="severity-badge" ng-class="c.getSeverityClass(gap.severity)">' + NL;
                template += '                            {{gap.severity | uppercase}}' + NL;
                template += '                        </span>' + NL;
                template += '                    </td>' + NL;
                template += '                </tr>' + NL;
                template += '            </tbody>' + NL;
                template += '        </table>' + NL;
                template += '    </div>' + NL;
                template += '' + NL;
                template += '</div>';
        
                // ================================================================
                // 5. Build CSS
                // ================================================================
                var css = '';
                css += '/* ===== Skills Hub Gap Analysis Widget ===== */' + NL;
                css += '.gap-analysis-widget {' + NL;
                css += '    font-family: "Source Sans Pro", Arial, sans-serif;' + NL;
                css += '    padding: 16px;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Header */' + NL;
                css += '.gap-header {' + NL;
                css += '    margin-bottom: 20px;' + NL;
                css += '}' + NL;
                css += '.gap-title {' + NL;
                css += '    font-size: 1.3em;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    color: #333333;' + NL;
                css += '    margin: 0 0 4px 0;' + NL;
                css += '}' + NL;
                css += '.gap-title .fa {' + NL;
                css += '    color: #0072CE;' + NL;
                css += '    margin-right: 8px;' + NL;
                css += '}' + NL;
                css += '.gap-subtitle {' + NL;
                css += '    font-size: 0.9em;' + NL;
                css += '    color: #888888;' + NL;
                css += '    margin: 0;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Summary Cards */' + NL;
                css += '.summary-cards {' + NL;
                css += '    display: flex;' + NL;
                css += '    gap: 16px;' + NL;
                css += '    margin-bottom: 20px;' + NL;
                css += '    flex-wrap: wrap;' + NL;
                css += '}' + NL;
                css += '.summary-card {' + NL;
                css += '    flex: 1;' + NL;
                css += '    min-width: 120px;' + NL;
                css += '    background: #ffffff;' + NL;
                css += '    border: 1px solid #e0e0e0;' + NL;
                css += '    border-radius: 8px;' + NL;
                css += '    padding: 16px 20px;' + NL;
                css += '    text-align: center;' + NL;
                css += '    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);' + NL;
                css += '}' + NL;
                css += '.summary-value {' + NL;
                css += '    font-size: 2em;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    color: #0072CE;' + NL;
                css += '    line-height: 1.2;' + NL;
                css += '}' + NL;
                css += '.summary-label {' + NL;
                css += '    font-size: 0.8em;' + NL;
                css += '    text-transform: uppercase;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #888888;' + NL;
                css += '    margin-top: 4px;' + NL;
                css += '    letter-spacing: 0.5px;' + NL;
                css += '}' + NL;
                css += '.card-critical .summary-value {' + NL;
                css += '    color: #dc2626;' + NL;
                css += '}' + NL;
                css += '.card-warning .summary-value {' + NL;
                css += '    color: #f59e0b;' + NL;
                css += '}' + NL;
                css += '.card-balanced .summary-value {' + NL;
                css += '    color: #22c55e;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Filter & Sort Bar */' + NL;
                css += '.filter-bar {' + NL;
                css += '    display: flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    gap: 8px;' + NL;
                css += '    margin-bottom: 16px;' + NL;
                css += '    flex-wrap: wrap;' + NL;
                css += '}' + NL;
                css += '.filter-label {' + NL;
                css += '    font-size: 0.85em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #666666;' + NL;
                css += '}' + NL;
                css += '.filter-btn, .sort-btn {' + NL;
                css += '    border: 1px solid #d0d0d0;' + NL;
                css += '    background: #ffffff;' + NL;
                css += '    color: #555555;' + NL;
                css += '    border-radius: 4px;' + NL;
                css += '    font-size: 0.82em;' + NL;
                css += '    padding: 4px 12px;' + NL;
                css += '    cursor: pointer;' + NL;
                css += '    transition: all 0.15s ease;' + NL;
                css += '}' + NL;
                css += '.filter-btn.active, .sort-btn.active {' + NL;
                css += '    background: #0072CE;' + NL;
                css += '    color: #ffffff;' + NL;
                css += '    border-color: #0072CE;' + NL;
                css += '}' + NL;
                css += '.filter-critical.active {' + NL;
                css += '    background: #dc2626;' + NL;
                css += '    border-color: #dc2626;' + NL;
                css += '}' + NL;
                css += '.filter-warning.active {' + NL;
                css += '    background: #f59e0b;' + NL;
                css += '    border-color: #f59e0b;' + NL;
                css += '}' + NL;
                css += '.filter-balanced.active {' + NL;
                css += '    background: #22c55e;' + NL;
                css += '    border-color: #22c55e;' + NL;
                css += '}' + NL;
                css += '.sort-controls {' + NL;
                css += '    margin-left: 16px;' + NL;
                css += '    display: flex;' + NL;
                css += '    align-items: center;' + NL;
                css += '    gap: 8px;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Empty State */' + NL;
                css += '.gap-empty {' + NL;
                css += '    text-align: center;' + NL;
                css += '    padding: 48px 20px;' + NL;
                css += '    color: #22c55e;' + NL;
                css += '}' + NL;
                css += '.gap-empty-title {' + NL;
                css += '    font-size: 1.2em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #333333;' + NL;
                css += '    margin: 12px 0 6px;' + NL;
                css += '}' + NL;
                css += '.gap-empty-desc {' + NL;
                css += '    font-size: 0.9em;' + NL;
                css += '    color: #999999;' + NL;
                css += '    margin: 0;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Gap Table */' + NL;
                css += '.gap-table-wrap {' + NL;
                css += '    overflow-x: auto;' + NL;
                css += '}' + NL;
                css += '.gap-table {' + NL;
                css += '    width: 100%;' + NL;
                css += '    border-collapse: collapse;' + NL;
                css += '}' + NL;
                css += '.gap-table thead th {' + NL;
                css += '    font-size: 0.78em;' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    text-transform: uppercase;' + NL;
                css += '    color: #888888;' + NL;
                css += '    padding: 10px 12px;' + NL;
                css += '    border-bottom: 2px solid #e0e0e0;' + NL;
                css += '    text-align: left;' + NL;
                css += '    letter-spacing: 0.3px;' + NL;
                css += '}' + NL;
                css += '.gap-table tbody tr {' + NL;
                css += '    transition: background 0.15s ease;' + NL;
                css += '}' + NL;
                css += '.gap-table tbody tr:hover {' + NL;
                css += '    background: #f8f9fa;' + NL;
                css += '}' + NL;
                css += '.gap-table tbody td {' + NL;
                css += '    padding: 10px 12px;' + NL;
                css += '    vertical-align: middle;' + NL;
                css += '    border-bottom: 1px solid #f0f0f0;' + NL;
                css += '    font-size: 0.93em;' + NL;
                css += '}' + NL;
                css += '.col-skill {' + NL;
                css += '    font-weight: 600;' + NL;
                css += '    color: #333333;' + NL;
                css += '}' + NL;
                css += '.col-supply, .col-demand, .col-gap {' + NL;
                css += '    text-align: center;' + NL;
                css += '}' + NL;
                css += '.gap-negative {' + NL;
                css += '    color: #dc2626;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '}' + NL;
                css += '' + NL;
                css += '/* Severity Badges */' + NL;
                css += '.severity-badge {' + NL;
                css += '    display: inline-block;' + NL;
                css += '    padding: 3px 10px;' + NL;
                css += '    border-radius: 12px;' + NL;
                css += '    font-size: 0.78em;' + NL;
                css += '    font-weight: 700;' + NL;
                css += '    letter-spacing: 0.3px;' + NL;
                css += '}' + NL;
                css += '.badge-critical {' + NL;
                css += '    background: #dc2626;' + NL;
                css += '    color: #ffffff;' + NL;
                css += '}' + NL;
                css += '.badge-warning {' + NL;
                css += '    background: #f59e0b;' + NL;
                css += '    color: #ffffff;' + NL;
                css += '}' + NL;
                css += '.badge-balanced {' + NL;
                css += '    background: #22c55e;' + NL;
                css += '    color: #ffffff;' + NL;
                css += '}';
        
                // ================================================================
                // 6. Create the widget record
                // ================================================================
                var widgetGR = new GlideRecord('sp_widget');
                widgetGR.initialize();
                widgetGR.setValue('name', WIDGET_NAME);
                widgetGR.setValue('id', WIDGET_ID);
                widgetGR.setValue('script', serverScript);
                widgetGR.setValue('client_script', clientScript);
                widgetGR.setValue('template', template);
                widgetGR.setValue('css', css);
        
                var widgetSysId = widgetGR.insert();
        
                if (widgetSysId) {
                    gs.info('[Skills Hub] Gap Analysis widget created successfully (sys_id: ' + widgetSysId + ')');
                } else {
                    gs.error('[Skills Hub] FAILED to create Gap Analysis widget');
                    return;
                }
        
                // ================================================================
                // 7. Summary
                // ================================================================
                gs.info('[Skills Hub] ===== GAP ANALYSIS WIDGET CREATION SUMMARY (Script 31) =====');
                gs.info('[Skills Hub] Widget name: ' + WIDGET_NAME);
                gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
                gs.info('[Skills Hub] Widget sys_id: ' + widgetSysId);
                gs.info('[Skills Hub] Server script: Supply/Demand gap calculation (gap = supply - demand)');
                gs.info('[Skills Hub]   Severity: critical (gap < -5), warning (gap < 0), balanced (gap >= 0)');
                gs.info('[Skills Hub] Client script: filter by severity (All/Critical/Warning/Balanced), sort by gap or name');
                gs.info('[Skills Hub] Template: 4 summary cards, filter/sort bar, gap table with severity badges');
                gs.info('[Skills Hub] CSS: severity badges (red=critical, yellow=warning, green=balanced), cards, table');
                gs.info('[Skills Hub] Server script length: ' + serverScript.length + ' chars');
                gs.info('[Skills Hub] Client script length: ' + clientScript.length + ' chars');
                gs.info('[Skills Hub] Template length: ' + template.length + ' chars');
                gs.info('[Skills Hub] CSS length: ' + css.length + ' chars');
                gs.info('[Skills Hub] ===========================================================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 31_create_gap_analysis_widget: ' + e.message);
            }

        _sectionResults.push({ section: 21, name: 'GAP ANALYSIS WIDGET (31)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 21: GAP ANALYSIS WIDGET (31) - COMPLETE ==========');
    } catch (_sectionErr21) {
        gs.error('[Skills Hub] SECTION 21 FATAL ERROR (GAP ANALYSIS WIDGET (31)): ' + _sectionErr21.message);
        _sectionResults.push({ section: 21, name: 'GAP ANALYSIS WIDGET (31)', status: 'ERROR: ' + _sectionErr21.message });
    }


    // ==================================================================
    // SECTION 22: SKILL DETECTION (32)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 22: SKILL DETECTION (32) ==========');
    try {
        try {
                gs.info('[Skills Hub] ===== STARTING SKILL DETECTION CREATION (Script 32) =====');
        
                var SI_NAME = 'SkillsHubDetection';
        
                // ================================================================
                // 1. Idempotency check
                // ================================================================
                var existingSI = new GlideRecord('sys_script_include');
                existingSI.addQuery('name', SI_NAME);
                existingSI.query();
        
                if (existingSI.next()) {
                    gs.info('[Skills Hub] ' + SI_NAME + ' Script Include already exists (sys_id: ' + existingSI.getUniqueValue() + '). Skipping creation.');
                    return;
                }
        
                // ================================================================
                // 2. Build the Script Include body
                // ================================================================
                var NL = '\n';
                var T = '    ';
        
                var script = '';
                script += 'var SkillsHubDetection = Class.create();' + NL;
                script += 'SkillsHubDetection.prototype = {' + NL;
                script += NL;
                script += T + 'initialize: function() {' + NL;
                script += T + T + 'this.LOG_SOURCE = "SkillsHubDetection";' + NL;
                script += T + T + 'this._buildVariationMap();' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- _variations: common skill name aliases -----
                script += T + '/**' + NL;
                script += T + ' * Common skill name variations/aliases.' + NL;
                script += T + ' * Keys are lowercase canonical skill names.' + NL;
                script += T + ' * Values are arrays of alternative spellings/abbreviations.' + NL;
                script += T + ' */' + NL;
                script += T + '_variations: {' + NL;
                script += T + T + '"javascript": ["js", "ecmascript", "es6", "java script"],' + NL;
                script += T + T + '"typescript": ["ts"],' + NL;
                script += T + T + '"python": ["py", "python3"],' + NL;
                script += T + T + '"kubernetes": ["k8s", "kube"],' + NL;
                script += T + T + '"docker": ["containerization", "containers"],' + NL;
                script += T + T + '"react": ["reactjs", "react.js"],' + NL;
                script += T + T + '"angular": ["angularjs", "angular.js"],' + NL;
                script += T + T + '"node.js": ["nodejs", "node"],' + NL;
                script += T + T + '"servicenow": ["snow", "snc"],' + NL;
                script += T + T + '"amazon web services": ["aws"],' + NL;
                script += T + T + '"google cloud platform": ["gcp"],' + NL;
                script += T + T + '"microsoft azure": ["azure"],' + NL;
                script += T + T + '"machine learning": ["ml", "deep learning"],' + NL;
                script += T + T + '"artificial intelligence": ["ai"],' + NL;
                script += T + T + '"continuous integration": ["ci", "ci/cd"],' + NL;
                script += T + T + '"sql": ["structured query language"],' + NL;
                script += T + T + '"html": ["html5"],' + NL;
                script += T + T + '"css": ["css3", "styling"],' + NL;
                script += T + T + '"agile": ["scrum", "kanban"],' + NL;
                script += T + T + '"project management": ["pm", "project mgmt"]' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- _reverseMap: alias -> canonical name -----
                script += T + '_reverseMap: null,' + NL;
                script += NL;
        
                // ----- _buildVariationMap -----
                script += T + '/**' + NL;
                script += T + ' * Build reverse lookup map from _variations.' + NL;
                script += T + ' * Maps each alias (lowercase) to its canonical skill name (lowercase).' + NL;
                script += T + ' */' + NL;
                script += T + '_buildVariationMap: function() {' + NL;
                script += T + T + 'this._reverseMap = {};' + NL;
                script += T + T + 'for (var canonical in this._variations) {' + NL;
                script += T + T + T + 'if (!this._variations.hasOwnProperty(canonical)) continue;' + NL;
                script += T + T + T + 'var aliasList = this._variations[canonical];' + NL;
                script += T + T + T + 'for (var i = 0; i < aliasList.length; i++) {' + NL;
                script += T + T + T + T + 'this._reverseMap[aliasList[i].toLowerCase()] = canonical;' + NL;
                script += T + T + T + '}' + NL;
                script += T + T + '}' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- detectSkills -----
                script += T + '/**' + NL;
                script += T + ' * Analyze text and return matching skill names with confidence.' + NL;
                script += T + ' * Queries all cmn_skill records. For each skill, checks if the skill name' + NL;
                script += T + ' * (case-insensitive) appears in the text. Also checks common variations.' + NL;
                script += T + ' *' + NL;
                script += T + ' * @param {string} text - The text to analyze (e.g., story description)' + NL;
                script += T + ' * @returns {Array} Array of { skillId, skillName, confidence }' + NL;
                script += T + ' *                  where confidence is "exact" or "partial"' + NL;
                script += T + ' */' + NL;
                script += T + 'detectSkills: function(text) {' + NL;
                script += T + T + 'var results = [];' + NL;
                script += T + T + 'if (!text || text.toString().trim() === "") {' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += NL;
                script += T + T + 'try {' + NL;
                script += T + T + T + '// Normalize: lowercase, strip HTML tags, pad with spaces for word boundary matching' + NL;
                script += T + T + T + 'var normalizedText = " " + text.toString().replace(/<[^>]*>/g, " ").toLowerCase() + " ";' + NL;
                script += NL;
                script += T + T + T + '// Track matched skill IDs to avoid duplicates' + NL;
                script += T + T + T + 'var matched = {};' + NL;
                script += NL;
                script += T + T + T + '// Query all active skills from cmn_skill' + NL;
                script += T + T + T + 'var skillGR = new GlideRecord("cmn_skill");' + NL;
                script += T + T + T + 'skillGR.addActiveQuery();' + NL;
                script += T + T + T + 'skillGR.query();' + NL;
                script += NL;
                script += T + T + T + 'while (skillGR.next()) {' + NL;
                script += T + T + T + T + 'var skillId = skillGR.getUniqueValue();' + NL;
                script += T + T + T + T + 'var skillName = skillGR.getValue("name");' + NL;
                script += T + T + T + T + 'if (!skillName || matched[skillId]) continue;' + NL;
                script += NL;
                script += T + T + T + T + 'var skillNameLower = skillName.toLowerCase();' + NL;
                script += NL;
                script += T + T + T + T + '// Check 1: Exact name match (case-insensitive, word boundary)' + NL;
                script += T + T + T + T + 'if (normalizedText.indexOf(" " + skillNameLower + " ") !== -1' + NL;
                script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + ".") !== -1' + NL;
                script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + ",") !== -1' + NL;
                script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + "\\n") !== -1) {' + NL;
                script += T + T + T + T + T + 'matched[skillId] = true;' + NL;
                script += T + T + T + T + T + 'results.push({' + NL;
                script += T + T + T + T + T + T + 'skillId: skillId,' + NL;
                script += T + T + T + T + T + T + 'skillName: skillName,' + NL;
                script += T + T + T + T + T + T + 'confidence: "exact"' + NL;
                script += T + T + T + T + T + '});' + NL;
                script += T + T + T + T + T + 'continue;' + NL;
                script += T + T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + T + '// Check 2: Variation/alias match' + NL;
                script += T + T + T + T + 'var variationMatched = false;' + NL;
                script += NL;
                script += T + T + T + T + '// 2a. Check if any known alias of this skill appears in text' + NL;
                script += T + T + T + T + 'if (this._variations[skillNameLower]) {' + NL;
                script += T + T + T + T + T + 'var aliases = this._variations[skillNameLower];' + NL;
                script += T + T + T + T + T + 'for (var a = 0; a < aliases.length; a++) {' + NL;
                script += T + T + T + T + T + T + 'var aliasLower = aliases[a].toLowerCase();' + NL;
                script += T + T + T + T + T + T + 'if (normalizedText.indexOf(" " + aliasLower + " ") !== -1' + NL;
                script += T + T + T + T + T + T + '    || normalizedText.indexOf(" " + aliasLower + ".") !== -1' + NL;
                script += T + T + T + T + T + T + '    || normalizedText.indexOf(" " + aliasLower + ",") !== -1) {' + NL;
                script += T + T + T + T + T + T + T + 'variationMatched = true;' + NL;
                script += T + T + T + T + T + T + T + 'break;' + NL;
                script += T + T + T + T + T + T + '}' + NL;
                script += T + T + T + T + T + '}' + NL;
                script += T + T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + T + '// 2b. Check reverse: if the skill name itself is an alias of a canonical name' + NL;
                script += T + T + T + T + 'if (!variationMatched && this._reverseMap) {' + NL;
                script += T + T + T + T + T + 'for (var alias in this._reverseMap) {' + NL;
                script += T + T + T + T + T + T + 'if (!this._reverseMap.hasOwnProperty(alias)) continue;' + NL;
                script += T + T + T + T + T + T + 'if (this._reverseMap[alias] === skillNameLower) {' + NL;
                script += T + T + T + T + T + T + T + 'if (normalizedText.indexOf(" " + alias + " ") !== -1' + NL;
                script += T + T + T + T + T + T + T + '    || normalizedText.indexOf(" " + alias + ".") !== -1' + NL;
                script += T + T + T + T + T + T + T + '    || normalizedText.indexOf(" " + alias + ",") !== -1) {' + NL;
                script += T + T + T + T + T + T + T + T + 'variationMatched = true;' + NL;
                script += T + T + T + T + T + T + T + T + 'break;' + NL;
                script += T + T + T + T + T + T + T + '}' + NL;
                script += T + T + T + T + T + T + '}' + NL;
                script += T + T + T + T + T + '}' + NL;
                script += T + T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + T + 'if (variationMatched) {' + NL;
                script += T + T + T + T + T + 'matched[skillId] = true;' + NL;
                script += T + T + T + T + T + 'results.push({' + NL;
                script += T + T + T + T + T + T + 'skillId: skillId,' + NL;
                script += T + T + T + T + T + T + 'skillName: skillName,' + NL;
                script += T + T + T + T + T + T + 'confidence: "partial"' + NL;
                script += T + T + T + T + T + '});' + NL;
                script += T + T + T + T + '}' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'return results;' + NL;
                script += NL;
                script += T + T + '} catch (e) {' + NL;
                script += T + T + T + 'gs.error(this.LOG_SOURCE + ".detectSkills: " + e.message);' + NL;
                script += T + T + T + 'return results;' + NL;
                script += T + T + '}' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- tagStoryWithSkills -----
                script += T + '/**' + NL;
                script += T + ' * Auto-detect and tag skills for a single story.' + NL;
                script += T + ' * Gets the story short_description + description, runs detectSkills(),' + NL;
                script += T + ' * and creates u_story_skill_assignment records for each detected skill' + NL;
                script += T + ' * (if it does not already exist).' + NL;
                script += T + ' *' + NL;
                script += T + ' * @param {string} storyId - sys_id of the rm_story (or task) record' + NL;
                script += T + ' * @returns {Object} { success: true, skillsTagged: N, skillsSkipped: N }' + NL;
                script += T + ' */' + NL;
                script += T + 'tagStoryWithSkills: function(storyId) {' + NL;
                script += T + T + 'var result = { success: false, skillsTagged: 0, skillsSkipped: 0 };' + NL;
                script += NL;
                script += T + T + 'try {' + NL;
                script += T + T + T + 'if (!storyId) {' + NL;
                script += T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".tagStoryWithSkills: No storyId provided");' + NL;
                script += T + T + T + T + 'return result;' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + '// 1. Get the story record' + NL;
                script += T + T + T + 'var storyGR = new GlideRecord("rm_story");' + NL;
                script += T + T + T + 'if (!storyGR.get(storyId)) {' + NL;
                script += T + T + T + T + '// Fallback: try task table' + NL;
                script += T + T + T + T + 'storyGR = new GlideRecord("task");' + NL;
                script += T + T + T + T + 'if (!storyGR.get(storyId)) {' + NL;
                script += T + T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".tagStoryWithSkills: Record not found: " + storyId);' + NL;
                script += T + T + T + T + T + 'return result;' + NL;
                script += T + T + T + T + '}' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + '// 2. Concatenate short_description + description' + NL;
                script += T + T + T + 'var text = (storyGR.getValue("short_description") || "") + " " + (storyGR.getValue("description") || "");' + NL;
                script += NL;
                script += T + T + T + '// 3. Detect skills in the combined text' + NL;
                script += T + T + T + 'var detected = this.detectSkills(text);' + NL;
                script += NL;
                script += T + T + T + '// 4. Create u_story_skill_assignment for each detected skill' + NL;
                script += T + T + T + 'for (var i = 0; i < detected.length; i++) {' + NL;
                script += T + T + T + T + 'var skill = detected[i];' + NL;
                script += NL;
                script += T + T + T + T + '// Check if assignment already exists (idempotent)' + NL;
                script += T + T + T + T + 'var existCheck = new GlideRecord("u_story_skill_assignment");' + NL;
                script += T + T + T + T + 'existCheck.addQuery("u_story", storyId);' + NL;
                script += T + T + T + T + 'existCheck.addQuery("u_skill", skill.skillId);' + NL;
                script += T + T + T + T + 'existCheck.query();' + NL;
                script += NL;
                script += T + T + T + T + 'if (existCheck.hasNext()) {' + NL;
                script += T + T + T + T + T + 'result.skillsSkipped++;' + NL;
                script += T + T + T + T + T + 'continue;' + NL;
                script += T + T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + T + '// Create the assignment' + NL;
                script += T + T + T + T + 'var assignGR = new GlideRecord("u_story_skill_assignment");' + NL;
                script += T + T + T + T + 'assignGR.initialize();' + NL;
                script += T + T + T + T + 'assignGR.setValue("u_story", storyId);' + NL;
                script += T + T + T + T + 'assignGR.setValue("u_skill", skill.skillId);' + NL;
                script += T + T + T + T + 'assignGR.setValue("u_active", true);' + NL;
                script += NL;
                script += T + T + T + T + 'var insertId = assignGR.insert();' + NL;
                script += T + T + T + T + 'if (insertId) {' + NL;
                script += T + T + T + T + T + 'result.skillsTagged++;' + NL;
                script += T + T + T + T + T + 'gs.info(this.LOG_SOURCE + ".tagStoryWithSkills: Tagged skill " + skill.skillName + " (" + skill.confidence + ") for story " + storyId);' + NL;
                script += T + T + T + T + '} else {' + NL;
                script += T + T + T + T + T + 'gs.error(this.LOG_SOURCE + ".tagStoryWithSkills: Failed to create assignment for skill " + skill.skillName + " on story " + storyId);' + NL;
                script += T + T + T + T + '}' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'result.success = true;' + NL;
                script += T + T + T + 'gs.info(this.LOG_SOURCE + ".tagStoryWithSkills complete for story " + storyId + ": tagged=" + result.skillsTagged + ", skipped=" + result.skillsSkipped);' + NL;
                script += T + T + T + 'return result;' + NL;
                script += NL;
                script += T + T + '} catch (e) {' + NL;
                script += T + T + T + 'gs.error(this.LOG_SOURCE + ".tagStoryWithSkills: " + e.message);' + NL;
                script += T + T + T + 'result.success = false;' + NL;
                script += T + T + T + 'return result;' + NL;
                script += T + T + '}' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- batchTagStories -----
                script += T + '/**' + NL;
                script += T + ' * Run skill detection on multiple stories matching an encoded query.' + NL;
                script += T + ' * Queries rm_story with the encoded query (or task as fallback).' + NL;
                script += T + ' * Calls tagStoryWithSkills for each story found.' + NL;
                script += T + ' *' + NL;
                script += T + ' * @param {string} encodedQuery - Encoded query string for rm_story table' + NL;
                script += T + ' * @returns {Object} { success: true, storiesProcessed: N, totalSkillsTagged: N }' + NL;
                script += T + ' */' + NL;
                script += T + 'batchTagStories: function(encodedQuery) {' + NL;
                script += T + T + 'var summary = {' + NL;
                script += T + T + T + 'success: false,' + NL;
                script += T + T + T + 'storiesProcessed: 0,' + NL;
                script += T + T + T + 'totalSkillsTagged: 0' + NL;
                script += T + T + '};' + NL;
                script += NL;
                script += T + T + 'try {' + NL;
                script += T + T + T + 'if (!encodedQuery) {' + NL;
                script += T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".batchTagStories: No encodedQuery provided");' + NL;
                script += T + T + T + T + 'return summary;' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + '// Try rm_story first' + NL;
                script += T + T + T + 'var tableName = "rm_story";' + NL;
                script += T + T + T + 'var storyGR = new GlideRecord(tableName);' + NL;
                script += NL;
                script += T + T + T + '// Test if rm_story table is accessible' + NL;
                script += T + T + T + 'if (!storyGR.isValid()) {' + NL;
                script += T + T + T + T + '// Fallback to task table' + NL;
                script += T + T + T + T + 'tableName = "task";' + NL;
                script += T + T + T + T + 'storyGR = new GlideRecord(tableName);' + NL;
                script += T + T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories: rm_story not available, using task table");' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'storyGR.addEncodedQuery(encodedQuery);' + NL;
                script += T + T + T + 'storyGR.query();' + NL;
                script += NL;
                script += T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories: Processing stories from " + tableName + " with query: " + encodedQuery);' + NL;
                script += NL;
                script += T + T + T + 'while (storyGR.next()) {' + NL;
                script += T + T + T + T + 'var storyId = storyGR.getUniqueValue();' + NL;
                script += NL;
                script += T + T + T + T + 'try {' + NL;
                script += T + T + T + T + T + 'var storyResult = this.tagStoryWithSkills(storyId);' + NL;
                script += T + T + T + T + T + 'summary.storiesProcessed++;' + NL;
                script += T + T + T + T + T + 'summary.totalSkillsTagged += storyResult.skillsTagged;' + NL;
                script += T + T + T + T + '} catch (storyErr) {' + NL;
                script += T + T + T + T + T + 'gs.error(this.LOG_SOURCE + ".batchTagStories: Error processing story " + storyId + ": " + storyErr.message);' + NL;
                script += T + T + T + T + '}' + NL;
                script += T + T + T + '}' + NL;
                script += NL;
                script += T + T + T + 'summary.success = true;' + NL;
                script += T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories complete: storiesProcessed=" + summary.storiesProcessed + ", totalSkillsTagged=" + summary.totalSkillsTagged);' + NL;
                script += T + T + T + 'return summary;' + NL;
                script += NL;
                script += T + T + '} catch (e) {' + NL;
                script += T + T + T + 'gs.error(this.LOG_SOURCE + ".batchTagStories: " + e.message);' + NL;
                script += T + T + T + 'summary.success = false;' + NL;
                script += T + T + T + 'return summary;' + NL;
                script += T + T + '}' + NL;
                script += T + '},' + NL;
                script += NL;
        
                // ----- type -----
                script += T + 'type: "SkillsHubDetection"' + NL;
                script += '};' + NL;
        
                // ================================================================
                // 3. Create the Script Include record
                // ================================================================
                var si = new GlideRecord('sys_script_include');
                si.initialize();
                si.setValue('name', SI_NAME);
                si.setValue('api_name', 'global.SkillsHubDetection');
                si.setValue('client_callable', false);
                si.setValue('active', true);
                si.setValue('access', 'public');
                si.setValue('description', 'Skills Hub - Automated skill detection from story/task descriptions. ' +
                    'Analyzes text for skill name matches (exact and partial via alias/variation) ' +
                    'and auto-tags stories with detected skills via u_story_skill_assignment records. ' +
                    'Methods: detectSkills(text), tagStoryWithSkills(storyId), batchTagStories(encodedQuery).');
                si.setValue('script', script);
        
                var siSysId = si.insert();
        
                if (siSysId) {
                    gs.info('[Skills Hub] Created ' + SI_NAME + ' Script Include (sys_id: ' + siSysId + ')');
                } else {
                    gs.error('[Skills Hub] FAILED to create ' + SI_NAME + ' Script Include');
                    return;
                }
        
                // ================================================================
                // 4. Summary
                // ================================================================
                gs.info('[Skills Hub] ===== SCRIPT 32 SUMMARY =====');
                gs.info('[Skills Hub] Script Include: ' + SI_NAME);
                gs.info('[Skills Hub]   API Name: global.SkillsHubDetection');
                gs.info('[Skills Hub]   sys_id: ' + siSysId);
                gs.info('[Skills Hub]   Client Callable: false');
                gs.info('[Skills Hub]   Methods:');
                gs.info('[Skills Hub]     - detectSkills(text) -> [{ skillId, skillName, confidence }]');
                gs.info('[Skills Hub]     - tagStoryWithSkills(storyId) -> { success, skillsTagged, skillsSkipped }');
                gs.info('[Skills Hub]     - batchTagStories(encodedQuery) -> { success, storiesProcessed, totalSkillsTagged }');
                gs.info('[Skills Hub]   Variations: 20 canonical skills with alias/variation mappings');
                gs.info('[Skills Hub]   Confidence values: "exact" (direct name match) or "partial" (alias/variation match)');
                gs.info('[Skills Hub]   Script length: ' + script.length + ' chars');
                gs.info('[Skills Hub] ==============================');
        
            } catch (e) {
                gs.error('[Skills Hub] Fatal error in 32_create_skill_detection: ' + e.message);
            }

        _sectionResults.push({ section: 22, name: 'SKILL DETECTION (32)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 22: SKILL DETECTION (32) - COMPLETE ==========');
    } catch (_sectionErr22) {
        gs.error('[Skills Hub] SECTION 22 FATAL ERROR (SKILL DETECTION (32)): ' + _sectionErr22.message);
        _sectionResults.push({ section: 22, name: 'SKILL DETECTION (32)', status: 'ERROR: ' + _sectionErr22.message });
    }


    // ==================================================================
    // SECTION 23: USER STORIES (34)
    // ==================================================================
    gs.info('[Skills Hub] ========== SECTION 23: USER STORIES (34) ==========');
    try {
        var stories = [
            {
                id: 'SH-001',
                short_description: 'As an employee, I want to view my skill portfolio so I can see all my current skills, proficiency levels, and endorsements in one place',
                description: 'Employees need a centralized Service Portal page (skills_hub) with a My Profile widget that displays all skills from sys_user_has_skill, including proficiency level, interest level, peer endorsement count, and manager validation status. The widget should allow inline editing of interest level (high/neutral/low) on the employee\'s own records.',
                acceptance_criteria: '<ul><li>Employee can access the Skills Hub portal page at ?id=skills_hub</li><li>My Profile widget displays all skills assigned to the logged-in user</li><li>Each skill shows: skill name, proficiency level, interest level, endorsement count, validation status</li><li>Employee can edit their own interest level inline (high, neutral, low)</li><li>Non-authenticated users cannot access the page</li><li>Widget loads within 3 seconds for users with up to 50 skills</li></ul>',
                phase: 'Baseline',
                epic: 'Employee Skill Portfolio'
            },
            {
                id: 'SH-002',
                short_description: 'As an employee, I want to search for colleagues by skill so I can find subject matter experts across the organization',
                description: 'The Find Expert widget allows any authenticated user to search for colleagues by skill name. Results display matching users with their proficiency level, interest level, and endorsement count, ordered by proficiency descending. An optional interest filter lets users narrow results to only those with high interest in using that skill.',
                acceptance_criteria: '<ul><li>Search field accepts skill name text input</li><li>Results show matching users with skill name, proficiency, interest level, and endorsement count</li><li>Results are ordered by proficiency level descending</li><li>Optional interest level filter (high/neutral/low) narrows results</li><li>Empty search returns no results (not all users)</li><li>Any authenticated user with skill_user role can search</li></ul>',
                phase: 'Baseline',
                epic: 'Expert Discovery'
            },
            {
                id: 'SH-003',
                short_description: 'As an employee, I want to endorse a colleague\'s skill so I can vouch for their expertise',
                description: 'From the Find Expert widget, an employee can endorse a colleague\'s skill by clicking an endorse button. The system creates a u_m2m_skill_endorsement record linking the endorser to the skill record. Business rules prevent self-endorsement and duplicate endorsements. The endorsement count on sys_user_has_skill is automatically incremented.',
                acceptance_criteria: '<ul><li>Endorse button appears next to each skill in search results</li><li>Clicking endorse creates a u_m2m_skill_endorsement record</li><li>u_peer_endorsement_count on sys_user_has_skill increments by 1</li><li>Self-endorsement is blocked with a user-friendly error message</li><li>Duplicate endorsement (same endorser + same skill record) is blocked</li><li>Endorser must have skill_user role</li></ul>',
                phase: 'Baseline',
                epic: 'Peer Endorsement'
            },
            {
                id: 'SH-004',
                short_description: 'As a manager, I want to view my team\'s skill matrix so I can assess skill coverage and gaps across my direct reports',
                description: 'The Manager Matrix widget displays a grid of all direct reports and their skills, including proficiency levels, interest levels, endorsement counts, and validation status. The widget only appears for users who have direct reports (manager field on sys_user). The tab is conditionally rendered in the Skills Hub container.',
                acceptance_criteria: '<ul><li>Manager Matrix tab only appears for users with at least one direct report</li><li>Matrix shows all direct reports as rows and their skills as columns/cards</li><li>Each cell shows proficiency level, interest level, endorsement count, and validation status</li><li>Manager can see which skills have been validated vs. pending</li><li>Non-managers do not see the Manager Matrix tab</li><li>Widget handles managers with up to 30 direct reports</li></ul>',
                phase: 'Baseline',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-005',
                short_description: 'As a manager, I want to validate a direct report\'s skill so I can confirm their proficiency level is accurate',
                description: 'From the Manager Matrix widget, a manager can validate a direct report\'s skill. Validation sets u_last_manager_validation to current date/time and u_validation_status to \'validated\'. The system verifies the caller is the user\'s actual manager before allowing the action. A business rule automatically sets validation status when u_last_manager_validation changes.',
                acceptance_criteria: '<ul><li>Validate action is available on each skill in the Manager Matrix</li><li>Only the user\'s direct manager can validate (server-side authorization check)</li><li>u_last_manager_validation is set to current GlideDateTime</li><li>u_validation_status is automatically set to \'validated\'</li><li>Validation is reflected immediately in the UI</li><li>Non-managers receive an error if they attempt validation</li></ul>',
                phase: 'Phase 2',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-006',
                short_description: 'As a manager, I want to dispute a direct report\'s self-assessed skill level so I can provide my own assessment when I disagree',
                description: 'From the Manager Matrix widget, a manager can dispute a skill by setting u_validation_status to \'disputed\', recording u_validation_notes with justification, and optionally setting u_manager_assessed_level to their own proficiency assessment. The employee is notified via email when a skill is disputed.',
                acceptance_criteria: '<ul><li>Dispute action is available alongside validate in the Manager Matrix</li><li>Manager can enter notes explaining the dispute (required field)</li><li>Manager can set their own assessed proficiency level (optional)</li><li>u_validation_status is set to \'disputed\'</li><li>Employee receives an email notification about the dispute</li><li>Only the user\'s direct manager can dispute (server-side check)</li></ul>',
                phase: 'Phase 2',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-007',
                short_description: 'As a manager, I want to bulk-validate all pending skills for a direct report so I can efficiently confirm multiple skills at once',
                description: 'The Manager Matrix widget provides a bulk validate button per employee that validates all skills with a non-validated status in a single operation. This calls the bulkValidate method in SkillsHubUtils which iterates through all sys_user_has_skill records for the specified user where u_validation_status is not \'validated\'.',
                acceptance_criteria: '<ul><li>Bulk Validate button appears per employee row in the Manager Matrix</li><li>Clicking bulk validate updates all non-validated skills for that employee</li><li>Each skill\'s u_last_manager_validation and u_validation_status are updated</li><li>Server-side authorization confirms caller is the employee\'s manager</li><li>UI refreshes to show all skills as validated</li><li>Button is disabled/hidden if all skills are already validated</li></ul>',
                phase: 'Phase 2',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-008',
                short_description: 'As a manager, I want to set an independent proficiency assessment for a direct report\'s skill so the organization can compare self-assessed vs manager-assessed levels',
                description: 'Managers can set u_manager_assessed_level on a direct report\'s sys_user_has_skill record independently of the validation workflow. This allows organizations to identify gaps between self-assessment and manager assessment. The widget displays both levels side-by-side with color coding when they differ.',
                acceptance_criteria: '<ul><li>Manager can set assessed level (novice/intermediate/proficient/advanced/expert) on any direct report\'s skill</li><li>Manager assessed level is stored separately from the employee\'s self-assessed level</li><li>Both levels are displayed in the Manager Matrix</li><li>Visual indicator (color coding) highlights when levels differ</li><li>Only the employee\'s direct manager can set this field</li><li>Assessment can be updated without changing validation status</li></ul>',
                phase: 'Phase 2',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-009',
                short_description: 'As an employee, I want to request a new skill be added to the catalog so I can track skills not yet in the system',
                description: 'A service catalog item (\'Request New Skill\') allows any authenticated user to submit a request for a new skill. The request captures skill_name, category (reference to cmn_skill_category), and justification. Requests are stored in u_skill_request with status tracking (pending/approved/rejected). Skill admins review and approve or reject requests.',
                acceptance_criteria: '<ul><li>Catalog item \'Request New Skill\' is available to all authenticated users</li><li>Form captures: skill name (required), category (reference picker), justification (multi-line text)</li><li>Submission creates a u_skill_request record with status \'pending\'</li><li>Requester receives email confirmation of submission</li><li>Skill admin can approve or reject the request</li><li>Approved requests trigger creation of the skill in cmn_skill</li><li>Requester is notified of approval or rejection with reason</li></ul>',
                phase: 'Phase 2',
                epic: 'Skill Catalog Management'
            },
            {
                id: 'SH-010',
                short_description: 'As a skill admin, I want to define required skills per job title so the organization can identify skill gaps at the role level',
                description: 'The u_skill_profile_requirement table allows skill admins to define which skills are required, preferred, or nice-to-have for each job title. Each record links a job title string to a cmn_skill reference with a required proficiency level and priority. This data feeds gap analysis reporting.',
                acceptance_criteria: '<ul><li>Skill admin can create profile requirement records</li><li>Each record specifies: job title, skill (cmn_skill reference), required level, priority (required/preferred/nice_to_have)</li><li>Records can be activated or deactivated</li><li>Only users with skill_admin or admin role can create/edit requirements</li><li>Requirements can be queried by job title to identify gaps for employees in that role</li></ul>',
                phase: 'Phase 1',
                epic: 'Skill Catalog Management'
            },
            {
                id: 'SH-011',
                short_description: 'As a system, I want to automatically expire skills not validated in over 12 months so the skill data stays current and accurate',
                description: 'A daily scheduled job (Skills Hub - Skill Expiration Check) runs at 02:00 and queries sys_user_has_skill for records where u_last_manager_validation is older than 12 months and u_validation_status is \'validated\'. These records are updated to u_validation_status = \'expired\', prompting managers to re-validate.',
                acceptance_criteria: '<ul><li>Scheduled job runs daily at 02:00</li><li>Identifies skills where u_last_manager_validation is more than 12 months ago</li><li>Only processes skills with u_validation_status = \'validated\'</li><li>Sets u_validation_status to \'expired\' for matching records</li><li>Does not affect skills that were never validated (status = \'pending\')</li><li>Job completes without errors for up to 10,000 skill records</li></ul>',
                phase: 'Phase 1',
                epic: 'Data Quality & Automation'
            },
            {
                id: 'SH-012',
                short_description: 'As a system, I want to send monthly reminders to managers about unvalidated skills so validation doesn\'t fall behind',
                description: 'A monthly scheduled job identifies managers whose direct reports have skills with u_validation_status = \'pending\' and sends a summary email listing which employees have unvalidated skills. This encourages regular skill validation cadence.',
                acceptance_criteria: '<ul><li>Scheduled job runs monthly</li><li>Identifies managers with direct reports who have pending/unvalidated skills</li><li>Sends one summary email per manager listing employees and their unvalidated skill count</li><li>Does not send email if all direct reports\' skills are validated</li><li>Email includes a link to the Skills Hub portal page</li></ul>',
                phase: 'Phase 2',
                epic: 'Data Quality & Automation'
            },
            {
                id: 'SH-013',
                short_description: 'As an employee, I want to see my gamification tier and points so I am motivated to develop and share my skills',
                description: 'The My Profile widget displays a tier badge with icon, total points, tier name, and a progress bar showing progress toward the next tier. Points are calculated in real-time from existing data: skills owned (+10), proficiency levels (+2 to +35), endorsements received (+5), endorsements given (+3), manager validations (+15), and skills added this quarter (+8). Five tiers: Starter (0-49), Contributor (50-149), Specialist (150-299), Trailblazer (300-499), Luminary (500+).',
                acceptance_criteria: '<ul><li>My Profile widget shows tier badge with FontAwesome icon</li><li>Total points are displayed and calculated from current data</li><li>Progress bar shows percentage toward next tier threshold</li><li>Points breakdown: skills owned (+10), proficiency bonus (+2 to +35 per level), endorsements received (+5 each), endorsements given (+3 each), validated skills (+15 each), skills added this quarter (+8 each)</li><li>Five tiers displayed correctly: Starter, Contributor, Specialist, Trailblazer, Luminary</li><li>Tier recalculates on page load (no stale cached values)</li></ul>',
                phase: 'Phase 3',
                epic: 'Gamification'
            },
            {
                id: 'SH-014',
                short_description: 'As an employee, I want to see a team leaderboard so I can compare my skill development progress with colleagues',
                description: 'A new Leaderboard widget displays users ranked by their gamification points within the same department. The leaderboard shows rank, user name, tier badge, total points, skill count, and endorsement count. It recalculates on demand and is accessible via the Skills Hub tab navigation.',
                acceptance_criteria: '<ul><li>Leaderboard widget displays users ranked by points within the viewer\'s department</li><li>Each row shows: rank, user avatar/name, tier icon, total points, skill count, endorsement count</li><li>Current user\'s row is highlighted</li><li>Leaderboard is accessible via the Skills Hub tab navigation</li><li>Results are paginated or limited to top 25</li><li>Rankings update on each page load</li></ul>',
                phase: 'Phase 3',
                epic: 'Gamification'
            },
            {
                id: 'SH-015',
                short_description: 'As an employee, I want to add a skill to my profile from the portal so I don\'t need to navigate to the backend sys_user_has_skill table',
                description: 'The My Profile widget includes an Add Skill modal that lets users search for skills from cmn_skill and add them to their profile. The modal supports selecting a proficiency level, interest level, and optionally linking the skill to multiple category groups. When submitted, a new sys_user_has_skill record is created.',
                acceptance_criteria: '<ul><li>Add Skill button appears on the My Profile widget</li><li>Modal opens with a searchable skill picker (from cmn_skill)</li><li>User can select proficiency level (novice to expert)</li><li>User can select interest level (high/neutral/low)</li><li>Submitting creates a sys_user_has_skill record for the logged-in user</li><li>Duplicate skill addition is prevented with a user-friendly message</li><li>Modal supports category group selection for cross-category skills</li></ul>',
                phase: 'Phase 3',
                epic: 'Employee Skill Portfolio'
            },
            {
                id: 'SH-016',
                short_description: 'As an employee, I want my skills grouped by name across categories so I can see related skills together instead of duplicated entries',
                description: 'When a skill name exists in multiple categories (e.g., \'Python\' in both \'Technology\' and \'Analytics\'), the My Profile widget groups them by name and shows category tags. The SkillsHubGrouping script include handles cross-category sync so that proficiency changes propagate to all instances of the same-named skill for the user.',
                acceptance_criteria: '<ul><li>Skills with the same name across categories are grouped into a single row</li><li>Category tags show which categories the skill belongs to</li><li>Changing proficiency on one instance updates all instances for that user</li><li>Grouping is handled server-side by SkillsHubGrouping script include</li><li>Business rule syncs proficiency changes across same-named skills automatically</li></ul>',
                phase: 'Phase 3',
                epic: 'Employee Skill Portfolio'
            },
            {
                id: 'SH-017',
                short_description: 'As a manager, I want inline validation controls in the Manager Matrix so I can validate or dispute skills without leaving the page',
                description: 'The Manager Matrix widget adds an inline validation modal: clicking a skill opens a modal showing the employee\'s self-assessed level, a dropdown for manager assessment, a notes field, and Validate/Dispute buttons. Filter and sort controls allow managers to view skills by validation status or identify the largest gaps between self and manager assessment.',
                acceptance_criteria: '<ul><li>Clicking a skill in the Manager Matrix opens an inline modal</li><li>Modal shows employee\'s self-assessed proficiency level</li><li>Manager can select their assessed level from a dropdown</li><li>Manager can enter validation notes</li><li>Validate button sets status to validated and records timestamp</li><li>Dispute button sets status to disputed with required notes</li><li>Filter controls allow filtering by validation status (pending/validated/disputed/expired)</li><li>Sort controls allow sorting by proficiency gap (self vs manager)</li></ul>',
                phase: 'Phase 3',
                epic: 'Manager Oversight'
            },
            {
                id: 'SH-018',
                short_description: 'As an employee, I want email notifications when my skills are validated or disputed so I stay informed about my skill status',
                description: 'Five email notification templates are configured: skill request submitted (to requester), skill request approved (to requester), skill request rejected (to requester with reason), skill validated by manager (to employee), and skill disputed by manager (to employee with notes). All notifications include a link to the Skills Hub portal page.',
                acceptance_criteria: '<ul><li>Employee receives email when a skill is validated by their manager</li><li>Employee receives email when a skill is disputed, including manager\'s notes</li><li>Requester receives confirmation email when a skill request is submitted</li><li>Requester receives email when a skill request is approved</li><li>Requester receives email when a skill request is rejected, including rejection reason</li><li>All emails include a direct link to the Skills Hub portal page</li></ul>',
                phase: 'Phase 2',
                epic: 'Notifications'
            },
            {
                id: 'SH-019',
                short_description: 'As a workforce planner, I want to see skill supply vs demand analytics so I can identify organizational skill gaps',
                description: 'A Performance Analytics dashboard with three tabs provides organizational skill intelligence. Tab 1 (Supply/Demand Overview) shows top skills demand over time, skill hours by category, and proficiency distribution. Tab 2 (Capacity Analysis) shows utilization gauges, demand heatmaps, and trending skills. Tab 3 (Growth Trends) tracks skill growth and story complexity trends. Six PA indicators and two breakdowns power the dashboard.',
                acceptance_criteria: '<ul><li>PA Dashboard has three tabs: Supply/Demand Overview, Capacity Analysis, Growth Trends</li><li>Supply indicator counts users per skill at each proficiency level</li><li>Demand indicator counts stories/tasks requiring each skill</li><li>Capacity Utilization shows supply-to-demand ratio per skill</li><li>Endorsement Velocity tracks endorsements per skill per month</li><li>Validation Rate shows percentage of skills validated by managers</li><li>Skill Growth tracks new skills added per month</li><li>Breakdowns available by department and proficiency level</li></ul>',
                phase: 'Phase 4',
                epic: 'Analytics & Reporting'
            },
            {
                id: 'SH-020',
                short_description: 'As a workforce planner, I want a gap analysis view showing where skill supply falls short of demand so I can prioritize training investments',
                description: 'A custom Gap Analysis widget identifies skills where supply (number of skilled employees) is less than demand (number of stories/tasks requiring that skill). Results are ranked by severity of the gap. The widget helps workforce planners and managers identify which skills need the most urgent development or hiring.',
                acceptance_criteria: '<ul><li>Gap Analysis widget shows skills where supply is less than demand</li><li>Each row shows: skill name, supply count, demand count, gap severity</li><li>Results are ranked by gap severity (largest gaps first)</li><li>Widget is accessible from the PA Dashboard or as a standalone page</li><li>Data refreshes on page load</li></ul>',
                phase: 'Phase 4',
                epic: 'Analytics & Reporting'
            },
            {
                id: 'SH-021',
                short_description: 'As a project manager, I want to tag stories with required skills so the system can calculate skill demand across the portfolio',
                description: 'The u_story_skill_assignment table creates a many-to-many relationship between stories (rm_story/task) and skills (cmn_skill). Each assignment record includes estimated hours and required proficiency level. This demand-side data feeds the PA indicators and gap analysis widget.',
                acceptance_criteria: '<ul><li>u_story_skill_assignment table is available with fields: story, skill, estimated_hours, proficiency_required, active</li><li>Story reference works with rm_story (or falls back to task table)</li><li>Skill reference links to cmn_skill</li><li>Proficiency required defaults to intermediate</li><li>Estimated hours accepts decimal values</li><li>Records can be deactivated without deletion</li></ul>',
                phase: 'Phase 4',
                epic: 'Analytics & Reporting'
            },
            {
                id: 'SH-022',
                short_description: 'As a system, I want to auto-detect required skills from story descriptions so project managers don\'t have to manually tag every story',
                description: 'The SkillsHubDetection script include provides a detectSkillsInText method that pattern-matches story descriptions against the cmn_skill catalog to auto-suggest skill tags for stories. This reduces the manual effort of tagging stories with required skills and improves demand data accuracy.',
                acceptance_criteria: '<ul><li>SkillsHubDetection.detectSkillsInText accepts a text string parameter</li><li>Method matches text against skill names in cmn_skill</li><li>Returns array of matched skills with confidence indicators</li><li>Matching is case-insensitive</li><li>Partial word matches are excluded to avoid false positives (e.g., \'Java\' does not match \'JavaScript\')</li><li>Results can be used to auto-create u_story_skill_assignment records</li></ul>',
                phase: 'Phase 4',
                epic: 'Data Quality & Automation'
            },
            {
                id: 'SH-023',
                short_description: 'As an admin, I want role-based access controls on all Skills Hub tables so data is protected according to organizational policies',
                description: 'ACLs enforce role-based access across all Skills Hub tables. Endorsement create/read requires skill_user role. Endorsement write/delete is restricted to the endorser or admin. Manager-only fields (assessed level, validation status, notes) require the viewer to be the employee\'s direct manager or an admin. Skill requests can be created by any authenticated user but only modified by skill_admin. Profile requirements are admin-only.',
                acceptance_criteria: '<ul><li>u_m2m_skill_endorsement: READ and CREATE require skill_user role</li><li>u_m2m_skill_endorsement: WRITE and DELETE restricted to endorser or admin</li><li>sys_user_has_skill.u_interest_level: WRITE restricted to record owner</li><li>sys_user_has_skill.u_manager_assessed_level: WRITE restricted to employee\'s manager or admin</li><li>sys_user_has_skill.u_validation_status: WRITE restricted to employee\'s manager or admin</li><li>u_skill_request: CREATE open to authenticated users; WRITE restricted to skill_admin or admin</li><li>u_skill_profile_requirement: CRUD restricted to admin only</li><li>u_skill_category_group: CRUD restricted to skill_admin or admin</li></ul>',
                phase: 'Phase 1',
                epic: 'Security & Access Control'
            },
            {
                id: 'SH-024',
                short_description: 'As a system, I want business rules to maintain endorsement count integrity so the count always reflects the actual number of endorsement records',
                description: 'Two business rules on u_m2m_skill_endorsement maintain the u_peer_endorsement_count field on sys_user_has_skill. An after-insert rule increments the count. An after-delete rule decrements the count. Two before-insert rules prevent self-endorsement and duplicate endorsements with user-friendly abort messages.',
                acceptance_criteria: '<ul><li>After-insert business rule increments u_peer_endorsement_count on the target sys_user_has_skill record</li><li>After-delete business rule decrements u_peer_endorsement_count (minimum 0)</li><li>Before-insert rule aborts with message if endorser equals the skill owner</li><li>Before-insert rule aborts with message if endorser has already endorsed the same skill record</li><li>Count stays accurate even under concurrent endorsement activity</li></ul>',
                phase: 'Phase 1',
                epic: 'Data Quality & Automation'
            },
            {
                id: 'SH-025',
                short_description: 'As an admin, I want Skills Hub navigation modules in the ServiceNow left nav so users can easily access the portal from the platform UI',
                description: 'Four navigation modules are created under a Skills Hub application menu in the ServiceNow left nav: My Portfolio, Find Expert, Manager View, and Leaderboard. Each module links to the skills_hub Service Portal page with the appropriate tab pre-selected. The navigation supports both desktop and mobile layouts.',
                acceptance_criteria: '<ul><li>Skills Hub application menu appears in the ServiceNow left navigation</li><li>Four modules: My Portfolio, Find Expert, Manager View, Leaderboard</li><li>Each module opens the skills_hub portal page with the correct tab selected</li><li>Manager View module is visible to users with skill_manager or admin role</li><li>Navigation renders correctly on both desktop and mobile</li></ul>',
                phase: 'Phase 3',
                epic: 'Navigation & UI'
            },
            {
                id: 'SH-026',
                short_description: 'As an employee, I want tab navigation in the Skills Hub portal so I can easily switch between My Portfolio, Find an Expert, and Leaderboard views',
                description: 'A Tab Navigation widget provides a horizontal tab bar at the top of the Skills Hub page with tabs for My Portfolio, Find an Expert, and Leaderboard. The Manager Matrix tab is conditionally shown only for users with direct reports. Tab selection is handled client-side without full page reload.',
                acceptance_criteria: '<ul><li>Tab bar displays at the top of the Skills Hub page</li><li>Three default tabs: My Portfolio, Find an Expert, Leaderboard</li><li>Manager Matrix tab appears only for users with direct reports</li><li>Tab switching does not cause a full page reload</li><li>Active tab is visually highlighted</li><li>Tab state persists if user refreshes the page (URL parameter)</li></ul>',
                phase: 'Phase 3',
                epic: 'Navigation & UI'
            },
            {
                id: 'SH-027',
                short_description: 'As a skill admin, I want to group skills across categories so related skills in different domains are linked together',
                description: 'The u_skill_category_group and u_m2m_skill_category_group tables allow skill admins to create named groups (e.g., \'Data Science\') and link skills from multiple categories into the group. This supports the cross-category grouping display in the My Profile widget and ensures proficiency sync across same-named skills.',
                acceptance_criteria: '<ul><li>Skill admin can create category groups with a name and description</li><li>Skills can be linked to groups via the junction table u_m2m_skill_category_group</li><li>A skill can belong to multiple groups</li><li>A group can contain skills from different cmn_skill_category records</li><li>Only skill_admin or admin can manage groups</li><li>Groups are used by the My Profile widget for display grouping</li></ul>',
                phase: 'Phase 1',
                epic: 'Skill Catalog Management'
            }
        ];
        
        // ============================================================
        // Configuration - update these before running
        // ============================================================
        // var PRODUCT_SYS_ID = '';  // Optional: sys_id of your rm_product if you want to link stories to a product
        // var SPRINT_SYS_ID = '';   // Optional: sys_id of an rm_sprint to assign stories to
        
        // ============================================================
        // Execution
        // ============================================================
        var created = 0;
        var skipped = 0;
        var errors = 0;
        
        for (var i = 0; i < stories.length; i++) {
            var s = stories[i];
        
            // Check if story already exists (by short_description prefix match using the ID)
            var check = new GlideRecord('rm_story');
            check.addQuery('short_description', 'CONTAINS', s.short_description.substring(0, 80));
            check.setLimit(1);
            check.query();
        
            if (check.hasNext()) {
                gs.info('SKIPPED (already exists): ' + s.id + ' - ' + s.short_description.substring(0, 60));
                skipped++;
                continue;
            }
        
            try {
                var gr = new GlideRecord('rm_story');
                gr.initialize();
                gr.setValue('short_description', s.short_description);
                gr.setValue('description', s.description);
                gr.setValue('acceptance_criteria', s.acceptance_criteria);
        
                // Uncomment if you set the product/sprint sys_ids above
                // if (PRODUCT_SYS_ID) gr.setValue('product', PRODUCT_SYS_ID);
                // if (SPRINT_SYS_ID) gr.setValue('sprint', SPRINT_SYS_ID);
        
                var sys_id = gr.insert();
        
                if (sys_id) {
                    gs.info('CREATED: ' + s.id + ' | ' + sys_id + ' | ' + s.short_description.substring(0, 60));
                    created++;
                } else {
                    gs.error('FAILED TO INSERT: ' + s.id + ' - ' + s.short_description.substring(0, 60));
                    errors++;
                }
            } catch (e) {
                gs.error('ERROR creating ' + s.id + ': ' + e.message);
                errors++;
            }
        }
        
        gs.info('========================================');
        gs.info('Skills Hub User Stories - Complete');
        gs.info('Created: ' + created + ' | Skipped: ' + skipped + ' | Errors: ' + errors);
        gs.info('Total stories processed: ' + stories.length);
        gs.info('========================================');

        _sectionResults.push({ section: 23, name: 'USER STORIES (34)', status: 'OK' });
        gs.info('[Skills Hub] ========== SECTION 23: USER STORIES (34) - COMPLETE ==========');
    } catch (_sectionErr23) {
        gs.error('[Skills Hub] SECTION 23 FATAL ERROR (USER STORIES (34)): ' + _sectionErr23.message);
        _sectionResults.push({ section: 23, name: 'USER STORIES (34)', status: 'ERROR: ' + _sectionErr23.message });
    }


    // ==================================================================
    // MASTER SUMMARY
    // ==================================================================
    var _masterEnd = new GlideDateTime();
    gs.info('[Skills Hub] ============================================================');
    gs.info('[Skills Hub]  CONSOLIDATED FIX SCRIPT - COMPLETE');
    gs.info('[Skills Hub]  Started:  ' + _masterStart.getDisplayValue());
    gs.info('[Skills Hub]  Finished: ' + _masterEnd.getDisplayValue());
    gs.info('[Skills Hub]  Sections processed: ' + _sectionResults.length + ' / 23');
    gs.info('[Skills Hub] ------------------------------------------------------------');
    var _okCount = 0;
    var _errCount = 0;
    for (var _ri = 0; _ri < _sectionResults.length; _ri++) {
        var _r = _sectionResults[_ri];
        if (_r.status === 'OK') {
            _okCount++;
        } else {
            _errCount++;
        }
        gs.info('[Skills Hub]  Section ' + _r.section + ' (' + _r.name + '): ' + _r.status);
    }
    gs.info('[Skills Hub] ------------------------------------------------------------');
    gs.info('[Skills Hub]  Sections OK:    ' + _okCount);
    gs.info('[Skills Hub]  Sections ERROR: ' + _errCount);
    gs.info('[Skills Hub] ============================================================');

})();
