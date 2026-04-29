/**
 * Fix Script: 68_repair_add_skill_category_picker.js
 * Purpose: Repair Add Skill modal category picker Angular expressions.
 *
 * Issue:
 *   Script 66 injected sn-record-picker attributes with escaped single quotes
 *   in the stored template. Angular sees values like \'cmn_skill_category\'
 *   and throws a parse error, which prevents modal search behavior from
 *   running correctly.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 68_repair_add_skill_category_picker =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 68');
            return;
        }

        var template = widget.getValue('template') || '';
        var before = template;

        template = replaceAll(template, 'table="\\\'cmn_skill_category\\\'"', 'table="\'cmn_skill_category\'"');
        template = replaceAll(template, 'display-field="\\\'name\\\'"', 'display-field="\'name\'"');
        template = replaceAll(template, 'value-field="\\\'sys_id\\\'"', 'value-field="\'sys_id\'"');
        template = replaceAll(template, 'search-fields="\\\'name\\\'"', 'search-fields="\'name\'"');

        // Some instances may have stored the backslashes as literal doubled
        // characters depending on how the background script was pasted.
        template = replaceAll(template, 'table="\\\\\'cmn_skill_category\\\\\'"', 'table="\'cmn_skill_category\'"');
        template = replaceAll(template, 'display-field="\\\\\'name\\\\\'"', 'display-field="\'name\'"');
        template = replaceAll(template, 'value-field="\\\\\'sys_id\\\\\'"', 'value-field="\'sys_id\'"');
        template = replaceAll(template, 'search-fields="\\\\\'name\\\\\'"', 'search-fields="\'name\'"');

        if (template.indexOf('Skills Hub Category Picker Repair 68') < 0) {
            template = template.replace(
                '<div class="form-group skill-category-filter">',
                '<div class="form-group skill-category-filter"><!-- Skills Hub Category Picker Repair 68 -->'
            );
        }

        if (template != before) {
            widget.setValue('template', template);
            widget.update();
            gs.info('[Skills Hub] Add Skill category picker template repaired');
        } else {
            gs.info('[Skills Hub] No category picker quote repair was needed');
        }

        gs.info('[Skills Hub] ===== COMPLETED 68_repair_add_skill_category_picker =====');
    } catch (e) {
        gs.error('[Skills Hub] 68_repair_add_skill_category_picker failed: ' + e.message);
    }
})();
