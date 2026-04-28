/**
 * Fix Script: 45_refine_profile_list_view.js
 * Purpose: Refine My Profile list view after UX review.
 *
 * Fixes:
 *   - Uses the widget's real template class names instead of unused selectors.
 *   - Adds column headers for list mode.
 *   - Converts single-skill cards into compact rows with aligned columns.
 *   - Converts grouped skills into nested list rows so they do not balloon awkwardly.
 *   - Keeps dispute panels full width under the affected row.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 45_refine_profile_list_view =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 45');
            return;
        }

        var template = widget.getValue('template') || '';
        var css = widget.getValue('css') || '';

        if (template.indexOf('list-column-header') < 0) {
            var rowGridNeedle = '<div class="row-grid" ng-class="{\'compact-skills\': c.compactMode}" ng-if="data.skills.length > 0">';
            template = template.replace(rowGridNeedle, [
                '<div class="list-column-header" ng-if="data.skills.length > 0 && c.compactMode">',
                '        <span>Skill</span>',
                '        <span>Level</span>',
                '        <span>Progress</span>',
                '        <span>Actions</span>',
                '     </div>',
                '',
                '     ' + rowGridNeedle
            ].join('\n'));
        }

        template = replaceAll(template,
            '<div ng-if="skill.entries.length == 1" style="padding-top:8px;">',
            '<div class="single-entry-body" ng-if="skill.entries.length == 1">');

        template = replaceAll(template,
            '<div ng-if="skill.entries.length > 1">',
            '<div class="multi-entry-body" ng-if="skill.entries.length > 1">');

        template = replaceAll(template,
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">',
            '<div class="category-entry-top">');

        template = replaceAll(template,
            '<div style="display:flex; align-items:center; gap:8px;">',
            '<div class="category-actions">');

        template = replaceAll(template,
            '<div style="display:flex; justify-content:space-between; align-items:center;">',
            '<div class="category-footer-row">');

        if (css.indexOf('Skills Hub List Polish 45') < 0) {
            css += [
                '',
                '/* Skills Hub List Polish 45 */',
                '.list-column-header { display:none; }',
                '.compact-skills { margin-left:0 !important; margin-right:0 !important; }',
                '.compact-skills + .col-grid, .compact-skills .add-card-placeholder { display:none !important; }',
                '.section-header { margin-bottom:12px; }',
                '.btn-view-toggle.active { background:#0f766e; border-color:#0f766e; color:#fff; }',
                '.list-column-header { grid-template-columns:minmax(220px,2fr) 120px minmax(180px,1.2fr) 150px; gap:12px; align-items:center; padding:0 12px 8px 12px; color:#64748b; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.02em; }',
                '.list-column-header[ng-if], .list-column-header { display:grid; }',
                '.row-grid:not(.compact-skills) + .list-column-header { display:none; }',
                '.compact-skills .col-grid { display:block !important; margin-bottom:0 !important; border-bottom:1px solid #e5edf3; }',
                '.compact-skills .col-grid:last-child { border-bottom:none; }',
                '.compact-skills .skill-card { border:0 !important; border-radius:0 !important; box-shadow:none !important; background:#fff !important; padding:10px 12px !important; display:grid !important; grid-template-columns:minmax(220px,2fr) 120px minmax(180px,1.2fr) 150px; gap:8px 12px; align-items:center; min-height:54px !important; overflow:visible !important; }',
                '.compact-skills .skill-card:hover { transform:none !important; box-shadow:none !important; background:#f8fbfd !important; }',
                '.compact-skills .interest-stripe { width:3px !important; }',
                '.compact-skills .card-header-row { grid-column:1; margin:0 !important; min-width:0; align-items:center !important; }',
                '.compact-skills .card-header-row > div { min-width:0; }',
                '.compact-skills .skill-name { font-size:14px !important; line-height:1.25 !important; margin:0 0 3px 0 !important; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
                '.compact-skills .skill-type, .compact-skills .cat-badge { font-size:9px !important; line-height:1.2 !important; padding:2px 6px !important; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }',
                '.compact-skills .card-header-row > .btn-more { margin-left:8px; flex:0 0 auto; }',
                '.compact-skills .single-entry-body { display:contents; }',
                '.compact-skills .single-entry-body > .prof-label-row { grid-column:2; margin:0 !important; justify-content:flex-start !important; gap:8px; white-space:nowrap; }',
                '.compact-skills .single-entry-body > .interactive-bar-bg { grid-column:3; margin:0 !important; width:100%; }',
                '.compact-skills .single-entry-body > .card-footer-row { grid-column:4; margin:0 !important; padding:0 !important; border:0 !important; justify-content:flex-end !important; gap:8px; white-space:nowrap; }',
                '.compact-skills .multi-entry-body { grid-column:1 / -1; display:block; margin-top:4px; border-top:1px solid #edf2f7; }',
                '.compact-skills .category-entry { display:grid !important; grid-template-columns:minmax(220px,2fr) 120px minmax(180px,1.2fr) 150px; gap:8px 12px; align-items:center; padding:8px 0 !important; border-top:0 !important; border-bottom:1px solid #f1f5f9; }',
                '.compact-skills .category-entry:last-child { border-bottom:none !important; }',
                '.compact-skills .category-entry-top { grid-column:1; display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:0; margin:0 !important; }',
                '.compact-skills .category-entry-top .skill-type { min-width:0; }',
                '.compact-skills .category-actions { flex:0 0 auto; display:flex; align-items:center; gap:8px; }',
                '.compact-skills .category-entry > .prof-label-row { grid-column:2; margin:0 !important; justify-content:flex-start !important; gap:8px; white-space:nowrap; }',
                '.compact-skills .category-entry > .interactive-bar-bg { grid-column:3; margin:0 !important; width:100%; }',
                '.compact-skills .category-footer-row { grid-column:4; display:flex; justify-content:flex-end; align-items:center; gap:8px; white-space:nowrap; }',
                '.compact-skills .dispute-response-panel { grid-column:1 / -1; margin:4px 0 0 0 !important; padding:8px 10px !important; border-radius:6px !important; }',
                '.compact-skills .endorsement-pill { padding:2px 4px; }',
                '.compact-skills .interest-pill { font-size:9px !important; padding:3px 7px !important; }',
                '.compact-skills .prof-legend, .compact-skills .prof-info-panel { display:none !important; }',
                '@media (max-width: 900px) { .list-column-header { display:none !important; } .compact-skills .skill-card, .compact-skills .category-entry { grid-template-columns:1fr; gap:6px; } .compact-skills .card-header-row, .compact-skills .single-entry-body > .prof-label-row, .compact-skills .single-entry-body > .interactive-bar-bg, .compact-skills .single-entry-body > .card-footer-row, .compact-skills .multi-entry-body, .compact-skills .category-entry-top, .compact-skills .category-entry > .prof-label-row, .compact-skills .category-entry > .interactive-bar-bg, .compact-skills .category-footer-row { grid-column:1; } .compact-skills .single-entry-body > .card-footer-row, .compact-skills .category-footer-row { justify-content:flex-start !important; } }'
            ].join('\n');
        }

        widget.setValue('template', template);
        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 45_refine_profile_list_view =====');
    } catch (e) {
        gs.error('[Skills Hub] 45_refine_profile_list_view failed: ' + e.message);
    }
})();
