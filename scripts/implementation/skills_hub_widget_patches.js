/**
 * =============================================================================
 * Skills Hub - Widget Patches Fix Script
 * =============================================================================
 *
 * Purpose: Updates three existing Service Portal widgets with new functionality:
 *   1. Manager Matrix  - dispute, bulkValidate, manager auth, status filters
 *   2. Find Expert     - endorse server action (server + client only)
 *   3. My Profile      - tier system replacing gamification card
 *
 * Scope: Global
 * Idempotent: Yes - full replacement of widget fields (same result on re-run)
 *
 * ASSUMPTION: Widgets already exist from the update set import.
 *             The consolidated fix script (skills_hub_consolidated.js) has been run.
 *
 * Run via: Scripts - Background (Global scope)
 * Date: 2026-03-25
 * =============================================================================
 */
(function() {
    var results = { patched: 0, skipped: 0, errors: 0 };

    gs.info('[Skills Hub] ============================================================');
    gs.info('[Skills Hub]  WIDGET PATCHES - STARTING');
    gs.info('[Skills Hub] ============================================================');

    /**
     * Finds a widget by ID, falls back to name LIKE search.
     * Returns GlideRecord or null.
     */
    function findWidget(widgetId, widgetNameLike) {
        var gr = new GlideRecord('sp_widget');
        gr.addQuery('id', widgetId);
        gr.query();
        if (gr.next()) return gr;

        gr = new GlideRecord('sp_widget');
        gr.addQuery('name', 'CONTAINS', widgetNameLike);
        gr.setLimit(1);
        gr.query();
        if (gr.next()) return gr;

        return null;
    }

    // ==================================================================
    // 1. MANAGER MATRIX
    // ==================================================================
    try {
        gs.info('[Skills Hub] --- Patching Manager Matrix ---');
        var mm = findWidget('skills-hub-matrix', 'Manager Matrix');
        if (!mm) {
            gs.warn('[Skills Hub] Manager Matrix widget not found. Skipping.');
            results.skipped++;
        } else {
            mm.script = '(function() {\n' +
'  // --- ACTION HANDLERS ---\n' +
'  if (input) {\n' +
'     // 1. Validate a skill\n' +
'     if (input.action == "validate") {\n' +
'        var mgr = gs.getUserID();\n' +
'        var gr = new GlideRecord("sys_user_has_skill");\n' +
'        gr.addQuery("user", input.userId);\n' +
'        gr.addQuery("skill.name", input.skillName);\n' +
'        gr.query();\n' +
'        if (gr.next()) {\n' +
'           var userGR = new GlideRecord("sys_user");\n' +
'           if (userGR.get(gr.user) && userGR.manager == mgr) {\n' +
'              gr.u_last_manager_validation = new GlideDateTime();\n' +
'              gr.u_validation_status = "validated";\n' +
'              if (input.assessedLevel) {\n' +
'                 gr.u_manager_assessed_level = input.assessedLevel;\n' +
'              }\n' +
'              gr.update();\n' +
'              data.success = true;\n' +
'           } else {\n' +
'              data.success = false;\n' +
'              data.error = "You are not this employee\'s manager.";\n' +
'           }\n' +
'        }\n' +
'     }\n' +
'\n' +
'     // 2. Dispute a skill\n' +
'     if (input.action == "dispute") {\n' +
'        var mgr = gs.getUserID();\n' +
'        var gr = new GlideRecord("sys_user_has_skill");\n' +
'        gr.addQuery("user", input.userId);\n' +
'        gr.addQuery("skill.name", input.skillName);\n' +
'        gr.query();\n' +
'        if (gr.next()) {\n' +
'           var userGR = new GlideRecord("sys_user");\n' +
'           if (userGR.get(gr.user) && userGR.manager == mgr) {\n' +
'              gr.u_validation_status = "disputed";\n' +
'              gr.u_validation_notes = input.notes || "";\n' +
'              if (input.assessedLevel) {\n' +
'                 gr.u_manager_assessed_level = input.assessedLevel;\n' +
'              }\n' +
'              gr.update();\n' +
'              data.success = true;\n' +
'           } else {\n' +
'              data.success = false;\n' +
'              data.error = "You are not this employee\'s manager.";\n' +
'           }\n' +
'        }\n' +
'     }\n' +
'\n' +
'     // 3. Bulk validate all skills for one employee\n' +
'     if (input.action == "bulkValidate") {\n' +
'        var mgr = gs.getUserID();\n' +
'        var userGR = new GlideRecord("sys_user");\n' +
'        if (userGR.get(input.userId) && userGR.manager == mgr) {\n' +
'           var gr = new GlideRecord("sys_user_has_skill");\n' +
'           gr.addQuery("user", input.userId);\n' +
'           gr.addQuery("u_validation_status", "!=", "validated");\n' +
'           gr.query();\n' +
'           var count = 0;\n' +
'           while (gr.next()) {\n' +
'              gr.u_last_manager_validation = new GlideDateTime();\n' +
'              gr.u_validation_status = "validated";\n' +
'              gr.update();\n' +
'              count++;\n' +
'           }\n' +
'           data.bulkCount = count;\n' +
'           data.success = true;\n' +
'        } else {\n' +
'           data.success = false;\n' +
'           data.error = "You are not this employee\'s manager.";\n' +
'        }\n' +
'     }\n' +
'  }\n' +
'})();';

            mm.client_script = 'function($scope, spUtil) {\n' +
'  var c = this;\n' +
'  c.data = {};\n' +
'  c.stats = { reports: 0, pending: 0, validated: 0, disputed: 0 };\n' +
'  c.noData = false;\n' +
'  c.statusFilter = "all";\n' +
'\n' +
'  c.load = function() {\n' +
'    var ga = new GlideAjax("SkillsHubUtils");\n' +
'    ga.addParam("sysparm_name", "getManagerMatrix");\n' +
'    ga.getXMLAnswer(function(response) {\n' +
'       if(response) {\n' +
'          var data = JSON.parse(response);\n' +
'          var count = 0;\n' +
'          var pending = 0;\n' +
'          var valid = 0;\n' +
'          var disputed = 0;\n' +
'\n' +
'          for (var uid in data) {\n' +
'             count++;\n' +
'             var names = data[uid].name.split(" ");\n' +
'             data[uid].initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();\n' +
'\n' +
'             for(var s in data[uid].skills) {\n' +
'                var sk = data[uid].skills[s];\n' +
'                if(sk.validated) valid++;\n' +
'                else if(sk.status == "disputed") disputed++;\n' +
'                else pending++;\n' +
'             }\n' +
'          }\n' +
'          c.data = data;\n' +
'          c.stats.reports = count;\n' +
'          c.stats.pending = pending;\n' +
'          c.stats.validated = valid;\n' +
'          c.stats.disputed = disputed;\n' +
'          c.noData = (count === 0);\n' +
'       }\n' +
'       $scope.$apply();\n' +
'    });\n' +
'  };\n' +
'\n' +
'  c.load();\n' +
'\n' +
'  c.validate = function(userId, skillName, details) {\n' +
'     if(details.validated) return;\n' +
'     if(confirm("Validate " + skillName + " for this employee?")) {\n' +
'        c.server.get({ action: "validate", userId: userId, skillName: skillName }).then(function(r){\n' +
'           if (r.data.success) {\n' +
'              details.validated = true;\n' +
'              details.status = "validated";\n' +
'              c.stats.pending--;\n' +
'              c.stats.validated++;\n' +
'              spUtil.addInfoMessage("Skill validated: " + skillName);\n' +
'           } else {\n' +
'              spUtil.addErrorMessage(r.data.error || "Validation failed");\n' +
'           }\n' +
'        });\n' +
'     }\n' +
'  };\n' +
'\n' +
'  c.openDisputeModal = function(userId, skillName, details) {\n' +
'     c.disputeTarget = { userId: userId, skillName: skillName, details: details };\n' +
'     c.disputeNotes = "";\n' +
'     c.disputeLevel = "";\n' +
'     c.showDisputeModal = true;\n' +
'  };\n' +
'\n' +
'  c.cancelDispute = function() {\n' +
'     c.showDisputeModal = false;\n' +
'     c.disputeTarget = null;\n' +
'  };\n' +
'\n' +
'  c.submitDispute = function() {\n' +
'     if (!c.disputeNotes) {\n' +
'        spUtil.addErrorMessage("Please enter notes explaining the dispute.");\n' +
'        return;\n' +
'     }\n' +
'     var t = c.disputeTarget;\n' +
'     c.server.get({\n' +
'        action: "dispute",\n' +
'        userId: t.userId,\n' +
'        skillName: t.skillName,\n' +
'        notes: c.disputeNotes,\n' +
'        assessedLevel: c.disputeLevel\n' +
'     }).then(function(r){\n' +
'        if (r.data.success) {\n' +
'           t.details.validated = false;\n' +
'           t.details.status = "disputed";\n' +
'           if (c.stats.pending > 0) c.stats.pending--;\n' +
'           c.stats.disputed++;\n' +
'           spUtil.addInfoMessage("Skill disputed: " + t.skillName);\n' +
'        } else {\n' +
'           spUtil.addErrorMessage(r.data.error || "Dispute failed");\n' +
'        }\n' +
'        c.showDisputeModal = false;\n' +
'        c.disputeTarget = null;\n' +
'     });\n' +
'  };\n' +
'\n' +
'  c.bulkValidate = function(userId, userName) {\n' +
'     if(confirm("Validate ALL pending skills for " + userName + "?")) {\n' +
'        c.server.get({ action: "bulkValidate", userId: userId }).then(function(r){\n' +
'           if (r.data.success) {\n' +
'              var user = c.data[userId];\n' +
'              for (var s in user.skills) {\n' +
'                 if (!user.skills[s].validated) {\n' +
'                    user.skills[s].validated = true;\n' +
'                    user.skills[s].status = "validated";\n' +
'                    c.stats.pending--;\n' +
'                    c.stats.validated++;\n' +
'                 }\n' +
'              }\n' +
'              spUtil.addInfoMessage("Bulk validated " + r.data.bulkCount + " skills for " + userName);\n' +
'           } else {\n' +
'              spUtil.addErrorMessage(r.data.error || "Bulk validation failed");\n' +
'           }\n' +
'        });\n' +
'     }\n' +
'  };\n' +
'\n' +
'  c.showSkill = function(details) {\n' +
'     if (c.statusFilter == "all") return true;\n' +
'     if (c.statusFilter == "validated") return details.validated;\n' +
'     if (c.statusFilter == "disputed") return details.status == "disputed";\n' +
'     if (c.statusFilter == "pending") return !details.validated && details.status != "disputed";\n' +
'     return true;\n' +
'  };\n' +
'}';

            mm.template = '<div class="panel-cc">\n' +
'  <!-- HEADER & STATS -->\n' +
'  <div class="matrix-header">\n' +
'     <div>\n' +
'        <h3 class="matrix-title">Team Capability Matrix</h3>\n' +
'        <p class="matrix-subtitle">Review, validate, and analyze your direct reports\' skills.</p>\n' +
'     </div>\n' +
'     <div class="stats-group">\n' +
'        <div class="stat-card" ng-click="c.statusFilter = \'all\'" ng-class="{\'stat-active\': c.statusFilter == \'all\'}" style="cursor:pointer;">\n' +
'           <span class="stat-val">{{c.stats.reports}}</span>\n' +
'           <span class="stat-label">Reports</span>\n' +
'        </div>\n' +
'        <div class="stat-card" ng-click="c.statusFilter = \'pending\'" ng-class="{\'stat-active\': c.statusFilter == \'pending\'}" style="cursor:pointer;">\n' +
'           <span class="stat-val text-orange">{{c.stats.pending}}</span>\n' +
'           <span class="stat-label">Pending</span>\n' +
'        </div>\n' +
'        <div class="stat-card" ng-click="c.statusFilter = \'validated\'" ng-class="{\'stat-active\': c.statusFilter == \'validated\'}" style="cursor:pointer;">\n' +
'           <span class="stat-val text-green">{{c.stats.validated}}</span>\n' +
'           <span class="stat-label">Verified</span>\n' +
'        </div>\n' +
'        <div class="stat-card" ng-click="c.statusFilter = \'disputed\'" ng-class="{\'stat-active\': c.statusFilter == \'disputed\'}" style="cursor:pointer;">\n' +
'           <span class="stat-val text-red">{{c.stats.disputed}}</span>\n' +
'           <span class="stat-label">Disputed</span>\n' +
'        </div>\n' +
'     </div>\n' +
'  </div>\n' +
'  <!-- TABLE MATRIX -->\n' +
'  <div class="table-container">\n' +
'     <table class="table-matrix">\n' +
'        <thead>\n' +
'           <tr>\n' +
'              <th style="width: 250px;">Employee</th>\n' +
'              <th>Skills Portfolio</th>\n' +
'              <th style="width: 120px;">Actions</th>\n' +
'           </tr>\n' +
'        </thead>\n' +
'        <tbody>\n' +
'           <tr ng-if="c.noData">\n' +
'              <td colspan="3" class="text-center" style="padding: 40px;">\n' +
'                 <p class="text-muted">No direct reports found with skills data.</p>\n' +
'              </td>\n' +
'           </tr>\n' +
'           <tr ng-repeat="(uid, user) in c.data">\n' +
'              <td style="border-right: 1px solid #f1f5f9;">\n' +
'                 <div class="employee-cell">\n' +
'                    <div class="avatar-circle">{{user.initials}}</div>\n' +
'                    <div>\n' +
'                       <span class="emp-name">{{user.name}}</span>\n' +
'                       <span class="emp-title">{{user.title}}</span>\n' +
'                    </div>\n' +
'                 </div>\n' +
'              </td>\n' +
'              <td>\n' +
'                 <div class="skill-grid">\n' +
'                    <div class="skill-pill"\n' +
'                         ng-repeat="(skillName, details) in user.skills"\n' +
'                         ng-if="c.showSkill(details)"\n' +
'                         ng-class="{\'status-validated\': details.validated, \'status-pending\': !details.validated && details.status != \'disputed\', \'status-disputed\': details.status == \'disputed\'}">\n' +
'                       <div class="action-hint" ng-if="!details.validated && details.status != \'disputed\'">\n' +
'                          <span ng-click="c.validate(uid, skillName, details)">Validate</span> |\n' +
'                          <span ng-click="c.openDisputeModal(uid, skillName, details)">Dispute</span>\n' +
'                       </div>\n' +
'                       <div class="action-hint" ng-if="details.validated">Verified by Manager</div>\n' +
'                       <div class="action-hint" ng-if="details.status == \'disputed\'">Disputed</div>\n' +
'                       <span ng-click="c.validate(uid, skillName, details)">{{skillName}}</span>\n' +
'                       <span style="font-weight:400; opacity:0.7;">| {{details.level}}</span>\n' +
'                       <i class="fa fa-check-circle text-check" ng-if="details.validated"></i>\n' +
'                       <i class="fa fa-exclamation-triangle text-disputed" ng-if="details.status == \'disputed\'"></i>\n' +
'                       <i class="fa fa-heart text-heart interest-icon" ng-if="details.interest==\'high\'" title="High Interest"></i>\n' +
'                    </div>\n' +
'                    <span ng-if="Object.keys(user.skills).length == 0" class="text-muted small" style="padding: 6px 0; font-style:italic;">\n' +
'                       No skills recorded.\n' +
'                    </span>\n' +
'                 </div>\n' +
'              </td>\n' +
'              <td class="text-center">\n' +
'                 <button class="btn btn-xs btn-success" ng-click="c.bulkValidate(uid, user.name)" title="Validate all pending skills">\n' +
'                    <i class="fa fa-check-double"></i> Validate All\n' +
'                 </button>\n' +
'              </td>\n' +
'           </tr>\n' +
'        </tbody>\n' +
'     </table>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'<!-- DISPUTE MODAL -->\n' +
'<div class="dispute-overlay" ng-if="c.showDisputeModal" ng-click="c.cancelDispute()">\n' +
'   <div class="dispute-modal" ng-click="$event.stopPropagation()">\n' +
'      <div class="dispute-header">\n' +
'         <h4 style="margin:0; font-weight:700;">Dispute Skill</h4>\n' +
'         <i class="fa fa-times" style="cursor:pointer; color:#94a3b8;" ng-click="c.cancelDispute()"></i>\n' +
'      </div>\n' +
'      <div class="dispute-body">\n' +
'         <p class="text-muted" style="margin-bottom:16px;">\n' +
'            Disputing <strong>{{c.disputeTarget.skillName}}</strong>. Provide your assessment and justification.\n' +
'         </p>\n' +
'         <div class="form-group">\n' +
'            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Your Assessed Level (Optional)</label>\n' +
'            <select class="form-control" ng-model="c.disputeLevel">\n' +
'               <option value="">-- Keep as-is --</option>\n' +
'               <option value="Novice">Novice</option>\n' +
'               <option value="Intermediate">Intermediate</option>\n' +
'               <option value="Proficient">Proficient</option>\n' +
'               <option value="Advanced">Advanced</option>\n' +
'               <option value="Expert">Expert</option>\n' +
'            </select>\n' +
'         </div>\n' +
'         <div class="form-group">\n' +
'            <label style="font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b;">Notes (Required)</label>\n' +
'            <textarea class="form-control" rows="3" ng-model="c.disputeNotes"\n' +
'                      placeholder="Explain why you disagree with the self-assessed level..."></textarea>\n' +
'         </div>\n' +
'      </div>\n' +
'      <div class="dispute-footer">\n' +
'         <button class="btn btn-default" ng-click="c.cancelDispute()">Cancel</button>\n' +
'         <button class="btn btn-warning" ng-click="c.submitDispute()" ng-disabled="!c.disputeNotes">\n' +
'            <i class="fa fa-exclamation-triangle"></i> Submit Dispute\n' +
'         </button>\n' +
'      </div>\n' +
'   </div>\n' +
'</div>';

            mm.css = ':root { --cc-blue: #00799e; --cc-green: #60c659; --text-dark: #1e293b; --text-light: #64748b; --bg-slate: #f8fafc; }\n' +
'.text-cc-blue { color: #00799e; }\n' +
'.panel-cc { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }\n' +
'.matrix-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-end; background: white; }\n' +
'.matrix-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }\n' +
'.matrix-subtitle { font-size: 13px; color: #64748b; margin: 0; }\n' +
'.stats-group { display: flex; gap: 12px; }\n' +
'.stat-card { background: #f8fafc; padding: 10px 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; min-width: 80px; transition: all 0.2s; }\n' +
'.stat-card.stat-active { border-color: #00799e; background: #f0f9ff; }\n' +
'.stat-val { font-size: 20px; font-weight: 800; color: #1e293b; display: block; line-height: 1.2; }\n' +
'.stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }\n' +
'.stat-val.text-green { color: #15803d; }\n' +
'.stat-val.text-orange { color: #d97706; }\n' +
'.stat-val.text-red { color: #dc2626; }\n' +
'.table-container { overflow-x: auto; }\n' +
'.table-matrix { width: 100%; border-collapse: separate; border-spacing: 0; }\n' +
'.table-matrix th { text-align: left; padding: 16px 24px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }\n' +
'.table-matrix td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: top; background: white; }\n' +
'.table-matrix tr:last-child td { border-bottom: none; }\n' +
'.table-matrix tr:hover td { background: #fcfcfc; }\n' +
'.employee-cell { display: flex; align-items: center; gap: 12px; }\n' +
'.avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: #e0f2f1; color: #00695c; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }\n' +
'.emp-name { font-size: 14px; font-weight: 700; color: #1e293b; display: block; }\n' +
'.emp-title { font-size: 11px; color: #64748b; display: block; }\n' +
'.skill-grid { display: flex; flex-wrap: wrap; gap: 8px; }\n' +
'.skill-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; background: #f1f5f9; color: #475569; position: relative; }\n' +
'.skill-pill.status-validated { background: #f0fdf4; color: #166534; border-color: #dcfce7; }\n' +
'.skill-pill.status-validated:hover { border-color: #166534; }\n' +
'.skill-pill.status-pending { background: white; border-color: #cbd5e1; border-style: dashed; color: #64748b; }\n' +
'.skill-pill.status-pending:hover { border-color: #00799e; color: #00799e; background: #f0f9ff; }\n' +
'.skill-pill.status-disputed { background: #fef2f2; color: #991b1b; border-color: #fecaca; }\n' +
'.skill-pill.status-disputed:hover { border-color: #991b1b; }\n' +
'.interest-icon { font-size: 10px; }\n' +
'.text-heart { color: #e11d48; }\n' +
'.text-check { color: #166534; }\n' +
'.text-disputed { color: #dc2626; font-size: 11px; }\n' +
'.skill-pill:hover .action-hint { opacity: 1; transform: translateY(0); }\n' +
'.action-hint { opacity: 0; pointer-events: none; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(4px); background: #1e293b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; transition: all 0.2s; z-index: 20; margin-bottom: 6px; }\n' +
'.action-hint span { cursor: pointer; text-decoration: underline; }\n' +
'.action-hint::after { content: \'\'; position: absolute; top: 100%; left: 50%; margin-left: -4px; border-width: 4px; border-style: solid; border-color: #1e293b transparent transparent transparent; }\n' +
'.dispute-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 1050; display: flex; align-items: center; justify-content: center; }\n' +
'.dispute-modal { background: white; border-radius: 12px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }\n' +
'.dispute-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }\n' +
'.dispute-body { padding: 24px; }\n' +
'.dispute-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; }';

            mm.update();
            gs.info('[Skills Hub] Manager Matrix patched (' + mm.getUniqueValue() + ')');
            results.patched++;
        }
    } catch (e) {
        gs.error('[Skills Hub] Manager Matrix patch error: ' + e.message);
        results.errors++;
    }

    // ==================================================================
    // 2. FIND EXPERT (server + client only, template/CSS unchanged)
    // ==================================================================
    try {
        gs.info('[Skills Hub] --- Patching Find Expert ---');
        var fe = findWidget('skills-hub-find', 'Find Expert');
        if (!fe) {
            gs.warn('[Skills Hub] Find Expert widget not found. Skipping.');
            results.skipped++;
        } else {
            fe.script = '(function() {\n' +
'  var SCORE_MUST_HAVE = 20;\n' +
'  var SCORE_NICE_HAVE = 5;\n' +
'  var MULTIPLIER_EXPERT = 1.5;\n' +
'  var MULTIPLIER_ADVANCED = 1.2;\n' +
'\n' +
'  if (input && input.action == "search") {\n' +
'     var matches = [];\n' +
'     var mustIds = input.mustHave ? input.mustHave.split(",") : [];\n' +
'     var niceIds = input.niceHave ? input.niceHave.split(",") : [];\n' +
'     var allSkillIds = mustIds.concat(niceIds);\n' +
'\n' +
'     var users = {};\n' +
'\n' +
'     var gr = new GlideRecord("sys_user_has_skill");\n' +
'     gr.addQuery("skill", "IN", allSkillIds);\n' +
'     gr.addQuery("user.active", true);\n' +
'     gr.query();\n' +
'\n' +
'     while (gr.next()) {\n' +
'        var uid = gr.user.toString();\n' +
'        var skillId = gr.skill.toString();\n' +
'        var skillName = gr.skill.name.toString();\n' +
'        var level = gr.skill_level.toString();\n' +
'        var skillRecordId = gr.getUniqueValue();\n' +
'\n' +
'        if (!users[uid]) {\n' +
'           users[uid] = {\n' +
'              sys_id: uid,\n' +
'              name: gr.user.name.toString(),\n' +
'              title: gr.user.title.toString() || "Employee",\n' +
'              skills: [],\n' +
'              rawScore: 0,\n' +
'              mustHits: 0\n' +
'           };\n' +
'        }\n' +
'\n' +
'        var points = 0;\n' +
'        var isMust = (mustIds.indexOf(skillId) > -1);\n' +
'\n' +
'        if (isMust) {\n' +
'           points += SCORE_MUST_HAVE;\n' +
'           users[uid].mustHits++;\n' +
'        } else {\n' +
'           points += SCORE_NICE_HAVE;\n' +
'        }\n' +
'\n' +
'        if (level.indexOf("Expert") > -1) points *= MULTIPLIER_EXPERT;\n' +
'        else if (level.indexOf("Advanced") > -1) points *= MULTIPLIER_ADVANCED;\n' +
'\n' +
'        users[uid].rawScore += points;\n' +
'        users[uid].skills.push({ name: skillName, matched: true, skill_record_id: skillRecordId });\n' +
'     }\n' +
'\n' +
'     var maxPossible = (mustIds.length * (SCORE_MUST_HAVE * 1.5)) + (niceIds.length * (SCORE_NICE_HAVE * 1.5));\n' +
'     if (maxPossible == 0) maxPossible = 100;\n' +
'\n' +
'     for (var id in users) {\n' +
'        var u = users[id];\n' +
'        var matchPct = Math.min(Math.round((u.rawScore / maxPossible) * 100), 100);\n' +
'        if (matchPct > 100) matchPct = 99;\n' +
'        var avail = "high";\n' +
'        var names = u.name.split(" ");\n' +
'        var initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();\n' +
'\n' +
'        matches.push({\n' +
'           id: u.sys_id,\n' +
'           name: u.name,\n' +
'           title: u.title,\n' +
'           initials: initials,\n' +
'           skills: u.skills,\n' +
'           matchScore: matchPct,\n' +
'           availability: avail\n' +
'        });\n' +
'     }\n' +
'\n' +
'     matches.sort(function(a, b) { return b.matchScore - a.matchScore; });\n' +
'     data.matches = matches;\n' +
'  }\n' +
'\n' +
'  // --- ENDORSE ACTION ---\n' +
'  if (input && input.action == "endorse") {\n' +
'     var endorser = gs.getUserID();\n' +
'     var skillRecId = input.skill_record_id;\n' +
'     data.endorsed = false;\n' +
'     data.endorseError = "";\n' +
'\n' +
'     if (!skillRecId) {\n' +
'        data.endorseError = "No skill record specified.";\n' +
'     } else {\n' +
'        var skillRec = new GlideRecord("sys_user_has_skill");\n' +
'        if (!skillRec.get(skillRecId)) {\n' +
'           data.endorseError = "Skill record not found.";\n' +
'        } else {\n' +
'           var skillOwner = skillRec.user.toString();\n' +
'           if (endorser == skillOwner) {\n' +
'              data.endorseError = "You cannot endorse your own skill.";\n' +
'           } else {\n' +
'              var dup = new GlideRecord("u_m2m_skill_endorsement");\n' +
'              dup.addQuery("u_endorser", endorser);\n' +
'              dup.addQuery("u_skill_record", skillRecId);\n' +
'              dup.query();\n' +
'              if (dup.hasNext()) {\n' +
'                 data.endorseError = "You have already endorsed this skill.";\n' +
'              } else {\n' +
'                 var endorse = new GlideRecord("u_m2m_skill_endorsement");\n' +
'                 endorse.initialize();\n' +
'                 endorse.u_endorser = endorser;\n' +
'                 endorse.u_skill_record = skillRecId;\n' +
'                 var newId = endorse.insert();\n' +
'                 if (newId) {\n' +
'                    data.endorsed = true;\n' +
'                 } else {\n' +
'                    data.endorseError = "Failed to create endorsement record.";\n' +
'                 }\n' +
'              }\n' +
'           }\n' +
'        }\n' +
'     }\n' +
'  }\n' +
'})();';

            fe.client_script = 'function($scope, spUtil) {\n' +
'  var c = this;\n' +
'  c.viewMode = "grid";\n' +
'  c.mustHave = { value: "", displayValue: "" };\n' +
'  c.niceHave = { value: "", displayValue: "" };\n' +
'  c.availableOnly = true;\n' +
'  c.sameDept = false;\n' +
'  c.searched = false;\n' +
'  c.loading = false;\n' +
'  c.results = [];\n' +
'\n' +
'  c.search = function() {\n' +
'     if (!c.mustHave.value && !c.niceHave.value) return;\n' +
'     c.loading = true;\n' +
'     c.searched = true;\n' +
'     c.results = [];\n' +
'     c.server.get({\n' +
'        action: "search",\n' +
'        mustHave: c.mustHave.value,\n' +
'        niceHave: c.niceHave.value,\n' +
'        filters: { available: c.availableOnly, dept: c.sameDept }\n' +
'     }).then(function(r) {\n' +
'        c.loading = false;\n' +
'        if (r.data.matches) {\n' +
'           c.results = r.data.matches;\n' +
'        }\n' +
'     });\n' +
'  };\n' +
'\n' +
'  c.getScoreClass = function(score) {\n' +
'     if (score >= 90) return "score-high";\n' +
'     if (score >= 70) return "score-med";\n' +
'     return "score-low";\n' +
'  };\n' +
'\n' +
'  c.endorse = function(user) {\n' +
'     if (!user.skills || user.skills.length === 0) {\n' +
'        spUtil.addErrorMessage("No skill to endorse.");\n' +
'        return;\n' +
'     }\n' +
'     var skillRecId = user.skills[0].skill_record_id;\n' +
'     if (!skillRecId) {\n' +
'        spUtil.addInfoMessage("Endorsement not available for this result.");\n' +
'        return;\n' +
'     }\n' +
'     c.server.get({\n' +
'        action: "endorse",\n' +
'        skill_record_id: skillRecId\n' +
'     }).then(function(r) {\n' +
'        if (r.data.endorsed) {\n' +
'           spUtil.addInfoMessage("Endorsed " + user.name + "!");\n' +
'        } else if (r.data.endorseError) {\n' +
'           spUtil.addErrorMessage(r.data.endorseError);\n' +
'        }\n' +
'     });\n' +
'  };\n' +
'}';

            // Template and CSS left unchanged
            fe.update();
            gs.info('[Skills Hub] Find Expert patched (' + fe.getUniqueValue() + ')');
            results.patched++;
        }
    } catch (e) {
        gs.error('[Skills Hub] Find Expert patch error: ' + e.message);
        results.errors++;
    }

    // ==================================================================
    // 3. MY PROFILE (server + template + CSS; client unchanged)
    // ==================================================================
    try {
        gs.info('[Skills Hub] --- Patching My Profile ---');
        var mp = findWidget('skills-hub-profile', 'My Profile');
        if (!mp) {
            gs.warn('[Skills Hub] My Profile widget not found. Skipping.');
            results.skipped++;
        } else {
            mp.script = '(function() {\n' +
'  var me = gs.getUserID();\n' +
'\n' +
'  // --- 1. ACTION HANDLERS ---\n' +
'  if (input) {\n' +
'     if (input.action == "update_proficiency") {\n' +
'        var gr = new GlideRecord("sys_user_has_skill");\n' +
'        if (gr.get(input.skill_id) && gr.user == me) {\n' +
'           var levelStrings = ["", "Novice", "Intermediate", "Proficient", "Advanced", "Expert"];\n' +
'           gr.skill_level = levelStrings[input.level_value] || "Novice";\n' +
'           gr.update();\n' +
'        }\n' +
'     }\n' +
'     if (input.action == "update_interest") {\n' +
'        var gr = new GlideRecord("sys_user_has_skill");\n' +
'        if (gr.get(input.skill_id) && gr.user == me) {\n' +
'           gr.u_interest_level = input.interest;\n' +
'           gr.update();\n' +
'        }\n' +
'     }\n' +
'     if (input.action == "remove_skill") {\n' +
'        var gr = new GlideRecord("sys_user_has_skill");\n' +
'        if (gr.get(input.skill_id) && gr.user == me) {\n' +
'           gr.deleteRecord();\n' +
'        }\n' +
'     }\n' +
'     if (input.action == "add_skill") {\n' +
'        var check = new GlideRecord("sys_user_has_skill");\n' +
'        check.addQuery("user", me);\n' +
'        check.addQuery("skill", input.cmn_skill_id);\n' +
'        check.query();\n' +
'        if (!check.hasNext()) {\n' +
'           var newSkill = new GlideRecord("sys_user_has_skill");\n' +
'           newSkill.initialize();\n' +
'           newSkill.user = me;\n' +
'           newSkill.skill = input.cmn_skill_id;\n' +
'           newSkill.skill_level = "Novice";\n' +
'           newSkill.u_interest_level = "neutral";\n' +
'           newSkill.insert();\n' +
'        }\n' +
'     }\n' +
'  }\n' +
'\n' +
'  // --- 2. GET USER PROFILE ---\n' +
'  var userGR = new GlideRecord("sys_user");\n' +
'  if(userGR.get(me)) {\n' +
'     data.user_id = me;\n' +
'     data.user_name = userGR.getDisplayValue("name");\n' +
'     data.user_title = userGR.getDisplayValue("title") || "Employee";\n' +
'     data.user_dept = userGR.getDisplayValue("department") || "IT";\n' +
'  }\n' +
'\n' +
'  // --- 3. DATA FETCH & STATS CALC ---\n' +
'  data.skills = [];\n' +
'  data.stats = { total_skills: 0, total_validations: 0, total_endorsed_given: 0, total_validated_skills: 0 };\n' +
'\n' +
'  var s = new GlideRecord("sys_user_has_skill");\n' +
'  s.addQuery("user", me);\n' +
'  s.orderBy("skill.name");\n' +
'  s.query();\n' +
'\n' +
'  data.stats.total_skills = s.getRowCount();\n' +
'\n' +
'  var profBonusMap = { 1: 2, 2: 5, 3: 10, 4: 20, 5: 35 };\n' +
'\n' +
'  while (s.next()) {\n' +
'    var levelStr = s.skill_level.toString();\n' +
'    var levelInt = 1;\n' +
'    if (levelStr.indexOf("Novice") > -1) levelInt = 1;\n' +
'    else if (levelStr.indexOf("Learner") > -1) levelInt = 2;\n' +
'    else if (levelStr.indexOf("Intermediate") > -1) levelInt = 2;\n' +
'    else if (levelStr.indexOf("Proficient") > -1) levelInt = 3;\n' +
'    else if (levelStr.indexOf("Advanced") > -1) levelInt = 4;\n' +
'    else if (levelStr.indexOf("Expert") > -1) levelInt = 5;\n' +
'\n' +
'    var endorsements = parseInt(s.u_peer_endorsement_count.toString() || "0");\n' +
'    data.stats.total_validations += endorsements;\n' +
'\n' +
'    var valStatus = s.u_validation_status.toString();\n' +
'    if (valStatus == "validated") {\n' +
'       data.stats.total_validated_skills++;\n' +
'    }\n' +
'\n' +
'    data.skills.push({\n' +
'      sys_id: s.getUniqueValue(),\n' +
'      name: s.skill.name.toString(),\n' +
'      initials: s.skill.name.toString().substring(0,2).toUpperCase(),\n' +
'      category: s.skill.category.getDisplayValue() || data.user_dept || "Skill",\n' +
'      level_display: levelStr,\n' +
'      level_value: levelInt,\n' +
'      interest: s.u_interest_level.toString() || "neutral",\n' +
'      endorsements: endorsements,\n' +
'      validation_status: valStatus\n' +
'    });\n' +
'  }\n' +
'\n' +
'  // Count endorsements given by this user\n' +
'  var eg = new GlideAggregate("u_m2m_skill_endorsement");\n' +
'  eg.addQuery("u_endorser", me);\n' +
'  eg.addAggregate("COUNT");\n' +
'  eg.query();\n' +
'  if (eg.next()) {\n' +
'     data.stats.total_endorsed_given = parseInt(eg.getAggregate("COUNT")) || 0;\n' +
'  }\n' +
'\n' +
'  // Count skills added this quarter\n' +
'  var quarterStart = new GlideDateTime();\n' +
'  var month = parseInt(quarterStart.getMonthLocalTime());\n' +
'  var qMonth = month - ((month - 1) % 3);\n' +
'  quarterStart.setMonthLocalTime(qMonth);\n' +
'  quarterStart.setDayOfMonthLocalTime(1);\n' +
'  quarterStart.setValue(quarterStart.getDate() + " 00:00:00");\n' +
'\n' +
'  var recentCount = 0;\n' +
'  var rc = new GlideRecord("sys_user_has_skill");\n' +
'  rc.addQuery("user", me);\n' +
'  rc.addQuery("sys_created_on", ">=", quarterStart);\n' +
'  rc.query();\n' +
'  recentCount = rc.getRowCount();\n' +
'\n' +
'  // --- 4. TIER CALCULATION ---\n' +
'  var totalPoints = 0;\n' +
'  totalPoints += data.stats.total_skills * 10;\n' +
'  for (var i = 0; i < data.skills.length; i++) {\n' +
'     totalPoints += (profBonusMap[data.skills[i].level_value] || 2);\n' +
'  }\n' +
'  totalPoints += data.stats.total_validations * 5;\n' +
'  totalPoints += data.stats.total_endorsed_given * 3;\n' +
'  totalPoints += data.stats.total_validated_skills * 15;\n' +
'  totalPoints += recentCount * 8;\n' +
'\n' +
'  var tiers = [\n' +
'     { name: "Starter", min: 0, max: 49, icon: "fa-seedling", color: "#94a3b8", tagline: "Just getting started" },\n' +
'     { name: "Contributor", min: 50, max: 149, icon: "fa-hand-holding-heart", color: "#3b82f6", tagline: "Building your portfolio" },\n' +
'     { name: "Specialist", min: 150, max: 299, icon: "fa-star", color: "#8b5cf6", tagline: "Deep expertise emerging" },\n' +
'     { name: "Trailblazer", min: 300, max: 499, icon: "fa-fire", color: "#f59e0b", tagline: "Leading by example" },\n' +
'     { name: "Luminary", min: 500, max: 99999, icon: "fa-sun", color: "#ef4444", tagline: "Organizational skill champion" }\n' +
'  ];\n' +
'\n' +
'  var tier = tiers[0];\n' +
'  var nextTier = tiers[1];\n' +
'  for (var t = 0; t < tiers.length; t++) {\n' +
'     if (totalPoints >= tiers[t].min && totalPoints <= tiers[t].max) {\n' +
'        tier = tiers[t];\n' +
'        nextTier = (t < tiers.length - 1) ? tiers[t + 1] : null;\n' +
'        break;\n' +
'     }\n' +
'  }\n' +
'\n' +
'  var progressPercent = 0;\n' +
'  if (nextTier) {\n' +
'     var range = nextTier.min - tier.min;\n' +
'     var progress = totalPoints - tier.min;\n' +
'     progressPercent = Math.min(Math.round((progress / range) * 100), 100);\n' +
'  } else {\n' +
'     progressPercent = 100;\n' +
'  }\n' +
'\n' +
'  data.tier = {\n' +
'     name: tier.name,\n' +
'     icon: tier.icon,\n' +
'     color: tier.color,\n' +
'     tagline: tier.tagline,\n' +
'     points: totalPoints,\n' +
'     progress_percent: progressPercent,\n' +
'     next_tier: nextTier ? nextTier.name : null,\n' +
'     next_tier_min: nextTier ? nextTier.min : 0,\n' +
'     points_to_next: nextTier ? (nextTier.min - totalPoints) : 0\n' +
'  };\n' +
'})();';

            mp.template = '<div class="row">\n' +
'  <!-- LEFT SIDEBAR -->\n' +
'  <div class="col-md-4">\n' +
'     <!-- Profile Card -->\n' +
'     <div class="profile-card">\n' +
'        <div class="profile-header-bg"></div>\n' +
'        <div class="profile-content">\n' +
'           <div class="profile-avatar-container">\n' +
'              <div class="profile-avatar">\n' +
'                 <sn-avatar primary="c.data.user_id" show-presence="false" class="avatar-large"></sn-avatar>\n' +
'              </div>\n' +
'           </div>\n' +
'           <div class="profile-name">{{c.data.user_name}}</div>\n' +
'           <div class="profile-meta">{{c.data.user_title}} &bull; {{c.data.user_dept}}</div>\n' +
'           <div class="profile-badges">\n' +
'              <span class="badge-pill badge-expert"><i class="fa fa-star"></i> Expert</span>\n' +
'              <span class="badge-pill badge-verified"><i class="fa fa-check-circle"></i> Verified</span>\n' +
'           </div>\n' +
'           <div class="profile-stats">\n' +
'              <div class="stat-item">\n' +
'                 <div class="stat-value">{{c.data.stats.total_skills}}</div>\n' +
'                 <div class="stat-label">Skills</div>\n' +
'              </div>\n' +
'              <div class="stat-item">\n' +
'                 <div class="stat-value">{{c.data.stats.total_validations}}</div>\n' +
'                 <div class="stat-label">Endorsements</div>\n' +
'              </div>\n' +
'           </div>\n' +
'        </div>\n' +
'     </div>\n' +
'     <!-- Tier Card -->\n' +
'     <div class="tier-card" ng-style="{\'border-left-color\': c.data.tier.color}">\n' +
'        <div class="tier-icon-bg">\n' +
'           <i class="fa" ng-class="c.data.tier.icon" ng-style="{color: c.data.tier.color}"></i>\n' +
'        </div>\n' +
'        <div class="tier-badge" ng-style="{background: c.data.tier.color}">\n' +
'           <i class="fa" ng-class="c.data.tier.icon"></i>\n' +
'           {{c.data.tier.name}}\n' +
'        </div>\n' +
'        <div class="tier-points">{{c.data.tier.points}} <span style="font-size:12px; font-weight:500; color:#64748b;">points</span></div>\n' +
'        <div class="tier-tagline">{{c.data.tier.tagline}}</div>\n' +
'        <div class="tier-progress-section" ng-if="c.data.tier.next_tier">\n' +
'           <div class="tier-progress-labels">\n' +
'              <span>{{c.data.tier.name}}</span>\n' +
'              <span>{{c.data.tier.next_tier}} ({{c.data.tier.next_tier_min}} pts)</span>\n' +
'           </div>\n' +
'           <div class="tier-progress-track">\n' +
'              <div class="tier-progress-fill" ng-style="{width: c.data.tier.progress_percent + \'%\', background: c.data.tier.color}"></div>\n' +
'           </div>\n' +
'           <div class="tier-progress-hint">\n' +
'              {{c.data.tier.points_to_next}} points to <strong>{{c.data.tier.next_tier}}</strong>\n' +
'           </div>\n' +
'        </div>\n' +
'        <div class="tier-progress-section" ng-if="!c.data.tier.next_tier">\n' +
'           <div class="tier-max-badge">\n' +
'              <i class="fa fa-crown" style="color:#f59e0b;"></i> Maximum Tier Reached!\n' +
'           </div>\n' +
'        </div>\n' +
'     </div>\n' +
'  </div>\n' +
'  <!-- RIGHT CONTENT -->\n' +
'  <div class="col-md-8">\n' +
'     <div class="section-header">\n' +
'        <div>\n' +
'           <h2 class="section-title">My Competencies</h2>\n' +
'           <p class="section-subtitle">Manage your expertise and interests.</p>\n' +
'        </div>\n' +
'        <button class="btn-add" ng-click="c.openAddModal()">\n' +
'           <i class="fa fa-plus"></i> Add Skill\n' +
'        </button>\n' +
'     </div>\n' +
'     <div class="text-center" ng-if="data.skills.length == 0">\n' +
'        <div class="well">\n' +
'           <p class="text-muted">You have not added any skills yet.</p>\n' +
'           <button class="btn btn-default btn-sm" ng-click="c.openAddModal()">Add Your First Skill</button>\n' +
'        </div>\n' +
'     </div>\n' +
'     <div class="row-grid" ng-if="data.skills.length > 0">\n' +
'        <div class="col-md-6 col-grid" ng-repeat="skill in data.skills">\n' +
'           <div class="skill-card">\n' +
'              <div class="interest-stripe" ng-if="skill.interest == \'high\'"></div>\n' +
'              <div class="validation-badge validated" ng-if="skill.validation_status == \'validated\'" title="Manager Validated">\n' +
'                 <i class="fa fa-check-circle"></i>\n' +
'              </div>\n' +
'              <div class="validation-badge disputed" ng-if="skill.validation_status == \'disputed\'" title="Disputed by Manager">\n' +
'                 <i class="fa fa-exclamation-triangle"></i>\n' +
'              </div>\n' +
'              <div class="card-header-row">\n' +
'                 <div>\n' +
'                    <div class="skill-name">{{skill.name}}</div>\n' +
'                    <div class="skill-type">{{skill.category}}</div>\n' +
'                 </div>\n' +
'                 <i class="fa fa-ellipsis-h btn-more" ng-click="c.removeSkill(skill)" title="Remove"></i>\n' +
'              </div>\n' +
'              <div style="margin-bottom: 10px;">\n' +
'                 <div class="prof-label-row">\n' +
'                    <span>Proficiency</span>\n' +
'                    <span>{{skill.level_value * 20}}%</span>\n' +
'                 </div>\n' +
'                 <div class="interactive-bar-bg" ng-click="c.setProficiency(skill, $event)">\n' +
'                    <div class="interactive-bar-fill"\n' +
'                         ng-class="{\'bar-blue\': skill.level_value >= 4, \'bar-gray\': skill.level_value < 4}"\n' +
'                         ng-style="{width: (skill.level_value * 20) + \'%\'}"></div>\n' +
'                    <div class="hover-segments">\n' +
'                       <div class="segment-hit" ng-click="c.updateProficiency(skill, 1); $event.stopPropagation();" title="Novice"></div>\n' +
'                       <div class="segment-hit" ng-click="c.updateProficiency(skill, 2); $event.stopPropagation();" title="Learner"></div>\n' +
'                       <div class="segment-hit" ng-click="c.updateProficiency(skill, 3); $event.stopPropagation();" title="Proficient"></div>\n' +
'                       <div class="segment-hit" ng-click="c.updateProficiency(skill, 4); $event.stopPropagation();" title="Advanced"></div>\n' +
'                       <div class="segment-hit" ng-click="c.updateProficiency(skill, 5); $event.stopPropagation();" title="Expert"></div>\n' +
'                    </div>\n' +
'                 </div>\n' +
'              </div>\n' +
'              <div class="card-footer-row">\n' +
'                 <div class="endorsement-pill" ng-class="{\'active\': skill.endorsements > 0}">\n' +
'                    <i class="fa fa-thumbs-up"></i> {{skill.endorsements}}\n' +
'                 </div>\n' +
'                 <div class="interest-pill"\n' +
'                      ng-class="{\'inactive\': skill.interest != \'high\'}"\n' +
'                      ng-click="c.toggleInterest(skill)">\n' +
'                    <i class="fa fa-chart-line"></i> {{skill.interest == \'high\' ? \'High Interest\' : \'Set Interest\'}}\n' +
'                 </div>\n' +
'              </div>\n' +
'           </div>\n' +
'        </div>\n' +
'        <div class="col-md-6 col-grid">\n' +
'           <div class="add-card-placeholder" ng-click="c.openAddModal()">\n' +
'              <div class="add-icon-circle"><i class="fa fa-plus"></i></div>\n' +
'              <div style="font-weight:600;">Add New Skill</div>\n' +
'           </div>\n' +
'        </div>\n' +
'     </div>\n' +
'  </div>\n' +
'</div>\n' +
'<script type="text/ng-template" id="addSkillModal.html">\n' +
'   <div class="modal-header">\n' +
'       <h4 class="modal-title">Add New Skill</h4>\n' +
'   </div>\n' +
'   <div class="modal-body">\n' +
'       <div class="form-group">\n' +
'           <label>Search Skills Database</label>\n' +
'           <sn-record-picker field="newSkill" table="\'cmn_skill\'"\n' +
'                             display-field="\'name\'" value-field="\'sys_id\'"\n' +
'                             search-fields="\'name\'" page-size="100" >\n' +
'           </sn-record-picker>\n' +
'       </div>\n' +
'       <div class="alert alert-info small">\n' +
'           <i class="fa fa-info-circle"></i> Can\'t find a skill? <a href="?id=sc_cat_item&sys_id=REQUEST_NEW_SKILL_ID">Request it here.</a>\n' +
'       </div>\n' +
'   </div>\n' +
'   <div class="modal-footer">\n' +
'       <button class="btn btn-default" ng-click="cancel()">Cancel</button>\n' +
'       <button class="btn btn-primary" ng-click="save()" ng-disabled="!newSkill.value">Add Skill</button>\n' +
'   </div>\n' +
'</script>';

            mp.css = ':root { --cc-blue: #00799e; --cc-green: #60c659; --bg-slate: #f3f6f8; }\n' +
'.text-cc-blue { color: #00799e; }\n' +
'.bg-cc-blue { background-color: #00799e; }\n' +
'.text-slate-800 { color: #1e293b; }\n' +
'.text-slate-500 { color: #64748b; }\n' +
'.panel-transparent { background: transparent; border: none; box-shadow: none; }\n' +
'.row-grid { margin-left: -10px; margin-right: -10px; display: flex; flex-wrap: wrap; }\n' +
'.col-grid { padding-left: 10px; padding-right: 10px; margin-bottom: 20px; display: flex; }\n' +
'.profile-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 20px; }\n' +
'.profile-header-bg { height: 90px; background: linear-gradient(135deg, #00799e 0%, #005a75 100%); }\n' +
'.profile-content { padding: 0 20px 20px 20px; text-align: center; margin-top: -45px; }\n' +
'.profile-avatar-container { width: 90px; height: 90px; margin: 0 auto; background: white; padding: 4px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }\n' +
'.profile-avatar { width: 100%; height: 100%; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: #94a3b8; }\n' +
'.profile-name { margin-top: 15px; font-size: 18px; font-weight: 700; color: #1e293b; }\n' +
'.profile-meta { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 15px; }\n' +
'.profile-badges { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }\n' +
'.badge-pill { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; border: 1px solid transparent; }\n' +
'.badge-expert { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }\n' +
'.badge-verified { background: #f0fdf4; color: #15803d; border-color: #dcfce7; }\n' +
'.profile-stats { display: flex; border-top: 1px solid #e2e8f0; padding-top: 15px; }\n' +
'.stat-item { flex: 1; text-align: center; }\n' +
'.stat-item:first-child { border-right: 1px solid #e2e8f0; }\n' +
'.stat-value { font-size: 20px; font-weight: 800; color: #1e293b; line-height: 1.2; }\n' +
'.stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }\n' +
'.tier-card { background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; border-left: 4px solid #94a3b8; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative; overflow: hidden; }\n' +
'.tier-icon-bg { position: absolute; top: -15px; right: -15px; font-size: 100px; opacity: 0.04; }\n' +
'.tier-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: white; margin-bottom: 12px; }\n' +
'.tier-points { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1.2; margin-bottom: 4px; }\n' +
'.tier-tagline { font-size: 13px; color: #64748b; margin-bottom: 16px; }\n' +
'.tier-progress-section { border-top: 1px solid #f1f5f9; padding-top: 16px; }\n' +
'.tier-progress-labels { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }\n' +
'.tier-progress-track { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }\n' +
'.tier-progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }\n' +
'.tier-progress-hint { font-size: 12px; color: #64748b; }\n' +
'.tier-max-badge { text-align: center; font-size: 14px; font-weight: 700; color: #1e293b; padding: 8px 0; }\n' +
'.validation-badge { position: absolute; top: 8px; right: 8px; font-size: 14px; }\n' +
'.validation-badge.validated { color: #15803d; }\n' +
'.validation-badge.disputed { color: #dc2626; }\n' +
'.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }\n' +
'.section-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }\n' +
'.section-subtitle { font-size: 13px; color: #64748b; margin: 0; }\n' +
'.btn-add { background-color: #00799e; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 5px rgba(0,121,158,0.2); transition: all 0.2s; display: flex; align-items: center; gap: 6px; }\n' +
'.btn-add:hover { background-color: #006080; transform: translateY(-1px); }\n' +
'.skill-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; width: 100%; position: relative; overflow: hidden; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; flex-direction: column; }\n' +
'.skill-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); border-color: #cbd5e1; }\n' +
'.interest-stripe { position: absolute; top: 0; left: 0; bottom: 0; width: 4px; background: #60c659; }\n' +
'.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }\n' +
'.skill-name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }\n' +
'.skill-type { font-size: 10px; font-weight: 700; text-transform: uppercase; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; display: inline-block; }\n' +
'.btn-more { color: #cbd5e1; cursor: pointer; transition: color 0.2s; }\n' +
'.btn-more:hover { color: #64748b; }\n' +
'.prof-label-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; }\n' +
'.interactive-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; position: relative; cursor: pointer; }\n' +
'.interactive-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease, background-color 0.3s ease; }\n' +
'.bar-blue { background-color: #00799e; }\n' +
'.bar-gray { background-color: #94a3b8; }\n' +
'.hover-segments { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; opacity: 0; transition: opacity 0.2s; }\n' +
'.interactive-bar-bg:hover .hover-segments { opacity: 1; }\n' +
'.segment-hit { flex: 1; border-right: 1px solid white; }\n' +
'.segment-hit:last-child { border-right: none; }\n' +
'.card-footer-row { margin-top: auto; padding-top: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }\n' +
'.endorsement-pill { font-size: 12px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px; }\n' +
'.endorsement-pill.active { color: #00799e; }\n' +
'.interest-pill { font-size: 10px; font-weight: 700; color: #15803d; background: #f0fdf4; padding: 3px 8px; border-radius: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }\n' +
'.interest-pill:hover { border-color: #15803d; }\n' +
'.interest-pill.inactive { background: #f8fafc; color: #94a3b8; }\n' +
'.add-card-placeholder { width: 100%; height: 100%; min-height: 160px; border: 2px dashed #cbd5e1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; cursor: pointer; transition: all 0.2s; background: transparent; }\n' +
'.add-card-placeholder:hover { border-color: #00799e; background: #f0f9ff; color: #00799e; }\n' +
'.add-icon-circle { width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 18px; transition: background 0.2s; }\n' +
'.add-card-placeholder:hover .add-icon-circle { background: white; }';

            // Client script left unchanged
            mp.update();
            gs.info('[Skills Hub] My Profile patched (' + mp.getUniqueValue() + ')');
            results.patched++;
        }
    } catch (e) {
        gs.error('[Skills Hub] My Profile patch error: ' + e.message);
        results.errors++;
    }

    // ==================================================================
    // SUMMARY
    // ==================================================================
    gs.info('[Skills Hub] ============================================================');
    gs.info('[Skills Hub]  WIDGET PATCHES - COMPLETE');
    gs.info('[Skills Hub]  Patched: ' + results.patched + ' | Skipped: ' + results.skipped + ' | Errors: ' + results.errors);
    gs.info('[Skills Hub] ============================================================');
})();
