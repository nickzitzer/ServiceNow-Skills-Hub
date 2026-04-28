/**
 * Verification Script: 65_verify_dispute_details_modal_layout_fix.js
 * Purpose: Verify Manager Matrix dispute details modal layout fix.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var prefix = '[Skills Hub 65 Verify] ';
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
        gs.info(prefix + '===== STARTING DISPUTE DETAILS MODAL LAYOUT VERIFICATION =====');

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
        var client = widget.getValue('client_script') || '';

        if (client.indexOf('Skills Hub Dispute Details Modal Layout 64') > -1) pass('Client contains modal layout marker 64');
        else fail('Client missing modal layout marker 64');

        if (client.indexOf('display:grid; grid-template-columns:140px 1fr') > -1) pass('Dispute modal uses self-contained grid layout');
        else fail('Dispute modal missing self-contained grid layout');

        if (client.indexOf('No notes recorded.') > -1) pass('Dispute modal keeps empty-notes fallback');
        else fail('Dispute modal missing empty-notes fallback');

        gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
    } catch (e) {
        gs.error(prefix + 'Verification failed unexpectedly: ' + e.message);
    }
})();
