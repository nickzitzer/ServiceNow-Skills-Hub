/**
 * Fix Script: 23_update_add_skill_modal.js
 * Purpose: Replace the Add Skill modal with category-aware version
 *
 * Flow:
 *   1. User types in search box -> typeahead shows deduplicated skill names
 *   2. User selects a skill name -> server returns all categories linked to
 *      any cmn_skill with that name (via cmn_skill_m2m_category), with parent
 *      path and the specific cmn_skill sys_id for each
 *   3. User checks categories -> save creates one sys_user_has_skill per
 *      checked category, pointing to the category-specific cmn_skill record
 *
 * Run via: Scripts - Background (Global scope)
 * NOT idempotent: Replaces the full widget server/client/template each run
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 23_update_add_skill_modal =====');

        // ============================================================
        // 1. Find the My Profile widget
        // ============================================================
        var widgetGR = new GlideRecord('sp_widget');
        widgetGR.addQuery('name', 'Skills Hub - My Profile');
        widgetGR.query();
        if (!widgetGR.next()) {
            gs.error('[Skills Hub] Widget "Skills Hub - My Profile" not found. Aborting.');
            return;
        }
        var widgetId = widgetGR.getUniqueValue();
        gs.info('[Skills Hub] Found widget: sys_id=' + widgetId);

        // Resolve catalog item for "Request New Skill" link
        var catalogItemSysId = 'REQUEST_NEW_SKILL_ID';
        var catItemGR = new GlideRecord('sc_cat_item');
        catItemGR.addQuery('name', 'Request New Skill');
        catItemGR.setLimit(1);
        catItemGR.query();
        if (catItemGR.next()) {
            catalogItemSysId = catItemGR.getUniqueValue();
        }

        // ============================================================
        // 2. Build new SERVER SCRIPT
        // ============================================================
        // We READ the current server script and inject our new action
        // handlers right after the opening brace of the IIFE, REPLACING
        // any previous Phase 3 injection and the old add_skill handler.

        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var currentServer = widgetGR.getValue('script') || '';

        // Strip any previous Phase 3 injection
        var cleanServer = currentServer;
        var p3Start = cleanServer.indexOf('// --- Injected by 23_update_add_skill_modal');
        if (p3Start > -1) {
            var p3End = cleanServer.indexOf('// --- End Phase 3 injection ---');
            if (p3End > -1) {
                cleanServer = cleanServer.substring(0, p3Start) + cleanServer.substring(p3End + '// --- End Phase 3 injection ---'.length);
            }
        }
        // Also strip any older Phase 3 getCategories/multi-add
        p3Start = cleanServer.indexOf('// --- Phase 3: getCategories handler ---');
        if (p3Start > -1) {
            var p3End2 = cleanServer.indexOf('// --- Phase 3: multi-category add_skill handler ---');
            if (p3End2 > -1) {
                // Find the end of the multi-add block (the return; } line)
                var returnEnd = cleanServer.indexOf('        return;\n    }\n', p3End2);
                if (returnEnd > -1) {
                    cleanServer = cleanServer.substring(0, p3Start) + cleanServer.substring(returnEnd + '        return;\n    }\n'.length);
                }
            }
        }

        // New server-side action handlers
        var newServerHandlers = '\n'
            + '  // --- Phase 3: Category-aware Add Skill (injected by script 23) ---\n'
            + '  if (input && input.action == "searchSkills") {\n'
            + '      // Return deduplicated skill names matching search term\n'
            + '      var term = input.term || "";\n'
            + '      var nameMap = {};\n'
            + '      var sg = new GlideRecord("cmn_skill");\n'
            + '      sg.addQuery("active", true);\n'
            + '      sg.addQuery("name", "CONTAINS", term);\n'
            + '      sg.orderBy("name");\n'
            + '      sg.setLimit(50);\n'
            + '      sg.query();\n'
            + '      while (sg.next()) {\n'
            + '          var sName = sg.getValue("name");\n'
            + '          if (!nameMap[sName]) nameMap[sName] = true;\n'
            + '      }\n'
            + '      var nameList = [];\n'
            + '      for (var n in nameMap) nameList.push(n);\n'
            + '      nameList.sort();\n'
            + '      data.skillNames = nameList;\n'
            + '      return;\n'
            + '  }\n'
            + '\n'
            + '  if (input && input.action == "getSkillCategories") {\n'
            + '      // Given a skill name, find all categories linked via cmn_skill_m2m_category\n'
            + '      var skillName = input.skill_name || "";\n'
            + '      var currentUser = gs.getUserID();\n'
            + '      var catResults = [];\n'
            + '\n'
            + '      // Find all cmn_skill records with this name\n'
            + '      var skillGR = new GlideRecord("cmn_skill");\n'
            + '      skillGR.addQuery("name", skillName);\n'
            + '      skillGR.addQuery("active", true);\n'
            + '      skillGR.query();\n'
            + '      while (skillGR.next()) {\n'
            + '          var skillId = skillGR.getUniqueValue();\n'
            + '          // Find M2M links for this skill\n'
            + '          var m2m = new GlideRecord("cmn_skill_m2m_category");\n'
            + '          m2m.addQuery("skill", skillId);\n'
            + '          m2m.query();\n'
            + '          while (m2m.next()) {\n'
            + '              var catId = m2m.getValue("category");\n'
            + '              var catGR = new GlideRecord("cmn_skill_category");\n'
            + '              if (!catGR.get(catId)) continue;\n'
            + '              // Build parent path\n'
            + '              var catName = catGR.getValue("name");\n'
            + '              var parentPath = catName;\n'
            + '              var parentRef = catGR.getValue("parent");\n'
            + '              var depth = 0;\n'
            + '              while (parentRef && depth < 5) {\n'
            + '                  var pGR = new GlideRecord("cmn_skill_category");\n'
            + '                  if (pGR.get(parentRef)) {\n'
            + '                      parentPath = pGR.getValue("name") + " > " + parentPath;\n'
            + '                      parentRef = pGR.getValue("parent");\n'
            + '                  } else break;\n'
            + '                  depth++;\n'
            + '              }\n'
            + '              // Check if user already has this specific skill\n'
            + '              var hasIt = new GlideRecord("sys_user_has_skill");\n'
            + '              hasIt.addQuery("user", currentUser);\n'
            + '              hasIt.addQuery("skill", skillId);\n'
            + '              hasIt.query();\n'
            + '              catResults.push({\n'
            + '                  cmn_skill_id: skillId,\n'
            + '                  category_path: parentPath,\n'
            + '                  category_name: catName,\n'
            + '                  already_added: hasIt.hasNext()\n'
            + '              });\n'
            + '          }\n'
            + '      }\n'
            + '      // If no M2M links found, just return the single skill\n'
            + '      if (catResults.length == 0) {\n'
            + '          var fallback = new GlideRecord("cmn_skill");\n'
            + '          fallback.addQuery("name", skillName);\n'
            + '          fallback.addQuery("active", true);\n'
            + '          fallback.setLimit(1);\n'
            + '          fallback.query();\n'
            + '          if (fallback.next()) {\n'
            + '              var fbId = fallback.getUniqueValue();\n'
            + '              var fbHas = new GlideRecord("sys_user_has_skill");\n'
            + '              fbHas.addQuery("user", gs.getUserID());\n'
            + '              fbHas.addQuery("skill", fbId);\n'
            + '              fbHas.query();\n'
            + '              catResults.push({\n'
            + '                  cmn_skill_id: fbId,\n'
            + '                  category_path: "Uncategorized",\n'
            + '                  category_name: "Uncategorized",\n'
            + '                  already_added: fbHas.hasNext()\n'
            + '              });\n'
            + '          }\n'
            + '      }\n'
            + '      data.skillCategories = catResults;\n'
            + '      return;\n'
            + '  }\n'
            + '\n'
            + '  if (input && input.action == "add_skill" && input.category_skill_ids) {\n'
            + '      // Multi-category add: comma-separated cmn_skill sys_ids\n'
            + '      var addedCount = 0;\n'
            + '      var skippedCount = 0;\n'
            + '      var currentUser = gs.getUserID();\n'
            + '      var idList = input.category_skill_ids.split(",");\n'
            + '      for (var si = 0; si < idList.length; si++) {\n'
            + '          var sid = idList[si].trim();\n'
            + '          if (!sid) continue;\n'
            + '          var dup = new GlideRecord("sys_user_has_skill");\n'
            + '          dup.addQuery("user", currentUser);\n'
            + '          dup.addQuery("skill", sid);\n'
            + '          dup.query();\n'
            + '          if (dup.hasNext()) { skippedCount++; continue; }\n'
            + '          var ns = new GlideRecord("sys_user_has_skill");\n'
            + '          ns.initialize();\n'
            + '          ns.setValue("user", currentUser);\n'
            + '          ns.setValue("skill", sid);\n'
            + '          ns.setValue("skill_level", "Novice");\n'
            + '          ns.setValue("u_interest_level", "neutral");\n'
            + '          if (ns.insert()) addedCount++;\n'
            + '      }\n'
            + '      // Don\'t return here - let it fall through to re-fetch skills list\n'
            + '  }\n'
            + '  // --- End Phase 3 ---\n';

        // Inject into the existing IIFE
        var trimmedServer = cleanServer.trim();
        var braceIdx = trimmedServer.indexOf('{');
        if (braceIdx > -1) {
            var newServer = trimmedServer.substring(0, braceIdx + 1)
                + newServerHandlers
                + trimmedServer.substring(braceIdx + 1);
            widgetGR.setValue('script', newServer);
            widgetGR.update();
            gs.info('[Skills Hub] Server script patched with searchSkills + getSkillCategories + multi-add');
        } else {
            gs.error('[Skills Hub] Could not find IIFE opening brace in server script');
        }

        // ============================================================
        // 3. Build new TEMPLATE (replace modal only)
        // ============================================================
        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var currentTemplate = widgetGR.getValue('template') || '';

        var newModalTemplate = ''
            + '<script type="text/ng-template" id="addSkillModal.html">\n'
            + '    <div class="modal-header">\n'
            + '        <h4 class="modal-title"><i class="fa fa-plus-circle"></i> Add New Skill</h4>\n'
            + '    </div>\n'
            + '    <div class="modal-body">\n'
            + '        <div class="form-group">\n'
            + '            <label>Search Skills</label>\n'
            + '            <input type="text" class="form-control" ng-model="searchTerm"\n'
            + '                   ng-change="onSearchChange()" placeholder="Type to search skills..."\n'
            + '                   ng-model-options="{debounce: 300}">\n'
            + '            <div ng-if="searchResults.length > 0 && !selectedSkillName" class="skill-search-results"\n'
            + '                 style="max-height:200px; overflow-y:auto; border:1px solid #ddd; border-top:none; border-radius:0 0 4px 4px;">\n'
            + '                <a ng-repeat="name in searchResults" class="list-group-item list-group-item-action"\n'
            + '                   style="cursor:pointer; padding:8px 12px;" ng-click="selectSkill(name)">\n'
            + '                    {{name}}\n'
            + '                </a>\n'
            + '            </div>\n'
            + '        </div>\n'
            + '        <div ng-if="selectedSkillName" class="selected-skill-badge" style="margin-bottom:12px;">\n'
            + '            <span class="label label-primary" style="font-size:14px; padding:6px 12px;">\n'
            + '                {{selectedSkillName}}\n'
            + '                <i class="fa fa-times" style="cursor:pointer; margin-left:6px;" ng-click="clearSelection()"></i>\n'
            + '            </span>\n'
            + '        </div>\n'
            + '        <div ng-if="loadingCategories" class="text-center" style="margin:15px 0;">\n'
            + '            <i class="fa fa-spinner fa-spin"></i> Loading categories...\n'
            + '        </div>\n'
            + '        <div ng-if="categories.length > 0" class="category-section">\n'
            + '            <label>Select categories to assess this skill under:</label>\n'
            + '            <div class="checkbox" ng-repeat="cat in categories" style="margin:4px 0;">\n'
            + '                <label style="font-weight:normal;">\n'
            + '                    <input type="checkbox" ng-model="cat.selected" ng-disabled="cat.already_added">\n'
            + '                    {{cat.category_path}}\n'
            + '                    <span ng-if="cat.already_added" class="text-muted" style="font-style:italic;"> (already added)</span>\n'
            + '                </label>\n'
            + '            </div>\n'
            + '        </div>\n'
            + '        <div ng-if="categories.length == 0 && selectedSkillName && !loadingCategories"\n'
            + '             class="alert alert-warning small" style="margin-top:10px;">\n'
            + '            <i class="fa fa-exclamation-triangle"></i> No categories found for this skill.\n'
            + '        </div>\n'
            + '        <div class="alert alert-info small" style="margin-top:15px;">\n'
            + '            <i class="fa fa-info-circle"></i> Can\'t find a skill?\n'
            + '            <a href="?id=sc_cat_item&sys_id=' + catalogItemSysId + '">Request it here.</a>\n'
            + '        </div>\n'
            + '    </div>\n'
            + '    <div class="modal-footer">\n'
            + '        <button class="btn btn-default" ng-click="cancel()">Cancel</button>\n'
            + '        <button class="btn btn-primary" ng-click="save()"\n'
            + '                ng-disabled="!selectedSkillName || getSelectedCount() == 0">Add Skill</button>\n'
            + '    </div>\n'
            + '</script>';

        // Replace existing modal template
        var modalStart = currentTemplate.indexOf('<script type="text/ng-template" id="addSkillModal.html">');
        if (modalStart === -1) {
            modalStart = currentTemplate.indexOf("<script type='text/ng-template' id='addSkillModal.html'>");
        }
        if (modalStart > -1) {
            var modalEnd = currentTemplate.indexOf('</script>', modalStart);
            if (modalEnd > -1) {
                currentTemplate = currentTemplate.substring(0, modalStart)
                    + newModalTemplate
                    + currentTemplate.substring(modalEnd + '</script>'.length);
            }
        } else {
            currentTemplate = currentTemplate + '\n' + newModalTemplate;
        }
        widgetGR.setValue('template', currentTemplate);
        widgetGR.update();
        gs.info('[Skills Hub] Template patched with custom typeahead + category checkboxes');

        // ============================================================
        // 4. Build new CLIENT SCRIPT (full replacement of openAddModal)
        // ============================================================
        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var currentClient = widgetGR.getValue('client_script') || '';

        // Remove old openAddModal function entirely
        var oldModalStart = currentClient.indexOf('// 4. Add Skill Modal');
        if (oldModalStart === -1) {
            oldModalStart = currentClient.indexOf('c.openAddModal');
        }
        var cleanClient = currentClient;
        if (oldModalStart > -1) {
            // Find the end of the openAddModal block - it ends with "};  " followed by newline
            // We need to find the matching closing of modalInstance.result.then(...)
            // Safest: find "c.openAddModal" and remove everything from there to the next
            // top-level function or closing brace
            var beforeModal = currentClient.substring(0, oldModalStart);
            var afterModal = currentClient.substring(oldModalStart);

            // Count braces to find end of openAddModal + modalInstance.result.then block
            var braceDepth = 0;
            var foundStart = false;
            var endIdx = 0;
            for (var ci = 0; ci < afterModal.length; ci++) {
                var ch = afterModal[ci];
                if (ch == '{') { braceDepth++; foundStart = true; }
                if (ch == '}') {
                    braceDepth--;
                    if (foundStart && braceDepth <= 0) {
                        // Check if next meaningful chars are "); }" (end of .then + end of function)
                        var remaining = afterModal.substring(ci + 1).trim();
                        if (remaining.indexOf(');') === 0) {
                            endIdx = ci + 1 + afterModal.substring(ci + 1).indexOf(');') + 2;
                            // Skip any trailing whitespace/newlines
                            while (endIdx < afterModal.length && (afterModal[endIdx] == '\n' || afterModal[endIdx] == '\r' || afterModal[endIdx] == ' ')) {
                                endIdx++;
                            }
                            break;
                        } else {
                            endIdx = ci + 1;
                            while (endIdx < afterModal.length && (afterModal[endIdx] == '\n' || afterModal[endIdx] == '\r' || afterModal[endIdx] == ' ' || afterModal[endIdx] == ';')) {
                                endIdx++;
                            }
                            break;
                        }
                    }
                }
            }
            cleanClient = beforeModal + afterModal.substring(endIdx);
        }

        // Also strip any previous Phase 3 injection in client
        var p3ClientStart = cleanClient.indexOf('// --- Phase 3: Category-aware Add Skill Modal ---');
        if (p3ClientStart > -1) {
            var p3ClientEnd = cleanClient.indexOf('// --- End Phase 3: Category-aware Add Skill Modal ---');
            if (p3ClientEnd > -1) {
                cleanClient = cleanClient.substring(0, p3ClientStart)
                    + cleanClient.substring(p3ClientEnd + '// --- End Phase 3: Category-aware Add Skill Modal ---'.length);
            }
        }

        // New openAddModal with custom typeahead + category checkboxes
        var newOpenAddModal = ''
            + '  // --- Category-aware Add Skill Modal (script 23) ---\n'
            + '  c.openAddModal = function() {\n'
            + '      var parentCtrl = c;\n'
            + '      $uibModal.open({\n'
            + '          templateUrl: "addSkillModal.html",\n'
            + '          controller: function($scope, $uibModalInstance) {\n'
            + '              $scope.searchTerm = "";\n'
            + '              $scope.searchResults = [];\n'
            + '              $scope.selectedSkillName = "";\n'
            + '              $scope.categories = [];\n'
            + '              $scope.loadingCategories = false;\n'
            + '\n'
            + '              $scope.onSearchChange = function() {\n'
            + '                  if (!$scope.searchTerm || $scope.searchTerm.length < 2) {\n'
            + '                      $scope.searchResults = [];\n'
            + '                      return;\n'
            + '                  }\n'
            + '                  parentCtrl.server.get({\n'
            + '                      action: "searchSkills",\n'
            + '                      term: $scope.searchTerm\n'
            + '                  }).then(function(r) {\n'
            + '                      $scope.searchResults = r.data.skillNames || [];\n'
            + '                  });\n'
            + '              };\n'
            + '\n'
            + '              $scope.selectSkill = function(name) {\n'
            + '                  $scope.selectedSkillName = name;\n'
            + '                  $scope.searchTerm = name;\n'
            + '                  $scope.searchResults = [];\n'
            + '                  $scope.loadingCategories = true;\n'
            + '                  $scope.categories = [];\n'
            + '                  parentCtrl.server.get({\n'
            + '                      action: "getSkillCategories",\n'
            + '                      skill_name: name\n'
            + '                  }).then(function(r) {\n'
            + '                      $scope.loadingCategories = false;\n'
            + '                      var cats = r.data.skillCategories || [];\n'
            + '                      for (var i = 0; i < cats.length; i++) {\n'
            + '                          cats[i].selected = !cats[i].already_added;\n'
            + '                      }\n'
            + '                      $scope.categories = cats;\n'
            + '                  });\n'
            + '              };\n'
            + '\n'
            + '              $scope.clearSelection = function() {\n'
            + '                  $scope.selectedSkillName = "";\n'
            + '                  $scope.searchTerm = "";\n'
            + '                  $scope.categories = [];\n'
            + '                  $scope.searchResults = [];\n'
            + '              };\n'
            + '\n'
            + '              $scope.getSelectedCount = function() {\n'
            + '                  var count = 0;\n'
            + '                  for (var i = 0; i < $scope.categories.length; i++) {\n'
            + '                      if ($scope.categories[i].selected && !$scope.categories[i].already_added) count++;\n'
            + '                  }\n'
            + '                  return count;\n'
            + '              };\n'
            + '\n'
            + '              $scope.save = function() {\n'
            + '                  var ids = [];\n'
            + '                  for (var i = 0; i < $scope.categories.length; i++) {\n'
            + '                      if ($scope.categories[i].selected && !$scope.categories[i].already_added) {\n'
            + '                          ids.push($scope.categories[i].cmn_skill_id);\n'
            + '                      }\n'
            + '                  }\n'
            + '                  if (ids.length == 0) return;\n'
            + '                  parentCtrl.server.get({\n'
            + '                      action: "add_skill",\n'
            + '                      category_skill_ids: ids.join(",")\n'
            + '                  }).then(function(r) {\n'
            + '                      $uibModalInstance.close();\n'
            + '                      parentCtrl.data.skills = r.data.skills;\n'
            + '                      parentCtrl.data.stats = r.data.stats;\n'
            + '                  });\n'
            + '              };\n'
            + '\n'
            + '              $scope.cancel = function() {\n'
            + '                  $uibModalInstance.dismiss("cancel");\n'
            + '              };\n'
            + '          }\n'
            + '      });\n'
            + '  };\n';

        // Inject before closing brace
        var lastBrace = cleanClient.lastIndexOf('}');
        if (lastBrace > -1) {
            var newClient = cleanClient.substring(0, lastBrace) + '\n' + newOpenAddModal + cleanClient.substring(lastBrace);
            widgetGR.setValue('client_script', newClient);
            widgetGR.update();
            gs.info('[Skills Hub] Client script patched with category-aware openAddModal');
        } else {
            gs.error('[Skills Hub] Could not find closing brace in client script');
        }

        gs.info('[Skills Hub] ===== SCRIPT 23 COMPLETE =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in script 23: ' + e.message);
    }
})();
