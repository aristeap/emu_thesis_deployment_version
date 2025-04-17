import * as angular from 'angular';

angular.module('emuwebApp').controller('RetrieveFromDatabase', [
  '$scope',
  '$http',
  'ModalService',
  'ViewStateService',
  'DbObjLoadSaveService',
  'IoHandlerService',
  'LoadedMetaDataService',
  'DragnDropDataService', 
  'DragnDropService',   
  '$rootScope',
  function($scope, $http, ModalService, ViewStateService, DbObjLoadSaveService, IoHandlerService, LoadedMetaDataService,DragnDropDataService,DragnDropService ,$rootScope) {
    var vm = this;
    vm.files = ModalService.data.files || [];
    vm.selectedFile = null;
    vm.searchTerm = '';

    // Mapping function converts the file metadata from database to a bundle object.
    function mapFileToBundle(fileMetadata) {
      let type: 'IMG'|'PDF'|'VIDEO'|'audio' = fileMetadata.fileType.toLowerCase() === 'pdf'
      ? 'PDF'
      : fileMetadata.fileType.toLowerCase().endsWith('jpg') || fileMetadata.fileType.toLowerCase().endsWith('jpeg')
        ? 'IMG'
        : fileMetadata.fileType.toLowerCase().endsWith('mp4')
          ? 'VIDEO'
          : 'audio';

      const nameWithoutExt = fileMetadata.fileName.replace(/\.[^.]+$/, '');
      
      return {
        name: nameWithoutExt,
        session: "DB",  // Mark this bundle as coming from the database
        mediaFile: {
          encoding: 'GETURL',  // Signal that we need to build a URL and fetch the file
          type: fileMetadata.fileType,  // e.g., "audio"
          data: fileMetadata.gridFSRef  // The GridFS reference identifier, for example: "67ee78a9468d461fc2735381"
        },
        annotation: { levels: [], links: [] }
      };
    }
    
    
    

    vm.cursorInTextField = function() {
      ViewStateService.setEditing(true);
      ViewStateService.setcursorInTextField(true);
      console.log("Input focused");
    };

    vm.cursorOutOfTextField = function() {
      ViewStateService.setEditing(false);
      ViewStateService.setcursorInTextField(false);
      console.log("Input blurred");
    };

    vm.cancel = function() {
      ModalService.close();
    };

    vm.fetchSelected = function() {
      if (!vm.selectedFile) {
        return alert("Please select a file first!");
      }
    
      // 1) build the bundle
      const bundle = mapFileToBundle(vm.selectedFile);
      console.log("Mapped bundle with fetchSelected:", bundle);
    
      // 2) stash it in the drag‑n‑drop data service
      DragnDropDataService.processFetchedBundle(bundle);
    
      // 3) point sessionDefault at that last bundle
      DragnDropDataService.setDefaultSession(
        DragnDropDataService.convertedBundles.length - 1
      );
    
      // 4) update the sidebar list
      let currentList = LoadedMetaDataService.getBundleList() || [];
      const exists = currentList.some(
        b => b.name === bundle.name && b.session === bundle.session
      );
      // if (!exists) {
      //   currentList.push(bundle);
      //   LoadedMetaDataService.setBundleList(currentList);
      // }

      if (!exists) {
        // push only a minimal entry, like the drag‑n‑drop path does
        currentList.push({
          name: bundle.name,
        session: bundle.session
        });

        LoadedMetaDataService.setBundleList(currentList);
      }
    
      // 5) hide the drop‑zone and fire off the same loader as drag‑n‑drop
      ViewStateService.showDropZone = false;
      DragnDropService.handleLocalFiles();
    
      // 6) close the modal
      ModalService.close(vm.selectedFile);
    };

    
    
    
    // vm.fetchSelected = function() {
    //   if (vm.selectedFile) {
    //     // console.log("Fetching file:", vm.selectedFile);
    //     // Build a bundle object using mapFileToBundle()
    //     const bundle = mapFileToBundle(vm.selectedFile);
    //     console.log("Mapped bundle with fetchSelected:", bundle);
        
    //      // Process this bundle as if it were drag-and-dropped.
    //     DragnDropDataService.processFetchedBundle(bundle);

    //     // Retrieve the existing bundle list from LoadedMetaDataService and update it
    //     let currentList = LoadedMetaDataService.getBundleList() || [];
    //     const exists = currentList.some(b => b.name === bundle.name && b.session === bundle.session);
    //     if (!exists) {
    //       console.log("Inside !exists+++++++++++++++++++++++++++++++++++++++++++");
    //       currentList.push(bundle);
    //       LoadedMetaDataService.setBundleList(currentList);
    //       ViewStateService.setState('labeling');


    //     } else {
    //       console.log("Bundle already exists, not adding again.");
    //     }
    //     ViewStateService.showDropZone = false;

    //      // Optionally trigger a digest cycle if needed:
    //     $scope.$evalAsync(function() {
    //       console.log("Updated bundle list:", currentList);
    //     });

    //     console.log("before making the setState loadingSaving");
    //     ViewStateService.setState('loadingSaving');

        
    //     ModalService.close(vm.selectedFile);
    //   } else {
    //     alert("Please select a file first!");
    //   }
    // };
    
    
    
    

    vm.deleteSelected = function() {
      if (vm.selectedFile) {
        if (confirm("Are you sure you want to delete this file?")) {
          $http.delete('http://localhost:3019/delete-file/' + vm.selectedFile.gridFSRef)
            .then(function(response) {
              console.log("File deleted:", response.data);
              alert("File deleted successfully");
              ModalService.close();
            })
            .catch(function(error) {
              console.error("Error deleting file:", error);
              alert("Error deleting file");
            });
        }
      } else {
        alert("Please select a file to delete!");
      }
    };
  }
]);
