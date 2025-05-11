import * as angular from 'angular';

interface IFileMeta {
  _id:        string;
  fileName:   string;
  adminEmail: string;
}

//the selector: adminsListforEY will become this tag: <admins-listfor-e-y>

let AdminsListForEYComponent  = {
  selector: "adminsListforEY",
  template: /*html*/`
    <div style="height: 100%; overflow-y: auto; border: 2px solid #0DC5FF;">
      <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
        <thead>
          <tr style="border: 1px solid #0DC5FF; background: black; color: #0DC5FF; font-weight: bold;">
            
            <th style="border:1px solid #0DC5FF; width:3%; padding:5px; text-align:center;">
              <!-- you can leave blank or add a header icon -->
            </th> 

            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 25%;">
              Admins
              <button ng-click="$ctrl.refreshTable()" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">refresh</i>
              </button>
              <button ng-click="$ctrl.export()" style="background: none; border: none; cursor: pointer;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">save_alt</i>
              </button>
            </th>            

          </tr>
        </thead>

        <tbody>
         <tr ng-repeat="row in $ctrl.rows track by $index" style="border:1px solid #0DC5FF;">
            <!-- Delete button cell -->
            <td style="border:1px solid #0DC5FF; text-align:center; cursor:pointer;" ng-click="$ctrl.delete(row)">
              <i class="material-icons" style="color:#c00; font-size:18px;">delete</i>
            </td> 

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
      ctrl.rows = [] as Array<{ adminEmail: string }>;

      // Fetch table data
      ctrl.refreshTable = () => {
            $http.get<{email:string,role:string}[]>('http://localhost:3019/users')
            .then(resp => {
                // pull out every adminEmail (skip empty/null)
                ctrl.rows = resp.data
                .filter(u => u.role === 'administrator')
                .map(u => ({ adminEmail: u.email }));

            })
            .catch(err => console.error('Failed to load users:', err));
        };    



       // Export function to download CSV.
       ctrl.export = function() {
            // start with a UTF-8 CSV data URI
            var csvContent = "data:text/csv;charset=utf-8,";

            // Header row
            csvContent += "Admin\n";
            ctrl.rows.forEach(function(row) {
            var admin = row.adminEmail || "";
            // Wrap values in quotes (in case they contain commas)
            csvContent += admin.replace(/"/g,'""') + '"\n';
            });

            //trigger download
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "admins.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };



       
      ctrl.delete = (row: { adminEmail: string }) => {
        $http.delete(
          `http://localhost:3019/users/${encodeURIComponent(row.adminEmail)}`
        )
        .then(() => {
          // after the user is gone, unassign them from any files
          return $http.get<IFileMeta[]>('http://localhost:3019/files');
        })
        .then(resp => {
          const assignments = resp.data
            .filter(f => f.adminEmail === row.adminEmail)
            .map(f => ({ fileId: f._id, adminEmail: "" }));
          if (assignments.length) {
            return $http.post(
              'http://localhost:3019/assign-admin',
              { assignments }
            );
          }
        })
        .then(() => {
          ctrl.refreshTable();
          // tell the EY table it needs to refresh
          $rootScope.$broadcast('admins:changed');
        })
        .catch(err => alert(
          'Delete failed: ' + (err.data?.message || err.statusText)
        ));
      };

      // whenever someone else un-assigns, reload
      $rootScope.$on('admins:changed', () => {
        ctrl.refreshTable();
      });
      
      // load once on init
      ctrl.$onInit = ctrl.refreshTable;

      

   
    }
  ]
};

angular.module('emuwebApp')
  .component(AdminsListForEYComponent .selector, AdminsListForEYComponent );

export default AdminsListForEYComponent ;