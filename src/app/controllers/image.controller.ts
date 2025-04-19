import * as angular from 'angular';

angular.module('emuwebApp')
.controller('ImageController', [
  '$scope', '$rootScope', 'DragnDropDataService', 'ImageStateService', 'LinguisticService', 'AnnotationService','LoadedMetaDataService','ViewStateService',
  function($scope, $rootScope, DragnDropDataService, ImageStateService, LinguisticService, AnnotationService, LoadedMetaDataService, ViewStateService) {
    var vm = this;

    // Injected services
    vm.imgState = ImageStateService;
    vm.linguisticService = LinguisticService;
    
    // Set current annotation mode (stored in LinguisticService)
    vm.currentMode = LinguisticService.mode;
    
    // Shared annotations from AnnotationService
    vm.annotations = AnnotationService.annotations || [];
    
    // Controls the visibility of the annotation window
    vm.showAnnotationWindow = false;

    // Set annotation mode and broadcast the change (similar to PDF controller)
    vm.selectAnnotation = function(mode) {
      LinguisticService.mode = mode;
      vm.currentMode = mode;
      $rootScope.$broadcast('linguisticModeChanged', mode);
      vm.showAnnotationWindow = true;
      console.log("Annotation mode selected:", mode);
    };

    // Handle selection on the image.
    // Removed the prompt for 'equivalent-from-english' as the context menu will handle it.
    vm.handleSelection = function(bbox) {
      // console.log("User selected bounding box:", bbox);
      var annotationText = "";
      if (vm.currentMode === 'equivalent-from-english') {
        // No prompt, context menu will be used.
        annotationText = "";
      } else if (vm.currentMode === 'meaning-of-symbol') {
        annotationText = "";
      } else if (vm.currentMode === 'meaning-of-phrase') {
        annotationText = "";
      } else if (vm.currentMode === 'other comments') {
        annotationText = "";
      }
      
      var newAnnotation = {
        bbox: bbox,
        engAlpha: vm.currentMode === 'equivalent-from-english' ? annotationText : "",
        moSymbol: vm.currentMode === 'meaning-of-symbol' ? annotationText : "",
        moPhrase: vm.currentMode === 'meaning-of-phrase' ? annotationText : "",
        otherComments: vm.currentMode === 'other comments' ? annotationText : ""
      };
      
        // vm.annotations.push(newAnnotation);
        // // console.log("Annotations:", vm.annotations);
        // vm.showAnnotationWindow = true;
    };


    vm.deleteAnnotation = function(annotation) {
       // If this annotation is currently highlighted, remove its overlay.
      if (vm.currentHighlightAnnotation === annotation) {
        if (vm.currentHighlight && vm.currentHighlight.parentNode) {
          vm.currentHighlight.parentNode.removeChild(vm.currentHighlight);
        }
        vm.currentHighlight = null;
        vm.currentHighlightAnnotation = null;
      }
      // Remove the annotation from the AnnotationService.
      AnnotationService.removeAnnotation(annotation.word, annotation.pdfId);
    };


    vm.exportAnnotations = function() {
      // Define CSV headers.
      let csvContent = "Bounding Box,EngAlpha,MoSymbol,MoPhrase,Other Comments\n";
      
      // Loop through annotations and create CSV rows.
      vm.annotations.forEach(ann => {
        // For the bounding box, if it's an image annotation (pdfId is null), use ann.word.
        let boundingBox = ann.pdfId === null 
          ? ann.word 
          : (ann.bbox ? (ann.bbox.left + ',' + ann.bbox.top + ' – ' + ann.bbox.width + '×' + ann.bbox.height) : "");
          
        // Create a CSV row.
        let row = [
          `"${boundingBox.replace(/"/g, '""')}"`,
          `"${(ann.engAlpha || "").replace(/"/g, '""')}"`,
          `"${(ann.moSymbol || "").replace(/"/g, '""')}"`,
          `"${(ann.moPhrase || "").replace(/"/g, '""')}"`,
          `"${(ann.comment || "").replace(/"/g, '""')}"`
        ].join(",");
        
        csvContent += row + "\n";
      });
      
      // Encode the CSV string.
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      
      // Create a temporary link element and trigger download.
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "annotations.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    
    vm.toggleHighlight = function(annotation) {
      // If the annotation is already highlighted, remove the highlight.
      if (vm.currentHighlight && vm.currentHighlightAnnotation === annotation) {
        if (vm.currentHighlight.parentNode) {
          vm.currentHighlight.parentNode.removeChild(vm.currentHighlight);
        }
        vm.currentHighlight = null;
        vm.currentHighlightAnnotation = null;
      } else {
        // Remove any previous highlight.
        if (vm.currentHighlight && vm.currentHighlight.parentNode) {
          vm.currentHighlight.parentNode.removeChild(vm.currentHighlight);
        }
        // If this annotation has a bounding box, create an overlay.
        if (annotation.bbox) {
          const imageEl = document.getElementById('selectableImage');
          if (imageEl && imageEl.parentElement) {
            const overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.border = '2px solid yellow';
            overlay.style.pointerEvents = 'none'; // So it doesn't block other interactions.
            overlay.style.top = annotation.bbox.top + 'px';
            overlay.style.left = annotation.bbox.left + 'px';
            overlay.style.width = annotation.bbox.width + 'px';
            overlay.style.height = annotation.bbox.height + 'px';
            imageEl.parentElement.appendChild(overlay);
            vm.currentHighlight = overlay;
            vm.currentHighlightAnnotation = annotation;
          }
        }
      }
    };
    
    
    // Update the local currentMode when LinguisticService.mode changes.
    $scope.$on('linguisticModeChanged', function(e, mode) {
      vm.currentMode = mode;
    });
    $scope.$watch(function() { return LinguisticService.mode; }, function(newMode) {
      vm.currentMode = newMode;
    });
// ─────────── Helpers to set the image src ───────────

    /** 
     * If this bundle has a BASE64 image payload, build a data‑URL 
     * and stick it in vm.imgSrc.
     */
    function applyBundle(bundle: any) {
      console.log("inside applyBundle()");
      console.log("bundle: ",bundle);
      if (
        bundle &&
        bundle.mediaFile &&
        bundle.mediaFile.encoding === 'BASE64'
      ) {
        const t = bundle.mediaFile.type.toLowerCase();
        if (
          t === 'img' ||
          t === 'image' ||
          t === 'jpeg' ||
          t === 'jpg' ||
          t.startsWith('image/')
        ) {
          const ext = bundle.name.split('.').pop().toLowerCase();
          vm.imgSrc = `data:image/${ext};base64,${bundle.mediaFile.data}`;
          console.log("ImageController imgSrc set to:", vm.imgSrc);
        }
      }
    }
    
    function init() {

      console.log("inside the init() of the image.controller.ts, before i call the getCur of the loaded-metadata");

      // drag‑n‑drop
      const idx = DragnDropDataService.getDefaultSession();
      const ddBndl  = DragnDropDataService.convertedBundles[idx];

      if(ddBndl.mediaFile.encoding === 'GETURL'){
        const fullBndl = LoadedMetaDataService.getCurBndl();
        console.log("Falling back to full curBndl:", fullBndl);

        applyBundle(fullBndl);
              
        ViewStateService.getCurStateName();

      }else if(ddBndl.mediaFile.encoding === 'BASE64'){
        applyBundle(ddBndl);
        ViewStateService.getCurStateName();
        
      }


    }
    
    $scope.$on('nonAudioBundleLoaded', (_e, args: {bundle:any}) => {
      console.log("Inside the nonAudioBundleLoaded() of the image.controller.ts++++++++++++++++++++++++++++++++++++++++++++++");

      console.log("ImageController got nonAudioBundleLoaded:", args.bundle);
      applyBundle(args.bundle);
    });
    
    init();
  }
]);
