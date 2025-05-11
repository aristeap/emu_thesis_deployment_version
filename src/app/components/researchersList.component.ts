import * as angular from 'angular';

interface IResearcher {
  email: string;
}

let ResearchersListForAdminComponent = {
  selector: "reseaListforAdmin",
  template: /* html */ `
    <div style="height: 100%; overflow-y: auto; border: 2px solid #0DC5FF; background: #303030;">
      <table style="width: 100%; border: 2px solid #0DC5FF; border-collapse: collapse; background: #fff; color: #000;">
        <thead>
          <tr style="background: black; color: #0DC5FF; font-weight: bold; border: 1px solid #0DC5FF;">
            <th style="border: 1px solid #0DC5FF; width: 3%; text-align: center;">-</th>
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 25%;">
              Researchers
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
          <tr ng-repeat="row in $ctrl.rows track by $index" style="border: 1px solid #0DC5FF; background: #fff; color: #000;">
            <td style="border: 1px solid #0DC5FF; text-align: center; cursor: pointer; background: #fff; color: #000;" ng-click="$ctrl.delete(row)">
              <i class="material-icons" style="color: #c00;">delete</i>
            </td>
            <td style="border: 1px solid #0DC5FF; padding: 5px; background: #fff; color: #000;">{{row.email}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  controller: [
    '$http','$rootScope',
    function($http: angular.IHttpService, $rootScope: angular.IRootScopeService) {
      const ctrl = this as any;
      ctrl.rows = [] as IResearcher[];

      // Fetch list of researchers
      ctrl.refreshTable = () => {
        $http.get<{email: string, role: string}[]>('http://localhost:3019/users')
          .then(resp => {
            ctrl.rows = resp.data
              .filter(user => user.role === 'researcher')
              .map(user => ({ email: user.email }));
          })
          .catch(err => console.error('Failed to load researchers:', err));
      };

      // Export as CSV
      ctrl.export = () => {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Researcher\n';
        ctrl.rows.forEach(r => {
          csvContent += '"' + r.email.replace(/"/g, '""') + '"\n';
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'researchers.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Delete researcher
     ctrl.delete = (row) => {
        $http
          .delete(`http://localhost:3019/users/${encodeURIComponent(row.email)}`)
          // once the user is gone, unassign them from any files that still mention them
          .then(() => $http.get('http://localhost:3019/files'))
          .then(resp => {
            // build one bulk‐unassign payload
            const assignments = resp.data
              .filter(f => f.researcherEmails?.includes(row.email))
              .map(f => ({ fileId: f._id, researcherEmail: '' }));
            if (assignments.length) {
              return $http.post('/assign-researchers', { assignments });
            }
          })
          .then(() => {
            // 1) refresh the left list
            ctrl.refreshTable();
            // 2) let the right table know it needs to reload
            $rootScope.$broadcast('researchers:changed');
          })
          .catch(err => alert('Delete failed: ' + (err.data?.message || err.statusText)));
      };


      // Initialize
      ctrl.$onInit = ctrl.refreshTable;
    }
  ]
};

angular.module('emuwebApp')
  .component(ResearchersListForAdminComponent.selector, ResearchersListForAdminComponent);

export default ResearchersListForAdminComponent;
