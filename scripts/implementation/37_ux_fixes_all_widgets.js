/**
 * Fix Script: 37_ux_fixes_all_widgets.js
 * Purpose: Comprehensive UX fixes across all 3 Skills Hub widgets
 *
 * Fixes:
 *   MY PROFILE:
 *     1. Single-category skill: don't repeat category in sub-entry (already in header)
 *     2. Single-category skill: no X button (trash icon is sufficient)
 *     3. Replace hardcoded Expert/Verified badges with user's Title and Division
 *     4. Proficiency level descriptions + hover text + info popover
 *     5. Color-code proficiency bars by level (shades of CC blue)
 *     6. Standardize all colors to CC brand palette
 *
 *   FIND EXPERT:
 *     5. Must-have and Nice-to-have side by side (not stacked)
 *     9. Color-code skill pills by proficiency (shades of blue)
 *     10. CC brand colors throughout
 *
 *   MANAGER MATRIX:
 *     6. More intuitive validate/dispute UX (action buttons per skill)
 *     7. skill_level showing sys_id - fix to display value
 *     8. Validate All button white text
 *     9. Color-code skill pills by proficiency level
 *     10. CC brand colors
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 37_ux_fixes_all_widgets =====');

        // ====================================================================
        // CC Brand Color Reference:
        //   Primary Blue: #00799e  (buttons, headers, active states)
        //   Dark Blue:    #005a75  (gradient, hover states)
        //   Accent Green: #60c659  (interest, success)
        //   Text Dark:    #1e293b
        //   Text Light:   #64748b
        //   BG Slate:     #f3f6f8
        //
        // Proficiency color scale (shades of CC blue):
        //   Level 1 (Novice):       #b2dce8 (lightest)
        //   Level 2 (Learner):      #7fc4d8
        //   Level 3 (Proficient):   #4dadc8
        //   Level 4 (Advanced):     #00799e (primary)
        //   Level 5 (Expert):       #005a75 (darkest)
        // ====================================================================

        // ============================================================
        // A. MY PROFILE WIDGET
        // ============================================================
        gs.info('[Skills Hub] --- Patching My Profile Widget ---');

        var profileGR = new GlideRecord('sp_widget');
        profileGR.addQuery('name', 'Skills Hub - My Profile');
        profileGR.query();
        if (!profileGR.next()) {
            gs.error('[Skills Hub] My Profile widget not found');
            return;
        }
        var profileId = profileGR.getUniqueValue();

        // --- A1. TEMPLATE FIXES ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var profileTemplate = profileGR.getValue('template') || '';

        // Fix #3: Replace hardcoded Expert/Verified badges with Title and Division
        var oldBadges = '<div class="profile-badges">\n'
            + '              <span class="badge-pill badge-expert"><i class="fa fa-star"></i> Expert</span>\n'
            + '              <span class="badge-pill badge-verified"><i class="fa fa-check-circle"></i> Verified</span>\n'
            + '           </div>';

        var newBadges = '<div class="profile-badges">\n'
            + '              <span class="badge-pill badge-title"><i class="fa fa-briefcase"></i> {{c.data.user_title}}</span>\n'
            + '              <span class="badge-pill badge-dept"><i class="fa fa-building"></i> {{c.data.user_dept}}</span>\n'
            + '           </div>';

        if (profileTemplate.indexOf(oldBadges) > -1) {
            profileTemplate = profileTemplate.replace(oldBadges, newBadges);
            gs.info('[Skills Hub] Fix #3: Replaced hardcoded badges with Title/Division');
        } else {
            // Try with \r\n line endings
            var oldBadgesCR = oldBadges.replace(/\n/g, '\r\n');
            if (profileTemplate.indexOf(oldBadgesCR) > -1) {
                profileTemplate = profileTemplate.replace(oldBadgesCR, newBadges.replace(/\n/g, '\r\n'));
                gs.info('[Skills Hub] Fix #3: Replaced hardcoded badges (CRLF)');
            } else {
                gs.warn('[Skills Hub] Fix #3: Could not find hardcoded badges block - may have been modified');
            }
        }

        // Now rebuild the skill cards section entirely for fixes #1, #2, #4
        // Find the section between empty state and modal
        var emptyStart = profileTemplate.indexOf('<div class="text-center" ng-if="data.skills.length == 0">');
        var modalMarker = profileTemplate.indexOf('<script type="text/ng-template"');

        if (emptyStart > -1 && modalMarker > -1) {
            var beforeCards = profileTemplate.substring(0, emptyStart);
            var afterCards = profileTemplate.substring(modalMarker);

            var newCards = ''
                + '<div class="text-center" ng-if="data.skills.length == 0">\n'
                + '        <div class="well">\n'
                + '           <p class="text-muted">You have not added any skills yet.</p>\n'
                + '           <button class="btn btn-default btn-sm" ng-click="c.openAddModal()">Add Your First Skill</button>\n'
                + '        </div>\n'
                + '     </div>\n'
                + '\n'
                // Proficiency legend
                + '     <div class="prof-legend" ng-if="data.skills.length > 0">\n'
                + '        <span class="legend-item" ng-repeat="l in c.profLevels" title="{{l.desc}}">\n'
                + '           <span class="legend-dot" ng-style="{background: l.color}"></span> {{l.label}}\n'
                + '        </span>\n'
                + '        <i class="fa fa-info-circle legend-info" ng-click="c.showProfInfo = !c.showProfInfo"\n'
                + '           title="Click for proficiency level details"></i>\n'
                + '     </div>\n'
                // Info panel (toggled)
                + '     <div class="prof-info-panel" ng-if="c.showProfInfo">\n'
                + '        <div class="prof-info-row" ng-repeat="l in c.profLevels">\n'
                + '           <span class="prof-info-dot" ng-style="{background: l.color}"></span>\n'
                + '           <strong>{{l.label}}</strong> &mdash; {{l.desc}}\n'
                + '        </div>\n'
                + '     </div>\n'
                + '\n'
                + '     <div class="row-grid" ng-if="data.skills.length > 0">\n'
                + '        <div class="col-md-6 col-grid" ng-repeat="skill in data.skills">\n'
                + '           <div class="skill-card">\n'
                // Interest stripe
                + '              <div class="interest-stripe" ng-if="c.hasHighInterest(skill)"></div>\n'
                + '              <div class="card-header-row">\n'
                + '                 <div>\n'
                + '                    <div class="skill-name">{{skill.name}}</div>\n'
                // Single category: show breadcrumb in header only
                + '                    <div class="skill-type" ng-if="skill.entries.length == 1">{{skill.entries[0].category_path}}</div>\n'
                // Multi category: show badge
                + '                    <span class="badge cat-badge" ng-if="skill.entries.length > 1">\n'
                + '                       {{skill.entries.length}} categories\n'
                + '                    </span>\n'
                + '                 </div>\n'
                // Single: use trash icon only; Multi: use trash for remove-all
                + '                 <i class="fa fa-trash-o btn-more" ng-click="c.removeAllEntries(skill)" title="Remove skill"></i>\n'
                + '              </div>\n'
                + '\n'
                // === SINGLE CATEGORY: simpler layout, no sub-entry header, no X ===
                + '              <div ng-if="skill.entries.length == 1" style="padding-top:8px;">\n'
                + '                 <div class="prof-label-row">\n'
                + '                    <span>{{c.profLevelName(skill.entries[0].level_value)}}</span>\n'
                + '                    <span>{{skill.entries[0].level_value * 20}}%</span>\n'
                + '                 </div>\n'
                + '                 <div class="interactive-bar-bg" style="margin-bottom:6px;">\n'
                + '                    <div class="interactive-bar-fill"\n'
                + '                         ng-style="{width: (skill.entries[0].level_value * 20) + \'%\', background: c.profColor(skill.entries[0].level_value)}"></div>\n'
                + '                    <div class="hover-segments">\n'
                + '                       <div class="segment-hit" ng-click="c.updateProficiency(skill.entries[0], 1); $event.stopPropagation();" title="Novice - Aware of skill, beginning to learn"></div>\n'
                + '                       <div class="segment-hit" ng-click="c.updateProficiency(skill.entries[0], 2); $event.stopPropagation();" title="Learner - Developing, needs guidance"></div>\n'
                + '                       <div class="segment-hit" ng-click="c.updateProficiency(skill.entries[0], 3); $event.stopPropagation();" title="Proficient - Competent, works independently"></div>\n'
                + '                       <div class="segment-hit" ng-click="c.updateProficiency(skill.entries[0], 4); $event.stopPropagation();" title="Advanced - Highly skilled, mentors others"></div>\n'
                + '                       <div class="segment-hit" ng-click="c.updateProficiency(skill.entries[0], 5); $event.stopPropagation();" title="Expert - Authority, drives best practices"></div>\n'
                + '                    </div>\n'
                + '                 </div>\n'
                + '                 <div class="card-footer-row">\n'
                + '                    <div style="display:flex; align-items:center; gap:8px;">\n'
                + '                       <div class="endorsement-pill" ng-class="{\'active\': skill.entries[0].endorsements > 0}">\n'
                + '                          <i class="fa fa-thumbs-up"></i> {{skill.entries[0].endorsements}}\n'
                + '                       </div>\n'
                + '                       <div class="validation-icon" ng-if="skill.entries[0].validation_status == \'validated\'"\n'
                + '                            style="color:#15803d; font-size:12px;" title="Manager Validated">\n'
                + '                          <i class="fa fa-check-circle"></i>\n'
                + '                       </div>\n'
                + '                       <div class="validation-icon" ng-if="skill.entries[0].validation_status == \'disputed\'"\n'
                + '                            style="color:#dc2626; font-size:12px;" title="Disputed">\n'
                + '                          <i class="fa fa-exclamation-triangle"></i>\n'
                + '                       </div>\n'
                + '                    </div>\n'
                + '                    <div class="interest-pill"\n'
                + '                         ng-class="{\'inactive\': skill.entries[0].interest != \'high\'}"\n'
                + '                         ng-click="c.toggleInterest(skill.entries[0])">\n'
                + '                       <i class="fa fa-chart-line"></i> {{skill.entries[0].interest == "high" ? "High Interest" : "Set Interest"}}\n'
                + '                    </div>\n'
                + '                 </div>\n'
                + '              </div>\n'
                + '\n'
                // === MULTI CATEGORY: sub-entries with category path, X per entry ===
                + '              <div ng-if="skill.entries.length > 1">\n'
                + '                <div ng-repeat="entry in skill.entries" class="category-entry"\n'
                + '                     style="padding:10px 0; border-top:1px solid #f1f5f9;">\n'
                + '                   <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">\n'
                + '                      <div class="skill-type" style="margin-bottom:0;">{{entry.category_path}}</div>\n'
                + '                      <div style="display:flex; align-items:center; gap:8px;">\n'
                + '                         <div class="validation-icon" ng-if="entry.validation_status == \'validated\'"\n'
                + '                              style="color:#15803d; font-size:12px;" title="Validated">\n'
                + '                            <i class="fa fa-check-circle"></i>\n'
                + '                         </div>\n'
                + '                         <div class="validation-icon" ng-if="entry.validation_status == \'disputed\'"\n'
                + '                              style="color:#dc2626; font-size:12px;" title="Disputed">\n'
                + '                            <i class="fa fa-exclamation-triangle"></i>\n'
                + '                         </div>\n'
                + '                         <i class="fa fa-times btn-more" style="font-size:11px;"\n'
                + '                            ng-click="c.removeEntry(skill, entry)" title="Remove this category"></i>\n'
                + '                      </div>\n'
                + '                   </div>\n'
                + '                   <div class="prof-label-row">\n'
                + '                      <span>{{c.profLevelName(entry.level_value)}}</span>\n'
                + '                      <span>{{entry.level_value * 20}}%</span>\n'
                + '                   </div>\n'
                + '                   <div class="interactive-bar-bg" style="margin-bottom:6px;">\n'
                + '                      <div class="interactive-bar-fill"\n'
                + '                           ng-style="{width: (entry.level_value * 20) + \'%\', background: c.profColor(entry.level_value)}"></div>\n'
                + '                      <div class="hover-segments">\n'
                + '                         <div class="segment-hit" ng-click="c.updateProficiency(entry, 1); $event.stopPropagation();" title="Novice - Aware of skill, beginning to learn"></div>\n'
                + '                         <div class="segment-hit" ng-click="c.updateProficiency(entry, 2); $event.stopPropagation();" title="Learner - Developing, needs guidance"></div>\n'
                + '                         <div class="segment-hit" ng-click="c.updateProficiency(entry, 3); $event.stopPropagation();" title="Proficient - Competent, works independently"></div>\n'
                + '                         <div class="segment-hit" ng-click="c.updateProficiency(entry, 4); $event.stopPropagation();" title="Advanced - Highly skilled, mentors others"></div>\n'
                + '                         <div class="segment-hit" ng-click="c.updateProficiency(entry, 5); $event.stopPropagation();" title="Expert - Authority, drives best practices"></div>\n'
                + '                      </div>\n'
                + '                   </div>\n'
                + '                   <div style="display:flex; justify-content:space-between; align-items:center;">\n'
                + '                      <div class="endorsement-pill" ng-class="{\'active\': entry.endorsements > 0}" style="font-size:11px;">\n'
                + '                         <i class="fa fa-thumbs-up"></i> {{entry.endorsements}}\n'
                + '                      </div>\n'
                + '                      <div class="interest-pill" style="font-size:9px;"\n'
                + '                           ng-class="{\'inactive\': entry.interest != \'high\'}"\n'
                + '                           ng-click="c.toggleInterest(entry)">\n'
                + '                         <i class="fa fa-chart-line"></i> {{entry.interest == "high" ? "High Interest" : "Set Interest"}}\n'
                + '                      </div>\n'
                + '                   </div>\n'
                + '                </div>\n'
                + '              </div>\n'
                + '           </div>\n'
                + '        </div>\n'
                // Add New card
                + '        <div class="col-md-6 col-grid">\n'
                + '           <div class="add-card-placeholder" ng-click="c.openAddModal()">\n'
                + '              <div class="add-icon-circle"><i class="fa fa-plus"></i></div>\n'
                + '              <div style="font-weight:600;">Add New Skill</div>\n'
                + '           </div>\n'
                + '        </div>\n'
                + '     </div>\n'
                + '  </div>\n'
                + '</div>\n';

            profileTemplate = beforeCards + newCards + afterCards;
            gs.info('[Skills Hub] Fixes #1,#2,#4: Rebuilt skill cards section');
        } else {
            gs.warn('[Skills Hub] Could not find card section markers in My Profile template');
        }

        profileGR.setValue('template', profileTemplate);
        profileGR.update();

        // --- A2. CLIENT SCRIPT ADDITIONS (proficiency helpers) ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var profileClient = profileGR.getValue('client_script') || '';

        // Inject proficiency level helpers at the top of the client controller
        var profHelpers = '\n'
            + '  // --- Proficiency level definitions ---\n'
            + '  c.profLevels = [\n'
            + '    { value: 1, label: "Novice",     color: "#b2dce8", desc: "Aware of the skill; beginning to learn fundamentals" },\n'
            + '    { value: 2, label: "Learner",    color: "#7fc4d8", desc: "Developing capability; needs guidance and supervision" },\n'
            + '    { value: 3, label: "Proficient", color: "#4dadc8", desc: "Competent; works independently with consistent results" },\n'
            + '    { value: 4, label: "Advanced",   color: "#00799e", desc: "Highly skilled; mentors others and handles complex scenarios" },\n'
            + '    { value: 5, label: "Expert",     color: "#005a75", desc: "Authority in the field; drives best practices and innovation" }\n'
            + '  ];\n'
            + '  c.showProfInfo = false;\n'
            + '\n'
            + '  c.profLevelName = function(val) {\n'
            + '    var names = ["", "Novice", "Learner", "Proficient", "Advanced", "Expert"];\n'
            + '    return names[val] || "Novice";\n'
            + '  };\n'
            + '\n'
            + '  c.profColor = function(val) {\n'
            + '    var colors = ["", "#b2dce8", "#7fc4d8", "#4dadc8", "#00799e", "#005a75"];\n'
            + '    return colors[val] || "#b2dce8";\n'
            + '  };\n'
            + '\n'
            + '  c.hasHighInterest = function(skill) {\n'
            + '    for (var i = 0; i < skill.entries.length; i++) {\n'
            + '      if (skill.entries[i].interest == "high") return true;\n'
            + '    }\n'
            + '    return false;\n'
            + '  };\n'
            + '\n';

        // Inject after "var c = this;"
        var cThisIdx = profileClient.indexOf('var c = this;');
        if (cThisIdx > -1) {
            var insertAt = profileClient.indexOf('\n', cThisIdx) + 1;
            // Check if already injected
            if (profileClient.indexOf('c.profLevels') == -1) {
                profileClient = profileClient.substring(0, insertAt) + profHelpers + profileClient.substring(insertAt);
                gs.info('[Skills Hub] Fix #4: Injected proficiency level helpers into client');
            } else {
                gs.info('[Skills Hub] Fix #4: proficiency helpers already present');
            }
        }

        profileGR.setValue('client_script', profileClient);
        profileGR.update();

        // --- A3. CSS FIXES (brand colors, proficiency colors, legend) ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var profileCSS = profileGR.getValue('css') || '';

        // Replace non-brand colors
        // badge-expert and badge-verified -> badge-title and badge-dept
        var cssAdditions = '\n'
            + '/* === 37: UX Fixes - CC Brand Colors === */\n'
            + '.badge-title { background: #e6f3f7; color: #00799e; border-color: #b2dce8; }\n'
            + '.badge-dept { background: #e6f3f7; color: #005a75; border-color: #b2dce8; }\n'
            + '.cat-badge { font-size:10px; background:#e6f3f7; color:#00799e; }\n'
            + '\n'
            + '/* Proficiency legend */\n'
            + '.prof-legend { display:flex; align-items:center; gap:14px; margin-bottom:16px; flex-wrap:wrap; }\n'
            + '.legend-item { display:flex; align-items:center; gap:4px; font-size:11px; color:#64748b; font-weight:500; cursor:default; }\n'
            + '.legend-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }\n'
            + '.legend-info { color:#00799e; cursor:pointer; font-size:14px; margin-left:4px; }\n'
            + '.legend-info:hover { color:#005a75; }\n'
            + '\n'
            + '/* Proficiency info panel */\n'
            + '.prof-info-panel { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px 18px; margin-bottom:16px; }\n'
            + '.prof-info-row { font-size:12px; color:#1e293b; padding:4px 0; display:flex; align-items:center; gap:8px; }\n'
            + '.prof-info-dot { width:12px; height:12px; border-radius:50%; display:inline-block; flex-shrink:0; }\n'
            + '\n'
            + '/* Override bar colors - now driven by ng-style */\n'
            + '.bar-blue, .bar-gray { background-color: inherit !important; }\n';

        if (profileCSS.indexOf('37: UX Fixes') == -1) {
            profileCSS += cssAdditions;
        }
        profileGR.setValue('css', profileCSS);
        profileGR.update();
        gs.info('[Skills Hub] My Profile CSS patched');

        // ============================================================
        // B. FIND EXPERT WIDGET
        // ============================================================
        gs.info('[Skills Hub] --- Patching Find Expert Widget ---');

        var findGR = new GlideRecord('sp_widget');
        findGR.addQuery('name', 'CONTAINS', 'Find Expert');
        findGR.query();
        if (!findGR.next()) {
            gs.error('[Skills Hub] Find Expert widget not found');
        } else {
            var findId = findGR.getUniqueValue();

            // --- B1. TEMPLATE: Side-by-side search fields ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);

            var findTemplate = ''
                + '<div class="skills-find-expert">\n'
                + '  <div class="panel panel-default" style="border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">\n'
                + '    <div class="panel-heading" style="background:linear-gradient(135deg,#00799e 0%,#005a75 100%); color:#fff; border-radius:12px 12px 0 0; padding:16px 20px;">\n'
                + '      <h3 class="panel-title" style="margin:0; font-weight:700;"><i class="fa fa-search"></i> Find Expert</h3>\n'
                + '    </div>\n'
                + '    <div class="panel-body" style="padding:20px;">\n'
                + '\n'
                // Side-by-side fields
                + '      <div class="row">\n'
                + '        <div class="col-md-6">\n'
                + '          <div class="form-group">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Must-Have Skills</label>\n'
                + '            <div style="position:relative;">\n'
                + '              <input type="text" class="form-control" placeholder="Type to search skills..."\n'
                + '                     ng-model="c.mustInput" ng-change="c.typeaheadSearch(\'must\')" />\n'
                + '              <div class="typeahead-dropdown" ng-if="c.mustSuggestions.length > 0">\n'
                + '                <div class="typeahead-item" ng-repeat="s in c.mustSuggestions"\n'
                + '                     ng-click="c.selectSkill(\'must\', s)">{{s}}</div>\n'
                + '              </div>\n'
                + '            </div>\n'
                + '            <div class="chip-list" ng-if="c.mustChips.length > 0">\n'
                + '              <span class="skill-chip must" ng-repeat="chip in c.mustChips">\n'
                + '                {{chip}} <i class="fa fa-times" ng-click="c.removeChip(\'must\', $index)"></i>\n'
                + '              </span>\n'
                + '            </div>\n'
                + '          </div>\n'
                + '        </div>\n'
                + '        <div class="col-md-6">\n'
                + '          <div class="form-group">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Nice-to-Have Skills</label>\n'
                + '            <div style="position:relative;">\n'
                + '              <input type="text" class="form-control" placeholder="Type to search skills..."\n'
                + '                     ng-model="c.niceInput" ng-change="c.typeaheadSearch(\'nice\')" />\n'
                + '              <div class="typeahead-dropdown" ng-if="c.niceSuggestions.length > 0">\n'
                + '                <div class="typeahead-item" ng-repeat="s in c.niceSuggestions"\n'
                + '                     ng-click="c.selectSkill(\'nice\', s)">{{s}}</div>\n'
                + '              </div>\n'
                + '            </div>\n'
                + '            <div class="chip-list" ng-if="c.niceChips.length > 0">\n'
                + '              <span class="skill-chip nice" ng-repeat="chip in c.niceChips">\n'
                + '                {{chip}} <i class="fa fa-times" ng-click="c.removeChip(\'nice\', $index)"></i>\n'
                + '              </span>\n'
                + '            </div>\n'
                + '          </div>\n'
                + '        </div>\n'
                + '      </div>\n'
                + '\n'
                + '      <button class="btn btn-primary" ng-click="c.search()"\n'
                + '              ng-disabled="c.mustChips.length == 0 && c.niceChips.length == 0"\n'
                + '              style="background:#00799e; border-color:#00799e; font-weight:600; border-radius:8px;">\n'
                + '        <i class="fa fa-search"></i> Search Experts\n'
                + '      </button>\n'
                + '\n'
                // Loading
                + '      <div ng-if="c.loading" class="text-center" style="padding:30px;">\n'
                + '        <i class="fa fa-spinner fa-spin fa-2x" style="color:#00799e;"></i>\n'
                + '      </div>\n'
                + '\n'
                // No results
                + '      <div ng-if="c.searched && !c.loading && c.results.length == 0" class="text-center" style="padding:30px;">\n'
                + '        <p class="text-muted">No experts found matching your criteria.</p>\n'
                + '      </div>\n'
                + '\n'
                // Results
                + '      <div class="results-grid" ng-if="c.results.length > 0">\n'
                + '        <div class="expert-card" ng-repeat="expert in c.results">\n'
                + '          <div class="expert-header">\n'
                + '            <div class="avatar-circle">{{expert.initials}}</div>\n'
                + '            <div class="expert-info">\n'
                + '              <div class="expert-name">{{expert.name}}</div>\n'
                + '              <div class="expert-title">{{expert.title}}</div>\n'
                + '            </div>\n'
                + '            <div class="match-score" ng-class="c.getScoreClass(expert.matchScore)">\n'
                + '              {{expert.matchScore}}%\n'
                + '            </div>\n'
                + '          </div>\n'
                // Grouped skills with color-coded pills
                + '          <div class="expert-skills">\n'
                + '            <div class="skill-group-row" ng-repeat="sg in expert.skills">\n'
                + '              <div class="sg-header">\n'
                + '                <span class="sg-name" ng-class="{\'sg-must\': sg.isMust}">{{sg.name}}</span>\n'
                + '                <span class="prof-pill" ng-style="{background: c.profColor(Math.round(sg.avg_level))}"\n'
                + '                      title="Average proficiency across {{sg.entry_count}} {{sg.entry_count == 1 ? \'category\' : \'categories\'}}">\n'
                + '                  {{c.profLevelName(Math.round(sg.avg_level))}} ({{sg.avg_level}}/5)\n'
                + '                </span>\n'
                + '                <span class="cat-count-badge" ng-if="sg.entry_count > 1">\n'
                + '                  {{sg.entry_count}} categories\n'
                + '                </span>\n'
                + '              </div>\n'
                // Category sub-entries
                + '              <div class="sg-entries" ng-if="sg.entry_count > 1">\n'
                + '                <div class="sg-entry" ng-repeat="ent in sg.entries">\n'
                + '                  <span class="sg-cat-path">{{ent.category_path}}</span>\n'
                + '                  <span class="prof-pill-sm" ng-style="{background: c.profColor(ent.level_value)}">\n'
                + '                    {{c.profLevelName(ent.level_value)}}\n'
                + '                  </span>\n'
                + '                  <span class="endorsement-pill-sm" ng-if="ent.endorsements > 0">\n'
                + '                    <i class="fa fa-thumbs-up"></i> {{ent.endorsements}}\n'
                + '                  </span>\n'
                + '                  <button class="btn btn-xs btn-endorse" ng-click="c.endorse(expert, ent)"\n'
                + '                          title="Endorse this skill">\n'
                + '                    <i class="fa fa-thumbs-up"></i>\n'
                + '                  </button>\n'
                + '                </div>\n'
                + '              </div>\n'
                // Single category inline
                + '              <div class="sg-entries" ng-if="sg.entry_count == 1">\n'
                + '                <div class="sg-entry">\n'
                + '                  <span class="sg-cat-path">{{sg.entries[0].category_path}}</span>\n'
                + '                  <span class="endorsement-pill-sm" ng-if="sg.entries[0].endorsements > 0">\n'
                + '                    <i class="fa fa-thumbs-up"></i> {{sg.entries[0].endorsements}}\n'
                + '                  </span>\n'
                + '                  <button class="btn btn-xs btn-endorse" ng-click="c.endorse(expert, sg.entries[0])"\n'
                + '                          title="Endorse this skill">\n'
                + '                    <i class="fa fa-thumbs-up"></i>\n'
                + '                  </button>\n'
                + '                </div>\n'
                + '              </div>\n'
                + '            </div>\n'
                + '          </div>\n'
                + '        </div>\n'
                + '      </div>\n'
                + '\n'
                + '    </div>\n'
                + '  </div>\n'
                + '</div>\n';

            findGR.setValue('template', findTemplate);
            findGR.update();
            gs.info('[Skills Hub] Fix #5: Find Expert template - side by side + color pills');

            // --- B2. CLIENT: Add proficiency helpers ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);
            var findClient = findGR.getValue('client_script') || '';

            // Add profLevelName and profColor if not present
            if (findClient.indexOf('c.profLevelName') == -1) {
                var findCThis = findClient.indexOf('var c = this;');
                if (findCThis > -1) {
                    var findInsert = findClient.indexOf('\n', findCThis) + 1;
                    var findProfHelpers = '\n'
                        + '  c.profLevelName = function(val) {\n'
                        + '    var names = ["", "Novice", "Learner", "Proficient", "Advanced", "Expert"];\n'
                        + '    return names[val] || "Novice";\n'
                        + '  };\n'
                        + '  c.profColor = function(val) {\n'
                        + '    var colors = ["", "#b2dce8", "#7fc4d8", "#4dadc8", "#00799e", "#005a75"];\n'
                        + '    return colors[val] || "#b2dce8";\n'
                        + '  };\n\n';
                    findClient = findClient.substring(0, findInsert) + findProfHelpers + findClient.substring(findInsert);
                }
            }

            findGR.setValue('client_script', findClient);
            findGR.update();
            gs.info('[Skills Hub] Find Expert client patched with proficiency helpers');

            // --- B3. CSS: CC brand + color-coded pills ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);
            var findCSS = findGR.getValue('css') || '';

            var newFindCSS = '\n/* === 37: UX Fixes - CC Brand + Color Coded === */\n'
                + '.typeahead-dropdown { position:absolute; z-index:1000; background:#fff; border:1px solid #e2e8f0; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.1); max-height:200px; overflow-y:auto; width:100%; top:100%; left:0; }\n'
                + '.typeahead-item { padding:8px 12px; cursor:pointer; font-size:13px; }\n'
                + '.typeahead-item:hover { background:#e6f3f7; }\n'
                + '.chip-list { margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; }\n'
                + '.skill-chip { padding:4px 10px; border-radius:16px; font-size:12px; display:inline-flex; align-items:center; gap:6px; }\n'
                + '.skill-chip.must { background:#e6f3f7; color:#00799e; }\n'
                + '.skill-chip.nice { background:#f0f4f8; color:#005a75; }\n'
                + '.skill-chip i { cursor:pointer; font-size:10px; }\n'
                + '.skill-chip i:hover { color:#dc2626; }\n'
                + '.results-grid { margin-top:20px; }\n'
                + '.expert-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:12px; }\n'
                + '.expert-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }\n'
                + '.avatar-circle { width:40px; height:40px; border-radius:50%; background:#00799e; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; }\n'
                + '.expert-info { flex:1; }\n'
                + '.expert-name { font-weight:600; font-size:14px; color:#1e293b; }\n'
                + '.expert-title { font-size:12px; color:#64748b; }\n'
                + '.match-score { font-weight:700; font-size:18px; padding:4px 10px; border-radius:6px; }\n'
                + '.score-high { background:#dcfce7; color:#15803d; }\n'
                + '.score-med { background:#fef9c3; color:#a16207; }\n'
                + '.score-low { background:#fee2e2; color:#dc2626; }\n'
                + '.skill-group-row { border-top:1px solid #f1f5f9; padding:8px 0; }\n'
                + '.sg-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; flex-wrap:wrap; }\n'
                + '.sg-name { font-weight:600; font-size:13px; color:#1e293b; }\n'
                + '.sg-must { color:#00799e; }\n'
                + '.prof-pill { color:#fff; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }\n'
                + '.prof-pill-sm { color:#fff; padding:1px 6px; border-radius:8px; font-size:10px; font-weight:600; }\n'
                + '.cat-count-badge { font-size:10px; background:#e6f3f7; color:#00799e; padding:2px 8px; border-radius:10px; }\n'
                + '.sg-entries { padding-left:12px; }\n'
                + '.sg-entry { display:flex; align-items:center; gap:8px; padding:3px 0; font-size:12px; }\n'
                + '.sg-cat-path { color:#64748b; flex:1; }\n'
                + '.endorsement-pill-sm { background:#e6f3f7; color:#00799e; padding:2px 8px; border-radius:10px; font-size:11px; }\n'
                + '.btn-endorse { background:#e6f3f7; color:#00799e; border:1px solid #b2dce8; border-radius:4px; }\n'
                + '.btn-endorse:hover { background:#00799e; color:#fff; }\n';

            // Replace all CSS (the old CSS was appended by script 36)
            findGR.setValue('css', newFindCSS);
            findGR.update();
            gs.info('[Skills Hub] Find Expert CSS replaced with CC brand colors');
        }

        // ============================================================
        // C. MANAGER MATRIX WIDGET
        // ============================================================
        gs.info('[Skills Hub] --- Patching Manager Matrix Widget ---');

        var matrixGR = new GlideRecord('sp_widget');
        matrixGR.addQuery('name', 'CONTAINS', 'Manager Matrix');
        matrixGR.query();
        if (!matrixGR.next()) {
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.addQuery('name', 'CONTAINS', 'Skills Hub');
            matrixGR.addQuery('name', 'CONTAINS', 'Manager');
            matrixGR.query();
            if (!matrixGR.next()) {
                gs.error('[Skills Hub] Manager Matrix widget not found');
            }
        }

        if (matrixGR.getUniqueValue()) {
            var matrixId = matrixGR.getUniqueValue();

            // --- C1. Fix SkillsHubUtils.getManagerMatrix - skill_level display value ---
            var utilGR = new GlideRecord('sys_script_include');
            utilGR.addQuery('name', 'SkillsHubUtils');
            utilGR.query();
            if (utilGR.next()) {
                var utilScript = utilGR.getValue('script') || '';

                // Fix: change sgr.skill_level.toString() to sgr.skill_level.getDisplayValue()
                if (utilScript.indexOf('sgr.skill_level.toString()') > -1) {
                    utilScript = utilScript.replace(
                        'level: sgr.skill_level.toString(),',
                        'level: sgr.skill_level.getDisplayValue() || sgr.skill_level.toString(),'
                    );
                    // Also add validation_status and user title
                    if (utilScript.indexOf('validated: isValid') > -1 && utilScript.indexOf('status:') == -1) {
                        utilScript = utilScript.replace(
                            'validated: isValid\n                };',
                            'validated: isValid,\n                   status: sgr.u_validation_status.toString() || (isValid ? "validated" : "pending")\n                };'
                        );
                    }
                    // Add title to user data
                    if (utilScript.indexOf('name: ugr.name.toString(), skills: {}') > -1 && utilScript.indexOf('title:') == -1) {
                        utilScript = utilScript.replace(
                            'name: ugr.name.toString(), skills: {}',
                            'name: ugr.name.toString(), title: ugr.title.toString() || "Employee", skills: {}'
                        );
                    }
                    utilGR.setValue('script', utilScript);
                    utilGR.update();
                    gs.info('[Skills Hub] Fix #7: SkillsHubUtils.getManagerMatrix - skill_level now uses getDisplayValue()');
                } else {
                    gs.info('[Skills Hub] Fix #7: skill_level.toString() not found - may already be fixed');
                }
            }

            // --- C2. TEMPLATE: Improve validate/dispute UX + color-coded pills ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);

            var matrixTemplate = ''
                + '<div class="panel-cc">\n'
                + '  <!-- HEADER & STATS -->\n'
                + '  <div class="matrix-header">\n'
                + '     <div>\n'
                + '        <h3 class="matrix-title">Team Capability Matrix</h3>\n'
                + '        <p class="matrix-subtitle">Review, validate, and analyze your direct reports\' skills.</p>\n'
                + '     </div>\n'
                + '     <div class="stats-group">\n'
                + '        <div class="stat-card" ng-click="c.statusFilter = \'all\'" ng-class="{\'stat-active\': c.statusFilter == \'all\'}" style="cursor:pointer;">\n'
                + '           <span class="stat-val">{{c.stats.reports}}</span>\n'
                + '           <span class="stat-label">Reports</span>\n'
                + '        </div>\n'
                + '        <div class="stat-card" ng-click="c.statusFilter = \'pending\'" ng-class="{\'stat-active\': c.statusFilter == \'pending\'}" style="cursor:pointer;">\n'
                + '           <span class="stat-val text-orange">{{c.stats.pending}}</span>\n'
                + '           <span class="stat-label">Pending</span>\n'
                + '        </div>\n'
                + '        <div class="stat-card" ng-click="c.statusFilter = \'validated\'" ng-class="{\'stat-active\': c.statusFilter == \'validated\'}" style="cursor:pointer;">\n'
                + '           <span class="stat-val text-green">{{c.stats.validated}}</span>\n'
                + '           <span class="stat-label">Verified</span>\n'
                + '        </div>\n'
                + '        <div class="stat-card" ng-click="c.statusFilter = \'disputed\'" ng-class="{\'stat-active\': c.statusFilter == \'disputed\'}" style="cursor:pointer;">\n'
                + '           <span class="stat-val text-red">{{c.stats.disputed}}</span>\n'
                + '           <span class="stat-label">Disputed</span>\n'
                + '        </div>\n'
                + '     </div>\n'
                + '  </div>\n'
                // Proficiency legend
                + '  <div class="matrix-legend">\n'
                + '     <span class="ml-item"><span class="ml-dot" style="background:#b2dce8;"></span> Novice</span>\n'
                + '     <span class="ml-item"><span class="ml-dot" style="background:#7fc4d8;"></span> Learner</span>\n'
                + '     <span class="ml-item"><span class="ml-dot" style="background:#4dadc8;"></span> Proficient</span>\n'
                + '     <span class="ml-item"><span class="ml-dot" style="background:#00799e;"></span> Advanced</span>\n'
                + '     <span class="ml-item"><span class="ml-dot" style="background:#005a75;"></span> Expert</span>\n'
                + '  </div>\n'
                + '  <!-- TABLE MATRIX -->\n'
                + '  <div class="table-container">\n'
                + '     <table class="table-matrix">\n'
                + '        <thead>\n'
                + '           <tr>\n'
                + '              <th style="width:250px;">Employee</th>\n'
                + '              <th>Skills Portfolio</th>\n'
                + '              <th style="width:140px;">Actions</th>\n'
                + '           </tr>\n'
                + '        </thead>\n'
                + '        <tbody>\n'
                + '           <tr ng-if="c.noData">\n'
                + '              <td colspan="3" class="text-center" style="padding:40px;">\n'
                + '                 <p class="text-muted">No direct reports found with skills data.</p>\n'
                + '              </td>\n'
                + '           </tr>\n'
                + '           <tr ng-repeat="(uid, user) in c.data">\n'
                + '              <td style="border-right:1px solid #f1f5f9;">\n'
                + '                 <div class="employee-cell">\n'
                + '                    <div class="avatar-circle">{{user.initials}}</div>\n'
                + '                    <div>\n'
                + '                       <span class="emp-name">{{user.name}}</span>\n'
                + '                       <span class="emp-title">{{user.title}}</span>\n'
                + '                    </div>\n'
                + '                 </div>\n'
                + '              </td>\n'
                + '              <td>\n'
                + '                 <div class="skill-grid">\n'
                // Color-coded skill pills with explicit action buttons
                + '                    <div class="skill-pill-wrap"\n'
                + '                         ng-repeat="(skillName, details) in user.skills"\n'
                + '                         ng-if="c.showSkill(details)">\n'
                + '                       <div class="skill-pill"\n'
                + '                            ng-class="{\'status-validated\': details.validated, \'status-pending\': !details.validated && details.status != \'disputed\', \'status-disputed\': details.status == \'disputed\'}"\n'
                + '                            ng-style="{\'border-left\': \'3px solid \' + c.levelColor(details.level)}">\n'
                + '                          <span class="sp-name">{{skillName}}</span>\n'
                + '                          <span class="sp-level" ng-style="{background: c.levelColor(details.level)}">{{details.level}}</span>\n'
                + '                          <i class="fa fa-check-circle text-check" ng-if="details.validated"></i>\n'
                + '                          <i class="fa fa-exclamation-triangle text-disputed" ng-if="details.status == \'disputed\'"></i>\n'
                + '                          <i class="fa fa-heart text-heart interest-icon" ng-if="details.interest==\'high\'" title="High Interest"></i>\n'
                // Inline action buttons (Fix #6: more intuitive)
                + '                          <span class="sp-actions" ng-if="!details.validated && details.status != \'disputed\'">\n'
                + '                             <button class="btn-validate" ng-click="c.validate(uid, skillName, details)" title="Validate this skill">\n'
                + '                                <i class="fa fa-check"></i>\n'
                + '                             </button>\n'
                + '                             <button class="btn-dispute" ng-click="c.openDisputeModal(uid, skillName, details)" title="Dispute this skill">\n'
                + '                                <i class="fa fa-times"></i>\n'
                + '                             </button>\n'
                + '                          </span>\n'
                + '                       </div>\n'
                + '                    </div>\n'
                + '                    <span ng-if="c.objectEmpty(user.skills)" class="text-muted small" style="padding:6px 0; font-style:italic;">\n'
                + '                       No skills recorded.\n'
                + '                    </span>\n'
                + '                 </div>\n'
                + '              </td>\n'
                + '              <td class="text-center">\n'
                + '                 <button class="btn btn-xs btn-validate-all" ng-click="c.bulkValidate(uid, user.name)"\n'
                + '                         title="Validate all pending skills">\n'
                + '                    <i class="fa fa-check-double"></i> Validate All\n'
                + '                 </button>\n'
                + '              </td>\n'
                + '           </tr>\n'
                + '        </tbody>\n'
                + '     </table>\n'
                + '  </div>\n'
                + '</div>\n'
                + '\n'
                // Dispute modal (same as before)
                + '<div class="dispute-overlay" ng-if="c.showDisputeModal" ng-click="c.cancelDispute()">\n'
                + '   <div class="dispute-modal" ng-click="$event.stopPropagation()">\n'
                + '      <div class="dispute-header">\n'
                + '         <h4 style="margin:0; font-weight:700;">Dispute Skill</h4>\n'
                + '         <i class="fa fa-times" style="cursor:pointer; color:#94a3b8;" ng-click="c.cancelDispute()"></i>\n'
                + '      </div>\n'
                + '      <div class="dispute-body">\n'
                + '         <p class="text-muted" style="margin-bottom:16px;">\n'
                + '            Disputing <strong>{{c.disputeTarget.skillName}}</strong>. Provide your assessment and justification.\n'
                + '         </p>\n'
                + '         <div class="form-group">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Your Assessed Level (Optional)</label>\n'
                + '            <select class="form-control" ng-model="c.disputeLevel">\n'
                + '               <option value="">-- Keep as-is --</option>\n'
                + '               <option value="Novice">Novice</option>\n'
                + '               <option value="Learner">Learner</option>\n'
                + '               <option value="Proficient">Proficient</option>\n'
                + '               <option value="Advanced">Advanced</option>\n'
                + '               <option value="Expert">Expert</option>\n'
                + '            </select>\n'
                + '         </div>\n'
                + '         <div class="form-group">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Notes (Required)</label>\n'
                + '            <textarea class="form-control" rows="3" ng-model="c.disputeNotes"\n'
                + '                      placeholder="Explain why you disagree with the self-assessed level..."></textarea>\n'
                + '         </div>\n'
                + '      </div>\n'
                + '      <div class="dispute-footer">\n'
                + '         <button class="btn btn-default" ng-click="c.cancelDispute()">Cancel</button>\n'
                + '         <button class="btn" ng-click="c.submitDispute()" ng-disabled="!c.disputeNotes"\n'
                + '                 style="background:#d97706; border-color:#d97706; color:#fff; font-weight:600;">\n'
                + '            <i class="fa fa-exclamation-triangle"></i> Submit Dispute\n'
                + '         </button>\n'
                + '      </div>\n'
                + '   </div>\n'
                + '</div>\n';

            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            matrixGR.setValue('template', matrixTemplate);
            matrixGR.update();
            gs.info('[Skills Hub] Fix #6,#8: Manager Matrix template - action buttons + validate all styling');

            // --- C3. CLIENT: Add levelColor helper + objectEmpty ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            var matrixClient = matrixGR.getValue('client_script') || '';

            if (matrixClient.indexOf('c.levelColor') == -1) {
                var matrixCThis = matrixClient.indexOf('var c = this;');
                if (matrixCThis > -1) {
                    var matrixInsertAt = matrixClient.indexOf('\n', matrixCThis) + 1;
                    var matrixHelpers = '\n'
                        + '  c.levelColor = function(level) {\n'
                        + '    if (!level) return "#b2dce8";\n'
                        + '    var l = level.toLowerCase();\n'
                        + '    if (l.indexOf("expert") > -1) return "#005a75";\n'
                        + '    if (l.indexOf("advanced") > -1) return "#00799e";\n'
                        + '    if (l.indexOf("proficient") > -1) return "#4dadc8";\n'
                        + '    if (l.indexOf("learner") > -1 || l.indexOf("intermediate") > -1) return "#7fc4d8";\n'
                        + '    return "#b2dce8";\n'
                        + '  };\n'
                        + '  c.objectEmpty = function(obj) {\n'
                        + '    if (!obj) return true;\n'
                        + '    for (var k in obj) { if (obj.hasOwnProperty(k)) return false; }\n'
                        + '    return true;\n'
                        + '  };\n\n';
                    matrixClient = matrixClient.substring(0, matrixInsertAt) + matrixHelpers + matrixClient.substring(matrixInsertAt);
                }
            }

            matrixGR.setValue('client_script', matrixClient);
            matrixGR.update();
            gs.info('[Skills Hub] Manager Matrix client patched with levelColor/objectEmpty helpers');

            // --- C4. CSS: action buttons, validate all, color-coded pills ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            var matrixCSS = matrixGR.getValue('css') || '';

            var matrixCSSAdditions = '\n'
                + '/* === 37: UX Fixes - CC Brand + Action Buttons === */\n'
                + '.stat-card.stat-active { border-color:#00799e; background:#e6f3f7; }\n'
                + '.matrix-legend { display:flex; align-items:center; gap:14px; padding:8px 24px 12px; flex-wrap:wrap; }\n'
                + '.ml-item { display:flex; align-items:center; gap:4px; font-size:11px; color:#64748b; font-weight:500; }\n'
                + '.ml-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }\n'
                + '.skill-pill-wrap { display:inline-block; }\n'
                + '.skill-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid transparent; background:#f8fafc; color:#1e293b; transition:all 0.2s; }\n'
                + '.skill-pill.status-validated { background:#f0fdf4; color:#166534; border-color:#dcfce7; }\n'
                + '.skill-pill.status-pending { background:white; border-color:#cbd5e1; border-style:dashed; color:#64748b; }\n'
                + '.skill-pill.status-disputed { background:#fef2f2; color:#991b1b; border-color:#fecaca; }\n'
                + '.sp-name { margin-right:2px; }\n'
                + '.sp-level { color:#fff; padding:1px 6px; border-radius:8px; font-size:10px; font-weight:700; }\n'
                + '.sp-actions { display:inline-flex; gap:4px; margin-left:4px; }\n'
                + '.btn-validate { background:#e6f3f7; color:#00799e; border:1px solid #b2dce8; border-radius:4px; padding:2px 6px; font-size:11px; cursor:pointer; }\n'
                + '.btn-validate:hover { background:#00799e; color:#fff; }\n'
                + '.btn-dispute { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; border-radius:4px; padding:2px 6px; font-size:11px; cursor:pointer; }\n'
                + '.btn-dispute:hover { background:#dc2626; color:#fff; }\n'
                + '.btn-validate-all { background:#00799e; color:#fff !important; border-color:#005a75; font-weight:600; border-radius:6px; padding:6px 12px; }\n'
                + '.btn-validate-all:hover { background:#005a75; }\n'
                + '.action-hint { display:none; }\n';

            if (matrixCSS.indexOf('37: UX Fixes') == -1) {
                matrixCSS += matrixCSSAdditions;
            }
            matrixGR.setValue('css', matrixCSS);
            matrixGR.update();
            gs.info('[Skills Hub] Manager Matrix CSS patched');
        }

        gs.info('[Skills Hub] ===== SCRIPT 37 COMPLETE =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in script 37: ' + e.message);
    }
})();
