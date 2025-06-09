import * as angular from 'angular';

class DragnDropService{
	
	private $q;
	private $rootScope;
	private $window;
	private ModalService;
	private DataService;
	private ValidationService;
	private ConfigProviderService;
	private DragnDropDataService;
	private IoHandlerService;
	private ViewStateService;
	private SoundHandlerService;
	private BinaryDataManipHelperService;
	private BrowserDetectorService;
	private WavParserService;
	private TextGridParserService;
	private LoadedMetaDataService;
	private LevelService;
	private VideoParserService;
	private DrawHelperService;
	
	private drandropBundles;
	private bundleList;
	private sessionName;
	private maxDroppedBundles;
	
	constructor($q, $rootScope, $window, ModalService, DataService, ValidationService, ConfigProviderService, DragnDropDataService, IoHandlerService, ViewStateService, SoundHandlerService, BinaryDataManipHelperService, BrowserDetectorService, WavParserService, TextGridParserService, LoadedMetaDataService, LevelService, VideoParserService, DrawHelperService){
		this.$q = $q;
		this.$rootScope = $rootScope;
		this.$window = window;
		this.ModalService = ModalService;
		this.DataService = DataService;
		this.ValidationService = ValidationService;
		this.ConfigProviderService = ConfigProviderService;
		this.DragnDropDataService = DragnDropDataService;
		this.IoHandlerService = IoHandlerService;
		this.ViewStateService = ViewStateService;
		this.SoundHandlerService = SoundHandlerService;
		this.BinaryDataManipHelperService = BinaryDataManipHelperService;
		this.BrowserDetectorService = BrowserDetectorService;
		this.WavParserService = WavParserService;
		this.TextGridParserService = TextGridParserService;
		this.LoadedMetaDataService = LoadedMetaDataService;
		this.LevelService = LevelService;
		this.VideoParserService = VideoParserService;
		this.DrawHelperService = DrawHelperService;
		
		this.drandropBundles = [];
		this.bundleList = [];
		this.sessionName = 'File(s)';
		this.maxDroppedBundles = 10;
		
	}
	
	///////////////////////////////
	// public api
	
	///////////////////
	// drag n drop data
	public setData(bundles) {
		console.log("inside drag-n-drop.service.ts-> setData");
		let count = 0;
		bundles.forEach((bundle, i) => {
		  // bundle[1] is { file: File, extension: 'WAV'/'PDF'/'JPEG'/'JPG' }
		  const fileObj = bundle[1];
		  if (fileObj && fileObj.extension) {
		  	console.log("inside drag-n-drop.service.ts-> setData inside the condition loop");
			const ext = fileObj.extension.toUpperCase();
			// Store the raw File under the correct type:
			if (ext === 'WAV') {
			  console.log("inside drag-n-drop.service.ts-> setData wav part");
			  this.setDragnDropData(bundle[0], i, 'wav', fileObj.file);
			} else if (ext === 'PDF') {
				// console.log("The ext is PDF");
			  this.setDragnDropData(bundle[0], i, 'pdf', fileObj.file);
			} else if (ext === 'JPEG' || ext === 'JPG') {
				// console.log("The ext is JPEG");
			  this.setDragnDropData(bundle[0], i, 'img', fileObj.file);
			}else if(ext === 'MP4'){
				// console.log("The file is probably a video of MP4 formst");
				this.setDragnDropData(bundle[0], i ,'video', fileObj.file);	
			}
		  }
		  // If there’s an annotation, store it:
		  if (bundle[2] !== undefined) {
			console.log("inside drag-n-drop.service.ts-> setData for the _annot.json");
			this.setDragnDropData(bundle[0], i, 'annotation', bundle[2].file);
		  }
		  count = i;
		});
	  
		if (count <= this.maxDroppedBundles) {
		  this.convertDragnDropData(this.drandropBundles, 0).then(() => {
			console.log("before the setBundleList of the drag-n-drop.service.ts");
			this.LoadedMetaDataService.setBundleList(this.bundleList);
			this.LoadedMetaDataService.setCurBndlName(
			  this.bundleList[this.DragnDropDataService.sessionDefault]
			);
			this.LoadedMetaDataService.setDemoDbName(
			  this.bundleList[this.DragnDropDataService.sessionDefault]
			);
			this.handleLocalFiles();
			return true;
		  });
		} else {
		  return false;
		}
	}
	  
	
	public resetToInitState() {
		delete this.drandropBundles;
		this.drandropBundles = [];
		delete this.bundleList;
		this.bundleList = [];
		this.sessionName = 'File(s)';
		this.maxDroppedBundles = 10;
		this.DragnDropDataService.resetToInitState();
		this.LoadedMetaDataService.resetToInitState();
	};
	
	/**
	* setter this.drandropBundles
	*/
	public setDragnDropData(bundle, i, type, data) {
		//  console.log("drag-n-drop.service.ts-> setDragnDropData(bundles, i, type, data)");
		this.DragnDropDataService.setDefaultSession(i);
		if (this.drandropBundles[i] === undefined) {
			this.drandropBundles[i] = {};
			this.DragnDropDataService.convertedBundles[i] = {};
			this.DragnDropDataService.convertedBundles[i].name = bundle;
			this.bundleList.push({
				name: bundle,
				session: this.sessionName
			});
			
		}
		if (type === 'wav') {
			this.drandropBundles[i].wav = data;
		  } else if (type === 'pdf') {
			this.drandropBundles[i].pdf = data;
			// console.log("this.drandropBundles[i].pdf : ",this.drandropBundles[i].pdf);
		  } else if (type === 'img') {
			this.drandropBundles[i].img = data;
			// console.log("this.drandropBundles[i].img : ",this.drandropBundles[i].img);
		  }else if(type === 'video'){
			this.drandropBundles[i].video = data;
		  } 
		  else if (type === 'annotation') {
			this.drandropBundles[i].annotation = data;
		}
		  
	};
	
	/**
	* getter this.drandropBundles
	*/
	public getDragnDropData(bundle, type) {
		console.log("drag-n-drop.service.ts-> getDragnDropData");

		if (type === 'wav') {
			return this.drandropBundles[bundle].wav;
		}
		else if (type === 'annotation') {
			return this.drandropBundles[bundle].annotation;
		}
		else {
			return false;
		}
	};
	
	public generateDrop(data) {
		
		var objURL;
		if (typeof URL !== 'object' && typeof webkitURL !== 'undefined') {
			objURL = webkitURL.createObjectURL(this.getBlob(data));
		} else {
			objURL = URL.createObjectURL(this.getBlob(data));
		}
		return objURL;
	};
	
	/**
	*
	*/
	public getBlob(data) {
		console.log("drag-n-drop.service.ts-> getBlob");

		var blob;
		try {
			blob = new Blob([data], {type: 'text/plain'});
		} catch (e) { // Backwards-compatibility
			blob = new (this.$window.BlobBuilder || this.$window.WebKitBlobBuilder || this.$window.MozBlobBuilder);
			blob.append(data);
			blob = blob.getBlob();
		}
		return blob;
	};
	

	public convertDragnDropData(bundles, i) {
  		console.log("▶ convertDragnDropData: entered with index", i, "of", bundles.length);
		var defer = this.$q.defer();
		// If we have more bundles to process...
		if (bundles.length > i) {
			var data = this.drandropBundles[i];
			console.log(` data++++++++++++++++++++++++++?++ =`, data);

			var reader: any = new FileReader();
			var reader2: any = new FileReader();
			var res;
		  
		  	// If the bundle contains a WAV file, process it as before-----------------------------------------------------------------
		  	if (data.wav !== undefined) {
				console.log(`  [bundle ${i}] Found WAV file:`, data.wav.name);
				console.log(`  [bundle ${i}] → Starting readAsArrayBuffer for WAV`);

				reader.readAsArrayBuffer(data.wav);
				reader.onloadend = (evt) => {
					if (evt.target.readyState === FileReader.DONE) {
					res = this.BrowserDetectorService.isBrowser.Firefox() 
							? evt.target.result 
							: evt.currentTarget.result;
					console.log(`  [bundle ${i}] ↪ WAV ArrayBuffer loaded (byteLength =`, (res as ArrayBuffer).byteLength, ")");

					const bufferClone = res.slice(0);
								console.log(`  [bundle ${i}] → Calling WavParserService.parseWavAudioBuf…`);

					this.WavParserService.parseWavAudioBuf(res).then((audioBuffer) => {
										console.log(`  [bundle ${i}] ↪ WavParserService returned AudioBuffer (sampleRate =`, audioBuffer.sampleRate, ")");

						if (!this.DragnDropDataService.convertedBundles[i]) {
						this.DragnDropDataService.convertedBundles[i] = {};
						}
						this.DragnDropDataService.convertedBundles[i].mediaFile = {
						encoding: 'BASE64',
						data: this.BinaryDataManipHelperService.arrayBufferToBase64(bufferClone)
						};
						this.DragnDropDataService.convertedBundles[i].ssffFiles = [];
						this.SoundHandlerService.audioBuffer = audioBuffer;
						var bundleName = data.wav.name.substr(0, data.wav.name.lastIndexOf('.'));
						if (data.annotation === undefined) {
						console.log(`  [bundle ${i}] No annotation file found; creating empty annotation placeholder.`);
						this.DragnDropDataService.convertedBundles[i].annotation = {
							levels: [],
							links: [],
							sampleRate: audioBuffer.sampleRate,
							annotates: bundleName,
							name: bundleName,
							pdfAnnotations: [],
							imageAnnotations: [],
							videoAnnotations: []
						};
						this.convertDragnDropData(bundles, i + 1).then(() => {
							delete this.drandropBundles;
							this.drandropBundles = [];
							defer.resolve();
						});
						} else {
						if (data.annotation.type === 'textgrid') {
												console.log(`  [bundle ${i}] Found TextGrid annotation:`, data.annotation.file.name);

							reader2.readAsText(data.annotation.file);
											console.log(`  [bundle ${i}] → Starting readAsText for TextGrid`);

							reader2.onloadend = (evt2) => {
							if (evt2.target.readyState === FileReader.DONE) {
														console.log(`  [bundle ${i}] ↪ TextGrid text loaded (length =`, (evt2.currentTarget.result as string).length, ")");

								this.TextGridParserService.asyncParseTextGrid(
								evt2.currentTarget.result,
								data.wav.name,
								bundleName
								).then((parseResult) => {
															console.log(`  [bundle ${i}] ↪ Parsed TextGrid result:`, parseResult);

								this.DragnDropDataService.convertedBundles[i].annotation = parseResult;
															console.log(`  [bundle ${i}] → Recursing to next bundle after TextGrid parse.`);

								this.convertDragnDropData(bundles, i + 1).then(() => {
									defer.resolve();
								});
								}, (errMess) => {
								this.ModalService.open('views/error.html', 'Error parsing TextGrid file: ' + errMess.status.message)
									.then(() => {
									defer.reject();
									});
								});
							}
							};
							//JSON annotation branch
						} else if (data.annotation !== undefined) {
							console.log(`  [bundle ${i}] Found JSON annotation:`, data.annotation.name);
							reader2.readAsText(data.annotation);
							console.log(`  [bundle ${i}] → Starting readAsText for JSON annotation`);
							reader2.onloadend = (evt2) => {
								if (evt2.target.readyState === FileReader.DONE) {
								console.log(`  [bundle ${i}] ↪ JSON raw text (first 100 chars):`, (evt2.currentTarget.result as string).substring(0,100));
								try {
									const parsed = angular.fromJson(evt2.currentTarget.result as string);
									console.log(`  [bundle ${i}] ↪ Parsed annotation JSON:`, parsed);
									this.DragnDropDataService.convertedBundles[i].annotation = parsed;
								} catch(err) {
									console.error(`  [bundle ${i}] ✖ Failed to parse JSON:`, err);
									// fallback to empty‐annotation placeholder if desired…
									this.DragnDropDataService.convertedBundles[i].annotation = { levels: [], links: [], sampleRate: null, annotates: bundleName, name: bundleName, pdfAnnotations: [], imageAnnotations: [], videoAnnotations: [] };
								}
								console.log(`  [bundle ${i}] → Recursing to next bundle after JSON parse.`);
								this.convertDragnDropData(bundles, i + 1).then(() => defer.resolve());
								}
							};
						}
						}
					}, (errMess) => {
						this.ModalService.open('views/error.html', 'Error parsing wav file: ' + errMess.status.message)
						.then(() => {
							defer.reject();
						});
					});
					}
				};
			} 
			// If the bundle contains a PDF file, process it without WAV parsing-------------------------------------------------------
			// ── If the bundle contains a PDF file, process it (and parse JSON if present) ──
			else if (data.pdf !== undefined) {
				console.log(`[bundle ${i}] PDF‐branch: loading ${data.pdf.name}`);
				reader.readAsArrayBuffer(data.pdf);

				reader.onloadend = (evt) => {
					if ((evt.target as FileReader).readyState === FileReader.DONE) {
						const resPdf: ArrayBuffer = (evt.target as FileReader).result as ArrayBuffer;
						const bufferClone = resPdf.slice(0);
						if (!this.DragnDropDataService.convertedBundles[i]) {
							this.DragnDropDataService.convertedBundles[i] = {};
						}

						// 1) Store the PDF as base64 so that the viewer can display it later:
						this.DragnDropDataService.convertedBundles[i].mediaFile = {
							encoding: 'BASE64',
							type: 'PDF',
							data: this.BinaryDataManipHelperService.arrayBufferToBase64(bufferClone)
						};

						const bundleName = data.pdf.name.substr(0, data.pdf.name.lastIndexOf('.'));

						// 2) If there is NO companion annotation JSON → give an “empty placeholder”:
						if (data.annotation === undefined) {
								this.DragnDropDataService.convertedBundles[i].annotation = {
								levels: [],
								links: [],
								sampleRate: null,
								annotates: bundleName,
								name: bundleName,
								pdfAnnotations: [],
								imageAnnotations: [],
								videoAnnotations: []
							};

							// Now continue to the next bundle
							this.convertDragnDropData(bundles, i + 1).then(() => {
								delete this.drandropBundles;
								this.drandropBundles = [];
								defer.resolve();
							});
						}
						// 3) Otherwise there *is* a companion `_annot.json` → read it immediately:
						else {
							console.log(`  [bundle ${i}] Found companion _annot.json:`, data.annotation.name);

							// Start reading JSON as text:
							reader2.readAsText(data.annotation);  
							console.log(`  [bundle ${i}] → Starting readAsText for JSON annotation`);

							reader2.onloadend = (evt2) => {
								if ((evt2.target as FileReader).readyState === FileReader.DONE) {
									// Log the raw JSON text for debugging:
									console.log(
									`  [bundle ${i}] Raw JSON text loaded:\n`,
									(evt2.target as FileReader).result
									);

									// Parse it into a JS object:
									this.DragnDropDataService.convertedBundles[i].annotation =
									angular.fromJson((evt2.target as FileReader).result as string);

									console.log(
									`  [bundle ${i}] Parsed annotation object:\n`,
									this.DragnDropDataService.convertedBundles[i].annotation
									);

									// Now continue processing the next bundle:
									this.convertDragnDropData(bundles, i + 1).then(() => {
										delete this.drandropBundles;
										this.drandropBundles = [];
										defer.resolve();
									});
								}
							};
								reader2.onerror = (err) => {
								console.error(`  [bundle ${i}] Error reading JSON:`, err);
								defer.reject(err);
							};
						}
					}
				}; // end reader.onloadend for PDF
			}
			// ── If the bundle contains an image (JPEG/JPG), process it ──
			else if (data.img !== undefined) {
				console.log(`[bundle ${i}] Detected image file:`, data.img.name);

				// 1) Read the image into a Base64 “mediaFile” field:
				reader.readAsArrayBuffer(data.img);
				reader.onloadend = (evt) => {
					if (evt.target!.readyState === FileReader.DONE) {
						const resImg = (evt.target as FileReader).result as ArrayBuffer;
						const bufferClone = resImg.slice(0);

						// Ensure convertedBundles[i] exists:
						if (!this.DragnDropDataService.convertedBundles[i]) {
							this.DragnDropDataService.convertedBundles[i] = {};
						}

						// Store image data:
						this.DragnDropDataService.convertedBundles[i].mediaFile = {
							encoding: "BASE64",
							type: "IMG",
							data: this.BinaryDataManipHelperService.arrayBufferToBase64(bufferClone),
						};

						// 2) Now decide if we truly have a “*_annot.json” companion:
						if (data.annotation instanceof File) {
							console.log(`[bundle ${i}] Found JSON annotation for image:`, data.annotation.name);

							const reader2 = new FileReader();
							console.log(`[bundle ${i}] → Starting readAsText for JSON annotation:`, data.annotation.name);
							reader2.readAsText(data.annotation);

							reader2.onloadend = (evt2) => {
								if ((evt2.target as FileReader).readyState === FileReader.DONE) {
									const rawText = (evt2.target as any).result;
									console.log(`[bundle ${i}] ↪ Raw JSON text loaded:\n`, rawText);

									// Parse the JSON text into a JS object:
									const parsed = angular.fromJson(rawText);
									console.log(`[bundle ${i}] ↪ Parsed image annotation object =`, parsed);

									// Attach it directly into the convertedBundles annotation slot:
									this.DragnDropDataService.convertedBundles[i].annotation = parsed;

									// Move on to the next bundle:
									this.convertDragnDropData(bundles, i + 1).then(() => {
									delete this.drandropBundles;
									this.drandropBundles = [];
									defer.resolve();
									});
								}
							};
						} else {
							// No JSON companion → create an empty placeholder exactly as before:
							const bundleName = data.img.name.substr(0, data.img.name.lastIndexOf("."));
							this.DragnDropDataService.convertedBundles[i].annotation = {
							levels: [],
							links: [],
							sampleRate: null,
							annotates: bundleName,
							name: bundleName,
							pdfAnnotations: [],
							imageAnnotations: [],
							videoAnnotations: [],
							};

							// And continue immediately to the next bundle:
							this.convertDragnDropData(bundles, i + 1).then(() => {
							delete this.drandropBundles;
							this.drandropBundles = [];
							defer.resolve();
							});
						}
					}
				};
			}
			else if (data.video !== undefined) {
				console.log(`[bundle ${i}] Detected video file:`, data.video.name);

				// 1) Read the video into a Base64 “mediaFile” field:
				reader.readAsArrayBuffer(data.video);
				reader.onloadend = (evt) => {
					if ((evt.target as FileReader).readyState === FileReader.DONE) {
						const resVideo = (evt.target as FileReader).result as ArrayBuffer;
						const bufferClone = resVideo.slice(0);

						// Ensure convertedBundles[i] exists:
						if (!this.DragnDropDataService.convertedBundles[i]) {
							this.DragnDropDataService.convertedBundles[i] = {};
						}

						// Store the video data (for display) as base64
						this.DragnDropDataService.convertedBundles[i].mediaFile = {
							encoding: "BASE64",
							type: "VIDEO",
							data: this.BinaryDataManipHelperService.arrayBufferToBase64(bufferClone),
						};

						// 2) Create a placeholder annotation object (sampleRate to be updated after audio decoding)
						const bundleName = data.video.name.substr(0, data.video.name.lastIndexOf("."));
						this.DragnDropDataService.convertedBundles[i].annotation = {
							levels: [],
							links: [],
							sampleRate: null,
							annotates: bundleName,
							name: bundleName,
							pdfAnnotations: [],
							imageAnnotations: [],
							videoAnnotations: [],
						};

						// 3) Now check if there’s a JSON annotation companion:
						if (data.annotation instanceof File) {
							console.log(`[bundle ${i}] Found JSON annotation for video:`, data.annotation.name);

							const reader2 = new FileReader();
							console.log(`[bundle ${i}] → Starting readAsText for JSON annotation:`, data.annotation.name);
							reader2.readAsText(data.annotation);

							reader2.onloadend = (evt2) => {
								if ((evt2.target as FileReader).readyState === FileReader.DONE) {
									const rawText = (evt2.target as any).result;
									console.log(`[bundle ${i}] ↪ Raw JSON text loaded:\n`, rawText);

									// Parse the JSON text into a JS object:
									const parsed = angular.fromJson(rawText);
									console.log(`[bundle ${i}] ↪ Parsed video annotation object =`, parsed);

									// Attach it directly into the convertedBundles annotation slot:
									this.DragnDropDataService.convertedBundles[i].annotation = parsed;
								}

								// 4) Decode the audio track after reading JSON (or if no JSON, proceed here)
								this.VideoParserService.parseVideoAudioBuf(bufferClone)
									.then((decodedAudioBuffer) => {
										// Store the decoded AudioBuffer in SoundHandlerService
										this.SoundHandlerService.audioBuffer = decodedAudioBuffer;
										// Update annotation sampleRate from the AudioBuffer
										this.DragnDropDataService.convertedBundles[i].annotation.sampleRate =
											decodedAudioBuffer.sampleRate;

										// Continue processing the next bundle
										this.convertDragnDropData(bundles, i + 1).then(() => {
											delete this.drandropBundles;
											this.drandropBundles = [];
											defer.resolve();
										});
									})
									.catch((error) => {
									console.error("Error decoding video audio:", error);
									this.ModalService
										.open("views/error.html", "Error decoding video audio track: " + error)
										.then(() => {
										defer.reject(error);
										});
									});
							};
						} else {
							// No JSON companion → directly decode the audio track
							this.VideoParserService.parseVideoAudioBuf(bufferClone)
							.then((decodedAudioBuffer) => {
								this.SoundHandlerService.audioBuffer = decodedAudioBuffer;
								this.DragnDropDataService.convertedBundles[i].annotation.sampleRate =
								decodedAudioBuffer.sampleRate;

								this.convertDragnDropData(bundles, i + 1).then(() => {
								delete this.drandropBundles;
								this.drandropBundles = [];
								defer.resolve();
								});
							})
							.catch((error) => {
								console.error("Error decoding video audio:", error);
								this.ModalService
								.open("views/error.html", "Error decoding video audio track: " + error)
								.then(() => {
									defer.reject(error);
								});
							});
						}
					}
				};
			} else {
					// If no recognized file type is found, skip to the next bundle.
					this.convertDragnDropData(bundles, i + 1).then(() => {
						defer.resolve();
					});
				}
		} else {
		  // No more bundles to process
		  defer.resolve();
		  return defer.promise;
		}
		
		return defer.promise;
	};
	  
	  

	/**
	* handling local file drops after loading them
	*/
	public handleLocalFiles() {
		// console.log("inside drag-n-drop.service.ts-> handleLocalFiles");
		// var ab = DragnDropDataService.convertedBundles[DragnDropDataService.sessionDefault].mediaFile.audioBuffer;
		var annotation;
		if (this.DragnDropDataService.convertedBundles[this.DragnDropDataService.sessionDefault].annotation !== undefined) {
			annotation = this.DragnDropDataService.convertedBundles[this.DragnDropDataService.sessionDefault].annotation;
		}
		else {
			annotation = {levels: [], links: [], pdfAnnotations: [], imageAnnotations: [], videoAnnotations: []};
		}
		this.ViewStateService.showDropZone = false;
		// console.log("is this where the setState is becoming loadingSaving->handleLocalFiles of drag-n-drop.service.ts");
		this.ViewStateService.setState('loadingSaving');
		// reset history
		this.ViewStateService.somethingInProgress = true;
		this.ViewStateService.somethingInProgressTxt = 'Loading local File: ' + this.DragnDropDataService.convertedBundles[this.DragnDropDataService.sessionDefault].name;
		this.IoHandlerService.httpGetPath('configFiles/standalone_emuwebappConfig.json').then((resp) => {
			// first element of perspectives is default perspective
			this.ViewStateService.curPerspectiveIdx = 0;
			this.ConfigProviderService.setVals(resp.data.EMUwebAppConfig);
			delete resp.data.EMUwebAppConfig; // delete to avoid duplicate
			var validRes;
			validRes = this.ValidationService.validateJSO('emuwebappConfigSchema', this.ConfigProviderService.vals);
			if (validRes === true) {
				// Force the array to allow objects
				let levelDefs: any[] = [];

				this.ConfigProviderService.curDbConfig = resp.data;
				this.ViewStateService.somethingInProgressTxt = 'Parsing WAV file...';
				this.ViewStateService.curViewPort.sS = 0;
				this.ViewStateService.curViewPort.eS = this.SoundHandlerService.audioBuffer?.length ?? 0;
				this.ViewStateService.curViewPort.selectS = -1 ;
				this.ViewStateService.curViewPort.selectE = -1;
				this.ViewStateService.curClickSegments = [];
				this.ViewStateService.curClickLevelName = undefined;
				this.ViewStateService.curClickLevelType = undefined;

				// console.log("Before setCurBndl-->inside the handleLocalFiles() of drag-and-drop.service.ts");
				this.LoadedMetaDataService.setCurBndl(this.DragnDropDataService.convertedBundles[this.DragnDropDataService.sessionDefault]);
				this.ViewStateService.resetSelect();
				this.ViewStateService.curPerspectiveIdx = 0;
				this.DataService.setData(annotation);
				let lNames: string[] = [];
				// var levelDefs = [];
				annotation.levels.forEach((l) => {
					if (l.type === 'SEGMENT' || l.type === 'EVENT') {
						lNames.push(l.name);
						levelDefs.push({
							'name': l.name,
							'type': l.type,
							'attributeDefinitions': {
								'name': l.name,
								'type': 'string'
							}
						});
					}
				});
				
				// set level defs
				this.ConfigProviderService.curDbConfig.levelDefinitions = levelDefs;
				this.ViewStateService.setCurLevelAttrDefs(this.ConfigProviderService.curDbConfig.levelDefinitions);
				this.ConfigProviderService.setPerspectivesOrder(this.ViewStateService.curPerspectiveIdx, lNames);
				//ConfigProviderService.vals.perspectives[ViewStateService.curPerspectiveIdx].levelCanvases.order = lNames;
				
				// set all ssff files
				this.ViewStateService.somethingInProgressTxt = 'Parsing SSFF files...';
				validRes = this.ValidationService.validateJSO('annotationFileSchema', annotation);
				if (validRes === true) {
					this.DataService.setLinkData(annotation.links);
					// console.log("is this where the setState is becoming labeling->handleLocalFiles-2 of drag-n-drop.service.ts");

					this.ViewStateService.setState('labeling');
					this.ViewStateService.somethingInProgress = false;
					this.ViewStateService.somethingInProgressTxt = 'Done!';
				} else {
					this.ModalService.open('views/error.html', 'Error validating annotation file: ' + JSON.stringify(validRes, null, 4)).then(() => {
						//AppStateService.resetToInitState();
						this.resetToInitState();
					});
				}
				// select first level
				if (!this.BrowserDetectorService.isBrowser.HeadlessChrome()){
					this.ViewStateService.selectLevel(false, this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order, this.LevelService);
				}
				
				
			}
			
		});
		this.ViewStateService.somethingInProgress = false;
	};
	
}

angular.module('emuwebApp')
.service('DragnDropService', ['$q', '$rootScope', '$window', 'ModalService', 'DataService', 'ValidationService', 'ConfigProviderService', 'DragnDropDataService', 'IoHandlerService', 'ViewStateService', 'SoundHandlerService', 'BinaryDataManipHelperService', 'BrowserDetectorService', 'WavParserService', 'TextGridParserService', 'LoadedMetaDataService', 'LevelService', 'VideoParserService','DrawHelperService' , DragnDropService]);
