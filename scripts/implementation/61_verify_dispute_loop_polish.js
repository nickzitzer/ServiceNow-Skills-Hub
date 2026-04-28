/**
 * Verification Script: 61_verify_dispute_loop_polish.js
 * Purpose: Verify dispute loop polish markers and storage fields.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var prefix = '[Skills Hub 61 Verify] ';
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

    function contains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    function getWidget(name) {
        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', name);
        widget.setLimit(1);
        widget.query();
        return widget.next() ? widget : null;
    }

    try {
        gs.info(prefix + '===== STARTING DISPUTE LOOP POLISH VERIFICATION =====');

        var skill = new GlideRecord('sys_user_has_skill');
        if (skill.isValidField('u_validation_status')) pass('sys_user_has_skill.u_validation_status stores dispute state');
        else fail('sys_user_has_skill.u_validation_status missing');
        if (skill.isValidField('u_validation_notes')) pass('sys_user_has_skill.u_validation_notes stores dispute/review notes');
        else fail('sys_user_has_skill.u_validation_notes missing');
        if (skill.isValidField('u_manager_assessed_level')) pass('sys_user_has_skill.u_manager_assessed_level stores manager suggested level');
        else fail('sys_user_has_skill.u_manager_assessed_level missing');
        if (skill.isValidField('u_last_manager_validation')) pass('sys_user_has_skill.u_last_manager_validation stores validation timestamp');
        else fail('sys_user_has_skill.u_last_manager_validation missing');

        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            pass('My Profile widget exists');
            contains('My Profile client', profile.getValue('client_script'), 'Skills Hub Dispute Polish 60');
            contains('My Profile client', profile.getValue('client_script'), 'Request Review');
            contains('My Profile template', profile.getValue('template'), 'Manager suggested a change');
            contains('My Profile template', profile.getValue('template'), 'Accept suggested level');
        } else {
            fail('My Profile widget missing');
        }

        var matrix = getWidget('Skills Hub - Manager Matrix');
        if (matrix) {
            pass('Manager Matrix widget exists');
            contains('Manager Matrix client', matrix.getValue('client_script'), 'Skills Hub Dispute Polish 60');
            contains('Manager Matrix client', matrix.getValue('client_script'), 'c.showDisputeDetails');
            contains('Manager Matrix template', matrix.getValue('template'), 'status-chip-compact');
            contains('Manager Matrix CSS', matrix.getValue('css'), 'detail-notes');
        } else {
            fail('Manager Matrix widget missing');
        }

        gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
    } catch (e) {
        gs.error(prefix + 'Verification failed unexpectedly: ' + e.message);
    }
})();
