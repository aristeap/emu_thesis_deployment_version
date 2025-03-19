// ImgMetadataButtonFunctions.js
"use strict";

// Remove any existing saved metadata for a fresh start
// localStorage.removeItem('metadataSaved');
// localStorage.removeItem('savedMetadata');

// Global metadata object for images
var metadata = {
  image: {},       // Data for the image form (e.g. image name)
  basicInfo: {},   // Basic Info fields: title, description, capture_date, photographer, location
  techDetails: {}  // Technical Details fields: file_format, resolution, camera_model, exposure
};

// Function to toggle visibility of additional items (Basic Info and Technical Details)
function toggleAdditionalItems() {
  var additionalItemsElement = document.getElementById('additionalItems');
  var toggleKeyIcon = document.getElementById('toggleKeyIcon');
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

// ---------- Form Loading and Population --------------------------------------------------------------------------------
function loadForm(formType) {
  let formContent = '';
  const formTypeMapping = { 'name_of_file': 'image' };
  const mappedFormType = formTypeMapping[formType] || formType;
  const currentItem = document.querySelector(`.form-switch[data-form-type="${mappedFormType}"]`);
  if (currentItem) { highlightActiveItem(currentItem); }
  else { console.error("currentItem is null for formType:", mappedFormType); }
  
  if (mappedFormType === 'image') {
    // Image form
    formContent = `
      <form action="http://localhost:3019/post-image" id="image-form" method="POST" class="metadata-form">
        <label>Image Name:</label>
        <input type="text" name="filename" placeholder="Enter image name" ng-focus="cursorInTextField()" ng-blur="cursorOutOfTextField()"/>
        <button class="done-btn" data-form-type="image" type="button" onclick="initializeDoneButton()">Save temporarily</button>
      </form>
    `;
  }
  
  const metadataFormContainer = document.getElementById('metadata-form-container');
  metadataFormContainer.innerHTML = formContent;
  // Compile using AngularJS if necessary
  const scope = angular.element(metadataFormContainer).scope();
  angular.element(metadataFormContainer).injector().invoke(['$compile', function ($compile) {
    $compile(metadataFormContainer)(scope);
  }]);
  scope.$apply();
  
  // If data is saved, populate the form fields
  if (localStorage.getItem('metadataSaved') === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
    if (savedMetadata && savedMetadata[mappedFormType]) {
      populateFromStorage(mappedFormType, savedMetadata[mappedFormType]);
    }
  }
  populateForm(mappedFormType);
}

// Populate form fields with data from the metadata object.
function populateForm(formType) {
  const form = document.querySelector(`#${formType}-form`);
  if (!form) return;
  
  // Select the appropriate data object
  const data = (formType === "image") ? metadata.image :
               (formType === "basic") ? metadata.basicInfo :
               metadata.techDetails;
  
  if (data) {
    for (const key in data) {
      const input = form.querySelector(`[name=${key}]`);
      if (input) { input.value = data[key]; }
    }
  }
}

// Populate a form using stored data from localStorage.
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

// ---------- Basic Info Form -----------------------------------------------------------------------------------------------------
function loadBasicInfoForm(event) {
    // Highlight the "Basic Info" list item (assume its id is "basicInfo")
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
    
    // Populate from saved data if available
    if (localStorage.getItem('metadataSaved') === 'true') {
      const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
      if (savedMetadata && savedMetadata.basicInfo) {
        populateFromStorage("basic", savedMetadata.basicInfo);
      }
    }
    populateForm("basic");
  }


// ---------- Technical Details Form ------------------------------------------------------------------------------------------
function loadTechDetailsForm(event) {
  // Highlight the "Technical Details" list item (assume its id is "techDetails")
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
  
  if (localStorage.getItem('metadataSaved') === 'true') {
    const savedMetadata = JSON.parse(localStorage.getItem('savedMetadata'));
    if (savedMetadata && savedMetadata.techDetails) {
      populateFromStorage("tech", savedMetadata.techDetails);
    }
  }
  populateForm("tech");
}


// ---------- Utility: Highlight Active List Item -------------------------------------------------------------------------------
function highlightActiveItem(element) {
  document.querySelectorAll('.form-switch').forEach(function(item) {
    item.classList.remove('active-item');
  });
  element.classList.add('active-item');
}


// ---------- Save (Done) Button Handler ---------------------------------------------------------------------------------------------
// This function saves form data to the metadata object and writes it to localStorage.
function initializeDoneButton() {
  const formType = event.target.dataset.formType; // 'image', 'basic', or 'tech'
  const form = document.querySelector(`#${formType}-form`);
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
  // Write the updated metadata object to localStorage
  localStorage.setItem('savedMetadata', JSON.stringify(metadata));
  localStorage.setItem('metadataSaved', 'true');
  alert(`${formType} data saved temporarily!`);
  console.log("Current metadata:", metadata);
}

// ---------- Save Metadata to Server ----------
document.getElementById("emuwebapp-modal-save").addEventListener("click", function () {
  const confirmation = confirm(
    "If you click Save, the data will be stored permanently in the database.\n\nIf you want to temporarily save data, use the Save temporarily button."
  );
  if (!confirmation) return;
  console.log("Saving all image metadata permanently...");
  
  const consolidatedMetadata = {
    image: metadata.image,
    basicInfo: metadata.basicInfo,
    techDetails: metadata.techDetails
  };

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
    localStorage.setItem('savedMetadata', JSON.stringify(consolidatedMetadata));
    localStorage.setItem('metadataSaved', 'true');
    console.log("Server response:", data);
  })
  .catch(error => {
    console.error("Error saving metadata:", error);
    alert("An error occurred while saving metadata.");
  });
});

// ---------- Cancel Button: Clear Metadata and Reset Forms ----------
document.getElementById("MetaCancelBtn").addEventListener("click", function () {
  localStorage.removeItem('metadataSaved');
  localStorage.removeItem('savedMetadata');
  metadata.image = {};
  metadata.basicInfo = {};
  metadata.techDetails = {};
  const forms = document.querySelectorAll(".metadata-form");
  forms.forEach(form => form.reset());
  alert("All data cleared successfully!");
});
