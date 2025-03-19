// linguistic.service.ts
import * as angular from 'angular';

angular.module('emuwebApp')
.service('LinguisticService', function() {
  // Store the mode as a property
  this.mode = null;
});
