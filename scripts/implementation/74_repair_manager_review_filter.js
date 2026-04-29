/**
 * Fix Script: 74_repair_manager_review_filter.js
 * Purpose: Repair Team Matrix Review status filtering.
 *
 * Issue:
 *   Review stat could display 0 but leave disputed rows visible. Centralize
 *   status filtering so the Review button maps only to review_requested rows.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 74_repair_manager_review_filter =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 74');
            return;
        }

        var client = widget.getValue('client_script') || '';
        var template = widget.getValue('template') || '';

        if (client.indexOf('Skills Hub Manager Review Filter Repair 74') < 0) {
            var repairBlock = [
                '',
                '  // Skills Hub Manager Review Filter Repair 74',
                '  c.setStatusFilter = function(status) {',
                '     c.statusFilter = status || "all";',
                '  };',
                '  c.showSkill = function(details) {',
                '     if (!details) return c.statusFilter == "all";',
                '     var status = details.status || (details.validated ? "validated" : "pending");',
                '     if (c.statusFilter == "all") return true;',
                '     if (c.statusFilter == "validated") return status == "validated" || details.validated;',
                '     if (c.statusFilter == "disputed") return status == "disputed";',
                '     if (c.statusFilter == "review_requested") return status == "review_requested";',
                '     if (c.statusFilter == "pending") return !details.validated && status != "validated" && status != "disputed" && status != "review_requested";',
                '     return true;',
                '  };',
                '  c.userHasVisibleSkills = function(user) {',
                '     if (!user || !user.skills) return c.statusFilter == "all";',
                '     var hasAny = false;',
                '     for (var skillName in user.skills) {',
                '        if (!user.skills.hasOwnProperty(skillName)) continue;',
                '        hasAny = true;',
                '        if (c.showSkill(user.skills[skillName])) return true;',
                '     }',
                '     return !hasAny && c.statusFilter == "all";',
                '  };',
                ''
            ].join('\n');

            var lastBrace = client.lastIndexOf('}');
            if (lastBrace > -1) {
                client = client.substring(0, lastBrace) + repairBlock + client.substring(lastBrace);
            } else {
                client += repairBlock;
            }
        }

        template = replaceAll(template, "ng-click=\"c.statusFilter = 'all'\"", "ng-click=\"c.setStatusFilter('all')\"");
        template = replaceAll(template, "ng-click=\"c.statusFilter = 'pending'\"", "ng-click=\"c.setStatusFilter('pending')\"");
        template = replaceAll(template, "ng-click=\"c.statusFilter = 'validated'\"", "ng-click=\"c.setStatusFilter('validated')\"");
        template = replaceAll(template, "ng-click=\"c.statusFilter = 'disputed'\"", "ng-click=\"c.setStatusFilter('disputed')\"");
        template = replaceAll(template, "ng-click=\"c.statusFilter = 'review_requested'\"", "ng-click=\"c.setStatusFilter('review_requested')\"");

        // Repair any copied Review stat button that accidentally points at the
        // disputed filter.
        template = template.replace(
            /ng-click="c\.setStatusFilter\('disputed'\)"([^>]*>\s*[\s\S]{0,120}?Review)/,
            'ng-click="c.setStatusFilter(\'review_requested\')" $1'
        );
        template = template.replace(
            /ng-click="c\.statusFilter = 'disputed'"([^>]*>\s*[\s\S]{0,120}?Review)/,
            'ng-click="c.setStatusFilter(\'review_requested\')" $1'
        );

        widget.setValue('client_script', client);
        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] Manager Review filter repaired');
        gs.info('[Skills Hub] ===== COMPLETED 74_repair_manager_review_filter =====');
    } catch (e) {
        gs.error('[Skills Hub] 74_repair_manager_review_filter failed: ' + e.message);
    }
})();
