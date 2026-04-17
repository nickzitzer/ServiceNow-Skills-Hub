(function() {
  // Configurable Scoring Constants
  var SCORE_MUST_HAVE = 20;
  var SCORE_NICE_HAVE = 5;
  var MULTIPLIER_EXPERT = 1.5;
  var MULTIPLIER_ADVANCED = 1.2;
  
  if (input && input.action == "search") {
     var matches = [];
     var mustIds = input.mustHave ? input.mustHave.split(",") : [];
     var niceIds = input.niceHave ? input.niceHave.split(",") : [];
     var allSkillIds = mustIds.concat(niceIds);
     
     // 1. Find Users who have ANY of these skills
     var users = {}; // Map: sys_id -> { score: 0, skills: [] }
     
     var gr = new GlideRecord("sys_user_has_skill");
     gr.addQuery("skill", "IN", allSkillIds);
     gr.addQuery("user.active", true);
     gr.query();
     
     while (gr.next()) {
        var uid = gr.user.toString();
        var skillId = gr.skill.toString();
        var skillName = gr.skill.name.toString();
        var level = gr.skill_level.toString();
        
        if (!users[uid]) {
           users[uid] = {
              sys_id: uid,
              name: gr.user.name.toString(),
              title: gr.user.title.toString() || "Employee",
              skills: [],
              rawScore: 0,
              mustHits: 0
           };
        }
        
        // Scoring Logic
        var points = 0;
        var isMust = (mustIds.indexOf(skillId) > -1);
        
        // Base Points for having the skill
        if (isMust) {
           points += SCORE_MUST_HAVE;
           users[uid].mustHits++;
        } else {
           points += SCORE_NICE_HAVE;
        }
        
        // Proficiency Multiplier
        if (level.indexOf("Expert") > -1) points *= MULTIPLIER_EXPERT;
        else if (level.indexOf("Advanced") > -1) points *= MULTIPLIER_ADVANCED;
        
        users[uid].rawScore += points;
        users[uid].skills.push({ name: skillName, matched: true });
     }
     
     // 2. Format Results
     var maxPossible = (mustIds.length * (SCORE_MUST_HAVE * 1.5)) + (niceIds.length * (SCORE_NICE_HAVE * 1.5));
     if (maxPossible == 0) maxPossible = 100;
     
     for (var id in users) {
        var u = users[id];
        
        var matchPct = Math.min(Math.round((u.rawScore / maxPossible) * 100), 100);
        if (matchPct > 100) matchPct = 99;
        
        // Default to "High" availability as OOB sys_user has no availability field.
        // This can be enhanced to check resource_allocation tables if PPM is installed.
        var avail = "high";
        
        var names = u.name.split(" ");
        var initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();
        
        matches.push({
           id: u.sys_id,
           name: u.name,
           title: u.title,
           initials: initials,
           skills: u.skills,
           matchScore: matchPct,
           availability: avail
        });
     }
     
     // Sort by Score
     matches.sort(function(a, b) { return b.matchScore - a.matchScore; });
     
     data.matches = matches;
  }
})();