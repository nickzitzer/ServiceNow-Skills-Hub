/**
 * Fix Script: 75_verify_manager_review_filter.js
 * Purpose: Verify Team Matrix Review filter repair markers.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 75 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 75 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 75 Verify] ===== STARTING MANAGER REVIEW FILTER VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('name', 'Skills Hub - Manager Matrix');
    widget.setLimit(1);
    widget.query();
    if (!widget.next()) {
        fail('Manager Matrix widget exists');
    } else {
        pass('Manager Matrix widget exists');
        var client = widget.getValue('client_script') || '';
        var template = widget.getValue('template') || '';
        checkContains('Manager Matrix client', client, 'Skills Hub Manager Review Filter Repair 74');
        checkContains('Manager Matrix client', client, 'c.setStatusFilter');
        checkContains('Manager Matrix client', client, 'c.statusFilter == "review_requested"');
        checkContains('Manager Matrix template', template, "c.setStatusFilter('review_requested')");
        checkContains('Manager Matrix template', template, "c.setStatusFilter('disputed')");
    }

    gs.info('[Skills Hub 75 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
