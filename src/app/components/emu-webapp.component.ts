import * as angular from 'angular';

import { HierarchyWorker } from '../workers/hierarchy.worker';
import styles from '../../styles/EMUwebAppDesign.scss';
import { AuthService, IUser } from '../services/auth.service';


declare const require: any;


interface IFileMeta {
	_id:        string;
	fileName:   string;
	adminEmail: string;
  }


let EmuWebAppComponent = {
    selector: "emuwebapp",
    template: /*html*/`
 <div class="emuwebapp-main" id="MainCtrl">
		<!-- start: modal -->
		<modal></modal>
		<!-- end: modal -->
		<!-- start: hint -->
		<new-version-hint 
			ng-if="$ctrl.internalVars.showAboutHint"
			about-btn-overlay-click="$ctrl.aboutBtnClick()">
		</new-version-hint>
		<!-- end: hint -->
		<!-- start: left side menu bar -->
		<bundle-list-side-bar 
			open="$ctrl.ViewStateService.bundleListSideBarOpen">
		</bundle-list-side-bar>  
		<!-- end: left side menu bar -->
		<!-- start: main window -->
		<div class="emuwebapp-window" id="mainWindow">
			<progress-bar 
				class="emuwebapp-progressBar"
				open="$ctrl.ViewStateService.somethingInProgress"
				txt="$ctrl.ViewStateService.somethingInProgressTxt">
			</progress-bar>
			
			<div class="printTitle">
				EMU-webApp : {{$ctrl.LoadedMetaDataService.getCurBndlName()}}
			</div>
			<!-- start: top menu bar -->
			<div class="emuwebapp-top-menu">
				<button class="emuwebapp-button-icon" 
						id="bundleListSideBarOpen" 
						ng-show="$ctrl.ConfigProviderService.vals.activeButtons.openMenu" 
						ng-click="$ctrl.ViewStateService.toggleBundleListSideBar($ctrl.styles.animation.period);" 
						style="float:left">
					<i class="material-icons">menu</i>
				</button>  

				<!-- PHONETIC TRANSCRIPTION (hidden in PDF mode and JPEG mode) -->
				<div class="emuwebapp-mini-btn left" 
					ng-show="$ctrl.LoadedMetaDataService.getCurBndlName() 
							&& $ctrl.canEditAnnot
							&& ($ctrl.ConfigProviderService.vals.activeButtons.addSpeaker || $ctrl.ConfigProviderService.vals.activeButtons.renameSpeaker)
							&& $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.nonAudioDisplay && $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.JpegDisplay">
					<ul class="emuwebapp-dropdown-container">
						<li>
							<button type="button"
									class="emuwebapp-mini-btn full phonetic"
									id="phoneticTranscriptionDropdown"
									ng-mouseover="$ctrl.dropdownPhonetic = true"
									ng-mouseleave="$ctrl.dropdownPhonetic = false"
									ng-click="$ctrl.dropdownPhonetic = !$ctrl.dropdownPhonetic">
								phonetic transcription
								<span id="emuwebapp-dropdown-arrow"></span>
							</button>

							<ul class="emuwebapp-dropdown-menu" ng-mouseover="$ctrl.dropdownPhonetic = true"
								ng-mouseleave="$ctrl.dropdownPhonetic = false"
								ng-init="$ctrl.dropdownPhonetic = false"
								ng-show="$ctrl.dropdownPhonetic">
								<li class="divider"></li>
								<li ng-if="$ctrl.ConfigProviderService.vals.activeButtons.addLevelSeg"
									ng-click="($ctrl.ViewStateService.getPermission('addLevelSegBtnClick')) && $ctrl.addLevelSegBtnClick()">
									add level(SEG.) 
								</li>
								<li class="divider"></li>
								<li ng-if="$ctrl.ConfigProviderService.vals.activeButtons.addLevelEvent 
										&& !$root.isVideo"
									ng-click="($ctrl.ViewStateService.getPermission('addLevelPointBtnClick')) && $ctrl.addLevelPointBtnClick()">
								add level(EVENT)
								</li>
								<li ng-if="!$root.isVideo" class="divider"></li>
								<li ng-if="$ctrl.ConfigProviderService.vals.activeButtons.renameSelLevel"
									ng-click="($ctrl.ViewStateService.getPermission('renameSelLevelBtnClick')) && $ctrl.renameSelLevelBtnClick()">
									rename level
								</li>
								<li class="divider"></li>
							</ul>
						</li>
					</ul>
				</div>

				<!-- ORTHOGRAPHIC TRANSCRIPTION (hidden in PDF mode and JPEG mode) -->
				<div class="emuwebapp-mini-btn left" 
					ng-show="$ctrl.LoadedMetaDataService.getCurBndlName() 
							&& $ctrl.canEditAnnot
							&& ($ctrl.ConfigProviderService.vals.activeButtons.addSpeaker || $ctrl.ConfigProviderService.vals.activeButtons.renameSpeaker)
							&& $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.nonAudioDisplay && $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.JpegDisplay">
					<ul class="emuwebapp-dropdown-container">
						<li>
							<button type="button"
									class="emuwebapp-mini-btn full orthographic"
									id="orthographicTranscriptionDropdown"
									ng-mouseover="$ctrl.dropdownOrthographic = true"
									ng-mouseleave="$ctrl.dropdownOrthographic = false"
									ng-click="$ctrl.dropdownOrthographic = !$ctrl.dropdownOrthographic">
								orthographic transcription
								<span id="emuwebapp-dropdown-arrow"></span>
							</button>
							<ul class="emuwebapp-dropdown-menu"
								ng-mouseover="$ctrl.dropdownOrthographic = true"
								ng-mouseleave="$ctrl.dropdownOrthographic = false"
								ng-init="$ctrl.dropdownOrthographic = false"
								ng-show="$ctrl.dropdownOrthographic">
								<li class="divider"></li>
								<li ng-if="$ctrl.ConfigProviderService.vals.activeButtons.addSpeaker"
									ng-click="($ctrl.ViewStateService.getPermission('addSpeakerBtnClick')) && $ctrl.addSpeakerBtnClick()">
									add speaker
								</li>
								<li class="divider"></li>
								<li ng-if="$ctrl.ConfigProviderService.vals.activeButtons.renameSpeaker"
									ng-click="($ctrl.ViewStateService.getPermission('renameSpeakerBtnClick')) && $ctrl.renameSpeakerBtnClick()">
									rename speaker
								</li>
								<li class="divider"></li>
								<!-- New option for embodied actions FOR THE VIDEO-->
								<li ng-if="$root.isVideo" ng-click="($ctrl.ViewStateService.getPermission('addEmbodiedActionsBtnClick')) && $ctrl.addEmbodiedActionsBtnClick()">
									add embodied actions
								</li>
								<li ng-if="$root.isVideo" class="divider"></li>
								<!-- New option for renaming embodied actions FOR THE VIDEO -->
								<li ng-if="$root.isVideo" ng-click="($ctrl.ViewStateService.getPermission('renameEmbodiedActionsBtnClick')) && $ctrl.renameEmbodiedActionsBtnClick()">
									rename embodied actions
								</li>
								<li ng-if="$root.isVideo" class="divider"></li>
							</ul>
						</li>
					</ul>
				</div>

				<!-- SETTINGS, SEARCH, and CLEAR buttons (always enabled for PDFs AND jpeg) -->
				<!--
				<button class="emuwebapp-mini-btn left" 
						id="spectSettingsBtn" 
						ng-show="
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.labeling ||
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay || 
		  					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay || 
							$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay"							
						ng-click="$ctrl.settingsBtnClick();">
					<i class="material-icons">settings</i> settings
				</button>
				-->


				<!-- NEW: the button that will add files to the database---------------------------------->
				<!-- Το activeButtons.connect θα πρεπει να ΑΛΛΑΞΕΙ, θελουμε να εμφανιζεται μονο στον developer (κατι με τα permissions οταν φτιαξω τους διαφορετικους χρηστες της βασης) -->
				<button class="emuwebapp-mini-btn left" 
						id="addToDatabaseButton" 
						ng-show="$ctrl.canAdd && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
						ng-click="$ctrl.addToDatabaseBtnClick()">
							Add to database
				</button>

				<!-- NEW: the button that will open the files that are stored to the database---------------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="openFromDatabaseButton" 
						ng-show="$ctrl.canOpen && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
						ng-click="$ctrl.openFromDatabaseBtnClick()">
							Open from database
				</button>
	
				<!-- NEW: the button that will allow the EY to view the list of database files and delete one of them---------------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="openFromDatabaseButtonEY" 
						ng-show="$ctrl.canAdd && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
						ng-click="$ctrl.openFromDatabaseBtnClick()">
							View database files and delete
				</button>

				<!-- NEW: button that will show up only FOR THE ADMINS. It will show only their assigned files--------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="openFromDatabaseButtonForAdmins" 
						ng-show="$ctrl.openMyFiles && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
						ng-click="$ctrl.openMyFilesBtnClick()">
							Open My Files 
				</button>

				<!-- NEW: button that will show up only FOR THE RESEARCHERS. It will show only their assigned files--------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="openFromDatabaseButtonForResearchers" 
						ng-show="$ctrl.openMyResFiles && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
						ng-click="$ctrl.openMyFilesResBtnClick()">
							Open My Files 
				</button>
				
				<!-- NEW: the button that will allow the EY to specify admins for each ΣΚ---------------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="chooseAdminsButton" 
        				ng-show="$ctrl.canChooseAdmins && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
       	 				ng-click="$ctrl.chooseAdminsBtnClick()">
							Choose admins for database files
				</button>


				<!-- NEW: the button that will allow an administrator to specify researchers(Ερευνητες) for his ΣΚ---------------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="chooseResearchersButton" 
        				ng-show="$ctrl.openMyFiles && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
       	 				ng-click="$ctrl.chooseResearBtnClick()">
							Choose researchers for my files
				</button>

				<!-- NEW: the button that will allow an administrator to specify researchers(Ερευνητες) for his ΣΚ---------------------------------->
				<button class="emuwebapp-mini-btn left" 
						id="signupResearchersButton" 
        				ng-show="$ctrl.openMyFiles && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
       	 				ng-click="$ctrl.signupResearBtnClick()">
							Sign Up researchers
				</button>

				<!-- NEW: the button that will allow the admin to view which researcher is assinged to each of his ΣΚ---------------------------------->
				<!--Σε αντίθεση με τους αντίστοιχους πίνακες του ΕΥ, εδώ δεν θέλω να εμφανιστούν οι πίνακες μπροστά γιατί θέλω ο admin να μπορεί να ανοίξει κάποιο ΣΚ, οπότε οι πίνακες θα μπουν σε άλλο modal -->
				<button class="emuwebapp-mini-btn left" 
						id="viewInfoForAdminButton" 
        				ng-show="$ctrl.openMyFiles && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
       	 				ng-click="$ctrl.viewInfoAdminBtnClick()">
							View Researcher's list 
				</button>

				<!-- NEW: the button that will allow the EY to sing up admins so later he can choose them for ΣΚ----------------------->
				<button class="emuwebapp-mini-btn left" 
						id="signUpAdminsButton" 
        				ng-show="$ctrl.canChooseAdmins && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.noDBorFilesloaded"
       	 				ng-click="$ctrl.signUpAdminsBtnClick()">
							Sign up admins
				</button>
				
				<button class="emuwebapp-mini-btn left" 
						id="showHierarchy" 
						ng-click="$ctrl.showHierarchyBtnClick();" 
						ng-disabled="!$ctrl.ViewStateService.getPermission('showHierarchyBtnClick')" 
						ng-show="$ctrl.ConfigProviderService.vals.activeButtons.showHierarchy">
					<i class="material-icons" style="transform: rotate(180deg)">details</i>hierarchy
				</button>

			
				<!-- Linguistic Annotation Dropdown (PDF mode only) ------------------------------------------------------------------------------------------------------->
				<div ng-if="($ctrl.canEditAnnot || $ctrl.canOnlyViewTable) && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay" ng-controller="PdfController as pdfCtrl"class="linguistic-dropdown-container" style="display: inline-block; margin-left: 5px;">
					<div ng-if="$ctrl.canEditAnnot">
						<ul style="display: inline-block; margin: 0; padding: 0;" ng-click="$event.stopPropagation()">
							<li style="list-style: none;">
								<button type="button"
										class="emuwebapp-mini-btn left linguistic"
										style="
											height: 30px;         /* match 'Add metadata' height */
											line-height: 40px;    /* vertically center text */
											min-width: 160px;     /* bigger width */
											font-size: 14px;      /* bigger text if you like */
											cursor: pointer;
											/* Optionally override the default border or background if needed */
										"
										ng-click="pdfCtrl.dropdownLinguistic = !pdfCtrl.dropdownLinguistic">
									<i class="material-icons">edit</i>linguistic annotation
									<span id="emuwebapp-dropdown-arrow"></span>

								</button>

								<!-- The dropdown menu -->
								<ul class="emuwebapp-dropdown-menu linguistic-annotation-menu" ng-init="pdfCtrl.dropdownLinguistic = false" ng-show="pdfCtrl.dropdownLinguistic">
									
									<!-- Part of speech -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="pdfCtrl.selectLinguistic('part-of-speech'); pdfCtrl.dropdownLinguistic = false">
										<span style="font-size: 15px;">part-of-speech</span>
										
										<!-- Icons side-by-side in the same container -->
										<span style=" display: flex; align-items: center; gap: 8px; margin-left: auto;  margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="Indicates the grammatical category of a word (noun, verb, etc.)">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO:Click on the 'part-of-speech' and then select the word you want, right click on it and then choose it's part-of-speech. 	
												You can view your annotations on the table that will appear.">
												lightbulb_outline
											</i>
										</span>

									</li>
									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>

									<!--named entity recognition -->	
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="pdfCtrl.selectLinguistic('named entity recognition'); pdfCtrl.dropdownLinguistic = false;">
										<span style="font-size: 15px;">named entity recognition</span>
										
										<!-- Icons side-by-side in the same container -->
										<span style=" display: flex; align-items: center; gap: 8px; margin-left: auto;  margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="Identifies names of persons, organizations, locations, etc.">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO:Click on the 'named entity recognition' and then select the word you want, right click on it and then choose it's named entity recognition. 	
												You can view your annotations on the table that will appear.">
												lightbulb_outline
											</i>
										</span>

									</li>

									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>
									
									<!--sentiment analysis -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="pdfCtrl.selectLinguistic('sentiment analysis'); pdfCtrl.dropdownLinguistic = false;">
										<span style="font-size: 15px;">sentiment analysis</span>

										<!-- Icons side-by-side in the same container -->
										<span style=" display: flex; align-items: center; gap: 8px; margin-left: auto;  margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="Determines the emotional tone (positive, negative, neutral) of the text">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO:Click on the 'sentiment analysis' and then select the word you want, right click on it and then choose it's sentiment analysis. 	
												You can view your annotations on the table that will appear.">
												lightbulb_outline
											</i>
										</span>

									</li>

									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>

									<!--other comments -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="pdfCtrl.selectLinguistic('other comments'); pdfCtrl.dropdownLinguistic = false;">
										<span style="font-size: 15px;">other comments</span>

										<!-- Icons side-by-side in the same container -->
										<span style=" display: flex; align-items: center; gap: 8px; margin-left: auto;  margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="Add any comment about any word">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO:Click on the 'other comments' and then select the word you want, right click on it and then type your comment. 	
												You can view your comments on the table that will appear.">
												lightbulb_outline
											</i>
										</span>

									</li>

								</ul>
							</li>
						</ul>
					</div>

					<button class="emuwebapp-mini-btn left" 
						id="showPdfTable" 
						ng-show="$ctrl.canOnlyViewTable "
   					 	ng-click="$ctrl.pdfTableVisible = !$ctrl.pdfTableVisible; pdfCtrl.showAnnotationTable = $ctrl.pdfTableVisible"
						 style="
							height: 30px;
							line-height: 40px;
							min-width: 160px;
							font-size: 13px;
						">
						{{ $ctrl.pdfTableVisible  ? 'Hide' : 'Show' }} saved annotations
					</button>

					<!-- If you want the floating window to appear when user picks a mode-->
					<floating-annotation-window annotations="pdfCtrl.annotations" ng-show="$ctrl.pdfTableVisible || pdfCtrl.showAnnotationTable"  highlight="pdfCtrl.toggleHighlight(word, pdfId)"
						 delete-ann="pdfCtrl.deleteAnnotation(ann)" export="pdfCtrl.exportAnnotations()" class="pdf-annotations">
					</floating-annotation-window>

				</div>		
				
				
				<!-- Add Annotation Dropdown (JPEG mode only) ----------------------------------------------------------------------------------------->
				<div ng-if="($ctrl.canEditAnnot || $ctrl.canOnlyViewTable) && $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay" ng-controller="ImageController as imgCtrl" class="linguistic-dropdown-container" style="display: inline-block; margin-left: 5px;">
					<div ng-if="$ctrl.canEditAnnot">
						<ul style="display: inline-block; margin: 0; padding: 0;" ng-click="$event.stopPropagation()">
							<li style="list-style: none;">
								<button type="button"
										class="emuwebapp-mini-btn left linguistic"
										style="
											height: 30px;
											line-height: 40px;
											min-width: 160px;
											font-size: 14px;
											cursor: pointer;
										"
										ng-click="imgCtrl.dropdownAnnotation = !imgCtrl.dropdownAnnotation">
									<i class="material-icons">edit</i>add annotation
									<span id="emuwebapp-dropdown-arrow"></span>
								</button>

								<!-- The dropdown menu -->
								<ul class="emuwebapp-dropdown-menu linguistic-annotation-menu" ng-init="imgCtrl.dropdownAnnotation = false" ng-show="imgCtrl.dropdownAnnotation">
									
									<!-- New item: Equivalent from english alphabet -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="imgCtrl.selectAnnotation('equivalent-from-english'); imgCtrl.dropdownAnnotation = false;">
										
										<span style="font-size: 15px;">equivalent from english alphabet</span>
										<span style="display: flex; align-items: center; gap: 8px; margin-left: auto; margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" 
												title="Select an English letter equivalent.">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO: Click this option and then right-click on a symbol to choose its English letter equivalent.You can view your annotations on the table that will appear.">
												lightbulb_outline
											</i>
										</span>
									</li>

									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>

									<!-- meaning of symbol -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="imgCtrl.selectAnnotation('meaning-of-symbol'); imgCtrl.dropdownAnnotation = false;">
										
										<span style="font-size: 15px;">meaning of symbol</span>
										<span style="display: flex; align-items: center; gap: 8px; margin-left: auto; margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="Identify a single symbol and add it's meaning">
												help_outline
											</i>
											
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO: Click 'meaning of symbol,' then drag a bounding box around the symbol to annotate.You can view your annotations on the table that will appear.">
											lightbulb_outline
											</i>
										</span>
									</li>

									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>

									<!-- meaning of phrase -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="imgCtrl.selectAnnotation('meaning-of-phrase'); imgCtrl.dropdownAnnotation = false;">
										
										<span style="font-size: 15px;">meaning of phrase</span>
										<span style="display: flex; align-items: center; gap: 8px; margin-left: auto; margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;"
												title="Identify a short phrase or multiple symbols.">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO: Click 'meaning of phrase,' then drag a bounding box around a sequence of symbols.You can view your annotations on the table that will appear.">
												lightbulb_outline
											</i>
										</span>
									</li>

									<li class="divider-ling" style="width: 100%; box-sizing: border-box; margin: 4px 0; border-top: 2px solid #2b92bb;"></li>

									<!-- other comments -->
									<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; font-size: 15px; cursor: pointer;"
										ng-click="imgCtrl.selectAnnotation('other comments'); imgCtrl.dropdownAnnotation = false;">
										
										<span style="font-size: 15px;">other comments</span>
										<span style="display: flex; align-items: center; gap: 8px; margin-left: auto; margin-right: 20px;">
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;"
												title="Add a custom comment about a symbol or region.">
												help_outline
											</i>
											<i class="material-icons" style="font-size: 25px; color: #2b92bb;" title="HOW TO: Click 'other comments,' then drag a bounding box. Type your note in the popup or table.You can view your comments on the table that will appear.">
												lightbulb_outline
											</i>
										</span>
									</li>
								</ul>
							</li>
						</ul>
					</div>

					<button class="emuwebapp-mini-btn left" 
						id="showImageTable" 
						ng-show="$ctrl.canOnlyViewTable"
   					 	ng-click="$ctrl.imageTableVisible = !$ctrl.imageTableVisible; imgCtrl.showAnnotationWindow = $ctrl.imageTableVisible "
						 style="
							height: 30px;
							line-height: 40px;
							min-width: 160px;
							font-size: 13px;
						">
						{{ $ctrl.imageTableVisible ? 'Hide' : 'Show' }} saved annotations
					</button>

					<!-- Floating annotation window for image annotations -->
					<floating-image-annotation-window annotations="imgCtrl.annotations"
							ng-show="$ctrl.imageTableVisible || imgCtrl.showAnnotationWindow "
    						highlight="imgCtrl.toggleHighlight(annotation)"
							delete-ann="imgCtrl.deleteAnnotation(annotation)"
							export="imgCtrl.exportAnnotations()"
							save-crop="imgCtrl.saveCroppedSegmentForImage(annotation)"
							class="img-annotations">
					</floating-image-annotation-window>	

				</div>

				<!-- Add metadata button -->
				<button class="emuwebapp-mini-btn left" 
						id="MetadataButton" 
 						ng-show="
							$ctrl.canEditAnnot &&
          					($ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.labeling ||
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay || 
		  					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay || 
							$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay)"						
		  				ng-click="$ctrl.MetadataButtonClick();">
					<i class="material-icons">add</i>Add metadata
				</button>

				<!-- Save button + dropdown trigger ******************************************************************************-->
				<button class="emuwebapp-button-icon"
						ng-show="($ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.labeling ||
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay || 
		  					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay || 
							$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay)"
						id="saveBtn"
						style="position: absolute; top: 0; right: 100px; background: transparent;"
						ng-click="$ctrl.saveHasBeenClicked()">
				<i class="material-icons" style="font-size:35px;">save</i>
				</button>

				<!-- Save dropdown menu -->
				<div class="profile-dropdown" ng-if="$ctrl.saveMenuOpen" ng-click="$event.stopPropagation()">
					<ul>
						<li>
							<button ng-show="$ctrl.isPrivileged && $ctrl.fetchedFile" ng-click="$ctrl.saveEverythingBtnClick()">
								<i class="material-icons" style="font-size:17px;">save</i>save changes to database 
							</button>
						</li>

						<!--save _annot.json: for wav/video -->
						<li>
							<button ng-show="$ctrl.LoadedMetaDataService.getCurBndlName() && $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.nonAudioDisplay && $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.JpegDisplay" 
										ng-click="$ctrl.downloadAnnotationBtnClick();">
								<i class="material-icons" style="font-size:17px;">save</i>save annot.json 
							</button>	
						</li>

						<!--save _annot.json: for images -->
						<li>
							<button ng-controller="ImageController as imgCtrl" ng-if="$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay"
								ng-click="imgCtrl.downloadAnnotationBtnClick();">
								<i class="material-icons" style="font-size:17px;">save</i>save annot.json 
							</button>	
						</li>

						<!--save _annot.json: for pdf -->
							<li>
								<button ng-controller="PdfController as pdfCtrl" ng-if="$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay"
									ng-click="pdfCtrl.downloadAnnotationBtnClick();">									
									<i class="material-icons" style="font-size:17px;">save</i>save annot.json 
								</button>
							</li>

						<!-- add any other save‐options here -->
					</ul>
				</div>



				<button class="emuwebapp-button-icon"
						id="clear" 
						style="position: absolute; top: 0px; right: 60px; background: transparent;"
						ng-show="
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.labeling ||
          					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay || 
		  					$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay || 
							$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay"							
						ng-click="$ctrl.clearBtnClick();">
					<i class="material-icons" style="font-size:35px;">delete</i>
				</button>	

				<!-- Profile button ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-->
				<button class="emuwebapp-button-icon"
						id="userProfileBtn"
						style="position: absolute; top: 0px; right: 0.5px; background: black;"
						ng-click="$ctrl.userProfileClick()">
					<img src="assets/user-profile.png" class="_35px" alt="Profile" />
				</button>
				
				<!-- Profile drop down ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-->
				<div class="profile-dropdown" 
						ng-if="$ctrl.profileMenuOpen" 
						ng-click="$event.stopPropagation()">
					<ul>
						<li><button ng-click="$ctrl.openSettings()"><i class="material-icons" style="font-size:18px;">settings</i> Settings</button></li>
						<li><button ng-click="$ctrl.logOutBtnClick()"><i class="material-icons" style="font-size:18px;">exit_to_app</i> Log Out</button></li>
					</ul>
				</div>


			</div>
			<!-- top menu bar end -->




	

			<!-- vertical split layout that contains top and bottom pane -->
			<div class="emuwebapp-canvas" ng-if="$ctrl.user.role !== 'EY'">
				<history-action-popup class="emuwebApp-history" history-action-txt="$ctrl.ViewStateService.historyActionTxt"></history-action-popup>
				<bg-splitter show-two-dim-cans="{{$ctrl.ConfigProviderService.vals.perspectives[$ctrl.ViewStateService.curPerspectiveIdx].twoDimCanvases.order.length > 0}}" ng-class="{'noSplitBar': $ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay}" >					
					
				
					<bg-pane type="topPane" min-size="80" max-size="500">
						
						<!-- Video Display Mode ----------------------------------------------------------->
						<div ng-controller="VideoController as vidCtrl" ng-if="$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.videoDisplay" style="width: 100%; height: 100%;">
							
							<!-- Video container with fixed height (e.g., 350px) -->
							<div style="height:350px; display: flex; flex-direction: column;">
								
								
								<!-- Video area: takes up the available space -->
								<div style="flex:1; display: flex;">
									
									<!-- LEFT half for the video -------------------->
									<div style="flex: 0.8; position: relative; border: 1px solid #ccc;">
										<div  style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
											<video id="myVideo" ng-src="{{vidCtrl.videoSrc}}" style="width:100%; height:100%; object-fit: cover;">
											Your browser does not support the video tag.
											</video>
										</div>
									</div>

									<!-- RIGHT half for future content or additional info ---------------->
									<div style="flex: 1.2; position: relative; border: 1px solid #ccc;">
										<annotation-table></annotation-table>
									</div>

								</div>



								<!--Navigation Buttons Row ---------------------->
								<div style="display: flex; align-items: center; justify-content: flex-start; margin: 5px 0;">
									<!-- Zoom In Button -->
									<button class="emuwebapp-mini-btn" 
 										style="background-color: #0DC5FF; width: 80px; height: 22px; margin-right: 5px; padding: 1px 2px; font-size: 10px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #000;"											
											ng-click="vidCtrl.zoomIn()">
										<i class="material-icons" style="font-size: 20px;">expand_less</i> in
									</button>
									<!-- Zoom Out Button -->
									<button class="emuwebapp-mini-btn" 
 										style="background-color: #0DC5FF; width: 80px; height: 22px; margin-right: 5px; padding: 1px 2px; font-size: 10px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #000;"											
											ng-click="vidCtrl.zoomOut()">
										<i class="material-icons" style="font-size: 20px;">expand_more</i> out
									</button>
									<!-- Play Button -->
									<button class="emuwebapp-mini-btn" 
 										style="background-color: #0DC5FF; width: 80px; height: 22px; margin-right: 5px; padding: 1px 2px; font-size: 10px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #000;"											
											ng-click="vidCtrl.play()">
										<i class="material-icons" style="font-size: 20px;">play_arrow</i> play
									</button>
									<!-- Pause Button -->
									<button class="emuwebapp-mini-btn" 
 										style="background-color: #0DC5FF; width: 80px; height: 22px; margin-right: 5px; padding: 1px 2px; font-size: 10px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #000;"											
											ng-click="vidCtrl.pause()">
										<i class="material-icons" style="font-size: 20px;">pause</i> pause
									</button>
									<!-- Selection Button -->
									<button class="emuwebapp-mini-btn" 
 										style="background-color: #0DC5FF; width: 80px; height: 22px; margin-right: 5px; padding: 1px 2px; font-size: 10px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #000;"											
											ng-click="vidCtrl.playSelection()">
										<i class="material-icons" style="font-size: 20px; transform: rotate(90deg);">unfold_more</i> selection
									</button>
								</div>




								<!-- Progress bar row (unchanged) -->
								<div style="width: 100%; display: flex; align-items: center; margin-top: 0px;">
									<span style="margin-right: 10px; color: white;">
										{{ vidCtrl.currentTime | number:0 }} / {{ vidCtrl.duration | number:0 }}
									</span>
									<input type="range" 
											min="0" 
											max="{{vidCtrl.duration}}" 
											ng-model="vidCtrl.currentTime" 
											ng-change="vidCtrl.seek()"
											ng-model-options="{ updateOn: 'input', debounce: {'default': 0, 'blur': 0} }"
											style="flex: 1; color: white; margin-left: 0;"
									>
								</div>

								<!-- Waveform Section using interactive component -->
								<div style="position: relative; width: 100%; height: 70px; background-color: #333; margin-top: 0px;">
									<!-- Static (background) waveform canvas -->
									<canvas 
										id="videoWaveformBgCanvas" 
										style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
									</canvas>

									<!-- Overlay canvas for progress bar, crosshairs, etc. -->
									<canvas 
										id="videoWaveformOverlayCanvas" 
										style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
									</canvas>


									<!-- Left pan button -->
									<button ng-click="vidCtrl.panLeft()"
											style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%);
													z-index: 10; font-size: 15px; padding: 8px 12px; border: none; background: rgba(0,0,0,0.5); color: white;">
										&lt;
									</button>
									
									<!-- Right pan button -->
									<button ng-click="vidCtrl.panRight()"
											style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
													z-index: 10; font-size: 15px; padding: 8px 12px; border: none; background: rgba(0,0,0,0.5); color: white;">
										&gt;
									</button>


								</div>


							</div>
						</div>








						<!-- Audio Waveform Block -->
						<ul class="emuwebapp-timeline-flexcontainer"  ng-if="$ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.videoDisplay">
								
								<!-- PDF Viewer Block --------------------------------------------------------------------------------------->
								<div ng-if="$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.nonAudioDisplay"
									ng-controller="PdfController as pdfCtrl"
									style="width: 100%; height: 100%;">
									<div style="position: relative; width: 100%; height: 100%;">
										<pdf-viewer base64-pdf="pdfCtrl.pdfState.pdfData"
													current-page="pdfCtrl.pdfState.currentPage"
													pdf-scale="pdfCtrl.pdfState.pdfScale">
										</pdf-viewer>

										<!-- Floating controls for PDF -->
										<div style="position: absolute; top: 10px; right: 20px; z-index: 9999; font-size: 13px; font-weight: bold;">
											Page {{pdfCtrl.pdfState.currentPage}} of {{pdfCtrl.pdfState.totalPages}}
										</div>
										<div style="position: absolute; top: 10px; left: 10px; z-index: 9999; display: flex; gap: 8px;">
											<button ng-click="pdfCtrl.pdfState.zoomIn()"
												style="width: 30px; height: 30px; border-radius: 50%; background-color: #fff; border: 2px solid #333; font-size: 25px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #0DC5FF;">
												+
											</button>
											<button ng-click="pdfCtrl.pdfState.zoomOut()"
												style="width: 30px; height: 30px; border-radius: 50%; background-color: #fff; border: 2px solid #333; font-size: 25px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #0DC5FF;">
												-
											</button>
										</div>
										<div style="position: absolute; bottom: 10px; left: 10px; z-index: 9999;">
											<button ng-click="pdfCtrl.pdfState.prevPage()"
												style="background: transparent; border: none; font-size: 32px; font-weight: bold; color: #0DC5FF; cursor: pointer;">
												&lt;
											</button>
										</div>
										<div style="position: absolute; bottom: 10px; right: 25px; z-index: 9999;">
											<button ng-click="pdfCtrl.pdfState.nextPage()"
												style="background: transparent; border: none; font-size: 32px; font-weight: bold; color: #0DC5FF; cursor: pointer;">
												&gt;
											</button>
										</div>
									</div>
								</div>								

								<!-- Image Viewer Block ------------------------------------------------------------------------------------>
								<div ng-if="$ctrl.ViewStateService.curState === $ctrl.ViewStateService.states.JpegDisplay" ng-controller="ImageController as imgCtrl" style="width: 100%; height: 100%; position: relative;">
								
									<!-- Outer container with relative positioning -->
									<div style="position: relative; width: 100%; height: 100%;">
									
										<!-- Zoom buttons container with high z-index and pointer-events enabled -->
										<div style="position: absolute; top: 10px; left: 10px; z-index: 100000; pointer-events: auto; background: transparent; display: flex; gap: 8px;">
											<button ng-click="imgCtrl.imgState.zoomIn()"
													style="width: 30px; height: 30px; border-radius: 50%; background-color: #fff; border: 2px solid #333;
															font-size: 25px; line-height: 1; cursor: pointer; display: flex; align-items: center;
															justify-content: center; color: #0DC5FF;">
												+
											</button>
											<button ng-click="imgCtrl.imgState.zoomOut()"
													style="width: 30px; height: 30px; border-radius: 50%; background-color: #fff; border: 2px solid #333;
															font-size: 25px; line-height: 1; cursor: pointer; display: flex; align-items: center;
															justify-content: center; color: #0DC5FF;">
												-
											</button>
										</div>
											
										<!-- Image container (scrollable) -->
										<div style="position: relative; width: 100%; height: 100%; overflow: auto;">
											<image-selectable
												base64-img="imgCtrl.imgSrc"
												zoom-scale="imgCtrl.imgState.imageScale"
												on-selection="imgCtrl.handleSelection(bbox)"
												annotation-mode="imgCtrl.currentMode">
											</image-selectable>
										</div>
									</div>
								</div>

							
								<li class="emuwebapp-timeline-flexitem"
									ng-repeat="curTrack in $ctrl.ConfigProviderService.vals.perspectives[$ctrl.ViewStateService.curPerspectiveIdx].signalCanvases.order track by $index"
									ng-switch on="curTrack">

										<osci ng-switch-when="OSCI" 
											track-name="curTrack"
											cur-channel="$ctrl.ViewStateService.osciSettings.curChannel"
											last-update="$ctrl.ViewStateService.lastUpdate"
											timeline-size="$ctrl.ViewStateService.timelineSize"
											cur-perspective-idx="$ctrl.ViewStateService.curPerspectiveIdx"
											play-head-current-sample="$ctrl.ViewStateService.playHeadAnimationInfos.curS"
											moving-boundary-sample="$ctrl.ViewStateService.movingBoundarySample"
											cur-mouse-x="$ctrl.ViewStateService.curMouseX"
											moving-boundary="$ctrl.ViewStateService.movingBoundary"
											view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
											view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
											view-port-select-start="$ctrl.ViewStateService.curViewPort.selectS"
											view-port-select-end="$ctrl.ViewStateService.curViewPort.selectE"
											cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()">
										</osci>
										
										<spectro ng-switch-when="SPEC"
											track-name="curTrack"
											window-size-in-secs="$ctrl.ViewStateService.spectroSettings.windowSizeInSecs"
											range-from="$ctrl.ViewStateService.spectroSettings.rangeFrom"
											range-to="$ctrl.ViewStateService.spectroSettings.rangeTo"
											dynamic-range="$ctrl.ViewStateService.spectroSettings.dynamicRange"
											window="$ctrl.ViewStateService.spectroSettings.window"
											draw-heat-map-colors="$ctrl.ViewStateService.spectroSettings.drawHeatMapColors"
											pre-emphasis-filter-factor="$ctrl.ViewStateService.spectroSettings.preEmphasisFilterFactor"
											heat-map-color-anchors="$ctrl.ViewStateService.spectroSettings.heatMapColorAnchors"
											invert="$ctrl.ViewStateService.spectroSettings.invert"
											osci-settings="$ctrl.ViewStateService.osciSettings"
											last-update="$ctrl.ViewStateService.lastUpdate"
											moving-boundary-sample="$ctrl.ViewStateService.movingBoundarySample"
											cur-mouse-x="$ctrl.ViewStateService.curMouseX"
											cur-mouse-y="$ctrl.ViewStateService.curMouseY"
											view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
											view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
											view-port-select-start="$ctrl.ViewStateService.curViewPort.selectS"
											view-port-select-end="$ctrl.ViewStateService.curViewPort.selectE"
											cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()">
										</spectro>

										<ssff-track ng-switch-default
												order="{{$index}}"
												track-name="curTrack"
												cur-mouse-x="$ctrl.ViewStateService.curMouseX"
												cur-mouse-y="$ctrl.ViewStateService.curMouseY"
												view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
												view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
												view-port-select-start="$ctrl.ViewStateService.curViewPort.selectS"
												view-port-select-end="$ctrl.ViewStateService.curViewPort.selectE">
										</ssff-track>

								
								</li>
						</ul>
						
					</bg-pane>

					

					
					<!-- Bottom Pane: Level / Hierarchy Canvas (unchanged) -->
					<bg-pane type="bottomPane" min-size="80">
					<div style="margin-top: 25px;">
						<hierarchy-path-canvas 
						ng-if="$ctrl.ViewStateService.getPermission('zoom') && $ctrl.ConfigProviderService.curDbConfig.linkDefinitions.length > 0 && $ctrl.showHierarchyPathCanvas()"
						annotation="$ctrl.DataService.getData()"
						path="$ctrl.ViewStateService.hierarchyState.path"
						view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
						view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
						view-port-select-start="$ctrl.ViewStateService.curViewPort.selectS"
						view-port-select-end="$ctrl.ViewStateService.curViewPort.selectE"
						cur-mouse-x="$ctrl.ViewStateService.curMouseX"
						cur-click-level-name="$ctrl.ViewStateService.curClickLevelName"
						moving-boundary-sample="$ctrl.ViewStateService.movingBoundarySample"
						moving-boundary="$ctrl.ViewStateService.movingBoundary"
						moves-away-from-last-save="$ctrl.HistoryService.movesAwayFromLastSave"
						cur-perspective-idx="$ctrl.ViewStateService.curPerspectiveIdx"
						cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()">
						</hierarchy-path-canvas>
					</div>
					<div style="margin-top: 25px;">
						<ul>
						<li ng-repeat="levelName in $ctrl.ConfigProviderService.vals.perspectives[$ctrl.ViewStateService.curPerspectiveIdx].levelCanvases.order">
							<level 
							ng-if="$ctrl.LevelService.getLevelDetails(levelName)"
							level="$ctrl.LevelService.getLevelDetails(levelName)" 
							idx="$index"
							view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
							view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
							view-port-select-start="$ctrl.ViewStateService.curViewPort.selectS"
							view-port-select-end="$ctrl.ViewStateService.curViewPort.selectE"
							cur-mouse-x="$ctrl.ViewStateService.curMouseX"
							cur-click-level-name="$ctrl.ViewStateService.curClickLevelName"
							moving-boundary-sample="$ctrl.ViewStateService.movingBoundarySample"
							moving-boundary="$ctrl.ViewStateService.movingBoundary"
							moves-away-from-last-save="$ctrl.HistoryService.movesAwayFromLastSave"
							cur-perspective-idx="$ctrl.ViewStateService.curPerspectiveIdx"
							cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()">
							</level>
						</li>
						</ul>
					</div>
					</bg-pane>
					
					<!-- 2D Map Pane (unchanged) -->
					<bg-pane type="emuwebapp-2d-map">
					<ul>
						<li ng-repeat="cur2dTrack in $ctrl.ConfigProviderService.vals.perspectives[$ctrl.ViewStateService.curPerspectiveIdx].twoDimCanvases.order" ng-switch on="cur2dTrack">
						<epg-grid-canvas 
							ng-switch-when="EPG"
							cur-mouse-pos-sample="$ctrl.ViewStateService.curMousePosSample"
							view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
							view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS">
						</epg-grid-canvas>
						<dots-canvas 
							ng-switch-when="DOTS"
							cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()"
							cur-perspective-idx="$ctrl.ViewStateService.curPerspectiveIdx"
							cur-mouse-pos-sample="$ctrl.ViewStateService.curMousePosSample"
							view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
							view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS">
						</dots-canvas>
						</li>
					</ul>
					</bg-pane>
					
				</bg-splitter>  
			</div>
			<!-- end: vertical split layout -->

			<!--*******************************************************************************************************************  -->
			<!-- replace your two floats with one flex container -->
			<div ng-if="$ctrl.user.role === 'EY'" style=" display: flex; height: calc(100% - 50px); ">
  				
				<!-- BIG table, takes 70% of the space -->
  				<div style=" flex: 6;               /* 70% of the total (7 / (7+3)) */
      					overflow-y: auto;
      					border-right: 2px solid #0DC5FF;
      					background: #303030;">
    				
					<infofor-e-y></infofor-e-y>
 		 		</div>

  				<!-- SMALLER admin list, takes 30% -->
  				<div style="
      					flex: 3;               /* 30% of the total */
      					overflow-y: auto;
      					background: #303030;">
    				
					<admins-listfor-e-y></admins-listfor-e-y>
  				</div>
			</div>

	
			<!--*******************************************************************************************************************  -->
			<!-- start: bottom menu bar -->
            <div class="emuwebapp-bottom-menu"  ng-if="(
         			$ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.nonAudioDisplay
         			&& $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.JpegDisplay
         			&& $ctrl.ViewStateService.curState !== $ctrl.ViewStateService.states.videoDisplay)     &&		
						$ctrl.user.role !== 'EY'
					">
                <div>
                    <osci-overview class="preview" 
					id="preview"
					cur-channel="$ctrl.ViewStateService.osciSettings.curChannel"
					view-port-sample-start="$ctrl.ViewStateService.curViewPort.sS"
					view-port-sample-end="$ctrl.ViewStateService.curViewPort.eS"
					cur-bndl="$ctrl.LoadedMetaDataService.getCurBndl()"
					></osci-overview>
                </div>

                <button class="emuwebapp-mini-btn left"
                id="zoomInBtn" 
                ng-click="$ctrl.cmdZoomIn();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons">expand_less</i>in</button>
                
                <button class="emuwebapp-mini-btn left"
                id="zoomOutBtn" 
                ng-click="$ctrl.cmdZoomOut();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons">expand_more</i>out</button>
                
                <button class="emuwebapp-mini-btn left"
                id="zoomLeftBtn" 
                ng-click="$ctrl.cmdZoomLeft();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons">chevron_left</i>left</button>
                
                <button class="emuwebapp-mini-btn left"
                id="zoomRightBtn" 
                ng-click="$ctrl.cmdZoomRight();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons">chevron_right</i>right</button>
                
                <button class="emuwebapp-mini-btn left"
                id="zoomAllBtn" 
                ng-click="$ctrl.cmdZoomAll();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons" style="transform: rotate(90deg)">unfold_less</i>all</button>

                <button class="emuwebapp-mini-btn left"
                id="zoomSelBtn" 
                ng-click="$ctrl.cmdZoomSel();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('zoom')"><i class="material-icons" style="transform: rotate(90deg)">unfold_more</i>selection</button>
                
                <button class="emuwebapp-mini-btn left"
                id="playViewBtn" 
                ng-show="$ctrl.ConfigProviderService.vals.restrictions.playback" 
                ng-click="$ctrl.cmdPlayView();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('playaudio')" ><i class="material-icons">play_arrow</i>in view</button>
                
                <button class="emuwebapp-mini-btn left"
                id="playSelBtn" 
                ng-show="$ctrl.ConfigProviderService.vals.restrictions.playback" 
                ng-click="$ctrl.cmdPlaySel();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('playaudio')"><i class="material-icons">play_circle_outline</i>selected</button>
                
                <button class="emuwebapp-mini-btn left"
                id="playAllBtn" 
                ng-show="$ctrl.ConfigProviderService.vals.restrictions.playback" 
                ng-click="$ctrl.cmdPlayAll();" 
                ng-disabled="!$ctrl.ViewStateService.getPermission('playaudio')"><i class="material-icons">play_circle_filled</i>entire file</button>
            </div>
            <!-- end: bottom menu bar -->

			<!-- start: large text input field -->
			<!--<large-text-field-input></large-text-field-input>-->

			<!-- start: perspectives menu bar (right) -->
			<perspectives-side-bar></perspectives-side-bar>
			<!-- end: perspectives menu bar (right) -->
		</div>
		<!-- end: main window -->
	</div>
	<!-- end: container EMU-webApp -->


    `,
    bindings: {
        audioGetUrl: '<',
        labelGetUrl: '<',
        labelType: '<'
    },
    controller: [
		'$scope',
		'$element',
		'$window',
		'$document',
		'$location',
		'$timeout',
		'$http',
		'ViewStateService',  
		'AuthService',
		'HistoryService',
		'IoHandlerService',
		'SoundHandlerService',
		'ConfigProviderService',
		'FontScaleService',
		'SsffDataService',
		'LevelService',
		'TextGridParserService',
		'WavParserService',
		'DrawHelperService',
		'ValidationService',
		'AppcacheHandlerService',
		'LoadedMetaDataService',
		'DbObjLoadSaveService',
		'AppStateService',
		'DataService',
		'ModalService',
		'BrowserDetectorService',
		'HierarchyLayoutService',
		'HandleGlobalKeyStrokes',
		'AnnotationService',
		class EmuWebAppController{
        private $scope;
        private $element;
        private $window;
        private $document;
		private $location;
		private $timeout;
		private $http;
		private canEditAnnot: boolean;
		private canAdd: boolean;	
		private canChooseAdmins: boolean;
		private openMyFiles: boolean;
		private canOpen : boolean;
		private openMyResFiles: boolean;
		private canOnlyViewTable : boolean;
		private profileMenuOpen: boolean = false;
		public pdfTableVisible: boolean = false;
		public imageTableVisible: boolean = false;
		public saveMenuOpen: boolean = false;
		private ViewStateService;
        private HistoryService;
        private IoHandlerService;
        private SoundHandlerService;
        private ConfigProviderService;
        private FontScaleService;
        private SsffDataService;
        private LevelService;
        private TextGridParserService;
        private WavParserService;
        private DrawHelperService;
        private ValidationService;
        private AppcacheHandlerService;
        private LoadedMetaDataService;
        private DbObjLoadSaveService;
        private AppStateService;
        private DataService;
        private ModalService;
        private BrowserDetectorService;
		private HierarchyLayoutService;
		private HandleGlobalKeyStrokes;
		private AnnotationService;

        // init vars
		private connectBtnLabel;
		private dbLoaded;
		private is2dCancasesHidden;
		private windowWidth;
		private internalVars;

        private dropdown;
		private dropdownPhonetic;
		private dropdownOrthographic;
		private dropdownSaveButton;

		// private xTmp;
		// private yTmp;

        private _inited;
		
		public recordingName: string; 						// Define the recordingName property
		public user: IUser | null = null;
		public	isPrivileged: any;
		public	isSimpleDrag: any;
		public dragedFile: any;
		public fetchedFile:any;


		// // Add these NEW properties here
		// public currentDocumentUrl: string = '';
		// public isPdfFile: boolean = false;

        constructor(
            $scope,
            $element,
            $window,
            $document,
			$location,
			$timeout,
			$http,  
            ViewStateService,
			private authService: AuthService,
            HistoryService,
            IoHandlerService,
            SoundHandlerService,
            ConfigProviderService,
            FontScaleService,
            SsffDataService,
            LevelService,
            TextGridParserService,
            WavParserService,
            DrawHelperService,
            ValidationService,
            AppcacheHandlerService,
            LoadedMetaDataService,
            DbObjLoadSaveService,
            AppStateService,
            DataService,
            ModalService,
            BrowserDetectorService,
			HierarchyLayoutService,
			HandleGlobalKeyStrokes,
			AnnotationService){
            
                this.$scope = $scope;
                this.$element = $element;
                this.$window = $window;
                this.$document = $document;
				this.$location = $location;
				this.$timeout = $timeout;
				this.$http = $http;
                this.ViewStateService = ViewStateService;
                this.HistoryService = HistoryService;
                this.IoHandlerService = IoHandlerService;
                this.SoundHandlerService = SoundHandlerService;
                this.ConfigProviderService = ConfigProviderService;
                this.FontScaleService = FontScaleService;
                this.SsffDataService = SsffDataService;
                this.LevelService = LevelService;
                this.TextGridParserService = TextGridParserService;
                this.WavParserService = WavParserService;
                this.DrawHelperService = DrawHelperService;
                this.ValidationService = ValidationService;
                this.AppcacheHandlerService = AppcacheHandlerService;
                this.LoadedMetaDataService = LoadedMetaDataService;
                this.DbObjLoadSaveService = DbObjLoadSaveService;
                this.AppStateService = AppStateService;
                this.DataService = DataService;
                this.ModalService = ModalService;
                this.BrowserDetectorService = BrowserDetectorService;
                this.HierarchyLayoutService = HierarchyLayoutService;
				this.HandleGlobalKeyStrokes = HandleGlobalKeyStrokes;
				this.AnnotationService = AnnotationService;

				this.dropdownPhonetic = false;
				this.dropdownOrthographic = false;
				this.dropdownSaveButton = false;

            	// init vars
		        this.connectBtnLabel = 'connect';
                // this.tmp = {};
                this.dbLoaded = false;
                this.is2dCancasesHidden = true;
                this.windowWidth = $window.outerWidth;
                this.internalVars = {};
                this.internalVars.showAboutHint = false;// this should probably be moved to ViewStateService

                // this.xTmp = 123;
                // this.yTmp = 321;
                // check for new version
                this.AppcacheHandlerService.checkForNewVersion();

            	// check if URL parameters are set -> if so set embedded flags! SIC this should probably be moved to loadFilesForEmbeddedApp
		        var searchObject = this.$location.search();
                if (searchObject.audioGetUrl && searchObject.labelGetUrl && searchObject.labelType) {
                    ConfigProviderService.embeddedVals.audioGetUrl = searchObject.audioGetUrl;
                    ConfigProviderService.embeddedVals.labelGetUrl = searchObject.labelGetUrl;
                    ConfigProviderService.embeddedVals.labelType = searchObject.labelType;
                    ConfigProviderService.embeddedVals.fromUrlParams = true;
                }

                // call function on init
		        this.loadDefaultConfig();

				// bind keys
				this.HandleGlobalKeyStrokes.bindGlobalKeys();	
				
				// inside your constructor, after `this.authService = authService;` etc.
				this.$scope.$watch(
				// watch the file origin (and user if you like)
				() => this.authService.getFileOrigin(),
				(origin: string|null) => {
						const u = this.authService.getUser();
						this.user = u;

						// recompute exactly the same flags you had before
						const isPrivileged = !!u && (u.role==='administrator' || u.role==='researcher');
						const dragedFile = !!u && origin==='drag-n-droped';
						const fetchedFile = !!u && origin==='fetched-from-database';
						const isSimpleDrag = !!u && u.role==='simple' && origin==='drag-n-droped';
						const isSimpleFetch = !!u && u.role==='simple' && origin==='fetched-from-database';


						this.isPrivileged   = isPrivileged;               // ← add this
						this.canEditAnnot    = isPrivileged || isSimpleDrag;
						this.dragedFile 	= dragedFile;
						this.fetchedFile 	= fetchedFile;
						this.canOpen         = !!u && (u.role==='EY' || u.role==='simple' || u.role==='programmer') && !(u.role==='EY' || u.role === 'programmer');
						this.canAdd          = !!u && (u.role==='EY' || u.role==='programmer') ;
						this.canChooseAdmins = !!u && u.role==='EY';
						this.openMyFiles     = !!u && u.role==='administrator';
						this.openMyResFiles  = !!u && u.role==='researcher';
						this.canOnlyViewTable =  isSimpleFetch;

						console.log(
							'isPrivileged',				this.isPrivileged,	
							'dragedFile',				this.dragedFile,
							'flags → canEditAnnot:',   	this.canEditAnnot,
							'canOpen:',                 this.canOpen,
							'canAdd:',                  this.canAdd,
							'canChooseAdmins:',         this.canChooseAdmins,
							'openMyFiles:',             this.openMyFiles,
							'openMyResFiles:',          this.openMyResFiles,
							'origin:',                  origin,
							'canOnlyViewTable:',		this.canOnlyViewTable
						);
					}
				);			

        };

        $postLink = function(){
            ////////////////////////
            // Bindings
            this.$element.bind('mouseenter', () => {
                this.ViewStateService.mouseInEmuWebApp = true;

            });

            this.$element.bind('mouseleave', () => {
                this.ViewStateService.mouseInEmuWebApp = false;
            });
            
            // bind window resize event
            angular.element(this.$window).bind('resize', () => {
                this.LevelService.deleteEditArea();
                this.ViewStateService.setWindowWidth(this.$window.outerWidth);
                if (this.ViewStateService.hierarchyState.isShown()) {
                    ++this.ViewStateService.hierarchyState.resize;
				}
                this.$scope.$digest();
            });

            // bind shift/alt keyups for history
            angular.element(this.$window).bind('keyup', (e) => {
				if(typeof this.ConfigProviderService.vals.keyMappings !== 'undefined'){ // check if loaded
					if (e.keyCode === this.ConfigProviderService.vals.keyMappings.shift || e.keyCode === this.ConfigProviderService.vals.keyMappings.alt) {
						this.HistoryService.addCurChangeObjToUndoStack();
						this.$scope.$digest();
					}
				}
            });

            // bind focus check for mouse on window and document ( mouse inside )
            angular.element(this.$window).bind('blur', () => {
                this.ViewStateService.focusOnEmuWebApp = false;
            });

            // bind focus check for mouse on window and document ( mouse inside )
            angular.element(this.$document).bind('blur', () => {
                this.ViewStateService.focusOnEmuWebApp = false;
            });

            // bind blur check for mouse on window and document ( mouse outside )
            angular.element(this.$window).bind('focus', () => {
                this.ViewStateService.focusOnEmuWebApp = true;
            });

            // bind blur check for mouse on window and document ( mouse outside )
            angular.element(this.$document).bind('focus', () => {
                this.ViewStateService.focusOnEmuWebApp = true;
            });

            // Take care of preventing navigation out of app (only if something is loaded, not in embedded mode and not developing (auto connecting))
            window.onbeforeunload = () => {
                if (this.ConfigProviderService.embeddedVals.audioGetUrl === '' && 
                this.LoadedMetaDataService.getBundleList().length > 0 && 
                !this.ConfigProviderService.vals.main.autoConnect && 
                this.HistoryService.movesAwayFromLastSave > 0) {
                    return 'Do you really wish to leave/reload the EMU-webApp? All unsaved changes will be lost...';
                }
            };

            /////////////
            // listens

			// listen for connectionDisrupted event -> I don't like listens but in this case it might me the way to go...
			let _this = this;

            this.$scope.$on('connectionDisrupted', () => {
                _this.AppStateService.resetToInitState();
            });

            // listen for resetToInitState
            this.$scope.$on('resetToInitState', () => {
                _this.loadDefaultConfig();
            });
            
            this.$scope.$on('reloadToInitState', (event, data) => {
                _this.loadDefaultConfig();
                _this.ViewStateService.url = data.url;
                _this.ViewStateService.somethingInProgressTxt = 'Connecting to server...';
                _this.ViewStateService.somethingInProgress = true;
                _this.IoHandlerService.WebSocketHandlerService.initConnect(data.url).then((message) => {
                    if (message.type === 'error') {
                        _this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + data.url).then(() => {
                            _this.AppStateService.resetToInitState();
                        });
                    } else {
                        _this.handleConnectedToWSserver(data);
                    }
                }, (errMess) => {
                    _this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + JSON.stringify(errMess, null, 4)).then(() => {
                        _this.AppStateService.resetToInitState();
                    });
                });
            });

			//so we could trigger the search through database button from the bundlelist sidebar component
			this.$scope.$on('openDatabaseSearch', () => {
			this.searchDatabaseBtnClick();
			});

        };
        
        $onChanges = function (changes) {
            if(this._inited){
                //
                if(changes.audioGetUrl){
                    this.ConfigProviderService.embeddedVals.audioGetUrl = changes.audioGetUrl.currentValue;
                }
                //
                if(changes.labelGetUrl){
                    this.ConfigProviderService.embeddedVals.labelGetUrl = changes.labelGetUrl.currentValue;
                }
                //
                if(changes.labelType){
                    this.ConfigProviderService.embeddedVals.labelType = changes.labelGetUrl.currentValue;
                }
            }
        };
        
		$onInit = function() {
			
			// if this page load was a full refresh, kick back to login   
			//This uses the Performance API to get an array of all navigation entries, which describe how the page was loaded, and then we grab the last entry,the reload entry, if it is the last one (the last thing that happened)
			if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
				this.AppStateService.resetToInitState();
				this.$location.path('../../views/login.html');
				return;
			}

			this._inited = true;
			
			
		};
		

        /**
		 *
		 */
		private loadFilesForEmbeddedApp() {
            var searchObject = this.$location.search();
			if (searchObject.audioGetUrl || searchObject.bndlJsonGetUrl) {
				if(searchObject.audioGetUrl){
                    this.ConfigProviderService.embeddedVals.audioGetUrl = searchObject.audioGetUrl;
                    this.ConfigProviderService.vals.activeButtons.openDemoDB = false;
                    var promise = this.IoHandlerService.httpGetPath(
                    	this.ConfigProviderService.embeddedVals.audioGetUrl,
						'arraybuffer'
					);
				}else{
                    var promise = this.IoHandlerService.httpGetPath(searchObject.bndlJsonGetUrl, "application/json");
				}

				promise.then((data) => {
					this.ViewStateService.showDropZone = false;
					// set bundle name
					var tmp = this.ConfigProviderService.embeddedVals.audioGetUrl;
					this.LoadedMetaDataService.setCurBndlName(tmp.substr(0, tmp.lastIndexOf('.')).substr(tmp.lastIndexOf('/') + 1, tmp.length));

					//hide menu
					if (this.ViewStateService.getBundleListSideBarOpen()) {
						if(searchObject.saveToWindowParent !== "true"){
							this.ViewStateService.toggleBundleListSideBar(styles.animationPeriod);
						}
					}

					this.ViewStateService.somethingInProgressTxt = 'Loading DB config...';

					// test if DBconfigGetUrl is set if so use it
					var DBconfigGetUrl;
					if (searchObject.DBconfigGetUrl){
						DBconfigGetUrl = searchObject.DBconfigGetUrl;
					}else{
						DBconfigGetUrl = 'configFiles/embedded_emuwebappConfig.json';
					}
					
					// then get the DBconfigFile
					this.IoHandlerService.httpGetPath(DBconfigGetUrl).then(async (resp) => {
						// first element of perspectives is default perspective
						this.ViewStateService.curPerspectiveIdx = 0;
						this.ConfigProviderService.setVals(resp.data.EMUwebAppConfig);
						// validate emuwebappConfigSchema
						var validRes = this.ValidationService.validateJSO('emuwebappConfigSchema', this.ConfigProviderService.vals);
						if (validRes === true) {
							// turn of keybinding only on mouseover
							if (this.ConfigProviderService.embeddedVals.fromUrlParams) {
								this.ConfigProviderService.vals.main.catchMouseForKeyBinding = false;
							}

							this.ConfigProviderService.curDbConfig = resp.data;
							
							// validate DBconfigFileSchema!
							validRes = this.ValidationService.validateJSO('DBconfigFileSchema', this.ConfigProviderService.curDbConfig);
							
							if (validRes === true) {
								if(searchObject.saveToWindowParent === "true"){
									this.ConfigProviderService.vals.activeButtons.saveBundle = true;
								}
								var bndlList = [{'session': 'File(s)', 'name': 'from URL parameters'}];
								this.LoadedMetaDataService.setBundleList(bndlList);
								this.LoadedMetaDataService.setCurBndl(bndlList[0]);

								// set wav file
								this.ViewStateService.somethingInProgress = true;
								this.ViewStateService.somethingInProgressTxt = 'Parsing WAV file...';

								if(searchObject.audioGetUrl){
									this.WavParserService.parseWavAudioBuf(data.data).then((messWavParser) => {
										var audioBuffer = messWavParser;
										this.ViewStateService.curViewPort.sS = 0;
										this.ViewStateService.curViewPort.eS = audioBuffer.length;
										this.ViewStateService.resetSelect();
										this.SoundHandlerService.audioBuffer = audioBuffer;

										var respType;
										if(this.ConfigProviderService.embeddedVals.labelType === 'TEXTGRID'){
											respType = 'text';
										}else{
											// setting everything to text because the BAS webservices somehow respond with a
											// 200 (== successful response) but the data field is empty
											respType = 'text';
										}
										// get + parse file
										if(searchObject.labelGetUrl){
											this.IoHandlerService.httpGetPath(this.ConfigProviderService.embeddedVals.labelGetUrl, respType).then((data2) => {
												this.ViewStateService.somethingInProgressTxt = 'Parsing ' + this.ConfigProviderService.embeddedVals.labelType + ' file...';
												this.IoHandlerService.parseLabelFile(data2.data, this.ConfigProviderService.embeddedVals.labelGetUrl, 'embeddedTextGrid', this.ConfigProviderService.embeddedVals.labelType).then(async (parseMess) => {

													var annot = parseMess;
													this.DataService.setData(annot);

													// if no DBconfigGetUrl is given generate levelDefs and co. from annotation
													if (!searchObject.DBconfigGetUrl){

														let lNames: string[] = [];
														let levelDefs: any[] = [];
														for(var i = 0, len = annot.levels.length; i < len; i++){
															var l = annot.levels[i];
															lNames.push(l.name);
															let attrDefs: any[] = [];
															for(var j = 0, len2 = l.items[0].labels.length; j < len2; j++){
																attrDefs.push({
																	'name': l.items[0].labels[j].name,
																	'type': 'string'
																});
															}
															levelDefs.push({
																'name': l.name,
																'type': l.type,
																'attributeDefinitions': attrDefs
															})
														}

														this.ConfigProviderService.curDbConfig.levelDefinitions = levelDefs;
														this.ViewStateService.setCurLevelAttrDefs(this.ConfigProviderService.curDbConfig.levelDefinitions);
														// extract levels containing time to display as levelCanvases 
														let lNamesWithTime = [] as any;

														levelDefs.forEach((ld) => {
															if(ld.type !== 'ITEM'){
																lNamesWithTime.push(ld.name)
															}
														})
														this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order = lNamesWithTime;

														let hierarchyWorker = await new HierarchyWorker();
														let linkDefs = await hierarchyWorker.guessLinkDefinitions(annot);
														this.ConfigProviderService.curDbConfig.linkDefinitions = linkDefs;
														this.ConfigProviderService.vals.activeButtons.showHierarchy = true;

													}

													this.ViewStateService.setCurLevelAttrDefs(this.ConfigProviderService.curDbConfig.levelDefinitions);

													this.ViewStateService.somethingInProgressTxt = 'Done!';
													this.ViewStateService.somethingInProgress = false;
													this.ViewStateService.setState('labeling');

												}, function (errMess) {
													this.ModalService.open('views/error.html', 'Error parsing wav file: ' + errMess.status.message);
												});

											}, function (errMess) {
												this.ModalService.open('views/error.html', 'Could not get label file: ' + this.ConfigProviderService.embeddedVals.labelGetUrl + ' ERROR ' + JSON.stringify(errMess.message, null, 4));
											});
										}else{
											// hide download + search buttons
											this.ConfigProviderService.vals.activeButtons.downloadAnnotation = false;
											this.ConfigProviderService.vals.activeButtons.downloadTextGrid = false;
											this.ConfigProviderService.vals.activeButtons.search = false;
											this.ViewStateService.somethingInProgressTxt = 'Done!';
											this.ViewStateService.somethingInProgress = false;
											this.ViewStateService.setState('labeling');
										}


									}, function (errMess) {
										this.ModalService.open('views/error.html', 'Error parsing wav file: ' + errMess.status.message);
									});
                                }else{
                                    this.DbObjLoadSaveService.loadBundle({name: 'fromURLparams'}, searchObject.bndlJsonGetUrl);
								}

							} else {
								this.ModalService.open('views/error.html', 'Error validating / checking DBconfig: ' + JSON.stringify(validRes, null, 4));
							}
						} else {
							this.ModalService.open('views/error.html', 'Error validating ConfigProviderService.vals (emuwebappConfig data) after applying changes of newly loaded config (most likely due to wrong entry...): ' + JSON.stringify(validRes, null, 4));
						}

					}, (errMess) => {
						this.ModalService.open('views/error.html', 'Could not get embedded_config.json: ' + errMess);
					});
				}, (errMess) => {
					this.ModalService.open('views/error.html', 'Could not get audio file:' + this.ConfigProviderService.embeddedVals.audioGetUrl + ' ERROR: ' + JSON.stringify(errMess, null, 4));
				});
			}
		};

		/**
		 * init load of config files
		 */
		private loadDefaultConfig() {
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.somethingInProgressTxt = 'Loading schema files';
			// load schemas first
			this.ValidationService.loadSchemas().then((replies) => {
				this.ValidationService.setSchemas(replies);
				this.IoHandlerService.httpGetDefaultConfig().then((response) => {
					this.ViewStateService.somethingInProgressTxt = 'Validating emuwebappConfig';
					var validRes = this.ValidationService.validateJSO('emuwebappConfigSchema', response.data);
					if (validRes === true) {
						this.ConfigProviderService.setVals(response.data);
						angular.copy(this.ConfigProviderService.vals, this.ConfigProviderService.initDbConfig);
						this.handleDefaultConfigLoaded();
						// loadFilesForEmbeddedApp if these are set
						this.loadFilesForEmbeddedApp();
						this.checkIfToShowWelcomeModal();
						// FOR DEVELOPMENT
						// $scope.aboutBtnClick();
						// this.openDemoDBbtnClick("ema");
						this.ViewStateService.somethingInProgress = false;
					} else {
						this.ModalService.open('views/error.html', 'Error validating / checking emuwebappConfigSchema: ' + JSON.stringify(validRes, null, 4)).then(() => {
							this.AppStateService.resetToInitState();
						});
					}

				}, (response) => { // onError
					this.ModalService.open('views/error.html', 'Could not get defaultConfig for EMU-webApp: ' + ' status: ' + response.status + ' headers: ' + response.headers + ' config ' + response.config).then(() => {
						this.AppStateService.resetToInitState();
					});
				});

			}, (errMess) => {
				this.ModalService.open('views/error.html', 'Error loading schema file: ' + JSON.stringify(errMess, null, 4)).then(() => {
					this.AppStateService.resetToInitState();
				});
			});
		};

		private checkIfToShowWelcomeModal() {
			var curVal = localStorage.getItem('haveShownWelcomeModal');
            var searchObject = this.$location.search();

			if (!this.BrowserDetectorService.isBrowser.PhantomJS() && curVal === null && typeof searchObject.viewer_pane !== 'undefined') {
				localStorage.setItem('haveShownWelcomeModal', 'true');
				this.internalVars.showAboutHint = true;
			}

			// FOR DEVELOPMENT
			// this.internalVars.showAboutHint = true;
			// set timerout
			if(this.internalVars.showAboutHint){
				this.$timeout(() => {
					this.internalVars.showAboutHint = false;
				}, 3000)
			}

		};

		private getCurBndlName() {
			console.log("the getCurBndlName has been called");
			console.log("this.LoadedMetaDataService.getCurBndlName()");
			return this.LoadedMetaDataService.getCurBndlName();
		};

		/**
		 * function called after default config was loaded
		 */
		private handleDefaultConfigLoaded() {

			if (!this.ViewStateService.getBundleListSideBarOpen()) {
				this.ViewStateService.toggleBundleListSideBar(styles.animationPeriod);
			}
			// check if either autoConnect is set in DBconfig or as get parameter
			var searchObject = this.$location.search();

			if (this.ConfigProviderService.vals.main.autoConnect || searchObject.autoConnect === 'true') {
				if (typeof searchObject.serverUrl !== 'undefined') { // overwrite serverUrl if set as GET parameter
					this.ConfigProviderService.vals.main.serverUrl = searchObject.serverUrl;
				}
				if(searchObject.comMode !== "GITLAB"){
					// sic IoHandlerService.WebSocketHandlerService is private!
					this.IoHandlerService.WebSocketHandlerService.initConnect(this.ConfigProviderService.vals.main.serverUrl).then((message) => {
						if (message.type === 'error') {
							this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + this.ConfigProviderService.vals.main.serverUrl).then(() => {
							this.AppStateService.resetToInitState();
						});
						} else {
							this.handleConnectedToWSserver({session: null, reload: null});
						}
					}, function (errMess) {
						this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + JSON.stringify(errMess, null, 4)).then(() => {
							this.AppStateService.resetToInitState();
						});
					});
				} else {
					// set comMode and pretend we are connected to server
					// the IoHandlerService will take care of the rest
					this.ConfigProviderService.vals.main.comMode = "GITLAB";
					this.handleConnectedToWSserver({session: null, reload: null});
				}
			}

			// setspectroSettings
			this.ViewStateService.setspectroSettings(this.ConfigProviderService.vals.spectrogramSettings.windowSizeInSecs,
				this.ConfigProviderService.vals.spectrogramSettings.rangeFrom,
				this.ConfigProviderService.vals.spectrogramSettings.rangeTo,
				this.ConfigProviderService.vals.spectrogramSettings.dynamicRange,
				this.ConfigProviderService.vals.spectrogramSettings.window,
				this.ConfigProviderService.vals.spectrogramSettings.drawHeatMapColors,
				this.ConfigProviderService.vals.spectrogramSettings.preEmphasisFilterFactor,
				this.ConfigProviderService.vals.spectrogramSettings.heatMapColorAnchors,
				this.ConfigProviderService.vals.spectrogramSettings.invert);

			// setting transition values
			this.ViewStateService.setTransitionTime(styles.animationPeriod);
		};

		/**
		 * function is called after websocket connection
		 * has been established. It executes the protocol
		 * and loads the first bundle in the bundle list (= default behavior).
		 */
		private handleConnectedToWSserver(data) {
			// hide drop zone
			var session = data.session;
			var reload = data.reload;
            this.ViewStateService.showDropZone = false;
            var searchObject = this.$location.search();
			if(searchObject.comMode !== "GITLAB"){
				this.ConfigProviderService.vals.main.comMode = 'WS';
			}
			this.ConfigProviderService.vals.activeButtons.openDemoDB = false;
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.somethingInProgressTxt = 'Checking protocol...';
			// Check if server speaks the same protocol
			this.IoHandlerService.getProtocol().then((res) => {
				if (res.protocol === 'EMU-webApp-websocket-protocol' && res.version === '0.0.2') {
					this.ViewStateService.somethingInProgressTxt = 'Checking user management...';
					// then ask if server does user management
					this.IoHandlerService.getDoUserManagement().then((doUsrData) => {
						if (doUsrData === 'NO') {
							this.innerHandleConnectedToWSserver({session: session, reload: reload});
						} else {
							// show user management error
							this.ModalService.open('views/loginModal.html').then((res) => {
								if (res) {
									this.innerHandleConnectedToWSserver({session: session, reload: reload});
								} else {
									this.AppStateService.resetToInitState();
								}
							});
						}
					});
					
				} else {
					// show protocol error and disconnect from server
					this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + this.ConfigProviderService.vals.main.serverUrl + '. It does not speak the same protocol as this client. Its protocol answer was: "' + res.protocol + '" with the version: "' + res.version + '"').then(() => {
						this.AppStateService.resetToInitState();
					});
				}
			});
		};

		/**
		 * to avoid redundant code...
		 */
		private innerHandleConnectedToWSserver(data) {
			var session = data.session;
			var reload = data.reload;
			this.ViewStateService.somethingInProgressTxt = 'Loading DB config...';
			// then get the DBconfigFile
			this.IoHandlerService.getDBconfigFile().then((data) => {
				// first element of perspectives is default perspective
				this.ViewStateService.curPerspectiveIdx = 0;
				this.ConfigProviderService.setVals(data.EMUwebAppConfig);				
				
				var validRes = this.ValidationService.validateJSO('emuwebappConfigSchema', this.ConfigProviderService.vals);
				if (validRes === true) {
					this.ConfigProviderService.curDbConfig = data;
					this.ViewStateService.setCurLevelAttrDefs(this.ConfigProviderService.curDbConfig.levelDefinitions);
					// setspectroSettings
					this.ViewStateService.setspectroSettings(this.ConfigProviderService.vals.spectrogramSettings.windowSizeInSecs,
						this.ConfigProviderService.vals.spectrogramSettings.rangeFrom,
						this.ConfigProviderService.vals.spectrogramSettings.rangeTo,
						this.ConfigProviderService.vals.spectrogramSettings.dynamicRange,
						this.ConfigProviderService.vals.spectrogramSettings.window,
						this.ConfigProviderService.vals.spectrogramSettings.drawHeatMapColors,
						this.ConfigProviderService.vals.spectrogramSettings.preEmphasisFilterFactor,
						this.ConfigProviderService.vals.spectrogramSettings.heatMapColorAnchors,
						this.ConfigProviderService.vals.spectrogramSettings.invert);
					// set first path as default
					this.ViewStateService.setHierarchySettings(this.HierarchyLayoutService.findAllNonPartialPaths().possible[0]);
					
					validRes = this.ValidationService.validateJSO('DBconfigFileSchema', data);
					if (validRes === true) {
						// then get the DBconfigFile
						this.ViewStateService.somethingInProgressTxt = 'Loading bundle list...';
						this.IoHandlerService.getBundleList().then((bdata) => {
							validRes = this.LoadedMetaDataService.setBundleList(bdata);
							// show standard buttons
							this.ConfigProviderService.vals.activeButtons.clear = true;
							this.ConfigProviderService.vals.activeButtons.specSettings = true;
							
							if (validRes === true) {
								// then load first bundle in list
								if(session === null) {
									session = this.LoadedMetaDataService.getBundleList()[0];
								}
								this.DbObjLoadSaveService.loadBundle(session).then(() => {
									// FOR DEVELOPMENT:
									// DbObjLoadSaveService.saveBundle(); // for testing save function
									// $scope.menuBundleSaveBtnClick(); // for testing save button
									// $scope.showHierarchyBtnClick(); // for devel of showHierarchy modal
									// $scope.settingsBtnClick(); // for testing spect settings dial
									// $scope.searchBtnClick();
									// ViewStateService.curViewPort.sS = 27455;
									// ViewStateService.curViewPort.eS = 30180;

								});

								//ViewStateService.currentPage = (ViewStateService.numberOfPages(LoadedMetaDataService.getBundleList().length)) - 1;
								if(reload) {
									this.LoadedMetaDataService.openCollapseSession(session.session);
								}
							} else {
								this.ModalService.open('views/error.html', 'Error validating bundleList: ' + JSON.stringify(validRes, null, 4)).then(() => {
									this.AppStateService.resetToInitState();
								});
							}
						});

					} else {
						this.ModalService.open('views/error.html', 'Error validating / checking DBconfig: ' + JSON.stringify(validRes, null, 4)).then(() => {
							this.AppStateService.resetToInitState();
						});
					}

				} else {
					this.ModalService.open('views/error.html', 'Error validating ConfigProviderService.vals (emuwebappConfig data) after applying changes of newly loaded config (most likely due to wrong entry...): ' + JSON.stringify(validRes, null, 4)).then(() => {
						this.AppStateService.resetToInitState();
					});
				}
			});
		};

		/**
		 *
		 */
		// private toggleCollapseSession(ses) {
		// 	this.uniqSessionList[ses].collapsed = !this.uniqSessionList[ses].collapsed;
		// };

		/**
		 *
		 */
		private getEnlarge(index) {
			var len = this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].signalCanvases.order.length;
			var large = 50;
			if (this.ViewStateService.getenlarge() === -1) {
				return 'auto';
			} else {
				if (len === 1) {
					return 'auto';
				}
				if (len === 2) {
					if (this.ViewStateService.getenlarge() === index) {
						return '70%';
					} else {
						return '27%';
					}
				} else {
					if (this.ViewStateService.getenlarge() === index) {
						return large + '%';
					} else {
						return (95 - large) / (len - 1) + '%';
					}
				}
			}
		};


		/**
		 *
		 */
		private cursorInTextField() {
			this.ViewStateService.setcursorInTextField(true);
		};

		/**
		 *
		 */
		private cursorOutOfTextField() {
			this.ViewStateService.setcursorInTextField(false);
		};

		/////////////////////////////////////////
		// handle button clicks

		// top menu:
		/**
		 *********************************************************************************************************************/
		private addLevelSegBtnClick() {
			if (this.ViewStateService.getPermission('addLevelSegBtnClick')) {
			  
			  // 1) Count how many levels are NOT speakers
			  let normalCount = 0;
			  if (this.DataService.data.levels) {
				this.DataService.data.levels.forEach((lvl) => {
				  if (lvl.role !== 'speaker') {
					normalCount++;
				  }
				});
			  }
			  
			  // 2) Form the name for this new SEGMENT level
			  let newName = 'levelNr' + normalCount;
			  let level = {
				items: [],
				name: newName,
				type: 'SEGMENT'
				// no role property => it's a normal level
			  };
		  
			  // 3) If no attribute definition for newName, create one
			  if (this.ViewStateService.getCurAttrDef(newName) === undefined) {
				let leveldef = {
				  name: newName,
				  type: 'EVENT', // The attribute-level type can remain 'EVENT'
				  attributeDefinitions: {
					name: newName,
					type: 'string'
				  }
				};
				this.ViewStateService.setCurLevelAttrDefs([leveldef]);
			  }
		  
			  // 4) Insert this new level at the end of the levels array
			  let insertionIndex = this.DataService.data.levels.length;
			  this.LevelService.insertLevel(level, insertionIndex, this.ViewStateService.curPerspectiveIdx);
		  
			  // 5) Add to history for undo/redo
			  this.HistoryService.addObjToUndoStack({
				type: 'ANNOT',
				action: 'INSERTLEVEL',
				level: level,
				id: insertionIndex,
				curPerspectiveIdx: this.ViewStateService.curPerspectiveIdx
			  });
		  
			  // 6) Select the newly created level
			  this.ViewStateService.selectLevel(
				false,
				this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order,
				this.LevelService
			  );
			}
		  }
		  
		  private addLevelPointBtnClick() {
			// console.log("inside the addLevelPointBtnClick");
			if (this.ViewStateService.getPermission('addLevelPointBtnClick')) {
		  
			  // 1) Count how many levels are NOT speakers
			  let normalCount = 0;
			  if (this.DataService.data.levels) {
				this.DataService.data.levels.forEach((lvl) => {
				  if (lvl.role !== 'speaker') {
					normalCount++;
				  }
				});
			  }
		  
			  // 2) Form the name for this new EVENT level
			  let newName = 'levelNr' + normalCount;
			  let level = {
				items: [],
				name: newName,
				type: 'EVENT'
				// no role property => it's a normal level
			  };
		  
			  // 3) If no attribute definition for newName, create one
			  if (this.ViewStateService.getCurAttrDef(newName) === undefined) {
				let leveldef = {
				  name: newName,
				  type: 'EVENT',
				  attributeDefinitions: {
					name: newName,
					type: 'string'
				  }
				};
				this.ViewStateService.setCurLevelAttrDefs([leveldef]);
			  }
		  
			  // 4) Insert this new level at the end
			  let insertionIndex = this.DataService.data.levels.length;
			  this.LevelService.insertLevel(level, insertionIndex, this.ViewStateService.curPerspectiveIdx);
		  
			  // 5) Add to history for undo/redo
			  this.HistoryService.addObjToUndoStack({
				type: 'ANNOT',
				action: 'INSERTLEVEL',
				level: level,
				id: insertionIndex,
				curPerspectiveIdx: this.ViewStateService.curPerspectiveIdx
			  });
		  
			  // 6) Select the newly created level
			  this.ViewStateService.selectLevel(
				false,
				this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order,
				this.LevelService
			  );
			}
		  }
		  

		/**
		 *
		 */

		//For the renaming functions,it is not correct to open three different modals for each renameLevel,renameSpeaker,renameEmbodiedActions
		//so i will create a service (reuse auth.service.ts) that will hold a flag that will tell which functions gets called. Then the renameLevel.html modal 
		// will use this service to read from which function it got called and show the appropriate content 

		private renameSelLevelBtnClick() {
			this.authService.setFunction('renameLevels');
			if (this.ViewStateService.getPermission('renameSelLevelBtnClick')) {
				if (this.ViewStateService.getcurClickLevelName() !== undefined) {
					this.ModalService.open('views/renameLevel.html', this.ViewStateService.getcurClickLevelName());
				} else {
					this.ModalService.open('views/error.html', 'Rename Error : Please create a Level first !');
				}
			}
		};

		private saveEverythingBtnClick(){

			console.log("saved everything clicked");			
			// const db   = this.LoadedMetaDataService.getCurDbName();    // e.g. "myEmuDB"
			const db = "myEmuDB";	
			const bndl = this.LoadedMetaDataService.getCurBndlName();  // e.g. "msajc003" 
			const payload = this.DataService.getData();
			// shove the image‐annotation array into your payload
			payload.imageAnnotations = this.DataService.getData().imageAnnotations || [];


			console.log("db: ",db, "bndl: ",bndl, "payload: ",payload);
			
			// ←── NEW: pull in pdfAnnotations from your floating table
  			payload.pdfAnnotations = this.AnnotationService.annotations || [];

			this.$http.post(
  					'http://localhost:3019' + `/api/emuDB/${db}/${bndl}/annot`,
				payload
			).then(
				() => { alert('Annotations saved to EmuDB!'); },
				err => { 
				console.error('Save failed', err); 
				alert('Save failed: ' + (err.data?.message||err.statusText)); 
				}
			);
		}


		/**
		 *********************************************************************************************************************/

		private addSpeakerBtnClick(){
			// console.log("You have clicked to add a speaker!");
		  
			if (this.ViewStateService.getPermission('addLevelSegBtnClick')) {
			  // Count only levels that have been designated as speakers
			  let speakerCount = 0;
			  if (this.DataService.data.levels !== undefined) {
				this.DataService.data.levels.forEach((lvl) => {
				  if (lvl.role === 'speaker') {
					speakerCount++;
				  }
				});
			  }
			  // Use the speakerCount for the new speaker's name
			  let newName = 'SpeakerNr' + speakerCount;
			  let level = {
				items: [],
				name: newName,
				type: 'SEGMENT',  // using SEGMENT because you'll have start and end times
				role: 'speaker'   // custom property to mark this as a speaker level
			  };
		  
			  if (this.ViewStateService.getCurAttrDef(newName) === undefined) {
				let leveldef = {
				  name: newName,
				  type: 'EVENT',  // attribute-level type for labeling purposes
				  attributeDefinitions: {
					name: newName,
					type: 'string'
				  }
				};
				this.ViewStateService.setCurLevelAttrDefs([leveldef]);
			  }
			  // Insert the level. Note: for the insertion index you can use the overall length
			  this.LevelService.insertLevel(level, this.DataService.data.levels.length, this.ViewStateService.curPerspectiveIdx);
			  // Add to history for undo/redo
			  this.HistoryService.addObjToUndoStack({
				type: 'ANNOT',
				action: 'INSERTLEVEL',
				level: level,
				id: this.DataService.data.levels.length,
				curPerspectiveIdx: this.ViewStateService.curPerspectiveIdx
			  });
			  // Select the new level
			  this.ViewStateService.selectLevel(
				false,
				this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order,
				this.LevelService
			  );
			}
		}
		  

		private renameSpeakerBtnClick() {
			this.authService.setFunction('renameSpeakers');
			if (this.ViewStateService.getPermission('renameSpeakerBtnClick')) {
				if (this.ViewStateService.getcurClickLevelName() !== undefined) {
					this.ModalService.open('views/renameLevel.html', this.ViewStateService.getcurClickLevelName());
				} else {
					this.ModalService.open('views/error.html', 'Rename Error : Please create a Level first !');
				}
			}
		};


		private addEmbodiedActionsBtnClick() {
			// Count existing levels with role 'embodied'
			let embodiedCount = 0;
			if (this.DataService.data.levels) {
			  this.DataService.data.levels.forEach((lvl) => {
				if (lvl.role === 'embodied') {
				  embodiedCount++;
				}
			  });
			}
			let newName = 'EmbodiedActionsNr' + embodiedCount;
			
			// Create a new level object
			let level = {
			  items: [],
			  name: newName,
			  type: 'SEGMENT',   // We use SEGMENT type (adjust if needed)
			  role: 'embodied'   // Mark this level as embodied actions
			};
		  
			// Create an attribute definition if one doesn't exist for this level
			if (this.ViewStateService.getCurAttrDef(newName) === undefined) {
			  let leveldef = {
				name: newName,
				type: 'EVENT',  // For labeling purposes, we use 'EVENT'
				attributeDefinitions: {
				  name: newName,
				  type: 'string'
				}
			  };
			  this.ViewStateService.setCurLevelAttrDefs([leveldef]);
			}
		  
			// Insert the new level at the end of the levels array
			let insertionIndex = this.DataService.data.levels.length;
			this.LevelService.insertLevel(level, insertionIndex, this.ViewStateService.curPerspectiveIdx);
		  
			// Add the change to the history stack for undo/redo
			this.HistoryService.addObjToUndoStack({
			  type: 'ANNOT',
			  action: 'INSERTLEVEL',
			  level: level,
			  id: insertionIndex,
			  curPerspectiveIdx: this.ViewStateService.curPerspectiveIdx
			});
		  
			// Select the newly created level so that its annotation canvas appears
			this.ViewStateService.selectLevel(
			  false,
			  this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order,
			  this.LevelService
			);
		}
		  
		// private renameEmbodiedActionsBtnClick() {
		// 	this.authService.setFunction('renameEmbodiedActions');

		// 	if (this.ViewStateService.getPermission('renameEmbodiedActionsBtnClick')) {
		// 	  const curLevelName = this.ViewStateService.getcurClickLevelName();
		// 	  if (curLevelName !== undefined) {
		// 		const levelDetails = this.LevelService.getLevelDetails(curLevelName);
		// 		if (levelDetails && levelDetails.role === 'embodied') {
		// 			console.log("before opening the renameLevel");
		// 		  // Open a modal with embodied-actions–specific text/template.
		// 		  this.ModalService.open('views/renameLevel.html', curLevelName);
		// 		} 
		// 	  } else {
		// 		this.ModalService.open('views/error.html', 'Rename Error: Please create an Embodied Actions level first!');
		// 	  }
		// 	}
		// };
		  

		private renameEmbodiedActionsBtnClick() {
			this.authService.setFunction('renameEmbodiedActions');
			if (this.ViewStateService.getPermission('renameEmbodiedActionsBtnClick')) {
				if (this.ViewStateService.getcurClickLevelName() !== undefined) {
					this.ModalService.open('views/renameLevel.html', this.ViewStateService.getcurClickLevelName());
				} else {
					this.ModalService.open('views/error.html', 'Rename Error : Please create a Level first !');
				}
			}
		};

		private addToDatabaseBtnClick() {
			// Create a hidden file input element
			const inputFile = document.createElement('input');
			inputFile.type = 'file';
			inputFile.style.display = 'none';
		
			// When a file is selected, upload it to the server
			inputFile.onchange = (event: any) => {
				const file: File = event.target.files[0];
				if (file) {
					const formData = new FormData();
					formData.append('file', file);
		
					// Send the file to the backend using $http
					this.$http.post('http://localhost:3019/upload-file', formData, {
						headers: { 'Content-Type': undefined },
						transformRequest: angular.identity
					}).then((response: any) => {
						console.log('File uploaded successfully', response.data);
					}).catch((error: any) => {
						console.error('Error uploading file', error);
					});
				}
			};
		
			// Trigger the file selector
			inputFile.click();
		};


		// private mapFileToBundle(fileMetadata: any) {
		// 	return {
		// 	  name: fileMetadata.fileName,
		// 	  session: "DB", // default or computed session value
		// 	  mediaFile: {
		// 		encoding: 'GETURL',
		// 		type: fileMetadata.fileType,
		// 		data: fileMetadata.gridFSRef
		// 	  },
		// 	  annotation: {
		// 		levels: [],
		// 		links: [],
		// 		sampleRate: null,
		// 		annotates: fileMetadata.fileName,
		// 		name: fileMetadata.fileName,
		// 		pdfAnnotations: [],
		// 		imageAnnotations: [],
		// 		videoAnnotations: []
		// 	  }
		// 	};
		//   }
		  

		private logOutBtnClick(){
			this.AppStateService.resetToInitState();
    		this.$location.path('../../views/login.html');

		}

		// In your main controller (or the controller that opens the modal)
		private openFromDatabaseBtnClick() {
			this.$http.get('http://localhost:3019/files')
			  .then((response: any) => {
				const files = response.data;
				// console.log("Files retrieved from database:", files);
				this.ModalService.data = { files: files };
				this.ModalService.open('views/retrieveFromDatabase.html')
				  .then((selectedFile: any) => {
					if (selectedFile) {
					  console.log("Selected file from DB:", selectedFile);
					  // Here you could also use FileMappingService if needed, 
					  // or leave that mapping to the modal controller.
					}
				  })
				  .catch((err: any) => {
					console.error("Modal was closed without selecting a file:", err);
				  });
			  })
			  .catch((error: any) => {
				console.error("Error retrieving files from database:", error);
			  });
		}

		  
		private openMyFilesBtnClick() {
			const user = this.authService.getUser();
			if (!user) {
			  return console.error('No user logged in');
			}

			console.log("user: ",user);

			this.$http
			  .get('http://localhost:3019/files')
			  .then((response: angular.IHttpResponse<IFileMeta[]>) => {
				// Now TypeScript knows response.data is IFileMeta[]
				const allFiles = response.data;
				const myFiles = allFiles.filter(f => f.adminEmail === user.email);
		  
				if (myFiles.length === 0) {
				  alert('You have no files assigned.');
				  return;
				}
		  
				this.ModalService.data = { files: myFiles };
				this.ModalService.open('views/retrieveFromDatabase.html')
				  .then((sel: IFileMeta) => {
					if (sel) console.log('Picked:', sel);
				  })
				  .catch(() => { /* modal dismissed */ });
			  })
			  .catch(err => console.error('Error fetching files:', err));
		}
		 
		
		private openMyFilesResBtnClick(){
			const user = this.authService.getUser();
			if (!user) {
			  return console.error('No user logged in');
			}

			console.log("user: ",user);

			this.$http
			  .get('http://localhost:3019/files')
			  .then((response: angular.IHttpResponse<IFileMeta[]>) => {
				// Now TypeScript knows response.data is IFileMeta[]
				const allFiles = response.data;
				const myFiles = allFiles.filter(f => Array.isArray(f.researcherEmails) && f.researcherEmails.includes(user.email));
		  
				if (myFiles.length === 0) {
				  alert('You have no files assigned.');
				  return;
				}
		  
				this.ModalService.data = { files: myFiles };
				this.ModalService.open('views/retrieveFromDatabase.html')
				  .then((sel: IFileMeta) => {
					if (sel) console.log('Picked:', sel);
				  })
				  .catch(() => { /* modal dismissed */ });
			  })
			  .catch(err => console.error('Error fetching files:', err));
		}

		private downloadAnnotationBtnClick() {
			console.log("the download _annot.json button has been clicked");
			if (this.ViewStateService.getPermission('downloadAnnotationBtnClick')) {
				if(this.ValidationService.validateJSO('emuwebappConfigSchema', this.DataService.getData())) {
					this.ModalService.open('views/export.html', this.LoadedMetaDataService.getCurBndl().name + '_annot.json', angular.toJson(this.DataService.getData(), true));
				}
			}
		};
		  
		private chooseAdminsBtnClick(): void {
			this.$http.get('http://localhost:3019/files')
			.then((response: any) => {
			  const files = response.data;
			  // console.log("Files retrieved from database:", files);
			  this.ModalService.data = { files: files };
			  this.ModalService.open('views/chooseAdmins.html')
				.then((selectedFile: any) => {
				  if (selectedFile) {
					console.log("Selected file from DB:", selectedFile);
					// Here you could also use FileMappingService if needed, 
					// or leave that mapping to the modal controller.
				  }
				})
				.catch((err: any) => {
				  console.error("Modal was closed without selecting a file:", err);
				});
			})
			.catch((error: any) => {
			  console.error("Error retrieving files from database:", error);
			});		
		}
		  


		private signupResearBtnClick() {
			this.ModalService
			  .open('views/signUpResearchers.html')
			  .then((newResearcher: any) => {
				console.log('Researcher created:', newResearcher);
				// you can immediately refresh your “adminsList” or any other state here
			  })
			  .catch(() => {
				// user dismissed the modal
			  });
		}
		
		private viewInfoAdminBtnClick(){
			this.ModalService.open('views/infoForAdmin.html');

		}

		//Clicking “Choose admins…” opens the modal, data flows two-way into vm.newAdmin, 
		// and hitting Save sends a request to your server and then closes the modal.
		private signUpAdminsBtnClick() {
			this.ModalService.open('views/signUpAdmins.html')
			  .then(newAdmin => {
				// console.log('Administrator created:', newAdmin);
			});
		}
		  
		// in EmuWebAppComponent class
		private chooseResearBtnClick(): void {
			this.ModalService.open('views/chooseResearchers.html')
			.then(didAssign => {
			if (didAssign) {
				console.log('Researchers were assigned, refresh your tables…');
				// e.g. re-load both the left and right panes
			}
			})
			.catch(err => console.error('Modal closed without assignment:', err));
		}

		
		
	
		/**
		 *
		 */
		private settingsBtnClick() {
			if (this.ViewStateService.getPermission('spectSettingsChange')) {
				this.ModalService.open('views/settingsModal.html');
			}
		};

		/**
		 *
		 */
		private connectBtnClick() {
			if (this.ViewStateService.getPermission('connectBtnClick')) {
				this.ModalService.open('views/connectModal.html').then((url) => {
					if (url) {
						this.ViewStateService.somethingInProgressTxt = 'Connecting to server...';
						this.ViewStateService.somethingInProgress = true;
						this.ViewStateService.url = url;
						// SIC IoHandlerService.WebSocketHandlerService is private
						this.IoHandlerService.WebSocketHandlerService.initConnect(url).then((message) => {
							if (message.type === 'error') {
								this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + url).then(() => {
									this.AppStateService.resetToInitState();
								});
							} else {
								this.handleConnectedToWSserver({session: null, reload: null});
							}
						}, function (errMess) {
							this.ModalService.open('views/error.html', 'Could not connect to websocket server: ' + JSON.stringify(errMess, null, 4)).then(() => {
								this.AppStateService.resetToInitState();
							});
						});
					}
				});
			} else {

			}
		};

		/**
		 *
		 */
		private openDemoDBbtnClick(nameOfDB) {
			console.log("openDemoDBbtnClick has been clicked");
			if (this.ViewStateService.getPermission('openDemoBtnDBclick')) {
				this.dropdown = false;
				this.ConfigProviderService.vals.activeButtons.openDemoDB = false;
				this.LoadedMetaDataService.setDemoDbName(nameOfDB);
				// hide drop zone
				this.ViewStateService.showDropZone = false;

				this.ViewStateService.somethingInProgress = true;
				// alert(nameOfDB);
				this.ViewStateService.setState('loadingSaving');
				this.ConfigProviderService.vals.main.comMode = 'DEMO';
				this.ViewStateService.somethingInProgressTxt = 'Loading DB config...';

				this.IoHandlerService.getDBconfigFile(nameOfDB).then((res) => {
					var data = res.data;
					// first element of perspectives is default perspective
					this.ViewStateService.curPerspectiveIdx = 0;
					this.ConfigProviderService.setVals(data.EMUwebAppConfig);

					var validRes = this.ValidationService.validateJSO('emuwebappConfigSchema', this.ConfigProviderService.vals);
					if (validRes === true) {
						this.ConfigProviderService.curDbConfig = data;
						this.ViewStateService.setCurLevelAttrDefs(this.ConfigProviderService.curDbConfig.levelDefinitions);
						validRes = this.ValidationService.validateJSO('DBconfigFileSchema', this.ConfigProviderService.curDbConfig);

						if (validRes === true) {
							// then get the DBconfigFile
							this.ViewStateService.somethingInProgressTxt = 'Loading bundle list...';

							this.IoHandlerService.getBundleList(nameOfDB).then((res) => {
								var bdata = res.data;
								// validRes = ValidationService.validateJSO('bundleListSchema', bdata);
								// if (validRes === true) {
								this.LoadedMetaDataService.setBundleList(bdata);
								// show standard buttons
								this.ConfigProviderService.vals.activeButtons.clear = true;
								this.ConfigProviderService.vals.activeButtons.specSettings = true;

								// then load first bundle in list
								this.DbObjLoadSaveService.loadBundle(this.LoadedMetaDataService.getBundleList()[0]);

							}, function (err) {
								this.ModalService.open('views/error.html', 'Error loading bundle list of ' + nameOfDB + ': ' + err.data + ' STATUS: ' + err.status).then(() => {
									this.AppStateService.resetToInitState();
								});
							});
						} else {
							this.ModalService.open('views/error.html', 'Error validating / checking DBconfig: ' + JSON.stringify(validRes, null, 4)).then(() => {
								this.AppStateService.resetToInitState();
							});
						}


					} else {
						this.ModalService.open('views/error.html', 'Error validating ConfigProviderService.vals (emuwebappConfig data) after applying changes of newly loaded config (most likely due to wrong entry...): ' + JSON.stringify(validRes, null, 4)).then(() => {
							this.AppStateService.resetToInitState();
						});
					}

				}, (err) => {
					this.ModalService.open('views/error.html', 'Error loading DB config of ' + nameOfDB + ': ' + err.data + ' STATUS: ' + err.status).then(() => {
						this.AppStateService.resetToInitState();
					});
				});
			}
		};

		/**
		 *
		 */

 		private searchDatabaseBtnClick(){
			this.ModalService.open('views/searchThroughDatabase.html');

 		}

		/**
		 *
		 */
		private aboutBtnClick () {
			if (this.ViewStateService.getPermission('aboutBtnClick')) {
				this.ModalService.open('views/help.html');
			}
		};

		/**
		 *
		 */
		private showHierarchyBtnClick () {
			if (!this.ViewStateService.hierarchyState.isShown()) {
				this.ViewStateService.hierarchyState.toggleHierarchy();
				this.ModalService.open('views/showHierarchyModal.html');
			}
		};
		/**
		 *
		 */
		private searchBtnClick () {
			if (this.ViewStateService.getPermission('searchBtnClick')) {
				this.ModalService.open('views/searchAnnot.html');
			}
		};


		/**
		 *
		 */
		private clearBtnClick() {
			if (window.confirm("Do you really wish to clear all loaded data and return to the hoome page?")) {
				this.AppStateService.resetToInitState();
			}
		}
		
		
		
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		private MetadataButtonClick() {
			const recordingNameClick = this.LoadedMetaDataService.getCurBndlName();
			if (this.ViewStateService.curState === this.ViewStateService.states.nonAudioDisplay) {
				// Open PDF-specific metadata modal
				this.ModalService.open('views/PdfMetadataButton.html', recordingNameClick);
			}else if (this.ViewStateService.curState === this.ViewStateService.states.JpegDisplay){
				// Open image-specific metadata modal
				this.ModalService.open('views/ImgMetadataButton.html', recordingNameClick);
			}
			else{
				// Open the modal and pass the recording name
				this.ModalService.open('views/MetadataButton.html', recordingNameClick);
			}
		};

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	private formButtonClick() {
		this.ModalService.open('views/form.html');
	}
	



		// bottom menu:

		/**
		 *
		 */
		private cmdZoomAll () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.setViewPort(0, this.SoundHandlerService.audioBuffer.length);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdZoomIn () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.zoomViewPort(true);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdZoomOut () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.zoomViewPort(false);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdZoomLeft () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.shiftViewPort(false);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdZoomRight () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.shiftViewPort(true);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdZoomSel () {
			if (this.ViewStateService.getPermission('zoom')) {
				this.LevelService.deleteEditArea();
				this.ViewStateService.setViewPort(this.ViewStateService.curViewPort.selectS, this.ViewStateService.curViewPort.selectE);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdPlayView () {
			if (this.ViewStateService.getPermission('playaudio')) {
				this.SoundHandlerService.playFromTo(this.ViewStateService.curViewPort.sS, this.ViewStateService.curViewPort.eS);
				this.ViewStateService.animatePlayHead(this.ViewStateService.curViewPort.sS, this.ViewStateService.curViewPort.eS);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdPlaySel () {
			if (this.ViewStateService.getPermission('playaudio')) {
				this.SoundHandlerService.playFromTo(this.ViewStateService.curViewPort.selectS, this.ViewStateService.curViewPort.selectE);
				this.ViewStateService.animatePlayHead(this.ViewStateService.curViewPort.selectS, this.ViewStateService.curViewPort.selectE);
			} else {
				//console.log('action currently not allowed');
			}
		};

		/**
		 *
		 */
		private cmdPlayAll () {
			console.log("cmdPlayAll function-->emu-webapp.component.ts");
			if (this.ViewStateService.getPermission('playaudio')) {
				this.SoundHandlerService.playFromTo(0, this.SoundHandlerService.audioBuffer.length);
				this.ViewStateService.animatePlayHead(0, this.SoundHandlerService.audioBuffer.length);
			} else {
				//console.log('action currently not allowed');
			}
		};

		///////////////////////////
		// other

		// private tmp () {
		// 	console.log("tmp btn click");
		// 	this.xTmp = this.xTmp + 1;
		// 	this.yTmp = this.yTmp + 1;
		// };
        
        // private getTmp(){
		// 	return angular.copy(this.xTmp)
		// };

		private showHierarchyPathCanvas (){
			return(localStorage.getItem('showHierarchyPathCanvas') == 'true')
		};

		// Called from profile button click
		public userProfileClick(): void {
			this.toggleProfileMenu();
		}

		private toggleProfileMenu() {
			this.profileMenuOpen = !this.profileMenuOpen;
		}


		public saveHasBeenClicked() : void {
			this.toggleSaveMenu() ;
		}

		private toggleSaveMenu(){
			this.saveMenuOpen = !this.saveMenuOpen; 
		}


		//  // Add these NEW methods here
		//  public showDocument(documentUrl: string): void {
		// 	this.currentDocumentUrl = documentUrl;
		// 	this.isPdfFile = documentUrl.toLowerCase().endsWith('.pdf');
		// 	this.ViewStateService.curState = this.ViewStateService.states.nonAudioDisplay;
		// }
	
		// public returnToAudioView(): void {
		// 	this.ViewStateService.curState = this.ViewStateService.states.default;
		// 	this.currentDocumentUrl = '';
		// 	this.isPdfFile = false;
		// }

    }]

}

angular.module('emuwebApp')
.component(EmuWebAppComponent.selector, EmuWebAppComponent);

export default EmuWebAppComponent;