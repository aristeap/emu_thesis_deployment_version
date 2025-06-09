//This is the annotation table for the image's annotations
import * as angular from 'angular';

angular.module('emuwebApp')
.directive('floatingImageAnnotationWindow', ['$timeout', 'AuthService', function($timeout, AuthService) {
  return {
    restrict: 'E',
    scope: {
      annotations: '=',    // Shared annotations array from your ImageController
      highlight: '&',      // Callback to highlight a specific annotation
      deleteAnn: '&',      // Callback to delete an annotation
      export: '&',          // Callback to export annotations (if needed)
      saveCrop: '&'        // Callback to save the cropped image for one annotation  (if i dont add these nothing will happen if i click at an icon eg!Even if everything else is set up correctly)

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
                  <button ng-click="deleteAnn({ annotation: ann })" ng-show="canDelete" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                    <i class="material-icons" style="font-size: 15px;">delete</i>
                  </button>
                  <!--the saveCrop says that whatever i pass on to the save-crop on the <floating-image...> on emu-webapp.compoennt.ts, will happen when we click -->
                  <button ng-click="saveCrop({ annotation: ann })" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                    <i class="material-icons" style="font-size: 15px;">save</i>
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

				// const u = AuthService.getUser();
        // const canDelete = !!u && !(u.role==='simple');

        scope.$watch(
          // watch the file origin (and user if you like)
          () => AuthService.getFileOrigin(),
          (origin: string|null) => {
            const u = AuthService.getUser();

            //simple users can only delete an annotation, from the table, when their file is drag-n-droped (they cant make changes to the database files)
            const canDeleteOnDrag = !!u && u.role==='simple' && origin==='drag-n-droped';
            //admins and researchers can delete always
            const deletePrivilege = !!u && (u.role==='administrator' || u.role==='researcher');

            scope.canDelete = canDeleteOnDrag || deletePrivilege ;

            console.log(
              'canDeleteOnDrag: ',				canDeleteOnDrag,
              'deletePrivilege: ',				deletePrivilege,
              'canDelete: ',              scope.canDelete
            
            );
				  } 
				);
	

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
