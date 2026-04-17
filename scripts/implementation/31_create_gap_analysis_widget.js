/**
 * Fix Script: 31_create_gap_analysis_widget.js
 * Purpose: Create the "Skills Hub - Gap Analysis" Service Portal widget for capacity reporting
 * Scope: Global
 * Idempotent: Yes - checks if widget already exists by ID before creating
 *
 * Widget Details:
 *   ID: skills-hub-gap-analysis
 *   Name: Skills Hub - Gap Analysis
 *   Calculates gap = supply - demand for each skill
 *   Severity: critical (gap < -5), warning (gap < 0), balanced (gap >= 0)
 *
 * Server Script:
 *   1. Queries sys_user_has_skill grouped by skill for supply counts per proficiency level
 *   2. Queries u_story_skill_assignment grouped by skill for demand counts
 *   3. Calculates gap = supply - demand; assigns severity
 *   4. Returns sorted array: { skillName, supplyCount, demandCount, gap, severity }
 *
 * Client Script:
 *   1. Calls server on load
 *   2. Supports filter by severity (All, Critical, Warning, Balanced)
 *   3. Supports sort by gap amount or skill name
 *
 * HTML Template:
 *   1. Summary cards: Total Skills, Critical Gaps, Warnings, Balanced
 *   2. Table: Skill Name, Supply, Demand, Gap, Severity Badge
 *   3. Color-coded severity badges (red=critical, yellow=warning, green=balanced)
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Phase 1+2+3 tables and u_story_skill_assignment must exist
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING GAP ANALYSIS WIDGET CREATION (Script 31) =====');

        var WIDGET_ID = 'skills-hub-gap-analysis';
        var WIDGET_NAME = 'Skills Hub - Gap Analysis';

        // ================================================================
        // 1. Idempotency check
        // ================================================================
        var existing = new GlideRecord('sp_widget');
        existing.addQuery('id', WIDGET_ID);
        existing.query();

        if (existing.next()) {
            gs.info('[Skills Hub] Gap Analysis widget already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // Also check by name
        var existingByName = new GlideRecord('sp_widget');
        existingByName.addQuery('name', WIDGET_NAME);
        existingByName.query();

        if (existingByName.next()) {
            gs.info('[Skills Hub] Gap Analysis widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // ================================================================
        // 2. Build SERVER SCRIPT
        // ================================================================
        var NL = '\n';
        var serverScript = '';
        serverScript += '(function() {' + NL;
        serverScript += '    data.gaps = [];' + NL;
        serverScript += '    data.summary = { totalSkills: 0, criticalGaps: 0, warnings: 0, balanced: 0 };' + NL;
        serverScript += '' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    // 1. Calculate SUPPLY: count of users per skill at each proficiency level' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    var supplyMap = {};' + NL;
        serverScript += '' + NL;
        serverScript += '    var sg = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '    sg.addQuery("user.active", true);' + NL;
        serverScript += '    sg.query();' + NL;
        serverScript += '    while (sg.next()) {' + NL;
        serverScript += '        var skillName = sg.skill.name.toString();' + NL;
        serverScript += '        if (!skillName) continue;' + NL;
        serverScript += '        if (!supplyMap[skillName]) {' + NL;
        serverScript += '            supplyMap[skillName] = {' + NL;
        serverScript += '                total: 0,' + NL;
        serverScript += '                byLevel: { Novice: 0, Intermediate: 0, Proficient: 0, Advanced: 0, Expert: 0 }' + NL;
        serverScript += '            };' + NL;
        serverScript += '        }' + NL;
        serverScript += '        supplyMap[skillName].total++;' + NL;
        serverScript += '        var level = sg.skill_level.toString();' + NL;
        serverScript += '        if (supplyMap[skillName].byLevel.hasOwnProperty(level)) {' + NL;
        serverScript += '            supplyMap[skillName].byLevel[level]++;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    // 2. Calculate DEMAND: count of story assignments per skill' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    var demandMap = {};' + NL;
        serverScript += '' + NL;
        serverScript += '    var dg = new GlideRecord("u_story_skill_assignment");' + NL;
        serverScript += '    dg.addQuery("u_active", true);' + NL;
        serverScript += '    dg.query();' + NL;
        serverScript += '    while (dg.next()) {' + NL;
        serverScript += '        var dSkillName = dg.u_skill.name.toString();' + NL;
        serverScript += '        if (!dSkillName) continue;' + NL;
        serverScript += '        if (!demandMap[dSkillName]) {' + NL;
        serverScript += '            demandMap[dSkillName] = 0;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        demandMap[dSkillName]++;' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    // 3. Build a unified list of all skills in supply OR demand' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    var allSkills = {};' + NL;
        serverScript += '    var skillKey;' + NL;
        serverScript += '    for (skillKey in supplyMap) {' + NL;
        serverScript += '        if (supplyMap.hasOwnProperty(skillKey)) {' + NL;
        serverScript += '            allSkills[skillKey] = true;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '    for (skillKey in demandMap) {' + NL;
        serverScript += '        if (demandMap.hasOwnProperty(skillKey)) {' + NL;
        serverScript += '            allSkills[skillKey] = true;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    // 4. Calculate GAP = supply - demand for each skill' + NL;
        serverScript += '    //    severity: critical (gap < -5), warning (gap < 0), balanced (gap >= 0)' + NL;
        serverScript += '    // ============================================' + NL;
        serverScript += '    for (var sName in allSkills) {' + NL;
        serverScript += '        if (!allSkills.hasOwnProperty(sName)) continue;' + NL;
        serverScript += '' + NL;
        serverScript += '        var supplyCount = (supplyMap[sName]) ? supplyMap[sName].total : 0;' + NL;
        serverScript += '        var demandCount = demandMap[sName] || 0;' + NL;
        serverScript += '        var gap = supplyCount - demandCount;' + NL;
        serverScript += '' + NL;
        serverScript += '        var severity = "balanced";' + NL;
        serverScript += '        if (gap < -5) {' + NL;
        serverScript += '            severity = "critical";' + NL;
        serverScript += '        } else if (gap < 0) {' + NL;
        serverScript += '            severity = "warning";' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        data.gaps.push({' + NL;
        serverScript += '            skillName: sName,' + NL;
        serverScript += '            supplyCount: supplyCount,' + NL;
        serverScript += '            demandCount: demandCount,' + NL;
        serverScript += '            gap: gap,' + NL;
        serverScript += '            severity: severity' + NL;
        serverScript += '        });' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Sort by gap ascending (worst gaps first) then by skill name' + NL;
        serverScript += '    data.gaps.sort(function(a, b) {' + NL;
        serverScript += '        if (a.gap !== b.gap) {' + NL;
        serverScript += '            return a.gap - b.gap;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        return (a.skillName > b.skillName) ? 1 : (a.skillName < b.skillName) ? -1 : 0;' + NL;
        serverScript += '    });' + NL;
        serverScript += '' + NL;
        serverScript += '    // Build summary counts' + NL;
        serverScript += '    data.summary.totalSkills = data.gaps.length;' + NL;
        serverScript += '    for (var g = 0; g < data.gaps.length; g++) {' + NL;
        serverScript += '        var sev = data.gaps[g].severity;' + NL;
        serverScript += '        if (sev === "critical") {' + NL;
        serverScript += '            data.summary.criticalGaps++;' + NL;
        serverScript += '        } else if (sev === "warning") {' + NL;
        serverScript += '            data.summary.warnings++;' + NL;
        serverScript += '        } else {' + NL;
        serverScript += '            data.summary.balanced++;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '})();';

        // ================================================================
        // 3. Build CLIENT SCRIPT
        // ================================================================
        var clientScript = '';
        clientScript += 'api.controller = function($scope) {' + NL;
        clientScript += '    var c = this;' + NL;
        clientScript += '' + NL;
        clientScript += '    // Filter state' + NL;
        clientScript += '    c.severityFilter = "all";' + NL;
        clientScript += '' + NL;
        clientScript += '    // Sort state' + NL;
        clientScript += '    c.sortField = "gap";' + NL;
        clientScript += '    c.sortAscending = true;' + NL;
        clientScript += '' + NL;
        clientScript += '    /**' + NL;
        clientScript += '     * Set the severity filter and refresh the filtered list.' + NL;
        clientScript += '     * @param {string} severity - "all", "critical", "warning", or "balanced"' + NL;
        clientScript += '     */' + NL;
        clientScript += '    c.filterBySeverity = function(severity) {' + NL;
        clientScript += '        c.severityFilter = severity;' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    /**' + NL;
        clientScript += '     * Return the filtered and sorted list of gap records.' + NL;
        clientScript += '     */' + NL;
        clientScript += '    c.getFilteredGaps = function() {' + NL;
        clientScript += '        var gaps = c.data.gaps || [];' + NL;
        clientScript += '' + NL;
        clientScript += '        // Apply severity filter' + NL;
        clientScript += '        if (c.severityFilter !== "all") {' + NL;
        clientScript += '            gaps = gaps.filter(function(g) {' + NL;
        clientScript += '                return g.severity === c.severityFilter;' + NL;
        clientScript += '            });' + NL;
        clientScript += '        }' + NL;
        clientScript += '' + NL;
        clientScript += '        // Apply sort' + NL;
        clientScript += '        var field = c.sortField;' + NL;
        clientScript += '        var asc = c.sortAscending;' + NL;
        clientScript += '        gaps = gaps.slice().sort(function(a, b) {' + NL;
        clientScript += '            var valA = a[field];' + NL;
        clientScript += '            var valB = b[field];' + NL;
        clientScript += '            if (typeof valA === "string") {' + NL;
        clientScript += '                return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);' + NL;
        clientScript += '            }' + NL;
        clientScript += '            return asc ? (valA - valB) : (valB - valA);' + NL;
        clientScript += '        });' + NL;
        clientScript += '' + NL;
        clientScript += '        return gaps;' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    /**' + NL;
        clientScript += '     * Toggle sort by a field. If already sorting by this field, reverse direction.' + NL;
        clientScript += '     * @param {string} field - "gap" or "skillName"' + NL;
        clientScript += '     */' + NL;
        clientScript += '    c.sortBy = function(field) {' + NL;
        clientScript += '        if (c.sortField === field) {' + NL;
        clientScript += '            c.sortAscending = !c.sortAscending;' + NL;
        clientScript += '        } else {' + NL;
        clientScript += '            c.sortField = field;' + NL;
        clientScript += '            c.sortAscending = (field === "skillName");' + NL;
        clientScript += '        }' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    /**' + NL;
        clientScript += '     * Return CSS class for a severity badge.' + NL;
        clientScript += '     */' + NL;
        clientScript += '    c.getSeverityClass = function(severity) {' + NL;
        clientScript += '        switch (severity) {' + NL;
        clientScript += '            case "critical": return "badge-critical";' + NL;
        clientScript += '            case "warning": return "badge-warning";' + NL;
        clientScript += '            case "balanced": return "badge-balanced";' + NL;
        clientScript += '            default: return "badge-balanced";' + NL;
        clientScript += '        }' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    /**' + NL;
        clientScript += '     * Check if a filter button is active.' + NL;
        clientScript += '     */' + NL;
        clientScript += '    c.isActiveFilter = function(severity) {' + NL;
        clientScript += '        return c.severityFilter === severity;' + NL;
        clientScript += '    };' + NL;
        clientScript += '};';

        // ================================================================
        // 4. Build TEMPLATE
        // ================================================================
        var template = '';
        template += '<div class="gap-analysis-widget">' + NL;
        template += '' + NL;
        template += '    <!-- Header -->' + NL;
        template += '    <div class="gap-header">' + NL;
        template += '        <h3 class="gap-title"><i class="fa fa-balance-scale"></i> Skill Gap Analysis</h3>' + NL;
        template += '        <p class="gap-subtitle">Supply vs demand for each skill, ranked by severity</p>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <!-- Summary Cards -->' + NL;
        template += '    <div class="summary-cards">' + NL;
        template += '        <div class="summary-card">' + NL;
        template += '            <div class="summary-value">{{c.data.summary.totalSkills}}</div>' + NL;
        template += '            <div class="summary-label">Total Skills</div>' + NL;
        template += '        </div>' + NL;
        template += '        <div class="summary-card card-critical">' + NL;
        template += '            <div class="summary-value">{{c.data.summary.criticalGaps}}</div>' + NL;
        template += '            <div class="summary-label">Critical Gaps</div>' + NL;
        template += '        </div>' + NL;
        template += '        <div class="summary-card card-warning">' + NL;
        template += '            <div class="summary-value">{{c.data.summary.warnings}}</div>' + NL;
        template += '            <div class="summary-label">Warnings</div>' + NL;
        template += '        </div>' + NL;
        template += '        <div class="summary-card card-balanced">' + NL;
        template += '            <div class="summary-value">{{c.data.summary.balanced}}</div>' + NL;
        template += '            <div class="summary-label">Balanced</div>' + NL;
        template += '        </div>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <!-- Filter Buttons -->' + NL;
        template += '    <div class="filter-bar">' + NL;
        template += '        <span class="filter-label">Filter:</span>' + NL;
        template += '        <button class="btn btn-sm filter-btn" ng-class="{\'active\': c.isActiveFilter(\'all\')}" ng-click="c.filterBySeverity(\'all\')">All</button>' + NL;
        template += '        <button class="btn btn-sm filter-btn filter-critical" ng-class="{\'active\': c.isActiveFilter(\'critical\')}" ng-click="c.filterBySeverity(\'critical\')">Critical</button>' + NL;
        template += '        <button class="btn btn-sm filter-btn filter-warning" ng-class="{\'active\': c.isActiveFilter(\'warning\')}" ng-click="c.filterBySeverity(\'warning\')">Warning</button>' + NL;
        template += '        <button class="btn btn-sm filter-btn filter-balanced" ng-class="{\'active\': c.isActiveFilter(\'balanced\')}" ng-click="c.filterBySeverity(\'balanced\')">Balanced</button>' + NL;
        template += '        <span class="sort-controls">' + NL;
        template += '            <span class="filter-label">Sort:</span>' + NL;
        template += '            <button class="btn btn-sm sort-btn" ng-class="{\'active\': c.sortField === \'gap\'}" ng-click="c.sortBy(\'gap\')">Gap Amount</button>' + NL;
        template += '            <button class="btn btn-sm sort-btn" ng-class="{\'active\': c.sortField === \'skillName\'}" ng-click="c.sortBy(\'skillName\')">Skill Name</button>' + NL;
        template += '        </span>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <!-- Empty State -->' + NL;
        template += '    <div class="gap-empty" ng-if="c.getFilteredGaps().length === 0">' + NL;
        template += '        <i class="fa fa-check-circle fa-3x"></i>' + NL;
        template += '        <p class="gap-empty-title">No Results</p>' + NL;
        template += '        <p class="gap-empty-desc">No skill gaps match the current filter.</p>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <!-- Gap Table -->' + NL;
        template += '    <div class="gap-table-wrap" ng-if="c.getFilteredGaps().length > 0">' + NL;
        template += '        <table class="gap-table">' + NL;
        template += '            <thead>' + NL;
        template += '                <tr>' + NL;
        template += '                    <th class="col-skill" ng-click="c.sortBy(\'skillName\')" style="cursor:pointer;">Skill Name <i class="fa fa-sort"></i></th>' + NL;
        template += '                    <th class="col-supply">Supply</th>' + NL;
        template += '                    <th class="col-demand">Demand</th>' + NL;
        template += '                    <th class="col-gap" ng-click="c.sortBy(\'gap\')" style="cursor:pointer;">Gap <i class="fa fa-sort"></i></th>' + NL;
        template += '                    <th class="col-severity">Severity</th>' + NL;
        template += '                </tr>' + NL;
        template += '            </thead>' + NL;
        template += '            <tbody>' + NL;
        template += '                <tr ng-repeat="gap in c.getFilteredGaps() track by gap.skillName">' + NL;
        template += '                    <td class="col-skill">{{gap.skillName}}</td>' + NL;
        template += '                    <td class="col-supply">{{gap.supplyCount}}</td>' + NL;
        template += '                    <td class="col-demand">{{gap.demandCount}}</td>' + NL;
        template += '                    <td class="col-gap" ng-class="{\'gap-negative\': gap.gap < 0}">{{gap.gap}}</td>' + NL;
        template += '                    <td class="col-severity">' + NL;
        template += '                        <span class="severity-badge" ng-class="c.getSeverityClass(gap.severity)">' + NL;
        template += '                            {{gap.severity | uppercase}}' + NL;
        template += '                        </span>' + NL;
        template += '                    </td>' + NL;
        template += '                </tr>' + NL;
        template += '            </tbody>' + NL;
        template += '        </table>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '</div>';

        // ================================================================
        // 5. Build CSS
        // ================================================================
        var css = '';
        css += '/* ===== Skills Hub Gap Analysis Widget ===== */' + NL;
        css += '.gap-analysis-widget {' + NL;
        css += '    font-family: "Source Sans Pro", Arial, sans-serif;' + NL;
        css += '    padding: 16px;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Header */' + NL;
        css += '.gap-header {' + NL;
        css += '    margin-bottom: 20px;' + NL;
        css += '}' + NL;
        css += '.gap-title {' + NL;
        css += '    font-size: 1.3em;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    color: #333333;' + NL;
        css += '    margin: 0 0 4px 0;' + NL;
        css += '}' + NL;
        css += '.gap-title .fa {' + NL;
        css += '    color: #0072CE;' + NL;
        css += '    margin-right: 8px;' + NL;
        css += '}' + NL;
        css += '.gap-subtitle {' + NL;
        css += '    font-size: 0.9em;' + NL;
        css += '    color: #888888;' + NL;
        css += '    margin: 0;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Summary Cards */' + NL;
        css += '.summary-cards {' + NL;
        css += '    display: flex;' + NL;
        css += '    gap: 16px;' + NL;
        css += '    margin-bottom: 20px;' + NL;
        css += '    flex-wrap: wrap;' + NL;
        css += '}' + NL;
        css += '.summary-card {' + NL;
        css += '    flex: 1;' + NL;
        css += '    min-width: 120px;' + NL;
        css += '    background: #ffffff;' + NL;
        css += '    border: 1px solid #e0e0e0;' + NL;
        css += '    border-radius: 8px;' + NL;
        css += '    padding: 16px 20px;' + NL;
        css += '    text-align: center;' + NL;
        css += '    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);' + NL;
        css += '}' + NL;
        css += '.summary-value {' + NL;
        css += '    font-size: 2em;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    color: #0072CE;' + NL;
        css += '    line-height: 1.2;' + NL;
        css += '}' + NL;
        css += '.summary-label {' + NL;
        css += '    font-size: 0.8em;' + NL;
        css += '    text-transform: uppercase;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #888888;' + NL;
        css += '    margin-top: 4px;' + NL;
        css += '    letter-spacing: 0.5px;' + NL;
        css += '}' + NL;
        css += '.card-critical .summary-value {' + NL;
        css += '    color: #dc2626;' + NL;
        css += '}' + NL;
        css += '.card-warning .summary-value {' + NL;
        css += '    color: #f59e0b;' + NL;
        css += '}' + NL;
        css += '.card-balanced .summary-value {' + NL;
        css += '    color: #22c55e;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Filter & Sort Bar */' + NL;
        css += '.filter-bar {' + NL;
        css += '    display: flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    gap: 8px;' + NL;
        css += '    margin-bottom: 16px;' + NL;
        css += '    flex-wrap: wrap;' + NL;
        css += '}' + NL;
        css += '.filter-label {' + NL;
        css += '    font-size: 0.85em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #666666;' + NL;
        css += '}' + NL;
        css += '.filter-btn, .sort-btn {' + NL;
        css += '    border: 1px solid #d0d0d0;' + NL;
        css += '    background: #ffffff;' + NL;
        css += '    color: #555555;' + NL;
        css += '    border-radius: 4px;' + NL;
        css += '    font-size: 0.82em;' + NL;
        css += '    padding: 4px 12px;' + NL;
        css += '    cursor: pointer;' + NL;
        css += '    transition: all 0.15s ease;' + NL;
        css += '}' + NL;
        css += '.filter-btn.active, .sort-btn.active {' + NL;
        css += '    background: #0072CE;' + NL;
        css += '    color: #ffffff;' + NL;
        css += '    border-color: #0072CE;' + NL;
        css += '}' + NL;
        css += '.filter-critical.active {' + NL;
        css += '    background: #dc2626;' + NL;
        css += '    border-color: #dc2626;' + NL;
        css += '}' + NL;
        css += '.filter-warning.active {' + NL;
        css += '    background: #f59e0b;' + NL;
        css += '    border-color: #f59e0b;' + NL;
        css += '}' + NL;
        css += '.filter-balanced.active {' + NL;
        css += '    background: #22c55e;' + NL;
        css += '    border-color: #22c55e;' + NL;
        css += '}' + NL;
        css += '.sort-controls {' + NL;
        css += '    margin-left: 16px;' + NL;
        css += '    display: flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    gap: 8px;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Empty State */' + NL;
        css += '.gap-empty {' + NL;
        css += '    text-align: center;' + NL;
        css += '    padding: 48px 20px;' + NL;
        css += '    color: #22c55e;' + NL;
        css += '}' + NL;
        css += '.gap-empty-title {' + NL;
        css += '    font-size: 1.2em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #333333;' + NL;
        css += '    margin: 12px 0 6px;' + NL;
        css += '}' + NL;
        css += '.gap-empty-desc {' + NL;
        css += '    font-size: 0.9em;' + NL;
        css += '    color: #999999;' + NL;
        css += '    margin: 0;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Gap Table */' + NL;
        css += '.gap-table-wrap {' + NL;
        css += '    overflow-x: auto;' + NL;
        css += '}' + NL;
        css += '.gap-table {' + NL;
        css += '    width: 100%;' + NL;
        css += '    border-collapse: collapse;' + NL;
        css += '}' + NL;
        css += '.gap-table thead th {' + NL;
        css += '    font-size: 0.78em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    text-transform: uppercase;' + NL;
        css += '    color: #888888;' + NL;
        css += '    padding: 10px 12px;' + NL;
        css += '    border-bottom: 2px solid #e0e0e0;' + NL;
        css += '    text-align: left;' + NL;
        css += '    letter-spacing: 0.3px;' + NL;
        css += '}' + NL;
        css += '.gap-table tbody tr {' + NL;
        css += '    transition: background 0.15s ease;' + NL;
        css += '}' + NL;
        css += '.gap-table tbody tr:hover {' + NL;
        css += '    background: #f8f9fa;' + NL;
        css += '}' + NL;
        css += '.gap-table tbody td {' + NL;
        css += '    padding: 10px 12px;' + NL;
        css += '    vertical-align: middle;' + NL;
        css += '    border-bottom: 1px solid #f0f0f0;' + NL;
        css += '    font-size: 0.93em;' + NL;
        css += '}' + NL;
        css += '.col-skill {' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #333333;' + NL;
        css += '}' + NL;
        css += '.col-supply, .col-demand, .col-gap {' + NL;
        css += '    text-align: center;' + NL;
        css += '}' + NL;
        css += '.gap-negative {' + NL;
        css += '    color: #dc2626;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Severity Badges */' + NL;
        css += '.severity-badge {' + NL;
        css += '    display: inline-block;' + NL;
        css += '    padding: 3px 10px;' + NL;
        css += '    border-radius: 12px;' + NL;
        css += '    font-size: 0.78em;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    letter-spacing: 0.3px;' + NL;
        css += '}' + NL;
        css += '.badge-critical {' + NL;
        css += '    background: #dc2626;' + NL;
        css += '    color: #ffffff;' + NL;
        css += '}' + NL;
        css += '.badge-warning {' + NL;
        css += '    background: #f59e0b;' + NL;
        css += '    color: #ffffff;' + NL;
        css += '}' + NL;
        css += '.badge-balanced {' + NL;
        css += '    background: #22c55e;' + NL;
        css += '    color: #ffffff;' + NL;
        css += '}';

        // ================================================================
        // 6. Create the widget record
        // ================================================================
        var widgetGR = new GlideRecord('sp_widget');
        widgetGR.initialize();
        widgetGR.setValue('name', WIDGET_NAME);
        widgetGR.setValue('id', WIDGET_ID);
        widgetGR.setValue('script', serverScript);
        widgetGR.setValue('client_script', clientScript);
        widgetGR.setValue('template', template);
        widgetGR.setValue('css', css);

        var widgetSysId = widgetGR.insert();

        if (widgetSysId) {
            gs.info('[Skills Hub] Gap Analysis widget created successfully (sys_id: ' + widgetSysId + ')');
        } else {
            gs.error('[Skills Hub] FAILED to create Gap Analysis widget');
            return;
        }

        // ================================================================
        // 7. Summary
        // ================================================================
        gs.info('[Skills Hub] ===== GAP ANALYSIS WIDGET CREATION SUMMARY (Script 31) =====');
        gs.info('[Skills Hub] Widget name: ' + WIDGET_NAME);
        gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
        gs.info('[Skills Hub] Widget sys_id: ' + widgetSysId);
        gs.info('[Skills Hub] Server script: Supply/Demand gap calculation (gap = supply - demand)');
        gs.info('[Skills Hub]   Severity: critical (gap < -5), warning (gap < 0), balanced (gap >= 0)');
        gs.info('[Skills Hub] Client script: filter by severity (All/Critical/Warning/Balanced), sort by gap or name');
        gs.info('[Skills Hub] Template: 4 summary cards, filter/sort bar, gap table with severity badges');
        gs.info('[Skills Hub] CSS: severity badges (red=critical, yellow=warning, green=balanced), cards, table');
        gs.info('[Skills Hub] Server script length: ' + serverScript.length + ' chars');
        gs.info('[Skills Hub] Client script length: ' + clientScript.length + ' chars');
        gs.info('[Skills Hub] Template length: ' + template.length + ' chars');
        gs.info('[Skills Hub] CSS length: ' + css.length + ' chars');
        gs.info('[Skills Hub] ===========================================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 31_create_gap_analysis_widget: ' + e.message);
    }
})();
