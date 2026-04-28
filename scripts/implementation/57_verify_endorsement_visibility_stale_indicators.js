/**
 * Verification Script: 57_verify_endorsement_visibility_stale_indicators.js
 * Purpose: Verify script 56 markers and expected endorsement/stale UI hooks.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var prefix = '[Skills Hub 57 Verify] ';
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info(prefix + 'PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error(prefix + 'FAIL - ' + message);
    }

    function getWidget(name) {
        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', name);
        widget.setLimit(1);
        widget.query();
        return widget.next() ? widget : null;
    }

    function contains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    try {
        gs.info(prefix + '===== STARTING ENDORSEMENT VISIBILITY / STALE INDICATOR VERIFICATION =====');

        var endorsementTable = new GlideRecord('u_m2m_skill_endorsement');
        if (endorsementTable.isValid()) pass('u_m2m_skill_endorsement table exists');
        else fail('u_m2m_skill_endorsement table missing');

        var skillRecord = new GlideRecord('sys_user_has_skill');
        if (skillRecord.isValidField('u_last_manager_validation')) pass('sys_user_has_skill.u_last_manager_validation exists');
        else fail('sys_user_has_skill.u_last_manager_validation missing');

        var find = getWidget('Skills Hub - Find Expert');
        if (find) {
            pass('Find Expert widget exists');
            contains('Find Expert server', find.getValue('script'), 'Skills Hub Endorsement Visibility 56');
            contains('Find Expert server', find.getValue('script'), 'getEndorsements');
            contains('Find Expert server', find.getValue('script'), 'stale_assessment: staleAssessment');
            contains('Find Expert client', find.getValue('client_script'), 'c.viewEndorsements');
            contains('Find Expert template', find.getValue('template'), 'endorsement-clickable');
            contains('Find Expert template', find.getValue('template'), 'stale-skill-badge');
        } else {
            fail('Find Expert widget missing');
        }

        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            pass('My Profile widget exists');
            contains('My Profile server', profile.getValue('script'), 'Skills Hub Profile Endorsement Identity 56');
            contains('My Profile client', profile.getValue('client_script'), 'endorsement-view-row simple');
        } else {
            fail('My Profile widget missing');
        }

        var matrix = getWidget('Skills Hub - Manager Matrix');
        if (matrix) {
            pass('Manager Matrix widget exists');
            contains('Manager Matrix template', matrix.getValue('template'), 'text-stale');
            contains('Manager Matrix CSS', matrix.getValue('css'), 'status-expired');
        } else {
            fail('Manager Matrix widget missing');
        }

        var si = new GlideRecord('sys_script_include');
        si.addQuery('name', 'SkillsHubUtils');
        si.setLimit(1);
        si.query();
        if (si.next()) {
            pass('SkillsHubUtils exists');
            contains('SkillsHubUtils script', si.getValue('script'), 'Skills Hub Stale Indicator 56');
            contains('SkillsHubUtils script', si.getValue('script'), 'stale_assessment: staleAssessment');
        } else {
            fail('SkillsHubUtils missing');
        }

        gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
    } catch (e) {
        gs.error(prefix + 'Verification failed unexpectedly: ' + e.message);
    }
})();
