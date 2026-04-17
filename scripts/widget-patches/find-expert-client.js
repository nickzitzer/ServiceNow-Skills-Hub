function($scope, spUtil) {
  var c = this;
  c.viewMode = "grid";
  c.mustHave = { value: "", displayValue: "" };
  c.niceHave = { value: "", displayValue: "" };
  c.availableOnly = true;
  c.sameDept = false;
  c.searched = false;
  c.loading = false;
  c.results = [];

  c.search = function() {
     // Basic Validation
     if (!c.mustHave.value && !c.niceHave.value) return;

     c.loading = true;
     c.searched = true;
     c.results = [];

     c.server.get({
        action: "search",
        mustHave: c.mustHave.value,
        niceHave: c.niceHave.value,
        filters: { available: c.availableOnly, dept: c.sameDept }
     }).then(function(r) {
        c.loading = false;
        if (r.data.matches) {
           c.results = r.data.matches;
        }
     });
  };

  c.getScoreClass = function(score) {
     if (score >= 90) return "score-high";
     if (score >= 70) return "score-med";
     return "score-low";
  };

  c.endorse = function(user) {
     // Endorse the first skill in their matched list
     if (!user.skills || user.skills.length === 0) {
        spUtil.addErrorMessage("No skill to endorse.");
        return;
     }
     var skillRecId = user.skills[0].skill_record_id;
     if (!skillRecId) {
        spUtil.addInfoMessage("Endorsement not available for this result.");
        return;
     }

     c.server.get({
        action: "endorse",
        skill_record_id: skillRecId
     }).then(function(r) {
        if (r.data.endorsed) {
           spUtil.addInfoMessage("Endorsed " + user.name + "!");
        } else if (r.data.endorseError) {
           spUtil.addErrorMessage(r.data.endorseError);
        }
     });
  };
}
