/**
 * Fix Script: 60_dispute_loop_polish.js
 * Purpose: Make the dispute loop easier to understand without changing storage.
 *
 * Storage model:
 *   - sys_user_has_skill.u_validation_status: pending, validated, disputed, review_requested, expired
 *   - sys_user_has_skill.u_manager_assessed_level: manager suggested level
 *   - sys_user_has_skill.u_validation_notes: manager/employee notes trail
 *   - sys_user_has_skill.u_last_manager_validation: last validation date
 *
 * Fixes:
 *   - My Profile dispute panel uses plain action-oriented language.
 *   - Employee review request uses a small modal instead of browser prompt().
 *   - Manager Matrix keeps pills compact and moves dispute notes into a details modal.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 60_dispute_loop_polish =====');

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
        // My Profile
        // ------------------------------------------------------------------
        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            var profileClient = profile.getValue('client_script') || '';
            var profileTemplate = profile.getValue('template') || '';
            var profileCss = profile.getValue('css') || '';

            if (profileClient.indexOf('Skills Hub Dispute Polish 60') < 0) {
                if (profileClient.indexOf('$uibModal') < 0) {
                    profileClient = profileClient.replace('function($scope, spUtil)', 'function($scope, spUtil, $uibModal)');
                }
                profileClient = profileClient.replace(
                    '  c.requestDisputeReview = function(entry) {\n    var notes = prompt("What should your manager review?");\n    if (notes === null) return;\n    c.server.get({ action: "respondToDispute", skill_id: entry.sys_id, response_type: "request_review", notes: notes }).then(function(r) {\n      c.applyServerData(r.data);\n      spUtil.addInfoMessage("Review request sent.");\n    });\n  };',
                    [
                        '  // Skills Hub Dispute Polish 60',
                        '  c.requestDisputeReview = function(entry) {',
                        '    if (!entry || !entry.sys_id) return;',
                        '    $uibModal.open({',
                        '      template: \'<div class="modal-header"><h4 class="modal-title">Request Review</h4><div class="small text-muted">Share what your manager should reconsider.</div></div><div class="modal-body"><textarea class="form-control" rows="4" ng-model="notes" placeholder="Add a short note for your manager"></textarea></div><div class="modal-footer"><button class="btn btn-default" ng-click="$dismiss()">Cancel</button><button class="btn btn-primary" ng-click="$close(notes)" ng-disabled="!notes">Send review request</button></div>\',',
                        '      controller: function($scope) { $scope.notes = ""; }',
                        '    }).result.then(function(notes) {',
                        '      c.server.get({ action: "respondToDispute", skill_id: entry.sys_id, response_type: "request_review", notes: notes }).then(function(r) {',
                        '        c.applyServerData(r.data);',
                        '        spUtil.addInfoMessage("Review request sent.");',
                        '      });',
                        '    });',
                        '  };'
                    ].join('\n')
                );
                profileClient = replaceAll(
                    profileClient,
                    'spUtil.addInfoMessage("Manager assessment accepted.");',
                    'spUtil.addInfoMessage("Skill level updated and validated.");'
                );
                profile.setValue('client_script', profileClient);
                profile.update();
                gs.info('[Skills Hub] My Profile dispute client polished');
            }

            profile = getWidget('Skills Hub - My Profile');
            profileTemplate = profile.getValue('template') || '';
            profileTemplate = replaceAll(profileTemplate, 'Manager dispute', 'Manager suggested a change');
            profileTemplate = replaceAll(profileTemplate, 'Manager assessed:', 'Suggested level:');
            profileTemplate = replaceAll(profileTemplate, 'Accept manager level', 'Accept suggested level');
            profileTemplate = replaceAll(profileTemplate, 'Request review', 'Ask for review');
            profileTemplate = replaceAll(profileTemplate, 'Review requested', 'Review sent to manager');
            profile.setValue('template', profileTemplate);
            profile.update();
            gs.info('[Skills Hub] My Profile dispute template language polished');

            profile = getWidget('Skills Hub - My Profile');
            profileCss = profile.getValue('css') || '';
            if (profileCss.indexOf('Skills Hub Dispute Polish 60') < 0) {
                profileCss += [
                    '',
                    '/* Skills Hub Dispute Polish 60 */',
                    '.dispute-response-panel { border-color:#fde68a !important; background:#fffbeb !important; }',
                    '.dispute-response-panel strong { color:#92400e; }',
                    '.dispute-actions .btn-primary { background:#0078bf; border-color:#0078bf; }'
                ].join('\n');
                profile.setValue('css', profileCss);
                profile.update();
            }
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 60');
        }

        // ------------------------------------------------------------------
        // Manager Matrix
        // ------------------------------------------------------------------
        var matrix = getWidget('Skills Hub - Manager Matrix');
        if (matrix) {
            var matrixClient = matrix.getValue('client_script') || '';
            var matrixTemplate = matrix.getValue('template') || '';
            var matrixCss = matrix.getValue('css') || '';

            if (matrixClient.indexOf('Skills Hub Dispute Polish 60') < 0) {
                if (matrixClient.indexOf('$uibModal') < 0) {
                    matrixClient = matrixClient.replace('function($scope, spUtil)', 'function($scope, spUtil, $uibModal)');
                }
                matrixClient = matrixClient.replace('  var c = this;', [
                    '  var c = this;',
                    '',
                    '  // Skills Hub Dispute Polish 60',
                    '  c.disputeStatusLabel = function(details) {',
                    '     if (!details) return "";',
                    '     if (details.status == "review_requested") return "Review requested";',
                    '     if (details.status == "disputed") return "Disputed";',
                    '     if (details.status == "expired") return "Expired";',
                    '     return "";',
                    '  };',
                    '  c.showDisputeDetails = function(skillName, details, user) {',
                    '     if (!details) return;',
                    '     $uibModal.open({',
                    '        template: \'<div class="modal-header"><h4 class="modal-title">{{skillName}}</h4><div class="small text-muted">{{user.name}}</div></div><div class="modal-body"><div class="detail-row"><strong>Status</strong><span>{{statusLabel}}</span></div><div class="detail-row" ng-if="details.manager_assessed_level"><strong>Suggested level</strong><span>{{details.manager_assessed_level}}</span></div><div class="detail-row" ng-if="details.last_manager_validation"><strong>Last validated</strong><span>{{details.last_manager_validation}}</span></div><div class="detail-notes" ng-if="details.validation_notes"><strong>Notes</strong><div>{{details.validation_notes}}</div></div><div ng-if="!details.validation_notes" class="text-muted">No notes recorded.</div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',',
                    '        controller: function($scope) { $scope.skillName = skillName; $scope.details = details; $scope.user = user || {}; $scope.statusLabel = c.disputeStatusLabel(details); }',
                    '     });',
                    '  };'
                ].join('\n'));
                matrix.setValue('client_script', matrixClient);
                matrix.update();
                gs.info('[Skills Hub] Manager Matrix dispute details modal added');
            }

            matrix = getWidget('Skills Hub - Manager Matrix');
            matrixTemplate = matrix.getValue('template') || '';
            if (matrixTemplate.indexOf('status-chip-compact') < 0) {
                matrixTemplate = replaceAll(
                    matrixTemplate,
                    '<div class="manager-notes" ng-if="details.validation_notes || details.manager_assessed_level">\n                             <span ng-if="details.manager_assessed_level">Manager level: {{details.manager_assessed_level == "Intermediate" ? "Learner" : details.manager_assessed_level}}</span>\n                             <span ng-if="details.validation_notes">{{details.validation_notes}}</span>\n                          </div>',
                    '<button type="button" class="status-chip-compact" ng-if="details.status == \'disputed\' || details.status == \'review_requested\' || details.validation_notes || details.manager_assessed_level" ng-click="c.showDisputeDetails(skillName, details, user)" uib-tooltip="View status details">{{c.disputeStatusLabel(details) || "Details"}}</button>'
                );
                matrixTemplate = replaceAll(
                    matrixTemplate,
                    '<div class="manager-notes" ng-if="details.validation_notes || details.manager_assessed_level">\n                             <span ng-if="details.manager_assessed_level">Manager level: {{details.manager_assessed_level}}</span>\n                             <span ng-if="details.validation_notes">{{details.validation_notes}}</span>\n                          </div>',
                    '<button type="button" class="status-chip-compact" ng-if="details.status == \'disputed\' || details.status == \'review_requested\' || details.validation_notes || details.manager_assessed_level" ng-click="c.showDisputeDetails(skillName, details, user)" uib-tooltip="View status details">{{c.disputeStatusLabel(details) || "Details"}}</button>'
                );
                matrix.setValue('template', matrixTemplate);
                matrix.update();
                gs.info('[Skills Hub] Manager Matrix inline notes replaced with compact details button');
            }

            matrix = getWidget('Skills Hub - Manager Matrix');
            matrixCss = matrix.getValue('css') || '';
            if (matrixCss.indexOf('Skills Hub Dispute Polish 60') < 0) {
                matrixCss += [
                    '',
                    '/* Skills Hub Dispute Polish 60 */',
                    '.status-chip-compact { margin-top:5px; border:1px solid #fed7aa; background:#fffbeb; color:#92400e; border-radius:10px; padding:2px 8px; font-size:10px; font-weight:700; display:inline-flex; align-items:center; max-width:140px; white-space:nowrap; }',
                    '.status-chip-compact:hover { background:#fef3c7; color:#78350f; }',
                    '.detail-row { display:flex; justify-content:space-between; gap:16px; padding:8px 0; border-bottom:1px solid #eef2f7; }',
                    '.detail-row strong, .detail-notes strong { color:#475569; }',
                    '.detail-notes { padding-top:12px; }',
                    '.detail-notes div { margin-top:6px; white-space:pre-line; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; color:#334155; }'
                ].join('\n');
                matrix.setValue('css', matrixCss);
                matrix.update();
            }
        } else {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 60');
        }

        gs.info('[Skills Hub] ===== COMPLETED 60_dispute_loop_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 60_dispute_loop_polish failed: ' + e.message);
    }
})();
