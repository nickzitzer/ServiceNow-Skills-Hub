/**
 * Fix Script: 82_repair_skill_library_toolbar_layout.js
 * Purpose: Repair Skill Library toolbar wrapping after UX polish.
 *
 * Root cause:
 *   Prior grid-based toolbar CSS allowed the category picker and clear action to
 *   drift outside the visible row in the Service Portal container. This replaces
 *   the toolbar layout with a simpler flex row that wraps predictably.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 82_repair_skill_library_toolbar_layout =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('id', 'skills-hub-library');
        widget.setLimit(1);
        widget.query();

        if (!widget.next()) {
            gs.error('[Skills Hub] 82 failed: Skills Hub - Skill Library widget not found');
            return;
        }

        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Library Toolbar Repair 82') < 0) {
            css += [
                '',
                '/* Skills Hub Library Toolbar Repair 82 */',
                '.skills-library-panel .library-toolbar { display:flex !important; flex-wrap:wrap; align-items:flex-end; gap:8px; padding:10px 12px; overflow:visible; }',
                '.skills-library-panel .library-search { order:1; flex:1 1 340px; min-width:260px; }',
                '.skills-library-panel .library-category { order:2; flex:0 1 320px; min-width:240px; max-width:360px; }',
                '.skills-library-panel .library-actions { order:3; flex:0 0 36px; min-width:36px; align-self:flex-end; }',
                '.skills-library-panel .library-category-picker, .skills-library-panel .library-category .select2-container { width:100% !important; max-width:100% !important; }',
                '.skills-library-panel .library-category .select2-choice, .skills-library-panel .library-category .select2-choices { width:100% !important; }',
                '.skills-library-panel .library-clear-btn { display:inline-flex; align-items:center; justify-content:center; }',
                '@media (max-width: 700px) { .skills-library-panel .library-toolbar { align-items:stretch; } .skills-library-panel .library-search, .skills-library-panel .library-category { flex:1 1 100%; min-width:0; max-width:none; } .skills-library-panel .library-actions { flex:0 0 36px; margin-left:auto; } }'
            ].join('\n');
        }

        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 82_repair_skill_library_toolbar_layout =====');
    } catch (e) {
        gs.error('[Skills Hub] 82_repair_skill_library_toolbar_layout failed: ' + e.message);
    }
})();
