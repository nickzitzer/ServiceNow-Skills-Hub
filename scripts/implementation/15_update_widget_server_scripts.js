/**
 * Fix Script: 15_update_widget_server_scripts.js
 * Purpose: Patch Service Portal widget server scripts to add missing action handlers
 * Scope: Global
 * Idempotent: Yes - checks if action keywords already exist before injecting
 *
 * Patches:
 *   - Manager Matrix widget: adds validate, dispute, bulkValidate server handlers
 *   - Find Expert widget: adds endorse server handler
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: SP widgets must already exist (from update set import)
 */
(function() {
    try {
        var results = {
            widgetsPatched: 0,
            widgetsSkipped: 0,
            errors: []
        };

        gs.info('[Skills Hub] ===== STARTING WIDGET SERVER SCRIPT PATCHES =====');

        // ================================================================
        // MANAGER MATRIX WIDGET - validate / dispute / bulkValidate handlers
        // ================================================================
        gs.info('[Skills Hub] --- Patching Manager Matrix Widget ---');

        var managerMatrixScript = '(function() {\n' +
            '    if (input && input.action == "validate") {\n' +
            '        var userId = input.userId;\n' +
            '        var skillName = input.skillName;\n' +
            '        var managerId = gs.getUserID();\n' +
            '        \n' +
            '        // Verify caller is the user\'s manager\n' +
            '        var userGR = new GlideRecord(\'sys_user\');\n' +
            '        if (!userGR.get(userId) || userGR.manager.toString() != managerId) {\n' +
            '            data.result = { success: false, error: \'Not authorized\' };\n' +
            '            return;\n' +
            '        }\n' +
            '        \n' +
            '        var gr = new GlideRecord(\'sys_user_has_skill\');\n' +
            '        gr.addQuery(\'user\', userId);\n' +
            '        gr.addQuery(\'skill.name\', skillName);\n' +
            '        gr.query();\n' +
            '        if (gr.next()) {\n' +
            '            gr.u_validation_status = \'validated\';\n' +
            '            gr.u_last_manager_validation = new GlideDateTime();\n' +
            '            gr.update();\n' +
            '            data.result = { success: true };\n' +
            '        } else {\n' +
            '            data.result = { success: false, error: \'Skill not found\' };\n' +
            '        }\n' +
            '    }\n' +
            '    \n' +
            '    if (input && input.action == "dispute") {\n' +
            '        var dUserId = input.userId;\n' +
            '        var dSkillName = input.skillName;\n' +
            '        var notes = input.notes || \'\';\n' +
            '        var assessedLevel = input.assessedLevel || \'\';\n' +
            '        var dManagerId = gs.getUserID();\n' +
            '        \n' +
            '        var dUserGR = new GlideRecord(\'sys_user\');\n' +
            '        if (!dUserGR.get(dUserId) || dUserGR.manager.toString() != dManagerId) {\n' +
            '            data.result = { success: false, error: \'Not authorized\' };\n' +
            '            return;\n' +
            '        }\n' +
            '        \n' +
            '        var dGr = new GlideRecord(\'sys_user_has_skill\');\n' +
            '        dGr.addQuery(\'user\', dUserId);\n' +
            '        dGr.addQuery(\'skill.name\', dSkillName);\n' +
            '        dGr.query();\n' +
            '        if (dGr.next()) {\n' +
            '            dGr.u_validation_status = \'disputed\';\n' +
            '            dGr.u_validation_notes = notes;\n' +
            '            if (assessedLevel) dGr.u_manager_assessed_level = assessedLevel;\n' +
            '            dGr.update();\n' +
            '            data.result = { success: true };\n' +
            '        } else {\n' +
            '            data.result = { success: false, error: \'Skill not found\' };\n' +
            '        }\n' +
            '    }\n' +
            '    \n' +
            '    if (input && input.action == "bulkValidate") {\n' +
            '        var bUserId = input.userId;\n' +
            '        var bManagerId = gs.getUserID();\n' +
            '        \n' +
            '        var bUserGR = new GlideRecord(\'sys_user\');\n' +
            '        if (!bUserGR.get(bUserId) || bUserGR.manager.toString() != bManagerId) {\n' +
            '            data.result = { success: false, error: \'Not authorized\' };\n' +
            '            return;\n' +
            '        }\n' +
            '        \n' +
            '        var count = 0;\n' +
            '        var bGr = new GlideRecord(\'sys_user_has_skill\');\n' +
            '        bGr.addQuery(\'user\', bUserId);\n' +
            '        bGr.addQuery(\'u_validation_status\', \'!=\', \'validated\');\n' +
            '        bGr.query();\n' +
            '        while (bGr.next()) {\n' +
            '            bGr.u_validation_status = \'validated\';\n' +
            '            bGr.u_last_manager_validation = new GlideDateTime();\n' +
            '            bGr.update();\n' +
            '            count++;\n' +
            '        }\n' +
            '        data.result = { success: true, count: count };\n' +
            '    }\n' +
            '})();';

        var mmGr = new GlideRecord('sp_widget');
        mmGr.addQuery('name', 'CONTAINS', 'Manager Matrix');
        mmGr.query();

        if (mmGr.next()) {
            var mmCurrent = mmGr.getValue('script') || '';
            if (mmCurrent.indexOf('validate') > -1 && mmCurrent.indexOf('dispute') > -1 && mmCurrent.indexOf('bulkValidate') > -1) {
                gs.info('[Skills Hub] Manager Matrix widget already has validate/dispute/bulkValidate handlers - skipping');
                results.widgetsSkipped++;
            } else {
                if (!mmCurrent || mmCurrent.trim() === '') {
                    // Empty server script - replace entirely
                    mmGr.setValue('script', managerMatrixScript);
                    mmGr.update();
                    gs.info('[Skills Hub] Manager Matrix widget: injected full server script (was empty)');
                } else {
                    // Has existing script - prepend the action handlers
                    mmGr.setValue('script', managerMatrixScript + '\n\n// --- Original server script below ---\n' + mmCurrent);
                    mmGr.update();
                    gs.info('[Skills Hub] Manager Matrix widget: prepended action handlers to existing server script');
                }
                results.widgetsPatched++;
            }
        } else {
            // Try alternate name pattern
            mmGr = new GlideRecord('sp_widget');
            mmGr.addQuery('name', 'CONTAINS', 'Skills Hub');
            mmGr.addQuery('name', 'CONTAINS', 'Manager');
            mmGr.query();
            if (mmGr.next()) {
                var mmAltCurrent = mmGr.getValue('script') || '';
                if (mmAltCurrent.indexOf('validate') > -1 && mmAltCurrent.indexOf('dispute') > -1) {
                    gs.info('[Skills Hub] Manager Matrix widget (alt name) already has action handlers - skipping');
                    results.widgetsSkipped++;
                } else {
                    if (!mmAltCurrent || mmAltCurrent.trim() === '') {
                        mmGr.setValue('script', managerMatrixScript);
                    } else {
                        mmGr.setValue('script', managerMatrixScript + '\n\n// --- Original server script below ---\n' + mmAltCurrent);
                    }
                    mmGr.update();
                    gs.info('[Skills Hub] Manager Matrix widget (alt name): injected action handlers');
                    results.widgetsPatched++;
                }
            } else {
                var msg = 'Manager Matrix widget not found (searched "Manager Matrix" and "Skills Hub + Manager")';
                gs.warn('[Skills Hub] ' + msg);
                results.errors.push(msg);
            }
        }

        // ================================================================
        // FIND EXPERT WIDGET - endorse handler
        // ================================================================
        gs.info('[Skills Hub] --- Patching Find Expert Widget ---');

        var endorseBlock = 'if (input && input.action == "endorse") {\n' +
            '    var skillRecordId = input.skillRecordId;\n' +
            '    var endorserId = gs.getUserID();\n' +
            '    \n' +
            '    var skillRec = new GlideRecord(\'sys_user_has_skill\');\n' +
            '    if (!skillRec.get(skillRecordId)) {\n' +
            '        data.endorseResult = { success: false, error: \'Skill record not found\' };\n' +
            '    } else if (skillRec.user.toString() == endorserId) {\n' +
            '        data.endorseResult = { success: false, error: \'Cannot endorse your own skill\' };\n' +
            '    } else {\n' +
            '        var dup = new GlideRecord(\'u_m2m_skill_endorsement\');\n' +
            '        dup.addQuery(\'u_skill_record\', skillRecordId);\n' +
            '        dup.addQuery(\'u_endorser\', endorserId);\n' +
            '        dup.query();\n' +
            '        if (dup.hasNext()) {\n' +
            '            data.endorseResult = { success: false, error: \'Already endorsed\' };\n' +
            '        } else {\n' +
            '            var endorse = new GlideRecord(\'u_m2m_skill_endorsement\');\n' +
            '            endorse.initialize();\n' +
            '            endorse.u_skill_record = skillRecordId;\n' +
            '            endorse.u_endorser = endorserId;\n' +
            '            endorse.insert();\n' +
            '            data.endorseResult = { success: true };\n' +
            '        }\n' +
            '    }\n' +
            '}\n';

        var feGr = new GlideRecord('sp_widget');
        feGr.addQuery('name', 'CONTAINS', 'Find Expert');
        feGr.query();

        if (feGr.next()) {
            var feCurrent = feGr.getValue('script') || '';
            if (feCurrent.indexOf('endorse') > -1) {
                gs.info('[Skills Hub] Find Expert widget already has endorse handler - skipping');
                results.widgetsSkipped++;
            } else {
                if (!feCurrent || feCurrent.trim() === '') {
                    // Empty server script - wrap in IIFE
                    var feFullScript = '(function() {\n' + endorseBlock + '})();';
                    feGr.setValue('script', feFullScript);
                    feGr.update();
                    gs.info('[Skills Hub] Find Expert widget: injected endorse handler (was empty)');
                } else {
                    // Has existing script - prepend endorse block before existing logic
                    // If wrapped in IIFE, inject inside it; otherwise prepend
                    var trimmed = feCurrent.trim();
                    if (trimmed.indexOf('(function()') === 0) {
                        // Find the opening brace of the IIFE body
                        var braceIdx = trimmed.indexOf('{');
                        if (braceIdx > -1) {
                            var injected = trimmed.substring(0, braceIdx + 1) + '\n' +
                                '    // --- Endorse handler (injected by 15_update_widget_server_scripts) ---\n' +
                                '    ' + endorseBlock.replace(/\n/g, '\n    ') + '\n' +
                                trimmed.substring(braceIdx + 1);
                            feGr.setValue('script', injected);
                            feGr.update();
                            gs.info('[Skills Hub] Find Expert widget: injected endorse handler inside existing IIFE');
                        }
                    } else {
                        // Not an IIFE - prepend
                        feGr.setValue('script', endorseBlock + '\n' + feCurrent);
                        feGr.update();
                        gs.info('[Skills Hub] Find Expert widget: prepended endorse handler');
                    }
                }
                results.widgetsPatched++;
            }
        } else {
            var feMsg = 'Find Expert widget not found (searched "Find Expert")';
            gs.warn('[Skills Hub] ' + feMsg);
            results.errors.push(feMsg);
        }

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== WIDGET PATCH SUMMARY =====');
        gs.info('[Skills Hub] Widgets patched: ' + results.widgetsPatched);
        gs.info('[Skills Hub] Widgets skipped (already patched): ' + results.widgetsSkipped);
        gs.info('[Skills Hub] Errors: ' + results.errors.length);
        if (results.errors.length > 0) {
            for (var i = 0; i < results.errors.length; i++) {
                gs.error('[Skills Hub] Error: ' + results.errors[i]);
            }
        }
        gs.info('[Skills Hub] ================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 15_update_widget_server_scripts: ' + e.message);
    }
})();
