import * as angular from 'angular';

import { WavRangeReq } from '../workers/wavrangereq.worker';
import { AuthService } from '../services/auth.service';


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
	private $scope;
	private $timeout;
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
	private VideoParserService;
	private AuthService;
	private DragnDropService
	
	constructor($log, $q, $http, $rootScope,$timeout, DataService, ViewStateService, HistoryService, LoadedMetaDataService, SsffDataService, IoHandlerService, BinaryDataManipHelperService, WavParserService, SoundHandlerService, SsffParserService, ValidationService, LevelService, ModalService, ConfigProviderService, AppStateService, StandardFuncsService, DragnDropDataService, VideoParserService, AuthService, DragnDropService){
		this.$log = $log;
		this.$q = $q;
		this.$http = $http;
		this.$rootScope = $rootScope;
		this.$timeout = $timeout;
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
		this.VideoParserService = VideoParserService;
		this.AuthService = AuthService;
		this.DragnDropService = DragnDropService;
		
	}
	

	
	private innerLoadBundle(bndl: any, bundleData: any, arrBuff: ArrayBuffer, defer: angular.IDeferred<any>) {
		//  console.log("db-obj-load-save.service->innerLoadBundle()");
		if (!bundleData.annotation) {
		  bundleData.annotation = {
			levels: [],
			links: [],
			sampleRate: 16000,   // temporary, updated after WAV parse
			annotates: bndl.name,
			name: bndl.name,
			pdfAnnotations: [],
			imageAnnotations: [],
			videoAnnotations: []
		  };
		}

		// **NEW:** Ensure ssffFiles is defined
		if (!bundleData.hasOwnProperty('ssffFiles') || !Array.isArray(bundleData.ssffFiles)) {
		bundleData.ssffFiles = [];

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

			//    console.log("Before setCurBndl-->inside the innerLoadBundle() of db-obj-load-save.service.ts");
			  this.LoadedMetaDataService.setCurBndl(bndl);
			  // Set state explicitly for audio files:
			//   console.log("is this where the setState is becoming labeling->innerLoadBundle of db-obj-load-save.service.ts");

			  this.ViewStateService.setState('labeling');
			  this.ViewStateService.somethingInProgress = false;
			  this.ViewStateService.somethingInProgressTxt = 'Done!';
			  defer.resolve();
			}, (errMess: any) => {
			  this.ModalService.open('views/error.html', 'Error parsing SSFF file: ' + errMess.status.message).then(() => {
				this.AppStateService.resetToInitState();
				defer.reject(errMess);

			  });
			});
		  },(err) => {
			defer.reject(err);
		  });
		}, (errMess: any) => {
		  this.ModalService.open('views/error.html', 'Error parsing wav file: ' + errMess.status.message).then(() => {
			this.AppStateService.resetToInitState();
			defer.reject(errMess);

		  });
		});

		// console.log("At the end of the innerLoadBundle() function");

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
		//console.log("bndl at the start of the loadBundle() function: ", bndl);
	  
		const defer = this.$q.defer();
		this.ViewStateService.setcurClickItem(null);
	  
		// 1) If there are unsaved changes, prompt the user
		if (
		  this.HistoryService.movesAwayFromLastSave !== 0 &&
		  this.ConfigProviderService.vals.main.comMode !== 'DEMO' &&
		  this.ConfigProviderService.vals.activeButtons.saveBundle
		) {
		  const curBndl = this.LoadedMetaDataService.getCurBndl();
		  if (bndl !== curBndl) {
			this.ModalService
			  .open('views/saveChanges.html', `${curBndl.session}:${curBndl.name}`)
			  .then((messModal) => {
				if (messModal === 'saveChanges') {
				  this.saveBundle().then(() => this.loadBundle(bndl, ''));
				} else {
				  this.HistoryService.resetToInitState();
				  this.loadBundle(bndl, '');
				}
			  });
			return; // wait for the modal
		  }
		}
		// ────────────────────────────────────────────────────────────────────────────
		// 2) Normal load
		else {
		  if (bndl !== this.LoadedMetaDataService.getCurBndl()) {
			console.log(
			//   "inside the if(bndl !== getCurBndl()) of loadBundle()…"
			);
	  
			// reset state & start spinner
			this.HistoryService.resetToInitState();
			this.ViewStateService.hierarchyState.reset();
			this.LevelService.deleteEditArea();
			this.ViewStateService.setEditing(false);
	  
			this.ViewStateService.setState('loadingSaving');
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.somethingInProgressTxt =
			  'Loading bundle: ' + bndl.name;
			this.SsffDataService.data = [];
	  
			// choose the correct HTTP promise
			let promise;
			if (!url) {
			  if (bndl.session === "DB") {
				// console.log("Detected DB file; using DragnDropDataService.getBundle()");
				this.AuthService.setFileOrigin('fetched-from-database');
				//console.log('⚙️ fileOrigin now =', this.AuthService.getFileOrigin());

				promise = this.DragnDropDataService.getBundle(bndl.name, bndl.session);
			  } else if (this.ConfigProviderService.vals.main.comMode === 'WS') {
				 //console.log("Using WS mode; calling IoHandlerService.getBundle()");
				promise = this.IoHandlerService.getBundle(
				  bndl.name,
				  bndl.session,
				  this.LoadedMetaDataService.getDemoDbName()
				);
			  } else {
				//console.log("Using EMBEDDED mode; calling IoHandlerService.getBundle()");
				this.AuthService.setFileOrigin('drag-n-droped');
				//console.log('⚙️ fileOrigin now =', this.AuthService.getFileOrigin());

				promise = this.IoHandlerService.getBundle(
				  bndl.name,
				  bndl.session,
				  this.LoadedMetaDataService.getDemoDbName()
				);
			  }
			} else {
			  promise = this.$http.get(url);
			}
	  
			// when we get the bundle JSON back…
			promise.then(async (bundleData: any) => {
	  
			  // normalize
			  if (bundleData.status === 200) {
				bundleData = bundleData.data;
			  }
			//   console.log("Normalized bundleData:", bundleData);
	  
			  const validRes = this.ValidationService.validateJSO(
				'bundleSchema',
				bundleData
			  );
			//   console.log("validRes:", validRes);
	  
			  if (validRes === true) {
				// console.log("Inside validRes=true");
				// console.log("bundleData.mediaFile.encoding:", bundleData.mediaFile.encoding);
	  

				// ─── PDF ───────────────────────────────────────────────────────────────
				if (
				  bundleData.mediaFile &&
				  bundleData.mediaFile.type &&
				  (bundleData.mediaFile.type === 'PDF')
				) {
					console.log("inside the PDF if;")	
					this.LoadedMetaDataService.setCurBndl(bndl);
					this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: bndl });
					this.ViewStateService.setState('nonAudioDisplay');
					this.ViewStateService.somethingInProgress = false;
					this.ViewStateService.somethingInProgressTxt = 'Done!';
					defer.resolve();
				}
				// ─── IMAGE ─────────────────────────────────────────────────────────────
				else if (
				  bundleData.mediaFile &&
				  bundleData.mediaFile.type &&
				  (bundleData.mediaFile.type === 'IMG')
				) {
					console.log("inside the IMG if;")	
					this.LoadedMetaDataService.setCurBndl(bndl);
					this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: bndl });
					this.ViewStateService.setState('JpegDisplay');
					this.ViewStateService.somethingInProgress = false;
					this.ViewStateService.somethingInProgressTxt = 'Done!';
					defer.resolve();
				}
				// ─── VIDEO ─────────────────────────────────────────────────────────────
				else if (
				  bundleData.mediaFile &&
				  bundleData.mediaFile.type &&
				  (bundleData.mediaFile.type === 'VIDEO')
				) {
					console.log("inside the VIDEO if;")	
					this.LoadedMetaDataService.setCurBndl(bndl);
					this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: bndl });
					this.ViewStateService.setState('videoDisplay');
					this.ViewStateService.somethingInProgress = false;
					this.ViewStateService.somethingInProgressTxt = 'Done!';
					defer.resolve();
				}
				// ─── AUDIO (BASE64) ─────────────────────────────────────────────────────
				else if (bundleData.mediaFile.encoding === 'BASE64') {	

				console.log("Inside the BASE64_________________________________________________________________________________");

				//   console.log("AT THE START OF BASE64, bundleData:", bundleData);
				  const arrBuff = this.BinaryDataManipHelperService.base64ToArrayBuffer(
					bundleData.mediaFile.data
				  );
				  this.innerLoadBundle(bndl, bundleData, arrBuff, defer);
				}
				// ─── AUDIO / PDF / IMG / VIDEO (GETURL) ────────────────────────────────
				else if (bundleData.mediaFile.encoding === 'GETURL') {

					console.log("GETURL branch – fetching from the S3 bucket ******************************************************:", bundleData.mediaFile.data);
					const fileId = bundleData.mediaFile.data;
					console.log("bundleData: ",bundleData);
					console.log("fileId=",fileId);
					const downloadUrl = `http://localhost:3019/download-file/${fileId}`;


				
					// 1) fetch raw ArrayBuffer
					this.IoHandlerService
					.httpGetPath(downloadUrl, 'arraybuffer')
					.then((res) => {
						const arr = res.status === 200 ? res.data : res;
				
						// 2) convert to Base64
						const b64 = this.BinaryDataManipHelperService.arrayBufferToBase64(arr);

						// build a proper “full” bundle
						const fullBndl = {
							name:         bndl.name,
							session:      bndl.session,
							mediaFile: {
							encoding: 'BASE64',
							type:     bundleData.mediaFile.type, 
							data:     b64
							},
							annotation: bundleData.annotation
						};				

						// now hand the *full* bundle to the loader
						this.LoadedMetaDataService.setCurBndl(fullBndl);
						this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: fullBndl });

						// console.log("fullBundle() from inside the loadBUndle: ",fullBndl);

						// 4) dispatch based on the *type* field you already set in mapFileToBundle()
						const t = bundleData.mediaFile.type.toLowerCase();

						// console.log("The t is-----------------------------------------------------------------: ",t);
				
						// ─── PDF ─────────────────────────────
						if (t === 'pdf' || t === 'application') {
							//  console.log("inside the pdf part _______________________________________________________________________");
							this.LoadedMetaDataService.setCurBndl(fullBndl);
							this.ViewStateService.setState(this.ViewStateService.states.nonAudioDisplay);

							this.ViewStateService.somethingInProgress = false;
							this.ViewStateService.somethingInProgressTxt = 'Done!';

							this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: fullBndl });
							defer.resolve();
				
						// ─── IMAGE ────────────────────────────
						} else if (t === 'img' || t === 'jpeg' || t === 'jpg' ||  t === 'image' || t.startsWith('image/')) {
							// console.log("inside the img part _______________________________________________________________________");

							this.LoadedMetaDataService.setCurBndl(fullBndl);
							this.ViewStateService.setState(this.ViewStateService.states.JpegDisplay);
							
							// 3) **turn off the spinner** and update the text
  							this.ViewStateService.somethingInProgress = false;
  							this.ViewStateService.somethingInProgressTxt = 'Done!';
							
							this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: fullBndl });
							defer.resolve();
				
						// ─── VIDEO ────────────────────────────
						} else if (t === 'video' || t === 'mp4' || t.startsWith('video/')) {

							// console.log("inside the video part …");
							this.VideoParserService.parseVideoAudioBuf(arr)
							.then((audioBuf) => {
								// 1) stash the decoded audio
								this.SoundHandlerService.audioBuffer = audioBuf;
								// 2) seed the viewport
								this.ViewStateService.setViewPort(0, audioBuf.length);

								// ─── bulk of our “rehydration” patch ────────────────────────────────
								// 3a) register the fetched bundle just like DragnDrop does:
								this.DragnDropDataService.convertedBundles.push(fullBndl);
								this.DragnDropDataService.sessionDefault =
								this.DragnDropDataService.convertedBundles.length - 1;
								this.LoadedMetaDataService.setCurBndl(fullBndl);

								// 3b) flip into video mode
								this.ViewStateService.setState(this.ViewStateService.states.videoDisplay);
								this.ViewStateService.switchPerspective(
								0,
								this.ConfigProviderService.vals.perspectives
								);

								// 3c) hydrate the DataService with exactly the annotation JSON
								//     you saved earlier (levels, links, sampleRate, videoAnnotations, etc.)
								this.DataService.setData(fullBndl.annotation);

								// 3d) now tell your LevelControllers to redraw with that data
								this.$rootScope.$broadcast('nonAudioBundleLoaded', { bundle: fullBndl });
								// ────────────────────────────────────────────────────────────────────

								this.ViewStateService.somethingInProgress = false;
								this.ViewStateService.somethingInProgressTxt = 'Done!';
								defer.resolve();
							})
							.catch(err => {
							  console.error("Video audio decode error:", err);
							  this.ModalService.open('views/error.html', 'Error decoding video audio: ' + err);
							  defer.reject(err);
							});
				
						// ─── FALL BACK TO AUDIO ───────────────
						} else {
							// rebuild an ArrayBuffer from our Base64 and feed into the WAV pipeline
							const arrBuf = this.BinaryDataManipHelperService.base64ToArrayBuffer(b64);
							this.innerLoadBundle(bndl, bundleData, arrBuf, defer);
						}
					})
					.catch(err => {
						console.error("Error fetching file from URL:", err);
						this.ModalService.open('views/error.html', 'Error fetching file from URL: ' + err);
						defer.reject(err);
					});
				
					// make sure we don’t fall through into your “validation” / error modal
					return defer.promise;
				}
				// ─── fallback ──────────────────────────────────────────────────────────
				else {
				  this.ModalService
					.open('views/error.html', 'Error validating annotation file: ' + JSON.stringify(validRes, null, 2))
					.then(() => this.AppStateService.resetToInitState());
				  defer.reject(validRes);
				}
			  }
			},
			// network / HTTP error
			(errMess) => {
			  console.log("Entire errMess object:", errMess);
			  let errorMsg = '';
			  if (errMess.data) {
				errorMsg = errMess.data;
			  } else if (errMess.status && errMess.status.message) {
				errorMsg = errMess.status.message;
			  } else {
				errorMsg = JSON.stringify(errMess) || 'Unknown error';
			  }
			  this.ModalService
				.open('views/error.html', 'Error loading bundle: ' + errorMsg)
				.then(() => this.AppStateService.resetToInitState());
			  defer.reject(errMess);
			}); // ← end promise.then
	  
			// console.log("at the end of the normal-load branch");
		  } // ← end if (bndl !== curBndl)
		} // ← end outer else (unsaved-changes check)
	  
		return defer.promise;
	} // ← end loadBundle()
	  
	  
	  
	
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
			console.log("is this where the setState is becoming loadingSaving-> save bundle() of db-obj-load-save.service.ts");

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
				// console.log("is this where the setState is becoming labeling->getAnnotationAndSaveBndl of db-obj-load-save.service.ts");

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
				// console.log("is this where the setState is becoming labeling->getAnnotationAndSaveBndl-2 of db-obj-load-save.service.ts");

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
.service('DbObjLoadSaveService', ['$log', '$q', '$http','$rootScope','$timeout','DataService', 'ViewStateService', 'HistoryService', 'LoadedMetaDataService', 'SsffDataService', 'IoHandlerService', 'BinaryDataManipHelperService', 'WavParserService', 'SoundHandlerService', 'SsffParserService', 'ValidationService', 'LevelService', 'ModalService', 'ConfigProviderService', 'AppStateService', 'StandardFuncsService','DragnDropDataService', 'VideoParserService','AuthService', 'DragnDropService',DbObjLoadSaveService]);
