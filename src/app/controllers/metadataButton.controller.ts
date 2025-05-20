import * as angular from 'angular';

angular.module('emuwebApp')
  .controller('metaCtrl', ['$scope', 'ViewStateService', function ($scope, ViewStateService) {
    //console.log("ViewStateService----------------------------------->", ViewStateService);

    // Placeholder models for form fields
    $scope.filename = '';
    $scope.title = '';
    $scope.description = '';

    // Focus handler
    $scope.cursorInTextField = function () {
      //console.log('Focus event triggered');
      if (ViewStateService.setEditing && ViewStateService.setcursorInTextField) {
        ViewStateService.setEditing(true);
        ViewStateService.setcursorInTextField(true);
      } else {
        console.log('ViewStateService methods are not defined');
      }
    };

    // Blur handler
    $scope.cursorOutOfTextField = function () {
      //console.log('Blur event triggered');
      if (ViewStateService.setEditing && ViewStateService.setcursorInTextField) {
        ViewStateService.setEditing(false);
        ViewStateService.setcursorInTextField(false);
      } else {
        console.log('ViewStateService methods are not defined');
      }
    };

    // Cancel button handler
    $scope.cancel = function () {
      //console.log('Cancel button clicked');
      // Add any cleanup or modal close logic if needed
    };
  }]);