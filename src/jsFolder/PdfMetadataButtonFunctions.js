    var arrowIconLanguagesElement = document.getElementById('arrowIconLanguages');
    var arrowIconAuthorsElement = document.getElementById('arrowIconAuthors');

    var toggleKeyIcon = document.getElementById('toggleKeyIcon'); // Add this line
    var toggleKeyIconAuthorsElement = document.getElementById('toggleKeyIconAuthors');

    var toggleKeyIconAuthors = document.getElementById('toggleKeyIconAuthors');
    var toggleKeyIconLanguages = document.getElementById('toggleKeyIconLanguages');

    var additionalItemsElement = document.getElementById('additionalItems');
    var languageCount = 0;       // Counter for languages
    var authorCount = 0;         // Counter for authors
    var isAuthorFormLoading = false;
    var isLanguageFormLoading = false;

    // localStorage.removeItem('metadataSaved');
    // localStorage.removeItem('savedMetadata');


    // Global metadata object: note 'authors' now in place of 'actors'
    var metadata = {
      corpus: {},     // Data for the corpus (formerly recording)
      authors: {},    // Data for multiple author forms
      languages: {}   // Data for multiple language forms
    };

    // Toggle visibility of additional items (Authors and Languages)
    function toggleAdditionalItems() {
      if (additionalItemsElement.style.display === "none" || additionalItemsElement.style.display === "") {
        additionalItemsElement.style.display = "block";
        toggleKeyIcon.classList.remove("fa-key");
        toggleKeyIcon.classList.add("fa-unlock");
      } else {
        additionalItemsElement.style.display = "none";
        toggleKeyIcon.classList.remove("fa-unlock");
        toggleKeyIcon.classList.add("fa-key");
      }
    }

    function showExportOptions(event) {
      event.stopPropagation();
      var menu = document.getElementById('exportOptions');
      if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      }
    }
    document.addEventListener('click', function() {
      var menu = document.getElementById("exportOptions");
      if (menu) { menu.style.display = "none"; }
    });

    // Load the corpus form and language form based on formType
    function loadForm(formType) {
      let formContent = '';
      // Map 'name_of_file' to 'corpus'
      const formTypeMapping = {
        'name_of_file': 'corpus'
      };
      const mappedFormType = formTypeMapping[formType] || formType;
      const currentItem = document.querySelector(`.form-switch[data-form-type="${mappedFormType}"]`);
      if (currentItem) { highlightActiveItem(currentItem); }
      else { console.error("currentItem is null for formType:", mappedFormType); }

      if (mappedFormType === 'corpus') {
        // New corpus form for PDF
        formContent = `
          <form action="http://localhost:3019/post-corpus" id="corpus-form" method="POST" class="metadata-form">
            <label>Document Title:</label>
            <input type="text" name="doc_title" placeholder="Enter document title" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
            <label>Corpus Type:</label>
            <select name="corpus_type">
              <option value="academic">Academic</option>
              <option value="conversation">Conversation</option>
            </select>
            <label>Genre:</label>
            <select name="genre">
              <option value="fiction">Fiction</option>
              <option value="news">News</option>
              <option value="interview">Interview</option>
              <option value="medicine">Medicine</option>
              <option value="law">Law</option>
              <option value="historic">Historic</option>
            </select>
            <label>Publication Year:</label>
            <input type="number" name="pub_year" placeholder="Enter publication year" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
            <label>Corpus Purpose:</label>
            <select name="corpus_purpose">
              <option value="speech_analysis">Speech Analysis</option>
              <option value="linguistics">Linguistics</option>
            </select>
            <label>Word Count:</label>
            <input type="number" name="word_count" placeholder="Enter word count" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()" />
            <button class="done-btn" data-form-type="corpus" type="button" onclick="initializeDoneButton()">Save temporarily</button>
          </form>
        `;
      }
      // Set content and compile AngularJS
      const metadataFormContainer = document.getElementById('metadata-form-container');
      metadataFormContainer.innerHTML = formContent;
      const scope = angular.element(metadataFormContainer).scope();
      angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
        $compile(metadataFormContainer)(scope);
      }]);
      scope.$apply();
      // Optionally, populate from saved data if available
      if (localStorage.getItem('metadataSaved') === 'true') {
        const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
        if (savedMetadata && savedMetadata[mappedFormType]) {
          populateFromStorage(mappedFormType, savedMetadata[mappedFormType]);
        }
      }
      populateForm(mappedFormType);
    }

    // ---- Author Functions (similar to Actor functions) ----

    function loadAuthorForm(event) {
      if (isAuthorFormLoading) return;
      isAuthorFormLoading = true;

      toggleKeyIconAuthors.classList.remove("fa-key");
      toggleKeyIconAuthors.classList.add("fa-unlock");

      authorCount++;

      const authorItem = document.createElement('li');
      authorItem.id = `author${authorCount}`;
      authorItem.classList.add("form-switch", "author-item");
      authorItem.dataset.formType = "author";
      authorItem.dataset.id = `author${authorCount}`;

      const diamondIcon = document.createElement('i');
      diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');

      const authorNameSpan = document.createElement('span');
      authorNameSpan.textContent = `Author ${authorCount}`;
      authorNameSpan.classList.add('author-name-span');

      authorItem.appendChild(diamondIcon);
      authorItem.appendChild(authorNameSpan);
      
      authorItem.onclick = ((currentAuthorCount) => {
        return function () {
          highlightActiveItem(authorItem);
          showAuthorForm(currentAuthorCount);

          if (localStorage.getItem('metadataSaved') === 'true') {
            const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
            if (savedMetadata && savedMetadata.authors && savedMetadata.authors[currentAuthorCount - 1]) {
              populateFromStorage('author', savedMetadata.authors[currentAuthorCount - 1], `author${currentAuthorCount}`);
            }
          }
          populateForm("author", `author${currentAuthorCount}`);
        };
      })(authorCount);

      const authorsList = document.getElementById('author');
      authorsList.appendChild(authorItem);

      highlightActiveItem(authorItem);
      document.getElementById("authorContextMenu").style.display = "none";
      setTimeout(() => { isAuthorFormLoading = false; }, 500);
    }

    function showAuthorForm(authorNumber) {
      const formContent = `
        <form action="http://localhost:3019/post-pdf-author" id="author-form" method="POST" class="metadata-form" data-author-id="author${authorNumber}">
          <label>Name:</label>
          <input type="text" name="first_name" placeholder="Enter first name for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Full name:</label>
          <input type="text" name="full_name" placeholder="Enter full name for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Age:</label>
          <input type="number" name="age" placeholder="Enter age for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Sex:</label>
          <select name="sex">
              <option value="female">female</option>
              <option value="male">male</option>
          </select>
          <label>Education:</label>
          <input type="text" name="education" placeholder="Enter education for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Ethnic Group:</label>
          <input type="text" name="ethnicity" placeholder="Enter ethnic group for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Contact email:</label>
          <input type="text" name="email" placeholder="Enter email for Author ${authorNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <button class="done-btn" data-form-type="author" type="button" onclick="initializeDoneButton()">Save temporarily</button>
        </form>
      `;
      const metadataFormContainer = document.getElementById('metadata-form-container');
      metadataFormContainer.innerHTML = formContent;
      const scope = angular.element(metadataFormContainer).scope();
      angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
        $compile(metadataFormContainer)(scope);
      }]);
      scope.$apply();
    }


    // Show the context menu when hovering over the arrow icon
    function showMenu(e) {
      e.preventDefault();

      // Get the "Actors" list item position
      var menu = document.getElementById("authorContextMenu");
      var rect = arrowIconAuthorsElement.getBoundingClientRect();

      // Set the context menu position relative to the arrow icon
      menu.style.display = 'block';
      menu.style.left = (rect.right - 160) + "px";  // Position it to the right of the arrow icon
      menu.style.top = (rect.top - 120) + "px";     // Align it vertically with the arrow icon
    }

    // Hide the context menu when the mouse leaves the arrow or the context menu
    function hideMenu() {
        document.getElementById("authorContextMenu").style.display = "none";
    }


    // Add event listeners for hover behavior
    arrowIconAuthorsElement.addEventListener('mouseover', showMenu);
    arrowIconAuthorsElement.addEventListener('mouseout', hideMenu);

    // Keep the context menu visible when hovering over it
    var contextMenu = document.getElementById('authorContextMenu');
    contextMenu.addEventListener('mouseover', function() {
        contextMenu.style.display = 'block';
    });
    contextMenu.addEventListener('mouseout', function() {
        contextMenu.style.display = 'none';
    });

    // Add event listener for "Add an Actor" option
    var addAuthorOption = document.querySelector('#authorContextMenu ul li'); 
    addAuthorOption.addEventListener('click', loadAuthorForm);





    // ---- Language Functions (similar to previous version) ----

    function loadLanguageForm() {
      if (isLanguageFormLoading) return;
      isLanguageFormLoading = true;

      toggleKeyIconLanguages.classList.remove("fa-key");
      toggleKeyIconLanguages.classList.add("fa-unlock");

      languageCount++;

      const languageItem = document.createElement('li');
      languageItem.id = `language${languageCount}`;
      languageItem.classList.add("form-switch", "language-item");
      languageItem.dataset.formType = "language";
      languageItem.dataset.id = `language${languageCount}`;

      const diamondIcon = document.createElement('i');
      diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');

      const languageNameSpan = document.createElement('span');
      languageNameSpan.textContent = `Language ${languageCount}`;
      languageNameSpan.classList.add('language-name-span');

      languageItem.appendChild(diamondIcon);
      languageItem.appendChild(languageNameSpan);

      languageItem.onclick = ((currentLanguageCount) => {
        return function () {
          highlightActiveItem(languageItem);
          showLanguageForm(currentLanguageCount);

          if (localStorage.getItem('metadataSaved') === 'true') {
            const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
            if (savedMetadata && savedMetadata.languages && savedMetadata.languages[currentLanguageCount - 1]) {
              populateFromStorage('language', savedMetadata.languages[currentLanguageCount - 1], `language${currentLanguageCount}`);
            }
          }
          populateForm("language", `language${currentLanguageCount}`);
        };
      })(languageCount);


      const languagesList = document.getElementById('language');
      languagesList.parentNode.appendChild(languageItem);

      highlightActiveItem(languageItem);

      document.getElementById("languageContextMenu").style.display = "none";

      setTimeout(() => { isLanguageFormLoading = false; }, 500);
    }



    function showLanguageForm(languageNumber) {
      const formContent = `
        <form action="http://localhost:3019/post-pdf-language" id="language-form" method="POST" class="metadata-form" data-language-id="language${languageNumber}">
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
          <input type="text" name="lang_name" placeholder="Enter name for Language ${languageNumber}" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Dominant:</label>
          <input type="text" name="dominant" placeholder="------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <label>Source Language:</label>
          <input type="text" name="source_lang" placeholder="------------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>                
          <label>Target Language:</label>
          <input type="text" name="target_lang" placeholder="-------" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
          <button class="done-btn" data-form-type="language" type="button" onclick="initializeDoneButton()">Save temporarily</button>
        </form>
      `;
      const metadataFormContainer = document.getElementById('metadata-form-container');
      metadataFormContainer.innerHTML = formContent;
      
      const scope = angular.element(metadataFormContainer).scope();
      angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
        $compile(metadataFormContainer)(scope);
      }]);

      scope.$apply();
    }


    function showLanguageMenu(e) {
      e.preventDefault();
      
      var menu = document.getElementById("languageContextMenu");
      var rect = arrowIconLanguagesElement.getBoundingClientRect();
      
      menu.style.display = 'block';
      menu.style.left = (rect.right - 125) + "px";
      menu.style.top = (rect.top - 110) + "px";
    }


    function hideLanguageMenu() {
      document.getElementById("languageContextMenu").style.display = "none";
    }


    arrowIconLanguagesElement.addEventListener('mouseover', showLanguageMenu);
    arrowIconLanguagesElement.addEventListener('mouseout', hideLanguageMenu);
    
    document.getElementById("languageContextMenu").addEventListener('mouseover', function(){
      document.getElementById("languageContextMenu").style.display = 'block';
    });
   
    document.getElementById("languageContextMenu").addEventListener('mouseout', function(){
      document.getElementById("languageContextMenu").style.display = 'none';
    });


    // ---- Utility: Highlight active item ----
    function highlightActiveItem(element) {
      document.querySelectorAll('.form-switch').forEach((item) => {
        item.classList.remove('active-item');
      });
      element.classList.add('active-item');
    }

    // ---- Done Button and Data Saving ----
    function initializeDoneButton() {
      const formType = event.target.dataset.formType; // 'corpus', 'author', 'language'
      const form = document.querySelector(`#${formType}-form`);
      if (!form) { console.error(`Form with ID ${formType}-form not found.`); return; }
      const formData = new FormData(form);
      if (formType === "corpus") {
        metadata.corpus = {};
        for (const [key, value] of formData.entries()) {
          metadata.corpus[key] = value;
        }
        console.log("Corpus data saved:", metadata.corpus);
      } else if (formType === "author") {
        const authorId = form.dataset.authorId;
        if (!authorId) { console.error("Author ID is missing."); return; }
        metadata.authors[authorId] = {};
        for (const [key, value] of formData.entries()) {
          metadata.authors[authorId][key] = value;
        }
        console.log(`Author ${authorId} data saved:`, metadata.authors[authorId]);
        const fullName = metadata.authors[authorId].full_name || `Author ${authorId.replace('author', '')}`;
        const authorMenuItem = document.getElementById(authorId);
        if (authorMenuItem) {
          const nameSpan = authorMenuItem.querySelector('span');
          if (nameSpan) nameSpan.textContent = fullName;
        }
      } else if (formType === "language") {
        const languageId = form.dataset.languageId;
        if (!languageId) { console.error("Language ID is missing."); return; }
        metadata.languages[languageId] = {};
        for (const [key, value] of formData.entries()) {
          metadata.languages[languageId][key] = value;
        }
        console.log(`Language ${languageId} data saved:`, metadata.languages[languageId]);
        const name = metadata.languages[languageId].lang_name || `Language ${languageId.replace('language', '')}`;
        const languageMenuItem = document.getElementById(languageId);
        if (languageMenuItem) {
          const langSpan = languageMenuItem.querySelector('span');
          if (langSpan) langSpan.textContent = name;
        }
      }
      alert(`${formType} data saved temporarily!`);
      console.log("Current metadata:", metadata);
    }

    // ---- Populate Form Data ----
    function populateForm(formType, id) {
      const form = document.querySelector(`#${formType}-form`);
      const data = (formType === "corpus") ? metadata.corpus
                : (formType === "author") ? metadata.authors[id]
                : metadata.languages[id];
      if (data) {
        for (const key in data) {
          const input = form.querySelector(`[name=${key}]`);
          if (input) { input.value = data[key]; }
        }
      }
    }

    function populateFromStorage(formType, formData, formId) {
      const formSelector = `#${formType}-form`;
      const form = document.querySelector(formSelector);
      if (form) {
        for (const key in formData) {
          const input = form.querySelector(`[name=${key}]`);
          if (input) { input.value = formData[key]; }
        }
      } else { console.log("Form not found:", formSelector); }
    }

    // ---- Save Metadata to Server ----
    document.getElementById("emuwebapp-modal-save").addEventListener("click", function () {
      const confirmation = confirm(
        "If you click Save, the data will be stored permanently in the database.\n\nIf you want to temporarily save data, use the Save temporarily button."
      );
      if (!confirmation) return;
      console.log("Saving all PDF metadata permanently...");
      const forms = document.querySelectorAll(".metadata-form");
      forms.forEach((form) => {
        const formType = form.id.replace("-form", "");
        const formData = new FormData(form);
        if (formType === "corpus") {
          metadata.corpus = {};
          for (const [key, value] of formData.entries()) {
            metadata.corpus[key] = value;
          }
        } else if (formType === "author") {
          const authorId = form.dataset.authorId;
          if (authorId) {
            metadata.authors[authorId] = {};
            for (const [key, value] of formData.entries()) {
              metadata.authors[authorId][key] = value;
            }
          }
        } else if (formType === "language") {
          const languageId = form.dataset.languageId;
          if (languageId) {
            metadata.languages[languageId] = {};
            for (const [key, value] of formData.entries()) {
              metadata.languages[languageId][key] = value;
            }
          }
        }
      });
      const consolidatedMetadata = {
        corpus: metadata.corpus,
        authors: Object.values(metadata.authors),
        languages: Object.values(metadata.languages)
      };
      // Updated endpoint for PDF metadata
      fetch("http://localhost:3019/save-pdf-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consolidatedMetadata),
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        alert("All PDF metadata have been saved successfully!");
        localStorage.setItem('savedMetadata', JSON.stringify(consolidatedMetadata));
        localStorage.setItem('metadataSaved', 'true');
        console.log("Server response:", data);
      })
      .catch(error => {
        console.error("Error saving metadata:", error);
        alert("An error occurred while saving metadata.");
      });
    });
    

    // ---- Cancel Button: Clear Metadata and Reset Forms ----
    document.getElementById("MetaCancelBtn").addEventListener("click", function () {
      localStorage.removeItem('metadataSaved');
      localStorage.removeItem('savedMetadata');
      metadata.corpus = {};
      metadata.authors = {};
      metadata.languages = {};
      const forms = document.querySelectorAll(".metadata-form");
      forms.forEach(form => form.reset());
      document.querySelectorAll(".author-item span").forEach((span, index) => {
        span.textContent = `Author ${index + 1}`;
      });
      document.querySelectorAll(".language-item span").forEach((span, index) => {
        span.textContent = `Language ${index + 1}`;
      });
      alert("All data cleared successfully!");
    });
