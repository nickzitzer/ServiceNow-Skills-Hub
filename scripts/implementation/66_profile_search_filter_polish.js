/**
 * Fix Script: 66_profile_search_filter_polish.js
 * Purpose: Polish search/filter behavior after Dev UX review.
 *
 * Fixes:
 *   - Add Skill modal suggestions close after focus leaves the search control.
 *   - Add Skill modal can filter skill search by cmn_skill_category.
 *   - My Profile defaults to list view when the user has more than 8 skills.
 *   - My Profile shows skills created after the user's last assessment touch.
 *   - Find Expert typeahead suggestions close after focus leaves the input.
 *   - Find Expert filter selects receive the same picker styling language.
 *   - Manager Matrix hides rows that have no skills matching the active filter.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 66_profile_search_filter_polish =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        function getWidget(name) {
            var widget = new GlideRecord('sp_widget');
            widget.addQuery('name', name);
            widget.setLimit(1);
            widget.query();
            return widget.next() ? widget : null;
        }

        function addCss(css, marker, lines) {
            if (css.indexOf(marker) > -1) return css;
            return css + '\n' + lines.join('\n');
        }

        function injectAfter(text, needle, block) {
            if (text.indexOf(block.split('\n')[0]) > -1) return text;
            var idx = text.indexOf(needle);
            if (idx < 0) return text;
            return text.substring(0, idx + needle.length) + '\n' + block + text.substring(idx + needle.length);
        }

        // ------------------------------------------------------------------
        // My Profile
        // ------------------------------------------------------------------
        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            var pServer = profile.getValue('script') || '';
            var pClient = profile.getValue('client_script') || '';
            var pTemplate = profile.getValue('template') || '';
            var pCss = profile.getValue('css') || '';

            if (pServer.indexOf('Skills Hub Profile Search Filter Polish 66') < 0) {
                var pServerHelpers = [
                    '  // Skills Hub Profile Search Filter Polish 66',
                    '  function sh66SkillIdsForCategory(categoryId) {',
                    '      var ids = [];',
                    '      if (!categoryId) return ids;',
                    '      var rel = new GlideRecord("cmn_skill_m2m_category");',
                    '      if (!rel.isValid()) return ids;',
                    '      rel.addQuery("category", categoryId);',
                    '      rel.query();',
                    '      while (rel.next()) ids.push(rel.getValue("skill"));',
                    '      return ids;',
                    '  }',
                    '  function sh66IsNewSinceAssessment(skillRecord) {',
                    '      try {',
                    '          if (!skillRecord || !skillRecord.skill) return false;',
                    '          var skill = skillRecord.skill.getRefRecord();',
                    '          if (!skill || !skill.isValidRecord()) return false;',
                    '          var skillCreated = skill.getValue("sys_created_on") || "";',
                    '          var lastAssessment = skillRecord.getValue("u_last_manager_validation") || skillRecord.getValue("sys_updated_on") || skillRecord.getValue("sys_created_on") || "";',
                    '          if (!skillCreated || !lastAssessment) return false;',
                    '          return new GlideDateTime(skillCreated).compareTo(new GlideDateTime(lastAssessment)) > 0;',
                    '      } catch (ignore) {',
                    '          return false;',
                    '      }',
                    '  }',
                    ''
                ].join('\n');
                pServer = pServer.replace('(function() {', '(function() {\n' + pServerHelpers);
            }

            // Category-aware search. This builds on script 50's empty-term search behavior.
            if (pServer.indexOf('var categoryFilter = input.category_filter || "";') < 0) {
                pServer = pServer.replace(
                    '      var nameMap = {};\n      var sg = new GlideRecord("cmn_skill");',
                    '      var nameMap = {};\n      var categoryFilter = input.category_filter || "";\n      var categorySkillIds = sh66SkillIdsForCategory(categoryFilter);\n      if (categoryFilter && categorySkillIds.length == 0) {\n          data.skillNames = [];\n          return;\n      }\n      var sg = new GlideRecord("cmn_skill");'
                );
                pServer = pServer.replace(
                    '      sg.addQuery("active", true);\n      if (term) sg.addQuery("name", "CONTAINS", term);',
                    '      sg.addQuery("active", true);\n      if (categoryFilter) sg.addQuery("sys_id", "IN", categorySkillIds.join(","));\n      if (term) sg.addQuery("name", "CONTAINS", term);'
                );
            }

            if (pServer.indexOf('new_since_assessment: sh66IsNewSinceAssessment(s)') < 0) {
                pServer = pServer.replace(
                    '      stale_assessment: staleAssessment',
                    '      stale_assessment: staleAssessment,\n      new_since_assessment: sh66IsNewSinceAssessment(s)'
                );
            }

            if (pClient.indexOf('Skills Hub Profile Search Filter Polish 66') < 0) {
                pClient = pClient.replace(
                    '  // Skills Hub Stabilization 39\n  c.compactMode = false;',
                    [
                        '  // Skills Hub Stabilization 39',
                        '  // Skills Hub Profile Search Filter Polish 66',
                        '  c.userSelectedView = false;',
                        '  c.compactMode = (c.data.skills || []).length > 8;'
                    ].join('\n')
                );
                pClient = pClient.replace(
                    '  c.toggleCompactMode = function() { c.compactMode = !c.compactMode; };',
                    '  c.toggleCompactMode = function() { c.userSelectedView = true; c.compactMode = !c.compactMode; };'
                );
                pClient = pClient.replace(
                    '    if (serverData.skills) c.data.skills = serverData.skills;',
                    '    if (serverData.skills) {\n      c.data.skills = serverData.skills;\n      if (!c.userSelectedView) c.compactMode = (c.data.skills || []).length > 8;\n    }'
                );
            }

            if (pClient.indexOf('$scope.hideSkillSuggestions') < 0) {
                pClient = pClient.replace(
                    '              $scope.loadingCategories = false;',
                    '              $scope.loadingCategories = false;\n              $scope.categoryFilter = { displayValue: "", value: "", name: "category_filter" };'
                );
                pClient = pClient.replace(
                    '                      term: term || ""',
                    '                      term: term || "",\n                      category_filter: ($scope.categoryFilter && $scope.categoryFilter.value) || ""'
                );
                pClient = pClient.replace(
                    '              $scope.onSearchFocus = function() {',
                    '              $scope.hideSkillSuggestions = function() {\n                  setTimeout(function() {\n                      $scope.searchResults = [];\n                      $scope.$applyAsync();\n                  }, 180);\n              };\n\n              $scope.onCategoryChange = function() {\n                  $scope.selectedSkillName = "";\n                  $scope.categories = [];\n                  $scope.loadSkillSuggestions($scope.searchTerm || "");\n              };\n\n              $scope.onSearchFocus = function() {'
                );
            }

            if (pTemplate.indexOf('skill-category-filter') < 0) {
                var categoryFilterHtml = [
                    '        <div class="form-group skill-category-filter">',
                    '            <label>Filter by category</label>',
                    '            <sn-record-picker field="categoryFilter" table="\\\'cmn_skill_category\\\'"',
                    '                              display-field="\\\'name\\\'" value-field="\\\'sys_id\\\'"',
                    '                              search-fields="\\\'name\\\'" page-size="20"',
                    '                              on-change="onCategoryChange()">',
                    '            </sn-record-picker>',
                    '        </div>'
                ].join('\n');
                pTemplate = pTemplate.replace(
                    '        <div class="form-group">\n            <label>Search Skills</label>',
                    [
                        categoryFilterHtml,
                        '        <div class="form-group">',
                        '            <label>Search Skills</label>'
                    ].join('\n')
                );
                if (pTemplate.indexOf('skill-category-filter') < 0) {
                    pTemplate = pTemplate.replace(
                        '        <div class="form-group">\n            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b4b45;">Search Skills</label>',
                        [
                            categoryFilterHtml,
                            '        <div class="form-group">',
                            '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b4b45;">Search Skills</label>'
                        ].join('\n')
                    );
                }
            }

            if (pTemplate.indexOf('ng-blur="hideSkillSuggestions()"') < 0) {
                pTemplate = pTemplate.replace(
                    'ng-change="onSearchChange()" ng-focus="onSearchFocus()" placeholder="Type to search skills..." autocomplete="off"',
                    'ng-change="onSearchChange()" ng-focus="onSearchFocus()" ng-blur="hideSkillSuggestions()" placeholder="Type to search skills..." autocomplete="off"'
                );
                pTemplate = pTemplate.replace(
                    'style="cursor:pointer; padding:8px 12px;" ng-click="selectSkill(name)">',
                    'style="cursor:pointer; padding:8px 12px;" ng-mousedown="$event.preventDefault()" ng-click="selectSkill(name)">'
                );
            }

            if (pTemplate.indexOf('new-since-badge') < 0) {
                pTemplate = replaceAll(
                    pTemplate,
                    '<div class="validation-icon" ng-if="skill.entries[0].stale_assessment"\n                            style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                          <i class="fa fa-clock-o"></i>\n                       </div>',
                    '<div class="validation-icon" ng-if="skill.entries[0].stale_assessment"\n                            style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                          <i class="fa fa-clock-o"></i>\n                       </div>\n                       <span class="new-since-badge" ng-if="skill.entries[0].new_since_assessment" uib-tooltip="This skill was added to the library after your last assessment">New</span>'
                );
                pTemplate = replaceAll(
                    pTemplate,
                    '<div class="validation-icon" ng-if="entry.stale_assessment"\n                              style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                            <i class="fa fa-clock-o"></i>\n                         </div>',
                    '<div class="validation-icon" ng-if="entry.stale_assessment"\n                              style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                            <i class="fa fa-clock-o"></i>\n                         </div>\n                         <span class="new-since-badge" ng-if="entry.new_since_assessment" uib-tooltip="This skill was added to the library after your last assessment">New</span>'
                );
            }

            pCss = addCss(pCss, 'Skills Hub Profile Search Filter Polish 66', [
                '/* Skills Hub Profile Search Filter Polish 66 */',
                '.skill-category-filter { margin-bottom:12px !important; }',
                '.skill-category-filter .select2-choice, .skill-category-filter .select2-choices { min-height:38px !important; border:1px solid #cbd5e1 !important; border-radius:8px !important; background:#fff !important; box-shadow:none !important; display:flex !important; align-items:center !important; }',
                '.skill-category-filter .select2-container { width:100% !important; }',
                '.new-since-badge { display:inline-flex; align-items:center; height:20px; padding:0 7px; border-radius:999px; background:#e8f4fb; border:1px solid #a3d4ef; color:#005a8f; font-size:10px; font-weight:800; text-transform:uppercase; line-height:1; }',
                '.compact-skills .new-since-badge { height:18px; padding:0 6px; font-size:9px; }'
            ]);

            profile.setValue('script', pServer);
            profile.setValue('client_script', pClient);
            profile.setValue('template', pTemplate);
            profile.setValue('css', pCss);
            profile.update();
            gs.info('[Skills Hub] My Profile patched by 66');
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 66');
        }

        // ------------------------------------------------------------------
        // Find Expert
        // ------------------------------------------------------------------
        var find = getWidget('Skills Hub - Find Expert');
        if (find) {
            var fClient = find.getValue('client_script') || '';
            var fTemplate = find.getValue('template') || '';
            var fCss = find.getValue('css') || '';

            if (fClient.indexOf('Skills Hub Find Expert Typeahead Blur 66') < 0) {
                fClient = fClient.replace(
                    '  var searchTimer = null;',
                    [
                        '  var searchTimer = null;',
                        '',
                        '  // Skills Hub Find Expert Typeahead Blur 66',
                        '  c.hideTypeahead = function(which) {',
                        '    setTimeout(function() {',
                        '      if (which == "must") c.mustSuggestions = [];',
                        '      else c.niceSuggestions = [];',
                        '      $scope.$applyAsync();',
                        '    }, 180);',
                        '  };'
                    ].join('\n')
                );
            }

            if (fTemplate.indexOf('c.hideTypeahead') < 0) {
                fTemplate = fTemplate.replace(
                    'ng-change="c.typeaheadSearch(\'must\')"',
                    'ng-change="c.typeaheadSearch(\'must\')" ng-blur="c.hideTypeahead(\'must\')"'
                );
                fTemplate = fTemplate.replace(
                    'ng-change="c.typeaheadSearch(\'nice\')"',
                    'ng-change="c.typeaheadSearch(\'nice\')" ng-blur="c.hideTypeahead(\'nice\')"'
                );
                fTemplate = replaceAll(
                    fTemplate,
                    'ng-click="c.selectSkill(\'must\', s)">',
                    'ng-mousedown="$event.preventDefault()" ng-click="c.selectSkill(\'must\', s)">'
                );
                fTemplate = replaceAll(
                    fTemplate,
                    'ng-click="c.selectSkill(\'nice\', s)">',
                    'ng-mousedown="$event.preventDefault()" ng-click="c.selectSkill(\'nice\', s)">'
                );
            }

            fCss = addCss(fCss, 'Skills Hub Select Polish 66', [
                '/* Skills Hub Select Polish 66 */',
                '.filter-row select.form-control { height:38px !important; border:1px solid #cbd5e1 !important; border-radius:8px !important; background-color:#fff !important; color:#1e293b !important; font-size:13px !important; font-weight:600 !important; box-shadow:none !important; padding:7px 30px 7px 10px !important; appearance:none; -webkit-appearance:none; }',
                '.filter-row select.form-control:focus { border-color:#0078bf !important; box-shadow:0 0 0 2px rgba(0,120,191,.16) !important; outline:none !important; }',
                '.filter-row { align-items:end; }',
                '.typeahead-dropdown { z-index:1055 !important; }'
            ]);

            find.setValue('client_script', fClient);
            find.setValue('template', fTemplate);
            find.setValue('css', fCss);
            find.update();
            gs.info('[Skills Hub] Find Expert patched by 66');
        } else {
            gs.warn('[Skills Hub] Find Expert widget not found during script 66');
        }

        // ------------------------------------------------------------------
        // Manager Matrix
        // ------------------------------------------------------------------
        var manager = getWidget('Skills Hub - Manager Matrix');
        if (manager) {
            var mClient = manager.getValue('client_script') || '';
            var mTemplate = manager.getValue('template') || '';

            if (mClient.indexOf('Skills Hub Manager Row Filter 66') < 0) {
                mClient = mClient.replace(
                    '  c.showSkill = function(details) {',
                    [
                        '  // Skills Hub Manager Row Filter 66',
                        '  c.userHasVisibleSkills = function(user) {',
                        '     if (!user || !user.skills) return c.statusFilter == "all";',
                        '     var hasAny = false;',
                        '     for (var skillName in user.skills) {',
                        '        if (!user.skills.hasOwnProperty(skillName)) continue;',
                        '        hasAny = true;',
                        '        if (c.showSkill(user.skills[skillName])) return true;',
                        '     }',
                        '     return !hasAny && c.statusFilter == "all";',
                        '  };',
                        '',
                        '  c.showSkill = function(details) {'
                    ].join('\n')
                );
            }

            if (mTemplate.indexOf('c.userHasVisibleSkills(user)') < 0) {
                mTemplate = mTemplate.replace(
                    'ng-repeat="(uid, user) in c.data"',
                    'ng-repeat="(uid, user) in c.data" ng-if="c.userHasVisibleSkills(user)"'
                );
            }

            manager.setValue('client_script', mClient);
            manager.setValue('template', mTemplate);
            manager.update();
            gs.info('[Skills Hub] Manager Matrix patched by 66');
        } else {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 66');
        }

        gs.info('[Skills Hub] ===== COMPLETED 66_profile_search_filter_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 66_profile_search_filter_polish failed: ' + e.message);
    }
})();
