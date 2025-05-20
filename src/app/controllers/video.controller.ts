import * as angular from 'angular';

angular.module('emuwebApp')
.controller('VideoController', [
  '$scope', 
  '$rootScope', 
  '$sce', 
  '$window',
  'DragnDropDataService', 
  'SoundHandlerService', 
  'DrawHelperService',
  'ViewStateService',
  'LevelService',
  'LoadedMetaDataService',
  function(
    $scope, 
    $rootScope, 
    $sce, 
    $window,
    DragnDropDataService, 
    SoundHandlerService, 
    DrawHelperService, 
    ViewStateService, 
    LevelService,
    LoadedMetaDataService
  ) {
      var vm: any = this;
      vm.duration = 0;
      vm.currentTime = 0;
      vm.SoundHandlerService = SoundHandlerService;
      vm.DrawHelperService = DrawHelperService;
      vm.ViewStateService = ViewStateService;
      vm.LevelService = LevelService;
      
      // Canvas references and contexts.
      vm.bgCanvas = null;       // For static waveform.
      vm.overlayCanvas = null;  // For dynamic elements (progress, crosshair, selection, marker).
      vm.bgCtx = null;
      vm.overlayCtx = null;

      // For the white marker line placed on click.
      vm.markerX = null;
      vm.markerSample = null;

      // Utility: Set canvas internal dimensions to match CSS size.
      function matchCanvasSize(canvas: HTMLCanvasElement) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      // Draw the static waveform on the background canvas.
      vm.drawWaveformBg = function() {
        // console.log("inside the drawWaveformBg--------------");
        vm.bgCanvas = document.getElementById('videoWaveformBgCanvas') as HTMLCanvasElement;
        if (!vm.bgCanvas) {
          console.error("Canvas 'videoWaveformBgCanvas' not found in the DOM");
          return;
        }
        matchCanvasSize(vm.bgCanvas);
        vm.bgCtx = vm.bgCanvas.getContext('2d');
        
        if (vm.SoundHandlerService.audioBuffer) {
          var startSample = ViewStateService.curViewPort.sS;
          var endSample = ViewStateService.curViewPort.eS;
          vm.DrawHelperService.freshRedrawDrawOsciOnCanvas(
            vm.bgCanvas,
            startSample,
            endSample,
            true
          );
        } else {
          console.warn("No audioBuffer found in SoundHandlerService");
        }
      };

      // Update the overlay canvas: draw video progress, playhead, drag selection,
      // the red crosshair with coordinates, and any white marker line.
      vm.updateWaveformOverlay = function() {
        vm.overlayCanvas = document.getElementById('videoWaveformOverlayCanvas') as HTMLCanvasElement;
        if (!vm.overlayCanvas) {
          console.error("Canvas 'videoWaveformOverlayCanvas' not found in the DOM");
          return;
        }
        matchCanvasSize(vm.overlayCanvas);
        vm.overlayCtx = vm.overlayCanvas.getContext('2d');
        vm.overlayCtx.clearRect(0, 0, vm.overlayCanvas.width, vm.overlayCanvas.height);

        // 1. Draw the video progress overlay (light-grey rectangle).
        if (vm.currentTime !== undefined && vm.duration > 0) {
          var progress = vm.currentTime / vm.duration;
          var progressWidth = progress * vm.overlayCanvas.width;
          vm.overlayCtx.fillStyle = "rgba(200, 200, 200, 0.5)";
          vm.overlayCtx.fillRect(0, 0, progressWidth, vm.overlayCanvas.height);
        }

        // 2. Draw the playhead (red line) via your DrawHelperService.
        vm.DrawHelperService.drawPlayHead(vm.overlayCtx);

        // 3. Draw the drag-selection overlay if a selection exists.
        if (ViewStateService.curViewPort.selectS >= 0 &&
            ViewStateService.curViewPort.selectE > ViewStateService.curViewPort.selectS) {
          var totalSamples = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
          var selectStartX = ((ViewStateService.curViewPort.selectS - ViewStateService.curViewPort.sS) / totalSamples) * vm.overlayCanvas.width;
          var selectEndX = ((ViewStateService.curViewPort.selectE - ViewStateService.curViewPort.sS) / totalSamples) * vm.overlayCanvas.width;
          vm.overlayCtx.fillStyle = "rgba(100, 100, 255, 0.3)"; // selection color.
          vm.overlayCtx.fillRect(selectStartX, 0, selectEndX - selectStartX, vm.overlayCanvas.height);
        }

        // 4. Draw the red crosshair (following the mouse) with coordinate text.
        if (ViewStateService.curMouseX !== undefined) {
          vm.overlayCtx.strokeStyle = "red";
          vm.overlayCtx.beginPath();
          vm.overlayCtx.moveTo(ViewStateService.curMouseX, 0);
          vm.overlayCtx.lineTo(ViewStateService.curMouseX, vm.overlayCanvas.height);
          vm.overlayCtx.stroke();

          // Compute sample coordinate from mouse position.
          var totalSamples = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
          var sampleAtMouse = Math.round((ViewStateService.curMouseX / vm.overlayCanvas.width) * totalSamples + ViewStateService.curViewPort.sS);
          vm.overlayCtx.fillStyle = "red";
          vm.overlayCtx.font = "12px sans-serif";
          vm.overlayCtx.fillText("Sample: " + sampleAtMouse, ViewStateService.curMouseX + 2, 12);
        }

        // 5. Draw the white marker (placed on click) with its coordinate.
        if (vm.markerX !== null) {
          vm.overlayCtx.strokeStyle = "white";
          vm.overlayCtx.beginPath();
          vm.overlayCtx.moveTo(vm.markerX, 0);
          vm.overlayCtx.lineTo(vm.markerX, vm.overlayCanvas.height);
          vm.overlayCtx.stroke();
          vm.overlayCtx.fillStyle = "white";
          vm.overlayCtx.font = "12px sans-serif";
          vm.overlayCtx.fillText("Sample: " + vm.markerSample, vm.markerX + 2, 24);
        }
      };


      vm.panLeft = function() {
        // Calculate a delta: 10% of the current viewport width
        var currentWidth = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
        var delta = currentWidth * 0.1;
        
        // Compute new viewport boundaries ensuring start doesn't go below 0
        var newStart = Math.max(ViewStateService.curViewPort.sS - delta, 0);
        var newEnd = newStart + currentWidth;
        
        // Update the viewport
        ViewStateService.setViewPort(newStart, newEnd);
        
        // Redraw the waveform background and overlay
        vm.drawWaveformBg();
        vm.updateWaveformOverlay();
      };
      
      vm.panRight = function() {
        var currentWidth = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
        var delta = currentWidth * 0.1;
        
        // Ensure newEnd doesn't exceed the media length
        var maxSample = SoundHandlerService.audioBuffer.length;
        var newEnd = Math.min(ViewStateService.curViewPort.eS + delta, maxSample);
        var newStart = newEnd - currentWidth;
        
        ViewStateService.setViewPort(newStart, newEnd);
        
        vm.drawWaveformBg();
        vm.updateWaveformOverlay();
      };
      
      // Attach drag-and-choose plus crosshair and marker event handlers to the overlay canvas.
      function addDragChooseHandlers() {
        // Ensure overlayCanvas is available.
        if (!vm.overlayCanvas) {
          vm.overlayCanvas = document.getElementById('videoWaveformOverlayCanvas') as HTMLCanvasElement;
          if (!vm.overlayCanvas) return;
        }
        
        // Add event listeners (ensure you don't add duplicates if already attached)
        vm.overlayCanvas.addEventListener('mousedown', function(event: MouseEvent) {
          var rect = vm.overlayCanvas.getBoundingClientRect();
          var x = event.clientX - rect.left;
          var totalSamples = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
          var sample = Math.round((x / vm.overlayCanvas.width) * totalSamples + ViewStateService.curViewPort.sS);
          if (!event.shiftKey) {
            // Start a new selection.
            ViewStateService.curViewPort.movingS = sample;
            ViewStateService.curViewPort.movingE = sample;
            ViewStateService.select(sample, sample);
            // Set the white marker.
            vm.markerX = x;
            vm.markerSample = sample;
          }
          vm.updateWaveformOverlay();
        });
      
        vm.overlayCanvas.addEventListener('mousemove', function(event: MouseEvent) {
          var rect = vm.overlayCanvas.getBoundingClientRect();
          var x = event.clientX - rect.left;
          ViewStateService.curMouseX = x;
          var totalSamples = ViewStateService.curViewPort.eS - ViewStateService.curViewPort.sS;
          var sample = Math.round((x / vm.overlayCanvas.width) * totalSamples + ViewStateService.curViewPort.sS);
          ViewStateService.curMousePosSample = sample;
          if (event.buttons === 1) {
            if (sample > ViewStateService.curViewPort.movingS) {
              ViewStateService.curViewPort.movingE = sample;
            } else {
              ViewStateService.curViewPort.movingS = sample;
            }
            ViewStateService.select(ViewStateService.curViewPort.movingS, ViewStateService.curViewPort.movingE);
          }
          vm.updateWaveformOverlay();
        });
      
        vm.overlayCanvas.addEventListener('mouseup', function(event: MouseEvent) {
          vm.updateWaveformOverlay();
        });
      
        vm.overlayCanvas.addEventListener('mouseleave', function(event: MouseEvent) {
          ViewStateService.curMouseX = undefined;
          vm.updateWaveformOverlay();
        });
      }
      

      // Video playback controls.
      vm.play = function() {
        console.log("inside play function");
        var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
        if (videoEl) {
          SoundHandlerService.isPlaying = true;
          videoEl.play();
          if (SoundHandlerService.audioBuffer) {
            ViewStateService.animatePlayHead(0, SoundHandlerService.audioBuffer.length);
          } else {
            console.warn("No audioBuffer found in SoundHandlerService");
          }
        }
      };

      vm.pause = function() {
        var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
        if (videoEl) {
          videoEl.pause();
          SoundHandlerService.isPlaying = false;
        }
      };
      
      vm.playSelection = function() {
        var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
        if (!videoEl) return;
        
        if (!vm.SoundHandlerService.audioBuffer) {
          console.warn("No audioBuffer available for sample rate conversion.");
          return;
        }
        
        var sampleRate = vm.SoundHandlerService.audioBuffer.sampleRate;
        var selectS = ViewStateService.curViewPort.selectS;
        var selectE = ViewStateService.curViewPort.selectE;
        
        if (selectS < 0 || selectE <= selectS) {
          console.warn("No valid selection defined.");
          return;
        }
        
        var startTime = selectS / sampleRate;
        var endTime = selectE / sampleRate;
        
        videoEl.currentTime = startTime;
        videoEl.play();
        
        var onTimeUpdate = function() {
          if (videoEl.currentTime >= endTime) {
            videoEl.pause();
            videoEl.removeEventListener('timeupdate', onTimeUpdate);
          }
        };
        
        videoEl.addEventListener('timeupdate', onTimeUpdate);
      };
      

      vm.zoomIn = function() {
        if (ViewStateService.getPermission('zoom')) {
          vm.LevelService.deleteEditArea();
          ViewStateService.zoomViewPort(true, vm.LevelService);
          requestAnimationFrame(function() {
            vm.drawWaveformBg();
            vm.updateWaveformOverlay();
            addDragChooseHandlers();
          });
          console.log("Zoom in triggered; new viewport:", ViewStateService.curViewPort);
        } else {
          console.log("Zoom action not permitted");
        }
      };

      vm.zoomOut = function() {
        if (ViewStateService.getPermission('zoom')) {
          vm.LevelService.deleteEditArea();
          ViewStateService.zoomViewPort(false, vm.LevelService);
          requestAnimationFrame(function() {
            vm.drawWaveformBg();
            vm.updateWaveformOverlay();
            addDragChooseHandlers();
          });
          console.log("Zoom out triggered; new viewport:", ViewStateService.curViewPort);
        } else {
          console.log("Zoom action not permitted");
        }
      };

      vm.seek = function() {
        var videoEl = document.getElementById('myVideo') as HTMLVideoElement;
        if (videoEl) {
          videoEl.currentTime = Number(vm.currentTime) || 0;
        }
      };




      function pickBundle(drBndl: any) {
        if (drBndl.mediaFile.encoding === 'GETURL') {
          return LoadedMetaDataService.getCurBndl();
        }
        return drBndl;
      }


      // After all your other init wrangling, add:
      function onResize() {
        vm.drawWaveformBg();
        vm.updateWaveformOverlay();
      }

       // ─────────── Initialization ───────────
      function init() {
        // 1) grab stub or full from DnD service
        const idx    = DragnDropDataService.getDefaultSession();
        const stub   = DragnDropDataService.convertedBundles[idx];
        const bundle = pickBundle(stub);

        // 2) only proceed if it’s really a BASE64 video payload
        if (
          bundle &&
          bundle.mediaFile &&
          bundle.mediaFile.encoding === 'BASE64' &&
          (
            bundle.mediaFile.type.toLowerCase() === 'video' ||
            bundle.mediaFile.type.toLowerCase().startsWith('video/')
          )
        ) {
          vm.isVideo = true;
          $rootScope.isVideo = true;

          // 3) wire up the <video> element
          vm.videoSrc = $sce.trustAsResourceUrl(
            'data:video/mp4;base64,' + bundle.mediaFile.data
          );

          // 4) once metadata is ready, draw & wire up everything
          setTimeout(() => {
            const videoEl = document.getElementById('myVideo') as HTMLVideoElement;
            if (!videoEl) return;

            videoEl.onloadedmetadata = () => {
              // store duration
              $scope.$apply(() => vm.duration = videoEl.duration);

              // draw static waveform
              vm.drawWaveformBg();

              // attach overlay handlers & initial overlay draw
              vm.overlayCanvas = document.getElementById(
                'videoWaveformOverlayCanvas'
              ) as HTMLCanvasElement;
              if (vm.overlayCanvas) {
                addDragChooseHandlers();
                vm.updateWaveformOverlay();
              }

              // ✨ NEW: on any window resize, re-draw everything _and_ force levels to redraw
              const onResize = () => {
                vm.drawWaveformBg();
                vm.updateWaveformOverlay();
                addDragChooseHandlers();

                // poke the level‐canvas components to redraw
                const { sS, eS } = ViewStateService.curViewPort;
                ViewStateService.setViewPort(sS, eS);
              };
              window.addEventListener('resize', onResize);
              $scope.$on('$destroy', () => {
                window.removeEventListener('resize', onResize);
              });
            };

            // update overlay on each timeupdate
            videoEl.ontimeupdate = () => {
              $scope.$apply(() => vm.currentTime = videoEl.currentTime);
              vm.updateWaveformOverlay();
            };
          }, 100);
        }
      }


      


      $scope.$on('nonAudioBundleLoaded', init);
      init();


  }



]);