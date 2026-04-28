/**
 * Fix Script: 56_endorsement_visibility_stale_indicators.js
 * Purpose: Add endorsement drill-in outside My Profile and surface stale assessments.
 *
 * Fixes:
 *   - Find Expert endorsement counts open a modal listing endorsers for that user's skill.
 *   - Find Expert result entries include stale assessment metadata and a quiet stale badge.
 *   - Manager Matrix skill pills show a stale/expired assessment indicator.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 56_endorsement_visibility_stale_indicators =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        function getWidget(name) {
            var widget = new GlideRecord('sp_widget');
            widget.addQuery('name', name);
            widget.setLimit(1);
            widget.query();
            return widget.next() ? widget : null;
        }

        // ------------------------------------------------------------------
        // Find Expert: server data and endorsement drill-in action
        // ------------------------------------------------------------------
        var find = getWidget('Skills Hub - Find Expert');
        if (find) {
            var findServer = find.getValue('script') || '';
            var findClient = find.getValue('client_script') || '';
            var findTemplate = find.getValue('template') || '';
            var findCss = find.getValue('css') || '';

            if (findServer.indexOf('Skills Hub Endorsement Visibility 56') < 0) {
                findServer = findServer.replace('(function() {', [
                    '(function() {',
                    '  // Skills Hub Endorsement Visibility 56',
                    '  function sh56IsStaleAssessment(skillRecord) {',
                    '      var status = skillRecord.getValue("u_validation_status") || "";',
                    '      if (status == "expired") return true;',
                    '      var lastValidation = skillRecord.getValue("u_last_manager_validation") || "";',
                    '      if (!lastValidation) return false;',
                    '      var cutoff = new GlideDateTime();',
                    '      cutoff.addDaysLocalTime(-365);',
                    '      var lastGdt = new GlideDateTime(lastValidation);',
                    '      return lastGdt.compareTo(cutoff) < 0;',
                    '  }',
                    '  if (input && input.action == "getEndorsements") {',
                    '      data.endorsementDetails = [];',
                    '      var targetSkillRecordId = input.skill_record_id || "";',
                    '      var targetSkillRecord = new GlideRecord("sys_user_has_skill");',
                    '      if (targetSkillRecord.get(targetSkillRecordId)) {',
                    '          var endorsementRecord = new GlideRecord("u_m2m_skill_endorsement");',
                    '          endorsementRecord.addQuery("u_skill_record", targetSkillRecordId);',
                    '          endorsementRecord.orderByDesc("sys_created_on");',
                    '          endorsementRecord.query();',
                    '          while (endorsementRecord.next()) {',
                    '              var endorserUser = endorsementRecord.u_endorser.getRefRecord();',
                    '              data.endorsementDetails.push({',
                    '                  endorser: endorsementRecord.u_endorser.getDisplayValue(),',
                    '                  endorser_id: endorsementRecord.getValue("u_endorser"),',
                    '                  role: endorserUser.isValidRecord() ? (endorserUser.getValue("title") || "") : "",',
                    '                  department: endorserUser.isValidRecord() ? endorserUser.getDisplayValue("department") : ""',
                    '              });',
                    '          }',
                    '          data.endorsementTarget = {',
                    '              skill: targetSkillRecord.skill.getDisplayValue(),',
                    '              user: targetSkillRecord.user.getDisplayValue()',
                    '          };',
                    '      }',
                    '      return;',
                    '  }'
                ].join('\n'));
            }

            if (findServer.indexOf('var staleAssessment = sh56IsStaleAssessment(gr);') < 0) {
                findServer = findServer.replace(
                    '              var entryId = gr.getUniqueValue();',
                    '              var entryId = gr.getUniqueValue();\n              var staleAssessment = sh56IsStaleAssessment(gr);'
                );
            }

            if (findServer.indexOf('stale_assessment: staleAssessment') < 0) {
                findServer = replaceAll(
                    findServer,
                    '                  endorsed_by_me: endorsedByMe.hasNext()',
                    [
                        '                  endorsed_by_me: endorsedByMe.hasNext(),',
                        '                  validation_status: gr.getValue("u_validation_status") || "",',
                        '                  last_manager_validation: gr.getDisplayValue("u_last_manager_validation"),',
                        '                  stale_assessment: staleAssessment'
                    ].join('\n')
                );
            }

            find.setValue('script', findServer);
            find.update();
            gs.info('[Skills Hub] Find Expert server patched for endorsement details and stale flags');

            find = getWidget('Skills Hub - Find Expert');
            findClient = find.getValue('client_script') || '';
            if (findClient.indexOf('Skills Hub Endorsement Visibility 56') < 0) {
                findClient = findClient.replace('function($scope, spUtil)', 'function($scope, spUtil, $uibModal)');
                findClient = findClient.replace('  var c = this;', [
                    '  var c = this;',
                    '',
                    '  // Skills Hub Endorsement Visibility 56',
                    '  c.viewEndorsements = function(entry, expert, skillName) {',
                    '     if (!entry || !entry.skill_record_id) return;',
                    '     c.server.get({ action: "getEndorsements", skill_record_id: entry.skill_record_id }).then(function(r) {',
                    '        var details = r.data.endorsementDetails || [];',
                    '        var target = r.data.endorsementTarget || { skill: skillName || "Skill", user: (expert && expert.name) || "Employee" };',
                    '        $uibModal.open({',
                    '           template: \'<div class="modal-header"><h4 class="modal-title">Endorsements</h4><div class="small text-muted">{{target.skill}} for {{target.user}}</div></div><div class="modal-body endorsement-modal-body"><div ng-if="items.length == 0" class="text-muted">No endorsements yet.</div><div class="endorsement-view-row simple" ng-repeat="item in items"><strong>{{item.endorser}}</strong><div class="small text-muted"><span ng-if="item.role">{{item.role}}</span><span ng-if="item.role && item.department"> - </span><span ng-if="item.department">{{item.department}}</span></div></div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',',
                    '           controller: function($scope) { $scope.items = details; $scope.target = target; }',
                    '        });',
                    '     });',
                    '  };'
                ].join('\n'));
            }

            find.setValue('client_script', findClient);
            find.update();
            gs.info('[Skills Hub] Find Expert client patched for endorsement details modal');

            find = getWidget('Skills Hub - Find Expert');
            findTemplate = find.getValue('template') || '';
            findTemplate = replaceAll(
                findTemplate,
                '<span class="endorsement-pill-sm" ng-if="ent.endorsements > 0">',
                '<span class="endorsement-pill-sm endorsement-clickable" ng-if="ent.endorsements > 0" ng-click="c.viewEndorsements(ent, expert, sg.name)" uib-tooltip="View endorsements">'
            );
            findTemplate = replaceAll(
                findTemplate,
                '<span class="endorsement-pill-sm" ng-if="sg.entries[0].endorsements > 0">',
                '<span class="endorsement-pill-sm endorsement-clickable" ng-if="sg.entries[0].endorsements > 0" ng-click="c.viewEndorsements(sg.entries[0], expert, sg.name)" uib-tooltip="View endorsements">'
            );
            if (findTemplate.indexOf('stale-skill-badge') < 0) {
                findTemplate = findTemplate.replace(
                    '<span class="endorsement-pill-sm endorsement-clickable" ng-if="ent.endorsements > 0"',
                    '<span class="stale-skill-badge" ng-if="ent.stale_assessment" uib-tooltip="Assessment older than one year"><i class="fa fa-clock-o"></i></span>\n                  <span class="endorsement-pill-sm endorsement-clickable" ng-if="ent.endorsements > 0"'
                );
                findTemplate = findTemplate.replace(
                    '<span class="endorsement-pill-sm endorsement-clickable" ng-if="sg.entries[0].endorsements > 0"',
                    '<span class="stale-skill-badge" ng-if="sg.entries[0].stale_assessment" uib-tooltip="Assessment older than one year"><i class="fa fa-clock-o"></i></span>\n                  <span class="endorsement-pill-sm endorsement-clickable" ng-if="sg.entries[0].endorsements > 0"'
                );
            }

            find.setValue('template', findTemplate);
            find.update();
            gs.info('[Skills Hub] Find Expert template patched for endorsement details and stale badges');

            find = getWidget('Skills Hub - Find Expert');
            findCss = find.getValue('css') || '';
            if (findCss.indexOf('Skills Hub Endorsement Visibility 56') < 0) {
                findCss += [
                    '',
                    '/* Skills Hub Endorsement Visibility 56 */',
                    '.endorsement-clickable { cursor:pointer; display:inline-flex; align-items:center; gap:4px; }',
                    '.endorsement-clickable:hover { background:#d9eef6; color:#005a75; }',
                    '.endorsement-modal-body { max-height:420px; overflow:auto; }',
                    '.endorsement-view-row { padding:10px 0; border-bottom:1px solid #e2e8f0; }',
                    '.endorsement-view-row.simple strong { display:block; color:#1e293b; }',
                    '.endorsement-view-row:last-child { border-bottom:none; }',
                    '.stale-skill-badge { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-size:11px; }'
                ].join('\n');
            }
            find.setValue('css', findCss);
            find.update();
            gs.info('[Skills Hub] Find Expert CSS patched');
        } else {
            gs.warn('[Skills Hub] Find Expert widget not found during script 56');
        }

        // ------------------------------------------------------------------
        // My Profile: make the existing endorsement modal match the simple card identity style
        // ------------------------------------------------------------------
        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            var profileServer = profile.getValue('script') || '';
            var profileClient = profile.getValue('client_script') || '';
            var profileCss = profile.getValue('css') || '';

            if (profileServer.indexOf('Skills Hub Profile Endorsement Identity 56') < 0) {
                profileServer = profileServer.replace(
                    '  if (input && input.action == "getEndorsements") {',
                    '  // Skills Hub Profile Endorsement Identity 56\n  if (input && input.action == "getEndorsements") {'
                );
                profileServer = profileServer.replace(
                    '          while (er.next()) {\n              data.endorsements.push({',
                    '          while (er.next()) {\n              var endorserUser = er.u_endorser.getRefRecord();\n              data.endorsements.push({'
                );
                profileServer = profileServer.replace(
                    '                  endorser_id: er.getValue("u_endorser"),\n                  comments: er.getValue("u_comments") || "",\n                  created_on: er.getDisplayValue("sys_created_on")',
                    '                  endorser_id: er.getValue("u_endorser"),\n                  role: endorserUser.isValidRecord() ? (endorserUser.getValue("title") || "") : "",\n                  department: endorserUser.isValidRecord() ? endorserUser.getDisplayValue("department") : ""'
                );
                profile.setValue('script', profileServer);
                profile.update();
                gs.info('[Skills Hub] My Profile endorsement details now include role and department');
            }

            profile = getWidget('Skills Hub - My Profile');
            profileClient = profile.getValue('client_script') || '';
            if (profileClient.indexOf('endorsement-view-row simple') < 0) {
                profileClient = profileClient.replace(
                    'template: \'<div class="modal-header"><h4 class="modal-title">Endorsements</h4></div><div class="modal-body"><div ng-if="items.length == 0" class="text-muted">No endorsements yet.</div><div class="endorsement-view-row" ng-repeat="item in items"><strong>{{item.endorser}}</strong><div class="small text-muted">{{item.created_on}}</div><div ng-if="item.comments">{{item.comments}}</div></div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',',
                    'template: \'<div class="modal-header"><h4 class="modal-title">Endorsements</h4></div><div class="modal-body"><div ng-if="items.length == 0" class="text-muted">No endorsements yet.</div><div class="endorsement-view-row simple" ng-repeat="item in items"><strong>{{item.endorser}}</strong><div class="small text-muted"><span ng-if="item.role">{{item.role}}</span><span ng-if="item.role && item.department"> - </span><span ng-if="item.department">{{item.department}}</span></div></div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\','
                );
                profile.setValue('client_script', profileClient);
                profile.update();
                gs.info('[Skills Hub] My Profile endorsement modal simplified');
            }

            profile = getWidget('Skills Hub - My Profile');
            profileCss = profile.getValue('css') || '';
            if (profileCss.indexOf('Skills Hub Profile Endorsement Identity 56') < 0) {
                profileCss += [
                    '',
                    '/* Skills Hub Profile Endorsement Identity 56 */',
                    '.endorsement-view-row.simple strong { display:block; color:#1e293b; }'
                ].join('\n');
                profile.setValue('css', profileCss);
                profile.update();
            }
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 56');
        }

        // ------------------------------------------------------------------
        // Manager Matrix: stale/expired indicators
        // ------------------------------------------------------------------
        var si = new GlideRecord('sys_script_include');
        si.addQuery('name', 'SkillsHubUtils');
        si.setLimit(1);
        si.query();
        if (si.next()) {
            var utilScript = si.getValue('script') || '';
            if (utilScript.indexOf('Skills Hub Stale Indicator 56') < 0) {
                utilScript = utilScript.replace(
                    '                data[uid].skills[skillName] = {',
                    [
                        '                // Skills Hub Stale Indicator 56',
                        '                var staleAssessment = status == "expired";',
                        '                var lastValidation = sgr.getValue("u_last_manager_validation") || "";',
                        '                if (lastValidation) {',
                        '                   var cutoff = new GlideDateTime();',
                        '                   cutoff.addDaysLocalTime(-365);',
                        '                   var lastGdt = new GlideDateTime(lastValidation);',
                        '                   staleAssessment = staleAssessment || lastGdt.compareTo(cutoff) < 0;',
                        '                }',
                        '                data[uid].skills[skillName] = {'
                    ].join('\n')
                );
                utilScript = replaceAll(
                    utilScript,
                    '                   last_manager_validation: sgr.getDisplayValue("u_last_manager_validation")',
                    '                   last_manager_validation: sgr.getDisplayValue("u_last_manager_validation"),\n                   stale_assessment: staleAssessment'
                );
                si.setValue('script', utilScript);
                si.update();
                gs.info('[Skills Hub] SkillsHubUtils manager matrix stale data patched');
            } else {
                gs.info('[Skills Hub] SkillsHubUtils already has stale indicator marker');
            }
        } else {
            gs.warn('[Skills Hub] SkillsHubUtils not found during script 56');
        }

        var matrix = getWidget('Skills Hub - Manager Matrix');
        if (matrix) {
            var matrixTemplate = matrix.getValue('template') || '';
            var matrixCss = matrix.getValue('css') || '';

            matrixTemplate = replaceAll(
                matrixTemplate,
                'details.status != \'disputed\' && details.status != \'review_requested\'',
                'details.status != \'disputed\' && details.status != \'review_requested\' && details.status != \'expired\''
            );
            matrixTemplate = replaceAll(
                matrixTemplate,
                '\'status-review\': details.status == \'review_requested\'',
                '\'status-review\': details.status == \'review_requested\', \'status-expired\': details.status == \'expired\''
            );
            if (matrixTemplate.indexOf('Assessment older than one year') < 0) {
                matrixTemplate = replaceAll(
                    matrixTemplate,
                    '<i class="fa fa-reply text-review" ng-if="details.status == \'review_requested\'" uib-tooltip="Employee requested review"></i>',
                    '<i class="fa fa-reply text-review" ng-if="details.status == \'review_requested\'" uib-tooltip="Employee requested review"></i>\n                          <i class="fa fa-clock-o text-stale" ng-if="details.stale_assessment || details.status == \'expired\'" uib-tooltip="Assessment older than one year"></i>'
                );
            }

            matrix.setValue('template', matrixTemplate);
            matrix.update();
            gs.info('[Skills Hub] Manager Matrix template patched for stale indicators');

            matrix = getWidget('Skills Hub - Manager Matrix');
            matrixCss = matrix.getValue('css') || '';
            if (matrixCss.indexOf('Skills Hub Stale Indicator 56') < 0) {
                matrixCss += [
                    '',
                    '/* Skills Hub Stale Indicator 56 */',
                    '.status-expired { background:#fff7ed; border-color:#fed7aa; color:#9a3412; }',
                    '.text-stale { color:#c2410c; margin-left:4px; }'
                ].join('\n');
            }
            matrix.setValue('css', matrixCss);
            matrix.update();
            gs.info('[Skills Hub] Manager Matrix CSS patched for stale indicators');
        } else {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 56');
        }

        gs.info('[Skills Hub] ===== COMPLETED 56_endorsement_visibility_stale_indicators =====');
    } catch (e) {
        gs.error('[Skills Hub] 56_endorsement_visibility_stale_indicators failed: ' + e.message);
    }
})();
