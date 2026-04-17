/**
 * Fix Script: 21_create_leaderboard_widget.js
 * Purpose: Create the "Skills Hub - Leaderboard" widget for team/department skill rankings
 * Scope: Global
 * Idempotent: Yes - checks if widget already exists by ID before creating
 *
 * Widget Details:
 *   ID: skills-hub-leaderboard
 *   Name: Skills Hub - Leaderboard
 *   Scope toggle: team (same manager) vs department
 *   Rankings: sorted by calculated tier points (same formula as My Profile)
 *   Highlights: current user, gold/silver/bronze for top 3
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Phase 1+2 tables and fields must exist
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING LEADERBOARD WIDGET CREATION (Script 21) =====');

        var WIDGET_ID = 'skills-hub-leaderboard';
        var WIDGET_NAME = 'Skills Hub - Leaderboard';

        // ================================================================
        // 1. Idempotency check
        // ================================================================
        var existing = new GlideRecord('sp_widget');
        existing.addQuery('id', WIDGET_ID);
        existing.query();

        if (existing.next()) {
            gs.info('[Skills Hub] Leaderboard widget already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // Also check by name
        var existingByName = new GlideRecord('sp_widget');
        existingByName.addQuery('name', WIDGET_NAME);
        existingByName.query();

        if (existingByName.next()) {
            gs.info('[Skills Hub] Leaderboard widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // ================================================================
        // 2. Build SERVER SCRIPT
        // ================================================================
        var NL = '\n';
        var serverScript = '';
        serverScript += '(function() {' + NL;
        serverScript += '    var scope = "team";' + NL;
        serverScript += '    if (input && input.action == "switch") {' + NL;
        serverScript += '        scope = input.scope || "team";' + NL;
        serverScript += '    } else if (input && input.scope) {' + NL;
        serverScript += '        scope = input.scope;' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    var me = gs.getUserID();' + NL;
        serverScript += '    data.scope = scope;' + NL;
        serverScript += '    data.leaders = [];' + NL;
        serverScript += '    data.my_user_id = me;' + NL;
        serverScript += '    data.empty = false;' + NL;
        serverScript += '' + NL;
        serverScript += '    // Get current user info' + NL;
        serverScript += '    var userGR = new GlideRecord("sys_user");' + NL;
        serverScript += '    userGR.get(me);' + NL;
        serverScript += '    var myDept = userGR.department.toString();' + NL;
        serverScript += '    var myManager = userGR.manager.toString();' + NL;
        serverScript += '' + NL;
        serverScript += '    // Collect target users based on scope' + NL;
        serverScript += '    var ugr = new GlideRecord("sys_user");' + NL;
        serverScript += '    ugr.addActiveQuery();' + NL;
        serverScript += '    if (scope == "team") {' + NL;
        serverScript += '        if (!myManager) {' + NL;
        serverScript += '            data.empty = true;' + NL;
        serverScript += '            data.empty_message = "No manager assigned. Cannot determine team.";' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        ugr.addQuery("manager", myManager);' + NL;
        serverScript += '    } else {' + NL;
        serverScript += '        if (!myDept) {' + NL;
        serverScript += '            data.empty = true;' + NL;
        serverScript += '            data.empty_message = "No department assigned. Cannot determine department peers.";' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        ugr.addQuery("department", myDept);' + NL;
        serverScript += '    }' + NL;
        serverScript += '    ugr.setLimit(50);' + NL;
        serverScript += '    ugr.query();' + NL;
        serverScript += '' + NL;
        serverScript += '    var userMap = {};' + NL;
        serverScript += '    var targetUserIds = [];' + NL;
        serverScript += '    while (ugr.next()) {' + NL;
        serverScript += '        var uid = ugr.getUniqueValue();' + NL;
        serverScript += '        var fullName = ugr.name.toString();' + NL;
        serverScript += '        var nameParts = fullName.split(" ");' + NL;
        serverScript += '        var initials = "";' + NL;
        serverScript += '        if (nameParts.length >= 2) {' + NL;
        serverScript += '            initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();' + NL;
        serverScript += '        } else if (nameParts.length == 1) {' + NL;
        serverScript += '            initials = nameParts[0].charAt(0).toUpperCase();' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        targetUserIds.push(uid);' + NL;
        serverScript += '        userMap[uid] = {' + NL;
        serverScript += '            sys_id: uid,' + NL;
        serverScript += '            name: fullName,' + NL;
        serverScript += '            title: ugr.title.toString() || "Employee",' + NL;
        serverScript += '            initials: initials,' + NL;
        serverScript += '            avatar: ugr.photo.getDisplayValue() || "",' + NL;
        serverScript += '            points: 0,' + NL;
        serverScript += '            skill_count: 0,' + NL;
        serverScript += '            endorsement_count: 0,' + NL;
        serverScript += '            tier_name: "",' + NL;
        serverScript += '            tier_icon: ""' + NL;
        serverScript += '        };' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    if (targetUserIds.length == 0) {' + NL;
        serverScript += '        data.empty = true;' + NL;
        serverScript += '        data.empty_message = "No users found in your " + scope + ".";' + NL;
        serverScript += '        return;' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Proficiency bonus map' + NL;
        serverScript += '    var profBonus = {' + NL;
        serverScript += '        "novice": 2,' + NL;
        serverScript += '        "intermediate": 5,' + NL;
        serverScript += '        "proficient": 10,' + NL;
        serverScript += '        "advanced": 20,' + NL;
        serverScript += '        "expert": 35' + NL;
        serverScript += '    };' + NL;
        serverScript += '' + NL;
        serverScript += '    // Calculate quarter start for bonus' + NL;
        serverScript += '    var now = new GlideDateTime();' + NL;
        serverScript += '    var currentMonth = parseInt(now.getMonthLocalTime(), 10);' + NL;
        serverScript += '    var quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;' + NL;
        serverScript += '    var quarterStart = new GlideDateTime();' + NL;
        serverScript += '    quarterStart.setDisplayValue(now.getYearLocalTime() + "-" + (quarterStartMonth < 10 ? "0" : "") + quarterStartMonth + "-01 00:00:00");' + NL;
        serverScript += '    var quarterStartVal = quarterStart.getValue();' + NL;
        serverScript += '' + NL;
        serverScript += '    // Query all skills for target users' + NL;
        serverScript += '    var skillGr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '    skillGr.addQuery("user", "IN", targetUserIds.join(","));' + NL;
        serverScript += '    skillGr.query();' + NL;
        serverScript += '' + NL;
        serverScript += '    while (skillGr.next()) {' + NL;
        serverScript += '        var skillUser = skillGr.user.toString();' + NL;
        serverScript += '        if (!userMap[skillUser]) continue;' + NL;
        serverScript += '' + NL;
        serverScript += '        var entry = userMap[skillUser];' + NL;
        serverScript += '        entry.skill_count++;' + NL;
        serverScript += '' + NL;
        serverScript += '        // +10 per skill owned' + NL;
        serverScript += '        entry.points += 10;' + NL;
        serverScript += '' + NL;
        serverScript += '        // Proficiency bonus' + NL;
        serverScript += '        var level = skillGr.skill_level.toString().toLowerCase();' + NL;
        serverScript += '        if (profBonus[level]) {' + NL;
        serverScript += '            entry.points += profBonus[level];' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        // +5 per endorsement received' + NL;
        serverScript += '        var endorseCount = parseInt(skillGr.getValue("u_peer_endorsement_count") || "0", 10);' + NL;
        serverScript += '        entry.points += endorseCount * 5;' + NL;
        serverScript += '        entry.endorsement_count += endorseCount;' + NL;
        serverScript += '' + NL;
        serverScript += '        // +15 per validated skill' + NL;
        serverScript += '        var valStatus = skillGr.getValue("u_validation_status") || "";' + NL;
        serverScript += '        if (valStatus == "validated") {' + NL;
        serverScript += '            entry.points += 15;' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        // +8 per skill added this quarter' + NL;
        serverScript += '        var createdOn = skillGr.getValue("sys_created_on") || "";' + NL;
        serverScript += '        if (createdOn && createdOn >= quarterStartVal) {' + NL;
        serverScript += '            entry.points += 8;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Add endorsements given (+3 each) for all target users' + NL;
        serverScript += '    var egGr = new GlideRecord("u_m2m_skill_endorsement");' + NL;
        serverScript += '    egGr.addQuery("u_endorser", "IN", targetUserIds.join(","));' + NL;
        serverScript += '    egGr.query();' + NL;
        serverScript += '    while (egGr.next()) {' + NL;
        serverScript += '        var endorser = egGr.u_endorser.toString();' + NL;
        serverScript += '        if (userMap[endorser]) {' + NL;
        serverScript += '            userMap[endorser].points += 3;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Tier determination function' + NL;
        serverScript += '    function getTier(points) {' + NL;
        serverScript += '        if (points >= 500) return { name: "Luminary", icon: "fa-sun" };' + NL;
        serverScript += '        if (points >= 300) return { name: "Trailblazer", icon: "fa-fire" };' + NL;
        serverScript += '        if (points >= 150) return { name: "Specialist", icon: "fa-star" };' + NL;
        serverScript += '        if (points >= 50) return { name: "Contributor", icon: "fa-hand-holding-heart" };' + NL;
        serverScript += '        return { name: "Starter", icon: "fa-seedling" };' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Build sorted leaders array' + NL;
        serverScript += '    var leaders = [];' + NL;
        serverScript += '    for (var userId in userMap) {' + NL;
        serverScript += '        if (userMap.hasOwnProperty(userId)) {' + NL;
        serverScript += '            var u = userMap[userId];' + NL;
        serverScript += '            var tier = getTier(u.points);' + NL;
        serverScript += '            u.tier_name = tier.name;' + NL;
        serverScript += '            u.tier_icon = tier.icon;' + NL;
        serverScript += '            leaders.push(u);' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // Sort descending by points, then by name alphabetically for ties' + NL;
        serverScript += '    leaders.sort(function(a, b) {' + NL;
        serverScript += '        if (b.points != a.points) return b.points - a.points;' + NL;
        serverScript += '        return (a.name > b.name) ? 1 : (a.name < b.name) ? -1 : 0;' + NL;
        serverScript += '    });' + NL;
        serverScript += '' + NL;
        serverScript += '    // Assign rank' + NL;
        serverScript += '    for (var i = 0; i < leaders.length; i++) {' + NL;
        serverScript += '        leaders[i].rank = i + 1;' + NL;
        serverScript += '        leaders[i].is_current_user = (leaders[i].sys_id == me);' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    data.leaders = leaders;' + NL;
        serverScript += '    data.total_users = leaders.length;' + NL;
        serverScript += '})();';

        // ================================================================
        // 3. Build CLIENT SCRIPT
        // ================================================================
        var clientScript = '';
        clientScript += 'api.controller = function($scope, spUtil) {' + NL;
        clientScript += '    var c = this;' + NL;
        clientScript += '' + NL;
        clientScript += '    c.activeScope = c.data.scope || "team";' + NL;
        clientScript += '' + NL;
        clientScript += '    c.switchScope = function(newScope) {' + NL;
        clientScript += '        if (newScope == c.activeScope) return;' + NL;
        clientScript += '        c.activeScope = newScope;' + NL;
        clientScript += '        c.data.loading = true;' + NL;
        clientScript += '        c.server.get({ action: "switch", scope: newScope }).then(function(response) {' + NL;
        clientScript += '            c.data.leaders = response.data.leaders;' + NL;
        clientScript += '            c.data.scope = response.data.scope;' + NL;
        clientScript += '            c.data.empty = response.data.empty;' + NL;
        clientScript += '            c.data.empty_message = response.data.empty_message;' + NL;
        clientScript += '            c.data.total_users = response.data.total_users;' + NL;
        clientScript += '            c.data.loading = false;' + NL;
        clientScript += '        });' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    c.getRankClass = function(rank) {' + NL;
        clientScript += '        if (rank == 1) return "rank-gold";' + NL;
        clientScript += '        if (rank == 2) return "rank-silver";' + NL;
        clientScript += '        if (rank == 3) return "rank-bronze";' + NL;
        clientScript += '        return "";' + NL;
        clientScript += '    };' + NL;
        clientScript += '' + NL;
        clientScript += '    c.getRankIcon = function(rank) {' + NL;
        clientScript += '        if (rank == 1) return "fa-trophy";' + NL;
        clientScript += '        if (rank == 2) return "fa-medal";' + NL;
        clientScript += '        if (rank == 3) return "fa-award";' + NL;
        clientScript += '        return "";' + NL;
        clientScript += '    };' + NL;
        clientScript += '};';

        // ================================================================
        // 4. Build TEMPLATE
        // ================================================================
        var template = '';
        template += '<div class="leaderboard-widget">' + NL;
        template += '    <div class="leaderboard-header">' + NL;
        template += '        <h3 class="leaderboard-title"><i class="fa fa-trophy"></i> Skill Leaderboard</h3>' + NL;
        template += '        <div class="scope-toggle">' + NL;
        template += '            <button class="btn btn-sm" ' + NL;
        template += '                    ng-class="{\'btn-primary\': c.activeScope == \'team\', \'btn-default\': c.activeScope != \'team\'}" ' + NL;
        template += '                    ng-click="c.switchScope(\'team\')">' + NL;
        template += '                <i class="fa fa-users"></i> My Team' + NL;
        template += '            </button>' + NL;
        template += '            <button class="btn btn-sm" ' + NL;
        template += '                    ng-class="{\'btn-primary\': c.activeScope == \'department\', \'btn-default\': c.activeScope != \'department\'}" ' + NL;
        template += '                    ng-click="c.switchScope(\'department\')">' + NL;
        template += '                <i class="fa fa-building"></i> Department' + NL;
        template += '            </button>' + NL;
        template += '        </div>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <div class="leaderboard-loading" ng-if="c.data.loading">' + NL;
        template += '        <i class="fa fa-spinner fa-spin"></i> Loading...' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <div class="leaderboard-empty" ng-if="c.data.empty && !c.data.loading">' + NL;
        template += '        <i class="fa fa-info-circle"></i>' + NL;
        template += '        <p>{{c.data.empty_message || "No data available."}}</p>' + NL;
        template += '    </div>' + NL;
        template += '' + NL;
        template += '    <div class="leaderboard-table-wrap" ng-if="!c.data.empty && !c.data.loading">' + NL;
        template += '        <table class="leaderboard-table">' + NL;
        template += '            <thead>' + NL;
        template += '                <tr>' + NL;
        template += '                    <th class="col-rank">Rank</th>' + NL;
        template += '                    <th class="col-user">User</th>' + NL;
        template += '                    <th class="col-points">Points</th>' + NL;
        template += '                    <th class="col-tier">Tier</th>' + NL;
        template += '                    <th class="col-skills">Skills</th>' + NL;
        template += '                </tr>' + NL;
        template += '            </thead>' + NL;
        template += '            <tbody>' + NL;
        template += '                <tr ng-repeat="leader in c.data.leaders track by leader.sys_id" ' + NL;
        template += '                    ng-class="{\'current-user-row\': leader.is_current_user}">' + NL;
        template += '                    <td class="col-rank">' + NL;
        template += '                        <span class="rank-number" ng-class="c.getRankClass(leader.rank)">' + NL;
        template += '                            <i class="fa" ng-class="c.getRankIcon(leader.rank)" ng-if="leader.rank <= 3"></i>' + NL;
        template += '                            <span ng-if="leader.rank > 3">{{leader.rank}}</span>' + NL;
        template += '                        </span>' + NL;
        template += '                    </td>' + NL;
        template += '                    <td class="col-user">' + NL;
        template += '                        <div class="user-cell">' + NL;
        template += '                            <div class="user-avatar" ng-if="!leader.avatar">{{leader.initials}}</div>' + NL;
        template += '                            <img class="user-avatar-img" ng-if="leader.avatar" ng-src="{{leader.avatar}}" alt="{{leader.name}}" />' + NL;
        template += '                            <div class="user-info">' + NL;
        template += '                                <div class="user-name">{{leader.name}}</div>' + NL;
        template += '                                <div class="user-title">{{leader.title}}</div>' + NL;
        template += '                            </div>' + NL;
        template += '                        </div>' + NL;
        template += '                    </td>' + NL;
        template += '                    <td class="col-points">' + NL;
        template += '                        <span class="points-value">{{leader.points}}</span>' + NL;
        template += '                    </td>' + NL;
        template += '                    <td class="col-tier">' + NL;
        template += '                        <span class="tier-badge-mini">' + NL;
        template += '                            <i class="fa {{leader.tier_icon}}"></i>' + NL;
        template += '                            <span>{{leader.tier_name}}</span>' + NL;
        template += '                        </span>' + NL;
        template += '                    </td>' + NL;
        template += '                    <td class="col-skills">' + NL;
        template += '                        <span class="skills-count">{{leader.skill_count}}</span>' + NL;
        template += '                    </td>' + NL;
        template += '                </tr>' + NL;
        template += '            </tbody>' + NL;
        template += '        </table>' + NL;
        template += '        <div class="leaderboard-footer">' + NL;
        template += '            <span class="total-label">{{c.data.total_users}} users in your {{c.data.scope}}</span>' + NL;
        template += '        </div>' + NL;
        template += '    </div>' + NL;
        template += '</div>';

        // ================================================================
        // 5. Build CSS
        // ================================================================
        var css = '';
        css += '/* ===== Skills Hub Leaderboard Widget ===== */' + NL;
        css += '.leaderboard-widget {' + NL;
        css += '    font-family: "Source Sans Pro", Arial, sans-serif;' + NL;
        css += '}' + NL;
        css += '.leaderboard-header {' + NL;
        css += '    display: flex;' + NL;
        css += '    justify-content: space-between;' + NL;
        css += '    align-items: center;' + NL;
        css += '    margin-bottom: 16px;' + NL;
        css += '    flex-wrap: wrap;' + NL;
        css += '    gap: 8px;' + NL;
        css += '}' + NL;
        css += '.leaderboard-title {' + NL;
        css += '    font-size: 1.3em;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    color: #333333;' + NL;
        css += '    margin: 0;' + NL;
        css += '}' + NL;
        css += '.leaderboard-title .fa {' + NL;
        css += '    color: #f0ad4e;' + NL;
        css += '    margin-right: 6px;' + NL;
        css += '}' + NL;
        css += '.scope-toggle .btn {' + NL;
        css += '    margin-left: 4px;' + NL;
        css += '    border-radius: 20px;' + NL;
        css += '    padding: 4px 14px;' + NL;
        css += '    font-size: 0.85em;' + NL;
        css += '}' + NL;
        css += '.scope-toggle .btn-primary {' + NL;
        css += '    background-color: #0072CE;' + NL;
        css += '    border-color: #0072CE;' + NL;
        css += '}' + NL;
        css += '.leaderboard-loading {' + NL;
        css += '    text-align: center;' + NL;
        css += '    padding: 40px 0;' + NL;
        css += '    color: #888888;' + NL;
        css += '    font-size: 1.1em;' + NL;
        css += '}' + NL;
        css += '.leaderboard-empty {' + NL;
        css += '    text-align: center;' + NL;
        css += '    padding: 40px 20px;' + NL;
        css += '    color: #999999;' + NL;
        css += '}' + NL;
        css += '.leaderboard-empty .fa {' + NL;
        css += '    font-size: 2em;' + NL;
        css += '    margin-bottom: 10px;' + NL;
        css += '    display: block;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table-wrap {' + NL;
        css += '    overflow-x: auto;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table {' + NL;
        css += '    width: 100%;' + NL;
        css += '    border-collapse: separate;' + NL;
        css += '    border-spacing: 0 4px;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table thead th {' + NL;
        css += '    font-size: 0.8em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    text-transform: uppercase;' + NL;
        css += '    color: #888888;' + NL;
        css += '    padding: 8px 12px;' + NL;
        css += '    border-bottom: 2px solid #e0e0e0;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table tbody tr {' + NL;
        css += '    background: #ffffff;' + NL;
        css += '    transition: background 0.15s ease;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table tbody tr:hover {' + NL;
        css += '    background: #f8f9fa;' + NL;
        css += '}' + NL;
        css += '.leaderboard-table td {' + NL;
        css += '    padding: 10px 12px;' + NL;
        css += '    vertical-align: middle;' + NL;
        css += '    border-bottom: 1px solid #f0f0f0;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Rank column */' + NL;
        css += '.col-rank {' + NL;
        css += '    width: 60px;' + NL;
        css += '    text-align: center;' + NL;
        css += '}' + NL;
        css += '.rank-number {' + NL;
        css += '    display: inline-flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    justify-content: center;' + NL;
        css += '    width: 32px;' + NL;
        css += '    height: 32px;' + NL;
        css += '    border-radius: 50%;' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    font-size: 0.9em;' + NL;
        css += '    color: #666666;' + NL;
        css += '    background: #f0f0f0;' + NL;
        css += '}' + NL;
        css += '.rank-gold {' + NL;
        css += '    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);' + NL;
        css += '    color: #ffffff;' + NL;
        css += '    font-size: 1.1em;' + NL;
        css += '    box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);' + NL;
        css += '}' + NL;
        css += '.rank-silver {' + NL;
        css += '    background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);' + NL;
        css += '    color: #ffffff;' + NL;
        css += '    font-size: 1.05em;' + NL;
        css += '    box-shadow: 0 2px 6px rgba(192, 192, 192, 0.4);' + NL;
        css += '}' + NL;
        css += '.rank-bronze {' + NL;
        css += '    background: linear-gradient(135deg, #CD7F32 0%, #A0522D 100%);' + NL;
        css += '    color: #ffffff;' + NL;
        css += '    font-size: 1em;' + NL;
        css += '    box-shadow: 0 2px 6px rgba(205, 127, 50, 0.4);' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* User column */' + NL;
        css += '.user-cell {' + NL;
        css += '    display: flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    gap: 10px;' + NL;
        css += '}' + NL;
        css += '.user-avatar {' + NL;
        css += '    width: 36px;' + NL;
        css += '    height: 36px;' + NL;
        css += '    border-radius: 50%;' + NL;
        css += '    background-color: #0072CE;' + NL;
        css += '    color: #ffffff;' + NL;
        css += '    display: flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    justify-content: center;' + NL;
        css += '    font-size: 0.85em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    flex-shrink: 0;' + NL;
        css += '}' + NL;
        css += '.user-avatar-img {' + NL;
        css += '    width: 36px;' + NL;
        css += '    height: 36px;' + NL;
        css += '    border-radius: 50%;' + NL;
        css += '    object-fit: cover;' + NL;
        css += '    flex-shrink: 0;' + NL;
        css += '}' + NL;
        css += '.user-info {' + NL;
        css += '    min-width: 0;' + NL;
        css += '}' + NL;
        css += '.user-name {' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #333333;' + NL;
        css += '    font-size: 0.95em;' + NL;
        css += '    white-space: nowrap;' + NL;
        css += '    overflow: hidden;' + NL;
        css += '    text-overflow: ellipsis;' + NL;
        css += '}' + NL;
        css += '.user-title {' + NL;
        css += '    font-size: 0.8em;' + NL;
        css += '    color: #999999;' + NL;
        css += '    white-space: nowrap;' + NL;
        css += '    overflow: hidden;' + NL;
        css += '    text-overflow: ellipsis;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Points column */' + NL;
        css += '.points-value {' + NL;
        css += '    font-weight: 700;' + NL;
        css += '    font-size: 1.1em;' + NL;
        css += '    color: #0072CE;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Tier column */' + NL;
        css += '.tier-badge-mini {' + NL;
        css += '    display: inline-flex;' + NL;
        css += '    align-items: center;' + NL;
        css += '    gap: 6px;' + NL;
        css += '    padding: 3px 10px;' + NL;
        css += '    border-radius: 12px;' + NL;
        css += '    background: #f0f7ff;' + NL;
        css += '    font-size: 0.85em;' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #0072CE;' + NL;
        css += '}' + NL;
        css += '.tier-badge-mini .fa {' + NL;
        css += '    font-size: 1.1em;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Skills count */' + NL;
        css += '.skills-count {' + NL;
        css += '    font-weight: 600;' + NL;
        css += '    color: #555555;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Current user highlight */' + NL;
        css += '.current-user-row {' + NL;
        css += '    background: #e8f4fd !important;' + NL;
        css += '    border-left: 3px solid #0072CE;' + NL;
        css += '}' + NL;
        css += '.current-user-row .user-name {' + NL;
        css += '    color: #0072CE;' + NL;
        css += '}' + NL;
        css += '' + NL;
        css += '/* Footer */' + NL;
        css += '.leaderboard-footer {' + NL;
        css += '    text-align: center;' + NL;
        css += '    padding: 12px 0 4px;' + NL;
        css += '    font-size: 0.8em;' + NL;
        css += '    color: #aaaaaa;' + NL;
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
            gs.info('[Skills Hub] Leaderboard widget created successfully (sys_id: ' + widgetSysId + ')');
        } else {
            gs.error('[Skills Hub] FAILED to create leaderboard widget');
            return;
        }

        // ================================================================
        // 7. Summary
        // ================================================================
        gs.info('[Skills Hub] ===== LEADERBOARD WIDGET CREATION SUMMARY =====');
        gs.info('[Skills Hub] Widget name: ' + WIDGET_NAME);
        gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
        gs.info('[Skills Hub] Widget sys_id: ' + widgetSysId);
        gs.info('[Skills Hub] Server script: tier point calculation for team/department');
        gs.info('[Skills Hub] Client script: scope toggle (team/department)');
        gs.info('[Skills Hub] Template: leaderboard table with rank, user, points, tier, skills');
        gs.info('[Skills Hub] CSS: gold/silver/bronze ranks, current user highlight, tier badges');
        gs.info('[Skills Hub] ================================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 21_create_leaderboard_widget: ' + e.message);
    }
})();
