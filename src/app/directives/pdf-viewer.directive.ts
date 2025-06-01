import * as angular from 'angular';
declare var pdfjsLib: any;
declare var pdfjsViewer: any;

angular.module('emuwebApp')
.directive('pdfViewer', ['LinguisticService', 'AnnotationService', function(LinguisticService, AnnotationService) {
  return {
    restrict: 'E',
    scope: {
      base64Pdf: '=',
      currentPage: '=?',
      pdfScale: '=?'
    },
    template: `
      <div id="pdfContainer" style="position: relative; width: 100%; height: 100%; overflow: auto;">
        <canvas id="pdfCanvas" style="display: block;"></canvas>
        <div id="textLayer" class="textLayer"></div>
      </div>
    `,
    link: function(scope, element) {
      let pdfDoc: any = null;
      let activePageNum = 1 //a local variable to track the current page number

      // ←– NEW: keep a map of “pageNumber → fullTextOfThatPage”
      let pageTexts: { [pageNum: number]: string } = {};

      // Watch for PDF data, page, or zoom changes
      scope.$watchGroup(['base64Pdf', 'currentPage', 'pdfScale'], function([newPdf, newPage, newScale]) {
        if (!newPdf) return;
        //remember new page in our closure
        activePageNum = newPage || 1;
        if (!pdfDoc) {
          loadPdf(newPdf).then(() => {
            renderPage(newPage || 1, newScale || 1.0);
          });
        } else {
          renderPage(newPage || 1, newScale || 1.0);
        }
      });

      function loadPdf(base64Data: string): Promise<void> {
        return new Promise((resolve, reject) => {
          const raw = atob(base64Data);
          const len = raw.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = raw.charCodeAt(i);
          }
          pdfjsLib.getDocument({ 
            data: bytes,
            disableCombineTextItems: true
          }).promise
            .then(function(pdf: any) {
              pdfDoc = pdf;
              if (!scope.$$phase) {
                scope.$apply(() => {
                  scope.$emit('pdfLoaded', pdf.numPages);
                });
              } else {
                scope.$emit('pdfLoaded', pdf.numPages);
              }
              resolve();
            })
            .catch((err: any) => {
              console.error("Error loading PDF:", err);
              reject(err);
            });
        });
      }

      function renderPage(pageNum: number, manualScale: number) {
        if (!pdfDoc) return;
        activePageNum = pageNum;
        pdfDoc.getPage(pageNum)
          .then((page: any) => {
            const container = element[0].querySelector('#pdfContainer');
            const containerWidth = container.clientWidth;
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const baseFit = containerWidth / unscaledViewport.width;
            const finalScale = baseFit * manualScale;
            const scaledViewport = page.getViewport({ scale: finalScale });

            const canvas = element[0].querySelector('#pdfCanvas') as HTMLCanvasElement;
            const context = canvas.getContext('2d');
            if (!context) {
              console.error("Could not get 2D context from canvas");
              return;
            }
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const textLayerDiv = element[0].querySelector('#textLayer') as HTMLDivElement;
            textLayerDiv.style.width = canvas.width + 'px';
            textLayerDiv.style.height = canvas.height + 'px';

            const renderResult = page.render({
              canvasContext: context,
              viewport: scaledViewport
            });
            return handleRenderResult(renderResult)
              .then(() => page.getTextContent())
              .then((textContent: any) => {
                processTextLayer(pageNum, scaledViewport, textContent, textLayerDiv);
              });
          })
          .catch((err: any) => {
            console.error("Error rendering page:", err);
          });
      }

      function handleRenderResult(renderResult: any): Promise<void> {
        if (!renderResult) {
          console.warn("page.render(...) returned nothing. Proceeding immediately.");
          return Promise.resolve();
        }
        if (typeof renderResult.then === 'function') {
          return renderResult;
        }
        if (renderResult.promise && typeof renderResult.promise.then === 'function') {
          return renderResult.promise;
        }
        console.warn("Unknown renderResult type. Proceeding immediately.");
        return Promise.resolve();
      }

      function processTextLayer(pageNum: number, scaledViewport: any, textContent: any, textLayerDiv: HTMLDivElement) {
        if (!textContent) return;

        // ←– NEW: Build the “entire page text” as one string
        // Each textContent.items[i].str is one text chunk; joining them gives us all page text.
        const fullPageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        // Store it so that later, when user right–clicks, we know “what was on pageNum.”
        pageTexts[pageNum] = fullPageText;


        textLayerDiv.innerHTML = '';
        const eventBus = new pdfjsViewer.EventBus();
        const textLayer = new pdfjsViewer.TextLayerBuilder({
          textLayerDiv: textLayerDiv,
          eventBus: eventBus,
          pageIndex: pageNum - 1,
          viewport: scaledViewport,
          enhanceTextSelection: true
        });

        textLayer.setTextContent(textContent);
        const layerRender = textLayer.render();
        if (layerRender && typeof layerRender.then === 'function') {
          layerRender.then(() => {
            setTimeout(() => tagTextItems(textLayerDiv), 100);
          });
        } else {
          console.warn("textLayer.render() didn't return a Promise. Proceeding synchronously.");
          setTimeout(() => tagTextItems(textLayerDiv), 100);
        }
      }

      function tagTextItems(textLayerDiv: HTMLDivElement) {
        // Use a broad selector to capture elements that might contain text.
        const allElements = textLayerDiv.querySelectorAll('span, div');
        let counter = 0;
        allElements.forEach((el: Element) => {
          const txt = el.textContent?.trim();
          if (txt) {
            el.setAttribute('data-pdfword', txt);
            el.setAttribute('data-pdfid', 'pdfword-' + counter);
            counter++;
          }
        });
      }

      // Log selected text on mouseup for debugging
      const textLayerDiv = element[0].querySelector('#textLayer') as HTMLDivElement;
      textLayerDiv.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString().trim() : "";
        if(selectedText){
          console.log("Selected text:", selectedText);
        }
      });

      // Right-click context menu for linguistic annotations
      textLayerDiv.addEventListener('contextmenu', (evt: MouseEvent) => {
        // console.log("inside the context menu on right click");
        const currentMode = LinguisticService.mode;
        if (!currentMode) {
          console.log("No currentMode");
          return;
        }
        evt.preventDefault();
        const selectedText = window.getSelection()?.toString().trim();
        if (!selectedText) return;

        // Get the pdfId from the clicked element via the selection's anchor node.
        let pdfId: string | null = null;
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let el: Element | null = null;
          if (sel.anchorNode.nodeType === Node.ELEMENT_NODE) {
            el = sel.anchorNode as Element;
          } else if (sel.anchorNode.nodeType === Node.TEXT_NODE) {
            el = sel.anchorNode.parentElement;
          }

          if (el) {
            pdfId = el.getAttribute('data-pdfid');
          }
        }
        if(pdfId === null){
          console.log("No pdfId found---------------------------------");
        }else{
        console.log("Context menu for text:", selectedText, "with pdfId:", pdfId);
        }

        // ←– NEW: Look up the full text of the current page from scope.pageTexts
        const pageNum = activePageNum;
        const pageText = pageTexts[pageNum] || '';

        // Split pageText into sentences (hard split on “. ”, “? ”, “! ”)
        // The same logic you’ll use on the server, but here in the browser:
        const sentenceBoundaries = pageText
          .split(/(?<=[.?!])\s+/g)
          .map(s => s.trim())
          .filter(Boolean);

        // Build a regex that matches the *exact* word boundary for selectedText
        const escaped = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRe = new RegExp(`\\b${escaped}\\b`, 'i');

        // Find the first sentence that actually contains selectedText
        let chosenSentence = '';
        for (const s of sentenceBoundaries) {
          if (wordRe.test(s)) {
            chosenSentence = s;
            break;
          }
        }
        // Fallback: if none matched, just use the entire page
        if (!chosenSentence) {
          console.warn(`Could not find an exact sentence containing “${selectedText}” on page ${pageNum}; using full page text.`);
          chosenSentence = pageText.trim();
        }

        // **NEW**: collapse all runs of whitespace into one space
        chosenSentence = chosenSentence.replace(/\s+/g, ' ').trim();
        
        // Branch for "other comments"
        if (currentMode === 'other comments') {
          const popup = document.createElement('div');
          popup.style.position = 'absolute';
          popup.style.left = evt.pageX + 'px';
          popup.style.top = evt.pageY + 'px';
          popup.style.background = '#424242';
          popup.style.border = '1px solid #ccc';
          popup.style.borderRadius = '6px';
          popup.style.padding = '5px';
          popup.style.zIndex = '999999';

          const textarea = document.createElement('textarea');
          textarea.placeholder = 'Type your comment here...';
          textarea.style.color = 'black';
          textarea.style.marginRight = '5px';
          textarea.style.zIndex = '999999';
          textarea.style.width = '250px';
          textarea.style.height = '100px';

          let currentComment = "";
          textarea.addEventListener('keyup', (e) => {
            if (e.key.length === 1) {
              currentComment += e.key;
            } else if (e.key === 'Backspace') {
              currentComment = currentComment.slice(0, -1);
            }
            textarea.value = currentComment;
          });

          const doneBtn = document.createElement('button');
          doneBtn.textContent = 'Done';
          doneBtn.addEventListener('click', () => {
            const comment = currentComment.trim();
            if (comment) {
              scope.$apply(() => {
                AnnotationService.addAnnotation(selectedText, currentMode, comment, pdfId, activePageNum, chosenSentence);
              });
              if (document.body.contains(popup)) {
                document.body.removeChild(popup);
              }
            }
            if (document.body.contains(popup)) {
              document.body.removeChild(popup);
            }
          });

          popup.appendChild(textarea);
          popup.appendChild(doneBtn);
          document.body.appendChild(popup);
          textarea.focus();
          setTimeout(() => {
            const handleClickOutside = (evt) => {
              if (!popup.contains(evt.target)) {
                if (document.body.contains(popup)) {
                  document.body.removeChild(popup);
                }
                document.removeEventListener('click', handleClickOutside);
              }
            };
            document.addEventListener('click', handleClickOutside);
          }, 0);
          return;
        }

        // Otherwise, for other annotation modes, show a simple menu.
        let choices: string[] = [];
        if (currentMode === 'part-of-speech') {
          choices = ['verb', 'noun', 'pronoun', 'adjective'];
        } else if (currentMode === 'named entity recognition') {
          choices = ['first name', 'last name', 'location', 'organization', 'date', 'time'];
        } else if (currentMode === 'sentiment analysis') {
          choices = ['positive', 'negative', 'neutral'];
        } else {
          console.log("none of the choices of linguistic annotation");
        }

        const menuDiv = document.createElement('div');
        menuDiv.style.position = 'absolute';
        menuDiv.style.left = evt.pageX + 'px';
        menuDiv.style.top = evt.pageY + 'px';
        menuDiv.style.background = '#424242';
        menuDiv.style.border = '1px solid #ccc';
        menuDiv.style.borderRadius = '6px';
        menuDiv.style.padding = '5px';
        menuDiv.style.zIndex = '9999';

        choices.forEach(choice => {
          const btn = document.createElement('button');
          btn.textContent = choice;
          btn.style.display = 'block';
          btn.style.margin = '5px 0';
          btn.addEventListener('click', () => {
            scope.$apply(() => {
              AnnotationService.addAnnotation(selectedText, currentMode, choice, pdfId, activePageNum, chosenSentence);
            });
            if (document.body.contains(menuDiv)) {
              document.body.removeChild(menuDiv);
            }
          });
          menuDiv.appendChild(btn);
        });

        document.body.appendChild(menuDiv);
        const handleClickOutside = () => {
          if (document.body.contains(menuDiv)) {
            document.body.removeChild(menuDiv);
          }
          document.removeEventListener('click', handleClickOutside);
        };
        document.addEventListener('click', handleClickOutside);
      });
    }
  };
}]);
