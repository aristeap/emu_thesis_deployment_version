// src/app/controllers/chooseAdmins.controller.ts
import * as angular from 'angular';

interface IFileMeta {
  _id:      string;
  fileType: string;
  fileName: string;
  // …etc.
}

interface IUserEntry {
  _id?:   string;
  email:  string;
  role?:  string;
}

class ChooseAdminsCtrl {
  static $inject = ['$http', 'ModalService'];
  files:     IFileMeta[]    = [];
  admins:    IUserEntry[]       = [];
  selectedFile?:  IFileMeta | null = null;
  selectedAdmin:  IUserEntry  | null = null;

  //we keep an array of 'slots' and initialy it contains an empty slots
  assignments: Array<{ file?: IFileMeta; admin?: IUserEntry }> = [
    { file: undefined, admin: undefined }
  ]; 

  constructor(
    private $http: angular.IHttpService,
    private ModalService: any
  ) {
    // 1️⃣ Fetch all files (keep the whole object)
    this.$http.get<IFileMeta[]>('http://localhost:3019/files')
      .then(resp => this.files = resp.data)
      .catch(err => console.error('Could not load files:', err));

    // 2️⃣ Fetch admins
    this.$http.get<IUserEntry[]>('http://localhost:3019/users')
      .then(resp => {
        this.admins = resp.data.filter(u => u.role === 'administrator');
          // .map(u => u.email);
      })
      .catch(err => console.error('Could not load users:', err));
  }

  cancel() {
    this.ModalService.close();
  }

  //when the user clicks the '+' icon we will append another blank row
  //Pushing a new {file,admin} object causes Angular’s ng-repeat to render one more row. 
  addAssignment(){
    this.assignments.push({ file: undefined, admin: undefined });
  }

  Save() {
    // 1️⃣ filter to only the "complete" rows
    const rows = this.assignments
    .filter(a => a.file && a.admin)
    .map(a => ({
      fileId:     a.file!._id,
      adminEmail: a.admin!.email
    }));


    // build only the “full” rows…
    // const rows = this.assignments
    // .filter(a => a.file && a.admin)        // only where both are chosen
    // .map(a => ({
    //   fileId:     a.file!._id,             // the ObjectId string
    //   adminEmail: a.admin!.email           // the admin’s email
    // }));


    // 2️⃣ make sure we have at least one
      if (rows.length === 0) {
      return alert('Pick at least one file AND admin');
    }

    // 3️⃣ wrap in an assignments property
    const payload = { assignments: rows };
    console.log('→ sending payload:', payload);

    
    this.$http.post('http://localhost:3019/assign-admin',payload)
    .then(() => {
      alert('Assignments saved!');
      this.ModalService.close();
    })
    .catch(err => {
      alert('Error saving assignment: ' + (err.data?.message || err.statusText));
    });
  }
}

angular.module('emuwebApp')
  .controller('ChooseAdminsCtrl', ChooseAdminsCtrl);
