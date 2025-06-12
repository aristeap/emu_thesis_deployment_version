import * as angular from 'angular';

let BundleListSideBarComponent = {
	selector: "bundleListSideBar",
	template: /*html*/`
	<div class="emuwebapp-bundle-outer">

	<!-- <pre style="background: #f8f8f8; border: 1px solid #ccc; padding: 5px; color:black;">
  		{{ $ctrl.LoadedMetaDataService.getRendOptBndlList() | json }}
	</pre>	-->

	<div>
		<h3>
			<!-- αυτό είναι για το search bundle filter -->
			<div class="bundle-filter-button-wrapper">
				<button
					class="emuwebapp-mini-btn left bundle-filter-btn"
					ng-click="$ctrl.onSearchDatabase()">
					<i class="material-icons">search</i>
					Search database
				</button>
			</div>

		</h3>
		<my-drop-zone ng-if="$ctrl.ViewStateService.showDropZone && $ctrl.open"></my-drop-zone>
		<div id="emuwebapp-bundleListContainer" class="emuwebapp-bundle-container" ng-if="!$ctrl.ViewStateService.showDropZone">
			<ul ng-repeat="(key, value) in $ctrl.LoadedMetaDataService.getRendOptBndlList()" ng-class="{'emuwebapp-bundle-last':$last}">
				<!--Βαζω log element για να μπορω να δω ποτε θα επαναληφθει ο κωδικας -->
				<div {{key}}" class="emuwebapp-bundle-session" ng-if="$ctrl.isSessionDefined(key)" ng-click="$ctrl.LoadedMetaDataService.toggleCollapseSession(key)">
				
					<div ng-if="$ctrl.LoadedMetaDataService.getSessionCollapseState(key)">
						▷{{key}}
					</div>
					<div ng-if="!$ctrl.LoadedMetaDataService.getSessionCollapseState(key)">
						▽{{key}}
					</div>
				</div>
				<div class="emuwebapp-bundleListSessionBndlsContainer" ng-if="!$ctrl.LoadedMetaDataService.getSessionCollapseState(key)">
					<div class="emuwebapp-bundleListSessionPager" ng-if="value.length > $ctrl.ViewStateService.pageSize">
						<button ng-disabled="$ctrl.ViewStateService.currentPage == 0" ng-click="$ctrl.turn(false);">
							←
						</button>
						{{$ctrl.ViewStateService.currentPage+1}}/{{$ctrl.ViewStateService.numberOfPages(value.length)}}
						<button ng-disabled="$ctrl.ViewStateService.currentPage >= value.length/$ctrl.ViewStateService.pageSize - 1" ng-click="$ctrl.turn(true);">
							→
						</button>
					</div>

					<!--Βαζω log element για να μπορω να δω ποτε θα επαναληφθει το δευτερο repeat -->
					<div ng-repeat="bundle in value | startFrom:$ctrl.ViewStateService.currentPage*$ctrl.ViewStateService.pageSize | limitTo:$ctrl.ViewStateService.pageSize | regex:$ctrl.filterText track by $index">						
						<div class="emuwebapp-bundle-item" id="uttListItem" ng-style="$ctrl.getBndlColor(bundle);" ng-click="$ctrl.DbObjLoadSaveService.loadBundle(bundle);" dragout draggable="true" name="{{bundle.name}}">
							<b>{{bundle.name}}</b>
							<button ng-if="$ctrl.ConfigProviderService.vals.activeButtons.saveBundle && $ctrl.isCurBndl(bundle)" class="emuwebapp-saveBundleButton" ng-click="$ctrl.DbObjLoadSaveService.saveBundle();"><i class="material-icons">save</i></button>
							<!---->
							<!--regulate finished editing display-->
							<!--display checkbox if current-->
							<div ng-if="$ctrl.ConfigProviderService.vals.restrictions.bundleFinishedEditing && $ctrl.isCurBndl(bundle)">
								finished editing:
								<input type="checkbox" ng-model="bundle.finishedEditing" ng-change="$ctrl.finishedEditing(bundle.finishedEditing, key, $index)"/>
								<br />
							</div>

							<!--display text "true" or "false" depending on model if not current-->
							<div ng-if="$ctrl.ConfigProviderService.vals.restrictions.bundleFinishedEditing && !$ctrl.isCurBndl(bundle)">
								finished editing:
								<strong ng-if="bundle.finishedEditing" style="color:green;">true</strong>
								<strong ng-if="!bundle.finishedEditing" style="color:red;">false</strong>
								<br />
								<br />
							</div>

							<!---->
							<!--regulate comment editing display-->
							<!--display text input if current-->
							<div ng-if="$ctrl.ConfigProviderService.vals.restrictions.bundleComments && $ctrl.isCurBndl(bundle)">
								comment:
								<input type="text" ng-focus="$ctrl.ViewStateService.setcursorInTextField(true); $ctrl.startHistory(bundle);" ng-blur="$ctrl.ViewStateService.setcursorInTextField(false); $ctrl.updateHistory(bundle, key, $index); $ctrl.endHistory(bundle);" ng-model="bundle.comment"/>
							</div>

							<div ng-if="$ctrl.ConfigProviderService.vals.restrictions.bundleComments && !$ctrl.isCurBndl(bundle)">
								comment: <strong style="font-style: italic;max-height: 20px; overflow-y: auto">{{bundle.comment}}</strong>
							</div>


							<!---->
							<!--timeAnchors controlls-->
							<div class="emuwebapp-bundleListSessionPager" ng-if="bundle.timeAnchors.length > 0 && $ctrl.isCurBndl(bundle)">
								<button ng-disabled="$ctrl.ViewStateService.curTimeAnchorIdx == 0" ng-click="$ctrl.nextPrevAnchor(false);">
									←
								</button>
								time anchor idx: {{$ctrl.ViewStateService.curTimeAnchorIdx}}
								<button ng-disabled="$ctrl.ViewStateService.curTimeAnchorIdx == $ctrl.getTimeAnchorIdxMax()" ng-click="$ctrl.nextPrevAnchor(true);">
									→
								</button>
							</div>

						</div>
					</div>
					<div class="emuwebapp-bundleListSessionPager" ng-if="value.length > $ctrl.ViewStateService.pageSize">
						<button ng-disabled="$ctrl.ViewStateService.currentPage == 0" ng-click="$ctrl.turn(false);">
							←
						</button>
						{{$ctrl.ViewStateService.currentPage+1}}/{{$ctrl.ViewStateService.numberOfPages(value.length)}}
						<button ng-disabled="$ctrl.ViewStateService.currentPage >= value.length/$ctrl.ViewStateService.pageSize - 1" ng-click="ctrl.turn(true);">
							→
						</button>
					</div>
				</div> 
			</ul>
		</div> 
	</div>
</div>
`,
bindings: {
	open: '<'
},
controller: [
	'$element', 
	'$animate', 
	'$scope',
	'$rootScope',
	'ViewStateService', 
	'HistoryService', 
	'LoadedMetaDataService', 
	'DbObjLoadSaveService', 
	'ConfigProviderService', 
	'LevelService',
	class BundleListSideBarController{

	private $element;
	private $animate;
	private $scope;
	private $rootScope;
	private ViewStateService;
	private HistoryService;
	private LoadedMetaDataService;
	private DbObjLoadSaveService;
	private ConfigProviderService;
	private LevelService;
	
	private comment;

	private filterText;

	private _inited;


	constructor(
		$element, 
		$animate, 
		$scope,
		$rootScope,
		ViewStateService, 
		HistoryService, 
		LoadedMetaDataService, 
		DbObjLoadSaveService, 
		ConfigProviderService, 
		LevelService
		){
		this.$element = $element;
		this.$animate = $animate;
		this.$scope = $scope;
		this.$rootScope = $rootScope;
		this.ViewStateService = ViewStateService;
		this.HistoryService = HistoryService;
		this.LoadedMetaDataService = LoadedMetaDataService;
		this.DbObjLoadSaveService = DbObjLoadSaveService;
		this.ConfigProviderService = ConfigProviderService;
		this.LevelService = LevelService;

		this.comment = '';

		this.filterText = '';

		this.ViewStateService.pageSize = 500;
		this.ViewStateService.currentPage = 0;

		this._inited = false;

	}
	$postLink () {

	}
	$onChanges (changes) {
		if(this._inited){
			if(changes.open){
				// console.log(changes.open.currentValue);
				if(changes.open.currentValue){
					this.$animate.removeClass(this.$element.find('div')[0], 'emuwebapp-shrinkBundleListSidebarWidthTo0px');
					this.$animate.addClass(this.$element.find('div')[0], 'emuwebapp-expandBundleListSidebarWidthTo200px');
				} else {
					this.$animate.removeClass(this.$element.find('div')[0], 'emuwebapp-expandBundleListSidebarWidthTo200px');
					this.$animate.addClass(this.$element.find('div')[0], 'emuwebapp-shrinkBundleListSidebarWidthTo0px');
				}
			}
		}
	}
	  

	$onInit () {
		this._inited = true;
		this.$scope.$watch(
			() => this.LoadedMetaDataService.getBundleList(),
			(newVal, oldVal) => {
			//   console.log("INSIDE THE scope.watch OF THE loadedMetadata.getBundleList++++++++++++++++++++++++++ :", newVal);
			},
			true  // deep watch if needed
		  );

		  this.$scope.$watch(
			() => this.LoadedMetaDataService.getRendOptBndlList(),
			(newVal, oldVal) => {
			//   console.log("Normalized list changed++++++++++++++++++++++++++:", newVal);
			},
			true
		  );
		  
	}
	// functions from directive 
	private finishedEditing (finished, key, index) {
		this.HistoryService.addObjToUndoStack({
			type: 'WEBAPP',
			action: 'FINISHED',
			finished: finished,
			key: key,
			index: index
		});
	};
	private updateHistory (bundle, key, index) {
		if(this.comment !== bundle.comment){
			this.HistoryService.updateCurChangeObj({
				type: 'WEBAPP',
				action: 'COMMENT',
				initial: this.comment,
				comment: bundle.comment,
				key: key,
				index: index
			});
		}
	};
	private endHistory (bundle) {
		if(this.comment !== bundle.comment) {
			this.HistoryService.addCurChangeObjToUndoStack();
		}
	};
	private startHistory (bundle) {
		this.comment = bundle.comment;
	};

	// functions from controller
	private turn (direction) {
		if (direction) {
			this.ViewStateService.currentPage++;
		}
		else {
			this.ViewStateService.currentPage--;
		}
	};

	/**
	 * returns jso with css defining color dependent
	 * on if changes have been made that have not been saved
	 * @param bndl object containing name attribute of bundle item
	 * requesting color
	 * @returns color as jso object used by ng-style
	 */
	private getBndlColor (bndl) {
		var curColor;
		if (this.HistoryService.movesAwayFromLastSave !== 0) {
			curColor = {
				'background-color': '#f00',
				'color': 'white'
			};
		} else {
			curColor = {
				'background-color': '#999',
				'color': 'black'
			};
		}

		var curBndl = this.LoadedMetaDataService.getCurBndl();
		if (bndl.name === curBndl.name && bndl.session === curBndl.session) {
			return curColor;
		}
	};

	/**
	 * checks if name is undefined
	 * @return bool
	 */
	private isSessionDefined (ses) {
		return ses !== 'undefined';
	};

	/**
	 * zoom to next / previous time anchor
	 */
	private nextPrevAnchor (next) {
		var curBndl = this.LoadedMetaDataService.getCurBndl();
		if(next){
			if(this.ViewStateService.curTimeAnchorIdx < curBndl.timeAnchors.length - 1){
				this.ViewStateService.curTimeAnchorIdx = this.ViewStateService.curTimeAnchorIdx + 1;
				this.ViewStateService.select(curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_start, curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_end);
				this.ViewStateService.setViewPort(curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_start, curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_end);
				this.ViewStateService.zoomViewPort(false, this.LevelService);
			}
		}else{
			if(this.ViewStateService.curTimeAnchorIdx > 0){
				this.ViewStateService.curTimeAnchorIdx = this.ViewStateService.curTimeAnchorIdx - 1;
				this.ViewStateService.select(curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_start, curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_end);
				this.ViewStateService.setViewPort(curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_start, curBndl.timeAnchors[this.ViewStateService.curTimeAnchorIdx].sample_end);
				this.ViewStateService.zoomViewPort(false, this.LevelService);
			}
		}
	};
	/**
	 * get max nr of time anchors
	 */
	private getTimeAnchorIdxMax () {
		var curBndl = this.LoadedMetaDataService.getCurBndl();
		var res;
		if(angular.equals({}, curBndl)){
			res = -1;
		}else{
			res = curBndl.timeAnchors.length - 1;
		}
		return(res);
	};


	private isCurBndl (bndl) {
		var curBndl = this.LoadedMetaDataService.getCurBndl();
		return (bndl.name === curBndl.name && bndl.session === curBndl.session);
	};

	private onSearchDatabase() {
		// delegate up to your main component
		this.ViewStateService.setcursorInTextField(false);
		this.$rootScope.$broadcast('openDatabaseSearch');
	}

}]

}

angular.module('emuwebApp')
.component(BundleListSideBarComponent.selector, BundleListSideBarComponent);
