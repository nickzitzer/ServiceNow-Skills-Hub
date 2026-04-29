/**
 * Fix Script: 76_add_skill_library_tab.js
 * Purpose: Add a Skills Library tab to Skills Hub for faster skill discovery/add.
 *
 * Adds:
 *   - New widget: Skills Hub - Skill Library (id: skills-hub-library)
 *   - Search, category filter, uib-pagination, and table-style results
 *   - Add action that creates sys_user_has_skill for the current user
 *   - Container tab that embeds the new library widget
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 76_add_skill_library_tab =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        function upsertWidget(id, name, script, client, template, css) {
            var widget = new GlideRecord('sp_widget');
            widget.addQuery('id', id);
            widget.setLimit(1);
            widget.query();
            if (!widget.next()) {
                widget.initialize();
                widget.setValue('id', id);
                widget.setValue('name', name);
                widget.setValue('category', 'custom');
                widget.setValue('controller_as', 'c');
                widget.setValue('data_table', 'sp_instance');
                widget.setValue('public', false);
                widget.setValue('internal', false);
                widget.setValue('servicenow', false);
            }
            widget.setValue('script', script);
            widget.setValue('client_script', client);
            widget.setValue('template', template);
            widget.setValue('css', css);
            var widgetId = widget.isNewRecord() ? widget.insert() : widget.update();
            gs.info('[Skills Hub] Upserted widget ' + name + ' (' + widgetId + ')');
            return widgetId;
        }

        var libraryServer = [
            '(function() {',
            '  // Skills Hub Skill Library 76',
            '  data.pageSize = 25;',
            '  function sh76DefaultLevelForSkill(skillId) {',
            '      try {',
            '          var skill = new GlideRecord("cmn_skill");',
            '          if (!skill.get(skillId) || !skill.isValidField("level_type")) return "Novice";',
            '          var levelType = skill.getValue("level_type") || "";',
            '          if (!levelType) return "Novice";',
            '          var level = new GlideRecord("cmn_skill_level");',
            '          if (!level.isValid()) return "Novice";',
            '          var typeField = level.isValidField("skill_level_type") ? "skill_level_type" : (level.isValidField("level_type") ? "level_type" : "");',
            '          if (!typeField) return "Novice";',
            '          level.addQuery(typeField, levelType);',
            '          if (level.isValidField("value")) level.orderBy("value");',
            '          level.setLimit(1);',
            '          level.query();',
            '          if (level.next()) return level.getUniqueValue();',
            '      } catch (ignore) {}',
            '      return "Novice";',
            '  }',
            '  function sh76SkillIdsForCategory(categoryId) {',
            '      var ids = [];',
            '      if (!categoryId) return ids;',
            '      var rel = new GlideRecord("cmn_skill_m2m_category");',
            '      if (!rel.isValid()) return ids;',
            '      rel.addQuery("category", categoryId);',
            '      rel.query();',
            '      while (rel.next()) ids.push(rel.getValue("skill"));',
            '      return ids;',
            '  }',
            '  function sh76CategoryPath(skillId) {',
            '      var rel = new GlideRecord("cmn_skill_m2m_category");',
            '      if (!rel.isValid()) return "";',
            '      rel.addQuery("skill", skillId);',
            '      rel.setLimit(1);',
            '      rel.query();',
            '      if (!rel.next()) return "";',
            '      var cat = rel.category.getRefRecord();',
            '      if (!cat || !cat.isValidRecord()) return rel.category.getDisplayValue();',
            '      var names = [cat.getDisplayValue()];',
            '      var guard = 0;',
            '      while (cat.isValidField("parent") && cat.getValue("parent") && guard < 5) {',
            '          guard++;',
            '          cat = cat.parent.getRefRecord();',
            '          if (!cat || !cat.isValidRecord()) break;',
            '          names.unshift(cat.getDisplayValue());',
            '      }',
            '      return names.join(" > ");',
            '  }',
            '  function sh76AlreadyAdded(skillId) {',
            '      var has = new GlideRecord("sys_user_has_skill");',
            '      has.addQuery("user", gs.getUserID());',
            '      has.addQuery("skill", skillId);',
            '      has.setLimit(1);',
            '      has.query();',
            '      return has.hasNext();',
            '  }',
            '  function sh76BuildQuery(skillGr, term, categoryId) {',
            '      if (skillGr.isValidField("active")) skillGr.addQuery("active", true);',
            '      if (term) skillGr.addQuery("name", "CONTAINS", term);',
            '      if (categoryId) {',
            '          var ids = sh76SkillIdsForCategory(categoryId);',
            '          if (ids.length == 0) skillGr.addQuery("sys_id", "IN", "");',
            '          else skillGr.addQuery("sys_id", "IN", ids.join(","));',
            '      }',
            '  }',
            '  if (input && input.action == "addSkill") {',
            '      data.added = false;',
            '      var skillId = input.skill_id || "";',
            '      var skill = new GlideRecord("cmn_skill");',
            '      if (skillId && skill.get(skillId) && !sh76AlreadyAdded(skillId)) {',
            '          var rec = new GlideRecord("sys_user_has_skill");',
            '          rec.initialize();',
            '          rec.setValue("user", gs.getUserID());',
            '          rec.setValue("skill", skillId);',
            '          rec.setValue("skill_level", sh76DefaultLevelForSkill(skillId));',
            '          if (rec.isValidField("u_interest_level")) rec.setValue("u_interest_level", "medium");',
            '          if (rec.isValidField("u_validation_status")) rec.setValue("u_validation_status", "pending");',
            '          data.added = !!rec.insert();',
            '      }',
            '  }',
            '  var page = parseInt((input && input.page) || "1", 10);',
            '  if (isNaN(page) || page < 1) page = 1;',
            '  var pageSize = parseInt((input && input.page_size) || data.pageSize, 10);',
            '  if (isNaN(pageSize) || pageSize < 1) pageSize = 25;',
            '  if (pageSize > 50) pageSize = 50;',
            '  var term = ((input && input.term) || "").trim();',
            '  var categoryId = (input && input.category_id) || "";',
            '  var count = new GlideAggregate("cmn_skill");',
            '  sh76BuildQuery(count, term, categoryId);',
            '  count.addAggregate("COUNT");',
            '  count.query();',
            '  data.total = 0;',
            '  if (count.next()) data.total = parseInt(count.getAggregate("COUNT"), 10) || 0;',
            '  data.skills = [];',
            '  var skillGr = new GlideRecord("cmn_skill");',
            '  sh76BuildQuery(skillGr, term, categoryId);',
            '  skillGr.orderBy("name");',
            '  skillGr.chooseWindow((page - 1) * pageSize, page * pageSize);',
            '  skillGr.query();',
            '  while (skillGr.next()) {',
            '      var id = skillGr.getUniqueValue();',
            '      data.skills.push({',
            '          sys_id: id,',
            '          name: skillGr.getValue("name") || skillGr.getDisplayValue(),',
            '          description: skillGr.isValidField("description") ? (skillGr.getValue("description") || "") : "",',
            '          category_path: sh76CategoryPath(id),',
            '          already_added: sh76AlreadyAdded(id),',
            '          created_on: skillGr.getDisplayValue("sys_created_on")',
            '      });',
            '  }',
            '  data.page = page;',
            '  data.pageSize = pageSize;',
            '  data.term = term;',
            '  data.categoryId = categoryId;',
            '})();'
        ].join('\n');

        var libraryClient = [
            'function($scope, spUtil) {',
            '  var c = this;',
            '  // Skills Hub Skill Library 76',
            '  c.term = c.data.term || "";',
            '  c.page = c.data.page || 1;',
            '  c.pageSize = c.data.pageSize || 25;',
            '  c.categoryFilter = { displayValue: "", value: c.data.categoryId || "", name: "library_category_filter" };',
            '  c.loading = false;',
            '  c.load = function(page) {',
            '    c.loading = true;',
            '    c.page = page || c.page || 1;',
            '    c.server.get({',
            '      action: "list",',
            '      term: c.term || "",',
            '      page: c.page,',
            '      page_size: c.pageSize,',
            '      category_id: (c.categoryFilter && c.categoryFilter.value) || ""',
            '    }).then(function(r) {',
            '      c.loading = false;',
            '      c.data.skills = r.data.skills || [];',
            '      c.data.total = r.data.total || 0;',
            '      c.data.page = r.data.page || c.page;',
            '      c.data.pageSize = r.data.pageSize || c.pageSize;',
            '    });',
            '  };',
            '  c.search = function() { c.load(1); };',
            '  c.onCategoryChange = function() { c.load(1); };',
            '  c.clearFilters = function() {',
            '    c.term = "";',
            '    c.categoryFilter = { displayValue: "", value: "", name: "library_category_filter" };',
            '    c.load(1);',
            '  };',
            '  c.addSkill = function(skill) {',
            '    if (!skill || skill.already_added || c.loading) return;',
            '    skill.adding = true;',
            '    c.server.get({ action: "addSkill", skill_id: skill.sys_id, term: c.term || "", page: c.page, page_size: c.pageSize, category_id: (c.categoryFilter && c.categoryFilter.value) || "" }).then(function(r) {',
            '      skill.adding = false;',
            '      if (r.data.added) {',
            '        skill.already_added = true;',
            '        spUtil.addInfoMessage("Added " + skill.name + " to your profile.");',
            '      } else {',
            '        spUtil.addInfoMessage(skill.name + " is already on your profile.");',
            '        skill.already_added = true;',
            '      }',
            '    });',
            '  };',
            '}'
        ].join('\n');

        var libraryTemplate = [
            '<div class="skills-library-panel panel panel-default b">',
            '  <div class="panel-heading library-panel-heading">',
            '    <span class="panel-title" role="heading" aria-level="2"><i class="fa fa-book m-r"></i> Skill Library</span>',
            '    <span class="library-count pull-right">{{c.data.total || 0}} skills</span>',
            '    <div class="clearfix"></div>',
            '  </div>',
            '  <div class="library-toolbar panel-body">',
            '    <div class="library-search">',
            '      <label>Search</label>',
            '      <div class="input-group">',
            '        <input type="text" class="form-control" ng-model="c.term" ng-keypress="$event.which === 13 && c.search()" placeholder="Search skills">',
            '        <span class="input-group-btn">',
            '          <button class="btn btn-primary" type="button" ng-click="c.search()"><i class="fa fa-search"></i></button>',
            '        </span>',
            '      </div>',
            '    </div>',
            '    <div class="library-category">',
            '      <label>Category</label>',
            '      <sn-record-picker field="c.categoryFilter" table="\'cmn_skill_category\'" display-field="\'name\'" value-field="\'sys_id\'" search-fields="\'name\'" page-size="20" on-change="c.onCategoryChange()"></sn-record-picker>',
            '    </div>',
            '    <div class="library-actions">',
            '      <button class="btn btn-default" ng-click="c.clearFilters()">Clear</button>',
            '    </div>',
            '  </div>',
            '  <div class="panel-body library-loading" ng-if="c.loading"><i class="fa fa-spinner fa-spin"></i> Loading skills...</div>',
            '  <div class="panel-body library-table-body" ng-if="!c.loading">',
            '    <table class="table table-striped table-responsive uib-table skills-library-table" ng-if="(c.data.skills || []).length">',
            '      <thead>',
            '        <tr>',
            '          <th>Skill</th>',
            '          <th>Category</th>',
            '          <th>Status</th>',
            '          <th class="text-right">Action</th>',
            '        </tr>',
            '      </thead>',
            '      <tbody>',
            '        <tr ng-repeat="skill in c.data.skills">',
            '          <td>',
            '            <div class="library-skill-name">{{skill.name}}</div>',
            '            <div class="library-description" ng-if="skill.description">{{skill.description}}</div>',
            '          </td>',
            '          <td><span class="library-category-pill">{{skill.category_path || "Uncategorized"}}</span></td>',
            '          <td>',
            '            <span class="label label-success" ng-if="skill.already_added">On profile</span>',
            '            <span class="label label-default" ng-if="!skill.already_added">Available</span>',
            '          </td>',
            '          <td class="text-right">',
            '            <button class="btn btn-sm btn-primary" ng-click="c.addSkill(skill)" ng-disabled="skill.already_added || skill.adding">',
            '              <i class="fa" ng-class="{\'fa-spinner fa-spin\': skill.adding, \'fa-plus\': !skill.adding && !skill.already_added, \'fa-check\': skill.already_added}"></i>',
            '              {{skill.already_added ? "Added" : "Add"}}',
            '            </button>',
            '          </td>',
            '        </tr>',
            '      </tbody>',
            '    </table>',
            '    <div class="alert alert-info library-empty" ng-if="(c.data.skills || []).length == 0">No matching skills found.</div>',
            '  </div>',
            '  <div class="panel-footer library-pagination-footer" ng-if="(c.data.total || 0) > 0">',
            '    <div class="pull-left library-range">Rows {{((c.page - 1) * c.pageSize) + 1}} - {{c.data.total < c.page * c.pageSize ? c.data.total : c.page * c.pageSize}} of {{c.data.total}}</div>',
            '    <uib-pagination ng-if="(c.data.total || 0) > c.pageSize" total-items="c.data.total" ng-model="c.page" items-per-page="c.pageSize" max-size="5" boundary-links="true" rotate="false" ng-change="c.load(c.page)" class="pagination-sm pull-right"></uib-pagination>',
            '    <div class="clearfix"></div>',
            '  </div>',
            '</div>'
        ].join('\n');

        var libraryCss = [
            '/* Skills Hub Skill Library 76 */',
            '.skills-library-panel { border-color:#e2e8f0; border-radius:8px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.05); }',
            '.library-panel-heading { padding:10px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }',
            '.library-panel-heading .panel-title { color:#1e293b; font-size:16px; font-weight:800; }',
            '.library-panel-heading .panel-title i { color:#0078bf; }',
            '.library-count { padding:3px 9px; border-radius:999px; background:#e8f4fb; color:#005a8f; font-size:12px; font-weight:800; white-space:nowrap; }',
            '.library-toolbar { display:grid; grid-template-columns:minmax(220px,1.2fr) minmax(220px,1fr) auto; gap:12px; align-items:end; border-bottom:1px solid #edf2f7; }',
            '.library-toolbar label { display:block; font-size:11px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:5px; }',
            '.library-category .select2-container { width:100% !important; }',
            '.library-category .select2-choice, .library-category .select2-choices { min-height:34px !important; border:1px solid #cbd5e1 !important; border-radius:6px !important; box-shadow:none !important; }',
            '.library-actions .btn { height:34px; }',
            '.library-table-body { overflow:auto; padding:0; }',
            '.skills-library-table { margin-bottom:0; }',
            '.skills-library-table > thead > tr > th { border:1px solid #ddd; border-top:0; color:#428bca; font-size:12px; font-weight:800; vertical-align:middle; background:#fff; }',
            '.skills-library-table > thead > tr > th:first-child { border-left:none; }',
            '.skills-library-table > thead > tr > th:last-child { border-right:none; }',
            '.skills-library-table tbody td { vertical-align:middle !important; }',
            '.library-skill-name { font-size:14px; font-weight:800; color:#1e293b; }',
            '.library-description { max-width:620px; margin-top:2px; color:#64748b; font-size:12px; line-height:1.35; }',
            '.library-category-pill { display:inline-block; max-width:360px; padding:3px 7px; border-radius:6px; background:#f1f5f9; color:#475569; font-size:11px; font-weight:700; white-space:normal; }',
            '.library-loading, .library-empty { margin:0; padding:24px; text-align:center; color:#64748b; }',
            '.library-pagination-footer { min-height:48px; }',
            '.library-pagination-footer .pagination { margin:0; }',
            '.library-range { margin-top:6px; color:#64748b; font-size:13px; font-weight:600; }',
            '@media (max-width: 800px) { .library-toolbar { grid-template-columns:1fr; } .library-header { flex-direction:column; } }'
        ].join('\n');

        upsertWidget('skills-hub-library', 'Skills Hub - Skill Library', libraryServer, libraryClient, libraryTemplate, libraryCss);

        var container = new GlideRecord('sp_widget');
        container.addQuery('id', 'skills-hub-container');
        container.setLimit(1);
        container.query();
        if (!container.next()) {
            gs.warn('[Skills Hub] Container widget not found; Skill Library widget created but not embedded');
        } else {
            var cServer = container.getValue('script') || '';
            var cTemplate = container.getValue('template') || '';
            if (cServer.indexOf('libraryWidget') < 0) {
                cServer = cServer.replace(
                    '  data.matrixWidget = $sp.getWidget("skills-hub-matrix", {});',
                    '  data.matrixWidget = $sp.getWidget("skills-hub-matrix", {});\n  data.libraryWidget = $sp.getWidget("skills-hub-library", {});'
                );
            }
            if (cTemplate.indexOf('Skill Library') < 0) {
                var libraryTab = [
                    '    <uib-tab index="2" heading="Skill Library">',
                    '      <div style="padding-top:15px;">',
                    '         <sp-widget widget="c.data.libraryWidget"></sp-widget>',
                    '      </div>',
                    '    </uib-tab>',
                    '    <uib-tab index="3" heading="Team Matrix" ng-if="c.data.isManager">'
                ].join('\n');
                cTemplate = cTemplate.replace(
                    '    <uib-tab index="2" heading="Team Matrix" ng-if="c.data.isManager">',
                    libraryTab
                );
            }
            container.setValue('script', cServer);
            container.setValue('template', cTemplate);
            container.update();
            gs.info('[Skills Hub] Container embedded Skill Library tab');
        }

        gs.info('[Skills Hub] ===== COMPLETED 76_add_skill_library_tab =====');
    } catch (e) {
        gs.error('[Skills Hub] 76_add_skill_library_tab failed: ' + e.message);
    }
})();
