console.log('Executing file: enlarge.spec.js');
'use strict';

describe('Directive: enlarge', function() {

    var elm, scope;
    beforeEach(module('emuwebApp'));

    beforeEach(inject(function($rootScope, $compile, viewState, ConfigProviderService) {
        scope = $rootScope.$new();
        scope.vs = viewState;
    }));

    function compileDirective(tpl) {
        if (!tpl) tpl = '<div enlarge="0"></div>';
        tpl = '<span>' + tpl + '</span>';
        inject(function($compile) {
            var form = $compile(tpl)(scope);
            elm = form.find('div');
        });
        scope.$digest();
    }

    it('should enlarge', function() {
        scope.vs.curPerspectiveIdx = 0;
        compileDirective();
        elm.triggerHandler('click');
        expect(scope.vs.timelineSize).toEqual(0);
    });

    it('should enlarge and close', function() {
        scope.vs.curPerspectiveIdx = 0;
        compileDirective();
        elm.triggerHandler('click');
        //scope.$digest();
        expect(scope.vs.timelineSize).toEqual(0);
        elm.triggerHandler('click');
        expect(scope.vs.timelineSize).toEqual(-1);
    });
});