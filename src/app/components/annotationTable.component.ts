import * as angular from 'angular';

let AnnotationTableComponent = {
    selector: "annotationTable",
    template: /*html*/`
     <div>
        <table style="border: 2px solid #0DC5FF; border-collapse: collapse; width: 100%; background: #fff;">
            <thead>
            <tr style="border: 1px solid #0DC5FF;">
                <th style="border: 1px solid #0DC5FF; padding: 5px; color: #0DC5FF; font-weight: bold; background: black; width: 50%;">Annotation</th>
                <th style="border: 1px solid #0DC5FF; padding: 5px; color: #0DC5FF; font-weight: bold; background: black; width: 20%;">Type</th>
                <th style="border: 1px solid #0DC5FF; padding: 5px; color: #0DC5FF; font-weight: bold; background: black; width: 10%;">Begin Time</th>
                <th style="border: 1px solid #0DC5FF; padding: 5px; color: #0DC5FF; font-weight: bold; background: black; width: 10%;">End Time</th>
                <th style="border: 1px solid #0DC5FF; padding: 5px; color: #0DC5FF; font-weight: bold; background: black; width: 10%;">Duration</th>
            </tr>
            </thead>
            <tbody>
            <tr ng-repeat="row in $ctrl.rows track by $index" style="border: 1px solid #0DC5FF;">
                <td style="border: 1px solid #0DC5FF; padding: 5px; width: 50%;">{{ row.annotation }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 5px; width: 20%;">{{ row.type }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">{{ row.beginTime | number:2 }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">{{ row.endTime | number:2 }}</td>
                <td style="border: 1px solid #0DC5FF; padding: 5px; width: 10%;">{{ row.duration | number:2 }}</td>
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
        
        // Optionally, listen for changes (if your app broadcasts an 'annotationChanged' event)
        $scope.$on('annotationChanged', function() {
          updateRows();
        });
      }
    ]
  };
  
  angular.module('emuwebApp')
    .component(AnnotationTableComponent.selector, AnnotationTableComponent);
  export default AnnotationTableComponent;