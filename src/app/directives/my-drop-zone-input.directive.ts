import * as angular from 'angular';

angular.module('emuwebApp')
.directive('myDropZoneInput', function () {
  return {
    template: /*html*/
    // We bind accept="{{acceptFileTypes}}", which now includes “application/json”
    `<input 
        style="display:none;" 
        id="FileDialog" 
        ng-model="files" 
        type="file" 
        multiple 
        accept="{{acceptFileTypes}}" />`,
    restrict: 'E',
    scope: {},
    link: function postLink(scope, element) {
      // Allow dropping/selection of: WAV, PDF, JPEG, MP4, AND JSON 
      scope.acceptFileTypes = 
        'audio/wav, audio/x-wav, audio/wave, audio/x-pn-wav, ' +
        'application/pdf, image/jpeg, video/mp4, application/json';

      // Whenever the hidden <input> changes (i.e. user clicked and browsed), send files to parent
       scope.handleFilesonChange = function (evt) {
        // event.target.files is a FileList (or undefined)
        var loadedFiles = evt.target.files;
        if (loadedFiles && loadedFiles.length) {
          // call up into the <my-drop-zone> scope
          scope.$parent.loadFiles(loadedFiles);
        }
      };

      // element.bind('change', function () {
      //   scope.handleFilesonChange();
      // });

      element.bind('change', function (event) {
        scope.handleFilesonChange(event);
      });
      // When someone programmatically “clicks” the drop-zone, we forward the click to <input>
      element.bind('click', function () {
        // Because our <input> has id="FileDialog", we find it and click it:
        var fileInput = document.getElementById('FileDialog');
        if (fileInput) {
          fileInput.click();
        }
      });
    }
  };
});
