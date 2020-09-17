"use strict";

const body = document.body;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pageInput = document.getElementById("currentPage");
const pageNumberSpan = document.getElementById("pageCountSpan");
const dpr = window.devicePixelRatio || 1;
const textLayerDiv = document.getElementById("text-layer");
const fileUpload = document.getElementById("fileupload");

let theme = false;

function toggleTheme() {
    body.classList.toggle("dark");
    theme = !theme;
    localStorage.setItem("dark", theme.toString());
}

if (localStorage.getItem("dark") == "true") {
    toggleTheme();
}

let reader = {
    pdf: null,
    pdfFile: null,
    currentPage: Number.parseInt(localStorage.getItem("pageNum")) || 1,
    zoom: 1,
    maxPages : null,
    renderingState : "finished"
};

document.getElementById("fullscreen").addEventListener("click", (event) => {
    canvas.requestFullscreen();
});

window.addEventListener("resize", () => {
    if (screen.height === window.innerHeight && screen.width === window.innerWidth) {
        canvas.requestFullscreen().then(() => {}).catch((err) => {
        });
    }
});

document.getElementById("uploadimg").onclick = (event) => {
    fileUpload.setAttribute("accept", "application/pdf");
    fileUpload.click();
};

fileUpload.addEventListener("change", (event) => {
    let files = fileUpload.files;
    reader.pdfFile = files[files.length - 1];
    load(URL.createObjectURL(reader.pdfFile));
});

document.onkeydown = (event) => {
    if (event.keyCode === 37) {
        changePage(-1);
    }
    else if (event.keyCode === 39) {
        changePage(1);
    }
    else if (event.keyCode === 189) {
        changeZoom(-0.1);
    }
    else if (event.keyCode === 187) {
        changeZoom(0.1);
    }
    else if (event.keyCode === 36) {
        firstPage();
    }
    else if (event.keyCode === 35) {
        lastPage();
    }
    else if (event.keyCode === 48) {
        resetZoom();
    }
}

pageInput.onkeypress = (event) => {
    if (event.keyCode === 13) {
        if ((pageInput.value / 1) >= 1) {
            if (Number.parseInt(pageInput.value) <= reader.maxPages) {
                reader.currentPage = Number.parseInt(pageInput.value);
                render();
                pageInput.value = reader.currentPage;
            }
            else {
                pageInput.value = reader.currentPage;
            }
        }
        else {
            pageInput.value = reader.currentPage;
        }
    };
};

function load(path) {
    pdfjsLib.getDocument(path).then((pdf) => {
        reader.pdf = pdf;
        reader.currentPage = 1;
        reader.maxPages = pdf.numPages;
        pageNumberSpan.innerText = "/" + reader.maxPages;
        render();
        try {
            document.title = "Viewing PDF : " + reader.pdfFile.name;
        }
        catch (err) {
            console.log(err);
        }
    });
}

load("./BlankPDF Start.pdf");

function render() {
    if (reader.currentPage < 1) {
        reader.currentPage = 1;
    }
    pageInput.value = reader.currentPage;
    textLayerDiv.innerText = "";

    reader.pdf.getPage(reader.currentPage).then((page) => {
        if (reader.renderingState === "finished") {
            reader.renderingState = "pending";
            let viewport = page.getViewport(reader.zoom);
            canvas.width = viewport.width * window.devicePixelRatio;
            canvas.height = viewport.height * window.devicePixelRatio;
            ctx.scale(dpr, dpr);
            textLayerDiv.style.left = canvas.offsetLeft + viewport.width * -0.005 + "px";
            textLayerDiv.style.top = canvas.offsetTop + viewport.height * -0.01 + "px";
            textLayerDiv.style.width = canvas.width + "px";
            textLayerDiv.style.height = canvas.height + "px";
            page.getTextContent().then((textContent) => {
                pdfjsLib.renderTextLayer({
                    textContent: textContent,
                    container: textLayerDiv,
                    viewport: viewport,
                });
            });
            let renderPage = async () => {
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport
                });
                reader.renderingState = "finished";
            }
            renderPage();
        }
    })
}

function changePage(input) {
    if (reader.maxPages >= reader.currentPage + 1 * input) {
        reader.currentPage += 1 * input;
        render();
        localStorage.setItem("pageNum", reader.currentPage);
    }
}

function firstPage() {
    if (reader.currentPage != 1) {
        reader.currentPage = 1;
        render();
        localStorage.setItem("pageNum", reader.currentPage);
    }
}

function lastPage() {
    if (reader.currentPage != reader.maxPages) {
        reader.currentPage = reader.maxPages;
        render();
        localStorage.setItem("pageNum", reader.currentPage);
    }
}

function changeZoom(input) {
    reader.zoom += input;
    render();
}

function resetZoom() {
    if (reader.zoom != 1) {
        reader.zoom = 1;
        render();
    }
}

function downloadPage(link) {
    let URI = canvas.toDataURL("image/png");
    link.href = URI;
}

canvas.style.display = "block";
canvas.style.marginLeft = "auto";
canvas.style.marginRight = "auto";