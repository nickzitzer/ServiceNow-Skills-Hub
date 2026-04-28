/**
 * Fix Script: 43_regression_fixes_after_dev_test.js
 * Purpose: Follow-up fixes from dev portal regression testing.
 *
 * Fixes:
 *   - My Profile compact toggle was not inserted by script 39 on the live widget.
 *   - Find Expert result proficiency rendered as "Novice (4/5)" because the
 *     template used Math.round(...) directly in an Angular expression.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 43_regression_fixes_after_dev_test =====');

        // ------------------------------------------------------------------
        // A. My Profile compact toggle
        // ------------------------------------------------------------------
        var profile = new GlideRecord('sp_widget');
        profile.addQuery('name', 'Skills Hub - My Profile');
        profile.setLimit(1);
        profile.query();
        if (profile.next()) {
            var pTemplate = profile.getValue('template') || '';
            var pClient = profile.getValue('client_script') || '';
            var pCss = profile.getValue('css') || '';

            if (pClient.indexOf('c.compactMode') < 0) {
                pClient = pClient.replace('  var c = this;', [
                    '  var c = this;',
                    '  c.compactMode = false;',
                    '  c.toggleCompactMode = function() { c.compactMode = !c.compactMode; };'
                ].join('\n'));
            }

            if (pTemplate.indexOf('c.toggleCompactMode') < 0) {
                var addButtonStart = pTemplate.indexOf('<button class="btn-add" ng-click="c.openAddModal()">');
                if (addButtonStart > -1) {
                    var addButtonEnd = pTemplate.indexOf('</button>', addButtonStart);
                    if (addButtonEnd > -1) {
                        var addButtonHtml = pTemplate.substring(addButtonStart, addButtonEnd + '</button>'.length);
                        var actionHtml = [
                            '<div class="profile-actions">',
                            '        <button class="btn-compact" ng-click="c.toggleCompactMode()" uib-tooltip="Toggle compact view">',
                            '           <i class="fa" ng-class="{\'fa-compress\': !c.compactMode, \'fa-expand\': c.compactMode}"></i>',
                            '        </button>',
                            '        ' + addButtonHtml,
                            '        </div>'
                        ].join('\n');
                        pTemplate = pTemplate.substring(0, addButtonStart) + actionHtml + pTemplate.substring(addButtonEnd + '</button>'.length);
                    }
                }
            }

            if (pTemplate.indexOf('compact-skills') < 0) {
                pTemplate = pTemplate.replace(
                    '<div class="row-grid" ng-if="data.skills.length > 0">',
                    '<div class="row-grid" ng-class="{\'compact-skills\': c.compactMode}" ng-if="data.skills.length > 0">');
            }

            if (pCss.indexOf('btn-compact') < 0) {
                pCss += [
                    '',
                    '/* Skills Hub Regression Fix 43 */',
                    '.profile-actions { display:flex; align-items:center; gap:8px; }',
                    '.btn-compact { width:34px; height:34px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#4b4b45; display:inline-flex; align-items:center; justify-content:center; }',
                    '.btn-compact:hover { border-color:#0078bf; color:#0078bf; }',
                    '.compact-skills .col-grid { margin-bottom:10px; }',
                    '.compact-skills .skill-card { padding:12px; }',
                    '.compact-skills .skill-name { font-size:14px; }',
                    '.compact-skills .skill-type { font-size:9px; }',
                    '.compact-skills .card-footer-row { padding-top:8px; }',
                    '.compact-skills .interactive-bar-bg { height:6px; }'
                ].join('\n');
            }

            profile.setValue('template', pTemplate);
            profile.setValue('client_script', pClient);
            profile.setValue('css', pCss);
            profile.update();
            gs.info('[Skills Hub] My Profile compact toggle patched');
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 43');
        }

        // ------------------------------------------------------------------
        // B. Find Expert proficiency label
        // ------------------------------------------------------------------
        var find = new GlideRecord('sp_widget');
        find.addQuery('name', 'Skills Hub - Find Expert');
        find.setLimit(1);
        find.query();
        if (find.next()) {
            var fServer = find.getValue('script') || '';
            var fTemplate = find.getValue('template') || '';

            if (fServer.indexOf('avg_level_rounded') < 0) {
                fServer = fServer.replace(
                    '                  avg_level: Math.round(avgLevel * 10) / 10,',
                    '                  avg_level: Math.round(avgLevel * 10) / 10,\n                  avg_level_rounded: Math.round(avgLevel),');
            }

            fTemplate = fTemplate.split('{{c.profLevelName(Math.round(sg.avg_level))}}').join('{{c.profLevelName(sg.avg_level_rounded)}}');
            fTemplate = fTemplate.split('c.profColor(Math.round(sg.avg_level))').join('c.profColor(sg.avg_level_rounded)');

            find.setValue('script', fServer);
            find.setValue('template', fTemplate);
            find.update();
            gs.info('[Skills Hub] Find Expert proficiency label patched');
        } else {
            gs.warn('[Skills Hub] Find Expert widget not found during script 43');
        }

        gs.info('[Skills Hub] ===== COMPLETED 43_regression_fixes_after_dev_test =====');
    } catch (e) {
        gs.error('[Skills Hub] 43_regression_fixes_after_dev_test failed: ' + e.message);
    }
})();
