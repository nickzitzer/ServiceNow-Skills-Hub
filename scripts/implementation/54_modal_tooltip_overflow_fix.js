/**
 * Fix Script: 54_modal_tooltip_overflow_fix.js
 * Purpose: Prevent tooltip/help text from being clipped inside Skills Hub modals.
 *
 * Fixes:
 *   - Allows Add Skill modal content to overflow visibly.
 *   - Raises UI Bootstrap/Bootstrap tooltip z-index above modal content/backdrop.
 *   - Adds a lightweight data-tooltip fallback style for any future inline help.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 54_modal_tooltip_overflow_fix =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();

        if (!widget.next()) {
            gs.warn('[Skills Hub] My Profile widget not found during script 54');
            return;
        }

        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Modal Tooltip Fix 54') < 0) {
            css += [
                '',
                '/* Skills Hub Modal Tooltip Fix 54 */',
                '.modal-dialog, .modal-content, .modal-body { overflow: visible !important; }',
                '.modal-content { isolation: isolate; }',
                '.tooltip, .uib-tooltip, .tooltip.in { z-index: 20000 !important; pointer-events: none; }',
                '.tooltip .tooltip-inner, .uib-tooltip .tooltip-inner { max-width: 320px !important; white-space: normal !important; text-align: left !important; line-height: 1.35 !important; padding: 8px 10px !important; box-shadow: 0 8px 18px rgba(15,23,42,0.22); }',
                '[data-tooltip] { position: relative; }',
                '[data-tooltip]:hover:after, [data-tooltip]:focus:after { content: attr(data-tooltip); position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 20001; width: max-content; max-width: 320px; padding: 8px 10px; border-radius: 6px; background: #1e293b; color: #fff; font-size: 12px; font-weight: 500; line-height: 1.35; box-shadow: 0 8px 18px rgba(15,23,42,0.22); white-space: normal; }',
                '[data-tooltip]:hover:before, [data-tooltip]:focus:before { content: ""; position: absolute; left: 12px; bottom: calc(100% + 2px); z-index: 20002; border: 6px solid transparent; border-top-color: #1e293b; }'
            ].join('\n');
            widget.setValue('css', css);
            widget.update();
            gs.info('[Skills Hub] My Profile modal tooltip CSS patched');
        } else {
            gs.info('[Skills Hub] Modal tooltip CSS already patched');
        }

        gs.info('[Skills Hub] ===== COMPLETED 54_modal_tooltip_overflow_fix =====');
    } catch (e) {
        gs.error('[Skills Hub] 54_modal_tooltip_overflow_fix failed: ' + e.message);
    }
})();
