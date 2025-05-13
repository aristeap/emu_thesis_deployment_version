import * as angular from 'angular';
import { AuthService } from '../services/auth.service';


angular.module('emuwebApp')
	.controller('ModalCtrl', [
		'$scope', 
		'ArrayHelperService', 
		'BrowserDetectorService', 
		'ModalService', 
		'ViewStateService', 
		'LevelService', 
		'HistoryService', 
		'ConfigProviderService',
		'AuthService',
		function (
			$scope, 
			ArrayHelperService, 
			BrowserDetectorService, 
			ModalService, 
			ViewStateService, 
			LevelService, 
			HistoryService, 
			ConfigProviderService,
			AuthService
			) {

		$scope.cps = ConfigProviderService;
		$scope.vs = ViewStateService;
		$scope.data = undefined;
		$scope.mySelect = null;

		$scope.auth = AuthService;


		/**
		 *
		 */
		$scope.cursorInTextField = function () {
			ViewStateService.setEditing(true);
			ViewStateService.setcursorInTextField(true);
		};

		/**
		 *
		 */
		$scope.cursorOutOfTextField = function () {
			ViewStateService.setEditing(false);
			ViewStateService.setcursorInTextField(false);
		};

		/**
		 *  Save changes made on SSFF
		 */
		$scope.saveChanges = function () {
			ModalService.close();
		};


		/**
		 *  Save changes made on SSFF
		 */
		$scope.discardChanges = function () {
			ModalService.close();
		};

		/**
		 *  Save a URL
		 */
		$scope.saveURL = function () {
			var currentURLS = $scope.getURLs();
			if (currentURLS.indexOf(ModalService.dataOut) === -1) {
				currentURLS.push(ModalService.dataOut);
			}
			localStorage.setItem('urls', JSON.stringify(currentURLS));
			$scope.myUrls = currentURLS;
			$scope.mySelect = $scope.myUrls[0];
		};

		/**
		 *  Return all URLs from localStorage
		 */
		$scope.getURLs = function () {
			var curVal = localStorage.getItem('urls');
			var urlData = [];
			if (!BrowserDetectorService.isBrowser.PhantomJS() && curVal !== null) {
				urlData = JSON.parse(curVal);
			}
			return urlData;
		};

		/**
		 *  Return all URLs from localStorage
		 */
		$scope.setCurrentURL = function (data) {
			ModalService.dataOut = data;
		};


		/**
		 *  delete a specific url
		 */
		$scope.deleteURL = function (data) {
			var currentURLS = $scope.getURLs();
			if (currentURLS.indexOf(data) !== -1) {
				currentURLS.splice(currentURLS.indexOf(data), 1);
			}
			localStorage.setItem('urls', JSON.stringify(currentURLS));
			$scope.myUrls = currentURLS;
			$scope.mySelect = $scope.myUrls[0];
		};


		/**
		 *  Rename a level
		 */
		// $scope.renameLevel = function () {
		// 	LevelService.renameLevel(ModalService.dataIn, $scope.data, ViewStateService.curPerspectiveIdx);
		// 	HistoryService.addObjToUndoStack({
		// 		'type': 'ANNOT',
		// 		'action': 'RENAMELEVEL',
		// 		'newname': $scope.data,
		// 		'name': ModalService.dataIn,
		// 		'curPerspectiveIdx': ViewStateService.curPerspectiveIdx
		// 	});
		// 	ModalService.close();
		// };

		
		// 1) grab all levels (both EVENT and SEGMENT) for the current view:
      	const allLevels = LevelService.getLevelsByType(['EVENT', 'SEGMENT']);
		const justLevels = allLevels.filter(lvl => !lvl.role);
		const justSpeakers = allLevels.filter(lvl => lvl.role === 'speaker');
		const justEmbodied = allLevels.filter(lvl => lvl.role === 'embodied');

		console.log("allLevels: ",allLevels);
		
		// 2) pluck just the name
      	$scope.levels = justLevels.map((lvl: any) => ({ name: lvl.name }));		//We expose that to $scope.levels and bind it in the <select> via ng-options="lvl.name as lvl.name for lvl in levels"
		$scope.speakers = justSpeakers.map((lvl: any) => ({ name: lvl.name }));	//We expose that to $scope.speakers and bind it in the <select> via ng-options="lvl.name as lvl.name for lvl in speakers"
		$scope.embodied = justEmbodied.map((lvl: any) => ({ name: lvl.name }));	//We expose that to $scope.embodied and bind it in the <select> via ng-options="lvl.name as lvl.name for lvl in embodied"
		
		// 3) model for the dropdown
      	$scope.selectedLevel = null;	//When the user picks one, selectedLevel holds the old name.



		// your existing rename handler can now read $scope.selectedLevel
		$scope.renameLevel = function () {
			console.log("inside renameLevel with $scope.data: ",$scope.data);
			
			LevelService.renameLevel(
				$scope.selectedLevel,
				$scope.data,                      // your new name from the text input
				ViewStateService.curPerspectiveIdx
			);

			HistoryService.addObjToUndoStack({
				type: 'ANNOT',
				action: 'RENAMELEVEL',
				name: $scope.selectedLevel,
				newname: $scope.data,
				curPerspectiveIdx: ViewStateService.curPerspectiveIdx
			});

			ModalService.close();
		};

		/**
		 *  Delete a complete level from LevelService
		 */
		$scope.deleteLevel = function () {
			var lvl = LevelService.getLevelDetails(ViewStateService.getcurClickLevelName());
			LevelService.deleteLevel(ViewStateService.getcurClickLevelIndex(), ViewStateService.curPerspectiveIdx);
			HistoryService.addObjToUndoStack({
				'type': 'ANNOT',
				'action': 'DELETELEVEL',
				'level': lvl,
				'id': ViewStateService.getcurClickLevelIndex(),
				'curPerspectiveIdx': ViewStateService.curPerspectiveIdx
			});
			ModalService.close();
		};

	}]);
