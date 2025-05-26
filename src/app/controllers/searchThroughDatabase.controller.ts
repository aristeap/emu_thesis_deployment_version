import * as angular from 'angular';

angular
  .module('emuwebApp').controller('SearchThroughDatabase', [
    '$scope',
    '$http',
    'ModalService',
    'ViewStateService',
    function($scope,$http,ModalService,ViewStateService) {
        const vm = this;

        //if we didnt have added this and just kept the ng-model="vm.filters.fileType" and ng-disabled="vm.filters.fileType==='image"
        // the <select ng-model="vm.filters.fileType"> won’t actually write anything, and i’ll get undefined everywhere.
        vm.filters ={
            fileType: 'wav/video',
            date: null,
            location: '',
            genre : '',
            corpusType : '',
            source : '',
            level: '',
            embodiedAction: '',
            label: '',
            word: '',
            pos: '',
            ner: '',
            sa: '',
            comment: ''

        };

        vm.cursorInTextField = function (){
            ViewStateService.setEditing(true);
            ViewStateService.setcursorInTextField(true);
        };

        vm.cursorOutOfTextField = function() {
            ViewStateService.setEditing(false);
            ViewStateService.setcursorInTextField(false);
        };

        vm.cancel = () => ModalService.close();

        //SEARCH BY METADATA**************************************************************************************************
        vm.search = () => {
           // Turn the Date object into exactly "YYYY-MM-DD" (no timezone shift)
            const raw = (document.getElementById('Date') as HTMLInputElement).value;

            //we pull the five fields the user is inputing,into the params object
            const params = {
                fileType: vm.filters.fileType,
                date:     raw,
                location: vm.filters.location,
                genre:    vm.filters.genre,
                corpusType: vm.filters.corpusType,
                source:      vm.filters.source
            };

            $http.get('http://localhost:3019/api/search', { params })
            .then((resp) => {
                vm.resultsMetadata = resp.data.results;  //save for the tile, so we can show it at the html
                // resp.data.results is your array of Recordings
                console.log("SEARCH SUCCESS: ",resp.data.results);

            })
            .catch((err) => {
                console.error('Search failed', err);
                alert('Search error: ' + (err.data?.message || err.statusText));
            });


        }


        //SEARCH BY ANNOTATIONS: FOR RECORDING **************************************************************************************************
        vm.searchAnnotForRecording = () =>{
            const params = {
                fileType: vm.filters.fileType,
                level: vm.filters.level,
                embodiedAction: vm.filters.embodiedAction,
                label: vm.filters.label
            }

            $http.get('http://localhost:3019/api/search/annotations/recordings', { params })
            .then((resp) => {
                vm.resultsAnnotations = resp.data.results;  //save for the tile, so we can show it at the html
                // resp.data.results is your array of Recordings
                console.log("ANNOTATIONS SEARCH SUCCESS: ",resp.data.results);

            })
            .catch((err) => {
                console.error('Search failed', err);
                alert('Search error: ' + (err.data?.message || err.statusText));
            });
        }


        //SEARCH BY ANNOTATIONS: FOR PDF **************************************************************************************************     
        vm.searchAnnotForPdf = () =>{
            const params = {
                fileType: 'pdf',
                word:      vm.filters.word,
                pos:       vm.filters.pos,         //it will come out as ["verb","adjective",..]
                ner:       vm.filters.ner,
                sa:        vm.filters.sa,
                comment:   vm.filters.comment 
            }
            console.log("vm.filters.word: ",params.word);
            console.log("vm.filters.pos: ",params.pos);
            console.log("vm.filters.ner: ",params.ner);
            console.log("vm.filters.sa: ",params.sa);



             $http.get('http://localhost:3019/api/search/annotations/pdf', { params })
            .then((resp) => {
                vm.resultsAnnotationsPdf = resp.data.results;  //save for the tile, so we can show it at the html
                // resp.data.results is your array of Recordings
                console.log("ANNOTATIONS SEARCH SUCCESS: ",resp.data.results);

            })
            .catch((err) => {
                console.error('Search failed', err);
                alert('Search error: ' + (err.data?.message || err.statusText));
            });
            
        } 

    }
  ]);
