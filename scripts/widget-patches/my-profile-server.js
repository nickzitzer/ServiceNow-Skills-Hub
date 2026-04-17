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
  data.stats = { total_skills: 0, total_validations: 0, total_endorsed_given: 0, total_validated_skills: 0 };

  var s = new GlideRecord("sys_user_has_skill");
  s.addQuery("user", me);
  s.orderBy("skill.name");
  s.query();

  data.stats.total_skills = s.getRowCount();

  var profBonusMap = { 1: 2, 2: 5, 3: 10, 4: 20, 5: 35 };

  while (s.next()) {
    var levelStr = s.skill_level.toString();
    var levelInt = 1;
    if (levelStr.indexOf("Novice") > -1) levelInt = 1;
    else if (levelStr.indexOf("Learner") > -1) levelInt = 2;
    else if (levelStr.indexOf("Intermediate") > -1) levelInt = 2;
    else if (levelStr.indexOf("Proficient") > -1) levelInt = 3;
    else if (levelStr.indexOf("Advanced") > -1) levelInt = 4;
    else if (levelStr.indexOf("Expert") > -1) levelInt = 5;

    var endorsements = parseInt(s.u_peer_endorsement_count.toString() || "0");
    data.stats.total_validations += endorsements;

    // Track validated skills
    var valStatus = s.u_validation_status.toString();
    if (valStatus == "validated") {
       data.stats.total_validated_skills++;
    }

    data.skills.push({
      sys_id: s.getUniqueValue(),
      name: s.skill.name.toString(),
      initials: s.skill.name.toString().substring(0,2).toUpperCase(),
      category: s.skill.category.getDisplayValue() || data.user_dept || "Skill",
      level_display: levelStr,
      level_value: levelInt,
      interest: s.u_interest_level.toString() || "neutral",
      endorsements: endorsements,
      validation_status: valStatus
    });
  }

  // Count endorsements given by this user
  var eg = new GlideAggregate("u_m2m_skill_endorsement");
  eg.addQuery("u_endorser", me);
  eg.addAggregate("COUNT");
  eg.query();
  if (eg.next()) {
     data.stats.total_endorsed_given = parseInt(eg.getAggregate("COUNT")) || 0;
  }

  // Count skills added this quarter
  var quarterStart = new GlideDateTime();
  var month = parseInt(quarterStart.getMonthLocalTime());
  var qMonth = month - ((month - 1) % 3);
  quarterStart.setMonthLocalTime(qMonth);
  quarterStart.setDayOfMonthLocalTime(1);
  quarterStart.setValue(quarterStart.getDate() + " 00:00:00");

  var recentCount = 0;
  var rc = new GlideRecord("sys_user_has_skill");
  rc.addQuery("user", me);
  rc.addQuery("sys_created_on", ">=", quarterStart);
  rc.query();
  recentCount = rc.getRowCount();

  // --- 4. TIER CALCULATION ---
  // Points: +10 per skill, +proficiency bonus, +5 per endorsement received,
  //         +3 per endorsement given, +15 per validated skill, +8 per skill added this quarter
  var totalPoints = 0;
  totalPoints += data.stats.total_skills * 10;
  for (var i = 0; i < data.skills.length; i++) {
     totalPoints += (profBonusMap[data.skills[i].level_value] || 2);
  }
  totalPoints += data.stats.total_validations * 5;
  totalPoints += data.stats.total_endorsed_given * 3;
  totalPoints += data.stats.total_validated_skills * 15;
  totalPoints += recentCount * 8;

  // Tier definitions
  var tiers = [
     { name: "Starter",      min: 0,   max: 49,  icon: "fa-seedling",            color: "#94a3b8", tagline: "Just getting started" },
     { name: "Contributor",   min: 50,  max: 149, icon: "fa-hand-holding-heart",  color: "#3b82f6", tagline: "Building your portfolio" },
     { name: "Specialist",    min: 150, max: 299, icon: "fa-star",                color: "#8b5cf6", tagline: "Deep expertise emerging" },
     { name: "Trailblazer",   min: 300, max: 499, icon: "fa-fire",                color: "#f59e0b", tagline: "Leading by example" },
     { name: "Luminary",      min: 500, max: 99999, icon: "fa-sun",               color: "#ef4444", tagline: "Organizational skill champion" }
  ];

  var tier = tiers[0];
  var nextTier = tiers[1];
  for (var t = 0; t < tiers.length; t++) {
     if (totalPoints >= tiers[t].min && totalPoints <= tiers[t].max) {
        tier = tiers[t];
        nextTier = (t < tiers.length - 1) ? tiers[t + 1] : null;
        break;
     }
  }

  var progressPercent = 0;
  if (nextTier) {
     var range = nextTier.min - tier.min;
     var progress = totalPoints - tier.min;
     progressPercent = Math.min(Math.round((progress / range) * 100), 100);
  } else {
     progressPercent = 100; // Max tier
  }

  data.tier = {
     name: tier.name,
     icon: tier.icon,
     color: tier.color,
     tagline: tier.tagline,
     points: totalPoints,
     progress_percent: progressPercent,
     next_tier: nextTier ? nextTier.name : null,
     next_tier_min: nextTier ? nextTier.min : 0,
     points_to_next: nextTier ? (nextTier.min - totalPoints) : 0
  };
})();
