/**
 * Fix Script: 39_stabilize_my_profile.js
 * Purpose: Stabilize My Profile UX after feedback review.
 *
 * Fixes:
 *   - Gamification stats/tier refresh after skill edits without page reload.
 *   - Blank skill records are skipped before rendering/grouping.
 *   - Endorsement counts are clickable and show endorser details.
 *   - Manager disputes have an employee response path.
 *   - Stale manager validations show an indicator after 365 days.
 *   - Compact mode for large skill portfolios.
 *   - Avatar content fills the circular frame.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 39_stabilize_my_profile =====');

        function ensureChoice(tableName, elementName, value, label, sequence) {
            var choice = new GlideRecord('sys_choice');
            choice.addQuery('name', tableName);
            choice.addQuery('element', elementName);
            choice.addQuery('value', value);
            choice.query();
            if (choice.next()) {
                choice.setValue('label', label);
                choice.setValue('sequence', sequence);
                choice.update();
                return;
            }
            choice.initialize();
            choice.setValue('name', tableName);
            choice.setValue('element', elementName);
            choice.setValue('value', value);
            choice.setValue('label', label);
            choice.setValue('sequence', sequence);
            choice.setValue('inactive', false);
            choice.insert();
        }

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        ensureChoice('sys_user_has_skill', 'u_validation_status', 'pending', 'Pending', 100);
        ensureChoice('sys_user_has_skill', 'u_validation_status', 'validated', 'Validated', 200);
        ensureChoice('sys_user_has_skill', 'u_validation_status', 'disputed', 'Disputed', 300);
        ensureChoice('sys_user_has_skill', 'u_validation_status', 'review_requested', 'Review Requested', 400);

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - My Profile');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] My Profile widget not found. Aborting 39.');
            return;
        }

        var widgetId = widget.getUniqueValue();

        // ------------------------------------------------------------------
        // Server script patches
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var server = widget.getValue('script') || '';

        if (server.indexOf('Skills Hub Stabilization 39') < 0) {
            var marker = '  // --- Phase 3: Category-aware Add Skill (injected by script 23) ---';
            var handlers = [
                '  // --- Skills Hub Stabilization 39: profile actions ---',
                '  function sh39LevelToString(levelValue) {',
                '      var levelStrings = ["", "Novice", "Learner", "Proficient", "Advanced", "Expert"];',
                '      return levelStrings[parseInt(levelValue, 10)] || "Novice";',
                '  }',
                '  if (input && input.action == "getEndorsements") {',
                '      data.endorsements = [];',
                '      var targetId = input.skill_id || "";',
                '      var target = new GlideRecord("sys_user_has_skill");',
                '      if (target.get(targetId) && target.getValue("user") == gs.getUserID()) {',
                '          var er = new GlideRecord("u_m2m_skill_endorsement");',
                '          er.addQuery("u_skill_record", targetId);',
                '          er.orderByDesc("sys_created_on");',
                '          er.query();',
                '          while (er.next()) {',
                '              data.endorsements.push({',
                '                  endorser: er.u_endorser.getDisplayValue(),',
                '                  endorser_id: er.getValue("u_endorser"),',
                '                  comments: er.getValue("u_comments") || "",',
                '                  created_on: er.getDisplayValue("sys_created_on")',
                '              });',
                '          }',
                '      }',
                '      return;',
                '  }',
                '  if (input && input.action == "respondToDispute") {',
                '      data.disputeResponse = { success: false };',
                '      var resp = new GlideRecord("sys_user_has_skill");',
                '      if (resp.get(input.skill_id) && resp.getValue("user") == gs.getUserID()) {',
                '          var responseType = input.response_type || "";',
                '          if (responseType == "accept_manager_level") {',
                '              var managerLevel = resp.getValue("u_manager_assessed_level") || "";',
                '              if (managerLevel) resp.setValue("skill_level", managerLevel);',
                '              resp.setValue("u_validation_status", "validated");',
                '              resp.setValue("u_last_manager_validation", new GlideDateTime());',
                '              resp.setValue("u_validation_notes", (resp.getValue("u_validation_notes") || "") + "\\nEmployee accepted manager assessment on " + gs.nowDateTime());',
                '          } else {',
                '              resp.setValue("u_validation_status", "review_requested");',
                '              resp.setValue("u_validation_notes", (resp.getValue("u_validation_notes") || "") + "\\nEmployee response: " + (input.notes || "Review requested"));',
                '          }',
                '          resp.update();',
                '          data.disputeResponse.success = true;',
                '      }',
                '      // fall through so the widget returns refreshed data',
                '  }',
                ''
            ].join('\n');
            if (server.indexOf(marker) > -1) {
                server = server.replace(marker, handlers + marker);
            } else {
                server = server.replace('(function() {', '(function() {\n' + handlers);
            }
        }

        server = replaceAll(server,
            'var levelStrings = ["", "Novice", "Intermediate", "Proficient", "Advanced", "Expert"];',
            'var levelStrings = ["", "Novice", "Learner", "Proficient", "Advanced", "Expert"];');

        if (server.indexOf('if (!skillName) continue;') < 0) {
            server = server.replace(
                '    var skillName = s.skill.name.toString();',
                '    var skillName = s.skill.name.toString();\n    if (!skillName) continue;');
        }

        if (server.indexOf('stale_assessment: staleAssessment') < 0) {
            server = server.replace(
                '    var valStatus = s.u_validation_status.toString();\n    if (valStatus == "validated") data.stats.total_validated_skills++;',
                [
                    '    var valStatus = s.u_validation_status.toString();',
                    '    if (valStatus == "validated") data.stats.total_validated_skills++;',
                    '    var staleAssessment = false;',
                    '    var lastValidation = s.getValue("u_last_manager_validation") || "";',
                    '    if (lastValidation) {',
                    '        var cutoff = new GlideDateTime();',
                    '        cutoff.addDaysLocalTime(-365);',
                    '        var lastGdt = new GlideDateTime(lastValidation);',
                    '        staleAssessment = lastGdt.compareTo(cutoff) < 0;',
                    '    }'
                ].join('\n'));

            server = server.replace(
                '      endorsements: endorsements,\n      validation_status: valStatus',
                [
                    '      endorsements: endorsements,',
                    '      validation_status: valStatus,',
                    '      validation_notes: s.getValue("u_validation_notes") || "",',
                    '      manager_assessed_level: s.getValue("u_manager_assessed_level") || "",',
                    '      last_manager_validation: s.getDisplayValue("u_last_manager_validation"),',
                    '      stale_assessment: staleAssessment'
                ].join('\n'));
        }

        var oldTierLoop = [
            '  for (var i = 0; i < data.skills.length; i++) {',
            '     totalPoints += (profBonusMap[data.skills[i].level_value] || 2);',
            '  }'
        ].join('\n');
        var newTierLoop = [
            '  for (var i = 0; i < data.skills.length; i++) {',
            '     var groupedEntries = data.skills[i].entries || [];',
            '     for (var gi = 0; gi < groupedEntries.length; gi++) {',
            '        totalPoints += (profBonusMap[groupedEntries[gi].level_value] || 2);',
            '     }',
            '  }'
        ].join('\n');
        if (server.indexOf(oldTierLoop) > -1) {
            server = server.replace(oldTierLoop, newTierLoop);
        }

        widget.setValue('script', server);
        widget.update();
        gs.info('[Skills Hub] My Profile server patched');

        // ------------------------------------------------------------------
        // Client script patches
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var client = widget.getValue('client_script') || '';

        if (client.indexOf('Skills Hub Stabilization 39') < 0) {
            client = client.replace('  var c = this;', [
                '  var c = this;',
                '',
                '  // Skills Hub Stabilization 39',
                '  c.compactMode = false;',
                '  c.applyServerData = function(serverData) {',
                '    if (!serverData) return;',
                '    if (serverData.skills) c.data.skills = serverData.skills;',
                '    if (serverData.stats) c.data.stats = serverData.stats;',
                '    if (serverData.tier) c.data.tier = serverData.tier;',
                '  };',
                '  c.toggleCompactMode = function() { c.compactMode = !c.compactMode; };',
                '  c.viewEndorsements = function(entry) {',
                '    if (!entry || !entry.sys_id) return;',
                '    c.server.get({ action: "getEndorsements", skill_id: entry.sys_id }).then(function(r) {',
                '      var endorsements = r.data.endorsements || [];',
                '      $uibModal.open({',
                '        template: \'<div class="modal-header"><h4 class="modal-title">Endorsements</h4></div><div class="modal-body"><div ng-if="items.length == 0" class="text-muted">No endorsements yet.</div><div class="endorsement-view-row" ng-repeat="item in items"><strong>{{item.endorser}}</strong><div class="small text-muted">{{item.created_on}}</div><div ng-if="item.comments">{{item.comments}}</div></div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',',
                '        controller: function($scope) { $scope.items = endorsements; }',
                '      });',
                '    });',
                '  };',
                '  c.acceptManagerLevel = function(entry) {',
                '    c.server.get({ action: "respondToDispute", skill_id: entry.sys_id, response_type: "accept_manager_level" }).then(function(r) {',
                '      c.applyServerData(r.data);',
                '      spUtil.addInfoMessage("Manager assessment accepted.");',
                '    });',
                '  };',
                '  c.requestDisputeReview = function(entry) {',
                '    var notes = prompt("What should your manager review?");',
                '    if (notes === null) return;',
                '    c.server.get({ action: "respondToDispute", skill_id: entry.sys_id, response_type: "request_review", notes: notes }).then(function(r) {',
                '      c.applyServerData(r.data);',
                '      spUtil.addInfoMessage("Review request sent.");',
                '    });',
                '  };'
            ].join('\n'));
        }

        client = replaceAll(client, 'c.data.stats = r.data.stats;', 'c.applyServerData(r.data);');
        client = replaceAll(client, 'parentCtrl.data.skills = r.data.skills;\n                      parentCtrl.data.stats = r.data.stats;', 'parentCtrl.applyServerData(r.data);');
        client = client.replace(
            '     c.server.get({\n        action: "update_interest",\n        skill_id: skill.sys_id,\n        interest: newInterest\n     });',
            '     c.server.get({\n        action: "update_interest",\n        skill_id: skill.sys_id,\n        interest: newInterest\n     }).then(function(r) {\n        c.applyServerData(r.data);\n     });');

        widget.setValue('client_script', client);
        widget.update();
        gs.info('[Skills Hub] My Profile client patched');

        // ------------------------------------------------------------------
        // Template patches
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var template = widget.getValue('template') || '';

        if (template.indexOf('c.toggleCompactMode') < 0) {
            template = template.replace(
                '<button class="btn-add" ng-click="c.openAddModal()">\n           <i class="fa fa-plus"></i> Add Skill\n        </button>',
                '<div class="profile-actions">\n           <button class="btn-compact" ng-click="c.toggleCompactMode()" uib-tooltip="Toggle compact view">\n              <i class="fa" ng-class="{\'fa-compress\': !c.compactMode, \'fa-expand\': c.compactMode}"></i>\n           </button>\n           <button class="btn-add" ng-click="c.openAddModal()">\n              <i class="fa fa-plus"></i> Add Skill\n           </button>\n        </div>');
            template = template.replace(
                '<div class="row-grid" ng-if="data.skills.length > 0">',
                '<div class="row-grid" ng-class="{\'compact-skills\': c.compactMode}" ng-if="data.skills.length > 0">');
        }

        template = replaceAll(template,
            '<div class="endorsement-pill" ng-class="{\'active\': skill.entries[0].endorsements > 0}">',
            '<div class="endorsement-pill" ng-class="{\'active\': skill.entries[0].endorsements > 0}" ng-click="c.viewEndorsements(skill.entries[0])" uib-tooltip="View endorsements">');
        template = replaceAll(template,
            '<div class="endorsement-pill" ng-class="{\'active\': entry.endorsements > 0}" style="font-size:11px;">',
            '<div class="endorsement-pill" ng-class="{\'active\': entry.endorsements > 0}" style="font-size:11px;" ng-click="c.viewEndorsements(entry)" uib-tooltip="View endorsements">');

        if (template.indexOf('stale_assessment') < 0) {
            template = replaceAll(template,
                '<div class="validation-icon" ng-if="skill.entries[0].validation_status == \'disputed\'"\n                            style="color:#dc2626; font-size:12px;" uib-tooltip="Disputed">\n                          <i class="fa fa-exclamation-triangle"></i>\n                       </div>',
                '<div class="validation-icon" ng-if="skill.entries[0].validation_status == \'disputed\'"\n                            style="color:#dc2626; font-size:12px;" uib-tooltip="Disputed">\n                          <i class="fa fa-exclamation-triangle"></i>\n                       </div>\n                       <div class="validation-icon" ng-if="skill.entries[0].stale_assessment"\n                            style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                          <i class="fa fa-clock-o"></i>\n                       </div>');
            template = replaceAll(template,
                '<div class="validation-icon" ng-if="entry.validation_status == \'disputed\'"\n                              style="color:#dc2626; font-size:12px;" uib-tooltip="Disputed">\n                            <i class="fa fa-exclamation-triangle"></i>\n                         </div>',
                '<div class="validation-icon" ng-if="entry.validation_status == \'disputed\'"\n                              style="color:#dc2626; font-size:12px;" uib-tooltip="Disputed">\n                            <i class="fa fa-exclamation-triangle"></i>\n                         </div>\n                         <div class="validation-icon" ng-if="entry.stale_assessment"\n                              style="color:#f08122; font-size:12px;" uib-tooltip="Assessment older than one year">\n                            <i class="fa fa-clock-o"></i>\n                         </div>');
        }

        if (template.indexOf('dispute-response-panel') < 0) {
            template = template.replace(
                '                 </div>\n              </div>\n\n              <div ng-if="skill.entries.length > 1">',
                '                 </div>\n                 <div class="dispute-response-panel" ng-if="skill.entries[0].validation_status == \'disputed\' || skill.entries[0].validation_status == \'review_requested\'">\n                    <div class="small"><strong>{{skill.entries[0].validation_status == "review_requested" ? "Review requested" : "Manager dispute"}}</strong></div>\n                    <div class="small text-muted" ng-if="skill.entries[0].manager_assessed_level">Manager assessed: {{skill.entries[0].manager_assessed_level}}</div>\n                    <div class="small dispute-notes" ng-if="skill.entries[0].validation_notes">{{skill.entries[0].validation_notes}}</div>\n                    <div class="dispute-actions" ng-if="skill.entries[0].validation_status == \'disputed\'">\n                       <button class="btn btn-xs btn-default" ng-click="c.acceptManagerLevel(skill.entries[0])">Accept manager level</button>\n                       <button class="btn btn-xs btn-link" ng-click="c.requestDisputeReview(skill.entries[0])">Request review</button>\n                    </div>\n                 </div>\n              </div>\n\n              <div ng-if="skill.entries.length > 1">');

            template = template.replace(
                '                   </div>\n                </div>\n              </div>',
                '                   </div>\n                   <div class="dispute-response-panel compact" ng-if="entry.validation_status == \'disputed\' || entry.validation_status == \'review_requested\'">\n                      <div class="small"><strong>{{entry.validation_status == "review_requested" ? "Review requested" : "Manager dispute"}}</strong></div>\n                      <div class="small text-muted" ng-if="entry.manager_assessed_level">Manager assessed: {{entry.manager_assessed_level}}</div>\n                      <div class="small dispute-notes" ng-if="entry.validation_notes">{{entry.validation_notes}}</div>\n                      <div class="dispute-actions" ng-if="entry.validation_status == \'disputed\'">\n                         <button class="btn btn-xs btn-default" ng-click="c.acceptManagerLevel(entry)">Accept manager level</button>\n                         <button class="btn btn-xs btn-link" ng-click="c.requestDisputeReview(entry)">Request review</button>\n                      </div>\n                   </div>\n                </div>\n              </div>');
        }

        widget.setValue('template', template);
        widget.update();
        gs.info('[Skills Hub] My Profile template patched');

        // ------------------------------------------------------------------
        // CSS patches
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Stabilization 39') < 0) {
            css += [
                '',
                '/* Skills Hub Stabilization 39 */',
                '.profile-actions { display:flex; align-items:center; gap:8px; }',
                '.btn-compact { width:34px; height:34px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#4b4b45; display:inline-flex; align-items:center; justify-content:center; }',
                '.btn-compact:hover { border-color:#0078bf; color:#0078bf; }',
                '.profile-avatar sn-avatar, .profile-avatar .sn-avatar, .profile-avatar img { width:100% !important; height:100% !important; min-width:100% !important; min-height:100% !important; border-radius:50%; display:block; }',
                '.profile-avatar .avatar-large { width:100% !important; height:100% !important; font-size:32px !important; line-height:82px !important; }',
                '.endorsement-pill { cursor:pointer; padding:2px 6px; border-radius:10px; }',
                '.endorsement-pill:hover { background:#e8f4fb; color:#0078bf; }',
                '.endorsement-view-row { padding:10px 0; border-bottom:1px solid #e2e8f0; }',
                '.endorsement-view-row:last-child { border-bottom:none; }',
                '.dispute-response-panel { margin-top:10px; padding:10px; border:1px solid #fed7aa; background:#fff7ed; border-radius:8px; color:#4b4b45; }',
                '.dispute-response-panel.compact { margin-top:8px; }',
                '.dispute-notes { white-space:pre-line; margin-top:4px; }',
                '.dispute-actions { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }',
                '.compact-skills .col-grid { margin-bottom:10px; }',
                '.compact-skills .skill-card { padding:12px; }',
                '.compact-skills .skill-name { font-size:14px; }',
                '.compact-skills .skill-type { font-size:9px; }',
                '.compact-skills .prof-legend, .compact-skills .prof-info-panel { display:none; }',
                '.compact-skills .card-footer-row { padding-top:8px; }',
                '.compact-skills .interactive-bar-bg { height:6px; }'
            ].join('\n');
        }
        widget.setValue('css', css);
        widget.update();
        gs.info('[Skills Hub] My Profile CSS patched');

        gs.info('[Skills Hub] ===== COMPLETED 39_stabilize_my_profile =====');
    } catch (e) {
        gs.error('[Skills Hub] 39_stabilize_my_profile failed: ' + e.message);
    }
})();
