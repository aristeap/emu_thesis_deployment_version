// src/app/services/auth.service.ts
import * as angular from 'angular';

/**
 * What we send to the server when creating or signing up a user.
 */
export interface IAuthUser {
  email:    string;
  password: string;
  /** optional: if you pass a role, server will store it instead of defaulting to 'simple' */
  role?:    string;
}

/**
 * What we keep around in-memory once someone is logged in.
 */
export interface IUser {
  email: string;
  role:  string;
}

/**
 * AuthService holds onto the current user and also
 * offers a signup(...) call to create new accounts.
 */
export class AuthService {
  static $inject = ['$http'];
  private currentUser: IUser | null = null;
  private currentFunction : string | null = null;

  constructor(private $http: angular.IHttpService) {}

  signup(newUser: IAuthUser): angular.IPromise<any> {
    return this.$http.post('http://localhost:3019/signup', newUser);
  }

  setUser(user: IUser): void {
    this.currentUser = user;
  }

  getUser(): IUser | null {
    return this.currentUser;
  }

   /** Convenience: return the logged-in user’s role, or empty string if none */
   getRole(): string {
    // console.log("The current's user role is this : ",this.currentUser?.role);
    return this.currentUser ? this.currentUser.role : '';
  }

   /** mark which “function” just ran (e.g. renameLevels, renameSpeakers, etc.) */
  setFunction(fnName: string|null) {
    this.currentFunction = fnName;
  }

  /** read it back */
  getFunction(): string|null {
    return this.currentFunction;
  }
}

angular.module('emuwebApp')
  .service('AuthService', AuthService);
