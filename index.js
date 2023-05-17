import { PDFDocument } from 'pdf-lib'
const fs = require('fs');

async function readDocumentMetadata(body) {
    const pdfDoc = await PDFDocument.load(body, {
        updateMetadata: false
    })

    return pdfDoc.getSubject();
}

exports.handler = async function (event, context) {

    /**
     * Expects a JSON object with two base64 encoded files: `cover` and `main`.
     */
    const coverBytes = Buffer.from(event.cover, 'base64');
    const mainBytes = Buffer.from(event.main, 'base64');

    const coverPdf = await PDFDocument.load(coverBytes)
    const mainPdf = await PDFDocument.load(mainBytes)
    mainPdf.removePage(0);

    const copiedPages = await mainPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    let index = 0;
    copiedPages.forEach((page) => { mainPdf.insertPage(0 + index, page); index++ });

    const mergedPdfBytes = await mainPdf.save();

    return mergedPdfBytes;

}
