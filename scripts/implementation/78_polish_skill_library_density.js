/**
 * Fix Script: 78_polish_skill_library_density.js
 * Purpose: Tighten Skill Library table density so long skill descriptions do not
 *          make the Service Portal table difficult to scan.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 78_polish_skill_library_density =====');

        function replaceAll(text, find, replacement) {
            return (text || '').split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('id', 'skills-hub-library');
        widget.setLimit(1);
        widget.query();

        if (!widget.next()) {
            gs.error('[Skills Hub] 78 failed: Skills Hub - Skill Library widget not found');
            return;
        }

        var template = widget.getValue('template') || '';
        template = replaceAll(
            template,
            '<div class="library-description" ng-if="skill.description">{{skill.description}}</div>',
            '<div class="library-description" ng-if="skill.description" title="{{skill.description}}">{{skill.description}}</div>'
        );

        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Skill Library Density 78') < 0) {
            css += [
                '',
                '/* Skills Hub Skill Library Density 78 */',
                '.skills-library-table { table-layout:fixed; }',
                '.skills-library-table > thead > tr > th:nth-child(1) { width:48%; }',
                '.skills-library-table > thead > tr > th:nth-child(2) { width:30%; }',
                '.skills-library-table > thead > tr > th:nth-child(3) { width:12%; }',
                '.skills-library-table > thead > tr > th:nth-child(4) { width:10%; }',
                '.skills-library-table tbody td { vertical-align:top !important; }',
                '.library-skill-name { overflow:hidden; text-overflow:ellipsis; }',
                '.library-description { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; max-width:100%; }',
                '.library-category-pill { max-width:100%; overflow:hidden; text-overflow:ellipsis; }',
                '.skills-library-table .btn { white-space:nowrap; }'
            ].join('\n');
        }

        widget.setValue('template', template);
        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 78_polish_skill_library_density =====');
    } catch (e) {
        gs.error('[Skills Hub] 78_polish_skill_library_density failed: ' + e.message);
    }
})();
