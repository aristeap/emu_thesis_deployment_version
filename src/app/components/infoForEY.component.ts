import * as angular from 'angular';

interface IFileMeta {
  _id:        string;
  fileName:   string;
  adminEmail: string;
}

//How does the selector and the kebab-case works?
//Angular will place a '-' before every upercase letter
//So the selector: infoforEY will become this tag: <infofor-e-y>

let InfoForEYComponent = {
  selector: "infoforEY",
  template: /*html*/`
    <div style="height: 100%; overflow-y: auto; border: 2px solid #0DC5FF;">
      <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
        <thead>
          <tr style="border: 1px solid #0DC5FF; background: black; color: #0DC5FF; font-weight: bold;">
            
            <th style="border:1px solid #0DC5FF; width:3%; padding:5px; text-align:center;">
              <!-- you can leave blank or add a header icon -->
            </th>            
            
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 25%;">
              Database File
              <button ng-click="$ctrl.refreshTable()" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">refresh</i>
              </button>
              <button ng-click="$ctrl.export()" style="background: none; border: none; cursor: pointer;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">save_alt</i>
              </button>
            </th>
            
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 20%;">Assigned Admin</th>
            
          </tr>
        </thead>
        <tbody>
         <tr ng-repeat="row in $ctrl.rows track by $index" style="border:1px solid #0DC5FF;">
            <!-- Delete button cell -->
            <td style="border:1px solid #0DC5FF; text-align:center; cursor:pointer;" ng-click="$ctrl.delete(row)">
              <i class="material-icons" style="color:#c00; font-size:18px;">delete</i>
            </td>            
            <td style="border:1px solid #0DC5FF; padding:5px;">{{row.fileName}}</td>
            <td style="border:1px solid #0DC5FF; padding:5px;">{{row.adminEmail || '-'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  controller: [
    '$http','$rootScope',
    function($http: angular.IHttpService, $rootScope: angular.IRootScopeService) {
   
      const ctrl = this as any;
      ctrl.rows = [] as IFileMeta[];

      // Fetch table data
      ctrl.refreshTable = () => {
          $http.get<IFileMeta[]>('http://localhost:3019/files')
            .then(r => ctrl.rows = r.data)
            .catch(e => console.error('Failed to load files', e));
        };

       // Export function to download CSV.
       ctrl.export = function() {
          // start with a UTF-8 CSV data URI
          var csvContent = "data:text/csv;charset=utf-8,";

          // Header row
          csvContent += "Database File,Admin\n";
          ctrl.rows.forEach(function(row) {
            var file = row.fileName || "";
            var admin = row.adminEmail || "";
            // Wrap values in quotes (in case they contain commas)
            csvContent += '"' + file.replace(/"/g,'""') + '","' + admin.replace(/"/g,'""') + '"\n';
          });

          //trigger download
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "database_files.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        // 2) “delete” here really means “un-assign admin”
         // this now un-assigns the admin _and_ broadcasts
        ctrl.delete = (row: IFileMeta) => {
          const payload = {
            assignments: [
              { fileId: row._id, adminEmail: "" }
            ]
          };
          $http.post('http://localhost:3019/assign-admin', payload)
            .then(() => {
              ctrl.refreshTable();
              // let the other component know it needs to reload too
              $rootScope.$broadcast('admins:changed');
            })
            .catch(err => alert(
              'Could not unassign admin: ' +
              (err.data?.message || err.statusText)
            ));
        };



      // load once on init
      ctrl.$onInit = ctrl.refreshTable;

      

   
    }
  ]
};

angular.module('emuwebApp')
  .component(InfoForEYComponent.selector, InfoForEYComponent);

export default InfoForEYComponent;