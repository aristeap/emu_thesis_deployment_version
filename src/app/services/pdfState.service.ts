import * as angular from 'angular';
 
angular.module('emuwebApp')
.service('PdfStateService', function() {
  this.pdfData = null;
  this.currentPage = 1;
  this.totalPages = 1;

  // Start at scale=1.0 (100%)
  this.pdfScale = 1.0;

  // Page nav
  this.nextPage = function() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  };
  this.prevPage = function() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  };

  // Zoom
  this.zoomIn = function() {
    // pick a step size you like
    this.pdfScale += 0.2;
    if (this.pdfScale > 4) {
      this.pdfScale = 4; // clamp max
    }
  };
  this.zoomOut = function() {
    this.pdfScale -= 0.2;
    if (this.pdfScale < 0.2) {
      this.pdfScale = 0.2; // clamp min
    }
  };
});
