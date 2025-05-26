// src/app/controllers/chooseResearchers.controller.ts
import * as angular from 'angular';
import { AuthService, IUser } from '../services/auth.service';

interface IFileMeta {
  _id:           string;
  fileName:      string;
  adminEmail:    string;
  researcherEmails?: string[];
}
interface IUserEntry {
  _id?:  string;
  email: string;
  role:  string;
}

class ChooseResearchersCtrl {
  static $inject = ['$http', 'ModalService', 'AuthService'];
  files:        IFileMeta[] = [];
  researchers:  IUserEntry[] = [];
  assignments:  Array<{ file?: IFileMeta; researcher?: IUserEntry }> = [
    { file: undefined, researcher: undefined }
  ];

  constructor(
    private $http: angular.IHttpService,
    private ModalService: any,
    private AuthService: AuthService
  ) {
    // 1️⃣ fetch *only* the files where you are the admin
    const me: IUser|null = this.AuthService.getUser();
    if (!me) {
      // no user → bail out or redirect
      console.error('ChooseResearchersCtrl: no logged-in user. This probably happens cause you reloaded the application and didnt logged in again');
    return;
    }
    const myEmail = me!.email;

    this.$http.get<IFileMeta[]>('http://localhost:3019/files')
      .then(resp => {
        this.files = resp.data.filter(f => f.adminEmail === myEmail);
      })
      .catch(e => console.error('Could not load files:', e));

    // 2️⃣ fetch all researcher‐role users
    this.$http.get<IUserEntry[]>('http://localhost:3019/users')
      .then(resp => {
        this.researchers = resp.data.filter(u => u.role === 'researcher');
      })
      .catch(e => console.error('Could not load users:', e));
  }

  addAssignment() {
    this.assignments.push({ file: undefined, researcher: undefined });
  }

  cancel() {
    this.ModalService.dismiss();
  }

  save() {
    const rows = this.assignments
      .filter(a => a.file && a.researcher)
      .map(a => ({
        fileId:           a.file!._id,
        researcherEmail:  a.researcher!.email
      }));

    if (!rows.length) {
      return alert('Pick at least one file AND researcher');
    }

    this.$http.post('http://localhost:3019/assign-researchers', { assignments: rows })
      .then(() => {
        alert('Researchers assigned!');
        this.ModalService.close(true);
      })
      .catch(err => {
        alert('Error assigning: ' + (err.data?.message||err.statusText));
      });
  }
}

angular.module('emuwebApp')
  .controller('ChooseResearchersCtrl', ChooseResearchersCtrl);
