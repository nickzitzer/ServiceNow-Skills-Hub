(function() {
  var me = gs.getUserID();
  
  // --- 1. ACTION HANDLERS ---
  if (input) {
     if (input.action == "update_proficiency") {
        var gr = new GlideRecord("sys_user_has_skill");
        if (gr.get(input.skill_id) && gr.user == me) {
           var levelStrings = ["", "Novice", "Intermediate", "Proficient", "Advanced", "Expert"];
           gr.skill_level = levelStrings[input.level_value] || "Novice"; 
           gr.update();
        }
     }
     if (input.action == "update_interest") {
        var gr = new GlideRecord("sys_user_has_skill");
        if (gr.get(input.skill_id) && gr.user == me) {
           gr.u_interest_level = input.interest;
           gr.update();
        }
     }
     if (input.action == "remove_skill") {
        var gr = new GlideRecord("sys_user_has_skill");
        if (gr.get(input.skill_id) && gr.user == me) {
           gr.deleteRecord();
        }
     }
     if (input.action == "add_skill") {
        var check = new GlideRecord("sys_user_has_skill");
        check.addQuery("user", me);
        check.addQuery("skill", input.cmn_skill_id);
        check.query();
        if (!check.hasNext()) {
           var newSkill = new GlideRecord("sys_user_has_skill");
           newSkill.initialize();
           newSkill.user = me;
           newSkill.skill = input.cmn_skill_id;
           newSkill.skill_level = "Novice"; 
           newSkill.u_interest_level = "neutral"; 
           newSkill.insert();
        }
     }
  }
  
  // --- 2. GET USER PROFILE ---
  var userGR = new GlideRecord("sys_user");
  if(userGR.get(me)) {
     data.user_id = me;
     data.user_name = userGR.getDisplayValue("name");
     data.user_title = userGR.getDisplayValue("title") || "Employee";
     data.user_dept = userGR.getDisplayValue("department") || "IT";
  }
  
  // --- 3. DATA FETCH & STATS CALC ---
  data.skills = [];
  data.stats = { total_skills: 0, total_validations: 0, skill_score: 0, score_percent: 0 };
  
  var s = new GlideRecord("sys_user_has_skill");
  s.addQuery("user", me);
  s.orderBy("skill.name");
  s.query();
  
  data.stats.total_skills = s.getRowCount();
  var totalPoints = 0;
  
  while (s.next()) {
    var levelStr = s.skill_level.toString();
    var levelInt = 1;
    if (levelStr.indexOf("Novice") > -1) levelInt = 1;
    else if (levelStr.indexOf("Learner") > -1) levelInt = 2;
    else if (levelStr.indexOf("Intermediate") > -1) levelInt = 2;
    else if (levelStr.indexOf("Proficient") > -1) levelInt = 3;
    else if (levelStr.indexOf("Advanced") > -1) levelInt = 4;
    else if (levelStr.indexOf("Expert") > -1) levelInt = 5;
    
    // Add to score
    totalPoints += levelInt;
    
    var endorsements = parseInt(s.u_peer_endorsement_count.toString() || "0");
    data.stats.total_validations += endorsements;
    
    data.skills.push({
      sys_id: s.getUniqueValue(),
      name: s.skill.name.toString(),
      initials: s.skill.name.toString().substring(0,2).toUpperCase(),
      category: s.skill.category.getDisplayValue() || data.user_dept || "Skill",
      level_display: levelStr,
      level_value: levelInt,
      interest: s.u_interest_level.toString() || "neutral",
      endorsements: endorsements
    });
  }
  
  // Gamification Logic: Calculate Score based on Avg Level * Count
  // Simple calculation: Total Proficiency Points
  data.stats.skill_score = (totalPoints * 10) + (data.stats.total_validations * 5);
  // Arbitrary level cap for the progress bar (e.g., Next Badge at 500)
  data.stats.score_percent = Math.min((data.stats.skill_score / 500) * 100, 100);
})();