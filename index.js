import { PDFDocument } from 'pdf-lib'
const fs = require('fs');
import * as AWS from "@aws-sdk/client-s3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // ES Modules import

exports.handler = async function (event, context) {

    /**
     * Expects a JSON object with two URLs ((`first` or `cover`) and `main`) and an S3 destination key on the interchange bucket.
     */

    let firstDocumentBytes;
    let shouldRemoveMainFirstPage;
    if (event.body.cover) {
        firstDocumentBytes = await fetch(event.body.cover).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = true;
    } else {
        firstDocumentBytes = await fetch(event.body.first).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = false;
    }

    const mainBytes = await fetch(event.body.main).then(res => res.arrayBuffer())

    const coverPdf = await PDFDocument.load(firstDocumentBytes)
    const mainPdf = await PDFDocument.load(mainBytes)
    if (shouldRemoveMainFirstPage) {
        mainPdf.removePage(0);
    }

    const copiedPages = await mainPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    let index = 0;
    copiedPages.forEach((page) => { mainPdf.insertPage(0 + index, page); index++ });

    const mergedPdfBytes = await mainPdf.save();

    const client = new AWS.S3({ region: "ca-central-1" });

    const command = new PutObjectCommand({
        Body: mergedPdfBytes,
        Key: event.body.output,
        Bucket: "99bank-lambda-interchange",
    });

    const response = await client.send(command);


    return response;

}
