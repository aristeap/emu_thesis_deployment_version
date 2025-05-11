// src/app/controllers/signUpResearchers.controller.ts
import * as angular from 'angular';

import { AuthService, IAuthUser } from '../services/auth.service';


class SignUpResearchersCtrl {
  static $inject = ['AuthService', 'ModalService', 'ViewStateService'];
  vm: this;
  newResearcher: IAuthUser & { role: string };
  showPassword = false;

  constructor(
    private AuthService: AuthService,
    private ModalService: any,
    private ViewStateService: any
  ) {
    // default role to 'researcher'
    this.newResearcher = {
      email: '',
      password: '',
      role: 'researcher'
    };
  }

  /** called when the user clicks “Sign Up” */
  save() {
    console.log("The sign up has been clicked");
    this.AuthService
      .signup(this.newResearcher)
      .then(resp => {
        if (resp.data.success) {
            console.log("Researcher created:", resp.data.success);
            // close modal, return the new researcher if you like
            this.ModalService.close(this.newResearcher);
        } else {
            alert('Signup failed: ' + (resp.data.message || 'unknown'));
        }
      })
      .catch(err => {
        console.error('Error creating researcher:', err);
        alert('Error creating researcher: ' + (err.data?.message || err.statusText));
      });
  }

  cancel() {
    this.ModalService.dismiss();
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  cursorInTextField() {
    this.ViewStateService.setEditing(true);
    this.ViewStateService.setcursorInTextField(true);
  }

  cursorOutOfTextField() {
    this.ViewStateService.setEditing(false);
    this.ViewStateService.setcursorInTextField(false);
  }
}

angular
  .module('emuwebApp')
  .controller('SignUpResearchersCtrl', SignUpResearchersCtrl);

export default SignUpResearchersCtrl;
