import { PDFDocument } from 'pdf-lib'
const fs = require('fs');
const AWS = require('aws-sdk');

async function readDocumentMetadata(body) {
    const pdfDoc = await PDFDocument.load(body, {
        updateMetadata: false
    })

    return pdfDoc.getSubject();
}

exports.handler = async function (event, context) {

    /**
     * Expects a JSON object with two URLs (`cover` and `main`) and an S3 destination key on the interchange bucket.
     */

    const coverBytes = await fetch(event.body.cover).then(res => res.arrayBuffer())
    const mainBytes = await fetch(event.body.main).then(res => res.arrayBuffer())

    const coverPdf = await PDFDocument.load(coverBytes)
    const mainPdf = await PDFDocument.load(mainBytes)
    mainPdf.removePage(0);

    const copiedPages = await mainPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    let index = 0;
    copiedPages.forEach((page) => { mainPdf.insertPage(0 + index, page); index++ });

    const mergedPdfBytes = await mainPdf.save();

    var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    var params = {
        Bucket: "99bank-lambda-interchange",
        Region: 'ca-central-1',
        Key: event.body.output,
        Body: mergedPdfBytes
    }

    await s3.upload(params).promise();

    return event.body.output;

}
