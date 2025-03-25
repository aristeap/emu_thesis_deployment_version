import * as angular from 'angular';

angular.module('emuwebApp')
.directive('videoViewer', function() {
  return {
    restrict: 'E',
    scope: {
      base64Video: '<'
    },
    bindToController: true,
    controller: function($scope: angular.IScope) {
      const vm = this;
      vm.videoSrc = '';

      // Watch for changes in base64Video and construct a data URL.
      $scope.$watch(() => vm.base64Video, (newVal) => {
        if (newVal) {
          vm.videoSrc = 'data:video/mp4;base64,' + newVal;
        }
      });
    },
    controllerAs: '$ctrl',
    template: `
      <div style="width:100%; height:100%; overflow:auto;">
        <video controls ng-src="{{ $ctrl.videoSrc }}" style="width:100%; height:100%;">
          Your browser does not support the video tag.
        </video>
      </div>
    `
  };
});
