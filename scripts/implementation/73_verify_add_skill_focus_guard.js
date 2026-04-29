/**
 * Fix Script: 73_verify_add_skill_focus_guard.js
 * Purpose: Verify Add Skill focus guard markers.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 73 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 73 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 73 Verify] ===== STARTING ADD SKILL FOCUS GUARD VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('name', 'Skills Hub - My Profile');
    widget.setLimit(1);
    widget.query();
    if (!widget.next()) {
        fail('My Profile widget exists');
    } else {
        pass('My Profile widget exists');
        checkContains('My Profile client', widget.getValue('client_script'), '$scope.searchFocused = false;');
        checkContains('My Profile client', widget.getValue('client_script'), '$scope.onSearchBlur');
        checkContains('My Profile client', widget.getValue('client_script'), '$scope.searchFocused = true;');
        checkContains('My Profile template', widget.getValue('template'), 'Skills Hub Add Skill Focus Guard 72');
        checkContains('My Profile template', widget.getValue('template'), 'ng-if="searchFocused && searchResults.length > 0 && !selectedSkillName"');
        checkContains('My Profile template', widget.getValue('template'), 'ng-blur="onSearchBlur()"');
    }

    gs.info('[Skills Hub 73 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
