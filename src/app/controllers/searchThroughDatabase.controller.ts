import * as angular from 'angular';

angular
  .module('emuwebApp').controller('SearchThroughDatabase', [
    '$scope',
    '$http',
    'ModalService',
    'ViewStateService',
    function($scope,$http,ModalService,ViewStateService) {
        const vm = this;
        vm.alphaList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        vm.symbolOptions = [];
        vm.phraseOptions = [];


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
            comment: '',
            engAlpha: '',
            moSymbol: '',
            moPhrase: '',

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

        // immediately fetch our live list of moSymbol,moPhrases values:
        $http.get('http://localhost:3019/api/annotations/image/symbolsAndPhrases')
        .then((resp) => {
            vm.symbolOptions = resp.data.symbols;
            vm.phraseOptions = resp.data.phrases;
            console.log('got image symbol options:', vm.symbolOptions);
        })
        .catch((err) => {
            console.error('could not load image symbol options', err);
        });

    
        //SEARCH BY ANNOTATIONS: FOR IMAGE **************************************************************************************************     
        vm.searchAnnotForImage = () => {
            const params = {
                letter: vm.filters.engAlpha,
                moSymbol: vm.filters.moSymbol,
                moPhrase: vm.filters.moPhrase,
                comment: vm.filters.comment
            };

            // Find exactly which keys have a truthy value
            const activeKeys = Object
                .keys(params)
                .filter(key => !!params[key as keyof typeof params]);

            // console.log("activeKeys: ",activeKeys);
            const activeCount = activeKeys.length; 
            if (activeCount === 0) {
                alert('Please choose one image‐annotation filter');
                return;
            }
            if (activeCount > 1) {
                alert('Pick only one criterion at a time');
                return;
            }

            $http
            .get('http://localhost:3019/api/search/annotations/image', { params })
            .then((resp) => {
                vm.resultsAnnotationsImg = resp.data.results;
                console.log('IMAGE ANNOT SEARCH SUCCESS:', resp.data.results);
            })
            .catch((err) => {
                console.error('Search failed', err);
                alert('Search error: ' + (err.data?.message || err.statusText));
            });

        }
        

    }
  ]);
