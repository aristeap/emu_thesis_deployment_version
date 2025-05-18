import * as angular from 'angular';

angular.module('emuwebApp')
.service('AnnotationService', ['$rootScope', function($rootScope){
  const self = this;
  // Shared array of annotations.
  self.annotations = [];

  /**
   * Adds or updates an annotation.
   * @param word - the identifier (e.g., "box 1").
   * @param mode - the annotation mode.
   * @param choice - the chosen annotation text.
   * @param pdfId - an identifier (for PDF) or null (for image).
   * @param bbox - (optional) bounding box.
   */
  self.addAnnotation = function(word: string, mode: string, choice: string, pdfId: string | null, bbox?: any) {
    let existing = self.annotations.find(a => a.word === word && a.pdfId === pdfId);
    if (!existing) {
      existing = {
        word: word,
        pos: '',
        ner: '',
        sa: '',
        comment: '',
        engAlpha: '',
        moSymbol: '',
        moPhrase: '',
        pdfId: pdfId || null
      };
      // For image annotations, explicitly set bbox.
      if (pdfId === null && bbox) {
        existing.bbox = bbox;
      } else {
        existing.bbox = undefined;
      }
      self.annotations.push(existing);
    }
    // Update based on the mode.
    if (mode === 'part-of-speech') {
      existing.pos = choice;
    } else if (mode === 'named entity recognition') {
      existing.ner = choice;
    } else if (mode === 'sentiment analysis') {
      existing.sa = choice;
    } else if (mode === 'other comments') { // Using "other comments" with a space.
      existing.comment = choice;
    } else if (mode === 'equivalent-from-english') {
      existing.engAlpha = choice;
    } else if (mode === 'meaning-of-symbol') {
      existing.moSymbol = choice;
    } else if (mode === 'meaning-of-phrase') {
      existing.moPhrase = choice;
    }
    console.log("Current annotations:", self.annotations);

    $rootScope.$broadcast('annotationChanged');

  };

  self.removeAnnotation = function(word, pdfId) {
    const idx = self.annotations.findIndex(a => a.word === word && a.pdfId === pdfId);
    if (idx !== -1) {
      self.annotations.splice(idx, 1);
    }
    $rootScope.$broadcast('annotationChanged');

  };
}]);
