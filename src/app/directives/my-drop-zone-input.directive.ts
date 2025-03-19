import * as angular from 'angular';

angular.module('emuwebApp')
	.directive('myDropZoneInput', function () {
		return {
			template: /*html*/
			`<input style="display:none;" id="FileDialog" ng-model="files" type="file" multiple accept="{{acceptWav}}" />`,
			restrict: 'E',
			scope: {},
			link: function postLink(scope, element) {
				scope.acceptWav = 'audio/wav, audio/x-wav, audio/wave, audio/x-pn-wav, application/pdf, image/jpeg';
				scope.acceptFile = scope.acceptWav;

				scope.handleFilesonChange = function () {
					var loadedFiles = element[0].firstChild.files;
					scope.$parent.loadFiles(loadedFiles);
				};

				element.bind('change', function (event) {
					scope.handleFilesonChange(event);
				});

				element.bind('click', function () {
					var elem = angular.element('input');
					if (elem[1] !== undefined) {
						elem[1].click();
					}
				});

			}
		};
	});
