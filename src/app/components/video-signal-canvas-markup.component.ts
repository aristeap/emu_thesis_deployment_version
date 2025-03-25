import * as angular from 'angular';
import styles from '../../styles/EMUwebAppDesign.scss';

let VideoSignalCanvasMarkupComponent = {
  selector: "videoSignalCanvasMarkup",
  template: /*html*/`
    <canvas id="videoWaveformCanvas" 
            class="emuwebapp-timelineCanvasMarkup"
            style="width: calc(100% - 20px); height: 70px; margin-left: 40px;">
    </canvas>
  `,
  bindings: {
    trackName: '<',
    playHeadCurrentSample: '<',
    movingBoundarySample: '<',
    curMouseX: '<',
    curMouseY: '<',
    movingBoundary: '<',
    viewPortSampleStart: '<',
    viewPortSampleEnd: '<',
    viewPortSelectStart: '<',
    viewPortSelectEnd: '<',
    curBndl: '<'
  },
  controller: [
    '$scope',
    '$element',
    'ViewStateService',
    'ConfigProviderService',
    'SsffDataService',
    'DrawHelperService',
    'HistoryService',
    'SoundHandlerService',
    class VideoSignalCanvasMarkupController {
      // Binding properties
      public trackName: any;
      public playHeadCurrentSample: any;
      public movingBoundarySample: any;
      public curMouseX: any;
      public curMouseY: any;
      public movingBoundary: any;
      public viewPortSampleStart: any;
      public viewPortSampleEnd: any;
      public viewPortSelectStart: any;
      public viewPortSelectEnd: any;
      public curBndl: any;

      private $scope;
      private $element;
      private ViewStateService;
      private ConfigProviderService;
      private SsffDataService;
      private DrawHelperService;
      private HistoryService;
      private SoundHandlerService;
      private canvas: HTMLCanvasElement;
      private ctx: CanvasRenderingContext2D;
      private _inited = false;
      private drawCrossHairs = false;
      private cachedWaveform: HTMLImageElement; // <-- Cache for the static waveform
    // Declare a property in your controller
    private redrawScheduled = false;

      constructor(
        $scope, 
        $element, 
        ViewStateService, 
        ConfigProviderService, 
        SsffDataService, 
        DrawHelperService, 
        HistoryService, 
        SoundHandlerService
      ) {
        this.$scope = $scope;
        this.$element = $element;
        this.ViewStateService = ViewStateService;
        this.ConfigProviderService = ConfigProviderService;
        this.SsffDataService = SsffDataService;
        this.DrawHelperService = DrawHelperService;
        this.HistoryService = HistoryService;
        this.SoundHandlerService = SoundHandlerService;
      }

      $postLink() {
        this.canvas = this.$element.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        // Bind mouse events (unchanged)
        this.$element.bind('mousedown', (event) => {
          if (!event.shiftKey) {
            this.ViewStateService.curViewPort.movingS = Math.round(
              this.ViewStateService.getX(event) * this.ViewStateService.getSamplesPerPixelVal(event) +
              this.ViewStateService.curViewPort.sS
            );
            this.ViewStateService.curViewPort.movingE = this.ViewStateService.curViewPort.movingS;
            this.ViewStateService.select(
              this.ViewStateService.curViewPort.movingS,
              this.ViewStateService.curViewPort.movingE
            );
            this.drawMarkup();
            this.$scope.$apply();
          }
        });

        this.$element.bind('mouseup', (event) => {
          if (event.shiftKey) {
            var curSample = Math.round(
              this.ViewStateService.getX(event) * this.ViewStateService.getSamplesPerPixelVal(event) +
              this.ViewStateService.curViewPort.sS
            );
            var selectDist = this.ViewStateService.curViewPort.selectE - this.ViewStateService.curViewPort.selectS;
            if (curSample <= this.ViewStateService.curViewPort.selectS + selectDist / 2) {
              this.ViewStateService.curViewPort.selectS = curSample;
            }
            if (curSample >= this.ViewStateService.curViewPort.selectE - selectDist / 2) {
              this.ViewStateService.curViewPort.selectE = curSample;
            }
            this.drawMarkup();
            this.$scope.$apply();
          }
        });

        this.$element.bind('mousemove', (event) => {
            let mbutton = event.buttons !== undefined ? event.buttons : event.which;
            this.drawCrossHairs = true;
            let mouseX = this.ViewStateService.getX(event);
            this.ViewStateService.curMouseX = mouseX;
            this.ViewStateService.curMouseY = this.ViewStateService.getY(event);
            this.ViewStateService.curMouseTrackName = this.trackName;
            this.ViewStateService.curMousePosSample = Math.round(
              this.ViewStateService.curViewPort.sS +
              (mouseX / this.canvas.width) * (this.ViewStateService.curViewPort.eS - this.ViewStateService.curViewPort.sS)
            );
            if (mbutton === 1) {
              this.setSelectDrag(event);
            }
            
            // Throttle redraws using requestAnimationFrame:
            if (!this.redrawScheduled) {
              this.redrawScheduled = true;
              requestAnimationFrame(() => {
                this.drawMarkup();
                this.redrawScheduled = false;
              });
            }
            
            this.$scope.$apply();
          });
          

        this.$element.bind('mouseleave', () => {
          this.drawCrossHairs = false;
          this.drawMarkup();
        });
      }

      $onChanges(changes) {
        if (this._inited) {
          if (changes.curBndl) {
            this.drawMarkup();
          }
          if (changes.viewPortSampleStart || changes.viewPortSampleEnd ||
              changes.viewPortSelectStart || changes.viewPortSelectEnd ||
              changes.curMouseX || changes.curMouseY || changes.movingBoundarySample) {
            this.drawMarkup();
          }
        }
      }

      $onInit() {
        this._inited = true;
      }

      // Cache the static waveform once
      private cacheWaveform() {
        this.cachedWaveform = new Image();
        this.cachedWaveform.src = this.canvas.toDataURL();
      }

      private drawMarkup() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the cached waveform if available and complete; otherwise, draw and cache it
        if (this.cachedWaveform && this.cachedWaveform.complete) {
          this.ctx.drawImage(this.cachedWaveform, 0, 0, this.canvas.width, this.canvas.height);
        } else {
          // Draw static waveform and then cache it
          this.DrawHelperService.freshRedrawDrawOsciOnCanvas(
            this.canvas,
            0,
            this.SoundHandlerService.audioBuffer.length,
            false // use false to avoid recalculating peaks
          );
          this.cacheWaveform();
        }
      
        // Now overlay the selection markers
        this.DrawHelperService.drawCurViewPortSelected(this.ctx, true);
      
        // Draw crosshairs if enabled
        if (this.drawCrossHairs) {
          this.DrawHelperService.drawCrossHairs(
            this.ctx,
            this.ViewStateService.curMouseX,
            this.ViewStateService.curMouseY,
            undefined,
            undefined,
            '',
            this.trackName
          );
        } else {
          this.DrawHelperService.drawCrossHairX(this.ctx, this.ViewStateService.curMouseX);
        }
      }

      private setSelectDrag(event) {
        let curMouseSample = Math.round(
          this.ViewStateService.getX(event) * this.ViewStateService.getSamplesPerPixelVal(event) +
          this.ViewStateService.curViewPort.sS
        );
        if (curMouseSample > this.ViewStateService.curViewPort.movingS) {
          this.ViewStateService.curViewPort.movingE = curMouseSample;
        } else {
          this.ViewStateService.curViewPort.movingS = curMouseSample;
        }
        this.ViewStateService.select(
          this.ViewStateService.curViewPort.movingS,
          this.ViewStateService.curViewPort.movingE
        );
        this.$scope.$apply();
      }
    }
  ]
};

angular.module('emuwebApp')
.component(VideoSignalCanvasMarkupComponent.selector, VideoSignalCanvasMarkupComponent);

export default VideoSignalCanvasMarkupComponent;
