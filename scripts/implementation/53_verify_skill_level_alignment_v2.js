/**
 * Verification Script: 53_verify_skill_level_alignment_v2.js
 * Purpose: Corrected read-only checks for skill level type alignment.
 *
 * Notes:
 *   - Script 52 incorrectly checked the My Profile template for the server
 *     payload field name "level_label". The template should call c.levelLabel(...).
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var PREFIX = '[Skills Hub Level Verify v2] ';
    var passed = 0;
    var failed = 0;
    var warned = 0;

    function pass(message) {
        passed++;
        gs.info(PREFIX + 'PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error(PREFIX + 'FAIL - ' + message);
    }

    function warn(message) {
        warned++;
        gs.warn(PREFIX + 'WARN - ' + message);
    }

    function getWidget(name) {
        var gr = new GlideRecord('sp_widget');
        gr.addQuery('name', name);
        gr.setLimit(1);
        gr.query();
        return gr.next() ? gr : null;
    }

    function checkContains(label, value, marker) {
        if ((value || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    gs.info(PREFIX + '===== STARTING SKILL LEVEL ALIGNMENT VERIFICATION =====');

    var skill = new GlideRecord('cmn_skill');
    if (!skill.isValid()) {
        fail('cmn_skill table is not queryable');
    } else if (!skill.isValidField('level_type')) {
        fail('cmn_skill.level_type field is missing');
    } else {
        pass('cmn_skill.level_type field exists');
        skill.addNotNullQuery('level_type');
        skill.setLimit(1);
        skill.query();
        if (skill.next()) {
            pass('At least one skill has a level type');

            var level = new GlideRecord('cmn_skill_level');
            if (!level.isValid()) {
                fail('cmn_skill_level table is not queryable');
            } else if (!level.isValidField('value')) {
                fail('cmn_skill_level.value field is missing');
            } else {
                pass('cmn_skill_level.value field exists');

                var typeField = level.isValidField('level_type') ? 'level_type' :
                    (level.isValidField('skill_level_type') ? 'skill_level_type' : '');
                if (!typeField) {
                    fail('cmn_skill_level has no recognized level type reference field');
                } else {
                    pass('cmn_skill_level type field found: ' + typeField);
                    level.addQuery(typeField, skill.getValue('level_type'));
                    level.orderBy('value');
                    level.query();
                    var count = 0;
                    var values = [];
                    while (level.next()) {
                        count++;
                        values.push(level.getValue('value') + ':' + level.getDisplayValue());
                    }
                    if (count > 0) pass('Sample skill level type has ' + count + ' child levels: ' + values.join(', '));
                    else fail('Sample skill level type has no child cmn_skill_level rows');
                }
            }
        } else {
            warn('No sampled cmn_skill rows have level_type populated; widgets should use fallback levels');
        }
    }

    var profile = getWidget('Skills Hub - My Profile');
    if (profile) {
        pass('My Profile widget exists');
        checkContains('My Profile server', profile.getValue('script'), 'Skills Hub Level Alignment 51');
        checkContains('My Profile server', profile.getValue('script'), 'sh51GetLevelScaleForSkill');
        checkContains('My Profile server payload', profile.getValue('script'), 'level_label');
        checkContains('My Profile client', profile.getValue('client_script'), 'c.levelLabel');
        checkContains('My Profile template', profile.getValue('template'), 'c.levelLabel');
    } else {
        fail('My Profile widget not found');
    }

    var find = getWidget('Skills Hub - Find Expert');
    if (find) {
        pass('Find Expert widget exists');
        checkContains('Find Expert server', find.getValue('script'), 'Skills Hub Level Alignment 51');
        checkContains('Find Expert template', find.getValue('template'), 'level_label');
    } else {
        fail('Find Expert widget not found');
    }

    var manager = getWidget('Skills Hub - Manager Matrix');
    if (manager) {
        pass('Manager Matrix widget exists');
        checkContains('Manager Matrix client', manager.getValue('client_script'), 'resolveLevelLabel');
        checkContains('Manager Matrix template', manager.getValue('template'), 'resolveLevelLabel');
    } else {
        fail('Manager Matrix widget not found');
    }

    gs.info(PREFIX + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed, ' + warned + ' warnings =====');
})();
