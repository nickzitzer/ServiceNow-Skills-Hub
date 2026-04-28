/**
 * Fix Script: 40_stabilize_find_expert.js
 * Purpose: Stabilize Find Expert search and endorsement UX.
 *
 * Fixes:
 *   - Department, business-unit, and group filters.
 *   - Blank skill names are excluded from typeahead/results.
 *   - Search result entries show whether the current user already endorsed them.
 *   - Endorse action updates the visible count/state immediately.
 *   - Selected skill pills stay attached to the input area.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 40_stabilize_find_expert =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Find Expert');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] Find Expert widget not found. Aborting 40.');
            return;
        }
        var widgetId = widget.getUniqueValue();

        // ------------------------------------------------------------------
        // Server script
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var server = widget.getValue('script') || '';

        if (server.indexOf('Skills Hub Stabilization 40') < 0) {
            server = server.replace('(function() {', [
                '(function() {',
                '  // Skills Hub Stabilization 40',
                '  data.filterOptions = data.filterOptions || { departments: [], business_units: [], groups: [] };',
                '  function sh40PushUnique(list, seen, value) {',
                '      if (!value || seen[value]) return;',
                '      seen[value] = true;',
                '      list.push(value);',
                '  }',
                '  function sh40GetBusinessUnit(userGr) {',
                '      if (userGr.isValidField("u_business_unit") && userGr.getDisplayValue("u_business_unit")) return userGr.getDisplayValue("u_business_unit");',
                '      if (userGr.isValidField("business_unit") && userGr.getDisplayValue("business_unit")) return userGr.getDisplayValue("business_unit");',
                '      if (userGr.getDisplayValue("company")) return userGr.getDisplayValue("company");',
                '      return "";',
                '  }',
                '  function sh40UserInGroup(userId, groupName) {',
                '      if (!groupName) return true;',
                '      var gm = new GlideRecord("sys_user_grmember");',
                '      gm.addQuery("user", userId);',
                '      gm.addQuery("group.name", groupName);',
                '      gm.setLimit(1);',
                '      gm.query();',
                '      return gm.hasNext();',
                '  }',
                '  (function buildFindExpertFilterOptions() {',
                '      var depSeen = {}, buSeen = {}, groupSeen = {};',
                '      var u = new GlideRecord("sys_user");',
                '      u.addActiveQuery();',
                '      u.addNotNullQuery("department");',
                '      u.orderBy("department.name");',
                '      u.setLimit(500);',
                '      u.query();',
                '      while (u.next()) {',
                '          sh40PushUnique(data.filterOptions.departments, depSeen, u.getDisplayValue("department"));',
                '          sh40PushUnique(data.filterOptions.business_units, buSeen, sh40GetBusinessUnit(u));',
                '      }',
                '      var g = new GlideRecord("sys_user_group");',
                '      g.addActiveQuery();',
                '      g.orderBy("name");',
                '      g.setLimit(250);',
                '      g.query();',
                '      while (g.next()) sh40PushUnique(data.filterOptions.groups, groupSeen, g.getValue("name"));',
                '  })();'
            ].join('\n'));
        }

        server = replaceAll(server,
            'var term = (input.term || "").toLowerCase();',
            'var term = (input.term || "").toLowerCase();');
        if (server.indexOf('if (!sName) continue;') < 0) {
            server = server.replace(
                '              var sName = sg.getValue("name");\n              if (!seen[sName]) {',
                '              var sName = sg.getValue("name");\n              if (!sName) continue;\n              if (!seen[sName]) {');
        }

        if (server.indexOf('var departmentFilter = input.department || "";') < 0) {
            server = server.replace(
                '      var allNames = mustNames.concat(niceNames);',
                [
                    '      var allNames = mustNames.concat(niceNames);',
                    '      var departmentFilter = input.department || "";',
                    '      var businessUnitFilter = input.business_unit || "";',
                    '      var groupFilter = input.group || "";'
                ].join('\n'));
        }

        if (server.indexOf('var userRecord = gr.user.getRefRecord();') < 0) {
            server = server.replace(
                '              var uid = gr.user.toString();',
                [
                    '              var uid = gr.user.toString();',
                    '              var userRecord = gr.user.getRefRecord();',
                    '              if (departmentFilter && userRecord.getDisplayValue("department") != departmentFilter) continue;',
                    '              if (businessUnitFilter && sh40GetBusinessUnit(userRecord) != businessUnitFilter) continue;',
                    '              if (groupFilter && !sh40UserInGroup(uid, groupFilter)) continue;'
                ].join('\n'));
        }

        if (server.indexOf('endorsedByMe.addQuery("u_endorser", gs.getUserID())') < 0) {
            server = server.replace(
                '              users[uid].skillGroups[skillNm].entries.push({\n                  skill_record_id: gr.getUniqueValue(),',
                [
                    '              var entryId = gr.getUniqueValue();',
                    '              var endorsedByMe = new GlideRecord("u_m2m_skill_endorsement");',
                    '              endorsedByMe.addQuery("u_skill_record", entryId);',
                    '              endorsedByMe.addQuery("u_endorser", gs.getUserID());',
                    '              endorsedByMe.setLimit(1);',
                    '              endorsedByMe.query();',
                    '              users[uid].skillGroups[skillNm].entries.push({',
                    '                  skill_record_id: entryId,'
                ].join('\n'));

            server = server.replace(
                '                  endorsements: parseInt(gr.u_peer_endorsement_count.toString() || "0")',
                '                  endorsements: parseInt(gr.u_peer_endorsement_count.toString() || "0"),\n                  endorsed_by_me: endorsedByMe.hasNext()');
        }

        if (server.indexOf('data.endorsementCount = parseInt') < 0) {
            server = server.replace(
                '                 if (newId) {\n                    data.endorsed = true;',
                [
                    '                 if (newId) {',
                    '                    data.endorsed = true;',
                    '                    var currentCount = parseInt(skillRec.getValue("u_peer_endorsement_count") || "0", 10);',
                    '                    skillRec.setValue("u_peer_endorsement_count", currentCount + 1);',
                    '                    skillRec.update();',
                    '                    data.endorsementCount = parseInt(skillRec.getValue("u_peer_endorsement_count") || "0", 10);'
                ].join('\n'));
        }

        widget.setValue('script', server);
        widget.update();
        gs.info('[Skills Hub] Find Expert server patched');

        // ------------------------------------------------------------------
        // Client script
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var client = widget.getValue('client_script') || '';

        if (client.indexOf('Skills Hub Stabilization 40') < 0) {
            client = client.replace('  c.results = [];', [
                '  c.results = [];',
                '',
                '  // Skills Hub Stabilization 40',
                '  c.departmentFilter = "";',
                '  c.businessUnitFilter = "";',
                '  c.groupFilter = "";',
                '  c.filterOptions = c.data.filterOptions || { departments: [], business_units: [], groups: [] };'
            ].join('\n'));
        }

        client = client.replace(
            '      niceHave: c.niceChips.join(",")\n    }).then(function(r) {',
            '      niceHave: c.niceChips.join(","),\n      department: c.departmentFilter,\n      business_unit: c.businessUnitFilter,\n      group: c.groupFilter\n    }).then(function(r) {');

        if (client.indexOf('entry.endorsed_by_me = true;') < 0) {
            client = client.replace(
                '      if (r.data.endorsed) {\n        spUtil.addInfoMessage("Endorsed " + expert.name + "!");',
                [
                    '      if (r.data.endorsed) {',
                    '        entry.endorsed_by_me = true;',
                    '        entry.endorsements = r.data.endorsementCount || ((parseInt(entry.endorsements, 10) || 0) + 1);',
                    '        spUtil.addInfoMessage("Endorsed " + expert.name + "!");'
                ].join('\n'));
        }

        widget.setValue('client_script', client);
        widget.update();
        gs.info('[Skills Hub] Find Expert client patched');

        // ------------------------------------------------------------------
        // Template
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var template = widget.getValue('template') || '';

        if (template.indexOf('filter-row') < 0) {
            template = template.replace(
                '      <button class="btn btn-primary" ng-click="c.search()"',
                [
                    '      <div class="filter-row">',
                    '        <select class="form-control input-sm" ng-model="c.businessUnitFilter" ng-options="v for v in c.filterOptions.business_units">',
                    '          <option value="">All business units</option>',
                    '        </select>',
                    '        <select class="form-control input-sm" ng-model="c.departmentFilter" ng-options="v for v in c.filterOptions.departments">',
                    '          <option value="">All departments</option>',
                    '        </select>',
                    '        <select class="form-control input-sm" ng-model="c.groupFilter" ng-options="v for v in c.filterOptions.groups">',
                    '          <option value="">All groups</option>',
                    '        </select>',
                    '      </div>',
                    '',
                    '      <button class="btn btn-primary" ng-click="c.search()"'
                ].join('\n'));
        }

        template = replaceAll(template,
            '<button class="btn btn-xs btn-endorse" ng-click="c.endorse(expert, ent)"',
            '<button class="btn btn-xs btn-endorse" ng-class="{\'endorsed\': ent.endorsed_by_me}" ng-disabled="ent.endorsed_by_me" ng-click="c.endorse(expert, ent)"');
        template = replaceAll(template,
            '<button class="btn btn-xs btn-endorse" ng-click="c.endorse(expert, sg.entries[0])"',
            '<button class="btn btn-xs btn-endorse" ng-class="{\'endorsed\': sg.entries[0].endorsed_by_me}" ng-disabled="sg.entries[0].endorsed_by_me" ng-click="c.endorse(expert, sg.entries[0])"');
        template = replaceAll(template,
            'uib-tooltip="Endorse this skill">',
            'uib-tooltip="{{ent.endorsed_by_me ? \'Already endorsed by you\' : \'Endorse this skill\'}}">');
        template = template.replace(
            'uib-tooltip="{{ent.endorsed_by_me ? \'Already endorsed by you\' : \'Endorse this skill\'}}">\n                    <i class="fa fa-thumbs-up"></i>\n                  </button>\n                </div>\n              </div>',
            'uib-tooltip="{{ent.endorsed_by_me ? \'Already endorsed by you\' : \'Endorse this skill\'}}">\n                    <i class="fa" ng-class="{\'fa-check\': ent.endorsed_by_me, \'fa-thumbs-up\': !ent.endorsed_by_me}"></i>\n                  </button>\n                </div>\n              </div>');
        template = template.replace(
            'uib-tooltip="{{ent.endorsed_by_me ? \'Already endorsed by you\' : \'Endorse this skill\'}}">\n                    <i class="fa fa-thumbs-up"></i>\n                  </button>\n                </div>\n              </div>\n            </div>\n          </div>',
            'uib-tooltip="{{sg.entries[0].endorsed_by_me ? \'Already endorsed by you\' : \'Endorse this skill\'}}">\n                    <i class="fa" ng-class="{\'fa-check\': sg.entries[0].endorsed_by_me, \'fa-thumbs-up\': !sg.entries[0].endorsed_by_me}"></i>\n                  </button>\n                </div>\n              </div>\n            </div>\n          </div>');

        widget.setValue('template', template);
        widget.update();
        gs.info('[Skills Hub] Find Expert template patched');

        // ------------------------------------------------------------------
        // CSS
        // ------------------------------------------------------------------
        widget = new GlideRecord('sp_widget');
        widget.get(widgetId);
        var css = widget.getValue('css') || '';
        if (css.indexOf('Skills Hub Stabilization 40') < 0) {
            css += [
                '',
                '/* Skills Hub Stabilization 40 */',
                '.filter-row { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin:0 0 14px 0; }',
                '.chip-list { margin-top:0; padding:6px 8px; min-height:34px; border:1px solid #dbe4ea; border-top:0; border-radius:0 0 8px 8px; background:#f8fafc; display:flex; flex-wrap:wrap; gap:6px; }',
                '.skill-chip { margin:0; }',
                '.btn-endorse.endorsed, .btn-endorse[disabled] { background:#e6f4eb !important; color:#00843d !important; border-color:#00843d !important; opacity:1; }',
                '@media (max-width: 768px) { .filter-row { grid-template-columns:1fr; } }'
            ].join('\n');
        }
        widget.setValue('css', css);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 40_stabilize_find_expert =====');
    } catch (e) {
        gs.error('[Skills Hub] 40_stabilize_find_expert failed: ' + e.message);
    }
})();
