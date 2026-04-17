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
        var skillRecordId = gr.getUniqueValue();

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
        users[uid].skills.push({
           name: skillName,
           matched: true,
           skill_record_id: skillRecordId
        });
     }

     // 2. Format Results
     var maxPossible = (mustIds.length * (SCORE_MUST_HAVE * 1.5)) + (niceIds.length * (SCORE_NICE_HAVE * 1.5));
     if (maxPossible == 0) maxPossible = 100;

     for (var id in users) {
        var u = users[id];

        var matchPct = Math.min(Math.round((u.rawScore / maxPossible) * 100), 100);
        if (matchPct > 100) matchPct = 99;

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

  // --- ENDORSE ACTION ---
  if (input && input.action == "endorse") {
     var endorser = gs.getUserID();
     var skillRecId = input.skill_record_id;
     data.endorsed = false;
     data.endorseError = "";

     if (!skillRecId) {
        data.endorseError = "No skill record specified.";
     } else {
        // Check the skill record exists and get the owner
        var skillRec = new GlideRecord("sys_user_has_skill");
        if (!skillRec.get(skillRecId)) {
           data.endorseError = "Skill record not found.";
        } else {
           var skillOwner = skillRec.user.toString();

           // Prevent self-endorsement
           if (endorser == skillOwner) {
              data.endorseError = "You cannot endorse your own skill.";
           } else {
              // Prevent duplicate endorsement
              var dup = new GlideRecord("u_m2m_skill_endorsement");
              dup.addQuery("u_endorser", endorser);
              dup.addQuery("u_skill_record", skillRecId);
              dup.query();
              if (dup.hasNext()) {
                 data.endorseError = "You have already endorsed this skill.";
              } else {
                 // Create endorsement
                 var endorse = new GlideRecord("u_m2m_skill_endorsement");
                 endorse.initialize();
                 endorse.u_endorser = endorser;
                 endorse.u_skill_record = skillRecId;
                 var newId = endorse.insert();
                 if (newId) {
                    data.endorsed = true;
                 } else {
                    data.endorseError = "Failed to create endorsement record.";
                 }
              }
           }
        }
     }
  }
})();
