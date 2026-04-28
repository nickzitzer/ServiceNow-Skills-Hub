/**
 * Verification Script: 42_verify_stabilization.js
 * Purpose: Read-only checks for Skills Hub stabilization scripts 39-41.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var PREFIX = '[Skills Hub Verify] ';
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info(PREFIX + 'PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error(PREFIX + 'FAIL - ' + message);
    }

    function getWidget(name) {
        var gr = new GlideRecord('sp_widget');
        gr.addQuery('name', name);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    }

    function checkContains(label, value, marker) {
        if ((value || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info(PREFIX + '===== STARTING STABILIZATION VERIFICATION =====');

    var choice = new GlideRecord('sys_choice');
    choice.addQuery('name', 'sys_user_has_skill');
    choice.addQuery('element', 'u_validation_status');
    choice.addQuery('value', 'review_requested');
    choice.setLimit(1);
    choice.query();
    if (choice.hasNext()) pass('review_requested validation status choice exists');
    else fail('review_requested validation status choice is missing');

    var profile = getWidget('Skills Hub - My Profile');
    if (profile) {
        pass('My Profile widget exists');
        checkContains('My Profile server', profile.getValue('script'), 'Skills Hub Stabilization 39');
        checkContains('My Profile client', profile.getValue('client_script'), 'applyServerData');
        checkContains('My Profile template', profile.getValue('template'), 'dispute-response-panel');
        checkContains('My Profile CSS', profile.getValue('css'), 'compact-skills');
    } else {
        fail('My Profile widget not found');
    }

    var findExpert = getWidget('Skills Hub - Find Expert');
    if (findExpert) {
        pass('Find Expert widget exists');
        checkContains('Find Expert server', findExpert.getValue('script'), 'Skills Hub Stabilization 40');
        checkContains('Find Expert client', findExpert.getValue('client_script'), 'businessUnitFilter');
        checkContains('Find Expert template', findExpert.getValue('template'), 'filter-row');
        checkContains('Find Expert CSS', findExpert.getValue('css'), 'btn-endorse.endorsed');
    } else {
        fail('Find Expert widget not found');
    }

    var manager = getWidget('Skills Hub - Manager Matrix');
    if (manager) {
        pass('Manager Matrix widget exists');
        checkContains('Manager Matrix server', manager.getValue('script'), 'Skills Hub Stabilization 41');
        checkContains('Manager Matrix client', manager.getValue('client_script'), 'review_requested');
        checkContains('Manager Matrix template', manager.getValue('template'), 'status-review');
        checkContains('Manager Matrix CSS', manager.getValue('css'), 'manager-notes');
    } else {
        fail('Manager Matrix widget not found');
    }

    var util = new GlideRecord('sys_script_include');
    util.addQuery('name', 'SkillsHubUtils');
    util.setLimit(1);
    util.query();
    if (util.next()) {
        pass('SkillsHubUtils exists');
        checkContains('SkillsHubUtils script', util.getValue('script'), 'Skills Hub Stabilization 41');
        checkContains('SkillsHubUtils manager matrix payload', util.getValue('script'), 'validation_notes');
    } else {
        fail('SkillsHubUtils script include not found');
    }

    var endorsements = new GlideRecord('u_m2m_skill_endorsement');
    if (endorsements.isValid()) pass('u_m2m_skill_endorsement table is queryable');
    else fail('u_m2m_skill_endorsement table is not queryable');

    var skillRecords = new GlideRecord('sys_user_has_skill');
    skillRecords.addNullQuery('skill');
    skillRecords.setLimit(1);
    skillRecords.query();
    if (skillRecords.hasNext()) {
        gs.warn(PREFIX + 'WARN - At least one sys_user_has_skill row has no skill reference; patched widgets skip these rows.');
    } else {
        pass('No sampled sys_user_has_skill rows with null skill reference');
    }

    gs.info(PREFIX + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
