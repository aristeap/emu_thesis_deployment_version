import * as angular from 'angular';

import { WavRangeReq } from '../workers/wavrangereq.worker';

/**
* @ngdoc service
* @name emuwebApp.dbObjLoadSaveService
* @description
* # dbObjLoadSaveService
* Service in the emuwebApp.
*/
class DbObjLoadSaveService{
	
	private $log;
	private $q;
	private $http;
	private $rootScope;
	private DataService;
	private ViewStateService;
	private HistoryService;
	private LoadedMetaDataService;
	private SsffDataService;
	private IoHandlerService;
	private BinaryDataManipHelperService;
	private WavParserService;
	private SoundHandlerService;
	private SsffParserService;
	private ValidationService;
	private LevelService;
	private ModalService;
	private ConfigProviderService;
	private AppStateService;
	private StandardFuncsService;
	private DragnDropDataService;
	
	constructor($log, $q, $http, $rootScope ,DataService, ViewStateService, HistoryService, LoadedMetaDataService, SsffDataService, IoHandlerService, BinaryDataManipHelperService, WavParserService, SoundHandlerService, SsffParserService, ValidationService, LevelService, ModalService, ConfigProviderService, AppStateService, StandardFuncsService, DragnDropDataService){
		this.$log = $log;
		this.$q = $q;
		this.$http = $http;
		this.$rootScope = $rootScope;
		this.DataService = DataService;
		this.ViewStateService = ViewStateService;
		this.HistoryService = HistoryService;
		this.LoadedMetaDataService = LoadedMetaDataService;
		this.SsffDataService = SsffDataService;
		this.IoHandlerService = IoHandlerService;
		this.BinaryDataManipHelperService = BinaryDataManipHelperService;
		this.WavParserService = WavParserService;
		this.SoundHandlerService = SoundHandlerService;
		this.SsffParserService = SsffParserService;
		this.ValidationService = ValidationService;
		this.LevelService = LevelService;
		this.ModalService = ModalService;
		this.ConfigProviderService = ConfigProviderService;
		this.AppStateService = AppStateService;
		this.StandardFuncsService = StandardFuncsService;
		this.DragnDropDataService = DragnDropDataService;
		
	}
	
	private innerLoadBundle(bndl: any, bundleData: any, arrBuff: ArrayBuffer, defer: angular.IDeferred<any>) {
		console.log("db-obj-load-save.service->innerLoadBundle()");
		if (!bundleData.annotation) {
		  bundleData.annotation = {
			levels: [],
			links: [],
			sampleRate: 16000,   // temporary, updated after WAV parse
			annotates: bndl.name,
			name: bndl.name
		  };
		}
		this.ViewStateService.somethingInProgressTxt = 'Parsing WAV file...';
		this.WavParserService.parseWavAudioBuf(arrBuff).then((messWavParser: AudioBuffer) => {
		  var audioBuffer: AudioBuffer = messWavParser;
		  bundleData.annotation.sampleRate = audioBuffer.sampleRate;
		  this.ViewStateService.curViewPort.sS = 0;
		  this.ViewStateService.curViewPort.eS = audioBuffer.length;
		  if (bndl.timeAnchors !== undefined && bndl.timeAnchors.length > 0) {
			this.ViewStateService.curViewPort.selectS = bndl.timeAnchors[0].sample_start;
			this.ViewStateService.curViewPort.selectE = bndl.timeAnchors[0].sample_end;
		  } else {
			this.ViewStateService.resetSelect();
		  }
		  this.ViewStateService.curTimeAnchorIdx = -1;
		  this.ViewStateService.curClickSegments = [];
		  this.ViewStateService.curClickLevelName = undefined;
		  this.ViewStateService.curClickLevelType = undefined;
		  this.SoundHandlerService.audioBuffer = audioBuffer;
		  var promises: angular.IPromise<any>[] = [];
		  bundleData.ssffFiles.forEach((file: any) => {
			if (file.encoding === 'GETURL') {
			  const promise = this.IoHandlerService.httpGetPath(file.data, 'arraybuffer');
			  promises.push(promise);
			  file.encoding = 'ARRAYBUFFER';
			}
		  });
		  var dummyProm = false;
		  if (promises.length === 0) {
			var d = this.$q.defer();
			dummyProm = true;
			promises.push(d.promise);
			d.resolve();
		  }
		  this.$q.all(promises).then((res: any[]) => {
			for (var i = 0; i < res.length; i++) {
			  if (!dummyProm) {
				bundleData.ssffFiles[i].data = res[i];
			  }
			}
			this.ViewStateService.somethingInProgressTxt = 'Parsing SSFF files...';
			this.SsffParserService.asyncParseSsffArr(bundleData.ssffFiles).then((ssffJso: any) => {
			  this.SsffDataService.data = ssffJso.data;
			  this.DataService.setData(bundleData.annotation);

			//   console.log("Before setCurBndl-->inside the innerLoadBundle() of db-obj-load-save.service.ts");
			  this.LoadedMetaDataService.setCurBndl(bndl);
			  // Set state explicitly for audio files:
			  this.ViewStateService.setState('labeling');
			  this.ViewStateService.somethingInProgress = false;
			  this.ViewStateService.somethingInProgressTxt = 'Done!';
			  defer.resolve();
			}, (errMess: any) => {
			  this.ModalService.open('views/error.html', 'Error parsing SSFF file: ' + errMess.status.message).then(() => {
				this.AppStateService.resetToInitState();
			  });
			});
		  });
		}, (errMess: any) => {
		  this.ModalService.open('views/error.html', 'Error parsing wav file: ' + errMess.status.message).then(() => {
			this.AppStateService.resetToInitState();
		  });
		});
	  }
	  
	///////////////////
	// public api

	/**
	* general loadBundle method.
	* @param bndl object containing name attribute of currently loaded bundle
	* @param url if set the bundle is loaded from the given url
	*/


	loadBundle(bndl, url) {
		console.log("THE FILE ON THE LEFT PANEL HAS BEEN CLICKED");

		// console.log("db-obj-load-save.service->loadBundle()");

		// console.log("bndl at the start of the loadBundle() function: ",bndl);

		var defer = this.$q.defer();
		// console.log("ViewStateService instance:", this.ViewStateService);

		this.ViewStateService.setcurClickItem(null);
		if ((this.HistoryService.movesAwayFromLastSave !== 0 &&
			 this.ConfigProviderService.vals.main.comMode !== 'DEMO' &&
			 this.ConfigProviderService.vals.activeButtons.saveBundle)) {
		  var curBndl = this.LoadedMetaDataService.getCurBndl();
		  if (bndl !== curBndl) {
			this.ModalService.open('views/saveChanges.html', curBndl.session + ':' + curBndl.name).then((messModal) => {
			  if (messModal === 'saveChanges') {
				this.saveBundle().then(() => {
				  this.loadBundle(bndl, "");
				});
			  } else if (messModal === 'discardChanges') {
				this.HistoryService.resetToInitState();
				this.loadBundle(bndl, "");
			  }
			});
			return;
		  }
		} else {
		  if (bndl !== this.LoadedMetaDataService.getCurBndl()) {
			this.HistoryService.resetToInitState();
			this.ViewStateService.hierarchyState.reset();
			this.LevelService.deleteEditArea();
			this.ViewStateService.setEditing(false);
			this.ViewStateService.setState('loadingSaving');
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.somethingInProgressTxt = 'Loading bundle: ' + bndl.name;
			this.SsffDataService.data = [];
			var promise;
			if (!url) {
			  promise = this.IoHandlerService.getBundle(bndl.name, bndl.session, this.LoadedMetaDataService.getDemoDbName());	
			} else {
			  promise = this.$http.get(url);
			}
			promise.then(async (bundleData: any) => {
			  if (bundleData.status === 200) {
				bundleData = bundleData.data;
			  }
			  var validRes = this.ValidationService.validateJSO('bundleSchema', bundleData);
			  if (validRes === true) {
				
				//FOR THE PDF***************************************************************************************************************
				if (bundleData.mediaFile && bundleData.mediaFile.type && (bundleData.mediaFile.type === 'PDF')) {
				
				//   console.log("Before setCurBndl-->inside the loadBundle() of db-obj-load-save.service.ts");
				  this.LoadedMetaDataService.setCurBndl(bndl);
				//   console.log("bndl: ",bndl);
				//   console.log("this.LoadedMetaDataService.getCurBndl(bndl): ",this.LoadedMetaDataService.getCurBndl(bndl));
	

				  this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: bndl });
				  this.ViewStateService.setState('nonAudioDisplay');

				  this.ViewStateService.somethingInProgress = false;
				  this.ViewStateService.somethingInProgressTxt = 'Done!';
				  defer.resolve();

				  console.log("For PDF :")
				  console.log("bndl: ",bndl);
				  console.log("this.LoadedMetaDataService.getCurBndl(bndl): ",this.LoadedMetaDataService.getCurBndl(bndl));
				  
				//FOR THE IMG***************************************************************************************************************
				}else if(bundleData.mediaFile && bundleData.mediaFile.type && (bundleData.mediaFile.type === 'IMG')){
				
				//   console.log("Before setCurBndl-->inside the innerLoadBundle() of db-obj-load-save.service.ts");
				  this.LoadedMetaDataService.setCurBndl(bndl);

					// console.log("bndl: ",bndl);
					// console.log("this.LoadedMetaDataService.getCurBndl(bndl): ",this.LoadedMetaDataService.getCurBndl(bndl));

				  this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: bndl });
				  this.ViewStateService.setState('JpegDisplay');
				  this.ViewStateService.somethingInProgress = false;
				  this.ViewStateService.somethingInProgressTxt = 'Done!';
				  defer.resolve();

				//   console.log("For JPEG :")
				//   console.log("bndl: ",bndl);
				//   console.log("this.LoadedMetaDataService.getCurBndl(bndl): ",this.LoadedMetaDataService.getCurBndl(bndl));


				}//FOR THE WAV***************************************************************************************************************
				 else if(bundleData.mediaFile.encoding === 'BASE64') {

					var arrBuff = this.BinaryDataManipHelperService.base64ToArrayBuffer(bundleData.mediaFile.data);
				  this.innerLoadBundle(bndl, bundleData, arrBuff, defer);
				  
				  console.log("For BASE64 :");
				//   console.log("ViewStateService.getCurStateName----------------------: ", this.ViewStateService.getCurStateName());	

				} else if(bundleData.mediaFile.encoding === 'GETURL'){
				  this.IoHandlerService.httpGetPath(bundleData.mediaFile.data, 'arraybuffer').then((res) => {
					if(res.status === 200){
					  res = res.data;
					}
					this.innerLoadBundle(bndl, bundleData, res, defer);
				  });

				  console.log("For GETURL :");	
				  console.log("ViewStateService.getCurState----------------------: ", this.ViewStateService.getCurStateName());	

				}
			  } else {
				this.ModalService.open('views/error.html', 'Error validating annotation file: ' + JSON.stringify(validRes, null, 4)).then(() => {
				  this.AppStateService.resetToInitState();
				});
			  }
			}, (errMess) => {
			  if (errMess.data) {
				this.ModalService.open('views/error.html', 'Error loading bundle: ' + errMess.data).then(() => {
				  this.AppStateService.resetToInitState();
				});
			  } else {
				this.ModalService.open('views/error.html', 'Error loading bundle: ' + errMess.status.message).then(() => {
				  this.AppStateService.resetToInitState();
				});
			  }
			});
		  }
		}
		return defer.promise; 
	}
	
	/**
	* general purpose save bundle function.
	* @return promise that is resolved after completion (rejected on error)
	*/
	public saveBundle() {
		console.log("Inside db-obj-load-save.service.ts-------------------> saveBundle()");
		// check if something has changed
		// if (HistoryService.movesAwayFromLastSave !== 0) {
		if (this.ViewStateService.getPermission('saveBndlBtnClick')) {
			var defer = this.$q.defer();
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.setState('loadingSaving');
			//create bundle json
			var bundleData = {} as any;
			this.ViewStateService.somethingInProgressTxt = 'Creating bundle json...';
			bundleData.ssffFiles = [];
			// ssffFiles (only FORMANTS are allowed to be manipulated so only this track is sent back to server)
			var formants = this.SsffDataService.getFile('FORMANTS');
			if (formants !== undefined) {
				this.SsffParserService.asyncJso2ssff(formants).then((messParser) => {
					bundleData.ssffFiles.push({
						'fileExtension': formants.fileExtension,
						'encoding': 'BASE64',
						'data': this.BinaryDataManipHelperService.arrayBufferToBase64(messParser.data)
					});
					this.getAnnotationAndSaveBndl(bundleData, defer);
					
				}, (errMess) => {
					this.ModalService.open('views/error.html', 'Error converting javascript object to SSFF file: ' + errMess.status.message);
					defer.reject();
				});
			} else {
				this.getAnnotationAndSaveBndl(bundleData, defer);
			}
			
			return defer.promise;
			// }
		} else {
			this.$log.info('Action: menuBundleSaveBtnClick not allowed!');
		}
		
	};
	
	
	/**
	*
	*/
	public getAnnotationAndSaveBndl(bundleData : any , defer: angular.IDeferred<any>) {
		
		// Validate annotation before saving
		this.ViewStateService.somethingInProgressTxt = 'Validating annotJSON ...';
		
		var validRes = this.ValidationService.validateJSO('annotationFileSchema', this.DataService.getData());
		if (validRes !== true) {
			this.$log.warn('PROBLEM: trying to save bundle but bundle is invalid. traverseAndClean() will be called.');
			this.$log.error (validRes);
		}
		
		// clean annot data just to be safe...
		this.StandardFuncsService.traverseAndClean(this.DataService.getData());
		
		////////////////////////////
		// construct bundle
		
		// annotation
		bundleData.annotation = this.DataService.getData();
		
		// empty media file (depricated since schema was updated)
		bundleData.mediaFile = {'encoding': 'BASE64', 'data': ''};
		
		var curBndl = this.LoadedMetaDataService.getCurBndl();
		
		// add session if available
		if (typeof curBndl.session !== 'undefined') {
			bundleData.session = curBndl.session;
		}
		// add finishedEditing if available
		if (typeof curBndl.finishedEditing !== 'undefined') {
			bundleData.finishedEditing = curBndl.finishedEditing;
		}
		// add comment if available
		if (typeof curBndl.comment !== 'undefined') {
			bundleData.comment = curBndl.comment;
		}
		
		// validate bundle
		this.ViewStateService.somethingInProgressTxt = 'Validating bundle ...';
		validRes = this.ValidationService.validateJSO('bundleSchema', bundleData);
		
		if (validRes !== true) {
			this.$log.error('GRAVE PROBLEM: trying to save bundle but bundle is invalid. traverseAndClean() HAS ALREADY BEEN CALLED.');
			this.$log.error(validRes);
			
			this.ModalService.open('views/error.html', 'Somehow the data for this bundle has been corrupted. This is most likely a nasty and diffucult to spot bug. If you are at the IPS right now, please contact an EMU developer immediately. The Validation error is: ' + JSON.stringify(validRes, null, 4)).then(() => {
				this.ViewStateService.somethingInProgressTxt = '';
				this.ViewStateService.somethingInProgress = false;
				this.ViewStateService.setState('labeling');
				defer.reject();
			});
		} else {
			this.ViewStateService.somethingInProgressTxt = 'Saving bundle...';
			this.IoHandlerService.saveBundle(bundleData).then(() => {
				this.ViewStateService.somethingInProgressTxt = 'Done!';
				this.ViewStateService.somethingInProgress = false;
				this.HistoryService.movesAwayFromLastSave = 0;
				defer.resolve();
				this.ViewStateService.setState('labeling');
			}, (errMess) => {
				this.ModalService.open('views/error.html', 'Error saving bundle: ' + errMess.status.message).then(() => {
					this.AppStateService.resetToInitState();
				});
				defer.reject();
			});
		}
	};
	
}

angular.module('emuwebApp')
.service('DbObjLoadSaveService', ['$log', '$q', '$http','$rootScope', 'DataService', 'ViewStateService', 'HistoryService', 'LoadedMetaDataService', 'SsffDataService', 'IoHandlerService', 'BinaryDataManipHelperService', 'WavParserService', 'SoundHandlerService', 'SsffParserService', 'ValidationService', 'LevelService', 'ModalService', 'ConfigProviderService', 'AppStateService', 'StandardFuncsService', DbObjLoadSaveService]);
