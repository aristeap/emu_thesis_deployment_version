console.log('Executing file: largetextfieldinput.js');
'use strict';

describe('Directive: largeTextFieldInput', function () {

  // load the directive's module
  beforeEach(module('emuwebApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    // element = angular.element('<large-text-field-input></large-text-field-input>');
    // element = $compile(element)(scope);
    // expect(element.text()).toBe('this is the largeTextFieldInput directive');
  }));
});
