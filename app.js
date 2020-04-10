(function () {
  let currentPageIndex = 0;
  let pageMode = 1;
  let cursorIndex = Math.floor(currentPageIndex / pageMode);
  let pdfInstance = null;
  let totalPagesCount = 0;
  let arrayFirmasCanvas = []; // aqui meto las firmas y coordenadas del excel
  let arrayFirmasPDF = [];

  const viewport = document.querySelector("#viewport");
  window.initPDFViewer = function (pdfURL) {
    getCoordenadasFirmas();
    pdfjsLib.getDocument(pdfURL).then((pdf) => {
      pdfInstance = pdf;
      totalPagesCount = pdf.numPages;
      initPager();
      initPageMode();
      render();
    });
  };

  function getCoordenadasFirmas() {
    fetch("./coordenadasFirmas.json")
      .then((res) => res.json())
      .then((data) => {
        arrayFirmasCanvas = data.Firmas;
        arrayFirmasPDF = data.Firmas;
      })
      .catch((err) => console.error(err));
  }

  function onPagerButtonsClick(event) {
    const action = event.target.getAttribute("data-pager");
    if (action === "prev") {
      if (currentPageIndex === 0) {
        return;
      }
      currentPageIndex -= pageMode;
      if (currentPageIndex < 0) {
        currentPageIndex = 0;
      }
      render();
    }
    if (action === "next") {
      if (currentPageIndex === totalPagesCount - 1) {
        return;
      }
      currentPageIndex += pageMode;
      if (currentPageIndex > totalPagesCount - 1) {
        currentPageIndex = totalPagesCount - 1;
      }
      render();
    }
  }

  function initPager() {
    const pager = document.querySelector("#pager");
    pager.addEventListener("click", onPagerButtonsClick);
    return () => {
      pager.removeEventListener("click", onPagerButtonsClick);
    };
  }

  function onPageModeChange(event) {
    pageMode = Number(event.target.value);
    render();
  }
  function initPageMode() {
    const input = document.querySelector("#page-mode input");
    input.setAttribute("max", totalPagesCount);
    input.addEventListener("change", onPageModeChange);
    return () => {
      input.removeEventListener("change", onPageModeChange);
    };
  }

  function render() {
    cursorIndex = Math.floor(currentPageIndex / pageMode);
    const startPageIndex = cursorIndex * pageMode;
    const endPageIndex =
      startPageIndex + pageMode < totalPagesCount
        ? startPageIndex + pageMode - 1
        : totalPagesCount - 1;

    const renderPagesPromises = [];
    for (let i = startPageIndex; i <= endPageIndex; i++) {
      renderPagesPromises.push(pdfInstance.getPage(i + 1));
    }

    Promise.all(renderPagesPromises).then((pages) => {
      const pagesHTML = `<div style="width: ${
        pageMode > 1 ? "50%" : "100%"
      }"><canvas></canvas></div>`.repeat(pages.length);
      viewport.innerHTML = pagesHTML;
      pages.forEach(renderPage);
    });
  }

  let signatureId = 0;
  function showModal(id) {
    signatureId = id;
    const modal = document.getElementById("myModal");
    const span = document.getElementsByClassName("close")[0];
    modal.style.display = "block";
    span.onclick = function () {
      modal.style.display = "none";
    };
    resizeCanvas();
  }

  function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
  }

  var PdfCanvas;
  let updatedCoordinatesProportion = false;
  let currentPage;
  function renderPage(page) {
    currentPage = page;
    let pdfViewport = page.getViewport(1);
    const container =
      viewport.children[page.pageIndex - cursorIndex * pageMode];
    pdfViewport = page.getViewport(container.offsetWidth / pdfViewport.width);
    const canvas = container.children[0];
    const context = canvas.getContext("2d");
    canvas.height = pdfViewport.height;
    canvas.width = pdfViewport.width;
    PdfCanvas = canvas;
    if (!updatedCoordinatesProportion) {
      changeCoordinatesProportions(canvas, renderButtonsOrSignatures);

      updatedCoordinatesProportion = true;
    } else {
      renderButtonsOrSignatures();
    }

    page.render({
      canvasContext: context,
      viewport: pdfViewport,
    });
  }

  function renderButtonsOrSignatures() {
    console.log(arrayFirmasCanvas);
    const page = currentPage;
    const filterSignaturesForPage = arrayFirmasCanvas.filter((firma) => {
      return page.pageIndex + 1 === Number(firma.numeroPagina);
    });
    const htmlSignaturesForPage = filterSignaturesForPage
      .map((item) => {
        return item.firmado
          ? item.firma.toString()
          : `<div class="signature" style="left: ${item.coordenadax1}px; bottom: ${item.coordenada_y2}px;">
        <span data-id="${item.id}">Firma aquí</span>
      </div>`;
      })
      .join("");
    const signatureLayer = document.querySelector("#viewport").firstChild;
    const signaturesDiv = document.createElement("div");
    signaturesDiv.innerHTML = htmlSignaturesForPage;
    signatureLayer.appendChild(signaturesDiv);
    signatureLayer.querySelectorAll("span").forEach(function (span) {
      span.addEventListener("click", function (e) {
        showModal(span.dataset.id);
      });
    });
  }

  function changeCoordinatesProportions(canvas, callback) {
    const renderFunction = callback;
    for (var i = 0; i < pdfInstance.numPages; i++) {
      pdfInstance.getPage(i + 1).then((page) => {
        arrayFirmasCanvas.forEach((firma) => {
          if (page.pageIndex + 1 === Number(firma.numeroPagina)) {
            console.log(
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            console.log(firma.coordenadax1);
            firma.coordenadax1 = resizedPoint(
              firma.coordenadax1,
              "X",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            console.log(firma.coordenadax1);
            firma.coordenadax2 = resizedPoint(
              firma.coordenadax2,
              "X",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenaday1 = resizedPoint(
              firma.coordenaday1,
              "Y",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenaday2 = resizedPoint(
              firma.coordenaday2,
              "Y",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenada_x1 = resizedPoint(
              firma.coordenada_x1,
              "X",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenada_x2 = resizedPoint(
              firma.coordenada_x2,
              "X",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenada_y1 = resizedPoint(
              firma.coordenada_y1,
              "Y",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
            firma.coordenada_y2 = resizedPoint(
              firma.coordenada_y2,
              "Y",
              canvas.width,
              canvas.height,
              page.view[2],
              page.view[3]
            );
          }
        });
      });
      if (i + 1 === pdfInstance.numPages) {
        callback();
      }
    }
  }

  // Signature Canvas
  const wrapper = document.getElementById("signature-pad");
  const clearButton = wrapper.querySelector("[data-action=clear]");
  const undoButton = wrapper.querySelector("[data-action=undo]");
  const saveSVGButton = wrapper.querySelector("[data-action=save-svg]");

  const canvas = wrapper.querySelector("canvas");
  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: "transparent",
  });

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    signaturePad.clear();
  }

  window.onresize = resizeCanvas;
  resizeCanvas();

  clearButton.addEventListener("click", function (event) {
    signaturePad.clear();
  });

  undoButton.addEventListener("click", function (event) {
    const data = signaturePad.toData();

    if (data) {
      data.pop(); // remove the last dot or line
      signaturePad.fromData(data);
    }
  });

  let savedSignature;
  saveSVGButton.addEventListener("click", function (event) {
    if (signaturePad.isEmpty()) {
      alert("Please provide a signature first.");
    } else {
      // saco mi objeto firma del span al que dieron click
      let indexSignature = arrayFirmasCanvas.findIndex(
        (item) => Number(item.id) === Number(signatureId)
      );
      //const dataURL = signaturePad.toDataURL("image/svg+xml");
      savedSignature = signaturePad.toDataURL("image/png");
      const signatureLayer = document.querySelector("#viewport").firstChild;
      const signatureDiv = document.createElement("div");
      signatureDiv.classList.add("signature");
      signatureDiv.style.left =
        arrayFirmasCanvas[indexSignature].coordenada_x1 + "px";
      signatureDiv.style.bottom =
        arrayFirmasCanvas[indexSignature].coordenada_y1 + "px";
      signatureLayer.appendChild(signatureDiv);
      const image = document.createElement("img");
      image.setAttribute(
        "width",
        arrayFirmasCanvas[indexSignature].coordenadax2 -
          arrayFirmasCanvas[indexSignature].coordenadax1 +
          "px"
      );
      image.setAttribute(
        "height",
        arrayFirmasCanvas[indexSignature].coordenaday2 -
          arrayFirmasCanvas[indexSignature].coordenada_y2 +
          "px"
      );
      image.setAttribute("src", savedSignature);
      signatureDiv.appendChild(image);
      arrayFirmasCanvas[indexSignature].firmado = true;
      arrayFirmasCanvas[indexSignature].firma = signatureDiv.outerHTML;
      arrayFirmasCanvas[indexSignature].firmaParaPDF = savedSignature;
      render();
      closeModal();
      btnDownloadHTML = `<button class="btn-btn-primary" id="btn-download">Descarga contrato<button>`;
      document.getElementById(
        "download-btn-section"
      ).innerHTML = btnDownloadHTML;
      document
        .getElementById("btn-download")
        .addEventListener("click", function () {
          modifyPdfWithSignatureAndDownload(leftPosition, topPosition);
        });
    }
  });

  async function modifyPdfWithSignatureAndDownload(leftPosition, topPosition) {
    const totalSignatures = arrayFirmasCanvas.filter((firma) => {
      return firma.firmado === true;
    });
    if (totalSignatures.length !== arrayFirmasPDF.length) {
      alert("Faltan firmaas");
      return;
    }
    const url = "PRELLENADO.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    // Get the width and height of the first page
    const { width, height } = firstPage.getSize();

    // Get the width/height of the PNG image scaled down to 50% of its original size

    // saco porcentaje de las coordenadas respecto al canvas
    // const { percentageX, percentageY } = coordinatesToPercent(
    //   leftPosition,
    //   topPosition,
    //   PdfCanvas.width,
    //   PdfCanvas.height
    // );
    // saco coordenadas desde los porcentajes con las medidas del PDF original
    // const { x, y } = percentToCoordinates(
    //   percentageX,
    //   percentageY,
    //   width,
    //   height
    // );
    // saco proporciones de la imagen respecto del pdf original en base a su medida encima del canvas
    // const imgWidhtProportionInPdf = resizedPoint(
    //   imgSignWidth,
    //   "X",
    //   PdfCanvas.width,
    //   PdfCanvas.height,
    //   width,
    //   height
    // );
    // const imgHeightProportionInPdf = resizedPoint(
    //   imgSignHeight,
    //   "Y",
    //   PdfCanvas.width,
    //   PdfCanvas.height,
    //   width,
    //   height
    // );
    let hasAllSignatures = false;
    for (let index = 0; index < pages.length; index++) {
      let currentPage = pages[index];
      // const { width, height } = page.getSize();
      let countSignatures = 0;
      for (let j = 0; j < arrayFirmasPDF.length; j++) {
        if (
          index + 1 === Number(arrayFirmasPDF[j].numeroPagina) &&
          arrayFirmasPDF[j].firmado
        ) {
          console.log(`imprimo firma en página ${index + 1}`);
          countSignatures++;
          // Embed the PNG image bytes and PNG image bytes
          const pngImage = await pdfDoc.embedPng(
            arrayFirmasPDF[j].firmaParaPDF
          );
          // Draw the PNG image on the page
          currentPage.drawImage(pngImage, {
            // x: x - middleImgWidth,
            // y: height - y - middleImgHeigh, //pdf-lib da la posicion desde abajo del documento por eso le resto al alto total la coordenada
            x: arrayFirmasPDF[j].coordenada_x1,
            y: arrayFirmasPDF[j].coordenada_y2,
            width:
              arrayFirmasPDF[j].coordenada_x2 - arrayFirmasPDF[j].coordenada_x1,
            height:
              arrayFirmasPDF[j].coordenaday2 - arrayFirmasPDF[j].coordenada_y2,
          });
        }
      }
    }
    // la posicion de la firma en canvas varia a como la acomoda en el PDF, encontre que mas o menos estas proporciones son las que varian
    // const middleImgHeigh = imgHeightProportionInPdf / 2;
    // const middleImgWidth = imgWidhtProportionInPdf / 8;

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, "contrato-firmado.pdf", "application/pdf");
  }

  function coordinatesToPercent(valueX, valueY, width, height) {
    const percentageX = (100 * valueX) / width;
    const percentageY = (100 * valueY) / height;
    return { percentageX, percentageY };
  }

  function percentToCoordinates(percentageX, percentageY, width, height) {
    const x = (percentageX * width) / 100;
    const y = (percentageY * height) / 100;
    return { x, y };
  }

  // calcula proporciones, da los mismo valores que calculando porcentajes, la deje y la ocupe para las proporciones de la imagen de la firma
  function resizedPoint(
    value,
    valueCode,
    widthWeb,
    heightWeb,
    pdfWidth,
    pdfHeight
  ) {
    const proportionX = widthWeb / pdfWidth;
    const proportionY = heightWeb / pdfHeight;
    if (valueCode === "X") {
      return value * proportionX;
    } else if (valueCode === "Y") {
      return value * proportionY;
    }
    return value;
  }
})();
