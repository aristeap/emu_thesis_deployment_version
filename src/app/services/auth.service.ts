// src/app/services/auth.service.ts
import { module } from 'angular';
import * as angular from 'angular';


/**
 * Interface representing a logged-in user.
 */
export interface IUser {
  email: string;
  role: string;
}

//How the auth.service.ts and auth.controller.ts work together:
//1. User logs in → AuthController.submit() posts credentials.
//2. Server responds with { success:true, role }.
//3. AuthController stores { email, role } in AuthService.
//4. 



/**
 * AuthService stores the current user's authentication state.
 */
export class AuthService {
  private currentUser: IUser | null = null;

  /**
   * Store who’s logged in.
   */
  setUser(user: IUser): void {
    this.currentUser = user;
  }

  /**
   * Retrieve the logged-in user's info from elsewhere in the app.
   */
  getUser(): IUser | null {
    return this.currentUser;
  }
}

// tell Angular about it:
angular.module('emuwebApp')
  .service('AuthService', AuthService);

