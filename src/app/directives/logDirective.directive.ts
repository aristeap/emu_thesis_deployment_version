import * as angular from 'angular';

angular.module('emuwebApp').directive('logElement', function() {
    return {
      restrict: 'A', // Use as an attribute
      link: function(scope, element, attrs) {
        // Log the value provided in the attribute and the element reference.
        console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<logElement directive:", attrs.logElement, element);
      }
    };
  });
  