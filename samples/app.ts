///<reference path="../typings/angularjs/angular"/>

class miAppController {

	static $inject = ["$scope", "$timeout"];

	fecha1 = {
		date : null,
		notDays: [0,6]
	};

	fecha2 = {
		date: new Date(),
		onlyDays: [4,5]
	};

	fecha3 = {
		date : new Date(),
		onlyAllowed: [new Date()]
	};

	fecha4 = {
		date: new Date(),
		notAllowed: [new Date()]
	};

	fecha5 = {
		date: new Date(),
		min: new Date(2015,11,5,0,0,0,0)
	}

	fecha6 = {
		date: new Date(),
		max: new Date(2015,11,25,0,0,0,0)
	};

	fecha7 = {
		date: new Date(),
		max: new Date(2015,11,25,0,0,0,0),
		min: new Date(2015,11,5,0,0,0,0)
	};

	fecha8 = {
		date: new Date(),
		open: false
	};

	constructor(private $scope:ng.IScope, $timeout:ng.ITimeoutService) {
		$timeout(() => {
			this.fecha1.date = new Date(1985,0,21,0,0,0,0);
		}, 2000);
	}
}

angular.module("miApp", ["dcDatePicker"]).controller("testController", miAppController);