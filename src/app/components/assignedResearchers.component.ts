import * as angular from 'angular';
import { AuthService, IUser } from '../services/auth.service';

interface IFileMeta {
  _id:              string;
  fileName:         string;
  adminEmail:       string;
  researcherEmails: string[];
}

let AssignedResearchersComponent = {
  selector: "assignedResearchers",
  template: /* html */ `
    <div style="height:100%; overflow-y:auto; border:2px solid #0DC5FF; background:#303030;">
      <table style="width:100%; border:2px solid #0DC5FF; border-collapse:collapse; background:#fff; color:#000;">
        <thead>
          <tr style="background:black; color:#0DC5FF; font-weight:bold; border:1px solid #0DC5FF;">
            <th style="border:1px solid #0DC5FF; width:3%; text-align:center;">-</th>
            <th style="border:1px solid #0DC5FF; padding:5px; width:30%;">
              My Files
              <button ng-click="$ctrl.refreshTable()" style="background:none; border:none; cursor:pointer; margin-left:5px;">
                <i class="material-icons" style="font-size:15px; color:#0DC5FF;">refresh</i>
              </button>
              <button ng-click="$ctrl.export()" style="background:none; border:none; cursor:pointer;">
                <i class="material-icons" style="font-size:15px; color:#0DC5FF;">save_alt</i>
              </button>
            </th>
            <th style="border:1px solid #0DC5FF; padding:5px;">Assigned Researchers</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="row in $ctrl.rows track by $index" style="border:1px solid #0DC5FF; background:#fff; color:#000;">
            <td style="border:1px solid #0DC5FF; text-align:center; cursor:pointer; background:#fff; color:#000;" ng-click="$ctrl.clearResearchers(row)">
              <i class="material-icons" style="color:#c00;">delete</i>
            </td>
            <td style="border:1px solid #0DC5FF; padding:5px; background:#fff; color:#000;">{{ row.fileName }}</td>
            <td style="border:1px solid #0DC5FF; padding:5px; background:#fff; color:#000;">
              {{ row.researcherEmails.length ? row.researcherEmails.join(', ') : '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  controller: [
    '$http', 'AuthService','$scope',
    function(this: any, $http: angular.IHttpService, AuthService: AuthService, $scope: angular.IScope) {
      const ctrl = this as any;
      const me: IUser = AuthService.getUser()!;
      const myEmail = me.email;

      ctrl.rows = [] as IFileMeta[];

      ctrl.refreshTable = () => {
        console.log("inside assignedReas refreshTable");
        $http.get<IFileMeta[]>('http://localhost:3019/files')
          .then(resp => {
            console.log("isnide the then ");
            ctrl.rows = resp.data
              .filter(f => f.adminEmail === myEmail)
              .map(f => ({
                _id: f._id,
                fileName: f.fileName,
                researcherEmails: f.researcherEmails || []
              }));
          })
          .catch(err => console.error('Failed to load files', err));
      };

      // listen for our custom event and reload
      $scope.$on('researchers:changed', () => {
        console.log("inside the scope on researchers:changed");
        ctrl.refreshTable();
      });

       ctrl.export = function() {
          // start with a UTF-8 CSV data URI
          var csvContent = "data:text/csv;charset=utf-8,";

          // Header row
          csvContent += "Database File,Researcher\n";
          ctrl.rows.forEach(function(row) {
            var file = row.fileName || "";
            const researcherList = (row.researcherEmails || []).join("; ");
            // Wrap values in quotes (in case they contain commas)
            const safeFile = file.replace(/"/g, '""');
            const safeResearchers = researcherList.replace(/"/g, '""');
            csvContent += `"${safeFile}","${safeResearchers}"\n`;          
          });

          //trigger download
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "assigned_researchers.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

      // clear all researchers for a file
      ctrl.clearResearchers = (row: IFileMeta) => {
        const payload = { 
          assignments: [ 
            { fileId: row._id, researcherEmails: [] } 
          ] 
        };
        $http.post('http://localhost:3019/assign-researchers', payload)
          .then(() => ctrl.refreshTable())
          .catch(err => alert('Could not clear researchers: ' + (err.data?.message || err.statusText)));
      };

      ctrl.$onInit = ctrl.refreshTable;
    }
  ]
};

angular.module('emuwebApp')
  .component(AssignedResearchersComponent.selector, AssignedResearchersComponent);

export default AssignedResearchersComponent;
