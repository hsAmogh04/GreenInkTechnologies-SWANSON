const express = require('express');
const router = express.Router();
const XLSX = require('xlsx')
const pdfMakePrinter = require('pdfmake/src/printer');

const JsBarcode = require('jsbarcode');
const { Canvas } = require("canvas");

const path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('home', { title: 'Express' });
});

/* GET home page. */
router.get('/go', function (req, res, next) {
	res.render('Materialdetail', { title: 'Express' });
});




/* GET users listing. */

router.post('/receivexlxs', function (req, res, next) {
	var workbook = XLSX.readFile('BarcodeGenerator/public/spreadsheets/Plant_001_masterdata.xlsx');
	var sheet_name_list = workbook.SheetNames;
	//var 1`lfdcmsvg vfdc©grwMV  XIZHZGJB NEFWW  = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
	var doc = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
	res.send('respond with a resource');
});

// router.post('/submitLogin', function (req, res, next) {
	// res.render("index", null);
// });

router.post('/submitLogin', function (req, res, next) {
	res.render("Materialdetail", null);
});




router.post('/getcodes', function (req, res, next) {
	var workbook = XLSX.readFile('BarcodeGenerator/public/spreadsheets/Plant_001_masterdata.xlsx');
	var sheet_name_list = workbook.SheetNames;
	//var 1`lfdcmsvg vfdc©grwMV  XIZHZGJB NEFWW  = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
	var doc = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

	var filtered = doc.filter(function (value) { return value.IRMS / GCAS === '91238465' });

	res.render("QRCodes", { title: 'list', matertialList: doc });
});


router.post('/generatepdf', function (req, res, next) {
	const material = req.body.material;
	const PO = req.body.PO;
	const batch = req.body.batch;
	const prdDate = req.body.prdDate;
	const quantity = req.body.quantity;
	const quantity1 = req.body.quantity1;
	const quantity2 = req.body.quantity2;
	const quantity3 = req.body.quantity3;
	const quantity4 = req.body.quantity4;
	const quantity5 = req.body.quantity5;
	const quantity6 = req.body.quantity6;
	const quantity7 = req.body.quantity7;

	var workbook = XLSX.readFile(__dirname + '/Plant_001_masterdata.xlsx');
	//var workbook = XLSX.readFile(__dirname + '/My First Project-087f0a546d01.json');
	var sheet_name_list = workbook.SheetNames;

	var doc = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

	var filtered = doc.filter(function (value) { return value.IRMSGCAS === parseInt(material) });
	if(filtered.length <= 0) {
		res.render('Materialdetail')
	}
	else{

		const dataFormated = filtered[0];

		const row1Text = `(91) ${dataFormated.IRMSGCAS}(37)${quantity}`;
		const row2Text = `(10)AHNL${batch}~(90)${quantity6}`;
		const row3Text = `(00) 1 1534145 40011${quantity4} 6`;

		GenerateBarCodeForNumber(`91${dataFormated.IRMSGCAS}37${quantity}`).then(image1=>{
			GenerateBarCodeForNumber(`10AHNL${batch}90${quantity6}`).then(image2=>{
				GenerateBarCodeForNumber(`001153414540011${quantity4}6`).then(image3=>{
					
					dataFormated.lotNumber = batch;
					dataFormated.prdDate = prdDate;
					dataFormated.quantity = quantity;
					dataFormated.quantity1 = quantity1;
					dataFormated.quantity2 = quantity2;
					dataFormated.quantity3 = quantity3;
					dataFormated.quantity4 = quantity4;
					dataFormated.quantity5 = quantity5;
					dataFormated.quantity6 = quantity6;
					dataFormated.quantity7 = quantity7;
					dataFormated.PO = PO;
					dataFormated.rowImage1 = {png:image1, number: row1Text};
					dataFormated.rowImage2 = {png:image2, number: row2Text};
					dataFormated.rowImage3 = {png:image3, number: row3Text};
				
					generatePdf(formatPDFWithData(filtered[0]), cb => {
						res.contentType("application/pdf");
						res.send(cb);
					});
			
				}).catch(error =>
					{});
			}).catch(err =>{});
		}).catch(err =>{});
	}
});

router.post('/login', (req, res) => {

	var workbook = XLSX.readFile(__dirname + '/Plant_userdata.xlsx');
	var doc = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

	var filtered = doc.filter(value => {

		return value.Username == req.body.username
	}
	);

	if (filtered.length > 0) {
		if (filtered[0].Password == req.body.pass) {
			res.render('Materialdetail');
		}
		else {
			res.status(401).render('home');
		}
	}
	else {
		res.status(401).render('home');
	}
});

function generatePdf(docDefinition, callback) {

	try {
		var fonts = {
			Roboto: {
				normal: path.join(__dirname, './../fonts/Roboto-Regular.ttf'),
				bold: path.join(__dirname, './../fonts/Roboto-Medium.ttf'),
				italics: path.join(__dirname, './../fonts/Roboto-Italic.ttf'),
				bolditalics: path.join(__dirname, './../fonts/Roboto-Italic.ttf')
			}
		};

		const printer = new pdfMakePrinter(fonts);
		const doc = printer.createPdfKitDocument(docDefinition);

		let chunks = [];

		doc.on('data', (chunk) => {
			chunks.push(chunk);
		});

		doc.on('end', () => {
			const result = Buffer.concat(chunks);
			callback(result);
		});

		doc.end();

	} catch (err) {
		throw (err);
	}
};


function GenerateBarCodeForNumber(number){
	return new Promise((resolve, reject)=>{
		const canvas = new Canvas();
		JsBarcode(canvas, number, {format:"CODE128",  displayValue: false});	
		canvas.toDataURL((err, png) => { 
			if(err){
				reject(err)
			}
			else{
				resolve(png);
			}
		});
	})
}


function formatPDFWithData(data) {
	const formatPDF = {
		pageMargins: [ 5, 5, 5, 5 ],
		pageSize: {width: 440.28, height: 'auto'},
		content: [
			{
				style: 'tableExample',
				table: {
					widths: ['*', '*' ],
					body: [
						[
							[
								{ text: data.Suppliername, style: 'subheader_title', align: 'right' },{ text: data.Supplierlocation, style: 'subheader', margin: [35, 0, 10, 0] }
							],
							[
								{ text: `Supplier Product: ${data.Supplierproduct}`, style: 'subheader', margin: [15, 0, 10, 0] },
								{ text: `IRMS GCAS: ${data.IRMSGCAS}`, style: 'subheader', margin: [15, 0, 10, 0] },
								{ text: `Prod Date: ${data.prdDate}`, style: 'subheader', margin: [15, 0, 10, 0] }
							]
						],
						[
							{ text: `ITEM: ${data.MaterialDescription}`, style: 'subheader', color: 'black', align: 'right', colSpan: 2 },
						],
						[
							[
								{ text: `WIDTH (MM):                 HEIGHT (MM):          ${data.WIDTH}                   				   ${data.quantity1} `, style: 'subheader' },
							],
							[
								{ text:`GROSS wt.(KG):          NET wt.(KG):           ${data.quantity2}                   				   ${data.quantity3}`, style: 'subheader' },
							],
							
						],

						//[
							//[
								//{ text: `ROLL Dia(MM):      ROLLS(BLK)(MM):   ${data.ROLLDIAMETER}               				   ${data.quantity4} `, style: 'subheader' },
							//],
							//[
								//{ text:`SPLICES:          BASIS WEIGHT(GSM):           ${data.quantity5}                   				   ${data.BASISWEIGHT} `, style: 'subheader' },
							//],
							
						//],

						[
							[
								{ text: `IRMS GCAS#: ${data.IRMSGCAS}`, style: 'subheader' },
							],
							//[
							//	{ text: `QUANTITY: ${data.quantity} ${data.manROLLSBLOCKS}`, style: 'subheader' },
							//]
							[
								{ text: `LOT#: AHNL${data.lotNumber}`, style: 'subheader' },
							],
						],
						//[
						//	[
						//		{ text: `LOT#: AHNL${data.lotNumber}`, style: 'subheader' },
						//	],
						//	[
						//		{ text: `PO: ${data.PO}`, style: 'subheader' },
						//	]
						//],
						[
							
							[
								{ text:`QUANTITY:    	   ${data.quantity} `, style: 'subheader' },
							],
							[
								{ text: `Number_of_Slits: ${data.quantity4}`, style: 'subheader' },
							]
						],
						[
							//[
							//	{ text: `CUSTOMER REF.: `, style: 'subheader' },
							//],
							[
								{ text:`BASIS WEIGHT:    	   ${data.PO} `, style: 'subheader' },
							],
							[
								{ text: `PALLET TYPE : ${data.quantity6}`, style: 'subheader' },
							]
						],
						[
							{stack:[
								{ image: data.rowImage1.png, width: 200, height: 65},
								{ text: data.rowImage1.number, style: 'subheader', margin: [10, 0, 10, 0] }
							], colSpan:2, margin: [100, 0, 10, 0] }
						],
						[
							{stack:[
								{ image: data.rowImage2.png, width: 200, height: 65},
								{ text: data.rowImage2.number, style: 'subheader', margin: [10, 0, 10, 0] }
							], colSpan:2, margin: [100, 0, 10, 0] }
						],
						[
							{stack:[
								{ image: data.rowImage3.png, width: 200, height: 65},
								{ text: data.rowImage3.number, style: 'subheader', margin: [10, 0, 10, 0] }
							], colSpan:2, margin: [100, 0, 10, 0] }
						],
					]
				}
			},
		],

		styles: {
			header: {
				fontSize: 14,
				bold: true,
				margin: [0, 0, 0, 10]
			},
			subheader_title: {
				fontSize: 10,
				bold: true,
				margin: [5, 10, 0, 5]
			},
			subheader: {
				fontSize: 12,
				bold: true,
				margin: [0, 10, 0, 5]
			},
			tableExample: {
				margin: [0, 0, 0, -10]
			},
			tableHeader: {
				bold: true,
				fontSize: 9,
				color: 'black'
			}
		},
		defaultStyle: {
			// alignment: 'justify'
		}
	};

	return formatPDF;
}

module.exports = router;