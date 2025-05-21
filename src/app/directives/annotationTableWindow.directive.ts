import * as angular from 'angular';

angular.module('emuwebApp')
.directive('floatingAnnotationWindow', ['$timeout', 'AuthService', function($timeout, AuthService) {
  return {
    restrict: 'E',
    scope: {
      annotations: '=',
      highlight: '&',
      deleteAnn: '&', 
      export: '&'
    },
    template: `
      <div class="floating-annotation-container" style="position: absolute; bottom: 20px; right: 20px; width: 300px; height: 200px; background: #fff; border: 2px solid #0DC5FF; z-index: 9999; padding: 10px;">
        <div class="floating-header" style="display: flex; gap: 10px; align-items: center; color: #0DC5FF; margin-bottom: 10px; cursor: move;">
          <h3 style="margin: 0;">Annotation Window</h3>
          <button ng-click="export()" style="background: none; border: none; cursor: pointer;">
            <i class="material-icons" style="font-size: 20px;">save_alt</i>
          </button>
        </div>

        <div>
          <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
            <thead>  
              <tr style="border: 1px solid #0DC5FF;">
                <th style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold; background: black;">Word Item</th>
                <th style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold; background: black;">PoS</th>
                <th style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold; background: black;">NeR</th>
                <th style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold; background: black;">SA</th>
                <th style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold; background: black;">other comments</th>
              </tr>
            </thead> 
            <tbody> 
              <tr style="border: 1px solid #0DC5FF;" ng-repeat="ann in annotations track by $index">
                <td style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold;">{{ ann.word }}
                  <button ng-click="highlight({ word: ann.word, pdfId: ann.pdfId })" style="background: none; border: none; cursor: pointer;">
                    <i class="material-icons" style="font-size: 15px; vertical-align: middle;">search</i>
                  </button>

                  <!-- Delete (trash) icon -->
                  <button ng-click="deleteAnn({ ann: ann })" ng-show="canDelete" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                    <i class="material-icons" style="font-size: 15px; vertical-align: middle;">delete</i>
                  </button>               
                </td>
                <td style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold;">{{ ann.pos }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold;">{{ ann.ner }}</td>  
                <td style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold;">{{ ann.sa }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 15px; color: #0DC5FF; font-weight: bold;">{{ ann.comment }}</td>
              </tr>
            </tbody>  
          </table>
        </div>      
      </div>
    `,
    link: function(scope, element) {
      $timeout(function() {
        const container = element.find('.floating-annotation-container');
        

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

        // Access the global jQuery from the CDN
        const wnd = window as any;
        const $g = wnd.jQuery; // global jQuery from the CDN

        // console.log('Global jQuery version:', $g.fn.jquery);
        // console.log('Global jQuery UI version:', $g.ui?.version);

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
