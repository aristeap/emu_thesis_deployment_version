import * as angular from 'angular';

angular.module('emuwebApp')
.directive('myDropZone', [
  '$animate', 
  '$compile', 
  'DragnDropService', 
  'BrowserDetectorService', 
  'AppStateService', 
  'ModalService',
  function (
    $animate, 
    $compile, 
    DragnDropService, 
    BrowserDetectorService, 
    AppStateService, 
    ModalService
  ) {
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
        // ————— UI‐text for various drag‐drop states —————
        scope.dropTextDefault         = 'Drop your files here (.wav/pdf/jpeg/mp4/json) or click to browse. You can drop a single file to annotate it or a file + _annot.json so you can it can get loaded along with its annotations';
        scope.dropTextErrorFileType   = 'Error: Unsupported file type. Please drop .wav/.pdf/.jpeg/.mp4 or “_annot.json.”';
        scope.dropTextErrorAPI        = 'Your browser does not support File APIs.';
        scope.dropAllowed             = 'Release to drop file(s).';
        scope.dropParsingMedia        = 'Media loading…';
        scope.dropParsingJSON         = 'Annotation JSON loading…';
        scope.dropFirefoxWarning      = 'Firefox doesn’t support dropping folders—drop single files only.';

        scope.dropText  = scope.dropTextDefault;
        scope.dropClass = '';
        scope.dropClassDefault = '';
        scope.dropClassOver    = 'over';
        scope.dropClassError   = 'error';

        // How many files total we are expecting to enqueue
        scope.count   = 0;
        // Which files have actually been enqueued so far
        scope.handles = [];

        // “bundles” is an array of arrays.  Each “bundle” is:
        //   [  bundleBaseName,  {file:,extension:}, {file:,extension:}  ]
        // where index 1 will hold the media, index 2 will hold its “_annot.json” (if any).
        scope.bundles     = [];
        scope.bundleNames = [];

        // Whenever we want to increment the “queue length” (i.e. how many new files we expect):
        scope.updateQueueLength = function (quantity) {
          scope.count += quantity;
        };

        // Called ONCE for each file as soon as we know its name+File object. 
        // We classify it as “media” or “annotation JSON” (or reject it).
        scope.enqueueFileAddition = function (file) {
          var rawName = file.name;
          // Extract extension in uppercase to compare easily:
          var extension = rawName.substr(rawName.lastIndexOf('.') + 1).toUpperCase();
          console.log("→ enqueueFileAddition: rawName=", rawName, " extension=", extension);

          // Determine the “bundleBase” by stripping off “.wav” or “_annot.json”:
          var bundleBase;
          if (extension === 'JSON' && rawName.toLowerCase().endsWith('_annot.json')) {
            console.log("inside my-drop-zone.directive.ts->enqueueFileAddition() the extension of JSON");
            // “msajc003_annot.json” ⇒ bundleBase = “msajc003”
            bundleBase = rawName.slice(0, -('_annot.json'.length));
          } else {
            console.log("inside my-drop-zone.directive.ts->enqueueFileAddition() the extension of else");
            // e.g. “msajc003.wav” ⇒ bundleBase = “msajc003”
            bundleBase = rawName.substr(0, rawName.lastIndexOf('.'));
          }

          // Find (or create) an entry for this bundleBase in bundleNames/bundles:
          var j = scope.bundleNames.indexOf(bundleBase);
          if (j === -1) {
            scope.bundleNames.push(bundleBase);
            j = scope.bundleNames.indexOf(bundleBase);
            // Initialize "[ bundleBase ]" at index 0; media goes to [1], JSON to [2]
            scope.bundles[j] = [];
            scope.bundles[j][0] = bundleBase;
          }

          // Now classify this dropped file:
          if (['WAV', 'PDF', 'JPEG', 'JPG', 'MP4'].indexOf(extension) !== -1) {
                console.log("   classified as media:", extension);
            // — It's a media file (WAV/PDF/JPEG/MP4)
            scope.bundles[j][1] = { file: file, extension: extension };
            scope.handles.push(file);
            scope.dropClass = scope.dropClassDefault;
            scope.dropText  = scope.dropParsingMedia;

          } else if (
            extension === 'JSON' && 
            rawName.toLowerCase().endsWith('_annot.json')
          ) {
            // — It's the annotation JSON companion
            scope.bundles[j][2] = { file: file, extension: extension };
            scope.handles.push(file);
            scope.dropClass = scope.dropClassDefault;
            scope.dropText  = scope.dropParsingJSON;

          } else {
            // — Unsupported type → show error and reset everything
            if (BrowserDetectorService.isBrowser.Firefox()) {
              scope.dropClass = scope.dropClassError;
              scope.dropText  = (file.size === 0)
                ? scope.dropFirefoxWarning
                : scope.dropTextErrorFileType;
            } else {
              scope.dropClass = scope.dropClassError;
              scope.dropText  = scope.dropTextErrorFileType;
            }
            // Reset queue
            scope.handles = [];
            scope.bundles = [];
            scope.bundleNames = [];
            scope.count = 0;
          }

          // Force a digest() unless on Firefox/Safari (which don’t require it here)
          if (!BrowserDetectorService.isBrowser.Firefox() && !BrowserDetectorService.isBrowser.Safari()) {
            scope.$digest();
          }

          // If we have created/updated “scope.bundles[j]” at all, let’s attempt rendering:
          if (scope.bundles[j] !== undefined) {
            scope.startRendering();
          }
        };


        // Once all enqueued files have been “handed off”, we flush the queue.
        scope.startRendering = function () {
          // Only when the number we “counted” matches how many actually got enqueued:
          if (scope.count === scope.handles.length) {
            // Pass the entire array of bundles to DragnDropService
            // (each bundle may have [0]=baseName, [1]=media, [2]=JSON)
            if (DragnDropService.setData(scope.bundles) === false) {
              ModalService
                .open('views/error.html', 
                      'Dropped too many bundles (max ' + 
                      DragnDropService.maxDroppedBundles + ').')
                .then(() => { AppStateService.resetToInitState(); });
            }

            // Reset our local state for the next drag
            scope.handles = [];
            scope.bundles = [];
            scope.bundleNames = [];
            scope.count = 0;
            scope.dropText  = scope.dropTextDefault;
            scope.dropClass = scope.dropClassDefault;
          }
        };


        // Given a NodeList or FileList, enqueue them one by one:
        scope.loadFiles = function (files) {
          console.log("4)inside my-drop-zone.directive.ts->loadFiles()");
          scope.updateQueueLength(files.length);
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            // Skip “.DS_Store” or empty entries:
            if (file.name === '.DS_Store') {
              scope.updateQueueLength(-1);
              continue;
            }
            // Modern browsers give `file` itself when dragging; older need getAsEntry
            var entry, reader;
            if (file.isFile || file.isDirectory) {
              console.log("a");
              entry = file;
            } else if (file.getAsEntry) {
               console.log("b"); 
              entry = file.getAsEntry();
            } else if (file.webkitGetAsEntry) {
              console.log("c");
              entry = file.webkitGetAsEntry();
            } else if (typeof file.getAsFile === 'function') {
               console.log("5)inside my-drop-zone.directive.ts->typeof file.getAsFile === 'function'");
              // E.g. Chrome’s DataTransferItem
              scope.enqueueFileAddition(file.getAsFile());
              continue;
            } else if (typeof File !== 'undefined' && file instanceof File) {
              console.log("d");
              // If it’s already a File object
              scope.enqueueFileAddition(file);
              continue;
            } else {
              console.log("e");
              scope.updateQueueLength(-1);
              continue;
            }

            // If “entry” is a FileEntry, read it:
            if (!entry) {
              scope.updateQueueLength(-1);
            }
            else if (entry.isFile) {
              console.log("Got a FileEntry. Now calling entry.file(...) on", entry);
              entry.file(function (f) {
                console.log("entry.file callback: received real File with name:", f.name);
                scope.enqueueFileAddition(f);
              }, function (err) {
                console.warn(err);
                scope.updateQueueLength(-1);
              });
            }
            else if (entry.isDirectory) {
              // We do not support entire directories: read entries, but ignore them
              reader = entry.createReader();
              reader.readEntries(function (entries) {
                scope.loadFiles(entries);
                scope.updateQueueLength(-1);
              }, function (err) {
                console.warn(err);
                scope.updateQueueLength(-1);
              });
            }
          } // end for‐loop
        };


        // Actual drop event: prevent default and delegate to loadFiles(...)
        scope.dropFiles = function (evt) {
          evt.stopPropagation();
          evt.preventDefault();
          scope.$apply(function () {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
              var items;
              if (BrowserDetectorService.isBrowser.Firefox()) {
                items = evt.originalEvent.dataTransfer.files;
              }
              else if (BrowserDetectorService.isBrowser.Safari()) {
                items = evt.originalEvent.dataTransfer.files;
              }
              else {
                console.log("2)my-drop-zone.directive.ts->items=evt.originalEvent..");
                items = evt.originalEvent.dataTransfer.items;
              }
              console.log("3)dropFiles() invoked, items:", evt.originalEvent.dataTransfer.items);
              scope.loadFiles(items);
            } else {
              ModalService
                .open('views/error.html', scope.dropTextErrorAPI)
                .then(() => {
                  scope.dropText  = scope.dropTextDefault;
                  scope.dropClass = scope.dropClassDefault;
                  AppStateService.resetToInitState();
                });
            }
          });
        };

        scope.dragEnterLeave = function (evt) {
          evt.preventDefault();
          scope.$apply(function () {
            scope.dropText  = scope.dropTextDefault;
            scope.dropClass = scope.dropClassDefault;
          });
        };

        scope.handleDragOver = function (evt) {
          evt.preventDefault();
          scope.$apply(function () {
            scope.dropText  = scope.dropAllowed;
            scope.dropClass = scope.dropClassOver;
          });
        };

        element.bind('drop', function (event) {
          console.log("1)my-drop-zone.directive.ts->element.bind(drop)");
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

        // If user clicks on the drop‐zone itself, forward click to the hidden <input>
        element.bind('click', function () {
          var input = element.find('input');
          if (input.length > 0) {
            input[0].click();
          }
        });

      } // end link()
    };
}]);
