import * as angular from 'angular';

angular.module('emuwebApp')
	.directive('myDropZone', ['$animate', '$compile', 'DragnDropService', 'BrowserDetectorService', 'AppStateService', 'ModalService',
		function ($animate, $compile, DragnDropService, BrowserDetectorService, AppStateService, ModalService) {
		return {
			template: /*html*/`
			<div id="dropzone" class="emuwebapp-dropzone" ng-class="dropClass">
				<span><br />{{dropText}}</span>
				<my-drop-zone-input></my-drop-zone-input>
		  	</div>`,
			restrict: 'E',
			replace: true,
			scope: {},
			link: function postLink(scope, element) {
				/* --------- Messages -------- */
				scope.dropTextDefault = 'Drop your files here (.wav/pdf/jpeg/video-format) or click here to do the same with a file dialog';
				scope.dropTextErrorFileType = 'Error: Could not parse file. The following file types are supported: ..wav/pdf/jpeg/video-format';
				scope.dropTextErrorAPI = 'Sorry ! The File APIs are not supported in your browser.';
				scope.dropAllowed = 'Drop file(s) to start loading !';
				scope.dropParsingWAV = '.WAV loading...';
				scope.dropFirefoxWarning = 'Sorry ! Firefox does not support dropping folders ! please drop single or multiple files !';

				scope.dropText = scope.dropTextDefault;
				scope.dropClass = '';
				scope.dropClassDefault = '';
				scope.dropClassOver = 'over';
				scope.dropClassError = 'error';
				scope.count = 0;
				scope.handles = [];
				scope.bundles = [];
				scope.bundleNames = [];

				scope.updateQueueLength = function (quantity) {
					// console.log("my-drop-zone.directive.ts->scope.updateQueueLength");
					scope.count += quantity;
				};

				scope.enqueueFileAddition = function (file) {
					// console.log("my-drop-zone.directive.ts->scope.enqueueFileAddition");
					var identifier = file.name.substring(file.name.lastIndexOf('_') + 1, file.name.lastIndexOf('.')).toUpperCase();
					var extension = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase();
					var bundle = file.name.substr(0, file.name.lastIndexOf('.'));
					
					var j = scope.bundleNames.indexOf(bundle);
					if (j === -1) {
					  scope.bundleNames.push(bundle);
					  j = scope.bundleNames.indexOf(bundle);
					  scope.bundles[j] = [];
					  scope.bundles[j][0] = bundle;
					}
					
					if (['WAV', 'PDF', 'JPEG', 'JPG', 'MP4'].indexOf(extension) !== -1) {
					  // Store the file along with its extension for later handling
					  scope.bundles[j][1] = { file: file, extension: extension };
					  scope.handles.push(file);
					  scope.dropClass = scope.dropClassDefault;
					  // Use a specific message for WAV; for non-audio files, a generic one.
					  if (extension === 'WAV') {
						scope.dropText = scope.dropParsingWAV;
					  } else {
						scope.dropText = 'Processing non-audio file...';
					  }
					}
					else {
					  if (BrowserDetectorService.isBrowser.Firefox()) {
						if (file.size === 0) {
						  scope.dropClass = scope.dropClassError;
						  scope.dropText = scope.dropFirefoxWarning;
						}
						else {
						  scope.dropClass = scope.dropClassError;
						  scope.dropText = scope.dropTextErrorFileType;
						}
					  }
					  else {
						scope.dropClass = scope.dropClassError;
						scope.dropText = scope.dropTextErrorFileType;
					  }
					  scope.handles = [];
					  scope.bundles = [];
					  scope.bundleNames = [];
					  scope.count = 0;
					}
					if (!BrowserDetectorService.isBrowser.Firefox() && !BrowserDetectorService.isBrowser.Safari()) {
					  scope.$digest();
					}
					if (scope.bundles[j] !== undefined) {
					  scope.startRendering();
					}
				};
				  

				scope.startRendering = function () {
				 	// console.log("my-drop-zone.directive.ts->scope.startRendering");
					// If all the files we expect have shown up, then flush the queue.
					if (scope.count === scope.handles.length) {
						// console.log("scope.bundles: ",scope.bundles);
						if (DragnDropService.setData(scope.bundles) === false) {
							ModalService.open('views/error.html', 'Sorry you dropped too many bundles (' + scope.handles.length + '). The maximum currently allowed is: ' + DragnDropService.maxDroppedBundles).then(() => {
								AppStateService.resetToInitState();
							});
						}
						scope.handles = [];
						scope.bundles = [];
						scope.bundleNames = [];
						scope.count = 0;
						scope.dropText = scope.dropTextDefault;
						scope.dropClass = scope.dropClassDefault;
					}
				};

				scope.loadFiles = function (files) {
					// console.log("my-drop-zone.directive.ts->scope.loadFiles");
					scope.updateQueueLength(files.length);
					for (var i = 0; i < files.length; i++) {
						var file = files[i];
						if (file.name === '.DS_Store') {
							scope.updateQueueLength(-1);
						}
						else {
							var entry, reader;

							if (file.isFile || file.isDirectory) {
								entry = file;
							}
							else if (file.getAsEntry) {
								entry = file.getAsEntry();
							}
							else if (file.webkitGetAsEntry) {
								entry = file.webkitGetAsEntry();
							}
							else if (typeof file.getAsFile === 'function') {
								scope.enqueueFileAddition(file.getAsFile());
								continue;
							}
							else if (File && file instanceof File) {
								scope.enqueueFileAddition(file);
								continue;
							}
							else {
								scope.updateQueueLength(-1);
								continue;
							}

							if (!entry) {
                                scope.updateQueueLength(-1);
							}
							else if (entry.isFile) {
								entry.file(function (file) {
									scope.enqueueFileAddition(file);
								}, function (err) {
									console.warn(err);
								});
							}
							else if (entry.isDirectory) {
								reader = entry.createReader();
								reader.readEntries(function (entries) {
									scope.loadFiles(entries);
									scope.updateQueueLength(-1);
								}, function (err) {
									console.warn(err);
								});
							}
						}
					}
				};

				scope.dropFiles = function (evt) {
					// console.log("my-drop-zone.directive.ts->scope.dropFiles");
					evt.stopPropagation();
					evt.preventDefault();
					scope.$apply(function () {
						if (window.File && window.FileReader && window.FileList && window.Blob) {
							if (evt.originalEvent !== undefined) {
                                var items;
								if (BrowserDetectorService.isBrowser.Firefox()) {
									items = evt.originalEvent.dataTransfer.files;
								}
								else if (BrowserDetectorService.isBrowser.Safari()) {
									items = evt.originalEvent.dataTransfer.files;
								}
								else { // we assume it is chrome
									items = evt.originalEvent.dataTransfer.items;
								}

								scope.loadFiles(items);
							}
						}
						else {
							// no browser support for FileAPI
							ModalService.open('views/error.html', scope.dropTextErrorAPI).then(() => {
								scope.dropText = scope.dropTextDefault;
								scope.dropClass = scope.dropClassDefault;
								AppStateService.resetToInitState();
							});
						}
					});
				};

				scope.dragEnterLeave = function (evt) {
					// console.log("my-drop-zone.directive.ts->scope.dragEnterLeave");
					evt.preventDefault();
					scope.$apply(function () {
						scope.dropText = scope.dropTextDefault;
						scope.dropClass = scope.dropClassDefault;
					});
				};

				scope.handleDragOver = function (evt) {
					// console.log("my-drop-zone.directive.ts->scope.handleDragOver");
					evt.preventDefault();
					scope.$apply(function () {
						scope.dropText = scope.dropAllowed;
						scope.dropClass = scope.dropClassOver;
					});
				};

				element.bind('drop', function (event) {
					scope.dropFiles(event);
				});

				element.bind('dragover', function (event) {
					scope.handleDragOver(event);
				});

				element.bind('dragenter', function (event) {
					scope.dragEnterLeave(event);
				});

				element.bind('dragleave', function (event) {
					scope.dragEnterLeave(event);
				});

				element.bind('click', function () {
					var input = element.find('input');
					// call click of my-drop-zone-input
                    input[0].click();
				});


			}
		};
	}]);

