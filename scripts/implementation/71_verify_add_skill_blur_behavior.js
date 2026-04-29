/**
 * Fix Script: 71_verify_add_skill_blur_behavior.js
 * Purpose: Verify Add Skill modal blur repair markers.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 71 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 71 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 71 Verify] ===== STARTING ADD SKILL BLUR VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('name', 'Skills Hub - My Profile');
    widget.setLimit(1);
    widget.query();
    if (!widget.next()) {
        fail('My Profile widget exists');
    } else {
        pass('My Profile widget exists');
        var template = widget.getValue('template') || '';
        checkContains('My Profile template', template, 'Skills Hub Add Skill Blur Repair 70');
        checkContains('My Profile template', template, 'ng-blur="searchResults = []"');
        checkContains('My Profile template', template, 'ng-click="searchResults = []"');
    }

    gs.info('[Skills Hub 71 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
