import * as angular from 'angular';

angular.module('emuwebApp')
.controller('PdfController', [
  '$scope', '$rootScope', 'DragnDropDataService', 'LoadedMetaDataService', 'PdfStateService', 'LinguisticService', 'AnnotationService','DataService',
  function($scope, $rootScope, DragnDropDataService, LoadedMetaDataService, PdfStateService, LinguisticService, AnnotationService,DataService) {
    const vm = this;
    vm.linguisticService = LinguisticService;
    vm.pdfState = PdfStateService;
    vm.linguisticMode = LinguisticService.mode;
    
    // Use shared annotations from AnnotationService
    vm.annotations = AnnotationService.annotations;

    $rootScope.$on('annotationChanged', () => {
      vm.annotations = AnnotationService.annotations;
    });
    
    // Control visibility of the floating annotation window.
    vm.showAnnotationTable = false;
    
    // Dictionary to track highlighted annotations by their unique pdfId.
    vm.highlightedAnnotations = {}; // key: pdfId, value: boolean

    vm.selectLinguistic = function(mode) {
      console.log("inside the vm.selectLinguistic-----------------");
      LinguisticService.mode = mode;
      vm.linguisticMode = mode;
      $rootScope.$broadcast('linguisticModeChanged', mode);
      vm.showAnnotationTable = true;
    };

    // Toggle highlight for a specific annotation instance (using its pdfId)
    vm.toggleHighlight = function(word: string, pdfId: string) {
      if (!pdfId) {
        console.warn("No pdfId provided for word:", word);
        return;
      }
      console.log("Toggling highlight for:", word, "with pdfId:", pdfId);
      if (vm.highlightedAnnotations[pdfId]) {
        removeHighlight(pdfId);
        vm.highlightedAnnotations[pdfId] = false;
      } else {
        addHighlight(pdfId);
        vm.highlightedAnnotations[pdfId] = true;
      }
    };

    function addHighlight(pdfId: string) {
      const target = document.querySelector(`[data-pdfid="${pdfId}"]`) as HTMLElement;
      if (target) {
         target.style.backgroundColor = 'yellow';
         target.style.color = 'black';
      } else {
        console.warn("No element found with data-pdfid =", pdfId);
      }
    }

    vm.deleteAnnotation = function(ann) {
      // 1. If it’s highlighted, remove highlight
      if (ann.pdfId && vm.highlightedAnnotations[ann.pdfId]) {
        removeHighlight(ann.pdfId);
        delete vm.highlightedAnnotations[ann.pdfId];
      }
      
      // 2. Remove from the annotation array
      AnnotationService.removeAnnotation(ann.word, ann.pdfId);
      
      console.log("Deleted annotation for word:", ann.word);
    };

    function removeHighlight(pdfId: string) {
      const target = document.querySelector(`[data-pdfid="${pdfId}"]`) as HTMLElement;
      if (target) {
        target.style.removeProperty('background-color');
        target.style.removeProperty('color');      }
    }

    vm.exportAnnotations = function() {
      // Define CSV headers.
      let csvContent = "Word Item,PoS,NeR,SA,Other Comments\n";
      
      // Loop through annotations and convert each object to a CSV row.
      vm.annotations.forEach(ann => {
        // Escape double quotes by doubling them.
        const escapeCSV = (text: string) => `"${text.replace(/"/g, '""')}"`;
        
        csvContent += [
          escapeCSV(ann.word || ""),
          escapeCSV(ann.pos || ""),
          escapeCSV(ann.ner || ""),
          escapeCSV(ann.sa || ""),
          escapeCSV(ann.comment || "")
        ].join(",") + "\n";
      });
      
      // Create a Blob from the CSV string.
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download.
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "annotations.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };    


    $scope.$on('linguisticModeChanged', function(e, mode) {
      vm.linguisticMode = mode;
    });

    $scope.$watch(() => LinguisticService.mode, (newMode) => {
      // console.log("The linguistic.mode service changed---------------------------------");
      vm.linguisticMode = newMode;
    });

    // ─────────── Helpers to set the PDF data ───────────
    function applyBundle(bundle: any) {
      // console.log("inside applyBundle() of PdfController:", bundle);
      if (
        bundle &&
        bundle.mediaFile &&
        bundle.mediaFile.encoding === 'BASE64'
      ) {
        vm.pdfState.pdfData = bundle.mediaFile.data;
        // console.log("PdfController pdfData set to Base64 payload");
      }
    }

   // ─────────── Initialization ───────────
   function init() {
      //console.log("inside init() of PdfController");
      const idx    = DragnDropDataService.getDefaultSession();
      const ddBndl = DragnDropDataService.convertedBundles[idx];

      // 1) rehydrate your annotations array
      vm.annotations = DataService.getData().pdfAnnotations || [];

      if (ddBndl.mediaFile.encoding === 'GETURL') {
        // fetched‑file case: pull the full Base64 bundle
        const fullBndl = LoadedMetaDataService.getCurBndl();
        // console.log("PdfController falling back to fullBndl********************:", fullBndl);
        //console.log("fullBndle.session: ",fullBndl.session);
        applyBundle(fullBndl);

      } else if (ddBndl.mediaFile.encoding === 'BASE64') {
        //console.log("pdf encoding BASE64********************:");
        // drag‑n‑drop case: use the convertedBundles entry directly
        applyBundle(ddBndl);
      }
      
      // **NEW**: if this bundle came from the DB, show the annotation table immediately when the pdf loads
      if (ddBndl.session === "DB") {
        vm.showAnnotationTable = true;
      }  
      
    }

    // ─────────── Listen for loaded bundles ───────────
    $scope.$on('nonAudioBundleLoaded', (_e, args: { bundle: any }) => {
      console.log("PdfController got nonAudioBundleLoaded:", args.bundle);
      applyBundle(args.bundle);
    });
    
    $scope.$on('nonAudioBundleLoaded', init);
    $scope.$on('pdfLoaded', function(e, totalPages) {
      vm.pdfState.totalPages = totalPages;
      if (vm.pdfState.currentPage > totalPages) {
        vm.pdfState.currentPage = totalPages;
      }
    });
    init();
  }
]);