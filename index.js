import { PDFDocument } from 'pdf-lib'
const fs = require('fs');

async function readDocumentMetadata(body) {
    const pdfDoc = await PDFDocument.load(body, {
        updateMetadata: false
    })

    return pdfDoc.getSubject();
}

exports.handler = async function (event, context) {

    const url1 = 'https://pbo-dpb--static-statique--dev.s3.ca-central-1.amazonaws.com/Models/Publication/107/coverpage_en.pdf?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW27BPFTARAOXBXG7%2F20230517%2Fca-central-1%2Fs3%2Faws4_request&X-Amz-Date=20230517T022654Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Signature=f09f8b4c4683c36541f1cd56a2f59cbf18e9a3a37a30cb1cf54c2c1966ee3a79'
    const url2 = 'https://vanherweghem-misc.s3-ca-central-1.amazonaws.com/tagged-pdf.pdf'

    const firstDonorPdfBytes = await fetch(url1).then(res => res.arrayBuffer())
    const secondDonorPdfBytes = await fetch(url2).then(res => res.arrayBuffer())

    const pdfA = await PDFDocument.load(firstDonorPdfBytes)
    const pdfB = await PDFDocument.load(secondDonorPdfBytes)
    pdfB.removePage(0);

    const copiedPagesA = await pdfB.copyPages(pdfA, pdfA.getPageIndices());
    let index = 0;
    copiedPagesA.forEach((page) => { pdfB.insertPage(0 + index, page); index++ });

    const mergedPdfBytes = await pdfB.save();


    fs.writeFile('./message7.pdf', Buffer.from(new Uint8Array(mergedPdfBytes)), () => { });

}
