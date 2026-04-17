/**
 * Fix Script: 38_ux_fixes_final.js
 * Purpose: Final UX polish across all Skills Hub widgets
 *
 * Fixes:
 *   1. Profile: Title/Division showing twice (free text + pills) - remove free text
 *   2. Add Skill modal: checkboxes appearing for 0-1 category skills - auto-add
 *   3. All widgets: replace title="" with uib-tooltip="" for consistent tooltips
 *   4. All widgets: correct Cleveland Clinic brand colors
 *      - Primary blue: #0078bf
 *      - Green: #00843d
 *      - Dark/Black: #4b4b45
 *      - Accent orange: #f08122
 *      - Accent purple: #5c2161
 *      - Accent magenta: #a61f56
 *      - Accent gold: #f7c612
 *   5. Proficiency color scale anchored on CC blue #0078bf
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 38_ux_fixes_final =====');

        // ====================================================================
        // Cleveland Clinic Official Brand Colors
        // ====================================================================
        // Primary:  #0078bf (blue), #00843d (green), #4b4b45 (dark)
        // Accents:  #f08122 (orange), #5c2161 (purple), #a61f56 (magenta), #f7c612 (gold)
        //
        // Proficiency scale (CC blue gradient):
        //   Level 1 (Novice):       #a3d4ef  (lightest)
        //   Level 2 (Learner):      #5bb3de
        //   Level 3 (Proficient):   #0096e0
        //   Level 4 (Advanced):     #0078bf  (CC primary)
        //   Level 5 (Expert):       #005a8f  (darkest)
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

        // --- A1. TEMPLATE: Fix #1 (duplicate title/division) + #3 (uib-tooltip) ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var pTemplate = profileGR.getValue('template') || '';

        // Fix #1: Remove the profile-meta line that shows title + dept in free text
        // Pattern: <div class="profile-meta">{{c.data.user_title}} &bull; {{c.data.user_dept}}</div>
        var metaPatterns = [
            '<div class="profile-meta">{{c.data.user_title}} &bull; {{c.data.user_dept}}</div>',
            '<div class="profile-meta">{{c.data.user_title}} &amp;bull; {{c.data.user_dept}}</div>'
        ];
        var metaFound = false;
        for (var mp = 0; mp < metaPatterns.length; mp++) {
            var idx = pTemplate.indexOf(metaPatterns[mp]);
            if (idx > -1) {
                // Remove the line including surrounding whitespace/newlines
                var lineStart = pTemplate.lastIndexOf('\n', idx);
                var lineEnd = pTemplate.indexOf('\n', idx);
                if (lineStart > -1 && lineEnd > -1) {
                    pTemplate = pTemplate.substring(0, lineStart) + pTemplate.substring(lineEnd);
                } else {
                    pTemplate = pTemplate.replace(metaPatterns[mp], '');
                }
                metaFound = true;
                gs.info('[Skills Hub] Fix #1: Removed duplicate profile-meta line');
                break;
            }
        }
        if (!metaFound) {
            // Try regex-style approach - find any div with class profile-meta
            var metaIdx = pTemplate.indexOf('class="profile-meta"');
            if (metaIdx > -1) {
                var mLineStart = pTemplate.lastIndexOf('<div', metaIdx);
                var mLineEnd = pTemplate.indexOf('</div>', metaIdx);
                if (mLineStart > -1 && mLineEnd > -1) {
                    // Also grab the newline before
                    var mPrevNL = pTemplate.lastIndexOf('\n', mLineStart);
                    pTemplate = pTemplate.substring(0, mPrevNL > -1 ? mPrevNL : mLineStart)
                        + pTemplate.substring(mLineEnd + '</div>'.length);
                    gs.info('[Skills Hub] Fix #1: Removed profile-meta div (fallback pattern)');
                }
            } else {
                gs.warn('[Skills Hub] Fix #1: profile-meta div not found - may already be removed');
            }
        }

        // Fix #3: Replace title="" with uib-tooltip="" throughout template
        pTemplate = pTemplate.replace(/\btitle="([^"]+)"/g, 'uib-tooltip="$1"');

        // Fix #4: Update any remaining old blue references in inline styles
        pTemplate = pTemplate.replace(/#00799e/g, '#0078bf');
        pTemplate = pTemplate.replace(/#005a75/g, '#005a8f');

        profileGR.setValue('template', pTemplate);
        profileGR.update();
        gs.info('[Skills Hub] My Profile template patched');

        // --- A2. CLIENT: Update proficiency colors + level names ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var pClient = profileGR.getValue('client_script') || '';

        // Replace old color values in profLevels array
        pClient = pClient.replace(/#b2dce8/g, '#a3d4ef');
        pClient = pClient.replace(/#7fc4d8/g, '#5bb3de');
        pClient = pClient.replace(/#4dadc8/g, '#0096e0');
        pClient = pClient.replace(/#00799e/g, '#0078bf');
        pClient = pClient.replace(/#005a75/g, '#005a8f');

        // Fix #3: uib-tooltip - no client changes needed (template only)

        profileGR.setValue('client_script', pClient);
        profileGR.update();
        gs.info('[Skills Hub] My Profile client patched with CC colors');

        // --- A3. CSS: Full brand color replacement ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var pCSS = profileGR.getValue('css') || '';

        // Replace all old brand colors with CC official
        pCSS = pCSS.replace(/:root \{[^}]+\}/,
            ':root { --cc-blue: #0078bf; --cc-green: #00843d; --cc-dark: #4b4b45; --bg-slate: #f3f6f8; }');

        // Bulk replace old blues
        pCSS = pCSS.replace(/#00799e/g, '#0078bf');
        pCSS = pCSS.replace(/#005a75/g, '#005a8f');
        pCSS = pCSS.replace(/#006080/g, '#005a8f'); // hover state

        // Replace old green with CC green
        pCSS = pCSS.replace(/#60c659/g, '#00843d');

        // Text dark stays close (existing #1e293b is fine, but add CC dark for key elements)
        // #15803d (validation green) -> CC green
        pCSS = pCSS.replace(/#15803d/g, '#00843d');

        // Old blue tints -> CC blue tints
        pCSS = pCSS.replace(/#f0f9ff/g, '#e8f4fb'); // light blue bg
        pCSS = pCSS.replace(/rgba\(0,121,158/g, 'rgba(0,120,191'); // box-shadow
        pCSS = pCSS.replace(/#1d4ed8/g, '#0078bf'); // badge-expert text
        pCSS = pCSS.replace(/#dbeafe/g, '#cce4f6'); // badge bg

        // Update proficiency level colors in CSS
        pCSS = pCSS.replace(/#b2dce8/g, '#a3d4ef');
        pCSS = pCSS.replace(/#7fc4d8/g, '#5bb3de');
        pCSS = pCSS.replace(/#4dadc8/g, '#0096e0');

        // Badge colors
        pCSS = pCSS.replace(/\.badge-title \{[^}]+\}/,
            '.badge-title { background: #e8f4fb; color: #0078bf; border-color: #a3d4ef; }');
        pCSS = pCSS.replace(/\.badge-dept \{[^}]+\}/,
            '.badge-dept { background: #e8f4fb; color: #005a8f; border-color: #a3d4ef; }');
        pCSS = pCSS.replace(/\.cat-badge \{[^}]+\}/,
            '.cat-badge { font-size:10px; background:#e8f4fb; color:#0078bf; }');

        // Interest pill - use CC green
        pCSS = pCSS.replace(/\.interest-pill \{[^}]+\}/,
            '.interest-pill { font-size:10px; font-weight:700; color:#00843d; background:#e6f4eb; padding:3px 8px; border-radius:12px; display:flex; align-items:center; gap:4px; cursor:pointer; border:1px solid transparent; transition:all 0.2s; }');
        pCSS = pCSS.replace(/\.interest-pill:hover \{[^}]+\}/,
            '.interest-pill:hover { border-color: #00843d; }');

        profileGR.setValue('css', pCSS);
        profileGR.update();
        gs.info('[Skills Hub] My Profile CSS updated with CC brand colors');

        // --- A4. SERVER: Fix add_skill modal for 0-1 category auto-behavior ---
        // The modal template changes handle the display logic; we also need
        // to ensure the server getSkillCategories still returns data correctly.
        // The template fix is in the modal section below.

        // --- A5. MODAL TEMPLATE: Fix #2 (hide checkboxes for 0-1 categories) ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var pTemplate2 = profileGR.getValue('template') || '';

        // Find the modal template
        var modalStart = pTemplate2.indexOf('<script type="text/ng-template" id="addSkillModal.html">');
        var modalEnd = pTemplate2.indexOf('</script>', modalStart);

        if (modalStart > -1 && modalEnd > -1) {
            var beforeModal = pTemplate2.substring(0, modalStart);
            var afterModal = pTemplate2.substring(modalEnd + '</script>'.length);

            // Resolve catalog item sys_id
            var catItemId = 'REQUEST_NEW_SKILL_ID';
            var catGR = new GlideRecord('sc_cat_item');
            catGR.addQuery('name', 'Request New Skill');
            catGR.setLimit(1);
            catGR.query();
            if (catGR.next()) catItemId = catGR.getUniqueValue();

            var newModal = ''
                + '<script type="text/ng-template" id="addSkillModal.html">\n'
                + '    <div class="modal-header" style="background:#0078bf; color:#fff; border-radius:4px 4px 0 0;">\n'
                + '        <h4 class="modal-title" style="margin:0; font-weight:700;"><i class="fa fa-plus-circle"></i> Add New Skill</h4>\n'
                + '    </div>\n'
                + '    <div class="modal-body">\n'
                + '        <div class="form-group">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b4b45;">Search Skills</label>\n'
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
                // Selected skill badge
                + '        <div ng-if="selectedSkillName" class="selected-skill-badge" style="margin-bottom:12px;">\n'
                + '            <span style="display:inline-flex; align-items:center; gap:6px; background:#e8f4fb; color:#0078bf; padding:6px 12px; border-radius:16px; font-weight:600; font-size:13px;">\n'
                + '                {{selectedSkillName}}\n'
                + '                <i class="fa fa-times" style="cursor:pointer;" ng-click="clearSelection()"></i>\n'
                + '            </span>\n'
                + '        </div>\n'
                // Loading
                + '        <div ng-if="loadingCategories" class="text-center" style="margin:15px 0;">\n'
                + '            <i class="fa fa-spinner fa-spin" style="color:#0078bf;"></i> Loading categories...\n'
                + '        </div>\n'
                // Categories: ONLY show checkboxes when > 1 category
                + '        <div ng-if="categories.length > 1 && !loadingCategories" class="category-section">\n'
                + '            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#4b4b45; margin-bottom:8px;">Select categories to assess this skill under:</label>\n'
                + '            <div ng-repeat="cat in categories" style="margin:4px 0; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0;">\n'
                + '                <label style="font-weight:normal; margin:0; display:flex; align-items:center; gap:8px;">\n'
                + '                    <input type="checkbox" ng-model="cat.selected" ng-disabled="cat.already_added">\n'
                + '                    <span>{{cat.category_path}}</span>\n'
                + '                    <span ng-if="cat.already_added" style="color:#94a3b8; font-style:italic; font-size:11px;"> (already added)</span>\n'
                + '                </label>\n'
                + '            </div>\n'
                + '        </div>\n'
                // Single category: show it as info text, auto-selected (no checkbox)
                + '        <div ng-if="categories.length == 1 && !loadingCategories" style="margin-top:8px;">\n'
                + '            <div ng-if="!categories[0].already_added" style="padding:8px 12px; background:#e8f4fb; border-radius:6px; font-size:13px; color:#0078bf;">\n'
                + '                <i class="fa fa-folder-open"></i> {{categories[0].category_path}}\n'
                + '            </div>\n'
                + '            <div ng-if="categories[0].already_added" class="alert alert-info small" style="margin-top:8px;">\n'
                + '                <i class="fa fa-check-circle"></i> You have already added this skill.\n'
                + '            </div>\n'
                + '        </div>\n'
                // No categories
                + '        <div ng-if="categories.length == 0 && selectedSkillName && !loadingCategories"\n'
                + '             class="alert alert-warning small" style="margin-top:10px;">\n'
                + '            <i class="fa fa-exclamation-triangle"></i> No categories found for this skill.\n'
                + '        </div>\n'
                // Request link
                + '        <div class="small" style="margin-top:15px; color:#64748b;">\n'
                + '            <i class="fa fa-info-circle"></i> Can\'t find a skill?\n'
                + '            <a href="?id=sc_cat_item&sys_id=' + catItemId + '" style="color:#0078bf;">Request it here.</a>\n'
                + '        </div>\n'
                + '    </div>\n'
                + '    <div class="modal-footer">\n'
                + '        <button class="btn btn-default" ng-click="cancel()">Cancel</button>\n'
                + '        <button class="btn" ng-click="save()" ng-disabled="!selectedSkillName || getSelectedCount() == 0"\n'
                + '                style="background:#0078bf; color:#fff; border-color:#0078bf; font-weight:600;">\n'
                + '            <i class="fa fa-plus"></i> Add Skill\n'
                + '        </button>\n'
                + '    </div>\n'
                + '</script>';

            pTemplate2 = beforeModal + newModal + afterModal;
            profileGR.setValue('template', pTemplate2);
            profileGR.update();
            gs.info('[Skills Hub] Fix #2: Modal rebuilt - no checkboxes for 0-1 categories');
        }

        // --- A6. CLIENT: Fix getSelectedCount for single category (auto-select) ---
        profileGR = new GlideRecord('sp_widget');
        profileGR.get(profileId);
        var pClient2 = profileGR.getValue('client_script') || '';

        // In selectSkill callback: auto-select when only 1 category
        // Find the categories assignment in the modal controller
        var oldCatAssign = '$scope.categories = cats;';
        var newCatAssign = ''
            + '// Auto-select single category\n'
            + '                      if (cats.length == 1 && !cats[0].already_added) {\n'
            + '                          cats[0].selected = true;\n'
            + '                      }\n'
            + '                      $scope.categories = cats;';

        if (pClient2.indexOf(oldCatAssign) > -1 && pClient2.indexOf('Auto-select single category') == -1) {
            pClient2 = pClient2.replace(oldCatAssign, newCatAssign);
            gs.info('[Skills Hub] Fix #2: Client updated to auto-select single category');
        }

        profileGR.setValue('client_script', pClient2);
        profileGR.update();

        // ============================================================
        // B. FIND EXPERT WIDGET
        // ============================================================
        gs.info('[Skills Hub] --- Patching Find Expert Widget ---');

        var findGR = new GlideRecord('sp_widget');
        findGR.addQuery('name', 'CONTAINS', 'Find Expert');
        findGR.query();
        if (findGR.next()) {
            var findId = findGR.getUniqueValue();

            // --- B1. TEMPLATE: uib-tooltip + CC colors ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);
            var fTemplate = findGR.getValue('template') || '';

            fTemplate = fTemplate.replace(/\btitle="([^"]+)"/g, 'uib-tooltip="$1"');
            fTemplate = fTemplate.replace(/#00799e/g, '#0078bf');
            fTemplate = fTemplate.replace(/#005a75/g, '#005a8f');

            findGR.setValue('template', fTemplate);
            findGR.update();

            // --- B2. CLIENT: CC colors ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);
            var fClient = findGR.getValue('client_script') || '';

            fClient = fClient.replace(/#b2dce8/g, '#a3d4ef');
            fClient = fClient.replace(/#7fc4d8/g, '#5bb3de');
            fClient = fClient.replace(/#4dadc8/g, '#0096e0');
            fClient = fClient.replace(/#00799e/g, '#0078bf');
            fClient = fClient.replace(/#005a75/g, '#005a8f');

            findGR.setValue('client_script', fClient);
            findGR.update();

            // --- B3. CSS: CC colors ---
            findGR = new GlideRecord('sp_widget');
            findGR.get(findId);
            var fCSS = findGR.getValue('css') || '';

            fCSS = fCSS.replace(/#00799e/g, '#0078bf');
            fCSS = fCSS.replace(/#005a75/g, '#005a8f');
            fCSS = fCSS.replace(/#b2dce8/g, '#a3d4ef');
            fCSS = fCSS.replace(/#1e40af/g, '#0078bf');
            fCSS = fCSS.replace(/#dbeafe/g, '#cce4f6');
            fCSS = fCSS.replace(/#e0e7ff/g, '#e8f4fb');
            fCSS = fCSS.replace(/#4338ca/g, '#005a8f');
            fCSS = fCSS.replace(/#3b82f6/g, '#0078bf');
            fCSS = fCSS.replace(/#e6f3f7/g, '#e8f4fb');
            fCSS = fCSS.replace(/#15803d/g, '#00843d');

            findGR.setValue('css', fCSS);
            findGR.update();
            gs.info('[Skills Hub] Find Expert patched with CC brand colors + uib-tooltip');
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
            matrixGR.next();
        }

        if (matrixGR.getUniqueValue()) {
            var matrixId = matrixGR.getUniqueValue();

            // --- C1. TEMPLATE: uib-tooltip + CC colors ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            var mTemplate = matrixGR.getValue('template') || '';

            mTemplate = mTemplate.replace(/\btitle="([^"]+)"/g, 'uib-tooltip="$1"');
            mTemplate = mTemplate.replace(/#00799e/g, '#0078bf');
            mTemplate = mTemplate.replace(/#005a75/g, '#005a8f');

            matrixGR.setValue('template', mTemplate);
            matrixGR.update();

            // --- C2. CLIENT: CC colors ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            var mClient = matrixGR.getValue('client_script') || '';

            mClient = mClient.replace(/#b2dce8/g, '#a3d4ef');
            mClient = mClient.replace(/#7fc4d8/g, '#5bb3de');
            mClient = mClient.replace(/#4dadc8/g, '#0096e0');
            mClient = mClient.replace(/#00799e/g, '#0078bf');
            mClient = mClient.replace(/#005a75/g, '#005a8f');

            matrixGR.setValue('client_script', mClient);
            matrixGR.update();

            // --- C3. CSS: CC colors ---
            matrixGR = new GlideRecord('sp_widget');
            matrixGR.get(matrixId);
            var mCSS = matrixGR.getValue('css') || '';

            // Root vars
            mCSS = mCSS.replace(/:root \{[^}]+\}/,
                ':root { --cc-blue: #0078bf; --cc-green: #00843d; --cc-dark: #4b4b45; --text-dark: #1e293b; --text-light: #64748b; --bg-slate: #f8fafc; }');

            mCSS = mCSS.replace(/#00799e/g, '#0078bf');
            mCSS = mCSS.replace(/#005a75/g, '#005a8f');
            mCSS = mCSS.replace(/#b2dce8/g, '#a3d4ef');
            mCSS = mCSS.replace(/#15803d/g, '#00843d');
            mCSS = mCSS.replace(/#166534/g, '#00843d');
            mCSS = mCSS.replace(/#e6f3f7/g, '#e8f4fb');
            mCSS = mCSS.replace(/#f0f9ff/g, '#e8f4fb');
            mCSS = mCSS.replace(/#60c659/g, '#00843d');

            // Validate All button
            mCSS = mCSS.replace(
                /\.btn-validate-all \{[^}]+\}/,
                '.btn-validate-all { background:#0078bf; color:#fff !important; border-color:#005a8f; font-weight:600; border-radius:6px; padding:6px 12px; }'
            );

            // Proficiency legend dots
            mCSS = mCSS.replace(/#7fc4d8/g, '#5bb3de');
            mCSS = mCSS.replace(/#4dadc8/g, '#0096e0');

            matrixGR.setValue('css', mCSS);
            matrixGR.update();
            gs.info('[Skills Hub] Manager Matrix patched with CC brand colors + uib-tooltip');
        }

        // ============================================================
        // D. TAB NAVIGATION WIDGET (if exists)
        // ============================================================
        var tabGR = new GlideRecord('sp_widget');
        tabGR.addQuery('name', 'CONTAINS', 'Skills Hub');
        tabGR.addQuery('name', 'CONTAINS', 'Tab');
        tabGR.query();
        if (tabGR.next()) {
            var tabCSS = tabGR.getValue('css') || '';
            tabCSS = tabCSS.replace(/#00799e/g, '#0078bf');
            tabCSS = tabCSS.replace(/#005a75/g, '#005a8f');
            tabCSS = tabCSS.replace(/#0072CE/g, '#0078bf');
            tabGR.setValue('css', tabCSS);
            tabGR.update();
            gs.info('[Skills Hub] Tab Navigation CSS updated with CC brand colors');
        }

        gs.info('[Skills Hub] ===== SCRIPT 38 COMPLETE =====');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in script 38: ' + e.message);
    }
})();
