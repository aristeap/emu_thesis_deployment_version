import * as angular from 'angular';

angular.module('emuwebApp')
.service('VideoParserService', function($q, $window) {

  this.parseVideoAudioBuf = function(buf) {
    try {
      // Use the OfflineAudioContext (or webkitOfflineAudioContext) from $window.
      const AudioContext = $window.OfflineAudioContext || $window.webkitOfflineAudioContext;
      // Assume stereo (2 channels) and a sample rate of 44100 Hz.
      const numChannels = 2;
      const sampleRate = 44100;
      // Calculate the total samples; assuming 16 bits per sample (2 bytes per sample)
      const totalSamples = buf.byteLength / 2 / numChannels;
      const offlineCtx = new AudioContext(numChannels, totalSamples, sampleRate);

      let defer = $q.defer();
      // Decode the audio data from the buffer
      offlineCtx.decodeAudioData(buf,
        function(decodedData) { 
          defer.resolve(decodedData); 
        },
        function(error) { 
          defer.reject(error); 
        }
      );
      return defer.promise;
    } catch (e) {
      let err = {
        status: { message: JSON.stringify(e, null, 4) }
      };
      let defer = $q.defer();
      defer.reject(err);
      return defer.promise;
    }
  };
});
