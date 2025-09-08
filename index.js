import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFDocument } from 'pdf-lib'


export const handler = async (event, context) => {

    /**
     * Expects a JSON object with two URLs ((`first` or `cover`) and `main`) and an S3 destination key on the interchange bucket.
     */

    const cover = event.cover;
    const first = event.first;
    const main = event.main;
    const outputKey = event.output;
    const bucket = event.bucket;
    const title = event.title;

    if ((!cover && !first) || !main || !outputKey || !bucket) {
        return { statusCode: 400, body: 'Missing required parameters.' };
    }

    let firstDocumentBytes;
    let shouldRemoveMainFirstPage;
    if (cover) {
        firstDocumentBytes = await fetch(cover).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = true;
    } else {
        firstDocumentBytes = await fetch(first).then(res => res.arrayBuffer());
        shouldRemoveMainFirstPage = false;
    }

    const mainBytes = await fetch(main).then(res => res.arrayBuffer())

    const coverPdf = await PDFDocument.load(firstDocumentBytes)
    const mainPdf = await PDFDocument.load(mainBytes)
    if (shouldRemoveMainFirstPage) {
        mainPdf.removePage(0);
    }

    const copiedPages = await mainPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    let index = 0;
    copiedPages.forEach((page) => { mainPdf.insertPage(0 + index, page); index++ });

    if (title) {
        // Overwrite the title if provided
        mainPdf.setTitle(title);
    }

    const mergedPdfBytes = await mainPdf.save();

    const client = new S3Client({});

    const command = new PutObjectCommand({
        Body: mergedPdfBytes,
        Key: outputKey,
        Bucket: bucket,
    });

    const response = await client.send(command);


    return response;

}
