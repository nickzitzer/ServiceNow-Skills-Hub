/**
 * Fix Script: 77_verify_skill_library_tab.js
 * Purpose: Verify Skills Library tab implementation.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 77 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 77 Verify] FAIL - ' + message + ': no thrown error');
    }

    function getWidget(query) {
        var widget = new GlideRecord('sp_widget');
        widget.addEncodedQuery(query);
        widget.setLimit(1);
        widget.query();
        return widget.next() ? widget : null;
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 77 Verify] ===== STARTING SKILL LIBRARY TAB VERIFICATION =====');

    var library = getWidget('id=skills-hub-library');
    if (!library) {
        fail('Skills Hub - Skill Library widget exists');
    } else {
        pass('Skills Hub - Skill Library widget exists');
        checkContains('Skill Library server', library.getValue('script'), 'Skills Hub Skill Library 76');
        checkContains('Skill Library server', library.getValue('script'), 'sh76SkillIdsForCategory');
        checkContains('Skill Library server', library.getValue('script'), 'action == "addSkill"');
        checkContains('Skill Library client', library.getValue('client_script'), 'c.addSkill');
        checkContains('Skill Library template', library.getValue('template'), 'uib-pagination');
        checkContains('Skill Library template', library.getValue('template'), 'uib-table');
        checkContains('Skill Library template', library.getValue('template'), 'table table-striped table-responsive');
        checkContains('Skill Library template', library.getValue('template'), 'panel-footer');
        checkContains('Skill Library template', library.getValue('template'), 'sn-record-picker');
        checkContains('Skill Library CSS', library.getValue('css'), 'Skills Hub Skill Library 76');
    }

    var container = getWidget('id=skills-hub-container');
    if (!container) {
        fail('Skills Hub Container widget exists');
    } else {
        pass('Skills Hub Container widget exists');
        checkContains('Container server', container.getValue('script'), 'libraryWidget');
        checkContains('Container template', container.getValue('template'), 'Skill Library');
        checkContains('Container template', container.getValue('template'), 'c.data.libraryWidget');
    }

    gs.info('[Skills Hub 77 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
