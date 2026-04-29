/**
 * Fix Script: 80_skill_library_ux_accessibility_polish.js
 * Purpose: Clean up Skill Library toolbar density and improve 508/ADA affordances.
 *
 * Changes:
 *   - Compact filter bar with icon-only clear action shown only when filters exist
 *   - Better labels, aria-live count/status, table caption, and scoped headers
 *   - Specific Add/Added button accessible names per skill
 *   - Stronger keyboard focus styling for library controls and tab navigation
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 80_skill_library_ux_accessibility_polish =====');

        function replaceAll(text, find, replacement) {
            return (text || '').split(find).join(replacement);
        }

        function patchOnce(text, marker, addition) {
            text = text || '';
            if (text.indexOf(marker) > -1) return text;
            return text + addition;
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('id', 'skills-hub-library');
        widget.setLimit(1);
        widget.query();

        if (!widget.next()) {
            gs.error('[Skills Hub] 80 failed: Skills Hub - Skill Library widget not found');
            return;
        }

        var client = widget.getValue('client_script') || '';
        if (client.indexOf('Skills Hub Library UX A11y 80') < 0) {
            client = client.replace(
                '  c.loading = false;',
                '  c.loading = false;\n  // Skills Hub Library UX A11y 80\n  c.hasFilters = function() { return !!((c.term || "").trim() || (c.categoryFilter && c.categoryFilter.value)); };'
            );
        }

        var template = widget.getValue('template') || '';
        template = replaceAll(template, '<span class="library-count pull-right">{{c.data.total || 0}} skills</span>', '<span class="library-count pull-right" aria-live="polite">{{c.data.total || 0}} skills</span>');
        template = replaceAll(template, '<label>Search</label>', '<label for="skills-library-search">Search</label>');
        template = replaceAll(template, '<input type="text" class="form-control" ng-model="c.term" ng-keypress="$event.which === 13 && c.search()" placeholder="Search skills">', '<input id="skills-library-search" type="text" class="form-control" ng-model="c.term" ng-keypress="$event.which === 13 && c.search()" placeholder="Search skills" aria-label="Search skills library">');
        template = replaceAll(template, '<button class="btn btn-primary" type="button" ng-click="c.search()"><i class="fa fa-search"></i></button>', '<button class="btn btn-primary" type="button" ng-click="c.search()" aria-label="Search skills"><i class="fa fa-search" aria-hidden="true"></i></button>');
        template = replaceAll(template, '<label>Category</label>', '<label id="skills-library-category-label">Category</label>');
        template = replaceAll(template, '<sn-record-picker field="c.categoryFilter" table="\'cmn_skill_category\'" display-field="\'name\'" value-field="\'sys_id\'" search-fields="\'name\'" page-size="20" on-change="c.onCategoryChange()"></sn-record-picker>', '<div class="library-category-picker" aria-labelledby="skills-library-category-label"><sn-record-picker field="c.categoryFilter" table="\'cmn_skill_category\'" display-field="\'name\'" value-field="\'sys_id\'" search-fields="\'name\'" page-size="20" on-change="c.onCategoryChange()"></sn-record-picker></div>');
        template = replaceAll(template, '<button class="btn btn-default" ng-click="c.clearFilters()">Clear</button>', '<button class="btn btn-default library-clear-btn" ng-if="c.hasFilters()" ng-click="c.clearFilters()" aria-label="Clear Skill Library filters" uib-tooltip="Clear filters" tooltip-placement="top"><i class="fa fa-times" aria-hidden="true"></i><span class="sr-only">Clear filters</span></button>');
        template = replaceAll(template, '<table class="table table-striped table-responsive uib-table skills-library-table" ng-if="(c.data.skills || []).length">', '<table class="table table-striped table-responsive uib-table skills-library-table" ng-if="(c.data.skills || []).length" aria-describedby="skills-library-result-count"><caption class="sr-only">Skill Library results</caption>');
        template = replaceAll(template, '<span class="library-count pull-right" aria-live="polite">{{c.data.total || 0}} skills</span>', '<span id="skills-library-result-count" class="library-count pull-right" aria-live="polite">{{c.data.total || 0}} skills</span>');
        template = replaceAll(template, '<th>Skill</th>', '<th scope="col">Skill</th>');
        template = replaceAll(template, '<th>Category</th>', '<th scope="col">Category</th>');
        template = replaceAll(template, '<th>Status</th>', '<th scope="col">Status</th>');
        template = replaceAll(template, '<th class="text-right">Action</th>', '<th scope="col" class="text-right">Action</th>');
        template = replaceAll(template, '<div class="library-skill-name">{{skill.name}}</div>', '<div class="library-skill-name" id="skill-library-name-{{$index}}">{{skill.name}}</div>');
        template = replaceAll(template, '<span class="label label-success" ng-if="skill.already_added">On profile</span>', '<span class="label label-success" ng-if="skill.already_added" aria-label="{{skill.name}} is already on your profile">On profile</span>');
        template = replaceAll(template, '<span class="label label-default" ng-if="!skill.already_added">Available</span>', '<span class="label label-default" ng-if="!skill.already_added" aria-label="{{skill.name}} is available to add">Available</span>');
        template = replaceAll(template, '<button class="btn btn-sm btn-primary" ng-click="c.addSkill(skill)" ng-disabled="skill.already_added || skill.adding">', '<button class="btn btn-sm btn-primary" ng-click="c.addSkill(skill)" ng-disabled="skill.already_added || skill.adding" aria-label="{{skill.already_added ? \'Already added \' + skill.name : \'Add \' + skill.name + \' to my profile\'}}">');
        template = replaceAll(template, '<i class="fa" ng-class="{\'fa-spinner fa-spin\': skill.adding, \'fa-plus\': !skill.adding && !skill.already_added, \'fa-check\': skill.already_added}"></i>', '<i class="fa" aria-hidden="true" ng-class="{\'fa-spinner fa-spin\': skill.adding, \'fa-plus\': !skill.adding && !skill.already_added, \'fa-check\': skill.already_added}"></i>');
        template = replaceAll(template, '<div class="alert alert-info library-empty" ng-if="(c.data.skills || []).length == 0">No matching skills found.</div>', '<div class="alert alert-info library-empty" ng-if="(c.data.skills || []).length == 0" role="status">No matching skills found.</div>');

        var css = widget.getValue('css') || '';
        css = patchOnce(css, 'Skills Hub Library UX A11y 80', [
            '',
            '/* Skills Hub Library UX A11y 80 */',
            '.library-toolbar { grid-template-columns:minmax(260px,1fr) minmax(220px,360px) 36px; gap:8px; padding:10px 12px; align-items:end; }',
            '.library-actions { min-width:36px; }',
            '.library-clear-btn { width:34px; height:34px; padding:6px 0; border-radius:6px; color:#475569; }',
            '.library-clear-btn:hover, .library-clear-btn:focus { color:#1e293b; background:#f1f5f9; border-color:#94a3b8; }',
            '.library-toolbar .form-control, .library-toolbar .btn, .library-category .select2-choice, .library-category .select2-choices { min-height:34px; }',
            '.skills-library-panel a:focus, .skills-library-panel button:focus, .skills-library-panel input:focus, .skills-library-panel .select2-container-active .select2-choice, .skills-library-panel .select2-container-active .select2-choices { outline:2px solid #005fcc !important; outline-offset:2px; box-shadow:none !important; }',
            '.skills-library-table > thead > tr > th { color:#1f5f8b; }',
            '.skills-library-table .label-default { background:#475569; color:#fff; }',
            '.skills-library-table .label-success { background:#2f7d32; color:#fff; }',
            '@media (max-width: 800px) { .library-toolbar { grid-template-columns:1fr 36px; } .library-search, .library-category { grid-column:1 / -1; } .library-actions { grid-column:2; justify-self:end; } }'
        ].join('\n'));

        widget.setValue('client_script', client);
        widget.setValue('template', template);
        widget.setValue('css', css);
        widget.update();

        var container = new GlideRecord('sp_widget');
        container.addQuery('id', 'skills-hub-container');
        container.setLimit(1);
        container.query();

        if (container.next()) {
            var cTemplate = container.getValue('template') || '';
            cTemplate = replaceAll(cTemplate, 'heading="My Portfolio"', 'heading="My Skills"');
            cTemplate = replaceAll(cTemplate, 'heading="Find an Expert"', 'heading="Find Experts"');
            cTemplate = replaceAll(cTemplate, 'heading="Team Matrix"', 'heading="Team Review"');
            cTemplate = replaceAll(cTemplate, '<div style="padding-top:15px;">', '<div class="skills-hub-tab-panel" style="padding-top:15px;">');
            container.setValue('template', cTemplate);

            var cCss = container.getValue('css') || '';
            cCss = patchOnce(cCss, 'Skills Hub Navigation UX A11y 80', [
                '',
                '/* Skills Hub Navigation UX A11y 80 */',
                '.skills-hub-container .nav-tabs > li > a { font-weight:700; color:#334155; }',
                '.skills-hub-container .nav-tabs > li.active > a, .skills-hub-container .nav-tabs > li.active > a:focus, .skills-hub-container .nav-tabs > li.active > a:hover { color:#003b5c; border-top:3px solid #0078bf; }',
                '.skills-hub-container .nav-tabs > li > a:focus { outline:2px solid #005fcc; outline-offset:2px; }',
                '.skills-hub-tab-panel { padding-top:12px !important; }'
            ].join('\n'));
            container.setValue('css', cCss);
            container.update();
            gs.info('[Skills Hub] Container navigation labels and focus styles polished');
        } else {
            gs.warn('[Skills Hub] Container widget not found; library polish completed without nav polish');
        }

        gs.info('[Skills Hub] ===== COMPLETED 80_skill_library_ux_accessibility_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 80_skill_library_ux_accessibility_polish failed: ' + e.message);
    }
})();
