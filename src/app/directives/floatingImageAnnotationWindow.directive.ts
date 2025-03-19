import * as angular from 'angular';

angular.module('emuwebApp')
.directive('floatingImageAnnotationWindow', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    scope: {
      annotations: '=',    // Shared annotations array from your ImageController
      highlight: '&',      // Callback to highlight a specific annotation
      deleteAnn: '&',      // Callback to delete an annotation
      export: '&'          // Callback to export annotations (if needed)
    },
    template: `
      <div class="floating-annotation-container" 
           style="position: absolute; bottom: 20px; right: 20px; width: 400px; height: 220px; background: #fff; border: 2px solid #0DC5FF; z-index: 9999; padding: 10px;">
        <div class="floating-header" 
             style="display: flex; gap: 10px; align-items: center; color: #0DC5FF; margin-bottom: 10px; cursor: move;">
          <h3 style="margin: 0;">Image Annotations</h3>
          <button ng-click="export()" 
                  style="background: none; border: none; cursor: pointer;">
            <i class="material-icons" style="font-size: 20px;">save_alt</i>
          </button>
        </div>
        <div>
          <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
            <thead>
              <tr style="border: 1px solid #0DC5FF;">
                <th style="border: 1px solid #0DC5FF; padding: 10px; color: #0DC5FF; font-weight: bold; background: black;">Bounding Box</th>
                <th style="border: 1px solid #0DC5FF; padding: 10px; color: #0DC5FF; font-weight: bold; background: black;">EngAlpha</th>
                <th style="border: 1px solid #0DC5FF; padding: 10px; color: #0DC5FF; font-weight: bold; background: black;">MoSymbol</th>
                <th style="border: 1px solid #0DC5FF; padding: 10px; color: #0DC5FF; font-weight: bold; background: black;">MoPhrase</th>
                <th style="border: 1px solid #0DC5FF; padding: 10px; color: #0DC5FF; font-weight: bold; background: black;">Other Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr ng-repeat="ann in annotations track by $index" style="border: 1px solid #0DC5FF;">
                <td style="border: 1px solid #0DC5FF; padding: 10px;">
                  {{ ann.pdfId === null ? ann.word : (ann.bbox.left + ',' + ann.bbox.top + ' – ' + ann.bbox.width + '×' + ann.bbox.height) }}
                  <button ng-click="highlight({ annotation: ann })" style="background: none; border: none; cursor: pointer;">
                    <i class="material-icons" style="font-size: 15px;">search</i>
                  </button>
                  <button ng-click="deleteAnn({ annotation: ann })" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                    <i class="material-icons" style="font-size: 15px;">delete</i>
                  </button>
                </td>
                <td style="border: 1px solid #0DC5FF; padding: 10px;">{{ ann.engAlpha || '' }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 10px;">{{ ann.moSymbol || '' }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 10px;">{{ ann.moPhrase || '' }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 10px;">{{ ann.comment || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
    link: function(scope, element) {
      $timeout(function() {
        const container = element.find('.floating-annotation-container');
        // If jQuery UI is available, make the window draggable and resizable:
        const wnd = window as any;
        const $g = wnd.jQuery;
        if ($g && $g.fn.draggable && $g.fn.resizable) {
          container.draggable({
            handle: '.floating-header',
            scroll: false
          });
          container.resizable({
            minWidth: 200,
            minHeight: 100
          });
        } else {
          console.log("jQuery UI functions not available on the global jQuery");
        }
      }, 500);
    }
  };
}]);
