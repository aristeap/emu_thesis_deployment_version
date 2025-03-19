console.log('Executing file: bundleListSideBar.spec.js');
'use strict';

describe('Directive: bundleListSideBar', function() {

    var elm, tpl, scope;
    beforeEach(module('emuwebApp', 'emuwebApp.templates'));

    beforeEach(inject(function($rootScope, $compile) {
        scope = $rootScope.$new();
    }));

    function compileDirective(val) {
        tpl = '<bundle-list-side-bar is-open="{{vs.submenuOpen}}"></bundle-list-side-bar>';
        inject(function($compile) {
            elm = $compile(tpl)(scope);
        });
        scope.$digest();
    }

    it('should have correct css values', inject(function (ViewStateService) {
        scope.filterText = '';
        scope.bundleList = [];
        scope.vs = ViewStateService;
        scope.vs.submenuOpen = true;
        compileDirective();
        expect(elm.prop('className')).not.toContain('ng-hide');
        scope.vs.submenuOpen = false;
        compileDirective();
        expect(elm.prop('className')).not.toContain('ng-hide');
    }));
    

    it('should have correct html values', inject(function (ViewStateService) {
        scope.filterText = '';
        scope.bundleList = [];
        scope.vs = ViewStateService;
        scope.vs.submenuOpen = true;
        compileDirective();
        expect(elm.html()).toContain('emuwebapp-filter');
        expect(elm.html()).toContain('input');
        expect(elm.html()).toContain('my-drop-zone');
        expect(elm.html()).toContain('my-drop-zone-input');
    }));
    
});
