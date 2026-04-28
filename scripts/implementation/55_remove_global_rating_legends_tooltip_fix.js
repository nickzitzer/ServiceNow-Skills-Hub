/**
 * Fix Script: 55_remove_global_rating_legends_tooltip_fix.js
 * Purpose: Remove obsolete global rating legends and stop skill-card tooltips from clipping.
 *
 * Context:
 *   - Skill levels now come from each skill's cmn_skill.level_type scale, so a single
 *     Novice/Learner/Proficient/Advanced/Expert legend is misleading.
 *   - Skill cards still clip UI Bootstrap tooltips because the card container uses
 *     overflow:hidden in the standard card view.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 55_remove_global_rating_legends_tooltip_fix =====');

        function getWidget(name) {
            var widget = new GlideRecord('sp_widget');
            widget.addQuery('name', name);
            widget.setLimit(1);
            widget.query();
            return widget.next() ? widget : null;
        }

        function appendCss(widget, marker, lines) {
            if (!widget) return false;
            var css = widget.getValue('css') || '';
            if (css.indexOf(marker) > -1) {
                gs.info('[Skills Hub] CSS already contains ' + marker + ' for ' + widget.getValue('name'));
                return false;
            }
            css += '\n\n/* ' + marker + ' */\n' + lines.join('\n');
            widget.setValue('css', css);
            widget.update();
            gs.info('[Skills Hub] Added ' + marker + ' CSS to ' + widget.getValue('name'));
            return true;
        }

        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            appendCss(profile, 'Skills Hub Rating Legend Cleanup 55', [
                '.prof-legend, .prof-info-panel { display: none !important; }',
                '.row-grid, .col-grid, .skill-card, .single-entry-body, .multi-entry-body, .category-entry, .interactive-bar-bg, .segment-hit { overflow: visible !important; }',
                '.skill-card { isolation: isolate; }',
                '.tooltip, .uib-tooltip, .tooltip.in, .uib-tooltip.in { z-index: 30000 !important; pointer-events: none; }',
                '.tooltip .tooltip-inner, .uib-tooltip .tooltip-inner { max-width: 340px !important; white-space: normal !important; text-align: left !important; line-height: 1.35 !important; padding: 8px 10px !important; border-radius: 6px !important; box-shadow: 0 8px 18px rgba(15,23,42,0.22) !important; }'
            ]);
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 55');
        }

        var matrix = getWidget('Skills Hub - Manager Matrix');
        if (matrix) {
            appendCss(matrix, 'Skills Hub Matrix Rating Legend Cleanup 55', [
                '.matrix-legend { display: none !important; }',
                '.matrix-wrapper, .matrix-container, .matrix-row, .skill-cell, .level-pill { overflow: visible !important; }',
                '.tooltip, .uib-tooltip, .tooltip.in, .uib-tooltip.in { z-index: 30000 !important; pointer-events: none; }',
                '.tooltip .tooltip-inner, .uib-tooltip .tooltip-inner { max-width: 340px !important; white-space: normal !important; text-align: left !important; line-height: 1.35 !important; padding: 8px 10px !important; border-radius: 6px !important; box-shadow: 0 8px 18px rgba(15,23,42,0.22) !important; }'
            ]);
        } else {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 55');
        }

        gs.info('[Skills Hub] ===== COMPLETED 55_remove_global_rating_legends_tooltip_fix =====');
    } catch (e) {
        gs.error('[Skills Hub] 55_remove_global_rating_legends_tooltip_fix failed: ' + e.message);
    }
})();
