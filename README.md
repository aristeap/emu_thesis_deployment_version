# EMU-webApp-expanded

## Introduction
The EMU-WebApp-expanded is a web-based linguistic database designed to support multi-tiered linguistic annotations and advanced querying of multimodal files. The system allows users to manage and annotate a variety of data types, including audio, video, image, and PDF documents. Built with an AngularJS and TypeScript frontend and a Node.js/Express backend with MongoDB, the application provides powerful tools for collaborative research, advanced search, and secure, role-based access.

## Quick Start
Visit [emu-webapp-expanded](https://emu-webapp-frontend.netlify.app/#!/login)


## Features - User Guide
The users that want to use the application would have to sign up and login:

![A GIF demonstrating the user sign up and login process](assets/signUp_as_aSimpleUser.gif)


They can upload a variety of data types including audio (.wav), video (.mp4), pdf and images. For each data type they can add the following annotations.
-> For **audio** files: 
* phonetic and orthographic transcriptions where they can add levels, drag-n-choose a section of the waveform and add a label to it
* add metadata ·informations about the recording, the speakers, the recording conditions, etc. He can also download the metadata form in IMDI form

![A GIF demonstrating the wav 1](assets/simple_user_wav1.gif)
![A GIF demonstrating the wav 1](assets/simple_user_wav2.gif)


->For **video** files:
* the same annotations with the wav files with the addition of the annotation-table (that can be downloaded)
* add metadata

![A GIF demonstrating the wav 1](assets/simpleUser_video1.gif)


->For **pdf** files:
* navigate the pages and mark words in the pdf
* linguistic annotations where the user can choose to study a word or a phrase by it's part-of-speech, named-entity-recognition, sentiment-analysis and other comments
* annotation table that can get downloaded
* add metadata

![A GIF demonstrating the wav 1](assets/simpleUser_pdf1.gif)
![A GIF demonstrating the wav 1](assets/simpleUser_pdf2.gif)
![A GIF demonstrating the wav 1](assets/simpleUser_pdf3.gif)


->For **image** files, the application has been adapted to support annotation of non-english languages and dialects:
* annotations like equivalent-from-english-alphabet, meaning-of-symbol, meaning-of-phrase, other comments
* annotation table that can get downloaded 
* add metadata

![A GIF demonstrating the wav 1](assets/simpleUser_image1.gif)
![A GIF demonstrating the wav 1](assets/simpleUser_image2.gif)


->General Features:
* clear button
* profile button


->Save **_annot.json**:
* the user can save the annot.json file, that is a selection of the annotations he added, so in a next session he can upload it along with his file (wav,image,video,pdf). This way he can continue annotating from where he left of and he can save his progress!

![A GIF demonstrating the wav 1](assets/simpleUser_saveAnnot1.gif)
![A GIF demonstrating the wav 1](assets/simpleUser_saveAnnot2.gif)


The simple users can't save to the database but they can view the files (and their annotations). The can also search through the database and download the results of their search.

![A GIF demonstrating the wav 1](assets/simpleUser_simpleUser_db1.gif)
![A GIF demonstrating the wav 1](assets/simpleUser_simpleUser_db2.gif)


Other **assigned users** (that can save to the database):
* EY -> can add files to the database, sign-up admins and appoint a file to them. 
* Admin -> can annotate and edit only their own files, and no other database files. They can also sign-up and choose researchers to help them with the annotation of their assigned files
* Researcher -> can annotate and edit only their own files



## Deployment & Live Demo
Content: This is where you provide links to your live application. It's a critical section for showing off your work.

Live Application URL: [Link to your Netlify URL]

API URL: [Link to your Render API URL]

Briefly explain that the application is a full-stack deployment, with the frontend hosted on Netlify and the backend on Render.



## Project Structure
Content: Explain that the project is split into separate repositories for the frontend and backend to simplify deployment.

Frontend Repository: [Link to your emu-webapp-frontend GitHub repo]

Backend Repository: [Link to your emu-webapp-backend GitHub repo]




## Technologies Used

Content: List the major frameworks, libraries, and tools used for both the frontend and backend.

Frontend: Angular.js (with TypeScript), Webpack, Netlify.

Backend: Node.js, Express, MongoDB (for data storage), GridFS (for file storage), Render.

Deployment: Netlify (Frontend), Render (Backend).




## Original EMU-webApp 
This application was created as my thesis project and it is based on the EMU-webApp 


## Missing Functionality and more to come...
* forgot-password-button
* settings button in profile 
* more choises for edit_profile
* cleanup of the console-logs
* console error about not finding the scripts for the add_metadata


## Contact
I would love to hear any feedback, ideas for additional functionality or any questions you might have! Contact anytime at : 
* [aristeapapaspyroy@gmail.com](mailto:aristeapapaspyroy@gmail.com)
* [Linkedin](https://www.linkedin.com/in/aristea-papaspyrou-8277a02a0/)


## Additional docs
URL to the full documentation of my thesis project [nemertes University of Patras](https://nemertes.library.upatras.gr/items/56d191eb-10c4-4883-b069-4e5bc023bec2)
