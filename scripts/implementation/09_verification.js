/**
 * Fix Script: 09_verification.js
 * Purpose: Comprehensive verification of all Skills Hub Phase 1 artifacts
 * Scope: Global
 * Idempotent: Yes - read-only checks, safe to re-run any time
 *
 * Verifies:
 *   1. Tables (4): u_skill_request, u_skill_profile_requirement, u_skill_category_group, u_m2m_skill_category_group
 *   2. Fields (3) on sys_user_has_skill
 *   3. Choice values for all choice fields
 *   4. Roles (2): skill_admin, skill_manager
 *   5. Business rules (6) + scheduled job (1)
 *   6. ACLs (15 count check)
 *   7. System properties (2): tier_config, scoring_enabled
 *   8. Update set capture + Default leak check
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Run all Phase 1 scripts (01 through 08) first
 */
(function() {
    try {
        var UPDATE_SET_NAME = 'Skills Hub - Phase 1 - Foundation';

        // ================================================================
        // Tracking helpers
        // ================================================================
        var totalPass = 0;
        var totalFail = 0;
        var totalChecks = 0;

        function pass(label) {
            totalPass++;
            totalChecks++;
            gs.info('[Skills Hub] \u2713 ' + label);
        }

        function fail(label) {
            totalFail++;
            totalChecks++;
            gs.info('[Skills Hub] \u2717 ' + label);
        }

        function recordExists(table, query) {
            var gr = new GlideRecord(table);
            gr.addEncodedQuery(query);
            gr.setLimit(1);
            gr.query();
            return gr.hasNext();
        }

        function countRecords(table, query) {
            var ga = new GlideAggregate(table);
            if (query) {
                ga.addEncodedQuery(query);
            }
            ga.addAggregate('COUNT');
            ga.query();
            if (ga.next()) {
                return parseInt(ga.getAggregate('COUNT')) || 0;
            }
            return 0;
        }

        gs.info('[Skills Hub] ===== PHASE 1 VERIFICATION =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());
        gs.info('[Skills Hub]');

        // ================================================================
        // 1. TABLES (4)
        // ================================================================
        gs.info('[Skills Hub] --- Tables ---');
        var expectedTables = [
            'u_skill_request',
            'u_skill_profile_requirement',
            'u_skill_category_group',
            'u_m2m_skill_category_group'
        ];

        for (var t = 0; t < expectedTables.length; t++) {
            var tblExists = recordExists('sys_db_object', 'name=' + expectedTables[t]);
            if (tblExists) {
                pass('Table ' + expectedTables[t] + ' exists');
            } else {
                fail('Table ' + expectedTables[t] + ' exists');
            }
        }

        // ================================================================
        // 2. FIELDS on sys_user_has_skill (3)
        // ================================================================
        gs.info('[Skills Hub] --- Fields on sys_user_has_skill ---');
        var expectedFields = [
            'u_manager_assessed_level',
            'u_validation_status',
            'u_validation_notes'
        ];

        for (var f = 0; f < expectedFields.length; f++) {
            var fldExists = recordExists('sys_dictionary', 'name=sys_user_has_skill^element=' + expectedFields[f]);
            if (fldExists) {
                pass('Field sys_user_has_skill.' + expectedFields[f] + ' exists');
            } else {
                fail('Field sys_user_has_skill.' + expectedFields[f] + ' exists');
            }
        }

        // ================================================================
        // 3. CHOICES
        // ================================================================
        gs.info('[Skills Hub] --- Choices ---');
        var expectedChoices = [
            { table: 'sys_user_has_skill', element: 'u_manager_assessed_level', expected: 5 },
            { table: 'sys_user_has_skill', element: 'u_validation_status', expected: 4 },
            { table: 'u_skill_request', element: 'u_status', expected: 3 },
            { table: 'u_skill_profile_requirement', element: 'u_required_level', expected: 5 },
            { table: 'u_skill_profile_requirement', element: 'u_priority', expected: 3 }
        ];

        for (var c = 0; c < expectedChoices.length; c++) {
            var ch = expectedChoices[c];
            var choiceCount = countRecords('sys_choice', 'name=' + ch.table + '^element=' + ch.element);
            var label = ch.table + '.' + ch.element + ' choices (found ' + choiceCount + ', expected ' + ch.expected + ')';
            if (choiceCount >= ch.expected) {
                pass(label);
            } else {
                fail(label);
            }
        }

        // ================================================================
        // 4. ROLES (2)
        // ================================================================
        gs.info('[Skills Hub] --- Roles ---');
        var expectedRoles = ['skill_admin', 'skill_manager'];

        for (var r = 0; r < expectedRoles.length; r++) {
            var roleExists = recordExists('sys_user_role', 'name=' + expectedRoles[r]);
            if (roleExists) {
                pass('Role ' + expectedRoles[r] + ' exists');
            } else {
                fail('Role ' + expectedRoles[r] + ' exists');
            }
        }

        // ================================================================
        // 5. BUSINESS RULES (6)
        // ================================================================
        gs.info('[Skills Hub] --- Business Rules ---');
        var expectedBRNames = [
            'Skills Hub - Increment Endorsement Count',
            'Skills Hub - Decrement Endorsement Count',
            'Skills Hub - Prevent Self Endorsement',
            'Skills Hub - Prevent Duplicate Endorsement',
            'Skills Hub - Set Validation Status on Manager Validate',
            'Skills Hub - Sync Cross-Category Skill Scores'
        ];

        for (var br = 0; br < expectedBRNames.length; br++) {
            var brName = expectedBRNames[br];
            var brExists = recordExists('sys_script', 'name=' + brName);
            if (brExists) {
                pass('Business Rule "' + brName + '" exists');
            } else {
                fail('Business Rule "' + brName + '" exists');
            }
        }

        // ================================================================
        // 6. SCHEDULED JOB (1)
        // ================================================================
        gs.info('[Skills Hub] --- Scheduled Job ---');
        var sjName = 'Skills Hub - Skill Expiration Check';
        var sjExists = recordExists('sysauto_script', 'name=' + sjName);
        if (!sjExists) {
            sjExists = recordExists('sys_trigger', 'name=' + sjName);
        }
        if (sjExists) {
            pass('Scheduled Job "' + sjName + '" exists');
        } else {
            fail('Scheduled Job "' + sjName + '" exists');
        }

        // ================================================================
        // 7. SYSTEM PROPERTIES (2)
        // ================================================================
        gs.info('[Skills Hub] --- System Properties ---');
        var expectedProps = ['skills_hub.tier_config', 'skills_hub.scoring_enabled'];

        for (var p = 0; p < expectedProps.length; p++) {
            var propExists = recordExists('sys_properties', 'name=' + expectedProps[p]);
            if (propExists) {
                pass('Property ' + expectedProps[p] + ' exists');
            } else {
                fail('Property ' + expectedProps[p] + ' exists');
            }
        }

        // ================================================================
        // 8. ACLs (15 count check)
        // ================================================================
        gs.info('[Skills Hub] --- ACLs (count check) ---');
        var aclQuery = 'active=true^nameSTARTSWITHu_m2m_skill_endorsement' +
            '^ORnameSTARTSWITHu_skill_request' +
            '^ORnameSTARTSWITHu_skill_profile_requirement' +
            '^ORnameSTARTSWITHsys_user_has_skill.u_manager' +
            '^ORnameSTARTSWITHsys_user_has_skill.u_validation';
        var aclCount = countRecords('sys_security_acl', aclQuery);
        var aclLabel = 'ACLs matching Skills Hub patterns (found ' + aclCount + ', expected >= 15)';
        if (aclCount >= 15) {
            pass(aclLabel);
        } else {
            fail(aclLabel);
        }

        // ================================================================
        // 9. UPDATE SET CHECK
        // ================================================================
        gs.info('[Skills Hub] --- Update Set ---');
        var usGr = new GlideRecord('sys_update_set');
        usGr.addQuery('name', UPDATE_SET_NAME);
        usGr.addQuery('state', 'in progress');
        usGr.query();

        if (usGr.next()) {
            var updateSetId = usGr.getUniqueValue();
            var usRecordCount = countRecords('sys_update_xml', 'update_set=' + updateSetId);
            pass('Update set "' + UPDATE_SET_NAME + '" exists and is in progress (' + usRecordCount + ' records)');
        } else {
            fail('Update set "' + UPDATE_SET_NAME + '" exists and is in progress');
        }

        // ================================================================
        // 10. DEFAULT UPDATE SET LEAK CHECK
        // ================================================================
        gs.info('[Skills Hub] --- Default Leak Check ---');
        var defaultGr = new GlideRecord('sys_update_set');
        defaultGr.addQuery('name', 'Default');
        defaultGr.addQuery('state', 'in progress');
        defaultGr.query();

        var leakCount = 0;
        if (defaultGr.next()) {
            var defaultId = defaultGr.getUniqueValue();
            var leakQuery = 'update_set=' + defaultId +
                '^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()' +
                '^nameLIKEskill^ORnameLIKEu_skill^ORnameLIKEu_m2m_skill';
            leakCount = countRecords('sys_update_xml', leakQuery);
        }

        if (leakCount === 0) {
            pass('No Skills Hub records leaked to Default update set today');
        } else {
            fail('Found ' + leakCount + ' Skills Hub records in Default update set today (INVESTIGATE!)');
        }

        // ================================================================
        // FINAL SUMMARY
        // ================================================================
        gs.info('[Skills Hub]');
        gs.info('[Skills Hub] ===== RESULTS: ' + totalPass + '/' + totalChecks + ' checks passed =====');
        if (totalFail > 0) {
            gs.info('[Skills Hub] ' + totalFail + ' check(s) FAILED - review output above for details');
        } else {
            gs.info('[Skills Hub] All checks passed - Phase 1 deployment verified successfully');
        }
        gs.info('[Skills Hub] ===== END VERIFICATION =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 09_verification: ' + e.message);
    }
})();
