import * as angular from 'angular';

angular.module('emuwebApp')
.service('ImageStateService', function() {
  // console.log("From inside the image-state.service.ts!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  this.imageScale = 1.0;

  this.zoomIn = function() {
    this.imageScale += 0.2;
    if (this.imageScale > 4) {
      this.imageScale = 4;
    }
  };

  this.zoomOut = function() {
    this.imageScale -= 0.2;
    if (this.imageScale < 0.2) {
      this.imageScale = 0.2;
    }
  };
});
