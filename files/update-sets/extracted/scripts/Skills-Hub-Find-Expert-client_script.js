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
     spUtil.addInfoMessage("Endorsement requested for " + user.name);
  };
}