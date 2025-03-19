console.log('Executing file: Ssffdataservice.spec.js');
'use strict';

describe('Service: Ssffdataservice', function () {
  var scope, deferred;

  // load the controller's module
  beforeEach(module('emuwebApp'));

  beforeEach(inject(function (_$rootScope_, $q, Ssffdataservice) {
    scope = _$rootScope_;
    deferred = $q.defer();
    //deferred.resolve('called');
  }));

  /**
   *
   */
  it('should calculateSamplePosInVP', inject(function (Ssffdataservice, Soundhandlerservice) {
      Soundhandlerservice.audioBuffer.sampleRate = 1000;
    expect(Ssffdataservice.calculateSamplePosInVP(2, 1, 1)).toEqual(3000);
    expect(Ssffdataservice.calculateSamplePosInVP(10, 3, 1)).toEqual(4333);
  }));

  /**
   *
   */
  it('should getSampleRateAndStartTimeOfTrack', inject(function (Ssffdataservice, ConfigProviderService) {
    // add mock track definition
    ConfigProviderService.curDbConfig.ssffTrackDefinitions = [{
      'name': 'test',
      'columnName': 'XXX',
      'fileExtension': 'testFileExt'
    }];
    // add data
    Ssffdataservice.data.push({
      fileExtension: 'testFileExt',
      sampleRate: 10,
      startTime: 10
    });

    expect(Ssffdataservice.getSampleRateAndStartTimeOfTrack('test').sampleRate).toEqual(10);
    expect(Ssffdataservice.getSampleRateAndStartTimeOfTrack('test').startTime).toEqual(10);
    expect(Ssffdataservice.getSampleRateAndStartTimeOfTrack('false')).toEqual(undefined);
  }));

  /**
   *
   */
  it('should getColumnOfTrack', inject(function (Ssffdataservice, ConfigProviderService) {
    
    // add mock track definition
    ConfigProviderService.curDbConfig.ssffTrackDefinitions = [{
      'name': 'test',
      'columnName': 'XXX',
      'fileExtension': 'testFileExt'
    }];

    //add data
    Ssffdataservice.data.push({
      fileExtension: 'testFileExt',
      Columns: [{
        name: 'col1',
        value: 'test1'
      }]
    });
    expect(Ssffdataservice.getColumnOfTrack('test', 'col1').value).toEqual('test1');
    expect(Ssffdataservice.getColumnOfTrack('test', 'col2')).toEqual(undefined);
  }));

});