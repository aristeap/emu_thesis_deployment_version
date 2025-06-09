import * as angular from 'angular';
declare function saveAs(blob: Blob, filename: string): void;


angular.module('emuwebApp')
.controller('ImageController', [
  '$scope', '$rootScope', 'DragnDropDataService', 'ImageStateService', 'LinguisticService', 'AnnotationService','LoadedMetaDataService','ViewStateService','DataService','ModalService','ValidationService',
  function($scope, $rootScope, DragnDropDataService, ImageStateService, LinguisticService, AnnotationService, LoadedMetaDataService, ViewStateService, DataService,ModalService, ValidationService) {
    var vm = this;

    // Injected services
    vm.imgState = ImageStateService;
    vm.linguisticService = LinguisticService;
    
    // Set current annotation mode (stored in LinguisticService)
    vm.currentMode = LinguisticService.mode;
    
    // Shared annotations from AnnotationService
    vm.annotations = AnnotationService.annotations || [];
    
    $rootScope.$on('annotationChanged', () => {
      vm.annotations = DataService.getData().imageAnnotations || [];
    });

    // Controls the visibility of the annotation window
    vm.showAnnotationWindow = false;

    vm.downloadAnnotationBtnClick = function() {
        // 1) Pull the raw “annotation” array from DataService
        const allData = DataService.getData() || {};
        // Make sure it’s at least an array (or empty array if nothing yet).
        const imageAnnotations = Array.isArray(allData.imageAnnotations)
          ? allData.imageAnnotations
          : [];

        // 2) Wrap it in the same top‐level object that your schema expects.
        //    If your schema wants { imageAnnotations: [...] }, do that. Otherwise,
        //    adjust to match whatever shape “annotationFileSchema” requires.
        const payload = { imageAnnotations: imageAnnotations };

        // 3) Validate using the same JSON schema you use for PDF/video
        const valid = ValidationService.validateJSO('annotationFileSchema', payload);
        if (valid !== true) {
          // optionally show an error or just bail
          console.warn('Cannot download: JSON did not pass schema validation', valid);
          return;
        }

        // 4) Finally, open the modal exactly as the PDF version does:
        const bundleName = LoadedMetaDataService.getCurBndl().name || 'image';
        const filename = bundleName + '_annot.json';

        ModalService.open(
          'views/export.html',
          filename,
          // pretty‐print the JSON so that the user sees it in the modal
          angular.toJson(payload, true)
        );
      };


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
      
      // // 2️⃣ Push into the local UI array
      // vm.annotations.push(newAnnotation);
      
      // // 3️⃣ Persist into DataService so “Save Everything” picks it up
      // const data = DataService.getData();
      // data.imageAnnotations = data.imageAnnotations || [];
      // data.imageAnnotations.push(newAnnotation);
      // DataService.setData(data);

      // // 4️⃣ Tell everyone we’ve added an annotation
      // $rootScope.$broadcast('annotationChanged');
      

    };


    vm.deleteAnnotation = function(annotation) {

      console.log("-----------------------------------------------deleteAnnotation has been clicked");
       // If this annotation is currently highlighted, remove its overlay.
      if (vm.currentHighlightAnnotation === annotation) {
        if (vm.currentHighlight && vm.currentHighlight.parentNode) {
          vm.currentHighlight.parentNode.removeChild(vm.currentHighlight);
          console.log("inside the if in the deleteAnnotation");
        }
        vm.currentHighlight = null;
        vm.currentHighlightAnnotation = null;
      }

      console.log("annotation.word: ",annotation.word, " annotation.pdfId: ",annotation.pdfId);
      // 2) remove from AnnotationService
      AnnotationService.removeAnnotation(annotation.word, annotation.pdfId);
      
      // 2) clone the store’s data, filter out that annotation, then overwrite the store
      const current = DataService.getData();
      const updated = angular.copy(current);                    // brand-new object
      updated.imageAnnotations = (updated.imageAnnotations || [])
      .filter(a => !(a.word === annotation.word && a.pdfId === annotation.pdfId));
      DataService.setData(updated);                             // now src !== dest, so no error
      

      // 4) re-broadcast so your ImageController picks up the change
      $rootScope.$broadcast('annotationChanged');    
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
    

    // ───────────────────────────────────────────────────────────────
    // ★ NEW METHOD: saveCroppedSegmentForImage ★
    // Called when the user clicks the “save” icon in the annotation table.
    vm.saveCroppedSegmentForImage = function(annotation) {
      console.log("inside the saveCroppedSegmentForImage------------");
      // 1) Find the <img> element that is displaying our Base64 image.
      const imgEl = document.getElementById('selectableImage') as HTMLImageElement;
      if (!imgEl) {
        console.warn("Could not find selectableImage <img> in DOM.");
        return;
      }

      // 2) Compute the displayed width & height of the image.
      //    (Because the user may have zoomed, the <img> style.width/height reflect that scale.)
      const displayWidth  = imgEl.clientWidth;
      const displayHeight = imgEl.clientHeight;

      // 3) Create an off‐screen canvas the same size as the displayed image.
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width  = displayWidth;
      tempCanvas.height = displayHeight;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        console.warn("Could not get 2D context on temporary canvas.");
        return;
      }

      // 4) Draw the entire displayed image onto the off‐screen canvas.
      //    Using drawImage(imgEl, 0, 0, displayWidth, displayHeight).
      //    This captures exactly what the user sees at the current zoom level.
      ctx.drawImage(imgEl, 0, 0, displayWidth, displayHeight);

      // 5) Extract the annotated rectangle from tempCanvas →
      //    These coordinates are in “display‐pixel” space.  annotation.bbox came from the
      //    selection overlay, so its top/left/width/height already match the <img>’s displayed size.
      const { top, left, width, height } = annotation.bbox as {
        top: number;
        left: number;
        width: number;
        height: number;
      };

      // 6) Create a second canvas just big enough for the crop rectangle:
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width  = width;
      cropCanvas.height = height;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) {
        console.warn("Could not get 2D context on crop canvas.");
        return;
      }

      // 7) Copy pixel data from the large “tempCanvas” into the smaller “cropCanvas”:
      cropCtx.drawImage(
        tempCanvas,
        left, top,         // source x, y
        width, height,     // source w, h
        0,    0,           // dest x, y
        width, height      // dest w, h
      );

      // 8) Convert the cropped region to a Blob and trigger a download:
      //    We’ll choose PNG here (lossless).  If you prefer JPEG, change 'image/png' → 'image/jpeg'.
      cropCanvas.toBlob(blob => {
        if (!blob) {
          console.warn("Could not convert crop to Blob.");
          return;
        }

        // Build a sensible file name, e.g. "<bundle>_<boxLabel>.png"
        const bundleName = DragnDropDataService.convertedBundles[
          DragnDropDataService.getDefaultSession()
        ].name || 'cropped-image';
        const safeLabel = annotation.word.replace(/\s+/g, '_'); // e.g. “box_3”
        const filename  = `${bundleName}_${safeLabel}.png`;

        // Finally, trigger FileSaver’s saveAs(...) on that blob:
        saveAs(blob, filename);
      }, 'image/png');
    };
    // ───────────────────────────────────────────────────────────────
    

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
      // console.log("inside applyBundle()");
      //console.log("bundle: ",bundle);
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
          // console.log("ImageController imgSrc set to:", vm.imgSrc);
        }
      }
    }
    
    function init() {

      // drag-n-drop
      const idx = DragnDropDataService.getDefaultSession();
      const ddBndl = DragnDropDataService.convertedBundles[idx];
      
      // ── Guard: if no bundle or no mediaFile yet, do nothing and return ──
      if (!ddBndl || !ddBndl.mediaFile) {
            return;
      }
      
      // 1) rehydrate your annotations array from DataService
      vm.annotations = DataService.getData().imageAnnotations || [];

      if(ddBndl.mediaFile.encoding === 'GETURL'){
        const fullBndl = LoadedMetaDataService.getCurBndl();
        console.log("Falling back to full curBndl:", fullBndl);

        applyBundle(fullBndl);
              
        ViewStateService.getCurStateName();

      }else if(ddBndl.mediaFile.encoding === 'BASE64'){
        applyBundle(ddBndl);
        ViewStateService.getCurStateName();
        
      }

      if (ddBndl.session === "DB") {
        vm.showAnnotationWindow = true;
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
