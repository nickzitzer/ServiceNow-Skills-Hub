/**
 * Fix Script: 67_verify_profile_search_filter_polish.js
 * Purpose: Verify script 66 profile/search/filter polish markers.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info('[Skills Hub 67 Verify] PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error('[Skills Hub 67 Verify] FAIL - ' + message + ': no thrown error');
    }

    function getWidget(name) {
        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', name);
        widget.setLimit(1);
        widget.query();
        return widget.next() ? widget : null;
    }

    function checkContains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info('[Skills Hub 67 Verify] ===== STARTING PROFILE SEARCH/FILTER POLISH VERIFICATION =====');

    var profile = getWidget('Skills Hub - My Profile');
    if (!profile) {
        fail('My Profile widget exists');
    } else {
        pass('My Profile widget exists');
        checkContains('My Profile server', profile.getValue('script'), 'Skills Hub Profile Search Filter Polish 66');
        checkContains('My Profile server', profile.getValue('script'), 'category_filter');
        checkContains('My Profile server', profile.getValue('script'), 'new_since_assessment');
        checkContains('My Profile client', profile.getValue('client_script'), 'c.compactMode = (c.data.skills || []).length > 8');
        checkContains('My Profile client', profile.getValue('client_script'), 'hideSkillSuggestions');
        checkContains('My Profile client', profile.getValue('client_script'), 'onCategoryChange');
        checkContains('My Profile template', profile.getValue('template'), 'skill-category-filter');
        checkContains('My Profile template', profile.getValue('template'), 'ng-blur="hideSkillSuggestions()"');
        checkContains('My Profile template', profile.getValue('template'), 'new-since-badge');
        checkContains('My Profile CSS', profile.getValue('css'), 'Skills Hub Profile Search Filter Polish 66');
    }

    var find = getWidget('Skills Hub - Find Expert');
    if (!find) {
        fail('Find Expert widget exists');
    } else {
        pass('Find Expert widget exists');
        checkContains('Find Expert client', find.getValue('client_script'), 'Skills Hub Find Expert Typeahead Blur 66');
        checkContains('Find Expert client', find.getValue('client_script'), 'c.hideTypeahead');
        checkContains('Find Expert template', find.getValue('template'), 'ng-blur="c.hideTypeahead(\'must\')"');
        checkContains('Find Expert template', find.getValue('template'), 'ng-blur="c.hideTypeahead(\'nice\')"');
        checkContains('Find Expert CSS', find.getValue('css'), 'Skills Hub Select Polish 66');
    }

    var manager = getWidget('Skills Hub - Manager Matrix');
    if (!manager) {
        fail('Manager Matrix widget exists');
    } else {
        pass('Manager Matrix widget exists');
        checkContains('Manager Matrix client', manager.getValue('client_script'), 'Skills Hub Manager Row Filter 66');
        checkContains('Manager Matrix client', manager.getValue('client_script'), 'c.userHasVisibleSkills');
        checkContains('Manager Matrix template', manager.getValue('template'), 'c.userHasVisibleSkills(user)');
    }

    gs.info('[Skills Hub 67 Verify] ===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
})();
