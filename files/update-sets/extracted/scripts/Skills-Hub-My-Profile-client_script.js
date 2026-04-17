function($scope, spUtil, $uibModal) {
  var c = this;
  
  // 1. Interactive Update: Proficiency
  c.updateProficiency = function(skill, newVal) {
     if(skill.level_value == newVal) return; // No change
     var oldVal = skill.level_value;
     skill.level_value = newVal;
     
     c.server.get({
        action: "update_proficiency",
        skill_id: skill.sys_id,
        level_value: newVal
     }).then(function(r) {
        if(r.data.error) {
           skill.level_value = oldVal; // Revert on error
           spUtil.addErrorMessage("Error updating skill");
        } else {
           // Update Stats from server
           c.data.stats = r.data.stats;
        }
     });
  };
  
  // 2. Toggle Interest (Simple High/Neutral Toggle for Card View)
  c.toggleInterest = function(skill) {
     var newInterest = (skill.interest == "high") ? "neutral" : "high";
     skill.interest = newInterest;
     
     c.server.get({
        action: "update_interest",
        skill_id: skill.sys_id,
        interest: newInterest
     });
  };
  
  // 3. Remove Skill
  c.removeSkill = function(skill) {
     if(confirm("Are you sure you want to remove " + skill.name + " from your profile?")) {
        c.server.get({ action: "remove_skill", skill_id: skill.sys_id }).then(function(r){
           var idx = c.data.skills.indexOf(skill);
           if(idx > -1) c.data.skills.splice(idx, 1);
           c.data.stats = r.data.stats;
        });
     }
  };
  
  // 4. Add Skill Modal
  c.openAddModal = function() {
     var modalInstance = $uibModal.open({
        templateUrl: "addSkillModal.html",
        controller: function($scope, $uibModalInstance) {
           $scope.newSkill = { display: "", value: "", name: "newSkill" };
           $scope.save = function() {
              $uibModalInstance.close($scope.newSkill);
           };
           $scope.cancel = function() {
              $uibModalInstance.dismiss("cancel");
           };
        }
     });
     
     modalInstance.result.then(function(selectedItem) {
        c.server.get({
           action: "add_skill",
           cmn_skill_id: selectedItem.value
        }).then(function(r) {
           c.data.skills = r.data.skills;
           c.data.stats = r.data.stats;
           spUtil.addInfoMessage("Skill added successfully");
        });
     });
  };
}