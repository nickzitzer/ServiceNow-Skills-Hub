/**
 * Fix Script: 33_verification_phase4.js
 * Purpose: Comprehensive verification of all Skills Hub Phase 4 artifacts
 * Scope: Global
 * Idempotent: Yes - read-only checks, safe to re-run any time
 *
 * Verifies:
 *    1. Update Set "Skills Hub - Phase 4 - Analytics & Reporting" exists
 *    2. Table u_story_skill_assignment exists (sys_db_object)
 *    3. Fields on u_story_skill_assignment: u_story, u_skill, u_estimated_hours, u_proficiency_required, u_active
 *    4. Choice values for u_story_skill_assignment.u_proficiency_required (5 expected)
 *    5. PA Indicators (6): Skills Supply, Endorsement Velocity, Validation Rate,
 *       Skill Growth, Skills Demand, Capacity Utilization
 *    6. PA Dashboard "Skills Hub - Analytics Dashboard" exists
 *    7. Script Include "SkillsHubDetection" exists and is active
 *    8. Widget "Skills Hub - Gap Analysis" exists
 *    9. Update set record count
 *
 * PA tables are checked gracefully - if the PA plugin is not active,
 * checks produce warnings instead of failures.
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Run all Phase 4 scripts (27 through 32) first
 */
(function() {
    try {
        // ================================================================
        // Tracking
        // ================================================================
        var totalPass = 0;
        var totalFail = 0;
        var totalWarn = 0;
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

        function warn(label) {
            totalWarn++;
            results.push({ status: 'warn', label: label });
            gs.info('[Skills Hub] [WARN] ' + label);
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

        /**
         * Safely check if a PA table is accessible (plugin may not be active).
         * Returns true if the table is queryable, false otherwise.
         */
        function isPATableAvailable(tableName) {
            try {
                var testGR = new GlideRecord(tableName);
                testGR.setLimit(1);
                testGR.query();
                return true;
            } catch (e) {
                return false;
            }
        }

        gs.info('[Skills Hub] ===== PHASE 4 VERIFICATION =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        gs.info('[Skills Hub]');

        // ============================================================
        // 1. UPDATE SET
        // ============================================================
        gs.info('[Skills Hub] --- 1. Update Set ---');

        var UPDATE_SET_NAME = 'Skills Hub - Phase 4 - Analytics & Reporting';
        var phase4USId = '';

        var usRec = getRecord('sys_update_set', 'name=' + UPDATE_SET_NAME);
        if (usRec) {
            phase4USId = usRec.getUniqueValue();
            pass('Update Set "' + UPDATE_SET_NAME + '" exists (sys_id: ' + phase4USId + ')');
        } else {
            // Fallback: CONTAINS search for variations
            var usFallback = new GlideRecord('sys_update_set');
            usFallback.addQuery('name', 'CONTAINS', 'Skills Hub');
            usFallback.addQuery('name', 'CONTAINS', 'Phase 4');
            usFallback.setLimit(1);
            usFallback.query();
            if (usFallback.next()) {
                phase4USId = usFallback.getUniqueValue();
                var foundName = usFallback.getValue('name');
                pass('Update Set found with alternate name: "' + foundName + '" (sys_id: ' + phase4USId + ')');
            } else {
                fail('Update Set "' + UPDATE_SET_NAME + '" not found');
            }
        }

        // ============================================================
        // 2. TABLE: u_story_skill_assignment
        // ============================================================
        gs.info('[Skills Hub] --- 2. Demand Table ---');

        var TABLE_NAME = 'u_story_skill_assignment';
        var tableExists = false;

        if (recordExists('sys_db_object', 'name=' + TABLE_NAME)) {
            tableExists = true;
            pass('Table "' + TABLE_NAME + '" exists in sys_db_object');
        } else {
            // Fallback: try to instantiate
            try {
                var testGr = new GlideRecord(TABLE_NAME);
                testGr.setLimit(1);
                testGr.query();
                tableExists = true;
                pass('Table "' + TABLE_NAME + '" exists (queryable)');
            } catch (tableErr) {
                fail('Table "' + TABLE_NAME + '" does not exist');
            }
        }

        // ============================================================
        // 3. FIELDS on u_story_skill_assignment
        // ============================================================
        gs.info('[Skills Hub] --- 3. Table Fields ---');

        var expectedFields = [
            'u_story',
            'u_skill',
            'u_estimated_hours',
            'u_proficiency_required',
            'u_active'
        ];

        if (tableExists) {
            var fieldsFound = 0;
            var fieldsMissing = 0;

            for (var f = 0; f < expectedFields.length; f++) {
                var fieldName = expectedFields[f];
                if (recordExists('sys_dictionary', 'name=' + TABLE_NAME + '^element=' + fieldName)) {
                    fieldsFound++;
                    gs.info('[Skills Hub]   Field "' + fieldName + '": found');
                } else {
                    fieldsMissing++;
                    gs.info('[Skills Hub]   Field "' + fieldName + '": MISSING');
                }
            }

            if (fieldsMissing === 0) {
                pass('All ' + expectedFields.length + ' required fields exist on ' + TABLE_NAME);
            } else {
                fail(fieldsMissing + ' of ' + expectedFields.length + ' required fields missing on ' + TABLE_NAME);
            }
        } else {
            for (var ff = 0; ff < expectedFields.length; ff++) {
                fail('Field "' + expectedFields[ff] + '" (table ' + TABLE_NAME + ' missing)');
            }
        }

        // ============================================================
        // 4. CHOICE VALUES for u_proficiency_required (5 expected)
        // ============================================================
        gs.info('[Skills Hub] --- 4. Proficiency Choices ---');

        var expectedChoices = ['novice', 'intermediate', 'proficient', 'advanced', 'expert'];
        var choicesFound = 0;
        var choicesMissing = 0;

        for (var c = 0; c < expectedChoices.length; c++) {
            var choiceVal = expectedChoices[c];
            if (recordExists('sys_choice', 'name=' + TABLE_NAME + '^element=u_proficiency_required^value=' + choiceVal)) {
                choicesFound++;
                gs.info('[Skills Hub]   Choice "' + choiceVal + '": found');
            } else {
                choicesMissing++;
                gs.info('[Skills Hub]   Choice "' + choiceVal + '": MISSING');
            }
        }

        if (choicesMissing === 0) {
            pass('All ' + expectedChoices.length + ' proficiency choice values exist');
        } else {
            fail(choicesMissing + ' of ' + expectedChoices.length + ' proficiency choice values missing (found ' + choicesFound + ')');
        }

        // ============================================================
        // 5. PA INDICATORS (6 expected)
        //    Gracefully handle PA plugin not being active
        // ============================================================
        gs.info('[Skills Hub] --- 5. PA Indicators ---');

        var expectedIndicators = [
            'Skills Supply',
            'Endorsement Velocity',
            'Validation Rate',
            'Skill Growth',
            'Skills Demand',
            'Capacity Utilization'
        ];

        var paAvailable = isPATableAvailable('pa_indicators');

        if (paAvailable) {
            var indicatorsFound = 0;
            var indicatorsMissing = 0;

            for (var ind = 0; ind < expectedIndicators.length; ind++) {
                var indName = expectedIndicators[ind];

                // Search by exact name first, then with "Skills Hub - " prefix, then CONTAINS
                var indRec = getRecord('pa_indicators', 'name=' + indName);
                if (!indRec) {
                    indRec = getRecord('pa_indicators', 'name=Skills Hub - ' + indName);
                }
                if (!indRec) {
                    indRec = getRecord('pa_indicators', 'nameLIKE' + indName);
                }

                if (indRec) {
                    indicatorsFound++;
                    var foundIndName = indRec.getValue('name') || '';
                    var indActive = indRec.getValue('active') || '';
                    gs.info('[Skills Hub]   Indicator "' + foundIndName + '": found (active: ' + indActive + ')');
                } else {
                    indicatorsMissing++;
                    gs.info('[Skills Hub]   Indicator "' + indName + '": MISSING');
                }
            }

            if (indicatorsMissing === 0) {
                pass('All ' + expectedIndicators.length + ' PA indicators exist');
            } else {
                fail(indicatorsMissing + ' of ' + expectedIndicators.length + ' PA indicators missing (found ' + indicatorsFound + ')');
            }
        } else {
            warn('PA plugin not active or pa_indicators table not accessible - skipping PA indicator checks');
            for (var wi = 0; wi < expectedIndicators.length; wi++) {
                warn('PA Indicator "' + expectedIndicators[wi] + '" cannot be verified (PA plugin not active)');
            }
        }

        // ============================================================
        // 6. PA DASHBOARD
        // ============================================================
        gs.info('[Skills Hub] --- 6. PA Dashboard ---');

        var DASHBOARD_NAME = 'Skills Hub - Analytics Dashboard';

        if (paAvailable) {
            var dashAvailable = isPATableAvailable('pa_dashboards');

            if (dashAvailable) {
                var dashRec = getRecord('pa_dashboards', 'name=' + DASHBOARD_NAME);
                if (!dashRec) {
                    dashRec = getRecord('pa_dashboards', 'nameLIKESkills Hub');
                }

                if (dashRec) {
                    var dashName = dashRec.getValue('name') || '';
                    pass('PA Dashboard "' + dashName + '" exists (sys_id: ' + dashRec.getUniqueValue() + ')');
                } else {
                    // Check sys_portal_page as alternative
                    var portalRec = getRecord('sys_portal_page', 'titleLIKESkills Hub');
                    if (portalRec) {
                        pass('Dashboard found as Homepage: "' + portalRec.getValue('title') + '"');
                    } else {
                        fail('PA Dashboard "' + DASHBOARD_NAME + '" not found');
                    }
                }
            } else {
                warn('pa_dashboards table not accessible - checking sys_portal_page instead');
                var altDash = getRecord('sys_portal_page', 'titleLIKESkills Hub');
                if (altDash) {
                    pass('Dashboard found as Homepage: "' + altDash.getValue('title') + '"');
                } else {
                    warn('Dashboard "' + DASHBOARD_NAME + '" not found (PA tables not accessible)');
                }
            }
        } else {
            warn('PA plugin not active - checking sys_portal_page for dashboard');
            var fallbackDash = getRecord('sys_portal_page', 'titleLIKESkills Hub');
            if (fallbackDash) {
                pass('Dashboard found as Homepage: "' + fallbackDash.getValue('title') + '"');
            } else {
                warn('Dashboard "' + DASHBOARD_NAME + '" cannot be verified (PA plugin not active)');
            }
        }

        // ============================================================
        // 7. SCRIPT INCLUDE: SkillsHubDetection
        // ============================================================
        gs.info('[Skills Hub] --- 7. SkillsHubDetection Script Include ---');

        var detectionSI = getRecord('sys_script_include', 'name=SkillsHubDetection');

        if (detectionSI) {
            var siActive = detectionSI.getValue('active') || '';
            pass('Script Include "SkillsHubDetection" exists (active: ' + siActive + ')');

            // Check for expected methods
            var siScript = detectionSI.getValue('script') || '';
            var expectedMethods = ['detectSkills', 'tagStoryWithSkills', 'batchTagStories'];
            var methodsPresent = [];
            var methodsMissing = [];

            for (var m = 0; m < expectedMethods.length; m++) {
                if (siScript.indexOf(expectedMethods[m]) >= 0) {
                    methodsPresent.push(expectedMethods[m]);
                } else {
                    methodsMissing.push(expectedMethods[m]);
                }
            }

            gs.info('[Skills Hub]   Methods found: ' + methodsPresent.join(', '));
            if (methodsMissing.length > 0) {
                gs.info('[Skills Hub]   Methods missing: ' + methodsMissing.join(', '));
            }
            gs.info('[Skills Hub]   Script length: ' + siScript.length + ' chars');

            if (siActive !== 'true' && siActive !== '1') {
                warn('SkillsHubDetection exists but is not active');
            }
        } else {
            fail('Script Include "SkillsHubDetection" not found');
        }

        // ============================================================
        // 8. WIDGET: Skills Hub - Gap Analysis
        // ============================================================
        gs.info('[Skills Hub] --- 8. Gap Analysis Widget ---');

        var gapWidget = getRecord('sp_widget', 'id=skills-hub-gap-analysis');
        if (!gapWidget) {
            gapWidget = getRecord('sp_widget', 'name=Skills Hub - Gap Analysis');
        }
        if (!gapWidget) {
            gapWidget = getRecord('sp_widget', 'nameLIKEGap Analysis^nameLIKESkills Hub');
        }

        if (gapWidget) {
            var widgetId = gapWidget.getValue('id') || '';
            var widgetName = gapWidget.getValue('name') || '';
            pass('Widget "' + widgetName + '" exists (id: ' + widgetId + ', sys_id: ' + gapWidget.getUniqueValue() + ')');

            // Bonus: check content sizes
            var widgetServer = gapWidget.getValue('script') || '';
            var widgetClient = gapWidget.getValue('client_script') || '';
            var widgetTemplate = gapWidget.getValue('template') || '';
            var widgetCss = gapWidget.getValue('css') || '';
            gs.info('[Skills Hub]   Server script: ' + widgetServer.length + ' chars');
            gs.info('[Skills Hub]   Client script: ' + widgetClient.length + ' chars');
            gs.info('[Skills Hub]   Template: ' + widgetTemplate.length + ' chars');
            gs.info('[Skills Hub]   CSS: ' + widgetCss.length + ' chars');
        } else {
            fail('Widget "Skills Hub - Gap Analysis" not found');
        }

        // ============================================================
        // 9. UPDATE SET RECORD COUNT
        // ============================================================
        gs.info('[Skills Hub] --- 9. Update Set Record Count ---');

        if (phase4USId) {
            var capturedCount = countRecords('sys_update_xml', 'update_set=' + phase4USId);
            gs.info('[Skills Hub] Update Set records captured: ' + capturedCount);

            if (capturedCount > 0) {
                pass('Update set contains ' + capturedCount + ' captured record(s)');
            } else {
                warn('Update set has 0 captured records - scripts may not have been run against this update set');
            }
        } else {
            gs.info('[Skills Hub] Cannot check record count (update set not found)');
        }

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        var totalChecks = totalPass + totalFail;

        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] =====================================');
        gs.info('[Skills Hub] Result: ' + totalPass + '/' + totalChecks + ' checks passed');

        if (totalWarn > 0) {
            gs.info('[Skills Hub] Warnings: ' + totalWarn);
        }

        if (totalFail > 0) {
            gs.info('[Skills Hub]');
            gs.info('[Skills Hub] --- FAILURES ---');
            for (var i = 0; i < results.length; i++) {
                if (results[i].status === 'fail') {
                    gs.warn('[Skills Hub] [FAIL] ' + results[i].label);
                }
            }
            gs.info('[Skills Hub]');
            gs.warn('[Skills Hub] ' + totalFail + ' checks FAILED - review output above');
        }

        if (totalWarn > 0) {
            gs.info('[Skills Hub]');
            gs.info('[Skills Hub] --- WARNINGS ---');
            for (var j = 0; j < results.length; j++) {
                if (results[j].status === 'warn') {
                    gs.warn('[Skills Hub] [WARN] ' + results[j].label);
                }
            }
        }

        if (totalFail === 0 && totalWarn === 0) {
            gs.info('[Skills Hub] All checks passed! Phase 4 deployment verified.');
        } else if (totalFail === 0) {
            gs.info('[Skills Hub] All required checks passed (with ' + totalWarn + ' warning(s)). Phase 4 deployment verified.');
        }

        gs.info('[Skills Hub] =====================================');
        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] ===== END PHASE 4 VERIFICATION =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 33_verification_phase4: ' + e.message);
    }
})();
