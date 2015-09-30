'use strict';

/**
 * @ngdoc function
 * @name mobileApp.controller:MentorCtrl
 * @description
 * # MentorCtrl
 * Controller of the mobileApp
 */
angular.module('mobileApp')
  .controller('MentorCtrl', ['$scope', '$http', '$location', 'growl', 'UserService', function ($scope, $http, $location, growl, user_service) {
  	var MentorCtrl = this;
  	var user = user_service.getUser();
  	var user_id = user.user_id;

  	MentorCtrl.load = function() {
  		loading();
	  	$http({
	        method: 'GET',
	        url: base_url + 'class_get_last_batch',
	        params: {user_id: user_id, key: key}
		}).success(MentorCtrl.openBatch).error(error);

		$http({
	        method: 'GET',
	        url: base_url + 'user_get_teachers',
	        params: {city_id: user.city_id, key: key}
		}).success(function(data) {
			MentorCtrl.all_teachers = data.teachers;
		});
	}

	MentorCtrl.openBatch = function(data) {
		loaded();

		if(data.error) {
			$location.path("/message").search({"error": data.error});
			return;
		}

		// If there is no classes happening, exit without setting the other variables.
		if(data.classes.length == 0) {
			growl.addErrorMessage("Can't find batches beyond this point.", {ttl: 3000});
			return;
		}

		MentorCtrl.mentor = data;
		MentorCtrl.mentor.name = user.name;

		setTimeout(function() {
			for(var index in data.classes) {
				var cls = data.classes[index];
				
				// Disable cancelled classes
				if(cls.class_status == "0") {
					MentorCtrl.cancelClass(cls, true);
				}

				// Show the substitue dropdown if a substitue is selected.
				for(var inde in cls.teachers) {
					var teach = cls.teachers[inde];
					if(teach.substitute_id != "0") {
						// This should be done by Angluar automatically. Both of these. But its not happening. So.
						$("#substitute-" + teach.id).show();
						$("#sub-" + teach.id).val(teach.substitute_id); 
					}
				}
			}
		}, 200);
	}

	MentorCtrl.save = function(batch_id, class_on, classes) {
		loading();
		$http({
	        method: 'GET',
	        url: base_url + 'class_save',
	        params: {user_id: user_id, key: key, class_data: angular.toJson(classes)}
		}).success(function(data) {
			loaded();
			growl.addSuccessMessage("Information Updated.", {ttl: 3000});
		}).error(error);
	}

	MentorCtrl.cancelClass = function(class_info, reverse) {
		var status = class_info.class_status;
		if(reverse) status = (status == "1") ? "0" : "1"; // This is needed when lodaing.
		var button_text = "";

		if(status == "1") {
			class_info.class_status = "0";
			button_text = "Un-Cancel Class";

			for(var teacher_index in class_info.teachers) {
				var teacher_id = class_info.teachers[teacher_index].id;
				$("#zero-hour-" + teacher_id).prop("disabled", true);
				$("#attendance-" + teacher_id).prop("disabled", true);
				$("#sub-" + teacher_id).prop("disabled", true);
			}
			// growl.addSuccessMessage("Class cancelled.", {ttl: 3000});
		} else {
			class_info.class_status = "1";
			button_text = ""; // Cancel Class

			for(var teacher_index in class_info.teachers) {
				var teacher_id = class_info.teachers[teacher_index].id;
				$("#zero-hour-" + teacher_id).prop("disabled", false);
				$("#attendance-" + teacher_id).prop("disabled", false);
				$("#sub-" + teacher_id).prop("disabled", false);
			}
		}
		$("#cancel-button-"+class_info.id).text(button_text);

	}

	MentorCtrl.showSubstitute = function(user_id, teacher) {
		for(var i in MentorCtrl.mentor.classes) {
			var cls = MentorCtrl.mentor.classes[i];
			for(var j in cls.teachers) {
				var teach = cls.teachers[j];
				if(teach.id == teacher.id) {
					if(MentorCtrl.mentor.classes[i].teachers[j].substitute_id == "0") {
						$("#substitute-"+user_id).toggle();

					} else {
						// When Hiding subs, unset the sub as well.
						MentorCtrl.mentor.classes[i].teachers[j].substitute_id = "0";
						MentorCtrl.mentor.classes[i].teachers[j].substitute = "";
						$("#substitute-"+user_id).hide();
					}
					return;
				}
			}
		}
	}

	MentorCtrl.browseClass = function(batch_id, class_on, direction) {
		var class_on = new Date(class_on);
		if(direction == "+") class_on.setDate(class_on.getDate() + 7);
		else class_on.setDate(class_on.getDate() - 7);
		var mysql_format = (class_on.getYear() + 1900) +  "-" + pad(class_on.getMonth() + 1, 2) + "-" + pad(class_on.getDate(), 2);

		loading();
		$http({
			method: 'GET',
			url: base_url + 'open_batch',
			params: {"user_id": user_id, "key": key, "batch_id": batch_id, "class_on": mysql_format}
		}).success(MentorCtrl.openBatch).error(error);
	}

    
}]);

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}