import * as angular from 'angular';

angular.module('emuwebApp')
.directive('imageSelectable', [
  '$timeout', 'LinguisticService', 'AnnotationService','DataService', '$rootScope',
  function($timeout, LinguisticService, AnnotationService, DataService, $rootScope) {
    return {
      restrict: 'E',
      scope: {
        base64Img: '=',       // Base64 image data (e.g., "data:image/jpeg;base64,...")
        zoomScale: '<',       // Zoom factor (e.g., 1, 1.2, etc.)
        onSelection: '&?'     // Callback that receives the bounding box when selection is done
      },
      template: /* html */ `
        <div style="position: relative; display: inline-block;">
          <!-- The image with dynamic dimensions -->
          <img id="selectableImage" ng-src="{{ base64Img }}" alt="Selectable Image"
               style="display: block; overflow: hidden;" />

          <!-- Overlay for selection -->
          <div class="image-selection-overlay"
               style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                      pointer-events: auto; z-index: 9999; background: transparent;"
               ng-mousedown="startSelection($event)"
               ng-mousemove="moveSelection($event)"
               ng-mouseup="endSelection($event)">
          </div>

          <!-- The bounding box highlight -->
          <div class="selection-box"
               ng-show="selectionActive"
               ng-style="{
                 position: 'absolute',
                 top: selectionBox.top + 'px',
                 left: selectionBox.left + 'px',
                 width: selectionBox.width + 'px',
                 height: selectionBox.height + 'px',
                 border: '2px dashed red',
                 background: 'rgba(255, 0, 0, 0.2)'
               }">
          </div>
        </div>
      `,
      link: function(scope, element) {
        console.log('[imageSelectable] link function fired');
        
        // Flag to indicate the context menu is active.
        scope.contextMenuActive = false;
        
        // --- Zoom functionality -----------------------------------------------------------------------------------
        let naturalWidth = 0, naturalHeight = 0;
        const imgEl = element[0].querySelector('#selectableImage');
        if (imgEl) {
          imgEl.addEventListener('load', function() {
            naturalWidth = (imgEl as HTMLImageElement).naturalWidth;
            naturalHeight = (imgEl as HTMLImageElement).naturalHeight;
            updateImageDimensions();
            scope.$apply();
          });
        }
        
        scope.$watch('zoomScale', function(newVal, oldVal) {
          if (newVal !== oldVal) {
            updateImageDimensions();
          }
        });
        
        function updateImageDimensions() {
          const scale = scope.zoomScale || 1;
          const width = naturalWidth * scale;
          const height = naturalHeight * scale;
          if (imgEl) {
            (imgEl as HTMLImageElement).style.width = width + 'px';
            (imgEl as HTMLImageElement).style.height = height + 'px';
          }
        }
        
        // --- Drag selection functionality ---------------------------------------------------------------------------------
        let startX = 0, startY = 0, isDragging = false;
        scope.selectionBox = { top: 0, left: 0, width: 0, height: 0 };
        scope.selectionActive = false;
        
        scope.startSelection = function(evt: MouseEvent) {
          // Only start selection if left button (button 0) is used.
          if (evt.button !== 0) return;
          isDragging = true;

          scope.selectionActive = true;
          const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
          startX = evt.clientX - rect.left;
          startY = evt.clientY - rect.top;
          scope.selectionBox.top = startY;
          scope.selectionBox.left = startX;
          scope.selectionBox.width = 0;
          scope.selectionBox.height = 0;
        };
        
        scope.moveSelection = function(evt: MouseEvent) {
          if (!isDragging) return;

          const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
          const currentX = evt.clientX - rect.left;
          const currentY = evt.clientY - rect.top;
          scope.selectionBox.top = Math.min(startY, currentY);
          scope.selectionBox.left = Math.min(startX, currentX);
          scope.selectionBox.width = Math.abs(currentX - startX);
          scope.selectionBox.height = Math.abs(currentY - startY);
          scope.$applyAsync();
        };
        
        scope.endSelection = function(evt: MouseEvent) {
          // Do not clear selection if the context menu is active.
          if (scope.contextMenuActive) return;
          // Only end selection for left-click mouseup.
          if (evt.button !== 0) return;
          isDragging = false;

          const bbox = {
            top: scope.selectionBox.top,
            left: scope.selectionBox.left,
            width: scope.selectionBox.width,
            height: scope.selectionBox.height
          };
          if (scope.onSelection) {
            scope.onSelection({ bbox: bbox });
          }
          scope.$applyAsync();
        };
        
        // End selection if mouseup occurs outside the overlay.
        angular.element(document).bind('mouseup', function(evt) {
          if (isDragging) {
            scope.endSelection(evt);
          }
        });
        scope.$on('$destroy', function() {
          angular.element(document).unbind('mouseup');
        });
        
        // --- Right-click context menu ------------------------------------------------------------------------------------
        $timeout(() => {
          const overlayEl = element[0].querySelector('.image-selection-overlay');
          if (!overlayEl) return;
          
          const overlayNgEl = angular.element(overlayEl);
          
          overlayNgEl.on('contextmenu', (evt: MouseEvent) => {
            const currentMode = LinguisticService.mode;
            if (!currentMode) {
              console.log('[imageSelectable] no currentMode, skipping context menu');
              return;
            }
            evt.preventDefault();
            evt.stopPropagation();
            
            // Set dragging flag to false to avoid subsequent mouseup clearing selection.
            isDragging = false;
            // Set context menu flag so endSelection doesn't clear the box.
            scope.contextMenuActive = true;

             // common helper to persist into DataService + broadcast
            function persistAndBroadcast(record: any) {
              // AnnotationService already got it in-memory
              // GOOD: clone first, then set
              const current = DataService.getData();
              // deep‐clone
              const updated = angular.copy(current);
              // update the clone
              updated.imageAnnotations = updated.imageAnnotations || [];
              updated.imageAnnotations.push(record);
              // hand the clone back to the service
              DataService.setData(updated);
              $rootScope.$broadcast('annotationChanged');

            }

            
            //For equivalent-from-english-------------------------------------------------------------------------------------------------------------------
            if (currentMode === 'equivalent-from-english') {
              // Create a context menu with a scrollable list of letters and an Ok button.
              const menuDiv = document.createElement('div') as HTMLDivElement;
              menuDiv.style.position = 'absolute';
              menuDiv.style.left = evt.pageX + 'px';
              menuDiv.style.top = evt.pageY + 'px';
              menuDiv.style.background = '#424242';
              menuDiv.style.color = '#fff';
              menuDiv.style.border = '1px solid #ccc';
              menuDiv.style.borderRadius = '6px';
              menuDiv.style.padding = '5px';
              menuDiv.style.zIndex = '9999';
              menuDiv.style.width = '150px';
              menuDiv.style.maxHeight = '200px';
              menuDiv.style.overflowY = 'auto';
              
              // Create a list of letters A-Z.
              const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
              let selectedLetter: string | null = null;
              letters.forEach(letter => {
                const letterItem = document.createElement('div') as HTMLDivElement;
                letterItem.style.padding = '2px 5px';
                letterItem.style.cursor = 'pointer';
                letterItem.textContent = letter;
                letterItem.addEventListener('click', (e: MouseEvent) => {
                  e.stopPropagation();
                  selectedLetter = letter;
                  // Clear previous selections and highlight the clicked letter.
                  Array.from(menuDiv.querySelectorAll('.selected-letter')).forEach((el: Element) => {
                    el.classList.remove('selected-letter');
                    (el as HTMLDivElement).style.background = '';
                  });
                  letterItem.classList.add('selected-letter');
                  letterItem.style.background = '#2b92bb';
                });
                menuDiv.appendChild(letterItem);
              });
              
              // Create an OK button below the list.
              const okBtn = document.createElement('button') as HTMLButtonElement;
              okBtn.textContent = 'Ok';
              okBtn.style.marginTop = '5px';
              okBtn.style.width = '100%';
              okBtn.style.cursor = 'pointer';
              okBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                console.log("Selected letter:", selectedLetter);
                if (selectedLetter) {
                  // 1) pull down the *saved* imageAnnotations from DataService
                  const saved = DataService.getData().imageAnnotations || [];
                  // 2) extract only the numeric parts of “box N”
                  const existingNums = saved
                    .map(a => {
                      const m = /^box\s+(\d+)$/.exec(a.word || '');
                      return m ? parseInt(m[1], 10) : NaN;
                    })
                    .filter(n => !isNaN(n));

                  // 3) pick the next free number
                  const nextNum  = existingNums.length
                                ? Math.max(...existingNums) + 1
                                  : 1;
                  const boxLabel = `box ${nextNum}`;
                  
                  const currentBbox = {
                    top:   scope.selectionBox.top,
                    left:  scope.selectionBox.left,
                    width: scope.selectionBox.width,
                    height: scope.selectionBox.height
                  };

                  // add to the in-memory service
                  AnnotationService.addAnnotation(
                    boxLabel,
                    "equivalent-from-english",
                    selectedLetter,
                    null,
                    currentBbox
                  );

                  // persist back into DataService
                  const current = DataService.getData();
                  const updated = angular.copy(current);
                  updated.imageAnnotations = updated.imageAnnotations || [];
                  updated.imageAnnotations.push({
                    word:     boxLabel,
                    engAlpha: selectedLetter,
                    moSymbol: "",
                    moPhrase: "",
                    comment:  "",
                    pdfId:    null,
                    bbox:     currentBbox
                  });
                  DataService.setData(updated);
                  $rootScope.$broadcast('annotationChanged');

                }
                // Reset the context menu flag and clear the selection box.
                scope.contextMenuActive = false;
                scope.selectionActive = false;
                scope.selectionBox = { top: 0, left: 0, width: 0, height: 0 };
                scope.$applyAsync();
                
                if (document.body.contains(menuDiv)) {
                  document.body.removeChild(menuDiv);
                }
                document.removeEventListener('click', handleClickOutside);
              });
              

              menuDiv.appendChild(okBtn);
              
              document.body.appendChild(menuDiv);
              
              // Global click handler: remove the menu if clicking outside.
              const handleClickOutside = function(e: MouseEvent) {
                if (!menuDiv.contains(e.target as Node)) {
                  if (document.body.contains(menuDiv)) {
                    document.body.removeChild(menuDiv);
                  }
                  // Reset flag so future mouseup events can clear the selection.
                  scope.contextMenuActive = false;
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              document.addEventListener('click', handleClickOutside);
            } 
            
            //For meaning-of-symbol------------------------------------------------------------------------------------------------------------------
            if (currentMode === 'meaning-of-symbol') {
              // Create a popup container.
              const popup = document.createElement('div') as HTMLDivElement;
              popup.style.position = 'absolute';
              popup.style.left = evt.pageX + 'px';
              popup.style.top = evt.pageY + 'px';
              popup.style.background = '#424242';
              popup.style.border = '1px solid #ccc';
              popup.style.borderRadius = '6px';
              popup.style.padding = '5px';
              popup.style.zIndex = '999999';
              // Smaller dimensions for a one-word input.
              popup.style.width = '120px';
              popup.style.maxHeight = '80px';
              popup.style.overflow = 'hidden';
            
              // Create a textarea for entering the symbol's meaning.
              const textarea = document.createElement('textarea') as HTMLTextAreaElement;
              textarea.placeholder = 'Type word...';
              textarea.style.color = 'black';
              textarea.style.marginRight = '5px';
              textarea.style.zIndex = '999999';
              // Smaller dimensions for a one-word input.
              textarea.style.width = '100px';
              textarea.style.height = '30px';
              textarea.style.resize = 'none';
              textarea.style.fontSize = '14px';
              textarea.style.padding = '2px';
            
              let currentComment = "";
              textarea.addEventListener('keyup', (e: KeyboardEvent) => {
                if (e.key.length === 1) {
                  currentComment += e.key;
                } else if (e.key === 'Backspace') {
                  currentComment = currentComment.slice(0, -1);
                }
                textarea.value = currentComment;
              });
            
              // Create an OK button.
              const doneBtn = document.createElement('button') as HTMLButtonElement;
              doneBtn.textContent = 'Ok';
              doneBtn.style.marginTop = '3px';
              doneBtn.style.width = '100%';
              doneBtn.style.cursor = 'pointer';
              doneBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                const comment = currentComment.trim();
                if (comment) {
                  const saved = DataService.getData().imageAnnotations || [];
                  const existingNums = saved
                    .map(a => {
                      const m = /^box\s+(\d+)$/.exec(a.word || '');
                      return m ? parseInt(m[1], 10) : NaN;
                    })
                    .filter(n => !isNaN(n));
                  const nextNum = existingNums.length
                  ? Math.max(...existingNums) + 1
                  : 1;
                  const boxLabel = `box ${nextNum}`;
                  const currentBbox = {
                    top:   scope.selectionBox.top,
                    left:  scope.selectionBox.left,
                    width: scope.selectionBox.width,
                    height: scope.selectionBox.height
                  };

                  AnnotationService.addAnnotation(
                    boxLabel,
                    "meaning-of-symbol",
                    comment,
                    null,
                    currentBbox
                  );

                  // now persist using the same “saved” array
                  const current = DataService.getData();
                  const updated = angular.copy(current);
                  updated.imageAnnotations = updated.imageAnnotations || [];
                  updated.imageAnnotations.push({
                    word:     boxLabel,
                    engAlpha: "",
                    moSymbol: comment,
                    moPhrase: "",
                    comment:  "",
                    pdfId:    null,
                    bbox:     currentBbox
                  });
                  DataService.setData(updated);
                  $rootScope.$broadcast('annotationChanged');
                  

                }
                // Reset the flags and clear the drag selection box.
                scope.contextMenuActive = false;
                scope.selectionActive = false;
                scope.selectionBox = { top: 0, left: 0, width: 0, height: 0 };
                scope.$applyAsync();
                if (document.body.contains(popup)) {
                  document.body.removeChild(popup);
                }
                document.removeEventListener('click', handleClickOutside);
              });
            
              popup.appendChild(textarea);
              popup.appendChild(doneBtn);
              document.body.appendChild(popup);
              textarea.focus();
            
              // Global click handler to dismiss the popup if clicking outside.
              const handleClickOutside = (evt: MouseEvent) => {
                if (!popup.contains(evt.target as Node)) {
                  if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                  }
                  scope.contextMenuActive = false;
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
              }, 0);
              return;
            }
            

            //For meaning-of-phrase-------------------------------------------------------------------------------------------
            if (currentMode === 'meaning-of-phrase') {
              // Create a popup container.
              const popup = document.createElement('div') as HTMLDivElement;
              popup.style.position = 'absolute';
              popup.style.left = evt.pageX + 'px';
              popup.style.top = evt.pageY + 'px';
              popup.style.background = '#424242';
              popup.style.border = '1px solid #ccc';
              popup.style.borderRadius = '6px';
              popup.style.padding = '5px';
              popup.style.zIndex = '999999';
              // Larger dimensions for a phrase.
              popup.style.width = '300px';
              popup.style.maxHeight = '150px';
              popup.style.overflow = 'auto';
            
              // Create a textarea for entering the phrase meaning.
              const textarea = document.createElement('textarea') as HTMLTextAreaElement;
              textarea.placeholder = 'Type the meaning of the phrase';
              textarea.style.color = 'black';
              textarea.style.marginRight = '5px';
              textarea.style.zIndex = '999999';
              // Larger dimensions for multiple words.
              textarea.style.width = '280px';
              textarea.style.height = '100px';
              textarea.style.resize = 'none';
              textarea.style.fontSize = '14px';
              textarea.style.padding = '5px';
            
              let currentComment = "";
              textarea.addEventListener('keyup', (e: KeyboardEvent) => {
                if (e.key.length === 1) {
                  currentComment += e.key;
                } else if (e.key === 'Backspace') {
                  currentComment = currentComment.slice(0, -1);
                }
                textarea.value = currentComment;
              });
            
              // Create an OK button.
              const doneBtn = document.createElement('button') as HTMLButtonElement;
              doneBtn.textContent = 'Ok';
              doneBtn.style.marginTop = '5px';
              doneBtn.style.width = '100%';
              doneBtn.style.cursor = 'pointer';
              doneBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                const comment = currentComment.trim();
                if (comment) {
                    // pull the *saved* annotations (not just the in-memory ones)
                    const saved = DataService.getData().imageAnnotations || [];
                    // extract the existing “box N” numbers
                    const existingNums = saved
                      .map(a => {
                        const m = /^box\s+(\d+)$/.exec(a.word || '');
                        return m ? parseInt(m[1], 10) : NaN;
                      })
                      .filter(n => !isNaN(n));

                    // next box number is max+1 (or 1 if none yet)
                    const nextNum = existingNums.length
                      ? Math.max(...existingNums) + 1
                      : 1;
                    const boxLabel = `box ${nextNum}`;

                    const currentBbox = {
                      top:   scope.selectionBox.top,
                      left:  scope.selectionBox.left,
                      width: scope.selectionBox.width,
                      height: scope.selectionBox.height
                    };

                    // update in-memory
                    AnnotationService.addAnnotation(
                      boxLabel,
                      "meaning-of-phrase",
                      comment,
                      null,
                      currentBbox
                    );

                    // persist into DataService
                    const current = DataService.getData();
                    const updated = angular.copy(current);
                    updated.imageAnnotations = updated.imageAnnotations || [];
                    updated.imageAnnotations.push({
                      word:     boxLabel,
                      engAlpha: "",
                      moSymbol: "",
                      moPhrase: comment,
                      comment:  "",
                      pdfId:    null,
                      bbox:     currentBbox
                    });
                    DataService.setData(updated);

                    // let the table refresh
                    $rootScope.$broadcast('annotationChanged');

                }
                scope.contextMenuActive = false;
                scope.selectionActive = false;
                scope.selectionBox = { top: 0, left: 0, width: 0, height: 0 };
                scope.$applyAsync();
                if (document.body.contains(popup)) {
                  document.body.removeChild(popup);
                }
                document.removeEventListener('click', handleClickOutside);
              });
              popup.appendChild(textarea);
              popup.appendChild(doneBtn);
              document.body.appendChild(popup);
              textarea.focus();
              
              const handleClickOutside = (evt: MouseEvent) => {
                if (!popup.contains(evt.target as Node)) {
                  if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                  }
                  scope.contextMenuActive = false;
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
              }, 0);
              return;
            }
            

            //For other comments-------------------------------------------------------------------------------------------
            if (currentMode && currentMode.trim() === 'other comments') {
              // Create a popup container.
              const popup = document.createElement('div') as HTMLDivElement;
              popup.style.position = 'absolute';
              popup.style.left = evt.pageX + 'px';
              popup.style.top = evt.pageY + 'px';
              popup.style.background = '#424242';
              popup.style.border = '1px solid #ccc';
              popup.style.borderRadius = '6px';
              popup.style.padding = '5px';
              popup.style.zIndex = '999999';
              // Larger dimensions for multi-line comment.
              popup.style.width = '300px';
              popup.style.maxHeight = '150px';
              popup.style.overflow = 'auto';
            
              // Create a textarea for entering the comment.
              const textarea = document.createElement('textarea') as HTMLTextAreaElement;
              textarea.placeholder = 'add your own comment';
              textarea.style.color = 'black';
              textarea.style.marginRight = '5px';
              textarea.style.zIndex = '999999';
              // Adjust dimensions for longer text.
              textarea.style.width = '280px';
              textarea.style.height = '100px';
              textarea.style.resize = 'none';
              textarea.style.fontSize = '14px';
              textarea.style.padding = '5px';
            
              let currentComment = "";
              textarea.addEventListener('keyup', (e: KeyboardEvent) => {
                if (e.key.length === 1) {
                  currentComment += e.key;
                } else if (e.key === 'Backspace') {
                  currentComment = currentComment.slice(0, -1);
                }
                textarea.value = currentComment;
              });
            
              // Create an OK button.
              const doneBtn = document.createElement('button') as HTMLButtonElement;
              doneBtn.textContent = 'Ok';
              doneBtn.style.marginTop = '5px';
              doneBtn.style.width = '100%';
              doneBtn.style.cursor = 'pointer';
              doneBtn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                const comment = currentComment.trim();
                if (comment) {
                  // const boxLabel = "box " + (AnnotationService.annotations.length + 1);
                  // Dynamically determine the next unused box number:
                  //  • pull all existing “box N” labels
                  //  • extract N as integers
                  //  • take max (or 0 if none) and add 1
                  const existingNums = AnnotationService.annotations
                   .map(a => {
                     const m = /^box\s+(\d+)$/.exec(a.word || '');
                     return m ? parseInt(m[1], 10) : NaN;
                   })
                   .filter(n => !isNaN(n));
                  
                  const nextNum = existingNums.length ? Math.max(...existingNums) + 1 : 1;
                  const boxLabel = `box ${nextNum}`;

                  const currentBbox = {
                    top: scope.selectionBox.top,
                    left: scope.selectionBox.left,
                    width: scope.selectionBox.width,
                    height: scope.selectionBox.height
                  };
                  AnnotationService.addAnnotation(boxLabel, "other comments", comment, null, currentBbox);

                  const current = DataService.getData();
                  // GOOD: clone, then mutate the clone
                  const updated = angular.copy(current);
                  updated.imageAnnotations = updated.imageAnnotations || [];
                  updated.imageAnnotations.push({
                    word:     boxLabel,
                    engAlpha: "",     // or “” for other modes
                    moSymbol: "",   // or “” for other modes
                    moPhrase: "",   // or “” for other modes
                    comment:  comment,    // or “” for other modes
                    pdfId:    null,
                    bbox:     currentBbox
                  });
                  DataService.setData(updated);
                  $rootScope.$broadcast('annotationChanged');
                }
                scope.contextMenuActive = false;
                scope.selectionActive = false;
                scope.selectionBox = { top: 0, left: 0, width: 0, height: 0 };
                scope.$applyAsync();
                if (document.body.contains(popup)) {
                  document.body.removeChild(popup);
                }
                document.removeEventListener('click', handleClickOutside);
              });
              popup.appendChild(textarea);
              popup.appendChild(doneBtn);
              document.body.appendChild(popup);
              textarea.focus();
            
              const handleClickOutside = (evt: MouseEvent) => {
                if (!popup.contains(evt.target as Node)) {
                  if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                  }
                  scope.contextMenuActive = false;
                  document.removeEventListener('click', handleClickOutside);
                }
              };
              setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
              }, 0);
              return;
            }
            
            

          });
        }, 0);
      }
    };
  }
]);
