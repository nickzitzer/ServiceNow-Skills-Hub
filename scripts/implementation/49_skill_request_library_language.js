/**
 * Fix Script: 49_skill_request_library_language.js
 * Purpose: Replace ServiceNow-internal "catalog skill" language with user-facing
 *          "skill library" language.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 49_skill_request_library_language =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var item = new GlideRecord('sc_cat_item');
        item.addQuery('name', 'Request New Skill');
        item.setLimit(1);
        item.query();
        if (item.next()) {
            item.setValue('short_description', 'Request a missing skill for the Skills Hub library');
            item.setValue(
                'description',
                'Use this form when a skill exists in the work people do, but is missing from the Skills Hub library. Describe what the skill means so it can be classified clearly.'
            );
            item.update();
            gs.info('[Skills Hub] Request New Skill item language updated');
        } else {
            gs.warn('[Skills Hub] Request New Skill item not found');
        }

        var profile = new GlideRecord('sp_widget');
        profile.addQuery('name', 'Skills Hub - My Profile');
        profile.setLimit(1);
        profile.query();
        if (profile.next()) {
            var template = profile.getValue('template') || '';
            template = replaceAll(template, 'Missing from the catalog?', 'Missing from the skill library?');
            template = replaceAll(template, 'Request a new catalog skill', 'Request a new skill');
            profile.setValue('template', template);
            profile.update();
            gs.info('[Skills Hub] My Profile request language updated');
        } else {
            gs.warn('[Skills Hub] My Profile widget not found');
        }

        var email = new GlideRecord('sysevent_email_action');
        email.addQuery('name', 'STARTSWITH', 'Skills Hub - Skill Request');
        email.query();
        while (email.next()) {
            var html = email.getValue('message_html') || '';
            html = replaceAll(html, 'catalog review', 'skill library review');
            html = replaceAll(html, 'reviewed for catalog fit', 'reviewed for library fit');
            html = replaceAll(html, 'Skills Hub catalog', 'Skills Hub library');
            html = replaceAll(html, 'skill catalog', 'skill library');
            email.setValue('message_html', html);
            email.update();
        }

        gs.info('[Skills Hub] ===== COMPLETED 49_skill_request_library_language =====');
    } catch (e) {
        gs.error('[Skills Hub] 49_skill_request_library_language failed: ' + e.message);
    }
})();
