console.log('Executing file: Appcachehandler.spec.js');
'use strict';

describe('Service: Appcachehandler', function () {


	var deferred, $rootScope;
	var mockDialogService = {};


	// load the controller's module
	beforeEach(module('emuwebApp'));

	/**
	 *
	 */
	it('should checkForNewVersion', inject(function (Appcachehandler) {
		// Appcachehandler.checkForNewVersion();
	}));
	

	/**
	 *
	 */
	it('should handleUpdatereadyEvent', inject(function ($rootScope, $q, Appcachehandler, modalService) {
		// this test causes infinite loop in karma test runner!!!

		// var scope = $rootScope.$new();
		// var def = $q.defer();
		// spyOn(window.applicationCache, 'swapCache');
		// // spyOn(window.location, 'reload'); // can't spyOn read only property in chrome
		// spyOn(modalService, 'open').and.returnValue(def.promise);
		// Appcachehandler.handleUpdatereadyEvent();
		// def.resolve(false);
		// scope.$apply();
		// expect(window.applicationCache.swapCache).toHaveBeenCalled();
		// // expect(window.location.reload).toHaveBeenCalled();
		// expect(modalService.open).toHaveBeenCalled();
	}));	

});