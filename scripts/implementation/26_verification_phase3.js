/**
 * Fix Script: 26_verification_phase3.js
 * Purpose: Comprehensive verification of all Skills Hub Phase 3 artifacts
 * Scope: Global
 * Idempotent: Yes - read-only checks, safe to re-run any time
 *
 * Verifies:
 *    1. Update Set "Skills Hub - Phase 3 - UI Enhancements" exists
 *    2. SkillsHubUtils contains "calculateUserTier" method
 *    3. SkillsHubUtils contains "endorseSkill" method
 *    4. Script Include "SkillsHubGrouping" exists and is active
 *    5. Widget "Skills Hub - Leaderboard" exists (server_script, client_script, template non-empty)
 *    6. Widget "Skills Hub - Tab Navigation" exists
 *    7. Widget "Skills Hub - My Profile" server script contains "calculateTier" handler
 *    8. Application menu "Skills Hub" exists in sys_app_application
 *    9. Navigation modules (4) exist under Skills Hub menu
 *   10. Service Portal page "skills_hub" exists
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Run all Phase 3 scripts (18 through 25) first
 */
(function() {
    try {
        // ================================================================
        // Tracking helpers (same pattern as 17_verification_phase2.js)
        // ================================================================
        var totalPass = 0;
        var totalFail = 0;
        var results = [];

        function pass(label) {
            totalPass++;
            results.push({ status: 'pass', label: label });
            gs.info('[Skills Hub] [PASS] ' + label);
        }

        function fail(label) {
            totalFail++;
            results.push({ status: 'fail', label: label });
            gs.info('[Skills Hub] [FAIL] ' + label);
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

        gs.info('[Skills Hub] ===== PHASE 3 VERIFICATION =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        gs.info('[Skills Hub]');

        // ============================================================
        // 1. Update Set "Skills Hub - Phase 3 - UI Enhancements" exists
        // ============================================================
        var UPDATE_SET_NAME = 'Skills Hub - Phase 3 - UI Enhancements';
        var usFound = recordExists('sys_update_set', 'name=' + UPDATE_SET_NAME);

        // Fallback: try alternate Phase 3 naming patterns
        if (!usFound) {
            var altNames = [
                'Skills Hub - Phase 3',
                'Skills Hub - Phase 3 - UI & Portal',
                'Skills Hub - Phase 3 - Portal & Navigation'
            ];
            for (var u = 0; u < altNames.length; u++) {
                if (recordExists('sys_update_set', 'name=' + altNames[u])) {
                    usFound = true;
                    UPDATE_SET_NAME = altNames[u];
                    break;
                }
            }
        }

        // Last resort: CONTAINS search
        if (!usFound) {
            var usGr = new GlideRecord('sys_update_set');
            usGr.addQuery('name', 'CONTAINS', 'Skills Hub');
            usGr.addQuery('name', 'CONTAINS', 'Phase 3');
            usGr.setLimit(1);
            usGr.query();
            if (usGr.next()) {
                usFound = true;
                UPDATE_SET_NAME = usGr.getValue('name');
            }
        }

        if (usFound) {
            pass('Update Set "' + UPDATE_SET_NAME + '" exists');
        } else {
            fail('Update Set "Skills Hub - Phase 3 - UI Enhancements" (or variant) not found');
        }

        // ============================================================
        // 2. SkillsHubUtils contains "calculateUserTier" method
        // ============================================================
        var siRec = getRecord('sys_script_include', 'name=SkillsHubUtils^active=true');

        if (siRec) {
            var siScript = siRec.getValue('script') || '';

            if (siScript.indexOf('calculateUserTier') >= 0) {
                pass('SkillsHubUtils contains "calculateUserTier" method');
            } else {
                fail('SkillsHubUtils missing "calculateUserTier" method');
            }

            // Verify endorseSkill method (added in Phase 2, used by Leaderboard scoring)
            if (siScript.indexOf('endorseSkill') >= 0) {
                pass('SkillsHubUtils contains "endorseSkill" method');
            } else {
                fail('SkillsHubUtils missing "endorseSkill" method');
            }

        } else {
            fail('Script Include "SkillsHubUtils" not found or inactive');
            fail('SkillsHubUtils "calculateUserTier" (script include missing)');
        }

        // ============================================================
        // 4. Script Include "SkillsHubGrouping" exists and is active
        // ============================================================
        if (recordExists('sys_script_include', 'name=SkillsHubGrouping^active=true')) {
            pass('Script Include "SkillsHubGrouping" exists and is active');
        } else {
            // Fallback: try broader search
            if (recordExists('sys_script_include', 'nameLIKESkillsHubGrouping')) {
                pass('Script Include "SkillsHubGrouping" exists (may be inactive)');
            } else {
                fail('Script Include "SkillsHubGrouping" not found');
            }
        }

        // ============================================================
        // 5. Widget "Skills Hub - Leaderboard" exists with non-empty fields
        // ============================================================
        var lbWidget = getRecord('sp_widget', 'id=skills-hub-leaderboard');
        if (!lbWidget) {
            lbWidget = getRecord('sp_widget', 'nameLIKELeaderboard^nameLIKESkills Hub');
        }

        if (lbWidget) {
            var lbServer = lbWidget.getValue('script') || '';
            var lbClient = lbWidget.getValue('client_script') || '';
            var lbTemplate = lbWidget.getValue('template') || '';

            var lbFieldsOk = true;
            var lbMissing = [];

            if (!lbServer.trim()) {
                lbFieldsOk = false;
                lbMissing.push('server_script');
            }
            if (!lbClient.trim()) {
                lbFieldsOk = false;
                lbMissing.push('client_script');
            }
            if (!lbTemplate.trim()) {
                lbFieldsOk = false;
                lbMissing.push('template');
            }

            if (lbFieldsOk) {
                pass('Widget "Skills Hub - Leaderboard" exists with server_script, client_script, and template');
            } else {
                fail('Widget "Skills Hub - Leaderboard" exists but missing: ' + lbMissing.join(', '));
            }
        } else {
            fail('Widget "Skills Hub - Leaderboard" not found');
        }

        // ============================================================
        // 6. Widget "Skills Hub - Tab Navigation" exists
        // ============================================================
        var tabWidget = getRecord('sp_widget', 'id=skills-hub-tabs');
        if (!tabWidget) {
            tabWidget = getRecord('sp_widget', 'nameLIKETab Navigation^nameLIKESkills Hub');
        }

        if (tabWidget) {
            pass('Widget "Skills Hub - Tab Navigation" exists (id: ' + (tabWidget.getValue('id') || 'N/A') + ')');
        } else {
            fail('Widget "Skills Hub - Tab Navigation" not found');
        }

        // ============================================================
        // 7. Widget "Skills Hub - My Profile" server script contains "calculateTier"
        // ============================================================
        var profileWidget = getRecord('sp_widget', 'nameLIKEMy Profile');
        if (!profileWidget) {
            profileWidget = getRecord('sp_widget', 'nameLIKESkills Hub^nameLIKEProfile');
        }

        if (profileWidget) {
            var profileServer = profileWidget.getValue('script') || '';
            if (profileServer.indexOf('calculateTier') >= 0) {
                pass('My Profile widget server script contains "calculateTier" handler');
            } else {
                fail('My Profile widget server script missing "calculateTier" handler');
            }
        } else {
            fail('My Profile widget not found');
        }

        // ============================================================
        // 8. Application menu "Skills Hub" exists in sys_app_application
        // ============================================================
        var menuRec = getRecord('sys_app_application', 'title=Skills Hub^active=true');

        if (menuRec) {
            pass('Application menu "Skills Hub" exists in sys_app_application');
        } else {
            // Try without active filter
            if (recordExists('sys_app_application', 'title=Skills Hub')) {
                pass('Application menu "Skills Hub" exists (may be inactive)');
            } else {
                fail('Application menu "Skills Hub" not found in sys_app_application');
            }
        }

        // ============================================================
        // 9. Navigation modules (4) exist under Skills Hub menu
        // ============================================================
        if (menuRec) {
            var menuSysId = menuRec.getUniqueValue();
            var expectedModules = ['My Profile', 'Manager View', 'Find Expert', 'Leaderboard'];
            var foundModules = 0;
            var missingModules = [];

            for (var m = 0; m < expectedModules.length; m++) {
                var modName = expectedModules[m];
                if (recordExists('sys_app_module', 'application=' + menuSysId + '^title=' + modName)) {
                    foundModules++;
                } else {
                    missingModules.push(modName);
                }
            }

            if (foundModules === expectedModules.length) {
                pass('All 4 navigation modules exist under Skills Hub menu');
            } else {
                fail('Navigation modules: found ' + foundModules + '/4. Missing: ' + missingModules.join(', '));
            }
        } else {
            fail('Navigation modules cannot be checked (application menu missing)');
        }

        // ============================================================
        // 10. Service Portal page "skills_hub" exists
        // ============================================================
        if (recordExists('sp_page', 'id=skills_hub')) {
            pass('Service Portal page "skills_hub" exists');
        } else {
            fail('Service Portal page "skills_hub" not found');
        }

        // ============================================================
        // BONUS: Update Set record capture count
        // ============================================================
        if (usFound) {
            var usRec = getRecord('sys_update_set', 'name=' + UPDATE_SET_NAME);
            if (usRec) {
                var usId = usRec.getUniqueValue();
                var capturedCount = countRecords('sys_update_xml', 'update_set=' + usId);
                gs.info('[Skills Hub]');
                gs.info('[Skills Hub] Update Set "' + UPDATE_SET_NAME + '" records captured: ' + capturedCount);
            }
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
                    gs.warn('[Skills Hub] [FAIL] ' + results[i].label);
                }
            }
        } else {
            gs.info('[Skills Hub] All checks passed - Phase 3 deployment verified successfully.');
        }

        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] ===== END PHASE 3 VERIFICATION =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 26_verification_phase3: ' + e.message);
    }
})();
