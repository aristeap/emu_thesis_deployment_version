import * as angular from 'angular';

angular.module('emuwebApp')
    .controller('formCtrl', ['$scope', 'ViewStateService', 
        function ($scope, ViewStateService) {
            //console.log("ViewStateService----------------------------------->", ViewStateService);
         
            // ng-focus handler: enable editing state
            $scope.cursorInTextField = function () {
                ViewStateService.setEditing(true);
                ViewStateService.setcursorInTextField(true);
            };

            // ng-blur handler: disable editing state
            $scope.cursorOutOfTextField = function () {
                ViewStateService.setEditing(false);
                ViewStateService.setcursorInTextField(false);
            };

        }

        
    ]);
