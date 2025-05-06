// src/app/controllers/signUpAdmins.controller.ts
import * as angular from 'angular';
import { AuthService, IAuthUser } from '../services/auth.service';

class SignUpAdminsCtrl {
  static $inject = ['AuthService','ModalService','ViewStateService'];
  vm: this;
  newAdmin: IAuthUser & { role: string };
  showPassword = false;

  constructor(
    private AuthService: AuthService,
    private ModalService: angular.ui.bootstrap.IModalService,  // or whatever your ModalService type is
    private ViewStateService: any
  ) {
    // 1️⃣ seed in the admin‐role right away
    this.newAdmin = {
      email: '',
      password: '',
      role: 'administrator'
    };
  }

  /** called when the user clicks Sign Up */
  // This $http.post is happening in the browser. It reaches out over the network to your back-end’s /signup 
  save () {
    this.AuthService
        .signup(this.newAdmin)
        .then(resp => {
            console.log("Full signup response:", resp);
            console.log("resp.data:", resp.data);
    
            if (resp.data.success) {
                console.log("Administrator created:", resp.data.success);
                this.ModalService.close(this.newAdmin);
            } else {
                alert("Signup failed: " + (resp.data.message || "unknown reason"));
            }
        })
    .catch(err => {
        console.error("Network or server error:", err);
        alert("Error creating admin: " + (err.data?.message || err.statusText));
    });

  }

  /** called when the user clicks “Cancel” */
  cancel() {
    this.ModalService.dismiss();
  }

  /** show / hide the password */
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

angular.module('emuwebApp')
  .controller('SignUpAdminsCtrl', SignUpAdminsCtrl);
