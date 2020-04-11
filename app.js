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
    pdfjsLib.getDocument(pdfURL).then((pdf) => {
      getCoordenadasFirmas();
      pdfInstance = pdf;
      totalPagesCount = pdf.numPages;
      initPager();
      initPageMode();
      render();
    });
  };

  function getCoordenadasFirmas() {
    return fetch("./coordenadasFirmas.json")
      .then((res) => res.json())
      .then((data) => {
        // hago un deep copy del arreglo original para que no se modifique cuando cambie el del canvas
        arrayFirmasPDF = JSON.parse(JSON.stringify(data.Firmas));
        arrayFirmasCanvas = data.Firmas;
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

  let signatureId;
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
  function renderPage(page) {
    let pdfViewport = page.getViewport(1);
    const container =
      viewport.children[page.pageIndex - cursorIndex * pageMode];
    pdfViewport = page.getViewport(container.offsetWidth / pdfViewport.width);
    const canvas = container.children[0];
    const context = canvas.getContext("2d");
    canvas.height = pdfViewport.height;
    canvas.width = pdfViewport.width;
    PdfCanvas = canvas;
    changeCoordinatesProportions(page, canvas, renderButtonsOrSignatures);

    page.render({
      canvasContext: context,
      viewport: pdfViewport,
    });
  }

  function changeCoordinatesProportions(page, canvas, callback) {
    const filterSignaturesForPage = arrayFirmasCanvas.filter((firma) => {
      return page.pageIndex + 1 === Number(firma.numeroPagina);
    });
    for (var i = 0; i < filterSignaturesForPage.length; i++) {
      if (!filterSignaturesForPage[i].resized) {
        filterSignaturesForPage[i].coordenadax1 = resizedPoint(
          filterSignaturesForPage[i].coordenadax1,
          "X",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenadax2 = resizedPoint(
          filterSignaturesForPage[i].coordenadax2,
          "X",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenaday1 = resizedPoint(
          filterSignaturesForPage[i].coordenaday1,
          "Y",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenaday2 = resizedPoint(
          filterSignaturesForPage[i].coordenaday2,
          "Y",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenada_x1 = resizedPoint(
          filterSignaturesForPage[i].coordenada_x1,
          "X",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenada_x2 = resizedPoint(
          filterSignaturesForPage[i].coordenada_x2,
          "X",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenada_y1 = resizedPoint(
          filterSignaturesForPage[i].coordenada_y1,
          "Y",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].coordenada_y2 = resizedPoint(
          filterSignaturesForPage[i].coordenada_y2,
          "Y",
          canvas.width,
          canvas.height,
          page.view[2],
          page.view[3]
        );
        filterSignaturesForPage[i].resized = true;
      }
    }

    callback(page);
  }

  function renderButtonsOrSignatures(page) {
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

  // Signature Canvas
  const wrapper = document.getElementById("signature-pad");
  const clearButton = wrapper.querySelector("[data-action=clear]");
  const undoButton = wrapper.querySelector("[data-action=undo]");
  const saveSVGButton = wrapper.querySelector("[data-action=save-svg]");

  const canvas = wrapper.querySelector("canvas");
  const signaturePad = new SignaturePad(canvas, {
    backgroundColor: "transparent",
    minWidth: 1,
    maxWidth: 3,
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
      console.log(savedSignature);
      savedSignatureResized = signaturePad.toDataURL("image/png", {
        height:
          arrayFirmasCanvas[indexSignature].coordenaday2 -
          arrayFirmasCanvas[indexSignature].coordenada_y2,
      }); // cambiando el tamaño
      console.log(savedSignatureResized);
      const signatureLayer = document.querySelector("#viewport").firstChild;
      const signatureDiv = document.createElement("div");
      signatureDiv.classList.add("signature");
      signatureDiv.style.left =
        arrayFirmasCanvas[indexSignature].coordenada_x1 + "px";
      signatureDiv.style.bottom =
        arrayFirmasCanvas[indexSignature].coordenada_y1 + "px";
      signatureLayer.appendChild(signatureDiv);
      const image = document.createElement("img");
      image.setAttribute("width", "auto");
      image.setAttribute(
        "height",
        arrayFirmasCanvas[indexSignature].coordenaday2 -
          arrayFirmasCanvas[indexSignature].coordenada_y2 +
          "px"
      );
      image.setAttribute("src", savedSignatureResized);
      signatureDiv.appendChild(image);
      // agrego propiedades a mi arreglo de firmas de canvas
      arrayFirmasCanvas[indexSignature].firmado = true;
      arrayFirmasCanvas[indexSignature].firma = signatureDiv.outerHTML;

      // agrego propiedades para mi arreglo de firmas para PDF
      arrayFirmasPDF[indexSignature].firmado = true;
      arrayFirmasPDF[indexSignature].firmaParaPDF = savedSignature;
      console.log(arrayFirmasPDF[indexSignature]);
      render();
      closeModal();
      btnDownloadHTML = `<button class="btn-btn-primary" id="btn-download">Descarga contrato<button>`;
      document.getElementById(
        "download-btn-section"
      ).innerHTML = btnDownloadHTML;
      document
        .getElementById("btn-download")
        .addEventListener("click", function () {
          modifyPdfWithSignatureAndDownload();
        });
    }
  });

  async function modifyPdfWithSignatureAndDownload() {
    const totalSignatures = arrayFirmasCanvas.filter((firma) => {
      return firma.firmado === true;
    });
    // if (totalSignatures.length !== arrayFirmasPDF.length) {
    //   alert("Faltan firmaas");
    //   return;
    // }
    const url = "PRELLENADO.pdf";
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    for (let index = 0; index < pages.length; index++) {
      let currentPage = pages[index];
      // const { width, height } = page.getSize();
      let countSignatures = 0;
      for (let j = 0; j < arrayFirmasPDF.length; j++) {
        if (
          index + 1 === Number(arrayFirmasPDF[j].numeroPagina) &&
          arrayFirmasPDF[j].firmado
        ) {
          countSignatures++;
          // Embed the PNG image bytes and PNG image bytes
          const pngImage = await pdfDoc.embedPng(
            arrayFirmasPDF[j].firmaParaPDF
          );
          // Draw the PNG image on the page
          const x = Number(arrayFirmasPDF[j].coordenada_x1);
          const y = Number(arrayFirmasPDF[j].coordenada_y2);
          const width = Number(
            arrayFirmasPDF[j].coordenada_x2 - arrayFirmasPDF[j].coordenada_x1
          );
          const height = Number(
            arrayFirmasPDF[j].coordenaday2 - arrayFirmasPDF[j].coordenada_y2
          );
          currentPage.drawImage(pngImage, {
            x: x,
            y: y,
            width: width,
            height: height,
          });
        }
      }
    }
    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Trigger the browser to download the PDF document
    download(pdfBytes, "contrato-firmado.pdf", "application/pdf");
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
    const proportionX = parseFloat(widthWeb / pdfWidth).toFixed(2);
    const proportionY = parseFloat(heightWeb / pdfHeight).toFixed(2);
    const fixedProportionX = Math.ceil(proportionX * 100) / 100;
    const fixedProportionY = Math.ceil(proportionY * 100) / 100;
    if (valueCode === "X") {
      return (value * fixedProportionX).toFixed(2);
    } else if (valueCode === "Y") {
      return (value * fixedProportionY).toFixed(2);
    }
    return value;
  }
})();
