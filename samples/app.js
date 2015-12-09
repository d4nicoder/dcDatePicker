var miAppController = (function () {
    function miAppController($scope, $timeout) {
        var _this = this;
        this.$scope = $scope;
        this.fecha1 = {
            date: null,
            notDays: [0, 6]
        };
        this.fecha2 = {
            date: new Date(),
            onlyDays: [4, 5]
        };
        this.fecha3 = {
            date: new Date(),
            onlyAllowed: [new Date()]
        };
        this.fecha4 = {
            date: new Date(),
            notAllowed: [new Date()]
        };
        this.fecha5 = {
            date: new Date(),
            min: new Date(2015, 11, 5, 0, 0, 0, 0)
        };
        this.fecha6 = {
            date: new Date(),
            max: new Date(2015, 11, 25, 0, 0, 0, 0)
        };
        this.fecha7 = {
            date: new Date(),
            max: new Date(2015, 11, 25, 0, 0, 0, 0),
            min: new Date(2015, 11, 5, 0, 0, 0, 0)
        };
        this.fecha8 = {
            date: new Date(),
            open: false
        };
        $timeout(function () {
            _this.fecha1.date = new Date(1985, 0, 21, 0, 0, 0, 0);
        }, 2000);
    }
    miAppController.$inject = ["$scope", "$timeout"];
    return miAppController;
})();
angular.module("miApp", ["dcDatePicker"]).controller("testController", miAppController);
