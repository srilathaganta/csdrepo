/*! pdfExternal.js
 *  
 *  2017-11-14
 *
 *  By Pradeepkumar P 
 *  
 */

/**
 * Returns Array of Header Names
 * @param {Array} data - List of Header Names
 * @param {Array} irowSpan - Specifies the number of rows a cell should span
 * @param {Array} icolSpan - Specifies the number of columns a cell should span
 * @return {Array} out - Return proper Header Names format 
 */
var generateArrayPDFObject = (function(data,irowSpan,icolSpan) {

	return {
	  generateArrayPDF: function (data,irowSpan,icolSpan) {
        var out = [];
        var ranges = [];
       
        for (var R = 0; R < data.length; ++R) {
            var outRow = [];
            var row = data[R];
            for (var C = 0; C < data[R].length; ++C) {

                var colspan = icolSpan[R][C];
                var rowspan = irowSpan[R][C];
                var cellValue = data[R][C];
                if (cellValue !== "" && cellValue == +cellValue) cellValue = +cellValue;


                //Skip ranges
                ranges.forEach(function (range) {
                    if (R >= range.s.r && R <= range.e.r && outRow.length >= range.s.c && outRow.length <= range.e.c) {
                        for (var i = 0; i <= range.e.c - range.s.c; ++i) outRow.push('');
                    }
                });

                //Handle Row Span
                if (rowspan || colspan) {
                    rowspan = rowspan || 1;
                    colspan = colspan || 1;
                    ranges.push({ s: { r: R, c: outRow.length }, e: { r: R + rowspan - 1, c: outRow.length + colspan - 1 } });
                   
                };

                //Handle Value
                outRow.push(cellValue !== "" ? cellValue : '');

                //Handle Colspan
                if (colspan) for (var k = 0; k < colspan - 1; ++k) outRow.push('');


            }
           
            if (out.length >0) {
                if (out[R - 1].length != outRow.length) outRow.push('');
            } 
            out.push(outRow);
        }

        return out;
    }
  }

})(generateArrayPDFObject||{})

/**
 * Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
 * @param {String} color - name of the color or hexadecimal digit e.g. 'red' or '#f00' 
 * @return {Array} out - Returns the color as an array of [r, g, b, a] 
 */
var colorToRgbObject = (function(color) { 
	
  return { 
	  colorToRgb:function(color) {
		    var colorArray = new Array();
		    
		    if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
		        colorArray.push(constantsInf.WHITE_BG_COLOR);
		        colorArray.push(constantsInf.WHITE_BG_COLOR);
		        colorArray.push(constantsInf.WHITE_BG_COLOR);
		    }
		    else { 
		    var cvs, ctx;
		    cvs = document.createElement('canvas');
		    cvs.height = 1;
		    cvs.width = 1;
		    ctx = cvs.getContext('2d');
		    ctx.fillStyle = color;
		    ctx.fillRect(0, 0, 1, 1);
		   
		    colorArray.push(ctx.getImageData(0, 0, 1, 1).data[0]);
		    colorArray.push(ctx.getImageData(0, 0, 1, 1).data[1]);
		    colorArray.push(ctx.getImageData(0, 0, 1, 1).data[2]);
		}

		    return colorArray;
		}
  } 
})(colorToRgbObject||{})

var getTextFromFirstChildObject = (function(loc) { 
	
  return { 
	  getTextFromFirstChild: function(loc) {
		    var temp = '';
		    if ($(loc).contents(":not(:empty)").first().text() == '') {
		        temp = $(loc).contents().first().text();
		        if (temp == '') {
		            temp = $(loc).contents(":not(:empty)")[1].innerText;
		        }
		    }
		    else {
		        temp = $(loc).contents(":not(:empty)").first().text();
		    }
		   
		    return temp.trim();
		}
  } 
})(getTextFromFirstChildObject||{})
/**
 * Returns Array of Header Names
 * @param {Array} data - List of Header Names
 * @param {Array} irowSpan - Specifies the number of rows a cell should span
 * @param {Array} icolSpan - Specifies the number of columns a cell should span
 * @return {Array} out - Return proper Header Names format 
 */
var generateArrayObject = (function(data, irowSpan, icolSpan) { 
	
  return { 
	  generateArray: function(data, irowSpan, icolSpan) {

		    var out = []; 
		    var ranges = [];
		    var wsMerges = [];
		    for (var R = 0; R < data.length; ++R) {
		        var outRow = [];
		        var row = data[R];
		        for (var C = 0; C < data[R].length; ++C) {
		         
		            var colspan = icolSpan[R][C];
		            var rowspan = irowSpan[R][C];
		            var cellValue = data[R][C];
		            if (cellValue !== "" && cellValue == +cellValue) cellValue = +cellValue;

		            //Skip ranges
		            ranges.forEach(function (range) {
		                if (R >= range.s.r && R <= range.e.r && outRow.length >= range.s.c && outRow.length <= range.e.c) {
		                    for (var i = 0; i <= range.e.c - range.s.c; ++i) outRow.push(null);
		                }
		            });
		            
		            //Handle Row Span
		            if (rowspan || colspan) {
		                rowspan = rowspan || 1;
		                colspan = colspan || 1;
		                ranges.push({ s: { r: R, c: outRow.length }, e: { r: R + rowspan - 1, c: outRow.length + colspan - 1 } });
		                var fcol = XLSX.utils.encode_cell({ c: outRow.length, r: R });
		                var lcol = XLSX.utils.encode_cell({ c: outRow.length + colspan - 1, r: R + rowspan - 1 })
		                if (fcol != lcol) wsMerges.push(fcol + ':' + lcol)
		            };

		            //Handle Value
		            outRow.push(cellValue !== "" ? cellValue : null);

		            //Handle Colspan
		            if (colspan) for (var k = 0; k < colspan - 1; ++k) outRow.push(null);         
		        }
		        out.push(outRow);
		    }
		    return [out, ranges, wsMerges];
		}
  } 
})(generateArrayObject||{})

var sheet_from_array_of_arraysObject = (function(data, wsMerges,icolHeaders,irowSpan,icolSpan,canvasdata,firstColumnEmpty) { 
	
  return { 
	  sheet_from_array_of_arrays: function(data, wsMerges,icolHeaders,irowSpan,icolSpan,canvasdata,firstColumnEmpty) {

		    
		    var ws = {};   
		    var range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
		    var rowcol = parseInt(firstColumnEmpty);
			var cell_ref_val = rowcol + 65; //charcode of 'A' is 65
			var border_cell_ref = [];
			for (var i = 65; i <cell_ref_val ; i++) {
				border_cell_ref.push(String.fromCharCode(i));
			}
		    for (var R = 0; R != data.length; ++R) {
		        for (var C = 0; C != data[R].length; ++C) {
		            if (range.s.r > R) range.s.r = R;
		            if (range.s.c > C) range.s.c = C;
		            if (range.e.r < R) range.e.r = R;
		            if (range.e.c < C) range.e.c = C;
		            var colspan = icolSpan[R][C] - 1;
		            var rowspan = irowSpan[R][C] - 1;
		            var cell = { v: data[R][C] };
		            if (cell.v == null) cell.v ="   ";
		            var cell_ref = XLSX.utils.encode_cell({ c: C, r: R });

		            if (typeof cell.v === 'number') cell.t = 'n';
		            else if (typeof cell.v === 'boolean') cell.t = 'b';
		            else if (cell.v instanceof Date) {
		                cell.t = 'n'; cell.z = XLSX.SSF._table[14];
		                cell.v = datenum(cell.v);
		            }
		            else cell.t = 's';
		            for(var i=0;i<border_cell_ref.length;i++){
						if(border_cell_ref.indexOf(cell_ref.substring(0,1)) < 0){
				            cell.s= {
				                    //border
				                    border: {
				                            top: {style: "thin", color: {auto: 1}},
				                            right: {style: "thin", color: {auto: 1}},
				                            bottom: {style: "thin", color: {auto: 1}},
				                            left: {style: "thin", color: {auto: 1}}
				                    }
				                }
							}
						}
		            ws[cell_ref] = cell;
		        }
		    }
		    var images = [];
			images.push({
				c: 1,
				r: 2,
				element:  $('#svgdataurl img')
			  });
			ws["!images"] = [];

			//add chart in worksheet 
			$.each(images, function(index, image){
				ws["!images"].push({
				name: 'image.png',
				data: canvasdata,
				opts: {base64: true},
				type: "png",
				position: {
				  type: 'twoCellAnchor',
				  attrs: {editAs: 'oneCell'},
				  from: {col: rowcol, row: data.length+rowcol},
				  to: {col: rowcol+10, row: rowcol+40}
				}
			  });
			});
		    
		    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
		    ws['!merges'] = wsMerges;
		    ws['!icolHeaders'] = icolHeaders;
		    return ws;

	  }
  } 
})(sheet_from_array_of_arraysObject||{})

var getExcelExportObject = (function(value,irowSpan,icolSpan,firstColumnEmpty) { 
	
  return { 
	  getExcelExport: function(value,irowSpan,icolSpan,firstColumnEmpty) {
		    var tobj = value;
		    var XlsdefaultsInf = {
		        dynamicWidth:true,
		        minWidth: 30,
		        firstRowColEmpty: true,
		        SingleSheet:true
		    }
		    var singlesheetcnt = 0;
		    var jsonDataVal = (function () {
		        var json = null;
		        $.ajax({
		            'async': false,
		            'global': false,
		            'url': 'app/jsonData.json',
		            'dataType': "json",
		            'success': function (data) {
		                json = data;
		            }
		        });
		        return json;
		    })();
		    var defaults = {
		        separator: ',',
		        ignoreColumn: [],
		        tableName: ['grid1', 'grid2', 'grid3'],
		        type: 'csv',
		        pdfFontSize: 14,
		        pdfLeftMargin: 20,
		        escape: 'true',
		        htmlContent: 'false',
		        consoleLog: 'false',
		        tableCount: 1,
		        dataSource:'Server',
		         containerid: null
		            , datatype: 'json'
		            , dataset: null
		            , columns: null
		            , returnUri: false
		            , worksheetName: "My Worksheet"
		            , encoding: "utf-8"
		    };  
		    var ShowLabel = this.fileNametxt;
		    var dsDetail = this.dsDetails;
		    var tabledata = Array();
		    var headercount = 0;
		    var icolHeaders = Array();
		    var firstColumnEmpty = firstColumnEmpty;

		    XlsdefaultsInf.firstRowColEmpty = this.firstRowColEmptyDDl;
		    XlsdefaultsInf.SingleSheet = this.SingleSheetDDl;

		    if (XlsdefaultsInf.firstRowColEmpty == 'true') {
		    	for(var i=0;i<firstColumnEmpty;i++){
					tabledata[i] = "";
					icolHeaders[i] = "";
					irowSpan[i] = "";
					icolSpan[i] = "";
				}
		    } else {
		        firstColumnEmpty = 0;
		    }
		    var hi = 0;
		    var hj = 0;
		   debugger
		   if (dsDetail == 'server') {
		       var arrData = typeof jsonDataVal != 'object' ? JSON.parse(jsonDataVal) : jsonDataVal;
		     
		       tabledata[hi + firstColumnEmpty ] = Array();
		       icolHeaders[hi + firstColumnEmpty ] = Array();
		       irowSpan[hi + firstColumnEmpty] = Array();
		       icolSpan[hi + firstColumnEmpty] = Array();
		       if (ShowLabel) {
		        
		           for (var index in arrData[0]) {
		               tabledata[hi + firstColumnEmpty][hj + firstColumnEmpty] = index;
		               icolHeaders[hi + firstColumnEmpty][hj + firstColumnEmpty] = index;
		               irowSpan[hi + firstColumnEmpty][hj + firstColumnEmpty] = 1;
		               icolSpan[hi + firstColumnEmpty][hj + firstColumnEmpty] = 1;
		               hj += 1;               
		           }
		           hi += 1;
		       }
		       headercount += 1;
		    
		     
		       for (var i = 0; i < arrData.length; i++) {
		           tabledata[i + headercount + firstColumnEmpty] = Array();
		           irowSpan[i + headercount + firstColumnEmpty] = Array();
		           icolSpan[i + headercount + firstColumnEmpty] = Array();
		        var jv = 0;
		           for (var value in arrData[i]) {
		            
		               tabledata[i + headercount + firstColumnEmpty][jv + firstColumnEmpty] = arrData[i][value];
		               irowSpan[i + headercount + firstColumnEmpty][jv + firstColumnEmpty] = 1;
		               icolSpan[i + headercount + firstColumnEmpty][jv + firstColumnEmpty] = 1;
		               jv += 1;
		             
		           }
		         
		       }
		      

		   } else {
		       singlesheetcnt = 0;
		       if (XlsdefaultsInf.SingleSheet == 'true') {
		           $.each(defaults.tableName, function (key, value) {              
		               headercount = 0;

		               if (singlesheetcnt != 0) {
		                   tabledata[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolHeaders[singlesheetcnt + firstColumnEmpty] = Array();
		                   irowSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   singlesheetcnt = singlesheetcnt + 1;
		                   tabledata[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolHeaders[singlesheetcnt + firstColumnEmpty] = Array();
		                   irowSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   singlesheetcnt = singlesheetcnt + 1;
		               };
		               debugger
		               $('#' + value).find('thead').find('tr').each(function (i, v) {
		                   tabledata[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolHeaders[singlesheetcnt + firstColumnEmpty] = Array();
		                   irowSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolSpan[singlesheetcnt + firstColumnEmpty] = Array();


		                   $(this).filter(':visible').find('th').each(function (index, data) {
		                       if ($(this).css('display') != 'none') {

		                           tabledata[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                           icolHeaders[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                           irowSpan[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('rowSpan'));
		                           icolSpan[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('colSpan'));
		                       }

		                   });
		                   singlesheetcnt += 1;
		                   headercount += 1;
		                 
		               });


		               // Row vs Column
		               $('#' + value).find('tbody').find('tr').each(function (i, v) {
		                   tdData += "\n";
		                   tabledata[singlesheetcnt + firstColumnEmpty] = Array();
		                   irowSpan[singlesheetcnt + firstColumnEmpty] = Array();
		                   icolSpan[singlesheetcnt + firstColumnEmpty] = Array();


		                   $(this).filter(':visible').find('td').each(function (index, vv) {
		                       if ($(this).css('display') != 'none') {

		                           tabledata[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                           irowSpan[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('rowSpan'));
		                           icolSpan[singlesheetcnt + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('colSpan'));
		                       }
		                   });
		                   singlesheetcnt += 1;
		               });
		           });
		       }
		       else {
		           headercount = 0;
		           

		           $('#' + tobj).find('thead').find('tr').each(function (i, v) {

		               tabledata[i + firstColumnEmpty] = Array();
		               icolHeaders[i + firstColumnEmpty] = Array();
		               irowSpan[i + firstColumnEmpty] = Array();
		               icolSpan[i + firstColumnEmpty] = Array();


		               $(this).filter(':visible').find('th').each(function (index, data) {
		                   if ($(this).css('display') != 'none') {

		                       tabledata[i + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                       icolHeaders[i + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                       irowSpan[i + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('rowSpan'));
		                       icolSpan[i + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('colSpan'));
		                   }

		               });

		               headercount += 1;
		           });


		           // Row vs Column
		           $('#' + tobj).find('tbody').find('tr').each(function (i, v) {
		               tdData += "\n";
		               tabledata[i + headercount + firstColumnEmpty] = Array();
		               irowSpan[i + headercount + firstColumnEmpty] = Array();
		               icolSpan[i + headercount + firstColumnEmpty] = Array();


		               $(this).filter(':visible').find('td').each(function (index, vv) {
		                   if ($(this).css('display') != 'none') {

		                       tabledata[i + headercount + firstColumnEmpty][index + firstColumnEmpty] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
		                       irowSpan[i + headercount + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('rowSpan'));
		                       icolSpan[i + headercount + firstColumnEmpty][index + firstColumnEmpty] = ($(this).prop('colSpan'));
		                   }
		               });
		           });
		       }
		       }
		       
		        //output
		        if (defaults.consoleLog == 'true') {
		            console.log(tdData);
		        }
		       
		      
		        return [tabledata, icolHeaders];

	  }
  } 
})(getExcelExportObject||{})

var WorkbookObject = (function () {
	
	return{
		Workbook: function(){
			 if (!(this instanceof Workbook)) return new Workbook();
		        this.SheetNames = [];
		        this.Sheets = {};
		}
	}
})(WorkbookObject||{})

    

var s2abObject = (function(s) {
	
	return{
		s2ab: function(s){
			var buf = new ArrayBuffer(s.length);
	        var view = new Uint8Array(buf);
	        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	        return buf;
		}
	}
})(s2abObject||{})

var utilityCallbackObject = (function(object) {
	
	return{
		utilityCallback: function(object){
			var myObject = {
				    header1: 'some string value',
				    header2: 'some text',
				    header3: 'some other text'
				};
			object = myObject;
			return object; 
		}
	}
})(utilityCallbackObject||{})


var checkObject = (function(obj) {
	
	return{
		checkObj: function(obj){
			return obj && obj !== 'null' && obj !== 'undefined';
		}
	}
})(checkObject||{})



