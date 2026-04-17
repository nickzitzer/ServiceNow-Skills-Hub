/**
 * Fix Script: 17_verification_phase2.js
 * Purpose: Comprehensive verification of all Skills Hub Phase 2 artifacts
 * Scope: Global
 * Idempotent: Yes - read-only checks, safe to re-run any time
 *
 * Verifies:
 *   1. Update Set "Skills Hub - Phase 2 - Process & Workflow"
 *   2. Catalog Category "Skills Hub"
 *   3. Catalog Item "Request New Skill"
 *   4. Catalog Variables (3) on the catalog item
 *   5. Business Rules (2) for workflow
 *   6. Notifications (5)
 *   7. Script Include SkillsHubUtils Phase 2 methods
 *   8. Widget updates (Find Expert + Manager Matrix)
 *   9. Scheduled Job (1) - Monthly Validation Reminder
 *  10. Event Registration - skills_hub.validation_reminder
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Run all Phase 2 scripts (10 through 16) first
 */
(function() {
    try {
        // ================================================================
        // Tracking
        // ================================================================
        var totalPass = 0;
        var totalFail = 0;
        var results = [];

        function pass(label) {
            totalPass++;
            results.push({ status: 'pass', label: label });
            gs.info('[Skills Hub] \u2713 ' + label);
        }

        function fail(label) {
            totalFail++;
            results.push({ status: 'fail', label: label });
            gs.info('[Skills Hub] \u2717 MISSING: ' + label);
        }

        function recordExists(table, query) {
            var gr = new GlideRecord(table);
            gr.addEncodedQuery(query);
            gr.setLimit(1);
            gr.query();
            return gr.hasNext();
        }

        function getRecord(table, query) {
            var gr = new GlideRecord(table);
            gr.addEncodedQuery(query);
            gr.setLimit(1);
            gr.query();
            if (gr.next()) {
                return gr;
            }
            return null;
        }

        function countRecords(table, query) {
            var gr = new GlideRecord(table);
            if (query) {
                gr.addEncodedQuery(query);
            }
            gr.query();
            var count = 0;
            while (gr.next()) {
                count++;
            }
            return count;
        }

        gs.info('[Skills Hub] ===== PHASE 2 VERIFICATION =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        gs.info('[Skills Hub]');

        // ============================================================
        // 1. UPDATE SET
        // ============================================================
        var UPDATE_SET_NAME = 'Skills Hub - Phase 2 - Process & Workflow';
        if (recordExists('sys_update_set', 'name=' + UPDATE_SET_NAME)) {
            pass('Update Set "' + UPDATE_SET_NAME + '" exists');
        } else {
            fail('Update Set "' + UPDATE_SET_NAME + '"');
        }

        // ============================================================
        // 2. CATALOG CATEGORY
        // ============================================================
        if (recordExists('sc_category', 'title=Skills Hub')) {
            pass('Catalog Category "Skills Hub" exists');
        } else {
            fail('Catalog Category "Skills Hub"');
        }

        // ============================================================
        // 3. CATALOG ITEM
        // ============================================================
        var catItemRec = getRecord('sc_cat_item', 'name=Request New Skill');
        if (catItemRec) {
            pass('Catalog Item "Request New Skill" exists');
        } else {
            fail('Catalog Item "Request New Skill"');
        }

        // ============================================================
        // 4. CATALOG VARIABLES (3 expected on "Request New Skill")
        // ============================================================
        var expectedVars = ['u_skill_name', 'u_skill_category', 'u_justification'];

        if (catItemRec) {
            var catItemId = catItemRec.getUniqueValue();
            for (var v = 0; v < expectedVars.length; v++) {
                var varName = expectedVars[v];
                if (recordExists('item_option_new', 'cat_item=' + catItemId + '^name=' + varName)) {
                    pass('Catalog Variable "' + varName + '" on Request New Skill');
                } else {
                    fail('Catalog Variable "' + varName + '" on Request New Skill');
                }
            }
        } else {
            // Cannot check variables without the catalog item
            for (var vf = 0; vf < expectedVars.length; vf++) {
                fail('Catalog Variable "' + expectedVars[vf] + '" (catalog item missing)');
            }
        }

        // ============================================================
        // 5. BUSINESS RULES (2 expected)
        // ============================================================
        var expectedBRs = [
            { name: 'Skills Hub - Create Skill Request on RITM', collection: 'sc_req_item' },
            { name: 'Skills Hub - Process Skill Request Approval', collection: 'u_skill_request' }
        ];

        for (var b = 0; b < expectedBRs.length; b++) {
            var br = expectedBRs[b];
            if (recordExists('sys_script', 'name=' + br.name + '^collection=' + br.collection)) {
                pass('Business Rule "' + br.name + '" on ' + br.collection);
            } else {
                fail('Business Rule "' + br.name + '" on ' + br.collection);
            }
        }

        // ============================================================
        // 6. NOTIFICATIONS (5 expected)
        // ============================================================
        var expectedNotifications = [
            'Skills Hub - Skill Request Submitted',
            'Skills Hub - Skill Request Approved',
            'Skills Hub - Skill Request Rejected',
            'Skills Hub - Skill Validated by Manager',
            'Skills Hub - Skill Endorsed'
        ];

        for (var n = 0; n < expectedNotifications.length; n++) {
            var notifName = expectedNotifications[n];
            if (recordExists('sysevent_email_action', 'name=' + notifName)) {
                pass('Notification "' + notifName + '"');
            } else {
                fail('Notification "' + notifName + '"');
            }
        }

        // ============================================================
        // 7. SCRIPT INCLUDE - SkillsHubUtils Phase 2 methods
        // ============================================================
        var expectedMethods = ['validateSkill', 'disputeSkill', 'bulkValidate', 'setManagerAssessment', 'endorseSkill'];
        var siRec = getRecord('sys_script_include', 'name=SkillsHubUtils^active=true');

        if (siRec) {
            pass('Script Include "SkillsHubUtils" exists and is active');
            var siScript = siRec.getValue('script') || '';

            for (var m = 0; m < expectedMethods.length; m++) {
                var methodName = expectedMethods[m];
                if (siScript.indexOf(methodName) >= 0) {
                    pass('SkillsHubUtils contains method "' + methodName + '"');
                } else {
                    fail('SkillsHubUtils method "' + methodName + '"');
                }
            }
        } else {
            fail('Script Include "SkillsHubUtils"');
            for (var mf = 0; mf < expectedMethods.length; mf++) {
                fail('SkillsHubUtils method "' + expectedMethods[mf] + '" (script include missing)');
            }
        }

        // ============================================================
        // 8. WIDGET UPDATES (Find Expert + Manager Matrix)
        //    Check that server scripts contain endorsement/validation logic
        // ============================================================
        var widgetChecks = [
            { name: 'Skills Hub - Find Expert', keyword: 'endorse', label: 'Find Expert widget contains endorsement logic' },
            { name: 'Skills Hub - Manager Matrix', keyword: 'validate', label: 'Manager Matrix widget contains validation logic' }
        ];

        for (var w = 0; w < widgetChecks.length; w++) {
            var wc = widgetChecks[w];
            var widgetRec = getRecord('sp_widget', 'name=' + wc.name);

            if (widgetRec) {
                var serverScript = widgetRec.getValue('script') || '';
                if (serverScript.toLowerCase().indexOf(wc.keyword) >= 0) {
                    pass(wc.label);
                } else {
                    fail(wc.label + ' (widget exists but keyword "' + wc.keyword + '" not found in server script)');
                }
            } else {
                fail(wc.label + ' (widget "' + wc.name + '" not found)');
            }
        }

        // ============================================================
        // 9. SCHEDULED JOB (1 expected)
        // ============================================================
        var jobName = 'Skills Hub - Monthly Validation Reminder';
        var jobFound = recordExists('sysauto_script', 'name=' + jobName);
        if (!jobFound) {
            jobFound = recordExists('sys_trigger', 'name=' + jobName);
        }

        if (jobFound) {
            pass('Scheduled Job "' + jobName + '"');
        } else {
            fail('Scheduled Job "' + jobName + '"');
        }

        // ============================================================
        // 10. EVENT REGISTRATION
        // ============================================================
        if (recordExists('sysevent_register', 'event_name=skills_hub.validation_reminder')) {
            pass('Event Registration "skills_hub.validation_reminder"');
        } else {
            fail('Event Registration "skills_hub.validation_reminder"');
        }

        // ============================================================
        // BONUS: Update Set record capture count
        // ============================================================
        var usRec = getRecord('sys_update_set', 'name=' + UPDATE_SET_NAME);
        if (usRec) {
            var usId = usRec.getUniqueValue();
            var capturedCount = countRecords('sys_update_xml', 'update_set=' + usId);
            gs.info('[Skills Hub]');
            gs.info('[Skills Hub] Update Set records captured: ' + capturedCount);
        }

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        var totalChecks = totalPass + totalFail;

        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] ===== RESULTS: ' + totalPass + '/' + totalChecks + ' checks passed =====');

        if (totalFail > 0) {
            gs.info('[Skills Hub]');
            gs.info('[Skills Hub] --- FAILURES ---');
            for (var i = 0; i < results.length; i++) {
                if (results[i].status === 'fail') {
                    gs.warn('[Skills Hub] \u2717 ' + results[i].label);
                }
            }
        } else {
            gs.info('[Skills Hub] All checks passed - Phase 2 deployment verified successfully.');
        }

        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] ===== END PHASE 2 VERIFICATION =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 17_verification_phase2: ' + e.message);
    }
})();
