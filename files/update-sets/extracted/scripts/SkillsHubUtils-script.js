var SkillsHubUtils = Class.create();
SkillsHubUtils.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /* Search for Experts */
    searchExperts: function() {
        var searchTerm = this.getParameter('sysparm_search_term');
        var interestFilter = this.getParameter('sysparm_interest_filter');
        var results = [];
        
        var gr = new GlideRecord('sys_user_has_skill');
        gr.addQuery('skill.name', 'CONTAINS', searchTerm);
        if (interestFilter == 'true') {
            gr.addQuery('u_interest_level', '!=', 'low');
        }
        gr.orderByDesc('skill_level');
        gr.setLimit(50);
        gr.query();
        
        while (gr.next()) {
            results.push({
                id: gr.sys_id.toString(),
                user_name: gr.user.name.toString(),
                skill: gr.skill.name.toString(),
                proficiency: gr.skill_level.toString(),
                interest: gr.u_interest_level.toString(),
                endorsements: gr.u_peer_endorsement_count.toString(),
                endorsed: false // Client can check this if needed
            });
        }
        return JSON.stringify(results);
    },

    /* Manager Matrix Data Fetch */
    getManagerMatrix: function() {
        var managerId = this.getParameter('sysparm_manager_id') || gs.getUserID();
        var data = {};
        var users = [];
        
        // 1. Get Direct Reports
        var ugr = new GlideRecord('sys_user');
        ugr.addQuery('manager', managerId);
        ugr.query();
        while(ugr.next()) {
            users.push(ugr.sys_id.toString());
            data[ugr.sys_id.toString()] = { name: ugr.name.toString(), skills: {} };
        }
        
        // 2. Get Skills and Validation Status
        if (users.length > 0) {
            var sgr = new GlideRecord('sys_user_has_skill');
            sgr.addQuery('user', 'IN', users);
            sgr.query();
            while(sgr.next()) {
                var uid = sgr.user.toString();
                var skillName = sgr.skill.name.toString();
                // Check if validation date exists
                var isValid = !sgr.u_last_manager_validation.nil();
                
                data[uid].skills[skillName] = {
                   level: sgr.skill_level.toString(),
                   interest: sgr.u_interest_level.toString(),
                   validated: isValid
                };
            }
        }
        return JSON.stringify(data);
    },

    type: 'SkillsHubUtils'
});