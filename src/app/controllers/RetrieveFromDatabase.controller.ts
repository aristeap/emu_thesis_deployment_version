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
    
      // build + stash the bundle
      const bundle = mapFileToBundle(vm.selectedFile);
      DragnDropDataService.processFetchedBundle(bundle);
      DragnDropDataService.setDefaultSession(
        DragnDropDataService.convertedBundles.length - 1
      );
    
      // update sidebar (minimal entry)
      let list = LoadedMetaDataService.getBundleList() || [];
      if (!list.some(b => b.name === bundle.name && b.session === bundle.session)) {
        list.push({ name: bundle.name, session: bundle.session });
        LoadedMetaDataService.setBundleList(list);
      }
    
      ViewStateService.showDropZone = false;
    
      // **only** auto-load audio:
      if (bundle.mediaFile.type === 'audio') {
        DragnDropService.handleLocalFiles();
      }
      else if (bundle.mediaFile.type === 'video') {
        console.log("from inside the retrieveFromDatabase controller for the video, that calls the loadBundle");
        DbObjLoadSaveService
        .loadBundle(bundle, '')
        .then(() => {
          // once loaded & broadcast, your Image/PDF/Video controllers will pick it up
        })
        .catch(err => {
          console.error("Failed to auto‑load fetched bundle:", err);
        });
      }
    







      ModalService.close(vm.selectedFile);
    };
    
    
    

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