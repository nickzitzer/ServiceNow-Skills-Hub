/**
 * Fix Script: 58_find_expert_hierarchy_filters.js
 * Purpose: Make Find Expert user filters hierarchy-aware.
 *
 * Fixes:
 *   - Department filter includes the selected cmn_department and child departments.
 *   - Group filter includes the selected sys_user_group and child groups.
 *   - Business unit filter includes child core_company values when the filter value maps
 *     to a company hierarchy; otherwise it safely behaves as the existing exact match.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 58_find_expert_hierarchy_filters =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Find Expert');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] Find Expert widget not found. Aborting 58.');
            return;
        }

        var server = widget.getValue('script') || '';

        if (server.indexOf('Skills Hub Hierarchy Filters 58') < 0) {
            var helperBlock = [
                '',
                '  // Skills Hub Hierarchy Filters 58',
                '  function sh58RecordLabel(record) {',
                '      if (!record || !record.isValidRecord()) return "";',
                '      if (record.isValidField("name")) return record.getValue("name") || record.getDisplayValue();',
                '      return record.getDisplayValue();',
                '  }',
                '  function sh58AddHierarchyRoots(tableName, selectedLabel, allowed, queue, seen) {',
                '      var root = new GlideRecord(tableName);',
                '      if (!root.isValid()) return;',
                '      if (root.get(selectedLabel)) {',
                '          var rootId = root.getUniqueValue();',
                '          if (!seen[rootId]) {',
                '              seen[rootId] = true;',
                '              queue.push(rootId);',
                '          }',
                '          allowed[sh58RecordLabel(root)] = true;',
                '      }',
                '      if (!root.isValidField("name")) return;',
                '      var byName = new GlideRecord(tableName);',
                '      byName.addQuery("name", selectedLabel);',
                '      byName.query();',
                '      while (byName.next()) {',
                '          var id = byName.getUniqueValue();',
                '          if (!seen[id]) {',
                '              seen[id] = true;',
                '              queue.push(id);',
                '          }',
                '          allowed[sh58RecordLabel(byName)] = true;',
                '      }',
                '  }',
                '  function sh58HierarchyDisplaySet(tableName, selectedLabel) {',
                '      var allowed = {};',
                '      if (!selectedLabel) return allowed;',
                '      allowed[selectedLabel] = true;',
                '      var probe = new GlideRecord(tableName);',
                '      if (!probe.isValid()) return allowed;',
                '      var queue = [];',
                '      var seen = {};',
                '      sh58AddHierarchyRoots(tableName, selectedLabel, allowed, queue, seen);',
                '      if (!probe.isValidField("parent")) return allowed;',
                '      while (queue.length > 0) {',
                '          var parentIds = queue.splice(0, 25);',
                '          var child = new GlideRecord(tableName);',
                '          child.addQuery("parent", "IN", parentIds.join(","));',
                '          child.query();',
                '          while (child.next()) {',
                '              var childId = child.getUniqueValue();',
                '              if (seen[childId]) continue;',
                '              seen[childId] = true;',
                '              allowed[sh58RecordLabel(child)] = true;',
                '              queue.push(childId);',
                '          }',
                '      }',
                '      return allowed;',
                '  }',
                '  function sh58AllowsDisplay(selectedLabel, allowedSet, actualLabel) {',
                '      if (!selectedLabel) return true;',
                '      if (!actualLabel) return false;',
                '      return !!allowedSet[actualLabel];',
                '  }',
                '  function sh58UserInGroupHierarchy(userId, selectedGroup, groupSet) {',
                '      if (!selectedGroup) return true;',
                '      var gm = new GlideRecord("sys_user_grmember");',
                '      gm.addQuery("user", userId);',
                '      gm.query();',
                '      while (gm.next()) {',
                '          if (groupSet[gm.group.getDisplayValue()]) return true;',
                '      }',
                '      return false;',
                '  }',
                ''
            ].join('\n');

            var buildMarker = '  (function buildFindExpertFilterOptions() {';
            var buildStart = server.indexOf(buildMarker);
            var buildEnd = buildStart > -1 ? server.indexOf('  })();', buildStart) : -1;
            if (buildEnd > -1) {
                buildEnd += '  })();'.length;
                server = server.substring(0, buildEnd) + helperBlock + server.substring(buildEnd);
            } else {
                server = server.replace('(function() {', '(function() {\n' + helperBlock);
            }
        }

        if (server.indexOf('var departmentHierarchy = sh58HierarchyDisplaySet("cmn_department", departmentFilter);') < 0) {
            server = server.replace(
                '      var groupFilter = input.group || "";',
                [
                    '      var groupFilter = input.group || "";',
                    '      var departmentHierarchy = sh58HierarchyDisplaySet("cmn_department", departmentFilter);',
                    '      var businessUnitHierarchy = sh58HierarchyDisplaySet("core_company", businessUnitFilter);',
                    '      var groupHierarchy = sh58HierarchyDisplaySet("sys_user_group", groupFilter);'
                ].join('\n')
            );
        }

        server = replaceAll(
            server,
            '              if (departmentFilter && userRecord.getDisplayValue("department") != departmentFilter) continue;',
            '              if (!sh58AllowsDisplay(departmentFilter, departmentHierarchy, userRecord.getDisplayValue("department"))) continue;'
        );
        server = replaceAll(
            server,
            '              if (businessUnitFilter && sh40GetBusinessUnit(userRecord) != businessUnitFilter) continue;',
            '              if (!sh58AllowsDisplay(businessUnitFilter, businessUnitHierarchy, sh40GetBusinessUnit(userRecord))) continue;'
        );
        server = replaceAll(
            server,
            '              if (groupFilter && !sh40UserInGroup(uid, groupFilter)) continue;',
            '              if (!sh58UserInGroupHierarchy(uid, groupFilter, groupHierarchy)) continue;'
        );

        widget.setValue('script', server);
        widget.update();

        gs.info('[Skills Hub] Find Expert hierarchy filter server patch complete');
        gs.info('[Skills Hub] ===== COMPLETED 58_find_expert_hierarchy_filters =====');
    } catch (e) {
        gs.error('[Skills Hub] 58_find_expert_hierarchy_filters failed: ' + e.message);
    }
})();
