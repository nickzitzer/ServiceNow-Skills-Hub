/**
 * Fix Script: 83_verify_skill_library_toolbar_layout.js
 * Purpose: Verify Skill Library toolbar layout repair.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 83 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 83 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 83 Verify] ===== STARTING SKILL LIBRARY TOOLBAR LAYOUT VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('id', 'skills-hub-library');
    widget.setLimit(1);
    widget.query();

    if (!widget.next()) {
        fail('Skills Hub - Skill Library widget exists');
    } else {
        pass('Skills Hub - Skill Library widget exists');
        checkContains('Skill Library CSS', widget.getValue('css'), 'Skills Hub Library Toolbar Repair 82');
        checkContains('Skill Library CSS', widget.getValue('css'), 'display:flex !important');
        checkContains('Skill Library CSS', widget.getValue('css'), '.skills-library-panel .library-search { order:1');
        checkContains('Skill Library CSS', widget.getValue('css'), '.skills-library-panel .library-category { order:2');
        checkContains('Skill Library CSS', widget.getValue('css'), '.skills-library-panel .library-actions { order:3');
    }

    gs.info('[Skills Hub 83 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
