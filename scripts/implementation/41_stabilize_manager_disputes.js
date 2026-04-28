/**
 * Fix Script: 41_stabilize_manager_disputes.js
 * Purpose: Close the manager dispute loop.
 *
 * Fixes:
 *   - Manager Matrix treats review_requested as a first-class status.
 *   - Manager Matrix data includes skill record sys_id, notes, assessed level,
 *     and last validation display value.
 *   - Validate/dispute actions prefer sys_user_has_skill sys_id to avoid
 *     duplicate skill-name ambiguity.
 *   - Review-requested skills can be validated or disputed again.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 41_stabilize_manager_disputes =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        // ------------------------------------------------------------------
        // Patch SkillsHubUtils.getManagerMatrix
        // ------------------------------------------------------------------
        var si = new GlideRecord('sys_script_include');
        si.addQuery('name', 'SkillsHubUtils');
        si.setLimit(1);
        si.query();
        if (si.next()) {
            var utilScript = si.getValue('script') || '';
            if (utilScript.indexOf('Skills Hub Stabilization 41') < 0) {
                utilScript = utilScript.replace(
                    '        var managerId = this.getParameter(\'sysparm_manager_id\') || gs.getUserID();',
                    '        // Skills Hub Stabilization 41\n        var managerId = this.getParameter(\'sysparm_manager_id\') || gs.getUserID();');
            }
            if (utilScript.indexOf('sys_id: sgr.getUniqueValue()') < 0) {
                utilScript = utilScript.replace(
                    '                data[uid].skills[skillName] = {\n                   level: sgr.skill_level.getDisplayValue() || sgr.skill_level.toString(),\n                   interest: sgr.u_interest_level.toString(),\n                   validated: isValid,\n                   status: sgr.u_validation_status.toString() || (isValid ? "validated" : "pending")\n                };',
                    [
                        '                var status = sgr.u_validation_status.toString() || (isValid ? "validated" : "pending");',
                        '                data[uid].skills[skillName] = {',
                        '                   sys_id: sgr.getUniqueValue(),',
                        '                   level: sgr.skill_level.getDisplayValue() || sgr.skill_level.toString(),',
                        '                   interest: sgr.u_interest_level.toString(),',
                        '                   validated: status == "validated",',
                        '                   status: status,',
                        '                   validation_notes: sgr.getValue("u_validation_notes") || "",',
                        '                   manager_assessed_level: sgr.getValue("u_manager_assessed_level") || "",',
                        '                   last_manager_validation: sgr.getDisplayValue("u_last_manager_validation")',
                        '                };'
                    ].join('\n'));
                si.setValue('script', utilScript);
                si.update();
                gs.info('[Skills Hub] SkillsHubUtils manager matrix data patched');
            } else {
                gs.info('[Skills Hub] SkillsHubUtils already contains manager matrix stabilization markers');
            }
        } else {
            gs.warn('[Skills Hub] SkillsHubUtils not found; continuing with widget patches');
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] Manager Matrix widget not found. Aborting 41.');
            return;
        }
        var widgetId = widget.getUniqueValue();

        // ------------------------------------------------------------------
        // Server script: prefer skillRecordId.
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var server = widget.getValue('script') || '';

        if (server.indexOf('Skills Hub Stabilization 41') < 0) {
            server = server.replace('(function() {', [
                '(function() {',
                '  // Skills Hub Stabilization 41',
                '  function sh41GetManagedSkill(skillRecordId, userId, skillName) {',
                '     var gr = new GlideRecord("sys_user_has_skill");',
                '     if (skillRecordId && gr.get(skillRecordId)) return gr;',
                '     gr = new GlideRecord("sys_user_has_skill");',
                '     gr.addQuery("user", userId);',
                '     gr.addQuery("skill.name", skillName);',
                '     gr.setLimit(1);',
                '     gr.query();',
                '     return gr.next() ? gr : null;',
                '  }',
                '  function sh41IsManager(userId, managerId) {',
                '     var userGR = new GlideRecord("sys_user");',
                '     return userGR.get(userId) && userGR.manager.toString() == managerId;',
                '  }'
            ].join('\n'));
        }

        server = server.replace(
            '        var gr = new GlideRecord("sys_user_has_skill");\n        gr.addQuery("user", input.userId);\n        gr.addQuery("skill.name", input.skillName);\n        gr.query();\n        if (gr.next()) {\n           var userGR = new GlideRecord("sys_user");\n           if (userGR.get(gr.user) && userGR.manager == mgr) {',
            '        var gr = sh41GetManagedSkill(input.skillRecordId, input.userId, input.skillName);\n        if (gr) {\n           if (sh41IsManager(gr.getValue("user"), mgr)) {');

        server = server.replace(
            '        var gr = new GlideRecord("sys_user_has_skill");\n        gr.addQuery("user", input.userId);\n        gr.addQuery("skill.name", input.skillName);\n        gr.query();\n        if (gr.next()) {\n           var userGR = new GlideRecord("sys_user");\n           if (userGR.get(gr.user) && userGR.manager == mgr) {',
            '        var gr = sh41GetManagedSkill(input.skillRecordId, input.userId, input.skillName);\n        if (gr) {\n           if (sh41IsManager(gr.getValue("user"), mgr)) {');

        widget.setValue('script', server);
        widget.update();
        gs.info('[Skills Hub] Manager Matrix server patched');

        // ------------------------------------------------------------------
        // Client script
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var client = widget.getValue('client_script') || '';

        if (client.indexOf('review_requested') < 0) {
            client = client.replace(
                '          var disputed = 0;',
                '          var disputed = 0;\n          var review = 0;');
            client = client.replace(
                '                else if(sk.status == "disputed") disputed++;\n                else pending++;',
                '                else if(sk.status == "disputed") disputed++;\n                else if(sk.status == "review_requested") review++;\n                else pending++;');
            client = client.replace(
                '          c.stats.disputed = disputed;',
                '          c.stats.disputed = disputed;\n          c.stats.review = review;');
            client = client.replace(
                '  c.stats = { reports: 0, pending: 0, validated: 0, disputed: 0 };',
                '  c.stats = { reports: 0, pending: 0, validated: 0, disputed: 0, review: 0 };');
        }

        client = replaceAll(client,
            'c.server.get({ action: "validate", userId: userId, skillName: skillName })',
            'c.server.get({ action: "validate", userId: userId, skillName: skillName, skillRecordId: details.sys_id })');
        client = replaceAll(client,
            '        action: "dispute",\n        userId: t.userId,\n        skillName: t.skillName,',
            '        action: "dispute",\n        userId: t.userId,\n        skillName: t.skillName,\n        skillRecordId: t.details.sys_id,');

        client = replaceAll(client,
            '     if(details.validated) return;',
            '     if(details.validated) return;');
        client = replaceAll(client,
            '              details.validated = true;\n              details.status = "validated";\n              c.stats.pending--;\n              c.stats.validated++;',
            '              if (details.status == "disputed" && c.stats.disputed > 0) c.stats.disputed--;\n              else if (details.status == "review_requested" && c.stats.review > 0) c.stats.review--;\n              else if (c.stats.pending > 0) c.stats.pending--;\n              details.validated = true;\n              details.status = "validated";\n              c.stats.validated++;');
        client = replaceAll(client,
            '           if (c.stats.pending > 0) c.stats.pending--;\n           c.stats.disputed++;',
            '           if (t.details.status == "review_requested" && c.stats.review > 0) c.stats.review--;\n           else if (c.stats.pending > 0) c.stats.pending--;\n           c.stats.disputed++;');
        client = replaceAll(client,
            '     if (c.statusFilter == "disputed") return details.status == "disputed";\n     if (c.statusFilter == "pending") return !details.validated && details.status != "disputed";',
            '     if (c.statusFilter == "disputed") return details.status == "disputed";\n     if (c.statusFilter == "review_requested") return details.status == "review_requested";\n     if (c.statusFilter == "pending") return !details.validated && details.status != "disputed" && details.status != "review_requested";');

        widget.setValue('client_script', client);
        widget.update();
        gs.info('[Skills Hub] Manager Matrix client patched');

        // ------------------------------------------------------------------
        // Template
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var template = widget.getValue('template') || '';

        if (template.indexOf('review_requested') < 0) {
            template = template.replace(
                '        <div class="stat-card" ng-click="c.statusFilter = \'disputed\'" ng-class="{\'stat-active\': c.statusFilter == \'disputed\'}" style="cursor:pointer;">\n           <span class="stat-val text-red">{{c.stats.disputed}}</span>\n           <span class="stat-label">Disputed</span>\n        </div>',
                '        <div class="stat-card" ng-click="c.statusFilter = \'disputed\'" ng-class="{\'stat-active\': c.statusFilter == \'disputed\'}" style="cursor:pointer;">\n           <span class="stat-val text-red">{{c.stats.disputed}}</span>\n           <span class="stat-label">Disputed</span>\n        </div>\n        <div class="stat-card" ng-click="c.statusFilter = \'review_requested\'" ng-class="{\'stat-active\': c.statusFilter == \'review_requested\'}" style="cursor:pointer;">\n           <span class="stat-val text-blue">{{c.stats.review}}</span>\n           <span class="stat-label">Review</span>\n        </div>');
            template = template.replace(
                'ng-class="{\'status-validated\': details.validated, \'status-pending\': !details.validated && details.status != \'disputed\', \'status-disputed\': details.status == \'disputed\'}"',
                'ng-class="{\'status-validated\': details.validated, \'status-pending\': !details.validated && details.status != \'disputed\' && details.status != \'review_requested\', \'status-disputed\': details.status == \'disputed\', \'status-review\': details.status == \'review_requested\'}"');
            template = template.replace(
                '<i class="fa fa-exclamation-triangle text-disputed" ng-if="details.status == \'disputed\'"></i>',
                '<i class="fa fa-exclamation-triangle text-disputed" ng-if="details.status == \'disputed\'"></i>\n                          <i class="fa fa-reply text-review" ng-if="details.status == \'review_requested\'" uib-tooltip="Employee requested review"></i>');
            template = template.replace(
                '<span class="sp-actions" ng-if="!details.validated && details.status != \'disputed\'">',
                '<span class="sp-actions" ng-if="!details.validated">');
            template = template.replace(
                '                          </span>\n                       </div>',
                '                          </span>\n                          <div class="manager-notes" ng-if="details.validation_notes || details.manager_assessed_level">\n                             <span ng-if="details.manager_assessed_level">Manager level: {{details.manager_assessed_level}}</span>\n                             <span ng-if="details.validation_notes">{{details.validation_notes}}</span>\n                          </div>\n                       </div>');
        }

        widget.setValue('template', template);
        widget.update();
        gs.info('[Skills Hub] Manager Matrix template patched');

        // ------------------------------------------------------------------
        // CSS
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Stabilization 41') < 0) {
            css += [
                '',
                '/* Skills Hub Stabilization 41 */',
                '.text-blue { color:#0078bf; }',
                '.status-review { background:#e8f4fb; border-color:#a3d4ef; }',
                '.text-review { color:#0078bf; margin-left:4px; }',
                '.manager-notes { display:flex; flex-direction:column; gap:2px; margin-top:5px; padding:6px 8px; border-radius:6px; background:#fff7ed; color:#4b4b45; font-size:11px; white-space:pre-line; }'
            ].join('\n');
        }
        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 41_stabilize_manager_disputes =====');
    } catch (e) {
        gs.error('[Skills Hub] 41_stabilize_manager_disputes failed: ' + e.message);
    }
})();
