/**
 * Fix Script: 70_repair_add_skill_blur_behavior.js
 * Purpose: Make Add Skill search suggestions reliably close when focus moves.
 *
 * Issue:
 *   The modal search results remained visible after focus left the search
 *   textbox. Use a direct Angular assignment on blur and close suggestions
 *   when the user moves into the modal header/category controls.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 70_repair_add_skill_blur_behavior =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 70');
            return;
        }

        var template = widget.getValue('template') || '';

        template = replaceAll(template, 'ng-blur="hideSkillSuggestions()"', 'ng-blur="searchResults = []"');

        if (template.indexOf('ng-blur="searchResults = []"') < 0) {
            template = template.replace(
                'ng-change="onSearchChange()" ng-focus="onSearchFocus()" placeholder="Type to search skills..." autocomplete="off"',
                'ng-change="onSearchChange()" ng-focus="onSearchFocus()" ng-blur="searchResults = []" placeholder="Type to search skills..." autocomplete="off"'
            );
            template = template.replace(
                'ng-change="onSearchChange()" placeholder="Type to search skills..."',
                'ng-change="onSearchChange()" ng-blur="searchResults = []" placeholder="Type to search skills..."'
            );
        }

        if (template.indexOf('Skills Hub Add Skill Blur Repair 70') < 0) {
            template = template.replace(
                '<div class="modal-header"',
                '<div class="modal-header" ng-click="searchResults = []"'
            );
            template = template.replace(
                '<div class="form-group skill-category-filter">',
                '<div class="form-group skill-category-filter" ng-click="searchResults = []"><!-- Skills Hub Add Skill Blur Repair 70 -->'
            );
        }

        // If script 68 already put its marker immediately inside the category
        // filter, preserve both markers while still adding the click close.
        template = template.replace(
            '<div class="form-group skill-category-filter"><!-- Skills Hub Category Picker Repair 68 -->',
            '<div class="form-group skill-category-filter" ng-click="searchResults = []"><!-- Skills Hub Category Picker Repair 68 --><!-- Skills Hub Add Skill Blur Repair 70 -->'
        );

        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] Add Skill blur behavior repaired');
        gs.info('[Skills Hub] ===== COMPLETED 70_repair_add_skill_blur_behavior =====');
    } catch (e) {
        gs.error('[Skills Hub] 70_repair_add_skill_blur_behavior failed: ' + e.message);
    }
})();
