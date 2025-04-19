import * as angular from 'angular';

let AnnotationTableComponent = {
  selector: "annotationTable",
  template: /*html*/`
    <div style="height: 250px; overflow-y: auto; border: 2px solid #0DC5FF;">
      <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
        <thead>
          <tr style="border: 1px solid #0DC5FF; background: black; color: #0DC5FF; font-weight: bold;">
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 50%;">
              Annotation
              <button ng-click="$ctrl.refreshTable()" style="background: none; border: none; cursor: pointer; margin-left: 5px;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">refresh</i>
              </button>
              <button ng-click="$ctrl.export()" style="background: none; border: none; cursor: pointer;">
                <i class="material-icons" style="font-size: 15px; color: #0DC5FF;">save_alt</i>
              </button>
            </th>
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 20%;">Type</th>
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">Begin Time</th>
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">End Time</th>
            <th style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="row in $ctrl.rows track by $index" style="border: 1px solid #0DC5FF;">
            <td style="border: 1px solid #0DC5FF; padding: 5px;">{{ row.annotation }}</td>
            <td style="border: 1px solid #0DC5FF; padding: 5px;">{{ row.type }}</td>
            <td style="border: 1px solid #0DC5FF; padding: 5px;">{{ row.beginTime | number:2 }}</td>
            <td style="border: 1px solid #0DC5FF; padding: 5px;">{{ row.endTime | number:2 }}</td>
            <td style="border: 1px solid #0DC5FF; padding: 5px;">{{ row.duration | number:2 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  controller: [
    'DataService', 'SoundHandlerService', '$scope',
    function(DataService, SoundHandlerService, $scope) {
      var vm = this;
      vm.rows = [];
      
      // expose a refreshTable() for your button
      vm.refreshTable = () => {
        updateRows();
      };


      function updateRows() {
        vm.rows = [];
        // Get levels from the DataService (assumes DataService.data.levels exists)
        var levels = DataService.getData().levels;
        if (!levels) return;
        // Determine the sample rate (defaulting to 44100 if unavailable)
        var sampleRate = (SoundHandlerService.audioBuffer && SoundHandlerService.audioBuffer.sampleRate) || 44100;
        
        // Loop over each level and each item (annotation)
        levels.forEach(function(level) {
          // Determine the type: prefer level.role if defined, otherwise level.type.
          var type = level.role ? level.role : level.type;
          level.items.forEach(function(item) {
            // Assume the primary annotation is in the first label.
            var annotation = (item.labels && item.labels[0] && item.labels[0].value) || "";
            var beginTime = 0, endTime = 0, duration = 0;
            if (level.type === 'SEGMENT') {
              beginTime = item.sampleStart / sampleRate;
              endTime = (item.sampleStart + item.sampleDur) / sampleRate;
              duration = item.sampleDur / sampleRate;
            } else if (level.type === 'EVENT') {
              // For an event, we have a sample point.
              beginTime = item.samplePoint / sampleRate;
              endTime = beginTime;
              duration = 0;
            }
            vm.rows.push({
              annotation: annotation,
              type: type,
              beginTime: beginTime,
              endTime: endTime,
              duration: duration
            });
          });
        });
      }
      
      // Initial population of rows
      updateRows();
      
      // Listen for changes (if your app broadcasts an 'annotationChanged' event)
      $scope.$on('annotationChanged', function() {
        updateRows();
      });
      
      // Export function to download CSV.
      vm.export = function() {
        var csvContent = "data:text/csv;charset=utf-8,";
        // Header row
        csvContent += "Annotation,Type,Begin Time,End Time,Duration\n";
        vm.rows.forEach(function(row) {
          // Wrap values in quotes (in case they contain commas)
          csvContent += '"' + row.annotation + '","' + row.type + '","' + row.beginTime + '","' + row.endTime + '","' + row.duration + '"\n';
        });
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "annotations.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }
  ]
};

angular.module('emuwebApp')
  .component(AnnotationTableComponent.selector, AnnotationTableComponent);

export default AnnotationTableComponent;