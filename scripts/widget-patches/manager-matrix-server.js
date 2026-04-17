(function() {
  // --- ACTION HANDLERS ---
  if (input) {
     // 1. Validate a skill
     if (input.action == "validate") {
        var mgr = gs.getUserID();
        var gr = new GlideRecord("sys_user_has_skill");
        gr.addQuery("user", input.userId);
        gr.addQuery("skill.name", input.skillName);
        gr.query();
        if (gr.next()) {
           // Authorization: caller must be this user's manager
           var userGR = new GlideRecord("sys_user");
           if (userGR.get(gr.user) && userGR.manager == mgr) {
              gr.u_last_manager_validation = new GlideDateTime();
              gr.u_validation_status = "validated";
              if (input.assessedLevel) {
                 gr.u_manager_assessed_level = input.assessedLevel;
              }
              gr.update();
              data.success = true;
           } else {
              data.success = false;
              data.error = "You are not this employee's manager.";
           }
        }
     }

     // 2. Dispute a skill
     if (input.action == "dispute") {
        var mgr = gs.getUserID();
        var gr = new GlideRecord("sys_user_has_skill");
        gr.addQuery("user", input.userId);
        gr.addQuery("skill.name", input.skillName);
        gr.query();
        if (gr.next()) {
           var userGR = new GlideRecord("sys_user");
           if (userGR.get(gr.user) && userGR.manager == mgr) {
              gr.u_validation_status = "disputed";
              gr.u_validation_notes = input.notes || "";
              if (input.assessedLevel) {
                 gr.u_manager_assessed_level = input.assessedLevel;
              }
              gr.update();
              data.success = true;
           } else {
              data.success = false;
              data.error = "You are not this employee's manager.";
           }
        }
     }

     // 3. Bulk validate all skills for one employee
     if (input.action == "bulkValidate") {
        var mgr = gs.getUserID();
        var userGR = new GlideRecord("sys_user");
        if (userGR.get(input.userId) && userGR.manager == mgr) {
           var gr = new GlideRecord("sys_user_has_skill");
           gr.addQuery("user", input.userId);
           gr.addQuery("u_validation_status", "!=", "validated");
           gr.query();
           var count = 0;
           while (gr.next()) {
              gr.u_last_manager_validation = new GlideDateTime();
              gr.u_validation_status = "validated";
              gr.update();
              count++;
           }
           data.bulkCount = count;
           data.success = true;
        } else {
           data.success = false;
           data.error = "You are not this employee's manager.";
        }
     }
  }
})();
