import * as angular from 'angular';

let LevelCanvasMarkupCanvasComponent = {
    selector: "levelCanvasMarkupCanvas",
    template: /*html*/`
    <canvas 
        class="emuwebapp-level-markup" 
        id="levelMarkupCanvas" 
        width="4096" 
        height="256">
    </canvas>
    <div class="context-menu-items" ng-show="$ctrl.showContextMenu" style="top: {{$ctrl.contextMenuY}}px; left: {{$ctrl.contextMenuX}}px;">
        <ul>
            <!-- For adding a SPEAKER -->
            <li ng-if="$ctrl.level.role === 'speaker'" ng-click="$ctrl.addItem()">
                Add annotation for Speaker
            </li>
              <!-- For deleting an item -->
            <li ng-if="$ctrl.level.role === 'speaker'" ng-click="$ctrl.deleteItem()">
                Delete annotation for Speaker
            </li>
            <!-- For deleting the entire level/tier -->
            <li ng-if="$ctrl.level.role === 'speaker'" ng-click="$ctrl.deleteLevel()">
                Delete Speaker
            </li>

           <!-- For embodied:---------------------------------------------------------------------------------------------->
           <div>
                <ul style="margin: 0; padding: 0; list-style: none;">
                    <!-- Main option: Add action -->
                    <li ng-if="$ctrl.level.role === 'embodied'" style="position: relative; margin: 10; padding: 0;">
                        <span ng-click="$ctrl.toggleAddActionSubmenu()">
                            Add action <span class="arrow" style="margin-left: 5px; font-weight: bold;">&#9654;</span>
                        </span>
                        <!-- First-level submenu for Add action -->
                        <ul class="embodied-submenu" ng-show="$ctrl.showAddActionSubmenu"  ng-class="{'submenu-left': $ctrl.useSubmenuLeft}">
                            <!-- Head Movement category -->
                            <li style="position: relative; margin: 5px 0; padding: 0;">
                                <span ng-click="$ctrl.toggleSubmenu('headMovement')">
                                    Head Movement <span class="arrow" style="margin-left: 5px; font-weight: bold;">&#9654;</span>
                                </span>
                                <!-- Second-level submenu for Head Movement -->
                                <ul class="embodied-submenu-2" ng-show="$ctrl.showHeadMovementSubmenu"  ng-class="{'submenu-left': $ctrl.useSubmenuLeft}">
                                    <li ng-click="$ctrl.selectEmbodiedAction('Nod Up-Down')">Nod Up-Down</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Shake Side-to-Side')">Shake Side-to-Side</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Tilt Head Left')">Tilt Head Left</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Tilt Head Right')">Tilt Head Right</li>
                                </ul>
                            </li>
                            <!-- Facial Expression category -->
                            <li style="position: relative; margin: 5px 0; padding: 0;">
                                <span ng-click="$ctrl.toggleSubmenu('facialExpression')">
                                    Facial Expression <span class="arrow" style="margin-left: 5px; font-weight: bold;">&#9654;</span>
                                </span>
                                <!-- Second-level submenu for Facial Expression -->
                                <ul class="embodied-submenu-2" ng-show="$ctrl.showFacialExpressionSubmenu"  ng-class="{'submenu-left': $ctrl.useSubmenuLeft}">
                                    <li ng-click="$ctrl.selectEmbodiedAction('Raised Eyebrows')">Raised Eyebrows</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Frown')">Frown</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Smile')">Smile</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Squint/Narrowed Eyes')">Squint/Narrowed Eyes</li>
                                </ul>
                            </li>
                            <!-- Hand Gesture category -->
                            <li style="position: relative; margin: 5px 0; padding: 0;">
                                <span ng-click="$ctrl.toggleSubmenu('handGesture')">
                                    Hand Gesture <span class="arrow" style="margin-left: 5px; font-weight: bold;">&#9654;</span>
                                </span>
                                <!-- Second-level submenu for Hand Gesture -->
                                <ul class="embodied-submenu-2" ng-show="$ctrl.showHandGestureSubmenu"  ng-class="{'submenu-left': $ctrl.useSubmenuLeft}">
                                    <li ng-click="$ctrl.selectEmbodiedAction('Open Palm')">Open Palm</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Closed Fist')">Closed Fist</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Pointing')">Pointing</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Circular Gesture')">Circular Gesture</li>
                                </ul>
                            </li>
                            <!-- Body Posture category -->
                            <li style="position: relative; margin: 5px 0; padding: 0;">
                                <span ng-click="$ctrl.toggleSubmenu('bodyPosture')">
                                    Body Posture <span class="arrow" style="margin-left: 5px; font-weight: bold;">&#9654;</span>
                                </span>
                                <!-- Second-level submenu for Body Posture -->
                                <ul class="embodied-submenu-2" ng-show="$ctrl.showBodyPostureSubmenu"  ng-class="{'submenu-left': $ctrl.useSubmenuLeft}">
                                    <li ng-click="$ctrl.selectEmbodiedAction('Lean Forward')">Lean Forward</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Lean Backward')">Lean Backward</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Shoulder Shrug')">Shoulder Shrug</li>
                                    <li ng-click="$ctrl.selectEmbodiedAction('Torso Twist')">Torso Twist</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    
                    <!-- Other context menu options -->
                    <li ng-if="$ctrl.level.role === 'embodied'" ng-click="$ctrl.deleteItem()">
                        Delete action on level
                    </li>
                    <li ng-if="$ctrl.level.role === 'embodied'" ng-click="$ctrl.deleteLevel()">
                        Delete the level
                    </li>
                </ul>
            </div>


            <!-- For adding a LEVEL -->
            <li ng-if="$ctrl.level.role !== 'speaker' && $ctrl.level.role !== 'embodied'"  ng-click="$ctrl.addItem()">
                Add Item on level
            </li>
            <li ng-if="$ctrl.level.role !== 'speaker' && $ctrl.level.role !== 'embodied'" ng-click="$ctrl.deleteItem()">
                Delete Item on level
            </li>
            <li ng-if="$ctrl.level.role !== 'speaker' && $ctrl.level.role !== 'embodied'" ng-click="$ctrl.deleteLevel()">
                Delete the level
            </li>

        </ul>
    </div>

    `,
    bindings: {
        level: '<',
        idx: '<'
    },
    controller: [
        '$scope', 
        '$element', 
        '$timeout', 
        '$rootScope',           // <-- add it here
        'ViewStateService', 
        'SoundHandlerService', 
        'ConfigProviderService', 
        'LevelService', 
        'HistoryService',
        'AuthService',
        class LevelCanvasMarkupCanvasController{
        private $scope;
        private $element;
        private $timeout; // Add $timeout here
        private $rootScope;      // <-- add this
 
        private ViewStateService;
        private SoundHandlerService;
        private ConfigProviderService;
        private LevelService;
        private HistoryService;
        private AuthService;

        // bindings
        private level;
        private idx;

        private lastEventClick;
        private lastEventMove;
        private lastNeighboursMove;
        private lastPCM;
        private curMouseSampleNrInView;

        private showContextMenu: boolean;
        private contextMenuX: number;
        private contextMenuY: number;

        private lastRightClickSample: number;

       // Declare flags for each submenu level
        private showAddActionSubmenu: boolean = false;
        private showHeadMovementSubmenu: boolean = false;
        private showFacialExpressionSubmenu: boolean = false;
        private showHandGestureSubmenu: boolean = false;
        private showBodyPostureSubmenu: boolean = false;
        private useSubmenuLeft: boolean = false;


        constructor(
            $scope, 
            $element, 
            $timeout, // Add $timeout here
            $rootScope,        // <-- add this
            ViewStateService, 
            SoundHandlerService, 
            ConfigProviderService, 
            LevelService, 
            HistoryService,
            AuthService,
            ){
            this.$scope = $scope;
            this.$element = $element;
            this.$timeout = $timeout; // Initialize $timeout
            this.$rootScope = $rootScope; 

            this.ViewStateService = ViewStateService; 
            this.SoundHandlerService = SoundHandlerService;
            this.ConfigProviderService = ConfigProviderService;
            this.LevelService = LevelService;
            this.HistoryService = HistoryService;
            this.AuthService = AuthService;

            this.lastEventClick = undefined;
            this.lastEventMove = undefined;
            this.lastNeighboursMove = undefined;
            this.lastPCM = undefined;
            this.curMouseSampleNrInView = undefined;

            this.showContextMenu = false;
            this.contextMenuX = 0;
            this.contextMenuY = 0;

            this.lastRightClickSample = 0;

        };

        $postLink(){
            // console.log("inside level-canvas-markup-canvas.component.ts-> $postLink()");
            
            ///////////////
            // bindings
            const canvas = this.$element.find('canvas')[0];

            this.$element.bind('contextmenu', (event) => {
                //  console.log("Inside context menu------------------------------------------------");
                // console.log('contextmenu event on:', event.target);

                event.preventDefault();
                event.stopPropagation();
            });
            //
            this.$element.bind('click', (event) => {
                let target = angular.element(event.target);
                // Check if the click target is within an element with class "embodied-submenu" or "embodied-submenu-2" or "arrow"
                if (target.closest('.embodied-submenu').length > 0 || 
                    target.closest('.embodied-submenu-2').length > 0 ||
                    target.closest('.arrow').length > 0) {
                  // Do nothing so that the submenu toggling is not interrupted.
                  return;
                }
                
                // Otherwise, close the context menu and reset submenu flags.
                this.showContextMenu = false;
                this.showAddActionSubmenu = false;
                this.showHeadMovementSubmenu = false;
                this.showFacialExpressionSubmenu = false;
                this.showHandGestureSubmenu = false;
                this.showBodyPostureSubmenu = false;
                this.setLastMove(event, true);
                this.setLastClick(event);
            });
              
                          
            this.$element.bind('dblclick', (event) => {
                console.log("the dblclick has been clicked");

                const u        = this.AuthService.getUser();
                const origin   = this.AuthService.getFileOrigin();
                const isPriv   = u && (u.role === 'administrator' || u.role === 'researcher');
                const isSdrag  = u && u.role === 'simple' && origin === 'drag-n-droped';
                if (!(isPriv || isSdrag)) {
                    // simple user on a fetched-from-DB file: don’t even fire the normal double-click logic
                    return;
                }


                this.setLastMove(event, true);
                // If in video mode (using $root.isVideo), force open the edit area.
                if (this.$rootScope.isVideo) {
                    // console.log("inside rootScope.isVideo");
                  this.setLastDblClick(event);
                } else {
                  // Otherwise, follow the original behavior.
                  if (this.ConfigProviderService.vals.restrictions.editItemName) {
                    this.setLastDblClick(event);
                  } else {
                    this.setLastClick(event);
                  }
                }
            });
              
            
            this.$element.bind('mousemove', (event) => {
                // console.log("inside level-canvas-markup-canvas.component.ts-> bind(mousemove event)");

                 const buf = this.SoundHandlerService.audioBuffer;
                // if no audio loaded yet, bail out immediately
                if (!buf || typeof buf.length !== 'number') {
                    return;
                }

                var moveLine, moveBy;
                if (this.ViewStateService.focusOnEmuWebApp) {
                    if (!this.ViewStateService.getdragBarActive()) {
                        moveLine = true;
                        var samplesPerPixel = this.ViewStateService.getSamplesPerPixelVal(event);
                        this.curMouseSampleNrInView = this.ViewStateService.getX(event) * samplesPerPixel;
                        moveBy = (this.curMouseSampleNrInView - this.lastPCM);
                        if (samplesPerPixel <= 1) {
                            var zoomEventMove = this.LevelService.getClosestItem(this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS, this.level.name, this.SoundHandlerService.audioBuffer.length);
                            // absolute movement in pcm below 1 pcm per pixel
                            if (this.level.type === 'SEGMENT') {
                                if (zoomEventMove.isFirst === true && zoomEventMove.isLast === false) { // before first elem
                                    moveBy = Math.ceil((this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS) - this.LevelService.getItemDetails(this.level.name, 0).sampleStart);
                                } else if (zoomEventMove.isFirst === false && zoomEventMove.isLast === true) { // after last elem
                                    var lastItem = this.LevelService.getLastItem(this.level.name);
                                    moveBy = Math.ceil((this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS) - lastItem.sampleStart - lastItem.sampleDur);
                                } else {
                                    moveBy = Math.ceil((this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS) - this.LevelService.getItemFromLevelById(this.level.name, zoomEventMove.nearest.id).sampleStart);
                                }
                            } else {
                                moveBy = Math.ceil((this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS) - this.LevelService.getItemFromLevelById(this.level.name, zoomEventMove.nearest.id).samplePoint - 0.5); // 0.5 to break between samples not on
                            }
                        } else {
                            // relative movement in pcm above 1 pcm per pixel
                            moveBy = Math.round(this.curMouseSampleNrInView - this.lastPCM);
                        }
                    }

                    var mbutton = 0;
                    if (event.buttons === undefined) {
                        mbutton = event.which;
                    } else {
                        mbutton = event.buttons;
                    }
                    switch (mbutton) {
                        case 1:
                            //console.log('Left mouse button pressed');
                            break;
                        case 2:
                            //console.log('Middle mouse button pressed');
                            break;
                        case 3:
                            //console.log('Right mouse button pressed');
                            break;
                        default:
                            if (!this.ViewStateService.getdragBarActive()) {
                                var curMouseItem = this.ViewStateService.getcurMouseItem();
                                var seg;
                                if (this.ConfigProviderService.vals.restrictions.editItemSize && event.shiftKey) {
                                    this.LevelService.deleteEditArea();
                                    if (curMouseItem !== undefined) {
                                        this.ViewStateService.movingBoundary = true;
                                        if (this.level.type === 'SEGMENT') {
                                            if (this.ViewStateService.getcurMouseisFirst() || this.ViewStateService.getcurMouseisLast()) {
                                                // before first segment
                                                if (this.ViewStateService.getcurMouseisFirst()) {
                                                    seg = this.LevelService.getItemDetails(this.level.name, 0);
                                                    this.ViewStateService.movingBoundarySample = seg.sampleStart + moveBy;
                                                } else if (this.ViewStateService.getcurMouseisLast()) {
                                                    seg = this.LevelService.getLastItem(this.level.name);
                                                    this.ViewStateService.movingBoundarySample = seg.sampleStart + seg.sampleDur + moveBy;
                                                }
                                            } else {
                                                this.ViewStateService.movingBoundarySample = curMouseItem.sampleStart + moveBy;
                                                seg = curMouseItem;
                                            }
                                            this.LevelService.moveBoundary(this.level.name, seg.id, moveBy, this.ViewStateService.getcurMouseisFirst(), this.ViewStateService.getcurMouseisLast());
                                            this.HistoryService.updateCurChangeObj({
                                                'type': 'ANNOT',
                                                'action': 'MOVEBOUNDARY',
                                                'name': this.level.name,
                                                'id': seg.id,
                                                'movedBy': moveBy,
                                                'isFirst': this.ViewStateService.getcurMouseisFirst(),
                                                'isLast': this.ViewStateService.getcurMouseisLast()
                                            });

                                        } else {
                                            seg = curMouseItem;
                                            this.ViewStateService.movingBoundarySample = curMouseItem.samplePoint + moveBy;
                                            this.LevelService.moveEvent(this.level.name, seg.id, moveBy);
                                            this.HistoryService.updateCurChangeObj({
                                                'type': 'ANNOT',
                                                'action': 'MOVEEVENT',
                                                'name': this.level.name,
                                                'id': seg.id,
                                                'movedBy': moveBy
                                            });
                                        }
                                        this.lastPCM = this.curMouseSampleNrInView;
                                        this.ViewStateService.setLastPcm(this.lastPCM);
                                        this.ViewStateService.selectBoundary();
                                        moveLine = false;
                                    }
                                } else if (this.ConfigProviderService.vals.restrictions.editItemSize && event.altKey) {
                                    this.LevelService.deleteEditArea();
                                    if (this.level.type === 'SEGMENT') {
                                        seg = this.ViewStateService.getcurClickItems();
                                        if (seg[0] !== undefined) {
                                            this.LevelService.moveSegment(this.level.name, seg[0].id, seg.length, moveBy);
                                            this.HistoryService.updateCurChangeObj({
                                                'type': 'ANNOT',
                                                'action': 'MOVESEGMENT',
                                                'name': this.level.name,
                                                'id': seg[0].id,
                                                'length': seg.length,
                                                'movedBy': moveBy
                                            });
                                        }
                                        this.lastPCM = this.curMouseSampleNrInView;
                                        this.ViewStateService.setLastPcm(this.lastPCM);
                                        this.ViewStateService.selectBoundary();
                                    }
                                    else if (this.level.type === 'EVENT') {
                                        seg = this.ViewStateService.getcurClickItems();
                                        if (seg[0] !== undefined) {
                                            seg.forEach((s) => {
                                                this.LevelService.moveEvent(this.level.name, s.id, moveBy);
                                                this.HistoryService.updateCurChangeObj({
                                                    'type': 'ANNOT',
                                                    'action': 'MOVEEVENT',
                                                    'name': this.level.name,
                                                    'id': s.id,
                                                    'movedBy': moveBy
                                                });
                                            });
                                        }
                                        this.lastPCM = this.curMouseSampleNrInView;
                                        this.ViewStateService.setLastPcm(this.lastPCM);
                                        this.ViewStateService.selectBoundary();
                                    }
                                } else {
                                    this.ViewStateService.movingBoundary = false;
                                }
                            }
                            break;
                    }
                    if (!this.ViewStateService.getdragBarActive()) {
                        this.setLastMove(event, moveLine);
                    }
                }
            });


             // (2) RIGHT MOUSEDOWN FOR CUSTOM MENU
                // Show your custom menu immediately when user presses right button
                angular.element(canvas).bind('mousedown', (event) => {
                    if (event.button === 2) {

                        // --- NEW: only allow admins/researchers OR simple+dragged files ---
                        const u = this.AuthService.getUser();
                        const origin = this.AuthService.getFileOrigin();
                        const isPrivileged = u && (u.role === 'administrator' || u.role === 'researcher');
                        const isSimpleDrag = u && u.role === 'simple' && origin === 'drag-n-droped';
                        if (! (isPrivileged || isSimpleDrag) ) {
                            // simple user on a fetched bundle: block the menu entirely
                            return;
                        }
                        // ------------------------------------------------------------------                            




                        event.preventDefault(); // we already prevented the default context menu above, but just to be safe
                        
                        // 1) Calculate the mouse position in the waveform
                        const mouseX = this.ViewStateService.getX(event);
                        const samplesPerPixel = this.ViewStateService.getSamplesPerPixelVal(event);
                        // Convert to absolute sample index
                        this.lastRightClickSample = (mouseX * samplesPerPixel) + this.ViewStateService.curViewPort.sS;
                    
                        // 2) Position our custom menu at the screen coords
                        this.contextMenuX = event.clientX;
                        this.contextMenuY = event.clientY;
                    
                        // If the context menu is too far right (e.g., within 300px of the window's right edge),
                        // then set a flag to flip nested submenus.
                        if (this.contextMenuX > window.innerWidth - 300) {
                            this.useSubmenuLeft = true;
                        } else {
                            this.useSubmenuLeft = false;
                        }
                        // 3) Show the custom menu
                        this.showContextMenu = true;
                    
                        // If Angular complains about $apply in progress, remove or guard this:
                        if (!this.$scope.$$phase) {
                            this.$scope.$apply();
                        }
                        // console.log('Right mouse down on canvas at sample:', this.lastRightClickSample);
                    }
                });

            //
            this.$element.bind('mouseup', (event) => {
                //οταν το ποντικι παει να κανει click
                // console.log("inside level-canvas-markup-canvas.component.ts-> bind(mouseup event)");

                this.ViewStateService.movingBoundary = false;
                this.setLastMove(event, true);
            });

            //
            this.$element.bind('mouseout', (event) => {
                // console.log("inside level-canvas-markup-canvas.component.ts-> bind(mouseout event)");

                this.ViewStateService.movingBoundary = false;
                this.setLastMove(event, true);
            });
        }

               //////////////////////////////////////
        // mouse handling functions
        /**
         *
         */
        private setLastClick (x) {
            // console.log("inside level-canvas-markup-canvas.component.ts-> setLastClick()");

            this.curMouseSampleNrInView = this.ViewStateService.getX(x) * this.ViewStateService.getSamplesPerPixelVal(x);
            this.LevelService.deleteEditArea();
            this.ViewStateService.setEditing(false);
            this.lastEventClick = this.LevelService.getClosestItem(this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS, this.level.name, this.SoundHandlerService.audioBuffer.length);
            this.ViewStateService.setcurClickLevel(this.level.name, this.level.type, this.idx);
            if (this.lastEventClick.current !== undefined && this.lastEventClick.nearest !== undefined) {
                this.LevelService.setlasteditArea('_' + this.lastEventClick.current.id);
                this.LevelService.setlasteditAreaElem(this.$element.parent());
                this.ViewStateService.setcurClickItem(this.lastEventClick.current);
                this.ViewStateService.selectBoundary();
            }
            this.lastPCM = this.curMouseSampleNrInView;
            this.ViewStateService.setLastPcm(this.lastPCM);
            this.$scope.$apply();
        };

        /**
         *
         */
        private setLastRightClick (x) {
            // console.log("inside level-canvas-markup-canvas.component.ts-> setLastRightClick()");

            if (this.ViewStateService.getcurClickLevelName() !== this.level.name) {
                this.setLastClick(x);
            }
            this.curMouseSampleNrInView = this.ViewStateService.getX(x) * this.ViewStateService.getSamplesPerPixelVal(x);
            this.LevelService.deleteEditArea();
            this.lastEventClick = this.LevelService.getClosestItem(this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS, this.level.name, this.SoundHandlerService.audioBuffer.length);
            if (this.lastEventClick.current !== undefined && this.lastEventClick.nearest !== undefined) {
                var next = this.LevelService.getItemInTime(this.ViewStateService.getcurClickLevelName(), this.lastEventClick.current.id, true);
                var prev = this.LevelService.getItemInTime(this.ViewStateService.getcurClickLevelName(), this.lastEventClick.current.id, false);
                this.ViewStateService.setcurClickLevel(this.level.name, this.level.type, this.idx);
                this.ViewStateService.setcurClickItemMultiple(this.lastEventClick.current, next, prev);
                this.ViewStateService.selectBoundary();
            }
            this.lastPCM = this.curMouseSampleNrInView;
            this.ViewStateService.setLastPcm(this.lastPCM);
            this.$scope.$apply();
        };

        /**
         *
         */
        private setLastDblClick (x) {
            //  console.log("inside level-canvas-markup-canvas.component.ts-> setLastDbClick()");

            this.curMouseSampleNrInView = this.ViewStateService.getX(x) * this.ViewStateService.getSamplesPerPixelVal(x);
            this.lastEventClick = this.LevelService.getClosestItem(this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS, this.level.name, this.SoundHandlerService.audioBuffer.length);
            var isOpen = this.$element.parent().css('height') === '25px' ? false : true;
            // expand to full size on dbl click if level is in small size
            if (!isOpen) {
                this.$element.parent().parent().find('div')[3].click();
            }
            // console.log("BEFORE THE view-state service if condition");
            if (this.lastEventClick.current !== undefined && this.lastEventClick.nearest !== undefined && this.ViewStateService.getPermission('labelAction')) {
                // console.log("this.ViewStateService.getPermission('labelAction')--------------------------");
                if (this.level.type === 'SEGMENT') {
                    if (this.lastEventClick.current.sampleStart >= this.ViewStateService.curViewPort.sS) {
                        if ((this.lastEventClick.current.sampleStart + this.lastEventClick.current.sampleDur) <= this.ViewStateService.curViewPort.eS) {
                            this.ViewStateService.setcurClickLevel(this.level.name, this.level.type, this.idx);
                            this.ViewStateService.setcurClickItem(this.lastEventClick.current);
                            this.LevelService.setlasteditArea('_' + this.lastEventClick.current.id);
                            this.LevelService.setlasteditAreaElem(this.$element.parent());
                            this.ViewStateService.setEditing(true);
                            // console.log("before the this.LevelService.openEditArea ");
                            this.LevelService.openEditArea(this.lastEventClick.current, this.$element.parent(), this.level.type);
                        } else {
                            //console.log('Editing out of right bound !');
                        }
                    } else {
                        //console.log('Editing out of left bound !');
                    }
                } else {
                    this.ViewStateService.setcurClickLevel(this.level.name, this.level.type, this.idx);
                    this.ViewStateService.setcurClickItem(this.lastEventClick.current);
                    this.LevelService.setlasteditArea('_' + this.lastEventClick.current.id);
                    this.LevelService.setlasteditAreaElem(this.$element.parent());
                    this.ViewStateService.setEditing(true);
                    this.LevelService.openEditArea(this.lastEventClick.current, this.$element.parent(), this.level.type);
                    this.ViewStateService.setEditing(true);
                }
            }
            this.lastPCM = this.curMouseSampleNrInView;
            this.ViewStateService.setLastPcm(this.lastPCM);
            this.$scope.$apply();
        };

        /**
         *
         */
        private setLastMove (x, doChange) {
            // guard: if no real audio buffer yet, bail out (for after the clear data)
            const buf = this.SoundHandlerService.audioBuffer;
            if (!buf || typeof buf.length !== 'number') {
                return;
            }

            this.curMouseSampleNrInView = this.ViewStateService.getX(x) * this.ViewStateService.getSamplesPerPixelVal(x);
            this.lastEventMove = this.LevelService.getClosestItem(this.curMouseSampleNrInView + this.ViewStateService.curViewPort.sS, this.level.name, this.SoundHandlerService.audioBuffer.length);
            if (doChange) {
                if (this.lastEventMove.current !== undefined && this.lastEventMove.nearest !== undefined) {
                    this.lastNeighboursMove = this.LevelService.getItemNeighboursFromLevel(this.level.name, this.lastEventMove.nearest.id, this.lastEventMove.nearest.id);
                    this.ViewStateService.setcurMouseItem(this.lastEventMove.nearest, this.lastNeighboursMove, this.ViewStateService.getX(x), this.lastEventMove.isFirst, this.lastEventMove.isLast);
                }
            }
            this.ViewStateService.setcurMouseLevelName(this.level.name);
            this.ViewStateService.setcurMouseLevelType(this.level.type);
            this.lastPCM = this.curMouseSampleNrInView;
            this.ViewStateService.setLastPcm(this.lastPCM);
            this.$scope.$apply();
        };
        
        addItem() {
             console.log("inside addItem() on level-canvas-markup-canvas.component.ts")
            if (this.level.type === 'SEGMENT') {
              const startSample = this.ViewStateService.curViewPort.selectS;
              const endSample   = this.ViewStateService.curViewPort.selectE;
              const label       = 'newSeg';
                

              console.log("before the INSERTSEGMENT");
              // Insert a segment from startSample to endSample with label
              this.LevelService.insertSegment(this.level.name, startSample, endSample, label);
              // Force Angular to detect changes:
              this.level.items = [...this.level.items];
              this.$rootScope.$broadcast('annotationChanged');

          
            } else if (this.level.type === 'EVENT') {
                const pointName = 'newEvent';
                this.LevelService.insertEvent(this.level.name, this.lastRightClickSample, pointName);
                console.log('Added new EVENT at', this.lastRightClickSample);
            }
          
            // Hide context menu
            this.showContextMenu = false;
            // Usually no need for $scope.$apply() in an Angular click handler
        }


        deleteItem() {
            // 1) Find the selected item(s)
            const items = this.ViewStateService.getcurClickItems();
            if (!items || items.length === 0) {
              this.showContextMenu = false;
              return;
            }
          
            // We'll delete only the first selected item here
            const item = items[0];
            console.log('Deleting item:', item);
          
            // 2) Delete via LevelService
            if (this.level.type === 'SEGMENT') {
              this.LevelService.deleteSegments(this.level.name, item.id, 1);
            } else if (this.level.type === 'EVENT') {
                this.LevelService.deleteEvent(this.level.name, item.id);
            }
          
            // Hide context menu
            this.showContextMenu = false;
          
            // 3) Broadcast annotationChanged so the parent can redraw
            this.$rootScope.$broadcast('annotationChanged');
          
            // 4) Optionally ensure a digest if not already in one
            if (!this.$scope.$$phase) {
              this.$scope.$applyAsync();
            }
          
            console.log('Item deleted, broadcast annotationChanged');
        }

        deleteLevel(){
            console.log("you have clicked to delete the level");

            this.LevelService.deleteLevelByName(this.level.name);
            this.ViewStateService.setcurClickLevel(undefined);

            this.$rootScope.$broadcast('annotationChanged');
            this.showContextMenu = false;
        }
          

       // Function to toggle the top-level "Add action" submenu
        toggleAddActionSubmenu() {
            this.showAddActionSubmenu = !this.showAddActionSubmenu;
            // Optionally reset nested submenus if closing:
            if (!this.showAddActionSubmenu) {
            this.showHeadMovementSubmenu = false;
            this.showFacialExpressionSubmenu = false;
            this.showHandGestureSubmenu = false;
            this.showBodyPostureSubmenu = false;
            }
            this.$scope.$applyAsync();
        }
        
        // Function to toggle a nested submenu (submenu2) based on category
        toggleSubmenu(category: string) {
            // Reset all nested submenu flags first
            this.showHeadMovementSubmenu = false;
            this.showFacialExpressionSubmenu = false;
            this.showHandGestureSubmenu = false;
            this.showBodyPostureSubmenu = false;
        
            switch (category) {
            case 'headMovement':
                this.showHeadMovementSubmenu = true;
                break;
            case 'facialExpression':
                this.showFacialExpressionSubmenu = true;
                break;
            case 'handGesture':
                this.showHandGestureSubmenu = true;
                break;
            case 'bodyPosture':
                this.showBodyPostureSubmenu = true;
                break;
            }
            this.$scope.$applyAsync();
        }
        
        // Function to handle selection from any second-level submenu
        selectEmbodiedAction(action: string) {
            // Get the level name from the current click
            let levelName = this.level.name;
         
            console.log("this.level.name: ",this.level.name);   
            // Use the current viewport selection for start and end samples.
            const startSample = this.ViewStateService.curViewPort.selectS;
            const endSample   = this.ViewStateService.curViewPort.selectE;
            
            // Always insert a new segment with the chosen action as its label.
            this.LevelService.insertSegment(levelName, startSample, endSample, action);
            
            // Force the UI update by reassigning the level's items array.
            let level = this.LevelService.getLevelDetails(levelName);
            if (level) {
              level.items = [...level.items];
            }
            
            // Broadcast that the annotations have changed and hide the menus.
            this.$rootScope.$broadcast('annotationChanged');
            this.showAddActionSubmenu = false;
            this.showHeadMovementSubmenu = false;
            this.showFacialExpressionSubmenu = false;
            this.showHandGestureSubmenu = false;
            this.showBodyPostureSubmenu = false;
            this.showContextMenu = false;
        }
          
          
          
          
          
          
          
          

          
            
    }]

}
angular.module('emuwebApp')
.component(LevelCanvasMarkupCanvasComponent.selector, LevelCanvasMarkupCanvasComponent);
