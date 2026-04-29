/**
 * Fix Script: 69_verify_add_skill_category_picker_repair.js
 * Purpose: Verify script 68 repaired the Add Skill category picker template.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 69 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 69 Verify] FAIL - ' + message + ': no thrown error');
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    function checkMissing(label, text, marker) {
        if ((text || '').indexOf(marker) < 0) pass(label + ' does not contain invalid marker: ' + marker);
        else fail(label + ' still contains invalid marker: ' + marker);
    }

    gs.info('[Skills Hub 69 Verify] ===== STARTING CATEGORY PICKER REPAIR VERIFICATION =====');

    var widget = new GlideRecord('sp_widget');
    widget.addQuery('name', 'Skills Hub - My Profile');
    widget.setLimit(1);
    widget.query();
    if (!widget.next()) {
        fail('My Profile widget exists');
    } else {
        pass('My Profile widget exists');
        var template = widget.getValue('template') || '';
        checkContains('My Profile template', template, 'Skills Hub Category Picker Repair 68');
        checkContains('My Profile template', template, 'table="\'cmn_skill_category\'"');
        checkContains('My Profile template', template, 'display-field="\'name\'"');
        checkContains('My Profile template', template, 'value-field="\'sys_id\'"');
        checkContains('My Profile template', template, 'search-fields="\'name\'"');
        checkMissing('My Profile template', template, '\\\'cmn_skill_category\\\'');
        checkMissing('My Profile template', template, '\\\'name\\\'');
    }

    gs.info('[Skills Hub 69 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
