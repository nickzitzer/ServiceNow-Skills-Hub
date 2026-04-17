/**
 * Fix Script: 35_group_skill_tiles.js
 * Purpose: Group skill assessment tiles by skill name, showing category sub-entries
 *
 * Changes:
 *   SERVER: Builds grouped data structure - skills grouped by name, each with
 *           category entries containing their own proficiency/validation/endorsement
 *   TEMPLATE: Replaces flat skill cards with grouped cards - one card per skill name,
 *             category sub-rows with independent proficiency bars
 *   CLIENT: updateProficiency/toggleInterest/removeSkill work on sub-entries;
 *           removeSkill removes a single category entry, or the whole card if last one
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 35_group_skill_tiles =====');

        var widgetGR = new GlideRecord('sp_widget');
        widgetGR.addQuery('name', 'Skills Hub - My Profile');
        widgetGR.query();
        if (!widgetGR.next()) {
            gs.error('[Skills Hub] Widget not found. Aborting.');
            return;
        }
        var widgetId = widgetGR.getUniqueValue();
        gs.info('[Skills Hub] Found widget: sys_id=' + widgetId);

        // ============================================================
        // 1. Patch SERVER SCRIPT - grouped data fetch
        // ============================================================
        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var serverScript = widgetGR.getValue('script') || '';

        // Find and replace section 3 (DATA FETCH) through section 4 (TIER CALCULATION)
        // We replace everything from "// --- 3. DATA FETCH" to just before "// --- 4. TIER"
        var section3Start = serverScript.indexOf('// --- 3. DATA FETCH');
        var section4Start = serverScript.indexOf('// --- 4. TIER CALCULATION');

        if (section3Start === -1 || section4Start === -1) {
            gs.error('[Skills Hub] Could not find section markers in server script');
            return;
        }

        var newSection3 = ''
            + '// --- 3. DATA FETCH & STATS CALC (grouped by skill name) ---\n'
            + '  data.skills = [];\n'
            + '  data.stats = { total_skills: 0, total_validations: 0, total_endorsed_given: 0, total_validated_skills: 0 };\n'
            + '\n'
            + '  var profBonusMap = { 1: 2, 2: 5, 3: 10, 4: 20, 5: 35 };\n'
            + '  var skillGroupMap = {}; // keyed by skill name\n'
            + '\n'
            + '  var s = new GlideRecord("sys_user_has_skill");\n'
            + '  s.addQuery("user", me);\n'
            + '  s.orderBy("skill.name");\n'
            + '  s.query();\n'
            + '\n'
            + '  data.stats.total_skills = s.getRowCount();\n'
            + '\n'
            + '  while (s.next()) {\n'
            + '    var skillName = s.skill.name.toString();\n'
            + '    var skillSysId = s.skill.toString();\n'
            + '    var levelStr = s.skill_level.toString();\n'
            + '    var levelInt = 1;\n'
            + '    if (levelStr.indexOf("Novice") > -1) levelInt = 1;\n'
            + '    else if (levelStr.indexOf("Learner") > -1) levelInt = 2;\n'
            + '    else if (levelStr.indexOf("Intermediate") > -1) levelInt = 2;\n'
            + '    else if (levelStr.indexOf("Proficient") > -1) levelInt = 3;\n'
            + '    else if (levelStr.indexOf("Advanced") > -1) levelInt = 4;\n'
            + '    else if (levelStr.indexOf("Expert") > -1) levelInt = 5;\n'
            + '\n'
            + '    var endorsements = parseInt(s.u_peer_endorsement_count.toString() || "0");\n'
            + '    data.stats.total_validations += endorsements;\n'
            + '\n'
            + '    var valStatus = s.u_validation_status.toString();\n'
            + '    if (valStatus == "validated") data.stats.total_validated_skills++;\n'
            + '\n'
            + '    // Resolve category path from cmn_skill_m2m_category\n'
            + '    var catPath = "";\n'
            + '    var catName = "";\n'
            + '    var m2mGR = new GlideRecord("cmn_skill_m2m_category");\n'
            + '    m2mGR.addQuery("skill", skillSysId);\n'
            + '    m2mGR.setLimit(1);\n'
            + '    m2mGR.query();\n'
            + '    if (m2mGR.next()) {\n'
            + '        var cId = m2mGR.getValue("category");\n'
            + '        var cGR = new GlideRecord("cmn_skill_category");\n'
            + '        if (cGR.get(cId)) {\n'
            + '            catName = cGR.getValue("name");\n'
            + '            catPath = catName;\n'
            + '            var pRef = cGR.getValue("parent");\n'
            + '            var d = 0;\n'
            + '            while (pRef && d < 5) {\n'
            + '                var pGR = new GlideRecord("cmn_skill_category");\n'
            + '                if (pGR.get(pRef)) {\n'
            + '                    catPath = pGR.getValue("name") + " > " + catPath;\n'
            + '                    pRef = pGR.getValue("parent");\n'
            + '                } else break;\n'
            + '                d++;\n'
            + '            }\n'
            + '        }\n'
            + '    }\n'
            + '    if (!catPath) catPath = data.user_dept || "Skill";\n'
            + '    if (!catName) catName = catPath;\n'
            + '\n'
            + '    var entry = {\n'
            + '      sys_id: s.getUniqueValue(),\n'
            + '      skill_sys_id: skillSysId,\n'
            + '      category_path: catPath,\n'
            + '      category_name: catName,\n'
            + '      level_display: levelStr,\n'
            + '      level_value: levelInt,\n'
            + '      interest: s.u_interest_level.toString() || "neutral",\n'
            + '      endorsements: endorsements,\n'
            + '      validation_status: valStatus\n'
            + '    };\n'
            + '\n'
            + '    if (!skillGroupMap[skillName]) {\n'
            + '        skillGroupMap[skillName] = {\n'
            + '            name: skillName,\n'
            + '            initials: skillName.substring(0,2).toUpperCase(),\n'
            + '            entries: []\n'
            + '        };\n'
            + '    }\n'
            + '    skillGroupMap[skillName].entries.push(entry);\n'
            + '  }\n'
            + '\n'
            + '  // Convert map to sorted array\n'
            + '  var sortedNames = [];\n'
            + '  for (var sn in skillGroupMap) sortedNames.push(sn);\n'
            + '  sortedNames.sort();\n'
            + '  for (var si = 0; si < sortedNames.length; si++) {\n'
            + '      data.skills.push(skillGroupMap[sortedNames[si]]);\n'
            + '  }\n'
            + '\n'
            + '  // Count endorsements given by this user\n'
            + '  var eg = new GlideAggregate("u_m2m_skill_endorsement");\n'
            + '  eg.addQuery("u_endorser", me);\n'
            + '  eg.addAggregate("COUNT");\n'
            + '  eg.query();\n'
            + '  if (eg.next()) {\n'
            + '     data.stats.total_endorsed_given = parseInt(eg.getAggregate("COUNT")) || 0;\n'
            + '  }\n'
            + '\n'
            + '  // Count skills added this quarter\n'
            + '  var quarterStart = new GlideDateTime();\n'
            + '  var month = parseInt(quarterStart.getMonthLocalTime());\n'
            + '  var qMonth = month - ((month - 1) % 3);\n'
            + '  quarterStart.setMonthLocalTime(qMonth);\n'
            + '  quarterStart.setDayOfMonthLocalTime(1);\n'
            + '  quarterStart.setValue(quarterStart.getDate() + " 00:00:00");\n'
            + '\n'
            + '  var recentCount = 0;\n'
            + '  var rc = new GlideRecord("sys_user_has_skill");\n'
            + '  rc.addQuery("user", me);\n'
            + '  rc.addQuery("sys_created_on", ">=", quarterStart);\n'
            + '  rc.query();\n'
            + '  recentCount = rc.getRowCount();\n'
            + '\n'
            + '  ';

        var newServer = serverScript.substring(0, section3Start) + newSection3 + serverScript.substring(section4Start);
        widgetGR.setValue('script', newServer);
        widgetGR.update();
        gs.info('[Skills Hub] Server script patched with grouped data fetch');

        // ============================================================
        // 2. Patch TEMPLATE - grouped skill cards
        // ============================================================
        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var template = widgetGR.getValue('template') || '';

        // Find the skill cards section: from <div class="row-grid" to the add-card-placeholder closing </div>
        var gridStart = template.indexOf('<div class="row-grid"');
        var addCardEnd = template.indexOf('</div>\r\n     </div>\r\n  </div>\r\n</div>\r\n<script');
        if (addCardEnd === -1) {
            addCardEnd = template.indexOf('</div>\n     </div>\n  </div>\n</div>\n<script');
        }

        if (gridStart === -1) {
            gs.error('[Skills Hub] Could not find row-grid in template');
            return;
        }

        // Find the closing of the row-grid section (before the modal script template)
        var modalStart = template.indexOf('<script type="text/ng-template"');
        if (modalStart === -1) {
            gs.error('[Skills Hub] Could not find modal template marker');
            return;
        }

        // We need to replace from the empty state div through the row-grid, up to but not including the modal
        var emptyStateStart = template.indexOf('<div class="text-center" ng-if="data.skills.length == 0">');
        if (emptyStateStart === -1) {
            gs.error('[Skills Hub] Could not find empty state div');
            return;
        }

        // Find end of the right content column (the </div> before the modal)
        // The structure is: </div>(close col-md-8) </div>(close row) <script...
        // We replace from emptyStateStart to just before </div>\n</div>\n<script
        var beforeModal = template.substring(0, emptyStateStart);
        var afterModalStart = template.substring(modalStart);

        var newSkillsSection = ''
            + '<div class="text-center" ng-if="data.skills.length == 0">\n'
            + '        <div class="well">\n'
            + '           <p class="text-muted">You have not added any skills yet.</p>\n'
            + '           <button class="btn btn-default btn-sm" ng-click="c.openAddModal()">Add Your First Skill</button>\n'
            + '        </div>\n'
            + '     </div>\n'
            + '     <div class="row-grid" ng-if="data.skills.length > 0">\n'
            + '        <div class="col-md-6 col-grid" ng-repeat="skill in data.skills">\n'
            + '           <div class="skill-card">\n'
            + '              <div class="card-header-row">\n'
            + '                 <div>\n'
            + '                    <div class="skill-name">{{skill.name}}</div>\n'
            + '                    <div class="skill-type" ng-if="skill.entries.length == 1">{{skill.entries[0].category_path}}</div>\n'
            + '                    <span class="badge" ng-if="skill.entries.length > 1" style="font-size:10px; background:#e2e8f0; color:#64748b;">\n'
            + '                       {{skill.entries.length}} categories\n'
            + '                    </span>\n'
            + '                 </div>\n'
            + '                 <i class="fa fa-trash-o btn-more" ng-click="c.removeAllEntries(skill)" title="Remove all"></i>\n'
            + '              </div>\n'
            + '              <!-- Category sub-entries -->\n'
            + '              <div ng-repeat="entry in skill.entries" class="category-entry"\n'
            + '                   style="padding:10px 0; border-top:1px solid #f1f5f9;">\n'
            + '                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">\n'
            + '                    <div class="skill-type" style="margin-bottom:0;">{{entry.category_path}}</div>\n'
            + '                    <div style="display:flex; align-items:center; gap:8px;">\n'
            + '                       <div class="validation-icon" ng-if="entry.validation_status == \'validated\'"\n'
            + '                            style="color:#15803d; font-size:12px;" title="Validated">\n'
            + '                          <i class="fa fa-check-circle"></i>\n'
            + '                       </div>\n'
            + '                       <div class="validation-icon" ng-if="entry.validation_status == \'disputed\'"\n'
            + '                            style="color:#dc2626; font-size:12px;" title="Disputed">\n'
            + '                          <i class="fa fa-exclamation-triangle"></i>\n'
            + '                       </div>\n'
            + '                       <i class="fa fa-times btn-more" style="font-size:11px;"\n'
            + '                          ng-click="c.removeEntry(skill, entry)" title="Remove this category"></i>\n'
            + '                    </div>\n'
            + '                 </div>\n'
            + '                 <div class="prof-label-row">\n'
            + '                    <span>Proficiency</span>\n'
            + '                    <span>{{entry.level_value * 20}}%</span>\n'
            + '                 </div>\n'
            + '                 <div class="interactive-bar-bg" style="margin-bottom:6px;">\n'
            + '                    <div class="interactive-bar-fill"\n'
            + '                         ng-class="{\'bar-blue\': entry.level_value >= 4, \'bar-gray\': entry.level_value < 4}"\n'
            + '                         ng-style="{width: (entry.level_value * 20) + \'%\'}"></div>\n'
            + '                    <div class="hover-segments">\n'
            + '                       <div class="segment-hit" ng-click="c.updateProficiency(entry, 1); $event.stopPropagation();" title="Novice"></div>\n'
            + '                       <div class="segment-hit" ng-click="c.updateProficiency(entry, 2); $event.stopPropagation();" title="Learner"></div>\n'
            + '                       <div class="segment-hit" ng-click="c.updateProficiency(entry, 3); $event.stopPropagation();" title="Proficient"></div>\n'
            + '                       <div class="segment-hit" ng-click="c.updateProficiency(entry, 4); $event.stopPropagation();" title="Advanced"></div>\n'
            + '                       <div class="segment-hit" ng-click="c.updateProficiency(entry, 5); $event.stopPropagation();" title="Expert"></div>\n'
            + '                    </div>\n'
            + '                 </div>\n'
            + '                 <div style="display:flex; justify-content:space-between; align-items:center;">\n'
            + '                    <div class="endorsement-pill" ng-class="{\'active\': entry.endorsements > 0}" style="font-size:11px;">\n'
            + '                       <i class="fa fa-thumbs-up"></i> {{entry.endorsements}}\n'
            + '                    </div>\n'
            + '                    <div class="interest-pill" style="font-size:9px;"\n'
            + '                         ng-class="{\'inactive\': entry.interest != \'high\'}"\n'
            + '                         ng-click="c.toggleInterest(entry)">\n'
            + '                       <i class="fa fa-chart-line"></i> {{entry.interest == "high" ? "High Interest" : "Set Interest"}}\n'
            + '                    </div>\n'
            + '                 </div>\n'
            + '              </div>\n'
            + '           </div>\n'
            + '        </div>\n'
            + '        <div class="col-md-6 col-grid">\n'
            + '           <div class="add-card-placeholder" ng-click="c.openAddModal()">\n'
            + '              <div class="add-icon-circle"><i class="fa fa-plus"></i></div>\n'
            + '              <div style="font-weight:600;">Add New Skill</div>\n'
            + '           </div>\n'
            + '        </div>\n'
            + '     </div>\n'
            + '  </div>\n'
            + '</div>\n';

        var newTemplate = beforeModal + newSkillsSection + afterModalStart;
        widgetGR.setValue('template', newTemplate);
        widgetGR.update();
        gs.info('[Skills Hub] Template patched with grouped skill cards');

        // ============================================================
        // 3. Patch CLIENT SCRIPT - update handlers for grouped structure
        // ============================================================
        widgetGR = new GlideRecord('sp_widget');
        widgetGR.get(widgetId);
        var clientScript = widgetGR.getValue('client_script') || '';

        // updateProficiency now takes an entry (sub-item), not a skill group
        // The existing updateProficiency already works with entry.sys_id and entry.level_value
        // since we just renamed skill -> entry in the template ng-click.
        // But we need to add removeEntry and removeAllEntries.

        // Find position to inject - right before the openAddModal function
        var modalFnStart = clientScript.indexOf('// --- Category-aware Add Skill Modal');
        if (modalFnStart === -1) {
            modalFnStart = clientScript.indexOf('c.openAddModal');
        }

        if (modalFnStart === -1) {
            gs.error('[Skills Hub] Could not find openAddModal in client script');
            return;
        }

        // Also need to update removeSkill to work as removeEntry
        // Remove old removeSkill function
        var removeSkillStart = clientScript.indexOf('// 3. Remove Skill');
        var removeSkillEnd = -1;
        if (removeSkillStart > -1) {
            // Find the next "// " comment or the openAddModal marker
            removeSkillEnd = clientScript.indexOf('\n  \n', removeSkillStart + 10);
            if (removeSkillEnd === -1 || removeSkillEnd > modalFnStart) {
                removeSkillEnd = modalFnStart;
            } else {
                removeSkillEnd += 3; // include the blank line
            }
        }

        var newRemoveHandlers = ''
            + '  // 3. Remove a single category entry from a skill\n'
            + '  c.removeEntry = function(skill, entry) {\n'
            + '     if (!confirm("Remove " + skill.name + " (" + entry.category_name + ") from your profile?")) return;\n'
            + '     c.server.get({ action: "remove_skill", skill_id: entry.sys_id }).then(function(r) {\n'
            + '         var idx = skill.entries.indexOf(entry);\n'
            + '         if (idx > -1) skill.entries.splice(idx, 1);\n'
            + '         if (skill.entries.length == 0) {\n'
            + '             var sIdx = c.data.skills.indexOf(skill);\n'
            + '             if (sIdx > -1) c.data.skills.splice(sIdx, 1);\n'
            + '         }\n'
            + '         c.data.stats = r.data.stats;\n'
            + '     });\n'
            + '  };\n'
            + '\n'
            + '  // Remove all category entries for a skill\n'
            + '  c.removeAllEntries = function(skill) {\n'
            + '     if (!confirm("Remove all " + skill.entries.length + " entries for " + skill.name + "?")) return;\n'
            + '     var ids = [];\n'
            + '     for (var i = 0; i < skill.entries.length; i++) ids.push(skill.entries[i].sys_id);\n'
            + '     // Remove one at a time (server expects single skill_id)\n'
            + '     var chain = Promise.resolve();\n'
            + '     ids.forEach(function(id) {\n'
            + '         chain = chain.then(function() {\n'
            + '             return c.server.get({ action: "remove_skill", skill_id: id });\n'
            + '         });\n'
            + '     });\n'
            + '     chain.then(function(r) {\n'
            + '         var sIdx = c.data.skills.indexOf(skill);\n'
            + '         if (sIdx > -1) c.data.skills.splice(sIdx, 1);\n'
            + '         if (r && r.data) c.data.stats = r.data.stats;\n'
            + '     });\n'
            + '  };\n'
            + '\n'
            + '  ';

        if (removeSkillStart > -1 && removeSkillEnd > -1) {
            clientScript = clientScript.substring(0, removeSkillStart) + newRemoveHandlers + clientScript.substring(removeSkillEnd);
        } else {
            // Just inject before openAddModal
            clientScript = clientScript.substring(0, modalFnStart) + newRemoveHandlers + clientScript.substring(modalFnStart);
        }

        widgetGR.setValue('client_script', clientScript);
        widgetGR.update();
        gs.info('[Skills Hub] Client script patched with removeEntry/removeAllEntries');

        gs.info('[Skills Hub] ===== SCRIPT 35 COMPLETE =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in script 35: ' + e.message);
    }
})();
