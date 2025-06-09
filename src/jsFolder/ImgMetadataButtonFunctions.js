// ImgMetadataButtonFunctions.js
"use strict";

// ── Utility: Get current file name from the “Image Name” <li> ──
function currentFileName() {
  const span = document.querySelector('#imageName span');
  return span ? span.textContent.trim() : '';
}

// Global metadata object for images (in‐memory, per‐file)
var metadata = {
  image: {},       // Data for the image form (e.g. image name)
  basicInfo: {},   // Basic Info fields: title, description, capture_date, photographer, location
  techDetails: {}  // Technical Details fields: file_format, resolution, camera_model, exposure
};

// ── Toggle visibility of “Basic Info” & “Technical Details” ──
function toggleAdditionalItems() {
  var additionalItemsElement = document.getElementById('additionalItems');
  var toggleKeyIconElement   = document.getElementById('toggleKeyIcon');
  if (additionalItemsElement.style.display === "none" || additionalItemsElement.style.display === "") {
    additionalItemsElement.style.display = "block";
    toggleKeyIconElement.classList.remove("fa-key");
    toggleKeyIconElement.classList.add("fa-unlock");
  } else {
    additionalItemsElement.style.display = "none";
    toggleKeyIconElement.classList.remove("fa-unlock");
    toggleKeyIconElement.classList.add("fa-key");
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

// ── Load the “Image” form, then repopulate any saved data for this file ──
function loadForm(formType) {
  let formContent = '';
  // Map 'name_of_file' → 'image'
  const formTypeMapping = { 'name_of_file': 'image' };
  const mappedFormType  = formTypeMapping[formType] || formType;
  const currentItem     = document.querySelector(`.form-switch[data-form-type="${mappedFormType}"]`);
  if (currentItem) {
    highlightActiveItem(currentItem);
  } else {
    console.error("currentItem is null for formType:", mappedFormType);
  }

  // Generate form content
  if (mappedFormType === 'image') {
    formContent = `
      <form action="http://localhost:3019/post-image" id="image-form" method="POST" class="metadata-form">
        <label>Image Name:</label>
        <input type="text" name="filename" placeholder="Enter image name" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
        <button class="done-btn" data-form-type="image" type="button" onclick="initializeDoneButton()">Save temporarily</button>
      </form>
    `;
  }

  // Inject and compile AngularJS
  const metadataFormContainer = document.getElementById('metadata-form-container');
  metadataFormContainer.innerHTML = formContent;
  const scope = angular.element(metadataFormContainer).scope();
  angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
    $compile(metadataFormContainer)(scope);
  }]);
  scope.$apply();

  // After rendering, populate from saved per-file data if available
  const name         = currentFileName();
  const savedFlagKey = `metadataSaved_${name}`;
  const savedDataKey = `savedMetadata_${name}`;

  if (localStorage.getItem(savedFlagKey) === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
    if (savedMetadata.image) {
      populateFromStorage('image', savedMetadata.image);
    }
  }
  populateForm('image');
}

// ── Load “Basic Info” form, then repopulate saved data if any ──
function loadBasicInfoForm(event) {
  const basicItem = document.getElementById("basicInfo");
  if (basicItem) {
    highlightActiveItem(basicItem);
  }

  const formContent = `
    <form action="http://localhost:3019/post-img-basic" id="basic-form" method="POST" class="metadata-form">
      <label>Title:</label>
      <input type="text" name="title" placeholder="Enter title" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Description:</label>
      <input type="text" name="description" placeholder="Enter description" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Date of Capture:</label>
      <input type="date" name="capture_date" placeholder="Enter capture date"/>
      <label>Photographer/Source:</label>
      <input type="text" name="photographer" placeholder="Enter photographer/source" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Location:</label>
      <input type="text" name="location" placeholder="Enter location" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <button class="done-btn" data-form-type="basic" type="button" onclick="initializeDoneButton()">Save temporarily</button>
    </form>
  `;
  const metadataFormContainer = document.getElementById('metadata-form-container');
  metadataFormContainer.innerHTML = formContent;
  const scope = angular.element(metadataFormContainer).scope();
  angular.element(metadataFormContainer).injector().invoke(['$compile', function($compile) {
    $compile(metadataFormContainer)(scope);
  }]);
  scope.$apply();

  // Populate from saved per-file data if available
  const name         = currentFileName();
  const savedFlagKey = `metadataSaved_${name}`;
  const savedDataKey = `savedMetadata_${name}`;

  if (localStorage.getItem(savedFlagKey) === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
    if (savedMetadata.basicInfo) {
      populateFromStorage('basic', savedMetadata.basicInfo);
    }
  }
  populateForm('basic');
}

// ── Load “Technical Details” form, then repopulate saved data if any ──
function loadTechDetailsForm(event) {
  const techItem = document.getElementById("techDetails");
  if (techItem) {
    highlightActiveItem(techItem);
  }

  const formContent = `
    <form action="http://localhost:3019/post-img-tech" id="tech-form" method="POST" class="metadata-form">
      <label>File Format:</label>
      <input type="text" name="file_format" placeholder="e.g., JPEG" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Resolution:</label>
      <input type="text" name="resolution" placeholder="e.g., 1920x1080" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Camera Model:</label>
      <input type="text" name="camera_model" placeholder="Enter camera model" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <label>Exposure:</label>
      <input type="text" name="exposure" placeholder="Enter exposure settings" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
      <button class="done-btn" data-form-type="tech" type="button" onclick="initializeDoneButton()">Save temporarily</button>
    </form>
  `;
  const metadataFormContainer = document.getElementById('metadata-form-container');
  metadataFormContainer.innerHTML = formContent;
  const scope = angular.element(metadataFormContainer).scope();
  angular.element(metadataFormContainer).injector().invoke(['$compile', function($compile) {
    $compile(metadataFormContainer)(scope);
  }]);
  scope.$apply();

  // Populate from saved per-file data if available
  const name         = currentFileName();
  const savedFlagKey = `metadataSaved_${name}`;
  const savedDataKey = `savedMetadata_${name}`;

  if (localStorage.getItem(savedFlagKey) === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem(savedDataKey)) || {};
    if (savedMetadata.techDetails) {
      populateFromStorage('tech', savedMetadata.techDetails);
    }
  }
  populateForm('tech');
}

// ── Highlight the active sidebar item ──
function highlightActiveItem(element) {
  document.querySelectorAll('.form-switch').forEach(function(item) {
    item.classList.remove('active-item');
  });
  element.classList.add('active-item');
}

// ── “Save temporarily” button logic ──
function initializeDoneButton() {
  const formType = event.target.dataset.formType; // 'image', 'basic', or 'tech'
  const form     = document.querySelector(`#${formType}-form`);
  if (!form) {
    console.error(`Form with ID ${formType}-form not found.`);
    return;
  }

  const formData = new FormData(form);
  if (formType === "image") {
    metadata.image = {};
    formData.forEach((value, key) => {
      metadata.image[key] = value;
    });
    console.log("Image data saved:", metadata.image);

  } else if (formType === "basic") {
    metadata.basicInfo = {};
    formData.forEach((value, key) => {
      metadata.basicInfo[key] = value;
    });
    console.log("Basic Info saved:", metadata.basicInfo);

  } else if (formType === "tech") {
    metadata.techDetails = {};
    formData.forEach((value, key) => {
      metadata.techDetails[key] = value;
    });
    console.log("Technical Details saved:", metadata.techDetails);
  }

  alert(`${formType} data saved temporarily!`);
  console.log("Current metadata:", metadata);
}

// ── Populate a form’s fields from in-memory metadata ──
function populateForm(formType) {
  const form = document.querySelector(`#${formType}-form`);
  if (!form) return;

  let data;
  if (formType === "image") {
    data = metadata.image;
  } else if (formType === "basic") {
    data = metadata.basicInfo;
  } else {
    data = metadata.techDetails;
  }

  if (data) {
    for (const key in data) {
      const input = form.querySelector(`[name=${key}]`);
      if (input) { input.value = data[key]; }
    }
  }
}

// ── Populate a form’s fields from raw saved-from-localStorage data ──
function populateFromStorage(formType, formData) {
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
  const confirmation = confirm(
    "If you click Save, the data will be stored permanently in the database.\n\n" +
    "If you want to temporarily save data, use the Save temporarily button."
  );
  if (!confirmation) return;

  console.log("Saving all image metadata permanently...");

  // 1) Pull any live fields into metadata (in case user typed but didn't click “Save temporarily”):
  const imageForm = document.querySelector("#image-form");
  if (imageForm) {
    metadata.image = {};
    new FormData(imageForm).forEach((value, key) => {
      metadata.image[key] = value;
    });
  }

  const basicForm = document.querySelector("#basic-form");
  if (basicForm) {
    metadata.basicInfo = {};
    new FormData(basicForm).forEach((value, key) => {
      metadata.basicInfo[key] = value;
    });
  }

  const techForm = document.querySelector("#tech-form");
  if (techForm) {
    metadata.techDetails = {};
    new FormData(techForm).forEach((value, key) => {
      metadata.techDetails[key] = value;
    });
  }

  // 2) Load existing per-file data so we don’t overwrite untouched sections
  const name         = currentFileName();
  const savedDataKey = `savedMetadata_${name}`;
  const savedFlagKey = `metadataSaved_${name}`;

  let existing = {};
  try {
    existing = JSON.parse(localStorage.getItem(savedDataKey)) || {};
  } catch {
    existing = {};
  }

  // 3) Choose each section from “live” metadata or fallback to existing
  const imgObj = Object.keys(metadata.image).length
    ? metadata.image
    : (existing.image || {});

  const basicObj = Object.keys(metadata.basicInfo).length
    ? metadata.basicInfo
    : (existing.basicInfo || {});

  const techObj = Object.keys(metadata.techDetails).length
    ? metadata.techDetails
    : (existing.techDetails || {});

  // 4) Build final consolidated object
  const consolidatedMetadata = {
    image:      imgObj,
    basicInfo:  basicObj,
    techDetails: techObj
  };

  // 5) Send to server
  fetch("http://localhost:3019/save-img-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(consolidatedMetadata),
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      alert("All image metadata have been saved successfully!");

      // 6) Store back into localStorage under this file’s key
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

  // 1) Remove this file’s entries from localStorage
  const name = currentFileName();
  localStorage.removeItem(`metadataSaved_${name}`);
  localStorage.removeItem(`savedMetadata_${name}`);

  // 2) Clear in‐memory metadata
  metadata.image      = {};
  metadata.basicInfo  = {};
  metadata.techDetails = {};

  // 3) Reset all visible forms
  const forms = document.querySelectorAll(".metadata-form");
  forms.forEach(form => form.reset());

  alert("All data cleared successfully!");
});

