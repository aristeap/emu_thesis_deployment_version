    
        // Declare arrowIconElement once, outside of the functions
        var arrowIconElement = document.getElementById('arrowIcon');
        var arrowIconElement2 = document.getElementById('arrowIcon2');
        var toggleKeyIconElement = document.getElementById('toggleKeyIcon');
        var toggleKeyIconActorsElement = document.getElementById('toggleKeyIconActors');
        var toggleKeyIconContentElm = document.getElementById('toggleKeyIconContent');
        var languageCount = 0; //Counter for languages
        var additionalItemsElement = document.getElementById('additionalItems');
        var actorCount = 0; // Counter for dynamically added actors
        var isActorFormLoading = false;
        var isLanguageFormLoading = false;


        // console.log("metadataSaved = ",localStorage.getItem('metadataSaved'), " savedMetadata = ",localStorage.getItem('savedMetadata'));

        function currentFileName() {
          const span = document.querySelector('#recordingName span');
          return span ? span.textContent.trim() : '';
        }

        // Function to toggle visibility of additional items (Actors and Content)
        function toggleAdditionalItems() {
            if (additionalItemsElement.style.display === "none" || additionalItemsElement.style.display === "") {
                additionalItemsElement.style.display = "block";  // Show the elements
                toggleKeyIconElement.classList.remove("fa-key");
                toggleKeyIconElement.classList.add("fa-unlock");  // Change key icon to unlock when opened
            } else {
                additionalItemsElement.style.display = "none";  // Hide the elements
                toggleKeyIconElement.classList.remove("fa-unlock");
                toggleKeyIconElement.classList.add("fa-key");  // Change back to key icon when closed
            }
        }

        function showExportOptions(event) {
          event.stopPropagation(); // Prevents the li onclick event from firing
          var menu = document.getElementById('exportOptions');
          if(menu){
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
          }
        }

        // Hide the menu when clicking elsewhere
        document.addEventListener('click', function() {
          var menu = document.getElementById("exportOptions");
          if (menu) {
              menu.style.display = "none";
          }
        });


        // Function to load the recording and content forms into the right panel
        function loadForm(formType) {
            let formContent = '';

           // console.log("loadForm called with formType:", formType);

            // Map formType for consistency (e.g., "name_of_file" maps to "recording")
            const formTypeMapping = {
                'name_of_file': 'recording',
                'content': 'content'
            };

            const mappedFormType = formTypeMapping[formType] || formType;
            // Clear previous active states and highlight the current item
            const currentItem = document.querySelector(`.form-switch[data-form-type="${mappedFormType}"]`);

            if (currentItem) {
                highlightActiveItem(currentItem); // Use the utility function for consistency
            } else {
                console.error("currentItem is null for formType:", mappedFormType);
            }

            // ── Before rendering the new form, reconstruct any saved actors/languages if we're on "recording" ──
            if (mappedFormType === 'recording') {
              const name = currentFileName();
              const savedFlagKey = `metadataSaved_${name}`;
              const savedDataKey = `savedMetadata_${name}`;
              let savedMetadata = {};
              if (localStorage.getItem(savedFlagKey) === 'true') {
                try {
                  savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
                } catch {
                  savedMetadata = {};
                }
              }

              // Re‐build actor menu items:
              if (Array.isArray(savedMetadata.actors)) {
                console.log("inside the actors metadata saved--------------");
                // Reset counter and remove any existing <li class="actor-item"> nodes:
                actorCount = 0;
                document.querySelectorAll('.actor-item').forEach(el => el.remove());
                const actorsList = document.getElementById('actor');
                savedMetadata.actors.forEach((actorData, idx) => {
                  const i = idx + 1;
                  actorCount = i;
                  const actorItem = document.createElement('li');
                  actorItem.id = `actor${i}`;
                  metadata.actors[actorItem.id] = actorData;
                  actorItem.classList.add('form-switch', 'actor-item');
                  actorItem.dataset.formType = 'actor';
                  actorItem.dataset.id = `actor${i}`;

                  const diamondIcon = document.createElement('i');
                  diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');
                  const actorNameSpan = document.createElement('span');
                  actorNameSpan.textContent = actorData.full_name || `Actor ${i}`;
                  actorNameSpan.classList.add('actor-name-span');

                  actorItem.appendChild(diamondIcon);
                  actorItem.appendChild(actorNameSpan);

                  // When clicked, show that actor’s form and populate from storage
                  actorItem.onclick = ((currentActorCount) => {
                    return function () {
                      highlightActiveItem(actorItem);
                      showActorForm(currentActorCount);
                      populateFromStorage(
                        'actor',
                        savedMetadata.actors[currentActorCount - 1],
                        `actor${currentActorCount}`
                      );
                      populateForm('actor', `actor${currentActorCount}`);
                    };
                  })(i);

                  actorsList.appendChild(actorItem);
                });
              }

              // Re‐build language menu items:
              if (Array.isArray(savedMetadata.languages)) {
                console.log("inside the languages metadata saved--------------");
                languageCount = 0;
                document.querySelectorAll('.language-item').forEach(el => el.remove());
                // “toggleContent” is the <li> for the Content heading; new languages append to its parent
                const languagesParent = document.getElementById('toggleContent').parentNode;
                savedMetadata.languages.forEach((langData, idx) => {
                  const i = idx + 1;
                  languageCount = i;
                  const languageItem = document.createElement('li');
                  languageItem.id = `language${i}`;
                  metadata.languages[languageItem.id] = langData;
                  languageItem.classList.add('form-switch', 'language-item');
                  languageItem.dataset.formType = 'language';
                  languageItem.dataset.id = `language${i}`;

                  const diamondIcon = document.createElement('i');
                  diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');
                  const languageNameSpan = document.createElement('span');
                  languageNameSpan.textContent = langData.lang_name || `Language ${i}`;
                  languageNameSpan.classList.add('language-name-span');

                  languageItem.appendChild(diamondIcon);
                  languageItem.appendChild(languageNameSpan);

                  // When clicked, show that language’s form and populate from storage
                  languageItem.onclick = ((currentLanguageCount) => {
                    return function () {
                      highlightActiveItem(languageItem);
                      showLanguageForm(currentLanguageCount);
                      populateFromStorage(
                        'language',
                        savedMetadata.languages[currentLanguageCount - 1],
                        `language${currentLanguageCount}`
                      );
                      populateForm('language', `language${currentLanguageCount}`);
                    };
                  })(i);

                  languagesParent.appendChild(languageItem);
                });
              }
            }
  


            // Generate form content based on formType
            if (mappedFormType === 'recording') {
                formContent = `
                     <form action="http://localhost:3019/post-recording" id="recording-form" method="POST" class="metadata-form">
                        <label>Name:</label>
                        <input type="text" name="filename" placeholder="Enter the file name" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Title:</label>
                        <input type="text" name="title" placeholder="Enter title" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Description:</label>
                        <input type="text" name="description" placeholder="Enter a description about the corpora" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Date:</label>
                        <input type="date" name="date" placeholder="Enter when the corpora was created dd/mm/yy">
                        <label>Location Continent:</label>
                        <input type="text" name="continent" placeholder="Enter the location continent" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Location Country:</label>
                        <input type="text" name="country" placeholder="Enter the location country" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Location Region:</label>
                        <input type="text" name="region" placeholder="Enter the location region" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <label>Location Address:</label>
                        <input type="text" name="address" placeholder="Enter the location address" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                        <button class="done-btn" data-form-type="recording" type="button" onclick="initializeDoneButton()">Save temporarily</button>
                    </form>`;
            } else if (mappedFormType === 'content') {
                formContent = `
                    <form action="http://localhost:3019/post-content" id="content-form" method="POST" class="metadata-form">
                        <label>Genre:</label>
                        <select name="genre">
                            <option value="radio">Radio-TV feature</option>
                            <option value="unknown">Unknown</option>
                            <option value="article">Article</option>
                            <option value="ritual">Ritual/Religious texts</option>
                        </select>
                        <label>Modalities:</label>
                        <select name="modalities">
                            <option value="speech">speech</option>
                            <option value="gestures">gestures</option>
                        </select>
                        <label>Communication Planning Type:</label>
                        <select name="planning_type">
                            <option value="planned">planned</option>
                            <option value="non-planned">not planned</option>
                        </select>
                        <button class="done-btn" data-form-type="content" type="button" onclick="initializeDoneButton()">Save temporarily</button>
                    </form>`;
            }

            // Set the content in the right panel
            const metadataFormContainer = document.getElementById('metadata-form-container');
            metadataFormContainer.innerHTML = formContent;

            // Compile the form content so AngularJS can process it
            const scope = angular.element(metadataFormContainer).scope();
            angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
                $compile(metadataFormContainer)(scope);
            }]);

            scope.$apply(); // Trigger AngularJS digest cycle to reflect changes

            const name = currentFileName();
            const savedFlagKey = `metadataSaved_${name}`;
            const savedDataKey = `savedMetadata_${name}`;

            if (localStorage.getItem(savedFlagKey) === 'true') {
              const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey));
              if (savedMetadata && savedMetadata[mappedFormType]) {
                populateFromStorage(mappedFormType, savedMetadata[mappedFormType]);
              }
            }


            populateForm(mappedFormType);
        }
  

       // Function to load the actor form*******************************
       function loadActorForm(event) {
          if (isActorFormLoading) return;
          isActorFormLoading = true;

          toggleKeyIconActorsElement.classList.remove("fa-key");
          toggleKeyIconActorsElement.classList.add("fa-unlock"); // Change key icon to unlock when opened

          actorCount++; // Increment the actor count

          // Create the new Actor list item
          const actorItem = document.createElement('li');
          actorItem.id = `actor${actorCount}`; // Unique ID for the actor
          actorItem.classList.add("form-switch", "actor-item"); // Add the form-switch and actor-item classes
          actorItem.dataset.formType = "actor"; // Add the data-form-type attribute
          actorItem.dataset.id = `actor${actorCount}`; // Add a unique ID

          // Create a diamond icon element
          const diamondIcon = document.createElement('i');
          diamondIcon.classList.add('bi', 'bi-suit-diamond-fill'); // Use the diamond icon from Font Bootstrap

          // Create a span element to display the actor name
          const actorNameSpan = document.createElement('span');
          actorNameSpan.textContent = `Actor ${actorCount}`; // Initial text
          actorNameSpan.classList.add('actor-name-span'); // Optional class for styling

          // Append the icon and span to the actor item
          actorItem.appendChild(diamondIcon);
          actorItem.appendChild(actorNameSpan);

          // Add the click event to display the actor form
          actorItem.onclick = ((currentActorCount) => {
            return function () {
              highlightActiveItem(actorItem); // Highlight the clicked actor
              showActorForm(currentActorCount); // Show the actor form when clicked

              const name = currentFileName();
              const savedFlagKey = `metadataSaved_${name}`;
              const savedDataKey = `savedMetadata_${name}`;

              // new: pull only this file’s saved data from localStorage
              if (localStorage.getItem(savedFlagKey) === 'true') {
                const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey));
                if (
                  savedMetadata &&
                  Array.isArray(savedMetadata.actors) &&
                  savedMetadata.actors[currentActorCount - 1]
                ) {
                  populateFromStorage(
                    'actor',
                    savedMetadata.actors[currentActorCount - 1],
                    `actor${currentActorCount}`
                  );
                }
              }
              populateForm("actor", `actor${currentActorCount}`);

            };
          })(actorCount);


          // Add the actor item to the actors list
          const actorsList = document.getElementById('actor'); // Ensure actors are added only to 'Actors' section
          console.log("actorsList: ",actorsList);
          console.log("actorItem: ",actorItem);
          
          actorsList.appendChild(actorItem);

          // Highlight the new actor
          highlightActiveItem(actorItem);

          // Hide the context menu if it's visible
          document.getElementById("contextMenu").style.display = "none";

          // Reset the flag after form load logic completes
          setTimeout(() => {
              isActorFormLoading = false;
          }, 500);
        }


        // Function to display the actor form 
        function showActorForm(actorNumber) {
          //console.log("The showActorForm function has been called");
      
            const formContent = `
                <form action="http://localhost:3019/post-actor" id="actor-form" method="POST" class="metadata-form"  data-actor-id="actor${actorNumber}">
                    <label>Name:</label>
                    <input type="text" name="first_name" placeholder="Enter the first name for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <label>Full name:</label>
                    <input type="text" name="full_name" placeholder="Enter full name for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <label>Age:</label>
                    <input type="number" name="age" placeholder="Enter the age for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <label>Sex:</label>
                    <select name="sex">
                        <option value="female">female</option>
                        <option value="male">male</option>
                    </select>
                    <label>Education:</label>
                    <input type="text" name="education" placeholder="Enter education for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <label>Ethnic Group:</label>
                    <input type="text" name="ethnicity" placeholder="Enter the ethnic group for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <label>Contact email:</label>
                    <input type="text" name="email" placeholder="Enter the actor's email for Actor ${actorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                    <button class="done-btn" data-form-type="actor" type="button" onclick="initializeDoneButton()">Save temporarily</button>
                </form>`;

            const metadataFormContainer = document.getElementById('metadata-form-container');
            metadataFormContainer.innerHTML = formContent;

            // Compile the form content so AngularJS can process it
            const scope = angular.element(metadataFormContainer).scope();
            angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
                $compile(metadataFormContainer)(scope);
            }]);

            scope.$apply(); // Trigger AngularJS digest cycle to reflect changes
        }

        // Show the context menu when hovering over the arrow icon
        function showMenu(e) {
            e.preventDefault();

            // Get the "Actors" list item position
            var menu = document.getElementById("contextMenu");
            var rect = arrowIconElement.getBoundingClientRect();

            // Set the context menu position relative to the arrow icon
            menu.style.display = 'block';
            menu.style.left = (rect.right - 160) + "px";  // Position it to the right of the arrow icon
            menu.style.top = (rect.top - 120) + "px";     // Align it vertically with the arrow icon
        }

        // Hide the context menu when the mouse leaves the arrow or the context menu
        function hideMenu() {
            document.getElementById("contextMenu").style.display = "none";
        }

        // Add event listeners for hover behavior
        arrowIconElement.addEventListener('mouseover', showMenu);
        arrowIconElement.addEventListener('mouseout', hideMenu);

        // Keep the context menu visible when hovering over it
        var contextMenu = document.getElementById('contextMenu');
        contextMenu.addEventListener('mouseover', function() {
            contextMenu.style.display = 'block';
        });
        contextMenu.addEventListener('mouseout', function() {
            contextMenu.style.display = 'none';
        });

        // Add event listener for "Add an Actor" option
        var addActorOption = document.querySelector('#contextMenu ul li'); 
        addActorOption.addEventListener('click', loadActorForm);
      
        //For the Content form and context menu************************************
          
        // Function to load the language form
        function loadLanguageForm() {
          if (isLanguageFormLoading) return;
          isLanguageFormLoading = true;

          toggleKeyIconContentElm.classList.remove("fa-key");
          toggleKeyIconContentElm.classList.add("fa-unlock"); // Change key icon to unlock when opened

          languageCount++; // Increment the language count

          // Create the new Language list item
          const languageItem = document.createElement('li');
          languageItem.id = `language${languageCount}`; // Unique ID for the language
          languageItem.classList.add("form-switch", "language-item");
          languageItem.dataset.formType = "language"; // Add the data-form-type attribute
          languageItem.dataset.id = `language${languageCount}`; // Add a unique ID

          // Create a diamond icon element
          const diamondIcon = document.createElement('i');
          diamondIcon.classList.add('bi', 'bi-suit-diamond-fill'); // Use the diamond icon from Font Bootstrap

          // Create a span for the language name
          const languageNameSpan = document.createElement('span');
          languageNameSpan.textContent = `Language ${languageCount}`; // Default text for the language
          languageNameSpan.classList.add('language-name-span'); // Add specific class for styling

          // Append the icon and span to the language item
          languageItem.appendChild(diamondIcon);
          languageItem.appendChild(languageNameSpan);

          // Add a click event to display the language form
          languageItem.onclick = ((currentLanguageCount) => {
            return function () {
              highlightActiveItem(languageItem); // Highlight the clicked language
              showLanguageForm(currentLanguageCount); // Show the language form when clicked

              const name = currentFileName();
              const savedFlagKey = `metadataSaved_${name}`;
              const savedDataKey = `savedMetadata_${name}`;

              if (localStorage.getItem(savedFlagKey) === 'true') {
                  const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey));
                  if (
                    savedMetadata &&
                    Array.isArray(savedMetadata.languages) &&
                    savedMetadata.languages[currentLanguageCount - 1]
                  ) {
                    populateFromStorage(
                      'language',
                      savedMetadata.languages[currentLanguageCount - 1],
                      `language${currentLanguageCount}`
                    );
                  }
                }
                populateForm("language", `language${currentLanguageCount}`);
            };
          })(languageCount);

          // Append the new language item to the end of the "Content" section
          const languagesList = document.getElementById('toggleContent'); // Parent node for the languages list
          languagesList.parentNode.appendChild(languageItem); // Add the new language at the end

          // Highlight the new language
          highlightActiveItem(languageItem);

          // Hide the context menu if it's visible
          document.getElementById("contextMenu2").style.display = "none";

          // Reset the flag after form load logic completes
          setTimeout(() => {
            isLanguageFormLoading = false;
          }, 500);
        }




        // Function to display the language form
        function showLanguageForm(languageNumber) {
          //console.log("The showLanguageForm function has been called");

          const formContent = `
            <form action="http://localhost:3019/post-language" id="language-form" method="POST" class="metadata-form"  data-language-id="language${languageNumber}">
              <label>Id:</label>
                  <select name="lang_id">
                      <option value="eng">ISO639-3:eng</option>
                      <option value="spa">ISO639-3:spa</option>
                      <option value="fra">ISO639-3:fra</option>
                      <option value="deu">ISO639-3:deu</option>
                      <option value="zho">ISO639-3:zho</option>
                      <option value="jpn">ISO639-3:jpn</option>
                      <option value="rus">ISO639-3:rus</option>
                      <option value="ell">ISO639-3:ell</option>
                  </select>
                <label>Name:</label>
                <input type="text" name="lang_name" placeholder="Enter the name for Language ${languageNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                <label>Dominant:</label>
                <input type="text" name="dominant" placeholder="------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                <label>Source Language:</label>
                <input type="text" name="source_lang" placeholder="------------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>                
                <label>Target Language:</label>
                <input type="text" name="target_lang" placeholder="-------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
                <button class="done-btn" data-form-type="language" type="button" onclick="initializeDoneButton()">Save temporarily</button>
            </form>`;

            const metadataFormContainer = document.getElementById('metadata-form-container');
            metadataFormContainer.innerHTML = formContent;

            // Compile the form content so AngularJS can process it
            const scope = angular.element(metadataFormContainer).scope();
            angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
                $compile(metadataFormContainer)(scope);
            }]);

            scope.$apply(); // Trigger AngularJS digest cycle to reflect changes
        }

        // Show the context menu when hovering over the arrow icon
        function showMenu2(e) {
            e.preventDefault();

            // Get the "Languages" list item position-------------------------------how when i only left one context meny-the same with actors?-----
            //Telika sigoura thelei 2 context menu
            var menu = document.getElementById("contextMenu2");
            var rect = arrowIconElement2.getBoundingClientRect();

            // Set the context menu position relative to the arrow icon
            menu.style.display = 'block';
            menu.style.left = (rect.right - 160) + "px";  // Position it to the right of the arrow icon
            menu.style.top = (rect.top - 120) + "px";     // Align it vertically with the arrow icon
        }

        // Hide the context menu when the mouse leaves the arrow or the context menu
        function hideMenu2() {
            document.getElementById("contextMenu2").style.display = "none";
        }

        // Add event listeners for hover behavior
        arrowIconElement2.addEventListener('mouseover', showMenu2);
        arrowIconElement2.addEventListener('mouseout', hideMenu2);

        // Keep the context menu visible when hovering over it
        var contextMenu2 = document.getElementById('contextMenu2');
        contextMenu2.addEventListener('mouseover', function() {
            contextMenu2.style.display = 'block';
        });
        contextMenu2.addEventListener('mouseout', function() {
            contextMenu2.style.display = 'none';
        });

        // Add event listener for "Add a Language" option
        var addLanguageOption = document.querySelector('#contextMenu2 ul li'); 
        addLanguageOption.addEventListener('click', loadLanguageForm);

        //Reset the flag after form load logic completes
        setTimeout(() => {
          isLanguageFormLoading = false;
        }, 500);
      


        //The higlight function that will emphasize the element's form that has been clicked-------------------------------------------------------------
        function highlightActiveItem(element){
          //console.log("highlighting current item: ", currentItem);
          //clear previous active states
          document.querySelectorAll('.form-switch').forEach((item) =>{
              item.classList.remove('active-item');
          });

          //Highlight the current element
          element.classList.add('active-item');

        }

        // Global Metadata Object
        var metadata = {
          recording: {}, // Data for the recording form
          content: {},  //Data for the content form
          actors: {},    // Data for multiple actor forms
          languages: {}, // Data for multiple language forms
        };


        // Function to handle the "Done" button click for any form--------------------------------------------------
        function initializeDoneButton() {
          console.log("inside initializeDoneButton");

          const formType = event.target.dataset.formType; // Form type (e.g., 'recording', 'content', 'actor', 'language')
          const form = document.querySelector(`#${formType}-form`);

          if (!form) {
            console.error(`Form with ID ${formType}-form not found.`);
            return;
          }

          // Save form data to the metadata object
          const formData = new FormData(form);

          if (formType === "recording") {
            metadata.recording = {}; // Clear existing data for recording
            for (const [key, value] of formData.entries()) {
              metadata.recording[key] = value; // Store recording data
            }
            console.log("Recording data saved:", metadata.recording);
          } else if (formType === "content") {
            metadata.content = {}; // Clear existing data for content
            for (const [key, value] of formData.entries()) {
              metadata.content[key] = value; // Store content data
            }
            console.log("Content data saved:", metadata.content);
          } else if (formType === "actor") {
            const actorId = form.dataset.actorId; // Unique ID for the actor form
            if (!actorId) {
              console.error("Actor ID is missing from the form.");
              return;
            }
            metadata.actors[actorId] = {}; // Clear existing data for this actor
            for (const [key, value] of formData.entries()) {
              metadata.actors[actorId][key] = value; // Store actor data
            }
            console.log(`Actor ${actorId} data saved:`, metadata.actors[actorId]);

            // Update the Actor name in the menu
            const fullName = metadata.actors[actorId].full_name || `Actor ${actorId.replace('actor', '')}`;
            const actorMenuItem = document.getElementById(actorId);
            if (actorMenuItem) {
              const actorNameSpan = actorMenuItem.querySelector('span');
              if (actorNameSpan) actorNameSpan.textContent = fullName; // Update span text
            }
          } else if (formType === "language") {
            console.log("specifically, the language done button has been clicked");
            const languageId = form.dataset.languageId; // Unique ID for the language form
            if (!languageId) {
              console.error("Language ID is missing from the form.");
              return;
            }
            metadata.languages[languageId] = {}; // Clear existing data for this language
            for (const [key, value] of formData.entries()) {
              metadata.languages[languageId][key] = value; // Store language data
            }
            console.log(`Language ${languageId} data saved:`, metadata.languages[languageId]);

            // Update the Language name in the menu
            const name = metadata.languages[languageId].lang_name || `Language ${languageId.replace('language', '')}`;
            const languageMenuItem = document.getElementById(languageId);
            if (languageMenuItem) {
              const languageNameSpan = languageMenuItem.querySelector('span');
              if (languageNameSpan) languageNameSpan.textContent = name; // Update span text
            }
          }

          alert(`${formType} data saved temporarily!`); // Notify the user
          console.log("Current metadata:", metadata); // Debug log

          console.log("at then end of the initiliazeDoneButton");  
        
 
        }



        // Function to populate form fields with saved data when revisiting a form-------------------------------------------------
        function populateForm(formType, id) {
          //console.log("Inside populateForm-----------------------------------------");
          //console.log(`Populating form for ${formType} ${id ? `with ID ${id}` : ""}`);
          const form = document.querySelector(`#${formType}-form`);

          const data =
            formType === "recording"
              ? metadata.recording
            : formType === "content"
              ? metadata.content
            : formType === "actor"
              ? metadata.actors[id]
            : metadata.languages[id]; // Get saved data for the specific form type and ID

          if (data) {
            for (const key in data) {
              const input = form.querySelector(`[name=${key}]`);
              if (input) {
                input.value = data[key]; // Populate input fields
               // console.log("Populated field:", key, "with value:", input.value);
              }
            }
          }
        }


        function populateFromStorage(formType, formData, formId) {
          const formSelector = `#${formType}-form`;
          const form = document.querySelector(formSelector);
          if (form) {
              for (const key in formData) {
                  const input = form.querySelector(`[name=${key}]`);
                  if (input) {
                      input.value = formData[key];
                  }else {
                  }
              }
          } else {
              console.log("Form not found:", formSelector);
          }
        }


        //save all button*****************************************************************************************************************:
        document.getElementById("emuwebapp-modal-save").addEventListener("click", function () {
          // 1) Ask for confirmation
          const confirmation = confirm(
            "If you click Save, the data will be stored permanently in the database.\n\n" +
            "If you want to temporarily save data, use the Save temporarily button."
          );
          if (!confirmation) return;

          console.log("Saving all metadata permanently to the database...");

          // 2) First, pull any live fields into metadata (in case the user typed but never clicked 'Save temporarily'):

          // ── Recording form ──
          const recForm = document.querySelector("#recording-form");
          if (recForm) {
            // overwrite metadata.recording with whatever is in the form now
            metadata.recording = {};
            new FormData(recForm).forEach((value, key) => {
              metadata.recording[key] = value;
            });
          }

          // ── Content form ──
          const contForm = document.querySelector("#content-form");
          if (contForm) {
            metadata.content = {};
            new FormData(contForm).forEach((value, key) => {
              metadata.content[key] = value;
            });
          }

          // ── Actor form ──
          const actorFormElem = document.querySelector("#actor-form");
          if (actorFormElem) {
            const actorId = actorFormElem.dataset.actorId; // e.g. "actor2"
            metadata.actors[actorId] = {};
            new FormData(actorFormElem).forEach((value, key) => {
              metadata.actors[actorId][key] = value;
            });
          }

          // ── Language form ──
          const langFormElem = document.querySelector("#language-form");
          if (langFormElem) {
            const languageId = langFormElem.dataset.languageId; // e.g. "language1"
            metadata.languages[languageId] = {};
            new FormData(langFormElem).forEach((value, key) => {
              metadata.languages[languageId][key] = value;
            });
          }

          // 3) Now read whatever was already saved in localStorage for this file, so we don’t wipe out missing sections:
          const name = currentFileName();
          const savedDataKey = `savedMetadata_${name}`;
          const savedFlagKey = `metadataSaved_${name}`;

          let existing = {};
          try {
            existing = JSON.parse(localStorage.getItem(savedDataKey)) || {};
          } catch {
            existing = {};
          }

          // 4) Choose recording/content/actors/languages either from metadata or from existing in localStorage:
          const recObj = Object.keys(metadata.recording).length
            ? metadata.recording
            : (existing.recording || {});

          const contObj = Object.keys(metadata.content).length
            ? metadata.content
            : (existing.content || {});

          const actorsArr = Object.values(metadata.actors).length
            ? Object.values(metadata.actors)
            : (Array.isArray(existing.actors) ? existing.actors : []);

          const langsArr = Object.values(metadata.languages).length
            ? Object.values(metadata.languages)
            : (Array.isArray(existing.languages) ? existing.languages : []);

          // 5) Build the final consolidated object
          const consolidatedMetadata = {
            recording: recObj, 
            content: contObj,
            actors: actorsArr,
            languages: langsArr
          };

          // 6) Send to server
          fetch("http://localhost:3019/save-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(consolidatedMetadata)
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              alert("All metadata have been saved successfully!");

              // 7) Store back into localStorage under this file’s key
              localStorage.setItem(savedDataKey, JSON.stringify(consolidatedMetadata));
              localStorage.setItem(savedFlagKey, "true");
              console.log("Server response:", data);
            })
            .catch(error => {
              console.error("Error saving metadata:", error);
              alert("An error occurred while saving metadata.");
            });
        });


        // Cancel button: clear all metadata for this file, reset forms, remove actor/language items
        document.getElementById("MetaCancelBtn").addEventListener("click", function () {
          console.log("Cancel button...");

          // 1) Remove this file’s saved entries from localStorage
          const name = currentFileName();
          localStorage.removeItem(`metadataSaved_${name}`);
          localStorage.removeItem(`savedMetadata_${name}`);

          // 2) Clear in‐memory metadata object
          metadata.recording = {};
          metadata.content   = {};
          metadata.actors    = {};
          metadata.languages = {};

          // 3) Reset any live forms
          const forms = document.querySelectorAll(".metadata-form");
          forms.forEach((form) => form.reset());

          // 4) Remove all dynamically added actor <li> elements
          document.querySelectorAll(".actor-item").forEach((el) => el.remove());
          actorCount = 0;  // reset actor counter

          // 5) Remove all dynamically added language <li> elements
          document.querySelectorAll(".language-item").forEach((el) => el.remove());
          languageCount = 0;  // reset language counter

          // 6) Reset the visible “Actor #” and “Language #” labels
          //    (if any remain, though we’ve removed all .actor-item/.language-item above)
          document.querySelectorAll(".actor-item span").forEach((span, index) => {
            span.textContent = `Actor ${index + 1}`;
          });
          document.querySelectorAll(".language-item span").forEach((span, index) => {
            span.textContent = `Language ${index + 1}`;
          });

          alert("All data cleared successfully!");
        });


