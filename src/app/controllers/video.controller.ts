import * as angular from 'angular';

angular.module('emuwebApp')
.controller('VideoController', [
  '$scope', 
  '$rootScope', 
  '$sce', 
  'DragnDropDataService', 
  'SoundHandlerService', 
  'DrawHelperService',
  function($scope, $rootScope, $sce, DragnDropDataService, SoundHandlerService, DrawHelperService) {

    // 'vm' is our controller instance
    var vm = this;
    vm.duration = 0;
    vm.currentTime = 0;

    // Store references so we can use them inside our methods
    vm.SoundHandlerService = SoundHandlerService;
    vm.DrawHelperService = DrawHelperService;

    /**
     * Draw the static waveform using the AudioBuffer from SoundHandlerService.
     * It scales the wave to fill the entire canvas width (from 0..audioBuffer.length).
     */
    vm.drawWaveform = function() {
      // Check if we have an AudioBuffer from the decoded video audio
      if (vm.SoundHandlerService.audioBuffer) {
        const canvasEl = document.getElementById('videoWaveformCanvas') as HTMLCanvasElement;
        if (!canvasEl) {
          console.error("Canvas 'videoWaveformCanvas' not found in the DOM");
          return;
        }

        // Match the internal drawing width/height to the rendered size
        canvasEl.width = canvasEl.offsetWidth;
        canvasEl.height = canvasEl.offsetHeight; // or a fixed 70 if you prefer

        // Draw from sample 0 to the entire audio length
        vm.DrawHelperService.freshRedrawDrawOsciOnCanvas(
          canvasEl,
          0,
          vm.SoundHandlerService.audioBuffer.length,
          true // true for a full redraw
        );

      } else {
        console.warn("No audioBuffer found in SoundHandlerService");
      }
    };
    
    // In your controller, after drawing the waveform once:
    function cacheWaveform() {
      const canvasEl = document.getElementById('videoWaveformCanvas') as HTMLCanvasElement;
      // Create an image object from the current canvas content:
      vm.cachedWaveform = new Image();
      vm.cachedWaveform.src = canvasEl.toDataURL();
    }

    /**
     * Initialize when the user clicks the video bundle in the left panel
     * (triggering nonAudioBundleLoaded) or on first load.
     */
    function init() {
      // Identify which bundle is currently selected
      var currentIndex = DragnDropDataService.getDefaultSession();
      var bundle = DragnDropDataService.convertedBundles[currentIndex];

      // If it's a video file, display the video and wait to draw the waveform
      if (bundle && bundle.mediaFile && bundle.mediaFile.type === 'VIDEO') {
        // Convert the base64 data to a trustable video source
        vm.videoSrc = $sce.trustAsResourceUrl(
          'data:video/mp4;base64,' + bundle.mediaFile.data
        );

        // Delay so Angular has time to render the <video> + <canvas>
        setTimeout(function() {
          var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
          if (videoEl) {
            // Once metadata is loaded, we know the <video> is ready
            videoEl.onloadedmetadata = function() {
              $scope.$apply(function() {
                vm.duration = videoEl.duration;
              });
              // Now draw the static waveform
              vm.drawWaveform();
            };

            // Track the currentTime so we can display it in the UI
            videoEl.ontimeupdate = function() {
              $scope.$apply(function() {
                vm.currentTime = videoEl.currentTime;
                console.log("Video Time updated: ", vm.currentTime);
              });
            };
          }
        }, 100);
      }
    }

    // Basic controls for the video element
    vm.play = function() {
      var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
      if (videoEl) {
        videoEl.play();
      }
    };
    vm.pause = function() {
      var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
      if (videoEl) {
        videoEl.pause();
      }
    };
    vm.stop = function() {
      var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }
    };
    vm.seek = function() {
      var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
      if (videoEl) {
        videoEl.currentTime = Number(vm.currentTime) || 0;
        console.log("Seeking to:", videoEl.currentTime);
      }
    };

    // Listen for event from drag-n-drop or when a new non-audio bundle is loaded
    $scope.$on('nonAudioBundleLoaded', init);

    // Also call on first load
    init();
  }
]);
