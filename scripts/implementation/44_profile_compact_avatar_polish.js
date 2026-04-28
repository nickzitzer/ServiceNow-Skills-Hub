/**
 * Fix Script: 44_profile_compact_avatar_polish.js
 * Purpose: Make My Profile compact mode discoverable and fix avatar initial centering.
 *
 * Fixes:
 *   - Replaces the icon-only compact button with a labeled Card/List view toggle.
 *   - Makes list mode a true row-based assessment view instead of smaller cards.
 *   - Centers initials/images inside profile and expert avatar circles.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 44_profile_compact_avatar_polish =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        function patchWidgetByName(widgetName, patchFn) {
            var widget = new GlideRecord('sp_widget');
            widget.addQuery('name', widgetName);
            widget.setLimit(1);
            widget.query();
            if (!widget.next()) {
                gs.warn('[Skills Hub] Widget not found: ' + widgetName);
                return false;
            }

            patchFn(widget);
            widget.update();
            gs.info('[Skills Hub] Patched widget: ' + widgetName);
            return true;
        }

        patchWidgetByName('Skills Hub - My Profile', function(widget) {
            var template = widget.getValue('template') || '';
            var css = widget.getValue('css') || '';

            var oldIconOnlyToggle = [
                '<button class="btn-compact" ng-click="c.toggleCompactMode()" uib-tooltip="Toggle compact view">',
                '           <i class="fa" ng-class="{\'fa-compress\': !c.compactMode, \'fa-expand\': c.compactMode}"></i>',
                '        </button>'
            ].join('\n');

            var oldIconOnlyToggleAlt = [
                '<button class="btn-compact" ng-click="c.toggleCompactMode()" uib-tooltip="Toggle compact view">',
                '              <i class="fa" ng-class="{\'fa-compress\': !c.compactMode, \'fa-expand\': c.compactMode}"></i>',
                '           </button>'
            ].join('\n');

            var newToggle = [
                '<button class="btn-view-toggle" ng-click="c.toggleCompactMode()" ng-class="{\'active\': c.compactMode}" uib-tooltip="{{c.compactMode ? \'Switch to card view\' : \'Switch to list view\'}}" aria-pressed="{{c.compactMode}}">',
                '           <i class="fa" ng-class="{\'fa-list\': !c.compactMode, \'fa-th-large\': c.compactMode}"></i>',
                '           <span>{{c.compactMode ? \'Card view\' : \'List view\'}}</span>',
                '        </button>'
            ].join('\n');

            if (template.indexOf('btn-view-toggle') < 0) {
                if (template.indexOf(oldIconOnlyToggle) > -1) {
                    template = template.replace(oldIconOnlyToggle, newToggle);
                } else if (template.indexOf(oldIconOnlyToggleAlt) > -1) {
                    template = template.replace(oldIconOnlyToggleAlt, newToggle);
                } else if (template.indexOf('c.toggleCompactMode') > -1) {
                    template = replaceAll(template, 'class="btn-compact"', 'class="btn-view-toggle"');
                    template = template.replace(
                        '<i class="fa" ng-class="{\'fa-compress\': !c.compactMode, \'fa-expand\': c.compactMode}"></i>',
                        '<i class="fa" ng-class="{\'fa-list\': !c.compactMode, \'fa-th-large\': c.compactMode}"></i><span>{{c.compactMode ? \'Card view\' : \'List view\'}}</span>');
                }
            }

            if (template.indexOf('ng-class="{\'compact-skills\': c.compactMode}"') < 0) {
                template = template.replace(
                    '<div class="row-grid" ng-if="data.skills.length > 0">',
                    '<div class="row-grid" ng-class="{\'compact-skills\': c.compactMode}" ng-if="data.skills.length > 0">');
            }

            if (css.indexOf('Skills Hub Polish 44') < 0) {
                css += [
                    '',
                    '/* Skills Hub Polish 44 */',
                    '.profile-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }',
                    '.btn-view-toggle { min-height:34px; padding:7px 10px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; color:#334155; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-weight:700; font-size:12px; line-height:1; box-shadow:0 1px 2px rgba(15,23,42,0.06); }',
                    '.btn-view-toggle:hover, .btn-view-toggle:focus { border-color:#0078bf; color:#0078bf; background:#f0f9ff; outline:none; }',
                    '.btn-view-toggle.active { background:#0f766e; border-color:#0f766e; color:#fff; }',
                    '.btn-view-toggle i { font-size:12px; line-height:1; }',
                    '.btn-view-toggle span { white-space:nowrap; }',
                    '.btn-compact { display:none !important; }',
                    '.profile-avatar-container { display:flex !important; align-items:center !important; justify-content:center !important; overflow:hidden; line-height:1 !important; }',
                    '.profile-avatar { width:82px !important; height:82px !important; display:flex !important; align-items:center !important; justify-content:center !important; overflow:hidden; text-align:center; line-height:1 !important; }',
                    '.profile-avatar sn-avatar, .profile-avatar .sn-avatar, .profile-avatar img, .profile-avatar .avatar-large { width:82px !important; height:82px !important; min-width:82px !important; min-height:82px !important; max-width:82px !important; max-height:82px !important; border-radius:50% !important; display:flex !important; align-items:center !important; justify-content:center !important; text-align:center; line-height:82px !important; font-size:24px !important; }',
                    '.profile-avatar * { box-sizing:border-box; }',
                    '.row-grid.compact-skills { display:block; }',
                    '.compact-skills .col-grid { width:100% !important; max-width:100% !important; float:none !important; margin-bottom:6px !important; padding-left:0 !important; padding-right:0 !important; }',
                    '.compact-skills .skill-card { min-height:0 !important; padding:9px 12px !important; border-left-width:4px; display:grid !important; grid-template-columns:minmax(180px,2fr) minmax(110px,0.8fr) minmax(160px,1.5fr) auto; gap:6px 12px; align-items:center; }',
                    '.compact-skills .skill-header { grid-column:1; margin:0 !important; display:flex; align-items:center; justify-content:flex-start; gap:8px; min-width:0; }',
                    '.compact-skills .skill-name { font-size:14px !important; line-height:1.2 !important; margin:0 !important; }',
                    '.compact-skills .skill-type { font-size:9px !important; padding:3px 6px !important; margin:0 !important; }',
                    '.compact-skills .prof-legend, .compact-skills .prof-info-panel { display:none !important; }',
                    '.compact-skills .skill-level-row { grid-column:2; margin:0 !important; display:flex; align-items:center; justify-content:space-between; gap:8px; }',
                    '.compact-skills .interactive-bar-bg { height:6px !important; }',
                    '.compact-skills .skill-card > .interactive-bar-bg { grid-column:3; margin:0 !important; }',
                    '.compact-skills .card-footer-row { grid-column:4; padding:0 !important; margin:0 !important; justify-content:flex-end; gap:8px; white-space:nowrap; }',
                    '.compact-skills .dispute-response-panel { grid-column:1 / -1; padding:8px !important; margin-top:4px !important; }',
                    '.compact-skills .category-entry { padding:7px 0 !important; display:grid; grid-template-columns:minmax(180px,2fr) minmax(110px,0.8fr) minmax(160px,1.5fr) auto; gap:6px 12px; align-items:center; }',
                    '.compact-skills .category-name { grid-column:1; min-width:0; }',
                    '.compact-skills .category-entry .skill-level-row { grid-column:2; }',
                    '.compact-skills .category-entry .interactive-bar-bg { grid-column:3; }',
                    '.compact-skills .category-entry .card-footer-row { grid-column:4; }',
                    '@media (max-width: 900px) { .compact-skills .skill-card, .compact-skills .category-entry { grid-template-columns:1fr; } .compact-skills .skill-header, .compact-skills .skill-level-row, .compact-skills .skill-card > .interactive-bar-bg, .compact-skills .card-footer-row, .compact-skills .category-name, .compact-skills .category-entry .skill-level-row, .compact-skills .category-entry .interactive-bar-bg, .compact-skills .category-entry .card-footer-row { grid-column:1; } .compact-skills .card-footer-row { justify-content:flex-start; } }'
                ].join('\n');
            }

            widget.setValue('template', template);
            widget.setValue('css', css);
        });

        patchWidgetByName('Skills Hub - Find Expert', function(widget) {
            var css = widget.getValue('css') || '';
            if (css.indexOf('Skills Hub Avatar Polish 44') < 0) {
                css += [
                    '',
                    '/* Skills Hub Avatar Polish 44 */',
                    '.avatar-circle { display:flex !important; align-items:center !important; justify-content:center !important; text-align:center; line-height:1 !important; overflow:hidden; }',
                    '.avatar-circle img { width:100% !important; height:100% !important; object-fit:cover; border-radius:50%; display:block; }'
                ].join('\n');
            }
            widget.setValue('css', css);
        });

        patchWidgetByName('Skills Hub - Manager Matrix', function(widget) {
            var css = widget.getValue('css') || '';
            if (css.indexOf('Skills Hub Avatar Polish 44') < 0) {
                css += [
                    '',
                    '/* Skills Hub Avatar Polish 44 */',
                    '.avatar-circle { display:flex !important; align-items:center !important; justify-content:center !important; text-align:center; line-height:1 !important; overflow:hidden; }',
                    '.avatar-circle img { width:100% !important; height:100% !important; object-fit:cover; border-radius:50%; display:block; }'
                ].join('\n');
            }
            widget.setValue('css', css);
        });

        gs.info('[Skills Hub] ===== COMPLETED 44_profile_compact_avatar_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 44_profile_compact_avatar_polish failed: ' + e.message);
    }
})();
