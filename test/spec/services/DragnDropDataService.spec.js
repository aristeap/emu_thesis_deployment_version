console.log('Executing file: DragnDropDataService.spec.js');
'use strict';

describe('Service: DragnDropDataService', function () {

  // load the controller's module
  beforeEach(module('emuwebApp'));

  var item;

  var testData = [
      ['test1','wavData1','annotationData1'],
      ['test2','wavData2','annotationData2']
  ];

  it('should resetToInitState', inject(function (DragnDropDataService) {
    // set any data
    DragnDropDataService.convertedBundles.push('test');
    DragnDropDataService.sessionDefault = 'test';
    DragnDropDataService.resetToInitState();
    expect(DragnDropDataService.convertedBundles.length).toBe(0);
    expect(DragnDropDataService.sessionDefault).toBe('');
  }));

  it('should setDefaultSession', inject(function (DragnDropDataService) {
    // set any data
    DragnDropDataService.sessionDefault = 'test';
    DragnDropDataService.setDefaultSession('test1');
    expect(DragnDropDataService.sessionDefault).toBe('test1');
  }));

  it('should getDefaultSession', inject(function (DragnDropDataService) {
    // set any data
    DragnDropDataService.setDefaultSession('test1');
    expect(DragnDropDataService.getDefaultSession()).toBe('test1');
  }));

  it('should getBundle', inject(function (DragnDropDataService) {
    // set any data
    DragnDropDataService.convertedBundles.push({name: 'test'});
    var bndl = DragnDropDataService.getBundle('test');
    expect(bndl.$$state.status).toEqual(1);
    expect(bndl.$$state.value.status).toEqual(200);
    expect(bndl.$$state.value.data).toEqual({});
  }));

});
