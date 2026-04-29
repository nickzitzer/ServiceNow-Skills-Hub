/**
 * Fix Script: 79_verify_skill_library_density.js
 * Purpose: Verify Skill Library density polish.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 79 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 79 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 79 Verify] ===== STARTING SKILL LIBRARY DENSITY VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('id', 'skills-hub-library');
    widget.setLimit(1);
    widget.query();

    if (!widget.next()) {
        fail('Skills Hub - Skill Library widget exists');
    } else {
        pass('Skills Hub - Skill Library widget exists');
        checkContains('Skill Library template', widget.getValue('template'), 'title="{{skill.description}}"');
        checkContains('Skill Library CSS', widget.getValue('css'), 'Skills Hub Skill Library Density 78');
        checkContains('Skill Library CSS', widget.getValue('css'), '-webkit-line-clamp:2');
        checkContains('Skill Library CSS', widget.getValue('css'), 'table-layout:fixed');
    }

    gs.info('[Skills Hub 79 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
