/**
 * 06_create_business_rules.js
 * Creates business rules and scheduled job for Skills Hub.
 * Idempotent: checks for existing records before creating.
 * Target: sys_script table (business rules), sysauto_script table (scheduled job)
 */
(function() {
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
})();
