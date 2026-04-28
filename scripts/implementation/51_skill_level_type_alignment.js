/**
 * Fix Script: 51_skill_level_type_alignment.js
 * Purpose: Align Skills Hub labels/scoring to ServiceNow skill level types.
 *
 * Model:
 *   - cmn_skill.level_type is the level-scale source for each skill.
 *   - cmn_skill_level rows under that type define labels/descriptions.
 *   - cmn_skill_level.value is the numeric score/rank used for bars/scoring.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 51_skill_level_type_alignment =====');

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

        var resolverBlock = [
            '  // Skills Hub Level Alignment 51',
            '  function sh51DefaultLevelScale() {',
            '      return [',
            '          {value: 1, label: "Novice", desc: "Aware of the skill; beginning to learn fundamentals"},',
            '          {value: 2, label: "Learner", desc: "Developing capability; needs guidance and supervision"},',
            '          {value: 3, label: "Proficient", desc: "Competent; works independently with consistent results"},',
            '          {value: 4, label: "Advanced", desc: "Highly skilled; mentors others and handles complex scenarios"},',
            '          {value: 5, label: "Expert", desc: "Authority in the field; drives best practices and innovation"}',
            '      ];',
            '  }',
            '  function sh51LevelTypeField(levelGR) {',
            '      if (levelGR.isValidField("level_type")) return "level_type";',
            '      if (levelGR.isValidField("skill_level_type")) return "skill_level_type";',
            '      return "";',
            '  }',
            '  function sh51GetLevelScaleForSkill(skillSysId) {',
            '      var fallback = sh51DefaultLevelScale();',
            '      if (!skillSysId) return fallback;',
            '      var skillGR = new GlideRecord("cmn_skill");',
            '      if (!skillGR.get(skillSysId) || !skillGR.isValidField("level_type")) return fallback;',
            '      var levelType = skillGR.getValue("level_type") || "";',
            '      if (!levelType) return fallback;',
            '      var levelGR = new GlideRecord("cmn_skill_level");',
            '      if (!levelGR.isValid() || !levelGR.isValidField("value")) return fallback;',
            '      var typeField = sh51LevelTypeField(levelGR);',
            '      if (!typeField) return fallback;',
            '      levelGR.addQuery(typeField, levelType);',
            '      levelGR.orderBy("value");',
            '      levelGR.query();',
            '      var scale = [];',
            '      while (levelGR.next()) {',
            '          var rawValue = parseInt(levelGR.getValue("value"), 10);',
            '          if (isNaN(rawValue)) rawValue = scale.length + 1;',
            '          scale.push({',
            '              sys_id: levelGR.getUniqueValue(),',
            '              value: rawValue,',
            '              label: levelGR.getDisplayValue() || levelGR.getValue("name") || String(rawValue),',
            '              desc: levelGR.isValidField("description") ? (levelGR.getValue("description") || "") : ""',
            '          });',
            '      }',
            '      return scale.length > 0 ? scale : fallback;',
            '  }',
            '  function sh51LevelToValue(skillSysId, levelDisplay) {',
            '      var text = (levelDisplay || "").toLowerCase();',
            '      var scale = sh51GetLevelScaleForSkill(skillSysId);',
            '      for (var i = 0; i < scale.length; i++) {',
            '          if (String(scale[i].label).toLowerCase() == text) return scale[i].value;',
            '      }',
            '      if (text.indexOf("expert") > -1) return 5;',
            '      if (text.indexOf("advanced") > -1) return 4;',
            '      if (text.indexOf("proficient") > -1) return 3;',
            '      if (text.indexOf("learner") > -1 || text.indexOf("intermediate") > -1) return 2;',
            '      return 1;',
            '  }',
            '  function sh51LevelForValue(skillSysId, value) {',
            '      var numeric = parseInt(value, 10);',
            '      var scale = sh51GetLevelScaleForSkill(skillSysId);',
            '      var closest = scale[0];',
            '      for (var i = 0; i < scale.length; i++) {',
            '          if (scale[i].value == numeric) return scale[i];',
            '          if (scale[i].value <= numeric) closest = scale[i];',
            '      }',
            '      return closest || {value: numeric || 1, label: "Novice", desc: ""};',
            '  }',
            '  function sh51SetSkillLevel(record, numericValue) {',
            '      var level = sh51LevelForValue(record.getValue("skill"), numericValue);',
            '      try { record.skill_level.setDisplayValue(level.label); } catch (ignore) {}',
            '      if (String(record.getDisplayValue("skill_level") || "").toLowerCase() != String(level.label || "").toLowerCase()) {',
            '          record.setValue("skill_level", level.sys_id || level.label);',
            '      }',
            '  }',
            ''
        ].join('\n');

        // ------------------------------------------------------------------
        // My Profile
        // ------------------------------------------------------------------
        var profile = getWidget('Skills Hub - My Profile');
        if (profile) {
            var pServer = profile.getValue('script') || '';
            var pClient = profile.getValue('client_script') || '';
            var pTemplate = profile.getValue('template') || '';

            if (pServer.indexOf('Skills Hub Level Alignment 51') < 0) {
                pServer = pServer.replace('(function() {', '(function() {\n' + resolverBlock);
            }

            pServer = pServer.replace(
                '           var levelStrings = ["", "Novice", "Learner", "Proficient", "Advanced", "Expert"];\n           gr.skill_level = levelStrings[input.level_value] || "Novice";',
                '           sh51SetSkillLevel(gr, input.level_value);'
            );
            pServer = pServer.replace(
                '          ns.setValue("skill_level", "Novice");',
                '          sh51SetSkillLevel(ns, 1);'
            );
            pServer = pServer.replace(
                '           newSkill.skill_level = "Novice";',
                '           sh51SetSkillLevel(newSkill, 1);'
            );

            if (pServer.indexOf('level_scale: sh51GetLevelScaleForSkill(skillSysId)') < 0) {
                pServer = pServer.replace(
                    '    var levelStr = s.skill_level.toString();\n    var levelInt = 1;',
                    '    var levelStr = s.skill_level.getDisplayValue() || s.skill_level.toString();\n    var levelInt = sh51LevelToValue(skillSysId, levelStr);\n    var levelScale = sh51GetLevelScaleForSkill(skillSysId);\n    var levelMeta = sh51LevelForValue(skillSysId, levelInt);'
                );
                pServer = pServer.replace(
                    '    if (levelStr.indexOf("Novice") > -1) levelInt = 1;\n    else if (levelStr.indexOf("Learner") > -1) levelInt = 2;\n    else if (levelStr.indexOf("Intermediate") > -1) levelInt = 2;\n    else if (levelStr.indexOf("Proficient") > -1) levelInt = 3;\n    else if (levelStr.indexOf("Advanced") > -1) levelInt = 4;\n    else if (levelStr.indexOf("Expert") > -1) levelInt = 5;\n\n',
                    ''
                );
                pServer = pServer.replace(
                    '      level_display: levelStr,\n      level_value: levelInt,',
                    '      level_display: levelMeta.label,\n      level_label: levelMeta.label,\n      level_description: levelMeta.desc,\n      level_value: levelInt,\n      level_scale: levelScale,'
                );
            }

            if (pClient.indexOf('c.levelLabel') < 0) {
                pClient = pClient.replace(
                    '  c.profColor = function(val) {',
                    [
                        '  c.levelLabel = function(entry) {',
                        '    return (entry && (entry.level_label || entry.level_display)) || c.profLevelName(entry && entry.level_value);',
                        '  };',
                        '  c.levelDescription = function(entry, fallback) {',
                        '    return (entry && entry.level_description) || fallback || "";',
                        '  };',
                        '',
                        '  c.profColor = function(val) {'
                    ].join('\n')
                );
            }

            pTemplate = replaceAll(pTemplate, '{{c.profLevelName(skill.entries[0].level_value)}}', '{{c.levelLabel(skill.entries[0])}}');
            pTemplate = replaceAll(pTemplate, '{{c.profLevelName(entry.level_value)}}', '{{c.levelLabel(entry)}}');

            pTemplate = replaceAll(
                pTemplate,
                'uib-tooltip="Novice - Aware of skill, beginning to learn"',
                'uib-tooltip="{{c.levelDescription(skill.entries[0], \'Aware of skill, beginning to learn\')}}"'
            );
            pTemplate = replaceAll(
                pTemplate,
                'uib-tooltip="Learner - Developing, needs guidance"',
                'uib-tooltip="{{c.levelDescription(skill.entries[0], \'Developing, needs guidance\')}}"'
            );
            pTemplate = replaceAll(
                pTemplate,
                'uib-tooltip="Proficient - Competent, works independently"',
                'uib-tooltip="{{c.levelDescription(skill.entries[0], \'Competent, works independently\')}}"'
            );
            pTemplate = replaceAll(
                pTemplate,
                'uib-tooltip="Advanced - Highly skilled, mentors others"',
                'uib-tooltip="{{c.levelDescription(skill.entries[0], \'Highly skilled, mentors others\')}}"'
            );
            pTemplate = replaceAll(
                pTemplate,
                'uib-tooltip="Expert - Authority, drives best practices"',
                'uib-tooltip="{{c.levelDescription(skill.entries[0], \'Authority, drives best practices\')}}"'
            );

            profile.setValue('script', pServer);
            profile.setValue('client_script', pClient);
            profile.setValue('template', pTemplate);
            profile.update();
            gs.info('[Skills Hub] My Profile level type alignment patched');
        } else {
            gs.warn('[Skills Hub] My Profile widget not found during script 51');
        }

        // ------------------------------------------------------------------
        // Find Expert
        // ------------------------------------------------------------------
        var find = getWidget('Skills Hub - Find Expert');
        if (find) {
            var fServer = find.getValue('script') || '';
            var fTemplate = find.getValue('template') || '';

            if (fServer.indexOf('Skills Hub Level Alignment 51') < 0) {
                fServer = fServer.replace('(function() {', '(function() {\n' + resolverBlock);
            }

            fServer = fServer.replace(
                '  function levelToInt(levelStr) {\n      if (levelStr.indexOf("Expert") > -1) return 5;\n      if (levelStr.indexOf("Advanced") > -1) return 4;\n      if (levelStr.indexOf("Proficient") > -1) return 3;\n      if (levelStr.indexOf("Intermediate") > -1 || levelStr.indexOf("Learner") > -1) return 2;\n      return 1;\n  }',
                '  function levelToInt(skillSysId, levelStr) { return sh51LevelToValue(skillSysId, levelStr); }'
            );
            fServer = replaceAll(fServer, 'var levelInt = levelToInt(levelStr);', 'var levelInt = levelToInt(skillId, levelStr);\n              var levelMeta = sh51LevelForValue(skillId, levelInt);');
            fServer = replaceAll(
                fServer,
                '                  level_display: levelStr,\n                  endorsements:',
                '                  level_display: levelMeta.label,\n                  level_label: levelMeta.label,\n                  level_description: levelMeta.desc,\n                  endorsements:'
            );
            fServer = replaceAll(
                fServer,
                '                  avg_level: Math.round(avgLevel * 10) / 10,\n                  avg_level_rounded: Math.round(avgLevel),',
                '                  avg_level: Math.round(avgLevel * 10) / 10,\n                  avg_level_rounded: Math.round(avgLevel),\n                  level_label: sh51LevelForValue(sg.entries[0].skill_sys_id, Math.round(avgLevel)).label,'
            );

            fTemplate = replaceAll(fTemplate, '{{c.profLevelName(sg.avg_level_rounded)}}', '{{sg.level_label || c.profLevelName(sg.avg_level_rounded)}}');
            fTemplate = replaceAll(fTemplate, '{{c.profLevelName(ent.level_value)}}', '{{ent.level_label || c.profLevelName(ent.level_value)}}');

            find.setValue('script', fServer);
            find.setValue('template', fTemplate);
            find.update();
            gs.info('[Skills Hub] Find Expert level type alignment patched');
        } else {
            gs.warn('[Skills Hub] Find Expert widget not found during script 51');
        }

        // ------------------------------------------------------------------
        // Manager Matrix: preserve current data, normalize labels client-side.
        // ------------------------------------------------------------------
        var manager = getWidget('Skills Hub - Manager Matrix');
        if (manager) {
            var mClient = manager.getValue('client_script') || '';
            var mTemplate = manager.getValue('template') || '';

            if (mClient.indexOf('resolveLevelLabel') < 0) {
                mClient = mClient.replace(
                    '  c.levelColor = function(level) {',
                    [
                        '  c.resolveLevelLabel = function(level) {',
                        '    if (!level) return "";',
                        '    return String(level).replace("Intermediate", "Learner");',
                        '  };',
                        '',
                        '  c.levelColor = function(level) {'
                    ].join('\n')
                );
            }

            mTemplate = replaceAll(mTemplate, '{{details.level == "Intermediate" ? "Learner" : details.level}}', '{{c.resolveLevelLabel(details.level)}}');
            mTemplate = replaceAll(mTemplate, '{{details.level}}', '{{c.resolveLevelLabel(details.level)}}');
            mTemplate = replaceAll(mTemplate, '{{details.manager_assessed_level == "Intermediate" ? "Learner" : details.manager_assessed_level}}', '{{c.resolveLevelLabel(details.manager_assessed_level)}}');
            mTemplate = replaceAll(mTemplate, '{{details.manager_assessed_level}}', '{{c.resolveLevelLabel(details.manager_assessed_level)}}');

            manager.setValue('client_script', mClient);
            manager.setValue('template', mTemplate);
            manager.update();
            gs.info('[Skills Hub] Manager Matrix level label normalization patched');
        } else {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 51');
        }

        gs.info('[Skills Hub] ===== COMPLETED 51_skill_level_type_alignment =====');
    } catch (e) {
        gs.error('[Skills Hub] 51_skill_level_type_alignment failed: ' + e.message);
    }
})();
