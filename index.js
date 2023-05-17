import { PDFDocument } from 'pdf-lib'
const fs = require('fs');
import * as AWS from "@aws-sdk/client-s3";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // ES Modules import

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

    const client = new AWS.S3({ region: "REGION" });

    const s3 = new S3Client({
        Region: 'ca-central-1',
    });

    const command = new PutObjectCommand({
        Body: mergedPdfBytes,
        Key: event.body.output,
        Bucket: "99bank-lambda-interchange",
    });
    const response = await client.send(command);


    return response;

}
