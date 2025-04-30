// src/app/app.ts

import * as angular from 'angular';


angular.module('emuwebApp', ['ngAnimate','angular.filter','ngRoute'])
  .config([
    '$locationProvider','$routeProvider',
    (
      $locationProvider: angular.ILocationProvider,
      $routeProvider: angular.route.IRouteProvider
    ) => {
      $locationProvider.html5Mode(false);
      $routeProvider
        // show login.html first
        .when('/login', {
          templateUrl: 'views/login.html',
          controller: 'AuthCtrl as auth'
        })
        // once you’ve logged in, hit /app to load the normal shell
        .when('/app', {
			template: '<emuwebapp class="emuwebapp"></emuwebapp>'
        })
        // default to login
        .otherwise({ redirectTo: '/login' });
    }
  ]);
