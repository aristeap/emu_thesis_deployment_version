// src/app/controllers/auth.controller.ts

import * as angular from 'angular';
import { IHttpService, ILocationService } from 'angular';
import { AuthService } from '../services/auth.service';

interface IUser {
  name?: string;
  email: string;
  password: string;
}

interface IAuthResponse {
  success: boolean;
  role?:   string;
  message?:string;
}

export class AuthController {
  static $inject = ['$http', '$location', 'AuthService', 'ViewStateService'];

  mode: 'login' | 'signup' = 'login';
  user: IUser              = { email: '', password: '' };

  showPassword: boolean = false;   // ← NEW
  loginError:    string  = '';     // ← NEW

  constructor(
    private $http: IHttpService,
    private $location: ILocationService,
    private auth: AuthService,
    private ViewStateService: any

  ) {
    console.log('✅ AuthController initialized');
  }

  submit(): void {
    this.loginError = ''; // clear previous

    const API = 'http://localhost:3019';
    const url = this.mode === 'login' ? '/login' : '/signup';
    this.$http
      .post<IAuthResponse>(API + url, {
        email:    this.user.email,
        password: this.user.password
      })
      .then(resp => {
        const data = resp.data;
        if (data.success) {

          if (this.mode === 'signup') {
            this.mode = 'login';
            alert('Signup successful! Please log in.');
          } else {
            this.auth.setUser({ email: this.user.email, role: data.role! });
            console.log('Logged in as:', data.role);
            this.$location.path('/app');
          }
        } else {
          // show server’s own message
          //this.loginError = data.message || 'Invalid credentials';
          this.loginError = resp.data.message || 'Unknown error';

        }
      })
      .catch(err => {
        if (err.status === 401) {
          // unauthorized
          this.loginError = err.data?.message || 'Invalid email or password';
        } else {
          this.loginError = `Server error: ${err.statusText || err.status}`;
        }
      });
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
  .controller('AuthCtrl', AuthController);
