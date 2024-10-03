const express = require('express')
const fs = require('fs')
var path = require('path');
const app = express()
const port = 3000
const bodyParser = require('body-parser')
var signpdf = require('@signpdf/signpdf').default;
var P12Signer = require('@signpdf/signer-p12').P12Signer;
var PDFDocumentLib = require('pdf-lib').PDFDocument;
var pdflibAddPlaceholder = require('@signpdf/placeholder-pdf-lib').pdflibAddPlaceholder;
var SUBFILTER_ETSI_CADES_DETACHED  = require('@signpdf/utils').SUBFILTER_ETSI_CADES_DETACHED;

app.use(bodyParser.json({limit: '50mb'})) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })) // for parsing application/x-www-form-urlencoded

/**
 * set position placeholder
 * @param {*} coords 
 * @returns 
 */
const topLeftToBottomLeft = (coords) => {
    return [
        coords[0], // x1
        coords[1], // y1
        coords[2], // x2
        coords[3], // y2
    ];
}

/**
 * 
 * @param {*} firstPage object selected page
 * @param {*} jpgImageBytes base64 signature speciment
 * @param {*} pdfDoc base64 document
 * @param {*} annotations position x y in pdf and size of signature speciment
 * @returns 
 */
const addVisualExistingImages = async (firstPage, jpgImageBytes, pdfDoc, annotations) => {

    const jpgImage = await pdfDoc.embedPng(jpgImageBytes)
    // const jpgDims = jpgImage.scale(0.5)
    const jpgDims = {
        height: annotations[0].element_height,
        width: annotations[0].element_width
    }

    // get the widht and height of the first page
    const {width, height} = firstPage.getSize()
    console.log('width pdf', width)
    console.log('height pdf', height)
    var margin = 30;
    var padding = 10;
    

    var text = {
        width: jpgDims.width,
        height: jpgDims.height
    };

    text.x = annotations[0].position_x
    text.y = annotations[0].position_y

    firstPage.drawImage(jpgImage, {
        x: text.x,
        y: text.y,
        width: jpgDims.width,
        height: jpgDims.height,
    })
    
    // add padding because this value will used by function topLeftToBottomLeft
    return [
        text.x - padding,
        text.y - padding,
        text.x + text.width + padding,
        text.y + text.height + padding,
    ];

}

const signExistingPdf = async (signerInfo, document_pdf, ttd, annotations) => {

    // certificate.p12 is the certificate that is going to be used to sign
    var certificatePath = path.join(__dirname, '/key/p12key/certificate.p12');
    var certificateBuffer = fs.readFileSync(certificatePath);
    var signer = new P12Signer(certificateBuffer, {passphrase: 'Qw3rty13'});
    // Load the document into PDF-LIB
    PDFDocumentLib.load(document_pdf).then((pdfDoc) => {
    // PDFDocumentLib.load(pdfBuffer).then((pdfDoc) => {
        const pages = pdfDoc.getPages()
        const firstPage = pages[annotations[0].page - 1]

        // var visualRect = addVisualExisting(firstPage, label);
        const page = firstPage.getSize();

        (async () => {
            // Add a some visuals and make sure to get their dimensions.
            var visualRect = await addVisualExistingImages(firstPage, ttd, pdfDoc, annotations);
            // Convert these dimension as Widgets' (0,0) is bottom-left based while the
            // rest of the coordinates on the page are top-left.
            var widgetRect = topLeftToBottomLeft(visualRect)

            pdflibAddPlaceholder({
                appName: 'DocuSing by P3SM',
                pdfDoc: pdfDoc,
                reason: signerInfo.reason,
                contactInfo: signerInfo.contactInfo,
                name: signerInfo.name,
                location: signerInfo.location,
                signatureLength: 3280,
                widgetRect: widgetRect, // <== !!! This is where we tell the widget to be visible
                signingTime: new Date(),
                subFilter: SUBFILTER_ETSI_CADES_DETACHED,
            })
          })()

        // Get the modified PDFDocument bytes
        pdfDoc.save()
            .then((pdfWithPlaceholderBytes) => {
                const timestamp = new Date();
                signpdf.sign(pdfWithPlaceholderBytes, signer, timestamp)
            .then((signedPdf) => {
                var targetPath = path.join(__dirname, `/existing_docu_sign.pdf`);
                fs.writeFileSync(targetPath, signedPdf);
                console.log('success')
            })
        })
    })
}

app.get('/', (req, res) => {
     const path = './existing_docu_sign.pdf'
    if (fs.existsSync(path)) {
        res.contentType("application/pdf");
        fs.createReadStream(path).pipe(res)
    } else {
        res.status(500)
        console.log('File not found')
        res.send('File not found')
    }
    // res.send('Welcome to DocuSign')
})

app.post('/sign-existing-doc', (req, res) => {
    const signer = {
        reason : req.body.reason,
        contactInfo : req.body.contact_info,
        name : req.body.name,
        location : req.body.location,
    }
    signExistingPdf(signer, req.body.document, req.body.ttd, req.body.annotations)
    const signature = 'document successfuly signed'
    res.download(__dirname, `/existing_docu_sign.pdf`)
    res.send({signature})
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})