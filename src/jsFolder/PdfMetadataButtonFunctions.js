// PdfMetadataButtonFunctions.js

// ── Utility: Get current file name from the “Corpus Name” <li> ──
function currentFileName() {
  const span = document.querySelector('#corpusName span');
  return span ? span.textContent.trim() : '';
}

// Declare arrow/icon elements
var arrowIconLanguagesElement   = document.getElementById('arrowIconLanguages');
var arrowIconAuthorsElement     = document.getElementById('arrowIconAuthors');
var toggleKeyIcon               = document.getElementById('toggleKeyIcon');
var toggleKeyIconAuthorsElement = document.getElementById('toggleKeyIconAuthors');
var toggleKeyIconLanguages      = document.getElementById('toggleKeyIconLanguages');

var additionalItemsElement = document.getElementById('additionalItems');
var languageCount         = 0;       // Counter for languages
var authorCount           = 0;       // Counter for authors
var isAuthorFormLoading   = false;
var isLanguageFormLoading = false;

// Global metadata object: now includes per‐file “authors” and “languages”
var metadata = {
  corpus:   {},    // Data for the corpus (formerly recording)
  authors:  {},    // Data for multiple author forms
  languages: {}    // Data for multiple language forms
};

// ── Toggle visibility of “Authors” & “Languages” ──
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

// ── Load the “Corpus” (PDF) form and rebuild any saved authors/languages ──
function loadForm(formType) {
  let formContent = '';
  // Map 'name_of_file' → 'corpus'
  const formTypeMapping = { 'name_of_file': 'corpus' };
  const mappedFormType  = formTypeMapping[formType] || formType;
  const currentItem     = document.querySelector(`.form-switch[data-form-type="${mappedFormType}"]`);

  if (currentItem) {
    highlightActiveItem(currentItem);
  } else {
    console.error("currentItem is null for formType:", mappedFormType);
  }

  // ── Before rendering the “corpus” form, reconstruct saved authors/languages if any ──
  if (mappedFormType === 'corpus') {
    const name         = currentFileName();
    const savedFlagKey = `metadataSaved_${name}`;
    const savedDataKey = `savedMetadata_${name}`;
    let savedMetadata  = {};

    if (localStorage.getItem(savedFlagKey) === 'true') {
      try {
        savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
      } catch {
        savedMetadata = {};
      }
    }

    // Re‐build author menu items and repopulate metadata.authors
    if (Array.isArray(savedMetadata.authors)) {
      authorCount = 0;
      document.querySelectorAll('.author-item').forEach(el => el.remove());
      const authorsList = document.getElementById('author');
      savedMetadata.authors.forEach((authorData, idx) => {
        const i = idx + 1;
        authorCount = i;

        // Store into in‐memory metadata
        const authorId = `author${i}`;
        metadata.authors[authorId] = authorData;

        // Create the <li> for this author
        const authorItem = document.createElement('li');
        authorItem.id = authorId;
        authorItem.classList.add("form-switch", "author-item");
        authorItem.dataset.formType = "author";
        authorItem.dataset.id = authorId;

        const diamondIcon    = document.createElement('i');
        diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');
        const authorNameSpan = document.createElement('span');
        authorNameSpan.textContent = authorData.full_name || `Author ${i}`;
        authorNameSpan.classList.add('author-name-span');

        authorItem.appendChild(diamondIcon);
        authorItem.appendChild(authorNameSpan);

        // When clicked, show that author’s form and populate from storage
        authorItem.onclick = ((currentAuthorCount) => {
          return function () {
            highlightActiveItem(authorItem);
            showAuthorForm(currentAuthorCount);
            populateFromStorage(
              'author',
              savedMetadata.authors[currentAuthorCount - 1],
              `author${currentAuthorCount}`
            );
            populateForm('author', `author${currentAuthorCount}`);
          };
        })(i);

        authorsList.appendChild(authorItem);
      });
    }

    // Re‐build language menu items and repopulate metadata.languages
    if (Array.isArray(savedMetadata.languages)) {
      languageCount = 0;
      document.querySelectorAll('.language-item').forEach(el => el.remove());
      const languagesParent = document.getElementById('language').parentNode;

      savedMetadata.languages.forEach((langData, idx) => {
        const i = idx + 1;
        languageCount = i;

        // Store into in‐memory metadata
        const langId = `language${i}`;
        metadata.languages[langId] = langData;

        const languageItem = document.createElement('li');
        languageItem.id = langId;
        languageItem.classList.add('form-switch', 'language-item');
        languageItem.dataset.formType = 'language';
        languageItem.dataset.id = langId;

        const diamondIcon      = document.createElement('i');
        diamondIcon.classList.add('bi', 'bi-suit-diamond-fill');
        const languageNameSpan = document.createElement('span');
        languageNameSpan.textContent = langData.lang_name || `Language ${i}`;
        languageNameSpan.classList.add('language-name-span');

        languageItem.appendChild(diamondIcon);
        languageItem.appendChild(languageNameSpan);

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

  // ── Generate form content based on formType ──
  if (mappedFormType === 'corpus') {
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

  // ── Inject the form HTML and compile with AngularJS ──
  const metadataFormContainer = document.getElementById('metadata-form-container');
  metadataFormContainer.innerHTML = formContent;
  const scope = angular.element(metadataFormContainer).scope();
  angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
    $compile(metadataFormContainer)(scope);
  }]);
  scope.$apply();

  // ── After rendering the new form, repopulate “corpus” fields if saved ──
  const name         = currentFileName();
  const savedFlagKey = `metadataSaved_${name}`;
  const savedDataKey = `savedMetadata_${name}`;

  if (localStorage.getItem(savedFlagKey) === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
    if (savedMetadata && savedMetadata[mappedFormType]) {
      populateFromStorage(mappedFormType, savedMetadata[mappedFormType]);
    }
  }
  populateForm(mappedFormType);
}

// ── Function to load the “Author” form ──
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

  const diamondIcon    = document.createElement('i');
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

      const name         = currentFileName();
      const savedFlagKey = `metadataSaved_${name}`;
      const savedDataKey = `savedMetadata_${name}`;

      if (localStorage.getItem(savedFlagKey) === 'true') {
        const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
        if (
          savedMetadata &&
          Array.isArray(savedMetadata.authors) &&
          savedMetadata.authors[currentAuthorCount - 1]
        ) {
          populateFromStorage(
            'author',
            savedMetadata.authors[currentAuthorCount - 1],
            `author${currentAuthorCount}`
          );
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

// ── Display the “Author” form ──
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

// ── Show/hide the author-context menu on hover ──
function showMenu(e) {
  e.preventDefault();
  var menu = document.getElementById("authorContextMenu");
  var rect = arrowIconAuthorsElement.getBoundingClientRect();
  menu.style.display = 'block';
  menu.style.left = (rect.right - 160) + "px";
  menu.style.top = (rect.top - 120) + "px";
}
function hideMenu() {
  document.getElementById("authorContextMenu").style.display = "none";
}
arrowIconAuthorsElement.addEventListener('mouseover', showMenu);
arrowIconAuthorsElement.addEventListener('mouseout', hideMenu);
var contextMenu = document.getElementById('authorContextMenu');
contextMenu.addEventListener('mouseover', function() {
  contextMenu.style.display = 'block';
});
contextMenu.addEventListener('mouseout', function() {
  contextMenu.style.display = 'none';
});
var addAuthorOption = document.querySelector('#authorContextMenu ul li'); 
addAuthorOption.addEventListener('click', loadAuthorForm);

// ── Load the “Language” form ──
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

  const diamondIcon      = document.createElement('i');
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

      const name         = currentFileName();
      const savedFlagKey = `metadataSaved_${name}`;
      const savedDataKey = `savedMetadata_${name}`;

      if (localStorage.getItem(savedFlagKey) === 'true') {
        const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
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

  const languagesList = document.getElementById('language');
  languagesList.parentNode.appendChild(languageItem);

  highlightActiveItem(languageItem);
  document.getElementById("languageContextMenu").style.display = "none";
  setTimeout(() => { isLanguageFormLoading = false; }, 500);
}

// ── Display the “Language” form ──
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

// ── Highlight the active sidebar item ──
function highlightActiveItem(element) {
  document.querySelectorAll('.form-switch').forEach((item) => {
    item.classList.remove('active-item');
  });
  element.classList.add('active-item');
}

// ── “Save temporarily” button logic ──
function initializeDoneButton() {
  const formType = event.target.dataset.formType; // 'corpus', 'author', 'language'
  const form     = document.querySelector(`#${formType}-form`);
  if (!form) {
    console.error(`Form with ID ${formType}-form not found.`);
    return;
  }

  const formData = new FormData(form);
  if (formType === "corpus") {
    metadata.corpus = {};
    formData.forEach((value, key) => {
      metadata.corpus[key] = value;
    });
    console.log("Corpus data saved:", metadata.corpus);

  } else if (formType === "author") {
    const authorId = form.dataset.authorId;
    if (!authorId) {
      console.error("Author ID is missing.");
      return;
    }
    metadata.authors[authorId] = {};
    formData.forEach((value, key) => {
      metadata.authors[authorId][key] = value;
    });
    console.log(`Author ${authorId} data saved:`, metadata.authors[authorId]);

    // Update the menu label
    const fullName = metadata.authors[authorId].full_name || `Author ${authorId.replace('author', '')}`;
    const authorMenuItem = document.getElementById(authorId);
    if (authorMenuItem) {
      const nameSpan = authorMenuItem.querySelector('span');
      if (nameSpan) nameSpan.textContent = fullName;
    }

  } else if (formType === "language") {
    const languageId = form.dataset.languageId;
    if (!languageId) {
      console.error("Language ID is missing.");
      return;
    }
    metadata.languages[languageId] = {};
    formData.forEach((value, key) => {
      metadata.languages[languageId][key] = value;
    });
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

// ── Populate a form’s fields from in‐memory metadata ──
function populateForm(formType, id) {
  const form = document.querySelector(`#${formType}-form`);
  if (!form) return;

  const data = (formType === "corpus") 
    ? metadata.corpus
    : (formType === "author") 
      ? metadata.authors[id]
      : metadata.languages[id];

  if (data) {
    for (const key in data) {
      const input = form.querySelector(`[name=${key}]`);
      if (input) { 
        input.value = data[key]; 
      }
    }
  }
}

// ── Populate a form’s fields from raw saved‐from‐localStorage data ──
function populateFromStorage(formType, formData, formId) {
  const formSelector = `#${formType}-form`;
  const form = document.querySelector(formSelector);
  if (form) {
    for (const key in formData) {
      const input = form.querySelector(`[name=${key}]`);
      if (input) { input.value = formData[key]; }
    }
  } else {
    console.log("Form not found:", formSelector);
  }
}

// ── “Save all” button: gather everything, merge with existing per-file storage, send to server, then store back ──
document.getElementById("emuwebapp-modal-save").addEventListener("click", function () {
  // 1) Ask for confirmation
  const confirmation = confirm(
    "If you click Save, the data will be stored permanently in the database.\n\n" +
    "If you want to temporarily save data, use the Save temporarily button."
  );
  if (!confirmation) return;

  console.log("Saving all PDF metadata permanently...");

  // 2) Pull any live fields into metadata (in case user typed but didn't click “Save temporarily”):
  // ── Corpus form ──
  const corpusForm = document.querySelector("#corpus-form");
  if (corpusForm) {
    metadata.corpus = {};
    new FormData(corpusForm).forEach((value, key) => {
      metadata.corpus[key] = value;
    });
  }

  // ── Author form ──
  const authorFormElem = document.querySelector("#author-form");
  if (authorFormElem) {
    const authorId = authorFormElem.dataset.authorId;
    metadata.authors[authorId] = {};
    new FormData(authorFormElem).forEach((value, key) => {
      metadata.authors[authorId][key] = value;
    });
  }

  // ── Language form ──
  const langFormElem = document.querySelector("#language-form");
  if (langFormElem) {
    const languageId = langFormElem.dataset.languageId;
    metadata.languages[languageId] = {};
    new FormData(langFormElem).forEach((value, key) => {
      metadata.languages[languageId][key] = value;
    });
  }

  // 3) Load existing per-file data so we don’t stomp on sections the user didn’t touch just now
  const name        = currentFileName();
  const savedDataKey = `savedMetadata_${name}`;
  const savedFlagKey = `metadataSaved_${name}`;

  let existing = {};
  try {
    existing = JSON.parse(localStorage.getItem(savedDataKey)) || {};
  } catch {
    existing = {};
  }

  // 4) Choose each section from “live” metadata or fallback to existing
  const corpusObj = Object.keys(metadata.corpus).length
    ? metadata.corpus
    : (existing.corpus || {});

  const authorsArr = Object.values(metadata.authors).length
    ? Object.values(metadata.authors)
    : (Array.isArray(existing.authors) ? existing.authors : []);

  const langsArr = Object.values(metadata.languages).length
    ? Object.values(metadata.languages)
    : (Array.isArray(existing.languages) ? existing.languages : []);

  // 5) Build final consolidated object
  const consolidatedMetadata = {
    corpus:    corpusObj,
    authors:   authorsArr,
    languages: langsArr
  };

  // 6) Send to server
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

  // ── “Cancel all” button: clear only this file’s keys and reset forms ──
  document.getElementById("MetaCancelBtn").addEventListener("click", function () {
    console.log("Cancel button clicked...");

    // 1) Remove this file’s saved entries from localStorage
    const name = currentFileName();
    localStorage.removeItem(`metadataSaved_${name}`);
    localStorage.removeItem(`savedMetadata_${name}`);

    // 2) Clear in‐memory metadata
    metadata.corpus    = {};
    metadata.authors   = {};
    metadata.languages = {};

    // 3) Reset any live forms
    const forms = document.querySelectorAll(".metadata-form");
    forms.forEach(form => form.reset());

    // 4) Remove all dynamically added author <li> elements
    document.querySelectorAll(".author-item").forEach(el => el.remove());
    authorCount = 0;   // reset author counter

    // 5) Remove all dynamically added language <li> elements
    document.querySelectorAll(".language-item").forEach(el => el.remove());
    languageCount = 0; // reset language counter

    // 6) Reset any remaining “Author #” and “Language #” labels
    document.querySelectorAll(".author-item span").forEach((span, index) => {
      span.textContent = `Author ${index + 1}`;
    });
    document.querySelectorAll(".language-item span").forEach((span, index) => {
      span.textContent = `Language ${index + 1}`;
    });

    alert("All data cleared successfully!");
  });

