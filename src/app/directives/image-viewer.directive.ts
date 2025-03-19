import * as angular from 'angular';

angular.module('emuwebApp')
.directive('imageViewer', function() {
  return {
    restrict: 'E',
    scope: {
      base64Img: '<',
      zoomScale: '<'  // Pass the zoom scale as a binding
    },
    bindToController: true,
    controller: function($scope: angular.IScope) {
      const vm = this;
      // We'll store the natural dimensions and computed display dimensions here:
      vm.naturalWidth = 0;
      vm.naturalHeight = 0;
      vm.displayWidth = 0;
      vm.displayHeight = 0;

      // Called when the image is loaded.
      vm.onImageLoad = function(event: Event) {
        const target = event.target as HTMLImageElement;
        vm.naturalWidth = target.naturalWidth;
        vm.naturalHeight = target.naturalHeight;
        vm.updateDimensions();
        // If needed, force a digest cycle:
        if (!$scope.$$phase) $scope.$apply();
      };

      // Update display dimensions based on the current zoomScale.
      vm.updateDimensions = function() {
        // If zoomScale is not provided, default to 1.0
        const scale = vm.zoomScale || 1.0;
        vm.displayWidth = vm.naturalWidth * scale;
        vm.displayHeight = vm.naturalHeight * scale;
      };

      // Watch for changes in zoomScale so we update the dimensions.
      $scope.$watch(() => vm.zoomScale, function(newVal, oldVal) {
        if (newVal !== oldVal) {
          vm.updateDimensions();
        }
      });
    },
    controllerAs: '$ctrl',
    template: `
      <div style="width:100%; height:100%; overflow:auto;">
        <img ng-src="{{ $ctrl.base64Img }}"
             alt="Image Viewer"
             ng-style="{'width': $ctrl.displayWidth + 'px', 'height': $ctrl.displayHeight + 'px'}"
             ng-load="$ctrl.onImageLoad($event)" />
      </div>
    `
  };
});
