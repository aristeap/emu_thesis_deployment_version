import * as angular from 'angular';
import { AuthService, IUser } from '../services/auth.service';


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
  'AuthService',  
  'DataService',
  '$rootScope',
  function($scope, $http, ModalService, ViewStateService, DbObjLoadSaveService, IoHandlerService, LoadedMetaDataService,DragnDropDataService,DragnDropService,AuthService,DataService ,$rootScope) {
    var vm = this;
    vm.files = ModalService.data.files || [];
    vm.selectedFile = null;
    vm.searchTerm = '';
    vm.canDelete ;
    vm.canOpen ;

    

    const u: IUser|null  = AuthService.getUser();
    this.user = u;
    vm.canDelete = !!u && (u.role === 'EY' || u.role === 'programmer') ;
    vm.canOpen = !!u && (u.role === 'researcher' || u.role === 'administrator' || u.role === 'simple');

    

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

    // build bundle object
    const bundle = mapFileToBundle(vm.selectedFile);
    const dbName = 'myEmuDB';  // ← NEW: my EMU-DB folder name



    // ← NEW: try to load existing annotations from disk
    $http.get(`http://localhost:3019/emuDB/${dbName}/${bundle.name}_annot.json`)
      .then(function(resp) {
        bundle.annotation = resp.data;            // ← NEW: use loaded JSON
        // console.log("--------------------------------------------------------------------");
        console.log("bundle: ",bundle);
        // console.log("bundle.annotation: ",bundle.annotation);
      })
      .catch(function() {
        // ← NEW: if no file or error, start with empty annotation
        const defaultRate = bundle.mediaFile.type === 'video' ? 44100 : 20000;

        console.log("before it creates a fallback annotation json");
        const fallback = {
          levels: [],
          links: [],
          sampleRate:  defaultRate,
          pdfAnnotations: [],
          imageAnnotations: [],
          videoAnnotations: []
        }as any;
        bundle.annotation = fallback;

        DataService.setData(bundle.annotation);

      })
      .finally(function() {
        DataService.setData(bundle.annotation);
        $rootScope.$broadcast('annotationChanged');
        
        // ← EXISTING: inject into webapp
        DragnDropDataService.processFetchedBundle(bundle);
        DragnDropDataService.setDefaultSession(
          DragnDropDataService.convertedBundles.length - 1
        );

        // ← EXISTING: update sidebar
        let list = LoadedMetaDataService.getBundleList() || [];
        if (!list.some(b => b.name === bundle.name && b.session === bundle.session)) {
          list.push({ name: bundle.name, session: bundle.session });
          LoadedMetaDataService.setBundleList(list);
        }

        ViewStateService.showDropZone = false;

        // ← EXISTING: auto-load media
        if (bundle.mediaFile.type === 'audio') {
          DragnDropService.handleLocalFiles();
        }
        else if (bundle.mediaFile.type === 'video') {
          DbObjLoadSaveService
            .loadBundle(bundle, '')
            .then(() => {
              DragnDropService.handleLocalFiles();
            })
            .catch(err => {
              console.error("Failed to auto-load fetched bundle:", err);
            });
        }

        // ← EXISTING: close modal
        ModalService.close(vm.selectedFile);
      });
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