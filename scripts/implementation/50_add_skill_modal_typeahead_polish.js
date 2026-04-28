/**
 * Fix Script: 50_add_skill_modal_typeahead_polish.js
 * Purpose: Polish Add Skill modal secondary action and make skill search feel
 *          more like a select2/typeahead control.
 *
 * Fixes:
 *   - Styles "Request a new skill" as a proper secondary action.
 *   - Shows initial skill suggestions when the search input receives focus.
 *   - Keeps typed search behavior for narrowing results.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 50_add_skill_modal_typeahead_polish =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 50');
            return;
        }

        var server = widget.getValue('script') || '';
        var client = widget.getValue('client_script') || '';
        var template = widget.getValue('template') || '';
        var css = widget.getValue('css') || '';

        // Make empty search terms useful so focus can load the first page of skills.
        server = replaceAll(
            server,
            '      sg.addQuery("name", "CONTAINS", term);\n      sg.orderBy("name");',
            '      if (term) sg.addQuery("name", "CONTAINS", term);\n      sg.orderBy("name");'
        );

        // Add focus hook to the modal input.
        if (template.indexOf('ng-focus="onSearchFocus()"') < 0) {
            template = template.replace(
                'ng-change="onSearchChange()" placeholder="Type to search skills..."',
                'ng-change="onSearchChange()" ng-focus="onSearchFocus()" placeholder="Type to search skills..." autocomplete="off"'
            );
        }

        // Add a stronger class hook for the request button.
        template = replaceAll(
            template,
            'class="btn-request-skill"',
            'class="btn btn-request-skill"'
        );

        if (client.indexOf('$scope.loadSkillSuggestions') < 0) {
            client = client.replace(
                '              $scope.onSearchChange = function() {\n                  if (!$scope.searchTerm || $scope.searchTerm.length < 2) {\n                      $scope.searchResults = [];\n                      return;\n                  }\n                  parentCtrl.server.get({\n                      action: "searchSkills",\n                      term: $scope.searchTerm\n                  }).then(function(r) {\n                      $scope.searchResults = r.data.skillNames || [];\n                  });\n              };',
                [
                    '              $scope.loadSkillSuggestions = function(term) {',
                    '                  parentCtrl.server.get({',
                    '                      action: "searchSkills",',
                    '                      term: term || ""',
                    '                  }).then(function(r) {',
                    '                      $scope.searchResults = r.data.skillNames || [];',
                    '                  });',
                    '              };',
                    '',
                    '              $scope.onSearchFocus = function() {',
                    '                  if ($scope.selectedSkillName) return;',
                    '                  if (!$scope.searchTerm || $scope.searchTerm.length < 2) {',
                    '                      $scope.loadSkillSuggestions("");',
                    '                  }',
                    '              };',
                    '',
                    '              $scope.onSearchChange = function() {',
                    '                  if (!$scope.searchTerm || $scope.searchTerm.length < 2) {',
                    '                      $scope.loadSkillSuggestions("");',
                    '                      return;',
                    '                  }',
                    '                  $scope.loadSkillSuggestions($scope.searchTerm);',
                    '              };'
                ].join('\n')
            );
        }

        if (css.indexOf('Skills Hub Typeahead Polish 50') < 0) {
            css += [
                '',
                '/* Skills Hub Typeahead Polish 50 */',
                '.request-skill-callout { margin-top:16px !important; padding:12px 14px !important; border:1px solid #c7e3f4 !important; background:#f6fbfe !important; border-radius:8px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; gap:12px !important; flex-wrap:wrap !important; }',
                '.request-skill-copy { display:flex !important; align-items:center !important; gap:7px !important; color:#334155 !important; font-size:13px !important; font-weight:700 !important; }',
                '.request-skill-copy i { color:#0078bf !important; }',
                '.btn.btn-request-skill { min-height:32px !important; padding:7px 12px !important; border-radius:8px !important; border:1px solid #0078bf !important; background:#ffffff !important; color:#0078bf !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; font-size:12px !important; font-weight:800 !important; line-height:1 !important; box-shadow:0 1px 2px rgba(15,23,42,0.08) !important; }',
                '.btn.btn-request-skill:hover, .btn.btn-request-skill:focus { background:#0078bf !important; color:#ffffff !important; outline:none !important; text-decoration:none !important; }',
                '.skill-search-results { margin-top:0 !important; border-color:#cbd5e1 !important; box-shadow:0 8px 18px rgba(15,23,42,0.12) !important; }',
                '.skill-search-results .list-group-item { border-left:0 !important; border-right:0 !important; color:#1e293b !important; font-size:13px !important; }',
                '.skill-search-results .list-group-item:hover, .skill-search-results .list-group-item:focus { background:#e8f4fb !important; color:#005a8f !important; }'
            ].join('\n');
        }

        widget.setValue('script', server);
        widget.setValue('client_script', client);
        widget.setValue('template', template);
        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 50_add_skill_modal_typeahead_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 50_add_skill_modal_typeahead_polish failed: ' + e.message);
    }
})();
