console.log('Executing file: ssffParserWorker.spec.js');
'use strict';

describe('Worker: ssffParserWorker', function() {

  var worker, mockGlobal, wavData;

  beforeEach(module('emuwebApp'));

  beforeEach(function(){
    var DummyWorker = function() {};
    worker = new SsffParserWorker(DummyWorker);
    // mock the global scope for the worker thread.
    mockGlobal = {
      postMessage: jasmine.createSpy('postMessage')
    };
    // call the initWorker method we use to build the worker script.
    worker.workerInit(mockGlobal);
  });


  it('should respond properly to undefined msg', function() {
    mockGlobal.onmessage('unknown');
    expect(mockGlobal.postMessage).toHaveBeenCalledWith({
		'status': {
			'type': 'ERROR',
			'message': 'Undefined message was sent to SsffParserWorker'
		}
	});
  });

  it('should respond properly to defined msg with unknown cmd', function() {
    mockGlobal.onmessage({data: {cmd: 'unknown'}});
    expect(mockGlobal.postMessage).toHaveBeenCalledWith({
		'status': {
			'type': 'ERROR',
			'message': 'Unknown command sent to SsffParserWorker'
		}
	});
  });

  it('should base64encode', function () {
    var ret = mockGlobal.btoa('test');
    expect(ret).toEqual('dGVzdA==');
    var ret = mockGlobal.atob('dGVzdA==');
    expect(ret).toEqual('test');
  });

  it('should parseArr', function () {
    mockGlobal.onmessage({data: {
      'cmd': 'parseArr',
      'ssffArr': msajc003_bndl.ssffFiles
    }});
    expect(mockGlobal.postMessage).toHaveBeenCalled();
      // todo : need small testable data
  });

  it('should parseArr', function () {
    mockGlobal.onmessage({data: {
        'cmd': 'jso2ssff',
        'jso': JSON.stringify({ Columns: [ { name: 'test1', ssffdatatype: 'SHORT', length: 10, values: [[1]] } ], origFreq: 20 })
      }});
      expect(mockGlobal.postMessage).toHaveBeenCalled();
      // todo : need small testable data
  });


});