/**
 * Fix Script: 81_verify_skill_library_ux_accessibility_polish.js
 * Purpose: Verify Skill Library UX/accessibility polish.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 81 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 81 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 81 Verify] ===== STARTING SKILL LIBRARY UX/A11Y VERIFICATION =====');

    var library = new GlideRecord('sp_widget');
    library.addQuery('id', 'skills-hub-library');
    library.setLimit(1);
    library.query();

    if (!library.next()) {
        fail('Skills Hub - Skill Library widget exists');
    } else {
        pass('Skills Hub - Skill Library widget exists');
        checkContains('Skill Library client', library.getValue('client_script'), 'Skills Hub Library UX A11y 80');
        checkContains('Skill Library client', library.getValue('client_script'), 'c.hasFilters');
        checkContains('Skill Library template', library.getValue('template'), 'aria-label="Search skills library"');
        checkContains('Skill Library template', library.getValue('template'), 'aria-label="Clear Skill Library filters"');
        checkContains('Skill Library template', library.getValue('template'), 'ng-if="c.hasFilters()"');
        checkContains('Skill Library template', library.getValue('template'), '<caption class="sr-only">Skill Library results</caption>');
        checkContains('Skill Library template', library.getValue('template'), 'scope="col"');
        checkContains('Skill Library template', library.getValue('template'), 'Add \' + skill.name + \' to my profile');
        checkContains('Skill Library CSS', library.getValue('css'), 'Skills Hub Library UX A11y 80');
        checkContains('Skill Library CSS', library.getValue('css'), 'outline:2px solid #005fcc');
    }

    var container = new GlideRecord('sp_widget');
    container.addQuery('id', 'skills-hub-container');
    container.setLimit(1);
    container.query();

    if (!container.next()) {
        fail('Skills Hub Container widget exists');
    } else {
        pass('Skills Hub Container widget exists');
        checkContains('Container template', container.getValue('template'), 'heading="My Skills"');
        checkContains('Container template', container.getValue('template'), 'heading="Find Experts"');
        checkContains('Container template', container.getValue('template'), 'heading="Team Review"');
        checkContains('Container CSS', container.getValue('css'), 'Skills Hub Navigation UX A11y 80');
    }

    gs.info('[Skills Hub 81 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
