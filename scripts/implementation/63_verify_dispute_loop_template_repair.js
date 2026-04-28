/**
 * Verification Script: 63_verify_dispute_loop_template_repair.js
 * Purpose: Verify Manager Matrix template repair after script 62.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var prefix = '[Skills Hub 63 Verify] ';
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

    try {
        gs.info(prefix + '===== STARTING DISPUTE TEMPLATE REPAIR VERIFICATION =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            fail('Manager Matrix widget missing');
            gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
            return;
        }

        pass('Manager Matrix widget exists');
        var template = widget.getValue('template') || '';
        var client = widget.getValue('client_script') || '';
        var css = widget.getValue('css') || '';

        if (template.indexOf('status-chip-compact') > -1) pass('Manager Matrix template contains status-chip-compact');
        else fail('Manager Matrix template missing status-chip-compact');

        if (template.indexOf('c.showDisputeDetails(skillName, details, user)') > -1) pass('Status button opens dispute details modal');
        else fail('Status button missing dispute details click handler');

        if (client.indexOf('c.showDisputeDetails') > -1) pass('Manager Matrix client contains showDisputeDetails');
        else fail('Manager Matrix client missing showDisputeDetails');

        if (css.indexOf('status-chip-compact') > -1) pass('Manager Matrix CSS contains status-chip-compact styles');
        else fail('Manager Matrix CSS missing status-chip-compact styles');

        gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
    } catch (e) {
        gs.error(prefix + 'Verification failed unexpectedly: ' + e.message);
    }
})();
