function($scope, spUtil) {
  var c = this;
  c.data = {};
  c.stats = { reports: 0, pending: 0, validated: 0 };
  c.noData = false;
  
  c.load = function() {
    var ga = new GlideAjax("SkillsHubUtils");
    ga.addParam("sysparm_name", "getManagerMatrix");
    ga.getXMLAnswer(function(response) {
       if(response) {
          var data = JSON.parse(response);
          // Calculate Stats
          var count = 0;
          var pending = 0;
          var valid = 0;
          
          for (var uid in data) {
             count++;
             var names = data[uid].name.split(" ");
             data[uid].initials = (names[0][0] + (names.length > 1 ? names[names.length-1][0] : "")).toUpperCase();
             
             for(var s in data[uid].skills) {
                if(data[uid].skills[s].validated) valid++;
                else pending++;
             }
          }
          c.data = data;
          c.stats.reports = count;
          c.stats.pending = pending;
          c.stats.validated = valid;
          c.noData = (count === 0);
       }
       $scope.$apply();
    });
  };
  
  c.load();

  c.validate = function(userId, skillName, details) {
     if(details.validated) return;
     
     if(confirm("Validate " + skillName + " for this employee?")) {
        c.server.get({ action: "validate", userId: userId, skillName: skillName }).then(function(){
           details.validated = true;
           c.stats.pending--;
           c.stats.validated++;
           spUtil.addInfoMessage("Skill Validated");
        });
     }
  }
}