function($scope, spUtil) {
  var c = this;
  c.data = {};
  c.stats = { reports: 0, pending: 0, validated: 0, disputed: 0 };
  c.noData = false;
  c.statusFilter = "all"; // all | pending | validated | disputed

  c.load = function() {
    var ga = new GlideAjax("SkillsHubUtils");
    ga.addParam("sysparm_name", "getManagerMatrix");
    ga.getXMLAnswer(function(response) {
       if(response) {
          var data = JSON.parse(response);
          var count = 0;
          var pending = 0;
          var valid = 0;
          var disputed = 0;

          for (var uid in data) {
             count++;
             var names = data[uid].name.split(" ");
             data[uid].initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();

             for(var s in data[uid].skills) {
                var sk = data[uid].skills[s];
                if(sk.validated) valid++;
                else if(sk.status == "disputed") disputed++;
                else pending++;
             }
          }
          c.data = data;
          c.stats.reports = count;
          c.stats.pending = pending;
          c.stats.validated = valid;
          c.stats.disputed = disputed;
          c.noData = (count === 0);
       }
       $scope.$apply();
    });
  };

  c.load();

  c.validate = function(userId, skillName, details) {
     if(details.validated) return;

     if(confirm("Validate " + skillName + " for this employee?")) {
        c.server.get({ action: "validate", userId: userId, skillName: skillName }).then(function(r){
           if (r.data.success) {
              details.validated = true;
              details.status = "validated";
              c.stats.pending--;
              c.stats.validated++;
              spUtil.addInfoMessage("Skill validated: " + skillName);
           } else {
              spUtil.addErrorMessage(r.data.error || "Validation failed");
           }
        });
     }
  };

  c.openDisputeModal = function(userId, skillName, details) {
     c.disputeTarget = { userId: userId, skillName: skillName, details: details };
     c.disputeNotes = "";
     c.disputeLevel = "";
     c.showDisputeModal = true;
  };

  c.cancelDispute = function() {
     c.showDisputeModal = false;
     c.disputeTarget = null;
  };

  c.submitDispute = function() {
     if (!c.disputeNotes) {
        spUtil.addErrorMessage("Please enter notes explaining the dispute.");
        return;
     }
     var t = c.disputeTarget;
     c.server.get({
        action: "dispute",
        userId: t.userId,
        skillName: t.skillName,
        notes: c.disputeNotes,
        assessedLevel: c.disputeLevel
     }).then(function(r){
        if (r.data.success) {
           t.details.validated = false;
           t.details.status = "disputed";
           if (c.stats.pending > 0) c.stats.pending--;
           c.stats.disputed++;
           spUtil.addInfoMessage("Skill disputed: " + t.skillName);
        } else {
           spUtil.addErrorMessage(r.data.error || "Dispute failed");
        }
        c.showDisputeModal = false;
        c.disputeTarget = null;
     });
  };

  c.bulkValidate = function(userId, userName) {
     if(confirm("Validate ALL pending skills for " + userName + "?")) {
        c.server.get({ action: "bulkValidate", userId: userId }).then(function(r){
           if (r.data.success) {
              var user = c.data[userId];
              for (var s in user.skills) {
                 if (!user.skills[s].validated) {
                    user.skills[s].validated = true;
                    user.skills[s].status = "validated";
                    c.stats.pending--;
                    c.stats.validated++;
                 }
              }
              spUtil.addInfoMessage("Bulk validated " + r.data.bulkCount + " skills for " + userName);
           } else {
              spUtil.addErrorMessage(r.data.error || "Bulk validation failed");
           }
        });
     }
  };

  c.showSkill = function(details) {
     if (c.statusFilter == "all") return true;
     if (c.statusFilter == "validated") return details.validated;
     if (c.statusFilter == "disputed") return details.status == "disputed";
     if (c.statusFilter == "pending") return !details.validated && details.status != "disputed";
     return true;
  };
}
