/**
 * Fix Script: 72_repair_add_skill_focus_guard.js
 * Purpose: Hide Add Skill suggestions unless the search box is focused.
 *
 * Issue:
 *   Search results were rendered solely from searchResults.length, so they
 *   could remain visible after focus moved into the category picker/header.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 72_repair_add_skill_focus_guard =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 72');
            return;
        }

        var client = widget.getValue('client_script') || '';
        var template = widget.getValue('template') || '';

        if (client.indexOf('$scope.searchFocused = false;') < 0) {
            client = client.replace(
                '              $scope.searchResults = [];',
                '              $scope.searchResults = [];\n              $scope.searchFocused = false;'
            );
        }

        client = client.replace(
            '              $scope.onSearchFocus = function() {\n                  if ($scope.selectedSkillName) return;',
            '              $scope.onSearchFocus = function() {\n                  $scope.searchFocused = true;\n                  if ($scope.selectedSkillName) return;'
        );

        if (client.indexOf('$scope.onSearchBlur') < 0) {
            client = client.replace(
                '              $scope.hideSkillSuggestions = function() {',
                '              $scope.onSearchBlur = function() {\n                  $scope.searchFocused = false;\n                  $scope.searchResults = [];\n              };\n\n              $scope.hideSkillSuggestions = function() {'
            );
        }

        template = replaceAll(template, 'ng-blur="searchResults = []"', 'ng-blur="onSearchBlur()"');
        template = replaceAll(template, 'ng-blur="hideSkillSuggestions()"', 'ng-blur="onSearchBlur()"');
        template = replaceAll(
            template,
            'ng-if="searchResults.length > 0 && !selectedSkillName"',
            'ng-if="searchFocused && searchResults.length > 0 && !selectedSkillName"'
        );

        if (template.indexOf('Skills Hub Add Skill Focus Guard 72') < 0) {
            template = template.replace(
                '<div class="modal-body">',
                '<div class="modal-body"><!-- Skills Hub Add Skill Focus Guard 72 -->'
            );
        }

        widget.setValue('client_script', client);
        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] Add Skill focus guard repaired');
        gs.info('[Skills Hub] ===== COMPLETED 72_repair_add_skill_focus_guard =====');
    } catch (e) {
        gs.error('[Skills Hub] 72_repair_add_skill_focus_guard failed: ' + e.message);
    }
})();
