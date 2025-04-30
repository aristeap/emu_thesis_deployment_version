// src/app/controllers/auth.controller.ts

import * as angular from 'angular';
import { IController, IHttpService, ILocationService } from 'angular';

import { AuthService, IUser as IAuthUser } from '../services/auth.service';


interface IUser {
  name?: string;
  email: string;
  password: string;
}

interface IAuthResponse {
  success: boolean;
  role?: string;
  message?: string;
}

export class AuthController implements IController {
  
  static $inject = ['$http', '$location', 'AuthService'];

  mode: 'login' | 'signup' = 'login';
  user: IUser = { email: '', password: '' };

  constructor(
    private $http: IHttpService,
    private $location: ILocationService,
    private auth: AuthService

  ) {
    console.log('✅ AuthController initialized');
  }

  submit(): void {
    const API = 'http://localhost:3019';
    const url = this.mode === 'login' ? '/login' : '/signup';
    this.$http
      .post<IAuthResponse>(API + url, {
        email: this.user.email,
        password: this.user.password
      })
      .then((resp) => {
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
          alert('Error: ' + (data.message || 'Unknown error'));
        }
      })
      .catch((err) => {
        alert('Server error: ' + err.statusText);
      });
  }
}

angular.module('emuwebApp')
  .controller('AuthCtrl', AuthController);
