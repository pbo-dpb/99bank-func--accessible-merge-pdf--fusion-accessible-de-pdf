import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFDocument } from 'pdf-lib'


exports.handler = async function (event, context) {

    /**
     * Expects a JSON object with two URLs ((`first` or `cover`) and `main`) and an S3 destination key on the interchange bucket.
     */

    let firstDocumentBytes;
    let shouldRemoveMainFirstPage;
    if (event.cover) {
        firstDocumentBytes = await fetch(event.cover).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = true;
    } else {
        firstDocumentBytes = await fetch(event.first).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = false;
    }

    const mainBytes = await fetch(event.main).then(res => res.arrayBuffer())

    const coverPdf = await PDFDocument.load(firstDocumentBytes)
    const mainPdf = await PDFDocument.load(mainBytes)
    if (shouldRemoveMainFirstPage) {
        mainPdf.removePage(0);
    }

    const copiedPages = await mainPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    let index = 0;
    copiedPages.forEach((page) => { mainPdf.insertPage(0 + index, page); index++ });

    const mergedPdfBytes = await mainPdf.save();

    const client = new S3Client({});

    const command = new PutObjectCommand({
        Body: mergedPdfBytes,
        Key: event.output,
        Bucket: event.bucket ? event.bucket : "99bank-lambda-interchange",
    });

    const response = await client.send(command);


    return response;

}
