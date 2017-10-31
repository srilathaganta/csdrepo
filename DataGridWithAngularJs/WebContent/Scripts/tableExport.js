﻿var tdData = "";

var defaults = {
    separator: ',',
    ignoreColumn: [],
    tableName: ['grid1', 'grid2', 'grid3'], //, 'grid1', 'activity', 'comtest''grid2'
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

var XlsdefaultsInf = {
    dynamicWidth:true,
    minWidth: 30,
    firstRowColEmpty: true,
    SingleSheet:true
}
var constantsInf = {
    WHITE_BG_COLOR : 255
}

var PdfdefaultsInf = {
    htmltableStyle: false,
    customText:'',
    customtextLines:0
}

var base64Img;
PdfdefaultsInf.customText=''//'This is custom text to test whether custom text is added correctly on top of the page or not. \n'+
//            'This is custom text to test whether custom text is added correctly on top of the page or not.This is custom text to test whether custom text is added correctly on top of the page or not. \n' +
//            'This is custom text to test whether custom text is added correctly on top of the page or not.This is custom text to test whether custom text is added correctly on top of the page or not. \n' +
//            'This is custom text to test whether custom text is added correctly on top of the page or not.This is custom text to test whether custom text is added correctly on top of the page or not.\n'
PdfdefaultsInf.customtextLines = 1;

var irowSpan = Array();
var icolSpan = Array();


function datenum(v, date1904) {
    if (date1904) v += 1462;
    var epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function generateArrayPDF(data) {
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

    return out//, ranges, wsMerges];
};


function generateArray(data) {
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
};

function sheet_from_array_of_arrays(data, wsMerges,icolHeaders, opts) {
    
    var ws = {};   
    var range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
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
            ws[cell_ref] = cell;
        }
    }
    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    ws['!merges'] = wsMerges;
    ws['!icolHeaders'] = icolHeaders;
    return ws;
}



function safe_decode_range(range) {
    var o = {
        s: {
            c: 0,
            r: 0
        },
        e: {
            c: 0,
            r: 0
        }
    };
    var idx = 0,
        i = 0,
        cc = 0;
    var len = range.length;
    for (idx = 0; i < len; ++i) {
        if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
        idx = 26 * idx + cc
    }
    o.s.c = --idx;
    for (idx = 0; i < len; ++i) {
        if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
        idx = 10 * idx + cc
    }
    o.s.r = --idx;
    if (i === len || range.charCodeAt(++i) === 58) {
        o.e.c = o.s.c;
        o.e.r = o.s.r;
        return o
    }
    for (idx = 0; i != len; ++i) {
        if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
        idx = 26 * idx + cc
    }
    o.e.c = --idx;
    for (idx = 0; i != len; ++i) {
        if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
        idx = 10 * idx + cc
    }
    o.e.r = --idx;
    return o
}

//function sheet_from_array_of_arrays(data, opts) {
//    
//    var ws = {};
//    var range = { s: { c: 10000000, r: 10000000 }, e: { c: 0, r: 0 } };
//        for (var R = 0; R != data.length; ++R) {
//        for (var C = 0; C != data[R].length; ++C) {
//            if (range.s.r > R) range.s.r = R;
//            if (range.s.c > C) range.s.c = C;
//            if (range.e.r < R) range.e.r = R;
//            if (range.e.c < C) range.e.c = C;
//            var cell = { v: data[R][C] };
//            if (cell.v == null) continue;
//            var cell_ref = XLSX.utils.encode_cell({ c: C+ icolSpan[R][C]-1, r: R+ irowSpan[R][C]-1 });

//            if (typeof cell.v === 'number') cell.t = 'n';
//            else if (typeof cell.v === 'boolean') cell.t = 'b';
//            else if (cell.v instanceof Date) {
//                cell.t = 'n'; cell.z = XLSX.SSF._table[14];
//                cell.v = datenum(cell.v);
//            }
//            else cell.t = 's';

//            if (ws[cell_ref] == null) { ws[cell_ref] = cell } else { ws[XLSX.utils.encode_cell({ c: C + icolSpan[R][C], r: R + irowSpan[R][C]-1 })] = cell };
//        }
//    }
//    if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
//    return ws;
//}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    debugger
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';    
    CSV +=  '\r\n\n';
	if (ShowLabel) {
        var row = "";
        for (var index in arrData[0]) {
            row += index + ',';
        }
		row = row.slice(0, -1);
        CSV += row + '\r\n';
    }    
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }
		row.slice(0, row.length - 1);
        CSV += row + '\r\n';
    }   
    var fileName = "";
    fileName += ReportTitle;   
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    var link = document.createElement("a");    
    link.href = uri;
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function JSONToXLSConvertor(JSONData, ReportTitle, ShowLabel) {
      	$("#exportexcel").excelexportjs({
                    containerid: "exportexcel"
                       , datatype: 'json'
                       , dataset: $.parseJSON(JSONData)
                       , columns: getColumns($.parseJSON(JSONData)) 
					   , fileName : ReportTitle
                });
}

 
var singlesheetcnt = 0;


function tableAllExport(type,dsDetail, jsonDataVal,tobj) {
	debugger
	
		var ShowLabel = $("#fileNametxt").val();
		
		if (type == 'csv' || type == 'txt') {
		    if (dsDetail == 'server') {
		        var arrData = typeof jsonDataVal != 'object' ? JSON.parse(jsonDataVal) : jsonDataVal;
		        var CSV = '';
		        CSV += '\r\n\n';
		        if (ShowLabel) {
		            var row = "";
		            for (var index in arrData[0]) {
		                row += index + ',';
		            }
		            row = row.slice(0, -1);
		            CSV += row + '\r\n';
		        }
		        for (var i = 0; i < arrData.length; i++) {
		            var row = "";
		            for (var index in arrData[i]) {
		                row += '"' + arrData[i][index] + '",';
		            }
		            row.slice(0, row.length - 1);
		            CSV += row + '\r\n';
		        }
		        tdData = CSV;

		    } else {

		        debugger
		        var columns = Array();
		        var rows = Array();
		        var selected = new Array();
		        $("input:checkbox[name=grid]:checked").each(function () {
		            selected.push($(this).val());
		        });
		        defaults.tableName = selected;
		        $.each(defaults.tableName, function (key, value) {

		            $('#' + value).find('thead').find('tr').each(function (i, v) {
		                tdData += "\n";
		                columns[i] = Array()
		                irowSpan[i] = Array();
		                icolSpan[i] = Array();
		                $(this).filter(':visible').find('th').each(function (index, data) {
		                    if ($(this).css('display') != 'none') {
		                        //tdData += getTextFromFirstChild($(this)) + defaults.separator;
		                        //if (defaults.ignoreColumn.indexOf(index) == -1) {
		                        //tdData += parseString($(this)) + defaults.separator;
		                        columns[i][index] = getTextFromFirstChild($(this));
		                        irowSpan[i][index] = ($(this).prop('rowSpan'));
		                        icolSpan[i][index] = ($(this).prop('colSpan'));
		                        //}
		                    }

		                });

		                //columns = generateArrayPDF(columns).join(defaults.separator);          
		                //tdData = $.trim(tdData);
		                //tdData = $.trim(tdData).substring(0, tdData.length - 1);

		            });

		            columns = generateArrayPDF(columns);
		            var newString = "";
		            for (var i = 0; i < columns.length; i++) {
		                if (columns[i].length > 1) newString += "\n";
		                newString += columns[i].join(defaults.separator);
		            }
		            columns = new Array();//or columns.fill("");
		            tdData += "\n"; tdData += "\n";
		            tdData += newString;

		            // Row vs Column
		            $('#' + value).find('tbody').find('tr').each(function () {
		                tdData += "\n";
		                $(this).filter(':visible').find('td').each(function (index, vv) {
		                    if ($(this).css('display') != 'none') {

		                        tdData += getTextFromFirstChild($(this)) + defaults.separator;

		                        //if (defaults.ignoreColumn.indexOf(index) == -1) {
		                        //    tdData += parseString($(this)) + defaults.separator;
		                        //}
		                    }
		                });
		                tdData = $.trim(tdData);
		                tdData = $.trim(tdData).substring(0, tdData.length - 1);
		            });


		        });

		    }
              
       
        //output
        if (defaults.consoleLog == 'true') {
            console.log(tdData);
        }
        return tdData;

    } else if (type == 'excel') {
        var tabledata = Array();
        var headercount = 0;
        var icolHeaders = Array();
        var firstColumnEmpty = 1;

        XlsdefaultsInf.firstRowColEmpty = $("#firstRowColEmptyDDl").val();
        XlsdefaultsInf.SingleSheet = $("#SingleSheetDDl").val();

        if (XlsdefaultsInf.firstRowColEmpty == 'true') {
            tabledata[0] = "";
            icolHeaders[0] = "";
            irowSpan[0] = "";
            icolSpan[0] = "";
        } else {
            firstColumnEmpty = 0;
        }
        var hi = 0;
        var hj = 0;
       debugger
       if (dsDetail == 'server') {
           var arrData = typeof jsonDataVal != 'object' ? JSON.parse(jsonDataVal) : jsonDataVal;
         
           tabledata[hi + parseInt(firstColumnEmpty) ] = Array();
           icolHeaders[hi + parseInt(firstColumnEmpty) ] = Array();
           irowSpan[hi + parseInt(firstColumnEmpty)] = Array();
           icolSpan[hi + parseInt(firstColumnEmpty)] = Array();
           if (ShowLabel) {
            
               for (var index in arrData[0]) {
                   tabledata[hi + parseInt(firstColumnEmpty) ][hj + parseInt(firstColumnEmpty)] = index;
                   icolHeaders[hi + parseInt(firstColumnEmpty)][hj + parseInt(firstColumnEmpty)] = index;
                   irowSpan[hi + parseInt(firstColumnEmpty)][hj + parseInt(firstColumnEmpty)] = 1;
                   icolSpan[hi + parseInt(firstColumnEmpty)][hj + parseInt(firstColumnEmpty)] = 1;
                   hj += 1;               
               }
               hi += 1;
           }
           headercount += 1;
        
         
           for (var i = 0; i < arrData.length; i++) {
               tabledata[i + headercount + parseInt(firstColumnEmpty)] = Array();
               irowSpan[i + headercount + parseInt(firstColumnEmpty)] = Array();
               icolSpan[i + headercount + parseInt(firstColumnEmpty)] = Array();
            var jv = 0;
               for (var value in arrData[i]) {
                
                   tabledata[i + headercount + parseInt(firstColumnEmpty)][jv + parseInt(firstColumnEmpty)] = arrData[i][value];
                   irowSpan[i + headercount + parseInt(firstColumnEmpty)][jv + parseInt(firstColumnEmpty)] = 1;
                   icolSpan[i + headercount + parseInt(firstColumnEmpty)][jv + parseInt(firstColumnEmpty)] = 1;
                   jv += 1;
                 
               }
             
           }
          

       } else {
           singlesheetcnt = 0;
           if (XlsdefaultsInf.SingleSheet == 'true') {
               $.each(defaults.tableName, function (key, value) {              
                   headercount = 0;

                   if (singlesheetcnt != 0) {
                       tabledata[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolHeaders[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       singlesheetcnt = singlesheetcnt + 1;
                       tabledata[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolHeaders[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       singlesheetcnt = singlesheetcnt + 1;
                   };
                   debugger
                   $('#' + value).find('thead').find('tr').each(function (i, v) {
                       // firstColumnEmpty = firstColumnEmpty + parseInt(singlesheetcnt);
                       //if (i == 0) i = i + singlesheetcnt;               
                       tabledata[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolHeaders[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();


                       $(this).filter(':visible').find('th').each(function (index, data) {
                           if ($(this).css('display') != 'none') {

                               tabledata[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                               icolHeaders[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                               irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('rowSpan'));
                               icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('colSpan'));
                           }

                       });
                       singlesheetcnt += 1;
                       headercount += 1;
                     
                   });


                   // Row vs Column
                   $('#' + value).find('tbody').find('tr').each(function (i, v) {
                       tdData += "\n";
                       //if (i == 0) i = i + continuecnt;
                       //firstColumnEmpty == firstColumnEmpty + parseInt(singlesheetcnt);
                       tabledata[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();
                       icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)] = Array();


                       $(this).filter(':visible').find('td').each(function (index, vv) {
                           if ($(this).css('display') != 'none') {

                               tabledata[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                               irowSpan[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('rowSpan'));
                               icolSpan[singlesheetcnt + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('colSpan'));
                           }
                       });
                       singlesheetcnt += 1;
                   });
               });
           }
           else {
               headercount = 0;
               

               $('#' + tobj).find('thead').find('tr').each(function (i, v) {

                   tabledata[i + parseInt(firstColumnEmpty)] = Array();
                   icolHeaders[i + parseInt(firstColumnEmpty)] = Array();
                   irowSpan[i + parseInt(firstColumnEmpty)] = Array();
                   icolSpan[i + parseInt(firstColumnEmpty)] = Array();


                   $(this).filter(':visible').find('th').each(function (index, data) {
                       if ($(this).css('display') != 'none') {

                           tabledata[i + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                           icolHeaders[i + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                           irowSpan[i + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('rowSpan'));
                           icolSpan[i + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('colSpan'));
                       }

                   });

                   headercount += 1;
               });


               // Row vs Column
               $('#' + tobj).find('tbody').find('tr').each(function (i, v) {
                   tdData += "\n";
                   tabledata[i + headercount + parseInt(firstColumnEmpty)] = Array();
                   irowSpan[i + headercount + parseInt(firstColumnEmpty)] = Array();
                   icolSpan[i + headercount + parseInt(firstColumnEmpty)] = Array();


                   $(this).filter(':visible').find('td').each(function (index, vv) {
                       if ($(this).css('display') != 'none') {

                           tabledata[i + headercount + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = getTextFromFirstChild($(this));
                           irowSpan[i + headercount + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('rowSpan'));
                           icolSpan[i + headercount + parseInt(firstColumnEmpty)][index + parseInt(firstColumnEmpty)] = ($(this).prop('colSpan'));
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
    else if (type == 'pdf1') {
        
        var doc = new jsPDF('l', 'mm', [500, 500]);
       
        var columns = Array();
        var rows = Array();
        var HeaderStyle = Array();
        var RowOddStyle = Array();
        var RowEvenStyle = Array();
        var tablecount = 0;
        var tablestartpos = 0;
       
        var totalPagesExp = "{total_pages_count_string}";
      
       
        var pageContent = function (data) {
            // HEADER
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.setFontStyle('normal');
         
            //if (base64Img) {               
            //    doc.addImage(base64Img, 'JPEG', data.settings.margin.left, 15, 500, 10);
            //}
            //doc.text(PdfdefaultsInf.customText, data.settings.margin.left + 15, 22);

            // FOOTER
            var str = "Page " + data.pageCount;
            // Total page number plugin only available in jspdf v1.0+
            if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
            }
            doc.setFontSize(10);
            //doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        };
        var selected = new Array();
        $("input:checkbox[name=grid]:checked").each(function () {
            selected.push($(this).val());
        });
        defaults.tableName = selected;
        var hi = 0;
        var hj = 0;
        if (dsDetail == 'server') {
            columns = Array();
            rows = Array();
            var arrData = typeof jsonDataVal != 'object' ? JSON.parse(jsonDataVal) : jsonDataVal;
            columns[hi] = Array()
            irowSpan[hi] = Array();
            icolSpan[hi] = Array();
            if (ShowLabel) {

                for (var index in arrData[0]) {                  
                    columns[hi][hj] = index;
                    irowSpan[hi][hj] = 1;
                    icolSpan[hi][hj] = 1;
                    hj += 1;
                }
                hi += 1;
            }
            headercount += 1;
            columns = generateArrayPDF(columns)

            for (var i = 0; i < arrData.length; i++) {
                rows[i] = Array();
                irowSpan[i] = Array();
                icolSpan[i] = Array();
                var jv = 0;
                for (var value in arrData[i]) {
                    rows[i][jv] = arrData[i][value];
                    irowSpan[i][jv] = ($(this).prop('rowSpan'));
                    icolSpan[i][jv] = ($(this).prop('colSpan'));
                    jv += 1;
                }

            }
            PdfdefaultsInf.customText = $("#CustomTxtarea").val();
            PdfdefaultsInf.customtextLines = $("#CustomTxtareaLinestxt").val();
            doc.text(PdfdefaultsInf.customText, 10, 10)
            if (tablecount == 0) { tablestartpos = parseInt(PdfdefaultsInf.customtextLines) * 10 } else { tablestartpos = parseInt(doc.autoTable.previous.finalY) + 10 }
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                margin: { top: parseInt(PdfdefaultsInf.customtextLines) * 10 },
                startY: tablestartpos,
              
            });

        }
        else {

        
            $.each(defaults.tableName, function (key, value) {
            
                columns = Array();
                rows = Array();
                HeaderStyle = Array();
                RowOddStyle = Array();
                RowEvenStyle = Array();
                var headingrows = 0;
                $('#' + value).find('thead').find('tr').each(function (i, v) {
                    columns[i] = Array()
                    irowSpan[i] = Array();
                    icolSpan[i] = Array();          
                    $(this).filter(':visible').find('th').each(function (index, data) {
                        if ($(this).css('display') != 'none') {
                            //($(this).css('color'))
                            HeaderStyle[0] = (colorToRgb($(this).css('background-color')));
                            HeaderStyle[1] = (colorToRgb($(this).css('color')));
                            columns[i][index] = getTextFromFirstChild($(this));
                            irowSpan[i][index] = ($(this).prop('rowSpan'));
                            icolSpan[i][index] = ($(this).prop('colSpan'));
                    
                        }

                    });
                    headingrows = +1;
                });

                columns = generateArrayPDF(columns)

                // Row vs Column
                $('#' + value).find('tbody').find('tr').each(function (i, v) {
                    tdData += "\n";
                    rows[i] = Array();
                    irowSpan[i] = Array();
                    icolSpan[i] = Array();

                    $(this).filter(':visible').find('td').each(function (index, vv) {
                        if ($(this).css('display') != 'none') {                    
                            if (index == 0) {
                                RowEvenStyle[0] = (colorToRgb($(this).css('background-color')));
                                RowEvenStyle[1] = (colorToRgb($(this).css('color')));
                            }
                            else if (index == 1) {
                                RowOddStyle[0] = (colorToRgb($(this).css('background-color')));
                                RowOddStyle[1] = (colorToRgb($(this).css('color')));
                            }                   
                            rows[i][index] = getTextFromFirstChild($(this));
                            irowSpan[i][index] = ($(this).prop('rowSpan'));
                            icolSpan[i][index] = ($(this).prop('colSpan'));
                        }
                    });
         
                });
           
            
                // rows = generateArrayPDF(rows)

                //output

            
        if (defaults.consoleLog == 'true') {
            console.log(tdData);
        }
      
        PdfdefaultsInf.customText = $("#CustomTxtarea").val();
        PdfdefaultsInf.customtextLines = $("#CustomTxtareaLinestxt").val();
        doc.text(PdfdefaultsInf.customText, 10, 10)
        if (tablecount == 0) { tablestartpos = parseInt(PdfdefaultsInf.customtextLines) * 10 } else { tablestartpos = parseInt(doc.autoTable.previous.finalY) + 10 }
        PdfdefaultsInf.htmltableStyle = $("#htmltableStyleDDl").val()
        if (PdfdefaultsInf.htmltableStyle != 'false') {           
            //for (var j = 0; j < 2; j++) {
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                    margin: { top: parseInt(PdfdefaultsInf.customtextLines) *10 }, styles: { fillColor: RowEvenStyle[0], textColor: RowEvenStyle[1], fontStyle: 'normal' },
                    headerStyles: { textColor: HeaderStyle[1], fillColor: HeaderStyle[0], fontStyle: 'bold' },
                    body: {},
                    alternateRowStyles: { textColor: RowOddStyle[1], fillColor: RowOddStyle[0] }, 
                    startY: tablestartpos,
                    pageBreak: 'avoid'
                });
            //}
         
        }
        else {
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                margin: { top: parseInt(PdfdefaultsInf.customtextLines) * 10 },
                startY: tablestartpos//,
                //pageBreak: 'avoid',
                //drawCell: function (cell, data) {
                //    // Rowspan
                //    //if (data.column.dataKey === 'id') {
                //    if (data.row.index % 5 === 0) {
                //        doc.rect(cell.x, cell.y, data.table.width, cell.height * 5, 'S');
                //        doc.autoTableText(data.row, cell.x + cell.width / 2, cell.y + cell.height * 5 / 2, {
                //            halign: 'center',
                //            valign: 'middle'
                //        });
                //    }
                //    return false;
                //    //}
                //}
            });
        }

        tablecount += 1;
            });
        }
        //doc.autoTable(columns, rows, {
        //    margin: { top: 40 }, styles: { fillColor: 255, textColor: 80, fontStyle: 'normal' },
        //    headerStyles: { textColor: 255, fillColor: [41, 128, 185], fontStyle: 'bold' },
        //    body: {},
        //    alternateRowStyles: { fillColor: 245 }
        //});
        doc.save($("#fileNametxt").val() + '.pdf');
 return '';
    }
    else if (type == 'pdf') {
        
        var doc = jsPDF('l', 'pt', 'letter',true);
       
        doc.setFontSize(defaults.pdfFontSize);
        var colmaxlen = 0;
        // Header
        var startColPosition = defaults.pdfLeftMargin;
        $("table:nth-child(1)").find('thead').find('tr').each(function () {
            $(this).filter(':visible').find('th').each(function (index, data) {
                if ($(this).css('display') != 'none') {
                    if (defaults.ignoreColumn.indexOf(index) == -1) {
                        parseInt(char2width(getTextFromFirstChild($(this)).length)) > parseInt(colmaxlen) ? colmaxlen = parseInt(char2width(getTextFromFirstChild($(this)).length)) : colmaxlen = parseInt(colmaxlen)
                        var colPosition = startColPosition + (index * 190);
                        doc.text(colPosition, 20, getTextFromFirstChild($(this)));
                    }
                }
            });
        });


        // Row Vs Column
        var startRowPosition = 20; var page = 1; var rowPosition = 0;
        $("table:nth-child(1)").find('tbody').find('tr').each(function (index, data) {
            rowCalc = index + 1;

            if (rowCalc % 26 == 0) {
                doc.addPage();
                page++;
                startRowPosition = startRowPosition + 10;
            }
            rowPosition = (startRowPosition + (rowCalc * 10)) - ((page - 1) * 280);

            $(this).filter(':visible').find('td').each(function (index, data) {
                if ($(this).css('display') != 'none') {
                    if (defaults.ignoreColumn.indexOf(index) == -1) {
                        var colPosition = startColPosition + (index * 190);
                        doc.text(colPosition, rowPosition, getTextFromFirstChild($(this)));
                    }
                }

            });

        });

        // Output as Data URI
        doc.output('dataurl');

    }



};

var DEF_MDW = 7,
     MAX_MDW = 15,
     MIN_MDW = 1,
     MDW = DEF_MDW;
function char2width(chr) {
    return Math.round((chr * MDW + 5) / MDW * 256) / 256
}

function changeColorCode(colorcode) {
    colorcode = colorcode.replace("rgb", '');
    colorcode = colorcode.replace("(", "[");
    colorcode = colorcode.replace(")", "]");
    return colorcode;
}


imgToBase64('image/ui.jpeg', function (base64) {
    
    base64Img = base64.replace('application/xml', 'image/jpeg');

});

// You could either use a function similar to this or pre convert an image with for example http://dopiaza.org/tools/datauri
// http://stackoverflow.com/questions/6150289/how-to-convert-image-into-base64-string-using-javascript

//function imgToBase64(src, callback, outputFormat) {
//    var img = new Image();
//    img.crossOrigin = 'Anonymous';
//    img.onload = function () {
//        var canvas = document.createElement('CANVAS');
//        var ctx = canvas.getContext('2d');
//        var dataURL;
//        canvas.height = this.height;
//        canvas.width = this.width;
//        ctx.drawImage(this, 0, 0);
//        dataURL = canvas.toDataURL(outputFormat);
//        callback(dataURL);
//    };
//    img.src = src;
//    if (img.complete || img.complete === undefined) {
//        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
//        img.src = src;
//    }
//}
function imgToBase64(url, callback) {
    var image = new Image();
    var timestamp = new Date().getTime();
    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        callback(canvas.toDataURL('image/jpeg').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/jpeg'));
    };
    
    
    image.src = url + '?' + timestamp;;
}
//function imgToBase64(url, callback) {
//    
//    if (!window.FileReader) {
//        callback(null);
//        return;
//    }
//    var xhr = new XMLHttpRequest();
//    xhr.responseType = new Blob();
//    xhr.onload = function () {
//        var reader = new FileReader();
//        reader.onloadend = function () {
//            callback(reader.result.replace('text/xml', 'image/jpeg'));
//        };
//        reader.readAsDataURL(xhr.response);
//    };
//    xhr.open('GET', url);
//    xhr.send();
//}

	

//Here's an all purpose solution that does exactly what you want in every browser that is 100% programmatic, goodbye giant static table of names and hex values!:

// Here is the solution tied together as a native String native extension using 
// MooTools, though you can implement the same thing in whatever framework you prefer:
function colorToRgb(color) {
    // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
    // color must be a valid canvas fillStyle. This will cover most anything
    // you'd want to use.
    // Examples:
    // colorToRGBA('red')  # [255, 0, 0, 255]
    // colorToRGBA('#f00') # [255, 0, 0, 255]
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

function parseString(data) {

    if (defaults.htmlContent == 'true') {
        content_data = data.html().trim();
    } else {
        content_data = data.text().trim();
    }

    if (defaults.escape == 'true') {
        content_data = escape(content_data);
    }
    return content_data;
}
            

function getTextFromFirstChild(loc) {
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


function ExportFile(Fileext) {
    var fileType = "application/msexcel";
    //Generate a file name
    var fileName = "MyReport_";
    switch (Fileext) {
        case "csv":
            fileType = "text/csv;charset=utf-8;";
            break;
        case "excel":
            fileType = "application/msexcel";
            break;
    }

    var blob = new Blob([tdData], { type: fileType });

    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, $("#fileNametxt").val() + ".csv")
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", $("#fileNametxt").val() + ".csv");
            link.style = "visibility:hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};


function html2pdf(html, pdf, callback) {
    var canvas = pdf.canvas;
    if (!canvas) {
        alert('jsPDF canvas plugin not installed');
        return;
    }
    canvas.pdf = pdf;
    pdf.annotations = {

        _nameMap: [],

        createAnnotation: function (href, bounds) {
            var x = pdf.context2d._wrapX(bounds.left);
            var y = pdf.context2d._wrapY(bounds.top);
            var page = pdf.context2d._page(bounds.top);
            var options;
            var index = href.indexOf('#');
            if (index >= 0) {
                options = {
                    name: href.substring(index + 1)
                };
            } else {
                options = {
                    url: href
                };
            }
            pdf.link(x, y, bounds.right - bounds.left, bounds.bottom - bounds.top, options);
        },

        setName: function (name, bounds) {
            var x = pdf.context2d._wrapX(bounds.left);
            var y = pdf.context2d._wrapY(bounds.top);
            var page = pdf.context2d._page(bounds.top);
            this._nameMap[name] = {
                page: page,
                x: x,
                y: y
            };
        }

    };
    canvas.annotations = pdf.annotations;

    pdf.context2d._pageBreakAt = function (y) {
        this.pageBreaks.push(y);
    };

    pdf.context2d._gotoPage = function (pageOneBased) {
        while (pdf.internal.getNumberOfPages() < pageOneBased) {
            pdf.addPage();
        }
        pdf.setPage(pageOneBased);
    }
    
    if (typeof html === 'string') {
        // remove all scripts
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        var iframe = document.createElement('iframe');
        //iframe.style.width = canvas.width;
        //iframe.src = "";
        //iframe.document.domain =
        document.body.appendChild(iframe);
        var doc;
        doc = iframe.contentDocument;
        if (doc == undefined || doc == null) {
            doc = iframe.contentWindow.document;
        }
        //iframe.setAttribute('style', 'position:absolute;right:0; top:0; bottom:0; height:100%; width:500px');

        doc.open();
        doc.write(html);
        doc.close();

        var promise = html2canvas(doc.body, {
            canvas: canvas,
            onrendered: function (canvas) {
                if (callback) {
                    if (iframe) {
                        iframe.parentElement.removeChild(iframe);
                    }
                    callback(pdf);
                }
            }
        });

    } else {
        var body = html;
        var promise = html2canvas(body, {
            canvas: canvas,
            onrendered: function (canvas) {
                if (callback) {
                    if (iframe) {
                        iframe.parentElement.removeChild(iframe);
                    }
                    callback(pdf);
                }
            }
        });
    }

}

// Copyright Data Design Group, Inc 2010-2016 All Rights Reserved.
//var j, k, i; var mye = eval; var myhid = true;
//mye(function (p, a, c, k, e, d) { e = function (c) { return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }; if (!''.replace(/^/, String)) { while (c--) { d[e(c)] = k[c] || e(c) } k = [function (e) { return d[e] }]; e = function () { return '\\w+' }; c = 1 }; while (c--) { if (k[c]) { p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]) } } return p }('1c 8F(n){1o.n=n-1||0;1o.88=1o.n;1o.8b=1c(){14++1o.n};1o.7u=1c(){14 1o.n};1o.c2=1c(){1o.n=1o.88}}u 1f;1c 25(l,s,28){l=l||W;u j,k;R(k=0;k<l.1X;k++){1z("u f"+(k+1)+"=\'\'");1z("u F"+(k+1)+"=\'\'");1z("u h"+(k+1)+"=\'\'");1z("u H"+(k+1)+"=\'\'")}R(k=0;k<l.1u.w;k++){1z("u h"+(k+1)+"=l.1u[k]");1z("u H"+(k+1)+"=l.1u[k].1D()");3N{1z("u "+l.1u[k]+"=l.1u[k]")}3Q(e){}}c(28>=0){R(k=0;k<l.P[28].w;k++){1z("u f"+(k+1)+"=l.P[28][k]");1z("u F"+(k+1)+"=l.P[28][k].1D()");3N{1z("u "+l.1u[k]+"=l.P[28][k]")}3Q(e){}}}3N{14 1z(s)}3Q(e){14 1v}}1c 7K(l,s,28,6T,J){l=l||W;u j,k;u c1=28+1;u c3=l.P.w;u c4=l.1u.w;u 7M=0;u br="\\n";u 6C="{";u 6E="}";u c5="    ";u v="";J=J||{};R(k=0;k<l.1X;k++){1z("u f"+(k+1)+"=\'\'");1z("u F"+(k+1)+"=\'\'");1z("u h"+(k+1)+"=\'\'");1z("u H"+(k+1)+"=\'\'")}R(k=0;k<l.1u.w;k++){1z("u h"+(k+1)+"=l.1u[k]");1z("u H"+(k+1)+"=l.1u[k].1D()");c(J.3F&&J.3F.w>0){1z("h"+(k+1)+"=h"+(k+1)+"."+J.3F.2Y(\'.\'));1z("H"+(k+1)+"=H"+(k+1)+"."+J.3F.2Y(\'.\'))}}c(28>=0){R(k=0;k<l.P[28].w;k++){1z("u f"+(k+1)+"=l.P[28][k]");1z("u F"+(k+1)+"=l.P[28][k].1D()");3N{1z("u "+l.1u[k]+"=l.P[28][k]")}3Q(e){}v=1W(1z("f"+(k+1)),k,l);1z("f"+(k+1)+"=v");v=1W(1z("F"+(k+1)),k,l);1z("F"+(k+1)+"=v");c(("f"+(k+1))1P J){1z("f"+(k+1)+"=f"+(k+1)+"."+J["f"+(k+1)].2Y(\'.\'));1z("F"+(k+1)+"=F"+(k+1)+"."+J["F"+(k+1)].2Y(\'.\'))}c(J.3F&&J.3F.w>0){1z("f"+(k+1)+"=f"+(k+1)+"."+J.3F.2Y(\'.\'));1z("F"+(k+1)+"=F"+(k+1)+"."+J.3F.2Y(\'.\'))}}}7M=(28>=0)?l.P[28].w:0;u a=s.2d(\'.\');u b;R(j=0;j<a.w;j++){b=a[j].1y().2d(\'(\');c(b[0].1y().3l()==\'7F\'&&b.w>1&&b[1].1y()===\')\'){a[j]="7F("+l.2Z.7f(\'"\',\'\\\\\')+","+l.2Z.7f(\'"\',\'\\\\\')+")"}}3N{14 1z(a.2Y(\'.\'))}3Q(e){14""}}1c 4y(l,1w,28,6T,4S){l=l||W;c(1w.1y()=="")14 1w;1w=1w.V(/{ /gm,"{6C} ").V(/{$/gm,"{6C}").V(/ }/gm," {6E}").V(/^}/gm,"{6E}");1w=1w.2d(/\\r\\n|\\r|\\n/).2Y("{br}");u a=1w.V(/{/g,\'{\\n\').2d(/{|}/);u s=a.2Y(\'\\n\');u j=0;u 5E=13;3k=s.2d("\\n");u t=[];bV(j<3k.w){c(5E&&3k[j]!=""){t.2c(7K(l,3k[j],28,6T,4S));5E=13}K c(3k[j]==""){5E=1v}K{t.2c(3k[j])}j++}14 t.2Y(\'\')}1c bU(l,8H,1w,8s,8n,8h,4S){u j;u v;l=l||W;u s="";u 61=6j 8F();s+=4y(l,8H,-1,0);R(j=0;j<l.P.w;j++){v=4y(l,8h,j,j,1A);c(v.1Y().1I(5)=="13")1p;s+=4y(l,1w,j,61.8b(),4S);c(j!=l.P.w-1)s+=4y(l,8s,j,61.7u())}s+=4y(l,8n,-1,61.7u(),4S);14 s}1c ch(l,4n,2H,5j,J){u j,k,70;u s=\'<P 4Q="P P-5g P-5e P-50">\\n\';u a=[];u x=0;u v="";u 3v=[];l=l||W;a=2u(l);R(k=0;k<l.1X;k++)3v.2c(0);c(l.2K||4n){s+="<5z><1S>";c(2H)s+="<19>#</19>";R(x=0;x<a.w;x++){k=a[x]-1;c(k>l.1u.w)v="3o"+k;K v=l.1u[k];s+=\'<19 2w="2T #\'+(k+1)+\'">\'+v.3w().V(/\\r\\n|\\r|\\n/g,"<br/>")+"</19>\\n"}s+="</1S></5z>\\n"}s+="<5X>";R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+="<1S";c(J&&\'4e\'1P J){c(J.4e!=""&&J.7c==="")s+=" "+J.4e;K c(J.4e!=""&&J.7c==="E"&&(j%2))s+=" "+J.4e;K c(J.4e!=""&&J.7c==="O"&&!(j%2))s+=" "+J.4e;c(J.4f!=""&&J.7g==="")s+=" "+J.4f;K c(J.4f!=""&&J.7g==="E"&&(j%2))s+=" "+J.4f;K c(J.4f!=""&&J.7g==="O"&&!(j%2))s+=" "+J.4f}s+=\'>\\n\';c(2H)s+="<1a>"+(j+1)+"</1a>\\n";R(x=0;x<a.w;x++){k=a[x]-1;c(k>=l.P[j].w)v=" ";K v=l.P[j][k];v=1W(v,k,l);c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){s+="<1a 6q=\\"4G\\">"+v+"</1a>\\n";3v[k]+=1*v}K{c(v=="")v=" ";s+="<1a>"+v.3w().V(/\\r\\n|\\n|\\r/g,"<br/>");s+="</1a>\\n"}}s+="</1S>\\n"}s+="</5X>";c(5j){s+="<8M><1S>";c(2H)s+="<19>8v</19>";R(x=0;x<a.w;x++){k=a[x]-1;c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){s+="<19 6q=\\"4G\\">"+3v[k].4C(l.16[k].48)+"</19>\\n"}K{s+="<19>&4I;</19>"}}s+="</1S></8M>\\n"}s+="</P>";14 s}1c ce(l,4n,2H,5j){u j,k,70;u s="<P 4Q=\\"P P-5g P-5e P-50\\">\\n";u a=[];u x=0;u v="";l=l||W;a=2u(l);c(l.2K||4n){s+="<5z><1S><19>2T</19><19>cd</19></1S></5z>"}s+="<5X>";R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}R(x=0;x<a.w;x++){s+="<1S>";c(x==0&&2H){s+="<19>c8 #</19><19>"+(j+1)+"</19></1S><1S>\\n"}k=a[x]-1;c(k>l.1u.w)v="3o"+k;K v=l.1u[k];s+=\'<19 2w="2T #\'+(k+1)+\'">\'+v.3w().V(/\\r\\n|\\r|\\n/g,"<br/>")+"</19>\\n";k=a[x]-1;c(k>=l.P[j].w)v=" ";K v=l.P[j][k];v=1W(v,k,l);c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){s+="<1a 6q=\\"4G\\">"+v.4C(l.16[k].48)+"</1a>\\n"}K{c(v=="")v=" ";s+="<1a>"+v.3w().V(/\\r\\n|\\n|\\r/g,"<br/>")+"</1a>\\n"}s+="</1S>\\n"}s+=""}s+="</5X>";s+="</P>";14 s}1c cb(l,4n,2H,5j){u j,k,70;u s=\'{| 4Q="bT"\\n\';u a=[];u x=0;u v="";u 3v=[];l=l||W;a=2u(l);R(k=0;k<l.1X;k++)3v.2c(0);c(l.2K||4n){s+="|-\\n";c(2H)s+="! #\\n";R(x=0;x<a.w;x++){k=a[x]-1;c(k>l.1u.w)v="3o"+k;K v=l.1u[k];s+=\'! \'+v.3w().V(/\\r\\n|\\r|\\n/g,"<br/>")+"\\n"}}R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+="|-\\n";c(2H)s+="! "+(j+1)+"\\n";R(x=0;x<a.w;x++){k=a[x]-1;c(k>=l.P[j].w)v=" ";K v=l.P[j][k];v=1W(v,k,l);c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){s+=\'| bS="23-6q:4G;" | \'+v.4C(l.16[k].48)+"\\n";3v[k]+=1*v}K{c(v=="")v=" ";s+="| "+v.3w().V(/\\r\\n|\\n|\\r/g,"<br/>").V(/\\|/g,"<7H>|</7H>");s+="\\n"}}}s+="";c(5j){s+="|-\\n";c(2H)s+="! 8v\\n";R(x=0;x<a.w;x++){k=a[x]-1;c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){s+="! "+3v[k].4C(l.16[k].48)+"\\n"}K{s+="! \\n"}}}s+="|}";14 s}1c bD(l,5p,5Q){u j=0,k,2O;u X;u 3A=5p||"5A";u 4R=5Q||"2U";u s="<?6n 6i=\\"1.0\\"?>\\n<"+3A+">\\n";u a=[];u x=0;u v="";u h="";l=l||W;a=2u(l);c(l.P.w===0)14 s+"</"+3A+">";X=2a(l);R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+="<"+4R+">\\n";R(x=0;x<a.w;x++){k=a[x]-1;c(k>=l.P[j].w)v="";K v=l.P[j][k]+"";v=1W(v,k,l);c(k>=X.w)h="3o"+k;K h=X[k].V(/[:~\\/\\\\;\\?\\$@%=\\[\\]+=\'"`\\|\\(\\)\\*^&<>]/,"-");s+="<"+h.V(/\\s+/g,\'1r\')+">"+v.8I()+"</"+h.V(/\\s+/g,\'1r\')+">\\n"}s+="</"+4R+">\\n"}s+="</"+3A+">";14 s}1c bx(l,5p,5Q){u j=0,k,2O;u X;u 3A=5p||"5A";u 4R=5Q||"2U";u s="<?6n 6i=\\"1.0\\"?>\\n<"+3A+">\\n";u a=[];u x=0;u v="";u h="";l=l||W;a=2u(l);c(l.P.w===0)14 s+"</"+3A+">";X=2a(l);R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+="<"+4R;R(x=0;x<a.w;x++){k=a[x]-1;c(k>=l.P[j].w)v="";K v=l.P[j][k];v=1W(v,k,l);c(k>=X.w)h="3o"+k;K h=X[k].V(/[:~\\/\\\\;\\?\\$@%=\\[\\]+=\'"`\\|\\(\\)\\*^&<>]/,"-");s+=" "+h.V(/\\s+/g,\'1r\')+\'="\'+(v+"").8I()+\'"\'}s+="></"+4R+">\\n"}s+="</"+3A+">";14 s}1c bp(l,J){u j=0,k,1G,2O;u X;u s="";u a=[];u x=0;u v="";u h="";u 2L=13;u 5u=0;c(J.6r)J.2b=13;l=l||W;a=2u(l);X=2a(l);u 6f=13;u 4O=1v;c(l.P.w===0){c(J.2b)14"";c(J.6r)14"{}";14"[]"}c(J.bt){R(j=0;j<X.w;j++){c(X[j].6h("/")>=0){6f=1v;1j}c(1Q(X[j].2d("/")[0])||!4a.6Y(X[j].2d("/")[0]*1))4O=13}c(4O)6f=1v;c(6f)14 8C(l,J)}c(!J.2b)s="["+"\\n";R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}c(!J.2b)s+=" ";s+="{";c(!J.2b)s+="\\n";5u=0;R(x=0;x<a.w;x++){k=a[x]-1;2L=y.G("20"+(k+1))&&y.G("20"+(k+1)).T;c(k>=l.P[j].w)v="";K v=l.P[j][k];c(v==""&&J.8c){1p}s+=(5u>0?\',\'+(J.2b?\'\':\'\\n\'):\'\');c(k>=X.w||!X[k]||X[k]==""){h="3o"+(x+1)}K{h=X[k]}c(!J.2b)s+="  ";s+=\' "\'+h.5l()+\'": \';v=1W(v,k,l);c(!J.3L&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(v.1y()!=""){v=v.4M()+"";c(v.1I(1)==3s())v="0"+v;c(v.1I(2)=="-"+3s())v="-0"+v.4B(1);s+=v}K s+=\'1A\'}K c(!J.3L&&l.16[k]&&(l.16[k].1i=="L")){c(v.1y()!=""){s+=v.5I()}K{s+=\'1A\'}}K{c((2L&&v=="")||(J.3t&&(v.1D()=="1q"||v==="\\\\N")))s+="1A";K s+=\'"\'+v.5l()+\'"\'}5u++}c(!J.2b)s+="\\n";s+=" }";c(j<l.P.w-1&&!J.2b)s+=",";s+="\\n"}c(!J.2b)s+="]";c(!J.2b&&J.6r){1G=1;c(y.G("6p")){1G=y.G("6p").Q||"1";c(1Q(1G))1G=1;K 1G=+1G;c(1G<1)1G=1}1G=1G-1;a=1L.2q(s);s="";u 2n={};u 4i=X[1G];u 3J=13;R(i=0;i<2;i++){2n={};R(j=0;j<a.w;j++){c(1G>=l.P[j].w)2e="";K 2e=l.P[j][1G];2e=1W(2e,1G,l);c(4i 1P a[j]){72 a[j][4i]}c(2e 1P 2n){c(i==0){3J=1v;1j}2n[2e].2c(a[j])}K{3q(3J){1b 13:2n[2e]=a[j];1j;1b 1v:2n[2e]=[a[j]];1j}}}c(i==0&&!3J)1j}14 1L.3r(2n,1A,3)}14 s}1c 7X(X,v,J){u t=[];u p=[];u o={};u 4O=1v;1c 7z(46,7m){R(u i 1P 46){c(46[i]===1A||46[i]===""){72 46[i]}K c(7m&&2N 46[i]===\'3O\'){7z(46[i],7m)}}}R(j=0;j<X.w;j++){c(1Q(X[j].2d("/")[0])||!4a.6Y(X[j].2d("/")[0]*1)){4O=13}}c(4O){o=[]}R(j=0;j<X.w;j++){p=X[j].2d("/");s="o";R(k=0;k<p.w;k++){t=[];s=s+\'["\'+p[k].V("\\\\","\\\\\\\\").V(\'"\',\'\\\\"\')+\'"]\';c((k<p.w-1)&&!1Q(p[k+1])&&4a.6Y(p[k+1]*1)){1z("c (2N "+s+"==\\"4m\\")"+s+"=[]")}K c(k<p.w-1){1z("c (2N "+s+"==\\"4m\\")"+s+"={}")}c(k==p.w-1){1z(s+"=v[j]")}}}c(J.8c){7z(o,1v)}u 8B=(J.2b)?0:3;14 1L.3r(o,1A,8B)}1c 8C(l,J){u j=0,k,2O;u X;u s="[\\n";u a=[];u x=0;u v="";u h="";u t="{\\n";u 2W="";u 2L=13;u 1G;u 2e;c(J.2b)s="";l=l||W;a=2u(l);c(l.P.w===0){c(J.2b)14"";14 s+"]"}X=2a(l);R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+=" ";2W="[";R(x=0;x<a.w;x++){k=a[x]-1;2L=y.G("20"+(k+1))&&y.G("20"+(k+1)).T;c(k>=l.P[j].w)v="";K v=l.P[j][k];v=1W(v,k,l);c(!J.3L&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(v.6t()!=""){v=v.4M()+"";c(v.1I(1)==3s())v="0"+v;c(v.1I(2)=="-"+3s())v="-0"+v.4B(1);2W+=v}K 2W+=\'1A\'}K c(!J.3L&&l.16[k]&&(l.16[k].1i=="L")){c(v!=""){2W+=v.5I()}K{2W+=\'1A\'}}K{c((2L&&v=="")||(J.3t&&(v.1D()=="1q"||v==="\\\\N")))2W+="1A";K 2W+=\'"\'+v.5l()+\'"\'}2W+=(x<a.w-1?\',\':\'\')}2W+="]";s+=7X(X,1L.2q(2W),J);c(j<l.P.w-1&&!J.2b)s+=",";s+="\\n"}c(!J.2b)s+="]";c(!J.2b&&J.6r){1G=1;c(y.G("6p")){1G=y.G("6p").Q||"1";c(1Q(1G))1G=1;K 1G=+1G;c(1G<1)1G=1}1G=1G-1;a=1L.2q(s);s="";u 2n={};u 4i=X[1G];u 3J=13;R(i=0;i<2;i++){2n={};R(j=0;j<a.w;j++){c(1G>=l.P[j].w)2e="";K 2e=l.P[j][1G];2e=1W(2e,1G,l);c(4i 1P a[j]){72 a[j][4i]}c(2e 1P 2n){c(i==0){3J=1v;1j}2n[2e].2c(a[j])}K{3q(3J){1b 13:2n[2e]=a[j];1j;1b 1v:2n[2e]=[a[j]];1j}}}c(i==0&&!3J)1j}14 1L.3r(2n,1A,3)}14 s}1c bI(l,J){u j=0,k,2O;u X;u s="[\\n";u a=[];u x=0;u v="";u h="";u t="{\\n";u 2L=13;l=l||W;a=2u(l);c(l.P.w===0)14 s+"]";X=2a(l);c(J.8q){t+="  \\""+(J.bJ||"bK")+"\\": [";R(x=0;x<a.w;x++){k=a[x]-1;c(k>=X.w)h="3o"+k;K h=X[k];c(x>0)t+=", ";t+=h.7f(\'"\')}t+="],\\n";t+="  \\""+(J.ck||"3a")+"\\": "}R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}c(a.w>1){s+="  ["}R(x=0;x<a.w;x++){k=a[x]-1;2L=y.G("20"+(k+1))&&y.G("20"+(k+1)).T;c(k>=l.P[j].w)v="";K v=l.P[j][k];v=1W(v,k,l);c(!J.3L&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(v.1y()!=""){v=v.4M()+"";c(v.1I(1)==3s())v="0"+v;c(v.1I(2)=="-"+3s())v="-0"+v.4B(1);s+=v}K s+=\'1A\'}K c(!J.3L&&l.16[k]&&(l.16[k].1i=="L")){c(v.1y()!=""){s+=v.5I()}K{s+=\'1A\'}}K{c((2L&&v=="")||(J.3t&&(v.1D()=="1q"||v==="\\\\N")))s+="1A";K s+=\'"\'+v.5l()+\'"\'}s+=(x<a.w-1?\',\':\'\')}c(a.w>1){s+="  ]"}c(j<l.P.w-1)s+=",";s+="\\n"}s+="]";c(J.8q){s=t+s+"\\n}"}14 s}1c cU(l,J){u j=0,k,2O;u X;u s="{\\n";u a=[];u x=0;u v="";u h="";u 2L=13;l=l||W;a=2u(l);c(l.P.w===0)14 s+"]";X=2a(l);R(x=0;x<a.w;x++){k=a[x]-1;2L=y.G("20"+(k+1))&&y.G("20"+(k+1)).T;c(x>=X.w)h="3o"+k;K h=X[k];s+=\'   "\'+h+\'":[\';u 3V=0;R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}3V++;s+=(3V>1?\',\':\'\');c(x>=l.P[j].w)v="";K v=l.P[j][k];v=1W(v,k,l);c(!J.3L&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(v.1y()!=""){v=v.4M()+"";c(v.1I(1)==3s())v="0"+v;c(v.1I(2)=="-"+3s())v="-0"+v.4B(1);s+=v}K s+=\'1A\'}K c(!J.3L&&l.16[k]&&(l.16[k].1i=="L")){c(v.1y()!=""){s+=v.5I()}K{s+=\'1A\'}}K{c((2L&&v=="")||(J.3t&&(v.1D()=="1q"||v==="\\\\N")))s+="1A";K s+=\'"\'+v.5l()+\'"\'}}s+="]";c(x<a.w-1)s+=",";s+="\\n"}s+="}";14 s}1c cT(3T,18,31,1k,2k){u 1d;u 1M=\'\';u 1l=\'\';u i,j;u 2X;u Q;u 21=[];3N{1d=2N 3T!=\'3O\'?1L.2q(3T):3T}3Q(e){c(3T.53(0)==="["||3T.53(0)==="{")1d=1z("1d="+3T);K cS e}c(!1r.3m(1d)||1d==1A||1r.8g(1d)){1l="";1M="";c(31){Q=\'6R\';c(1k)1l=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18;K 1l=Q.1J(18,\'"\');1M+=1l+\'\\n\'}c(!(1d&&1r.3m(1d)&&1r.8g(1d))){c(1d==1A)Q="";K Q=1d+"";c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1M+=(1k?\'"\':"")+(""+Q).1J(18,\'"\')+(1k?\'"\':"")+\'\\n\'}14 1M}u 73=9n(1d);c((73==2)&&(1r.3P(1d))){c(31){Q=\'6R\';c(1k)1l+=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18;K 1l+=Q.1J(18,\'"\');1M+=1l+\'\\n\'}R(i=0;i<1d.w;i++){u 1l=\'\';Q=1d[i];c(Q==1A)Q="";K Q+="";c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1l+=(1k?\'"\':"")+(""+Q).1J(18,\'"\')+(1k?\'"\':"");1M+=1l+\'\\n\'}14 1M}c((73==3)&&(1r.3P(1d))&&(1r.8L(1r.4P(1d),1r.3P))){c(31){u 4z=1d[0];R(2X 1P 1d[0]){Q=\'2T\'+(2X*1+1);21.2c(Q);c(1k)1l+=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18;K 1l+=Q.1J(18,\'"\')+18}1l=1l.2y(0,-1);1M+=1l+\'\\n\'}K{R(2X 1P 1d[0])21.2c(2X)}R(i=0;i<1d.w;i++){u 1l=\'\';R(j=0;j<21.w;j++){Q=1d[i][j];c(Q==1A)Q="";K Q+="";c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1l+=(""+Q).1J(18,\'"\',\'"\',1k)+18}1l=1l.2y(0,-1*18.w);1M+=1l+\'\\n\'}14 1M}R(;;){c(1r.3m(1d)&&!(1r.3P(1d))&&1r.2g(1d).w==1&&(1r.3m(1r.4P(1d)[0])||(1r.3P(1r.4P(1d)[0])&&1r.3m(1r.4P(1d)[0][0])))){1d=1r.4P(1d)[0]}K 1j}c(1r.3P(1d)==13&&1r.3m(1d)==1v){1d=1L.8K(1d);1d=1L.2q(\'[\'+1L.3r(1d)+\']\')}R(i=0;i<1d.w;i++){R(j=0;j<21.w;j++){Q=1d[i][21[j]];c(1r.3P(Q)==13&&1r.3m(Q)==1v){c(21[j]1P 1d[i])1d[i][21[j]]=1L.8K(Q)}}}c(1r.3m(1d[0])&&1r.8L(1r.4P(1d),1r.3m)){c(31){u 4z=1d[0];c(1k){R(2X 1P 1d[0]){Q=2X+"";21.2c(Q);1l+=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18}}K{R(2X 1P 1d[0]){Q=2X+"";21.2c(Q);1l+=Q.1J(18,\'"\')+18}}1l=1l.2y(0,-1);1M+=1l+\'\\n\'}K{R(2X 1P 1d[0])21.2c(2X)}}c(21.w===0&&1r.3P(1d)==1v){1M="";c(31){Q=\'6R\';c(1k)1l+=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18;K 1l+=Q.1J(18,\'"\');1M+=1l+\'\\n\'}R(i=0;i<1d.w;i++){u 1l=\'\';Q=1d[i];c(Q==1A)Q="";K Q+="";c((Q+"").5h(0,15)=="[3O 58]")Q=1L.57(1d[i]).2y(0,-1);c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1l+=(1k?\'"\':"")+(""+Q).1J(18,\'"\')+(1k?\'"\':"");1M+=1l+\'\\n\'}14 1M}R(i=0;i<1d.w;i++){u 1l=\'\';c(1k){R(j=0;j<21.w;j++){Q=1d[i][21[j]];c((Q+"").5h(0,15)=="[3O 58]")Q=1L.57(1d[i][21[j]]).2y(0,-1);c(Q==1A)Q="";K Q+="";c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1l+=\'"\'+Q.V(/"/g,\'""\')+\'"\'+18}}K{R(j=0;j<21.w;j++){Q=1d[i][21[j]];c((Q+"").5h(0,15)=="[3O 58]")Q=1L.57(1d[i][21[j]]).2y(0,-1);c(Q==1A)Q="";K Q+="";c(2k)Q=Q.V(/\\r\\n|\\r|\\n/g,\' \');1l+=(""+Q).1J(18,\'"\')+18}}1l=1l.2y(0,-1*18.w);1M+=1l+\'\\n\'}14 1M}1c cR(l,J){u j=0,k,2O,d;u s="";u a=[];u x=0;u v="";u 4c="";u 5o="";a=2u(l);u 5D=13;u 69=13;c(2N J.2p===\'4m\'||J.2p==1A)J.2p=" ";c(J.3y&&(J.2p===""||J.2p===" "))J.2p="|";l=l||W;c(l.P.w===0)14 s;u X=2a(l);u 1U=7i(l);u 4b=0;u cZ=0;u 6H="";c(J.3y){R(x=0;x<a.w;x++){k=a[x]-1;c(l.2K&&X[k]&&X[k].w>1U[k])1U[k]=X[k].w;4b+=1U[k]+1}c(J.2H)4b+=(""+l.P.w).w+1;s+="+".2z(4b,"-")+"+\\n";c(l.2K){s+=J.2p;c(J.2H)s+="#".2z((""+l.P.w).w)+J.2p;R(x=0;x<a.w;x++){k=a[x]-1;c(x>0)s+=J.2p;c(k>=X.w)v="";K v=X[k].V(/\\r\\n|\\r|\\n/g,\' \');s+=v.2z(1U[k])}s+=J.2p+"\\n";s+="+".2z(4b,"-")+"+\\n"}}u 3V=0;R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}3V++;c(J.3y)s+=J.2p;c(J.2H)s+=(""+3V).2z((""+l.P.w).w)+J.2p;R(x=0;x<a.w;x++){k=a[x]-1;c(x>0)s+=J.2p;c(k>=l.P[j].w)v="";K v=l.P[j][k];c(J.d8&&(v.1D()=="1q"||v==="\\\\N"))v="";69=13;5D=13;v=1W(v,k,l);c(y.G("4E"+(k+1)))c(y.G("4E"+(k+1)).T)69=1v;c(y.G("4A"+(k+1)))c(y.G("4A"+(k+1)).T)5D=1v;c(5D)s+=v.V(/\\r\\n|\\r|\\n/g,\' \').d9(1U[k]);K c(69)s+=v.V(/\\r\\n|\\r|\\n/g,\' \').db(1U[k]);K s+=v.V(/\\r\\n|\\r|\\n/g,\' \').2z(1U[k])}u z;c(!J.3y&&J.7O&&3V==1){R(z=1;z<=s.w;z++){4c+=(""+z).4G(1)}c(s.w>=10){R(z=1,x=10;x<=s.w;x+=10,z++){5o+="         "+(""+z).4G(1)}5o=5o.2z(4c.w);4c=5o+"\\n"+4c}}c(J.3y)s+=J.2p;s+="\\n";c(J.3y&&J.7N)s+="+".2z(4b,"-")+"+\\n"}c(J.3y&&!J.7N)s+="+".2z(4b,"-")+"+\\n";c(J.7O&&!J.3y){6H=4c.2d("\\n")[1].V(/[cM]/g,"-").V(/0/g,\'|\').V(/5/g,\'+\');s=4c+"\\n"+6H+"\\n"+s}14 s}1c ct(1m,7L,18,31,1k,7J,7I){u fa=7L.2d(\'|\')||[];u 1M=\'\';u 1l=\'\';u 2j=[];u 4K="";u 1d=1m.2d(/\\n|\\r|\\r\\n/76);u i,j;c(1d[1d.w-1]=="")1d.cs();c(31){R(i=0;i<fa.w;i++){2j=fa[i].2d(\',\');c(2j.w>2)4K=2j[2];K 4K="F"+(i+1);c(1k){1M+=\'"\'+4K.V(/"/g,\'""\')+\'"\'+18}K{1M+=4K.1J(18,\'"\')+18}}1M=1M.2y(0,-1*18.w)+"\\n"}u p=0;u 5i=0;u 4z="";R(i=0;i<1d.w;i++){1l="";c(1d[i]=="")1p;R(j=0;j<fa.w;j++){2j=fa[j].2d(\',\')||[];c(2j.w>0)p=2j[0]-1;K p=0;c(2j.w>1)5i=2j[1];K 5i=0;c(2j.w>2)4z=2j[2];K 4z="f"+(j+1);c(7I)Q=1d[i].4B(p,5i);K Q=1d[i].4B(p,5i).1y();c(Q==1A)Q="";K Q+="";c(1k){1l+=\'"\'+(""+Q).V(/"/g,\'""\')+\'"\'+18}K c(7J){1l+=(""+Q)+18}K{1l+=(""+Q).1J(18,\'"\')+18}}1l=1l.2y(0,-1*18.w);1M+=1l+\'\\n\'}14 1M}1c cm(l,43,8A,3Z,8a,3g,2k,1k,5C,3t){u j=0,k,2O;u X;u s="";u a=[];u x=0;u v="";u 3Y="";3g=3g||"0";c(1Q("0"+3g))3g="0";a=2u(l);l=l||W;3Z=3Z||\'\';c(l.P.w===0)14 s;X=2a(l);R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}R(x=0;x<a.w;x++){3Y="";k=a[x]-1;c(k>=l.P[j].w){v=""}K{v=l.P[j][k]+"";c(v&&2k)v=v.V(/\\r\\n|\\r|\\n/g,\' \')}c(v&&3t)v=v.V(/^1A$/76,\'\');v=1W(v,k,l);c(5C){v=v.1J(43,l.1T,l.1T,1k)}c(8A){c(5C){c(k>=l.1u.w){3Y=("".2z(3g)+"2T-"+(k+1)).1J(43,l.1T,l.1T,1k)+3Z}K{3Y=("".2z(3g)+l.1u[k].V(/\\r\\n|\\r|\\n/g,\' \')).1J(43,l.1T,l.1T,1k)+3Z}}K{c(k>=l.1u.w){3Y="".2z(3g)+"2T-"+(k+1)+3Z}K{3Y="".2z(3g)+l.1u[k].V(/\\r\\n|\\r|\\n/g,\' \')+3Z}}}s+=3Y+v+"\\n";c(8a)s+="\\n"}c(!5C)s+=43+"\\n"}14 s}1c cy(l,6B,6Q,3f,3d,3e,3z){u j=0,k,2O;u X;u 6m="";u 3K="";u s="<?6n 6i=\\"1.0\\" cz=\\"cH-8\\"?>\\n";s+="<6s cI=\\"9c://cJ.cK.98/6s/2.0\\">\\n";s+="<6x>\\n";l=l||W;c(l.P.w===0)14 s+"</6x></6s>";X=2a(l);c(3z.1y()==""||1Q(3z)||(3z*1<1||3z*1>l.P[0].w)){3z=""}R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}s+="<8o>\\n";6m="";R(k=0;k<l.P[j].w;k++){c(k>=X.w)1j;c(!1Q(3f)&&k==(3f-1))1p;c(!1Q(3d)&&k==(3d-1))1p;c(!1Q(3e)&&k==(3e-1))1p;c(!1Q(6B)&&k==(6B-1))X[k]="1F";K c(!1Q(6Q)&&k==(6Q-1)){X[k]="cG";c(3z!="")6m=" "+l.P[j][3z-1]}K 1p;v=l.P[j][k]?l.P[j][k]:"";v=1W(v,k,l);s+="<"+X[k]+">"+v.3w()+6m.3w()+"</"+X[k]+">\\n"}c(!1Q(3f)&&!1Q(3d)&&3f.w>0&&3d.w>0&&3f*1<=l.P[j].w&&3d*1<=l.P[j].w&&l.P[j][3f*1-1]&&l.P[j][3d*1-1]){c(3e!=""&&!1Q(3e)&&3e*1<=l.P[j].w&&l.P[j][3e*1-1]){3K=1W(l.P[j][3e*1-1],3e*1-1,l)}K 3K="0";s+="<3x><2f>";s+=1W(l.P[j][3d-1],3d-1,l)+","+1W(l.P[j][3f-1],3f-1,l)+","+3K;s+="</2f></3x>\\n"}s+="</8o>\\n"}s+="</6x>\\n</6s>";14 s}1c cA(l,18,5U,3u,5R,2k,1k,3t,8G){l=l||W;c(l.P.w===0)14"";u j=0,k,2O;u X;u s="";u a=[];u x=0;u v;a=2u(l);c(5U||5R){X=2a(l);R(x=0;x<a.w;x++){j=a[x]-1;c(x>0)s+=18;s+=(j>=X.w?"":X[j]).1J(18,l.1T,l.1T)}c(s!="")s+="\\n"}R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}R(x=0;x<a.w;x++){k=a[x]-1;v=l.P[j][k]?l.P[j][k]:"";c(v&&3t)v=v.V(/^1A$/76,\'\');c(v&&2k)v=v.V(/\\r\\n|\\r|\\n/g,\' \');v=1W(v,k,l);c(3u&&v!=""){c(v.6h(\',\')<0){s+="="+v.1J(18,l.1T,l.1T,3u)}K{s+=\'"="\'+v.1J(18,l.1T,l.1T,3u)+\'""\'}}K c(!1k&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){c(v)s+=v;K s+=\'\'}K{c(8G)s+=v.1J(18,"","",13);K s+=v.1J(18,l.1T,l.1T,1k)}s+=(x<a.w-1?18:\'\')}s+="\\n"}14 s}1c cD(l,18,5U,3u,5R,2k,1k){l=l||W;c(l.P.w===0)14"";u j=0,k,2O;u X;u s="";u a=[];u x=0;u v;a=2u(l);R(x=0;x<a.w;x++){c(5U||5R){X=2a(l);j=a[x]-1;s+=(X[j]).1J(18,l.1T);c(l.P.w>0)s+=18}R(j=0;j<l.P.w;j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}k=a[x]-1;v=l.P[j][k]?l.P[j][k]:"";c(v&&2k)v=v.V(/\\r\\n|\\r|\\n/g,\' \');v=1W(v,k,l);c(3u&&v!=""){c(v.6h(\',\')<0){s+="="+v.1J(18,l.1T,l.1T,3u)}K{s+=\'"="\'+v.1J(18,l.1T,l.1T,3u)+\'""\'}}K c(!1k&&l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I")){c(v)s+=v;K s+=\'\'}K{s+=v.1J(18,l.1T,l.1T,1k)}s+=(j<l.P.w-1?18:\'\')}s+="\\n"}14 s}1c 7i(l){u j=0,k=0;u n=0;u d=0;u 1U=6j 8J();l=l||W;c(l.P.w===0)14 1U;R(k=0;k<l.1X;k++)1U.2c(0);R(j=0;j<l.P.w;j++){R(k=0;k<1U.w;k++){c(k>=l.P[j].w)1p;c(l.P[j][k].w>1U[k])1U[k]=l.P[j][k].w;c(y.G(\'42\'+(k+1))){d=y.G(\'42\'+(k+1)).Q;c(1Q(d))d=0;K d=d*1;c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(l.P[j][k].1y()!=""){n=(l.P[j][k].4M().4C(d)+"").w;c(n>1U[k])1U[k]=n}}}c(y.G(\'6F\'+(k+1))){n=y.G(\'6F\'+(k+1)).Q;c(1Q(n))n=0;K n=n*1;c(n>1U[k])1U[k]=n}}}14 1U}1c dc(){14["bd","ad","ac","7E","ae","af","6d","59","ag","ab","a5","a4","a6","a7","a9","a8","ah","ai","ar","as","au","av","ap","ao","7A","ak","aj","a3","am","aw","9J","9Q","9N","7Z","9P","9I","a2","8N","9R","9Z","a0","a1","9W","9T","5W","9Y","9U","9S","9X","5b","9O","9L","bn","b6","6e","b8","b9","b5","b4","ax","b0","aZ","7w","b1","b3","64","ba","bb","bk","7t","bl","bm","bi","bh","bc","be","52","bf","1q","bg","aY","7j","aX","aG","aF","aI","aJ","7v","aE","aD","ay","aA","aB","aC","aT","aV","7R","aR","aN","aM","2U","aO","5Y","71","aP","aQ","7n","aS","aW","7C","aU","aL","aK","7r","az","7h","aH","bj","7p","7B","b2","7a","7b","b7","al"]}1c 9V(l,3C,J){u j=0,k,i,2O,n,m,d,2I,3i=0;u X;u s="";u Z="";u 9K="";u v="";u 1w="";u cv="";u 26=[];u 1H=[];u 1Z=[];u 2D=[];u 3E=[];u 47=13;u 1n="";u 2g=[];u 6a=0;u 63=0;u 2E=13;u 2x=0;u 5a=0;u 5Z=0;l=l||W;3C=3C||"I";J.1R=J.1R||13;c(!("5y"1P J))J.5y=13;c(!("2P"1P J)||J.2P.1y()==""||1Q(J.2P))J.2P=4a.7q;c(!("49"1P J)||J.49.1y()==""||1Q(J.49))J.49=4a.7q;c(!J.67)J.49="";X=2a(l);R(k=0;k<X.w;k++){1H[k]=X[k].V(/\\s+/g,\'1r\');c(1H[k].w>63)63=1H[k].w;2g[k]=13;1Z[k]=2D[k]="";c(y.G("7s"+(k+1)))c(y.G("7s"+(k+1)).T){6a++;2g[k]=1v}c(y.G("4Z"+(k+1)))1H[k]=y.G("4Z"+(k+1)).Q.V(/\\s+/g,\'1r\');c(y.G("3E"+(k+1)))3E[k]=(y.G("3E"+(k+1))).T;c(y.G("1Z"+(k+1))){1Z[k]=y.G("1Z"+(k+1)).Q.1y();c(!1Q(1Z[k]))1Z[k]*=1;K 1Z[k]=30;c(1Z[k]<1)1Z[k]=""}K 1Z[k]=30;c(y.G("2D"+(k+1))){2D[k]=y.G("2D"+(k+1)).Q.1y();c(!1Q(2D[k])){2D[k]*=1;c(2D[k]<0)2D[k]=""}K{2D[k]=""}}c(y.G("66"+(k+1))){c(y.G("66"+(k+1)).T){26[k]=1v;5a++}K{26[k]=13}}K{26[k]=1v;5a++}}c(X.w===0)14"";c(5a==0&&3C=="S")14"";c(J.2A.6h(\' \')>0&&J.2A.53(0)!="["&&J.2A.53(0)!="`")J.2A=\'"\'+J.2A+\'"\';c(J.an)s+="8N "+(3C==="S"?"7B ":"7n ")+(J.aa?"6e 5W ":"")+J.2A+";\\n";c(J.3R&&3C!="S"){u 8x=J.1R;J.1R=1v;s+="7A 7n "+(J.7T?"6e 52 5W ":"")+J.2A+"(";c(J.1R)s+="\\n";R(n=k=0;k<X.w;k++,n++){c(J.1R&&n>0)s+="\\n";c(n>0)s+="  ,";K s+="   ";s+=1H[k].2z(63);Z="2J";c(k<l.16.w)Z=l.16[k].1i;c(y.G("2v"+(k+1))){Z=y.G("2v"+(k+1)).Q}3q(Z){1b"B":s+=" gh ";1j;1b"L":s+=" gl ";1j;1b"2B":1b"N":c(Z=="N")s+=" fP";K s+=" fX";c(l.16.w>0){m=l.16[k].g1+l.16[k].48;d=l.16[k].48}K{m=0;d=2D[k]?2D[k]:0}c(1Z[k]&&1Z[k]>m)m=1Z[k];c(m!="")s+="("+m+","+d+")";K s+=" ";1j;1b"2Q":s+=" fS ";1j;1b"2C":s+=" fT ";1j;1b"I":s+=" fW ";1j;1b"M":s+="gj";1j;1b"S":s+=" fN ";1j;1b"D":s+=" fO ";1j;1b"2r":s+=" fd ";1j;1b"3H":s+=" fk("+1Z[k]+")";1j;1b"2J":s+=" fc("+1Z[k]+")";1j;1b"4Y":s+=" f3("+1Z[k]+")";1j;1b"3G":s+=" f2("+1Z[k]+")";1j;4l:s+=" eY("+1Z[k]+")";1j}c(3E[k])s+=" 52 1q";c(2g[k]&&6a==1){s+=" 7v 7t";c(Z=="N"||Z=="2B"||Z=="I"||Z=="2C"||Z=="2Q"){c(y.G(\'81\')){s+=" "+y.G(\'81\').Q}}}}c(6a>1){c(J.1R)s+="\\n";s+="  ,7v 7t(";R(x=0;x<2g.w;x++){c(2g[x]){s+=((x>0)?",":"")+1H[x]}}s+=")"}c(J.1R)s+="\\n";s+=");\\n";J.1R=8x}K c(J.3R&&3C==="S"){s+="7A ";c(J.4o.1y()!="")s+=" "+J.4o.1y();s+="7B "+(J.7T?"6e 52 5W ":"")+J.2A+"(";c(J.1R)s+="\\n";R(n=k=0;k<X.w;k++){c(!26[k])1p;c(n>0)s+=",";s+=1H[k];c(J.1R)s+="\\n";n++}s+=") 59\\n"}c(5a==0)14 s;3q(3C){1b"I":3i=2I=0;R(j=0;j<(l.P.w?l.P.w:1);j++){c(1f&&1f.1s!=""&&l.P.w>0){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}2I++;3i++;c(2I==1||!J.67||3i>J.49*1){3i=1;s+=J.fL?"7R":"7w";c(J.4o.1y()!="")s+=" "+J.4o.1y();s+=" 64 "+J.2A+"(";c(J.1R)s+="\\n";R(n=k=0;k<X.w;k++){c(!26[k])1p;c(n>0)s+=",";s+=1H[k];c(J.1R)s+="\\n";n++}s+=") 7p"+(!J.67?"":"\\n")+" (";c(l.P.w===0){R(n=k=0;k<X.w;k++){c(!26[k])1p;c(n>0)s+=",";s+="?";c(J.1R)s+="\\n";n++}14 s+");"}}K{s+=",("}c(J.1R)s+="\\n";R(n=k=0;k<X.w;k++){c(!26[k])1p;c(l.P.w===0)Z="2J";K Z=l.16[k].1i;c(k>=l.P[j].w){v=""}K{v=l.P[j][k]}2E=13;c(y.G("2v"+(k+1))){Z=y.G("2v"+(k+1)).Q}c(y.G("2V"+(k+1)))1w=y.G("2V"+(k+1)).Q;c(y.G("2h"+(k+1)))c(y.G("2h"+(k+1)).T)v=v.1y();c(y.G("1O"+(k+1)))c(y.G("1O"+(k+1)).T)v=v.1D();c(y.G("1N"+(k+1)))c(y.G("1N"+(k+1)).T)v=v.3l();c(y.G("20"+(k+1)))c(y.G("20"+(k+1)).T)2E=1v;c(n>0)s+=",";c(1w!=""){c(Z===\'N\'||Z==="2B"||Z===\'I\'||Z==="2C"||Z==="S"||Z==="D"||Z==="2r"||Z==="2Q"||Z==="M"||Z==="L"){c(v=="")s+=1w.V("{f}",\'1q\');K c(Z=="D"||Z=="2r")s+=1w.V("{f}","\'"+v.1x()+"\'");K s+=1w.V("{f}",v.1x())}K{s+=1w.V("{f}","\'"+v.1x()+"\'")}}K{3q(Z){1b"B":1b"L":1b"2B":1b"M":1b"S":1b"N":1b"2Q":1b"2C":1b"I":c((v.1y()==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K s+=v.1x();1j;1b"2r":1b"D":c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K s+="\'"+v.1x()+"\'";1j;4l:c((v.1D()=="1q"||v==="\\\\N")&&J.2F){s+="1q"}K c(v==""&&2E){s+="1q"}K c(Z===\'3G\'||Z===\'3H\'){s+="N\'"+v.1x()+"\'"}K{s+="\'"+v.1x()+"\'"}1j}}c(J.1R)s+="\\n";n++}c(!J.67||j==l.P.w-1||3i>=J.49*1){s+=");\\n"}K{s+=")\\n"}}1j;1b"U":47=13;R(j=0;j<(l.P.w?l.P.w:1);j++){c(1f&&1f.1s!=""&&l.P.w>0){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}1n="";s+="7h";c(J.4o.1y()!="")s+=" "+J.4o.1y();s+=" "+J.2A+" 71 ";c(J.1R)s+="\\n";R(k=0;k<X.w;k++){c(2g[k])1n+=(1n!=""?" 6d ":"")+1H[k]+"= {f"+k+"}"}c(1n==="")1n=1H[0]+"= {f0}";R(n=k=0;k<X.w;k++){c(26[k]){c(n>0)s+=",";s+=1H[k]+" = ";n++}c(l.P.w===0)Z="2J";K Z=l.16[k].1i;c(l.P.w===0)v="?";K c(k>=l.P[j].w)v="";K v=l.P[j][k];2E=13;c(y.G("2v"+(k+1)))Z=y.G("2v"+(k+1)).Q;c(y.G("2V"+(k+1)))1w=y.G("2V"+(k+1)).Q;c(y.G("2h"+(k+1)))c(y.G("2h"+(k+1)).T)v=v.1y();c(y.G("1O"+(k+1)))c(y.G("1O"+(k+1)).T)v=v.1D();c(y.G("1N"+(k+1)))c(y.G("1N"+(k+1)).T)v=v.3l();c(y.G("20"+(k+1)))c(y.G("20"+(k+1)).T)2E=1v;c(1w!=""){c(Z===\'N\'||Z==="2B"||Z===\'I\'||Z==="2C"||Z==="S"||Z==="D"||Z==="2r"||Z==="2Q"||Z==="M"||Z==="L"){c(v=="")s+=1w.V("{f}",\'1q\');K c(Z=="D"||Z=="2r")s+=1w.V("{f}","\'"+v.1x()+"\'");K s+=1w.V("{f}",v.1x())}K{s+=1w.V("{f}","\'"+v.1x()+"\'")}47=1v}3q(Z){1b"B":1b"L":1b"2B":1b"N":c(!47&&26[k]){c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K c(l.P.w===0)s+=v;K s+=v.1x()}c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}",v.1x());1j;1b"2Q":1b"2C":1b"I":c(!47&&26[k]){c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K c(l.P.w===0)s+=v;K s+=v.1x()}c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}",v.1x());1j;1b"D":c(!47&&26[k]){c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K c(l.P.w===0)s+=v;K s+="\'"+v.1x()+"\'"}c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}","\'"+v.1x()+"\'");1j;4l:c(!47&&26[k]){c((v.1D()=="1q"||v==="\\\\N")&&J.2F){s+="1q"}K c(v==""&&2E){s+="1q"}K c(Z===\'3G\'||Z===\'3H\'){s+="N\'"+v.1x()+"\'"}K c(l.P.w===0)s+=v;K{s+="\'"+v.1x()+"\'"}}c(Z===\'3G\'||Z===\'3H\')1n=1n.V("{f"+k+"}","N\'"+v.1x()+"\'");K c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}","\'"+v.1x()+"\'");1j}c(26[k]){c(J.1R)s+="\\n";n++}}s+=" 7b "+1n;s+=";\\n"}1j;1b"D":R(j=0;j<(l.P.w?l.P.w:1);j++){c(1f&&1f.1s!=""&&l.P.w>0){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}1n="";s+="7Z 5b "+J.2A;c(J.1R)s+="\\n";R(k=0;k<1H.w;k++){c(2g[k])1n+=(1n!=""?" 6d ":"")+1H[k]+"= {f"+k+"}"}c(1n==="")1n=1H[0]+"= {f0}";R(n=k=0;k<X.w;k++){n++;c(l.P.w===0)Z="2J";K Z=l.16[k].1i;c(l.P.w===0)v="?";K c(k>=l.P[j].w)v="";K v=l.P[j][k];c(y.G("2v"+(k+1)))Z=y.G("2v"+(k+1)).Q;c(y.G("2V"+(k+1)))1w=y.G("2V"+(k+1)).Q;c(y.G("2h"+(k+1)))c(y.G("2h"+(k+1)).T)v=v.1y();c(y.G("1O"+(k+1)))c(y.G("1O"+(k+1)).T)v=v.1D();c(y.G("1N"+(k+1)))c(y.G("1N"+(k+1)).T)v=v.3l();3q(Z){1b"B":1b"L":1b"2B":1b"N":1b"2Q":1b"2C":1b"M":1b"S":1b"I":c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}",v.1x());1j;4l:c(Z===\'3G\'||Z===\'3H\')1n=1n.V("{f"+k+"}","N\'"+v.1x()+"\'");K c(l.P.w===0)1n=1n.V("{f"+k+"}",v);K 1n=1n.V("{f"+k+"}","\'"+v.1x()+"\'");1j}c(J.1R)s+="\\n";n++}s+=" 7b "+1n;s+=";\\n"}1j;1b"M":2I=2x=0;R(j=0;j<(l.P.w?l.P.w:1);j++){c(1f&&1f.1s!=""&&l.P.w>0){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}2x++;2I++;c(2I===1||2x==J.2P){s+="fA 64 "+J.2A+" t\\fw (\\n";1n="7j (";R(i=k=0;k<1H.w;k++){c(2g[k]){1n+=(i>0?" 6d ":" ")+"t."+1H[k]+"= s."+1H[k];i++}}c(1n==="7j ("){1n+="t."+1H[0]+"= s."+1H[0];2g.2c(1H[0])}1n+=" )"}K{c(J.3R||2x<J.2P)s+="7r 7E\\n"}c(J.1R)s+="\\n";s+="5Y ";R(5Z=k=0;k<X.w;k++){c(26[k]&&!2g[k])5Z++}R(n=k=0;k<X.w;k++){c(!26[k]&&!2g[k])1p;c(l.P.w===0)Z="2J";K Z=l.16[k].1i;c(l.P.w===0)v="?";K c(k>=l.P[j].w)v="";K v=l.P[j][k];2E=13;c(y.G("2v"+(k+1))){Z=y.G("2v"+(k+1)).Q}c(y.G("2V"+(k+1)))1w=y.G("2V"+(k+1)).Q;c(y.G("2h"+(k+1))){c(y.G("2h"+(k+1)).T)v=v.1y()}c(y.G("1O"+(k+1))){c(y.G("1O"+(k+1)).T)v=v.1D()}c(y.G("1N"+(k+1))){c(y.G("1N"+(k+1)).T)v=v.3l()}c(y.G("20"+(k+1))){c(y.G("20"+(k+1)).T)2E=1v}c(n>0)s+=",";c(1w!=""){c(Z==\'N\'||Z=="2B"||Z==\'I\'||Z=="2C"||Z=="S"||Z=="D"||Z=="2r"||Z=="2Q"||Z=="M"||Z==="L"){c(v=="")s+=1w.V("{f}",\'1q\');K c(Z=="D"||Z=="2r")s+=1w.V("{f}","\'"+v.1x()+"\'");K c(l.P.w===0)s+=89.V("{f}",v);K s+=1w.V("{f}",v.1x())}K{c(l.P.w===0)s+=89.V("{f}",v);K s+=1w.V("{f}","\'"+v.1x()+"\'")}}K{3q(Z){1b"B":1b"L":1b"2B":1b"M":1b"S":1b"N":1b"2Q":1b"2C":1b"I":c((v.1y()==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K c(l.P.w===0)s+=v;K s+=v.1x();1j;1b"2r":1b"D":c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K c(l.P.w===0)s+=v;K s+="\'"+v.1x()+"\'";1j;4l:c((v.1D()=="1q"||v==="\\\\N")&&J.2F){s+="1q"}K c(v==""&&2E){s+="1q"}K c(Z===\'3G\'||Z===\'3H\'){s+="N\'"+v.1x()+"\'"}K c(l.P.w===0)s+=v;K{s+="\'"+v.1x()+"\'"}1j}c(2I===1){s+=" 59 "+1H[k]}}c(J.1R)s+="\\n";n++}c(J.5y){s+=" 5b "+(J.8D||"8E")}c(j==l.P.w-1||2x==J.2P||l.P.w===0){s+="\\n) s\\n";s+=1n;c(5Z>0){s+="\\n  7a 7G 7C \\n     7h 71 ";R(n=k=0;k<1H.w;k++){c(!2g[k]&&26[k]){s+=(n>0?", ":" ")+"t."+1H[k]+"=s."+1H[k];n++}}}s+="\\n  7a 52 7G 7C\\n     7w(";R(n=k=0;k<1H.w;k++){c(2g[k]||26[k]){s+=(n>0?", ":" ")+""+1H[k];n++}}s+=")\\n     7p(";R(n=k=0;k<1H.w;k++){c(2g[k]||26[k]){s+=(n>0?", ":" ")+"s."+1H[k];n++}}s+=")\\n;\\n"}K{s+="\\n"}c(2x==J.2P){2x=0}c(l.P.w===0)1j}1j;1b"S":2I=2x=0;c(J.3R)J.2P=4a.7q;R(j=0;j<(l.P.w?l.P.w:1);j++){c(1f&&1f.1s!=""){v=25(l,1f.1s,j);c(v.1Y().1I(5)=="13")1p}2x++;2I++;c(2I>1){c(J.3R||2x<J.2P)s+="7r 7E\\n"}c(J.1R)s+="\\n";s+="5Y ";R(n=k=0;k<X.w;k++){c(!26[k])1p;c(l.P.w===0)Z="2J";K Z=l.16[k].1i;c(l.P.w===0)v="";K c(k>=l.P[j].w){v=""}K{v=l.P[j][k]}2E=13;c(y.G("2v"+(k+1))){Z=y.G("2v"+(k+1)).Q}c(y.G("2V"+(k+1)))1w=y.G("2V"+(k+1)).Q;c(y.G("2h"+(k+1))){c(y.G("2h"+(k+1)).T)v=v.1y()}c(y.G("1O"+(k+1))){c(y.G("1O"+(k+1)).T)v=v.1D()}c(y.G("1N"+(k+1))){c(y.G("1N"+(k+1)).T)v=v.3l()}c(y.G("20"+(k+1))){c(y.G("20"+(k+1)).T)2E=1v}c(n>0)s+=",";c(1w!=""){c(l.P.w===0)s+=1w.V("{f}",\'?\');K c(Z===\'N\'||Z==="2B"||Z===\'I\'||Z==="2C"||Z==="S"||Z==="D"||Z==="2r"||Z==="2Q"||Z==="M"||Z==="L"){c(v=="")s+=1w.V("{f}",\'1q\');K c(Z=="D"||Z=="2r")s+=1w.V("{f}","\'"+v.1x()+"\'");K s+=1w.V("{f}",v.1x())}K{s+=1w.V("{f}","\'"+v.1x()+"\'")}}K{3q(Z){1b"B":1b"L":1b"2B":1b"M":1b"S":1b"N":1b"2Q":1b"2C":1b"I":c(l.P.w===0)s+="?";K c((v.1y()==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K s+=v.1x();1j;1b"2r":1b"D":c(l.P.w===0)s+="?";K c((v==="")||((v.1D()=="1q"||v==="\\\\N")&&J.2F))s+="1q";K s+="\'"+v.1x()+"\'";1j;4l:c(l.P.w===0)s+="?";K c((v.1D()=="1q"||v==="\\\\N")&&J.2F){s+="1q"}K c(v==""&&2E){s+="1q"}K c(Z===\'3G\'||Z===\'3H\'){s+="N\'"+v.1x()+"\'"}K{s+="\'"+v.1x()+"\'"}1j}}c(J.1R)s+="\\n";n++;c(2I===1){s+=" 59 "+1H[k]}}c(J.5y&&!(l.P.w===0&&!J.3R)){s+=" 5b "+(J.8D||"8E")}c(j==l.P.w-1||2x==J.2P||l.P.w===0){s+=";\\n"}K{s+="\\n"}c(2x==J.2P)2x=0}c(l.P.w===0&&!J.3R){s=s.V(/\\? 59 /gd," ").6t();c(s.ga(";"))s=s.2y(0,-1);s+="\\g8 "+(J.2A||"ge")+";"}1j}c(l.P.w===0){}14 s}1c gg(1E,18,31,1k,2k){u j,k,p;u s="";u Q="";u 2G={};u 3X=["4V","5v","3K","27"];u gk={};u t="";c(2N 1E==="6o"){3N{1E=1L.2q(1E)}3Q(e){1E=1z("1E="+1E)}}u 4x=0;c(1E.1e==="5L"){1E={"1e":"7k","1V":[1E]}}c(1E.1e==="7k"){R(j=0;j<1E.1V.w;j++){c(1E.1V[j].27.1e==="3x"){c(!("4V"1P 2G))2G["4V"]=++4x;c(!("5v"1P 2G))2G["5v"]=++4x;c(!("3K"1P 2G))2G["3K"]=++4x}K c(!("2f"1P 2G)){2G["2f"]=++4x;3X.2c("2f")}}R(j=0;j<1E.1V.w;j++){R(p 1P 1E.1V[j].4L){c(!(p 1P 2G)){2G[p]=++4x;3X.2c(p)}}}c(31){R(j=0;j<3X.w;j++){t+=3X[j].1J(18,\'"\',\'"\',1k)+18}t=t.2y(0,-1*18.w)+"\\n"}R(j=0;j<1E.1V.w;j++){c("4V"1P 2G){c(1E.1V[j].27&&1E.1V[j].27.1e&&1E.1V[j].27.2f&&1E.1V[j].27.2f.w>=2&&1E.1V[j].27.1e==="3x"){s+=(1k?\'"\':"")+1E.1V[j].27.2f[1]+(1k?\'"\':"")+18;s+=(1k?\'"\':"")+1E.1V[j].27.2f[0]+(1k?\'"\':"")+18;c(1E.1V[j].27.2f.w>2){s+=(1k?\'"\':"")+1E.1V[j].27.2f[2]+(1k?\'"\':"")+18}K s+=(1k?\'""\':"")+18}K{s+=(1k?\'""\':"")+18;s+=(1k?\'""\':"")+18;s+=(1k?\'""\':"")+18}}K{s+=(1k?\'""\':"")+18;s+=(1k?\'""\':"")+18;s+=(1k?\'""\':"")+18}c(1E.1V[j].27.1e){Q=1E.1V[j].27.1e;s+=(""+Q).1J(18,\'"\',\'"\',1k)+18}K{s+=(1k?\'""\':"")+18}c("2f"1P 2G){c(1E.1V[j].27.1e!="3x"){Q=1E.1V[j].27.2f;c((Q+"").5h(0,15)=="[3O 58]")Q=1L.57(Q).2y(0,-1);s+=(""+Q).1J(18,\'"\',\'"\',1k)+18}K{s+=(1k?\'""\':"")+18}}R(k=0;k<3X.w;k++){p=3X[k];c(p=="4V"||p==="5v"||p==="3K"||p==="2f"||p=="27"){1p}c(p 1P 1E.1V[j].4L){Q=1E.1V[j].4L[p];c(Q==1A)Q="";c((Q+"").5h(0,15)=="[3O 58]")Q=1L.57(Q).2y(0,-1);c(2k)Q=(Q+"").V(/\\r\\n|\\r|\\n/g,\' \');s+=(Q+"").1J(18,\'"\',\'"\',1k)+18}K{s+=(1k?\'""\':"")+18}}s=s.2y(0,-1*18.w)+"\\n"}}14 t+s}1c gb(1M){14 fp(1M).V(/&/g,\'&9a;\').V(/"/g,\'&7x;\').V(/\'/g,\'&#39;\').V(/</g,\'&dO;\').V(/>/g,\'&dP;\')}1c 2a(l){u k;u X=6j 8J();l=l||W;c(!l)6J(\'6b l\');c(!l.1u)6J(\'6b 1u\');u 5N=l.1u.w;c(5N<l.1X)5N=l.1X;R(k=0;k<5N;k++){c(!l.1u[k])l.1u.2c("3o"+(k+1));X.2c(l.1u[k]);c(l.87){l.1u[k]=l.1u[k].1D();X[X.w-1]=X[X.w-1].1D()}K c(l.86){l.1u[k]=l.1u[k].3l();X[X.w-1]=X[X.w-1].3l()}}14 X}1c 7W(l){l=l||W;u 1U=7i(l);u X=2a(l);u s=\'<P 4Q="P P-5g P-5e P-50">\\n<1S>\\n<19>6S #</19>\';s+="<19>2T 8w</19>";s+="<19>6M 6A</19><19>dI 8y</19>";s+="<19 2w=\'# 5f dH\'>#<br/>dJ</19>";s+="<19>dK</19><19>dL<br/><1m 1e=\\"1t\\" T 1K=\\"1C(\'66\',1o.T)\\"/></19>";s+="<19>dS<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'3E\',1o.T)\\"/></19>";s+="<19>4D<br/><1m 1e=\\"1t\\" T 1K=\\"1C(\'2h\',1o.T)\\"/></19>";s+="<19>6V<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1O\',1o.T);c(1o.T)1C(\'1N\',13)\\"/></19>";s+="<19>6U<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1N\',1o.T);c(1o.T)1C(\'1O\',13)\\"/></19>";s+="<19 2w=\\"5M dT 1q\\">5M 1q R 4X 2T<br/><1m 1e=\\"1t\\" T 1K=\\"1C(\'20\',1o.T)\\"/></19>";s+="<19 2w=\\"e1 e2 by e3 {f} R 6I Q. 8u: {f}+8t\\">eX<br/>({f}=6I)<br/>8u: {f}+8t</19></1S>";u 1h="<1S><1a>{#}</1a>";1h+="<1a><1m 1e=23 1g=\\"4Z{#}\\" 3S=\\"15\\" Q=\\"{4F{#}}\\" 2w=\\"{6Z{#}}\\"></1a>\\n";1h+="<1a><8r 1g=\\"2v{#}\\" 2w=\\"e4 3a 1e 5f 4u\\" >";1h+="<1B Q=\\"2J\\" {2J{#}}>e0</1B>";1h+="<1B Q=\\"3H\\" {2J{#}}>dV</1B>";1h+="<1B Q=\\"4Y\\" {4Y{#}}>dU</1B>";1h+="<1B Q=\\"C\\" {C{#}}>dW</1B>";1h+="<1B Q=\\"3G\\" {C{#}}>dY</1B>";1h+="<1B Q=\\"2B\\" {2B{#}}>4a</1B>";1h+="<1B Q=\\"N\\" {N{#}}>dn</1B>";1h+="<1B Q=\\"2C\\" {2C{#}}>dp</1B>";1h+="<1B Q=\\"I\\" {I{#}}>dq</1B>";1h+="<1B Q=\\"2Q\\" {I{#}}>dr</1B>";1h+="<1B Q=\\"D\\" {D{#}}>8k</1B>";1h+="<1B Q=\\"2r\\" {2r{#}}>8k dg</1B>";1h+="<1B Q=\\"B\\" {B{#}}>df(0,1)</1B>";1h+="<1B Q=\\"L\\" {L{#}}>dh</1B>";1h+="<1B Q=\\"M\\" {M{#}}>di</1B>";1h+="<1B Q=\\"S\\" {S{#}}>dj</1B>";1h+="</8r>\\n</1a><1a><1m 1g=\\"1Z{#}\\"3S=4 5c=4 Q=\\"{8m{#}}\\"></1a>\\n";1h+="<1a><1m 1g=\\"2D{#}\\"3S=2 5c=2 Q=\\"{5w{#}}\\" dt></1a>";1h+="<1a><1m 1e=1t 1g=\\"7s{#}\\"  Q=\\"Y\\" ></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"66{#}\\"  Q=\\"Y\\" T></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"3E{#}\\"  Q=\\"Y\\" ></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"2h{#}\\" Q=\\"Y\\" T></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1O{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'1N{#}\').T=13\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1N{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'1O{#}\').T=13\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"20{#}\\" Q=\\"Y\\" T></1a>\\n";1h+="<1a><1m 1e=\\"23\\" 1g=\\"2V{#}\\" Q=\\"\\" 3S=\\"15\\" 5c=\\"dD\\"></1a>";1h+="</1S>";u j;R(j=0;j<X.w;j++){s+=1h.V(/{#}/g,""+(j+1)).V("{4F"+(j+1)+"}",X[j].V(/[@+<>"\'?\\.,-\\/#!$%\\^&\\*;:{}=\\-`~()\\[\\]\\\\\\|]/g,"").V(/\\s+/g,"1r").V(/1r+/g,"1r")).V("{8m"+(j+1)+"}",(1U.w>0&&1U[j])!=0?1U[j]:30);c(l.16.w==0){s=s.V("{2J"+(j+1)+"}","3c");s=s.V("{6Z"+(j+1)+"}","6A: dA,8l: 8p 4H: "+l.P.w+",4X 4H: 0");s=s.V("{5w"+(j+1)+"}","");1p}c(l.16[j].1i==="N"){s=s.V("{5w"+(j+1)+"}",l.16[j].48)}K{s=s.V("{5w"+(j+1)+"}","")}s=s.V("{6Z"+(j+1)+"}","6A:"+l.16[j].1i+",8l: 8p 4H: "+l.P.w+",4X 4H:"+l.16[j].8e);c(l.16[j].1i==="2J"){s=s.V("{2J"+(j+1)+"}","3c")}K c(l.16[j].1i==="4Y"){s=s.V("{4Y"+(j+1)+"}","3c")}K c(l.16[j].1i==="C"){s=s.V("{C"+(j+1)+"}","3c")}K c(l.16[j].1i==="N"){s=s.V("{N"+(j+1)+"}","3c")}K c(l.16[j].1i==="I"){s=s.V("{I"+(j+1)+"}","3c")}K c(l.16[j].1i==="B"){s=s.V("{B"+(j+1)+"}","3c")}K c(l.16[j].1i==="D"){s=s.V("{D"+(j+1)+"}","3c")}K c(l.16[j].1i==="S"){s=s.V("{S"+(j+1)+"}","3c")}K c(l.16[j].1i==="M"){s=s.V("{M"+(j+1)+"}","3c")}}s+="</P>";14 s}1c 7V(l){u j;l=l||W;u X=2a(l);c(y.G(\'8j\'))y.G(\'8j\').T=1v;c(y.G(\'8d\'))y.G(\'8d\').T=1v;R(j=0;j<X.w;j++){c(!y.G(\'4Z\'+(j+1)))1p;y.G(\'4Z\'+(j+1)).Q=X[j].V(/[@+<>"\'?\\.,-\\/#!$%\\^&\\*;:{}=\\-`~()\\[\\]\\\\\\|]/g,"").V(/\\s+/g,"1r").V(/1r+/g,"1r");c(!y.G(\'2v\'+(j+1)))1p;c(!l.16[j])1p;c(l.16[j].8e===0)y.G(\'3E\'+(j+1)).T=1v}}1c 7Q(l){u 6z=(y&&y.G("e6"));l=l||W;u X=2a(l);u s=\'<P 4Q="P P-5g P-5e P-50">\\n<1S>\\n<19>6S #</19><19>2T</19>\';s+="<19>4D 8f<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'60\',1o.T)\\"/></19>";s+="<19>4D 6N<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'62\',1o.T)\\"/></19>";s+="<19>6V<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1O\',1o.T);c(1o.T){1C(\'1N\',13);1C(\'3D\',13);}\\"/></19>";s+="<19>6U<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1N\',1o.T);c(1o.T){1C(\'1O\',13);1C(\'3D\',13);}\\"/></19>";s+="<19 2w=\\"eF eG 5f eH eI eE eD 6L\\">ez ey<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'3D\',1o.T);c(1o.T){1C(\'1O\',13);1C(\'1N\',13);}\\"/></19>";s+="<19>8i eA<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'6l\',1o.T)\\"/></19>";s+="<19>eB 9B<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'5K\',1o.T)\\"/></19>";c(6z){s+="<19>5M 1A R 4X 2T<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'20\',1o.T)\\"/></19>\\n"}s+="<19># 8z</19>\\n";s+="</1S>";u 1h="<1S><1a>{#}</1a>";1h+="<1a>{4F{#}}</1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"60{#}\\" Q=\\"Y\\" 2w=\\"4D 8f\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"62{#}\\" Q=\\"Y\\" 2w=\\"4D 6N\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1O{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T){y.G(\'3D{#}\').T=y.G(\'1N{#}\').T=13}\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1N{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T){y.G(\'3D{#}\').T=y.G(\'1O{#}\').T=13}\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"3D{#}\\" Q=\\"Y\\" 1K=\\"c(1o.T){y.G(\'1N{#}\').T=y.G(\'1O{#}\').T=13}\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"6l{#}\\"  Q=\\"Y\\" 2w=\\"8i eK\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"5K{#}\\" Q=\\"Y\\" 2w=\\"eS 2 eT eU eV 3p 1\\"></1a>\\n";c(6z){1h+="<1a><1m 1e=1t 1g=\\"20{#}\\" Q=\\"Y\\" 2w=\\"5M 1A eL 5f 9D 6o\\"></1a>\\n"}1h+="<1a><1m 1e=\\"23\\" 3S=\\"1\\" 1g=\\"42{#}\\"  Q=\\"\\" 2w=\\"eO # 5f eP ex\\"></1a>\\n";1h+="</1S>";u j;R(j=0;j<X.w;j++){s+=1h.V(/{#}/g,""+(j+1)).V("{4F"+(j+1)+"}",X[j].V(/\\s+/g,"1r"))}s+="</P>";14 s}1c 7P(l){l=l||W;u X=2a(l);u s=\'<P 4Q="P P-5g P-5e P-50">\\n<1S>\\n<19>6S #</19><19>2T 8w</19>\';s+="<19>4D<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'2h\',1o.T)\\"/></19><19>eg 8y</19><19>8z</19>";s+="<19>6V<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1O\',1o.T);c(1o.T){1C(\'1N\',13);}\\"/></19>";s+="<19>6U<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'1N\',1o.T);c(1o.T){1C(\'1O\',13);}\\"/></19>";s+="<19>6N<br/>8O<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'4E\',1o.T);c(1o.T){1C(\'4A\',13);}\\"/></19>";s+="<19>ei<br/>8O<br/><1m 1e=\\"1t\\" 1K=\\"1C(\'4A\',1o.T);c(1o.T){1C(\'4E\',13);}\\"/></19></1S>";u 1h="<1S><1a>{#}</1a>";1h+="<1a>{4F{#}}</1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"2h{#}\\" Q=\\"Y\\" ></1a>\\n";1h+="<1a><1m 1e=23 1g=\\"6F{#}\\" 3S=3 5c=3 Q=\\"\\" ></1a>\\n";1h+="<1a><1m 1e=23 1g=\\"42{#}\\" 3S=1 5c=1 Q=\\"\\" ></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1O{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'1N{#}\').T=13\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"1N{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'1O{#}\').T=13\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"4E{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'4A{#}\').T=13\\"></1a>\\n";1h+="<1a><1m 1e=1t 1g=\\"4A{#}\\"  Q=\\"Y\\" 1K=\\"c(1o.T)y.G(\'4E{#}\').T=13\\"></1a>\\n";1h+="</1S>";u j;R(j=0;j<X.w;j++){s+=1h.V(/{#}/g,""+(j+1)).V("{4F"+(j+1)+"}",X[j].V(/\\s+/g,"1r"))}s+="</P>";14 s}1c 6G(l,4U){u s;u j;l=l||W;c(y.G(\'83\'))l.ek=y.G(\'83\').Q;c(y.G(\'3U\'))l.2K=y.G(\'3U\').T;c(y.G(\'5S\'))l.87=y.G(\'5S\').T;c(y.G(\'5T\'))l.86=y.G(\'5T\').T;c(y.G(\'2S\')){W.2q(y.G(\'2S\').Q);c(13&&W.6c!=W.2Z){W.2Z=W.6c;W.2q(y.G(\'2S\').Q);c(y.G("4p"))y.G("4p").T=W.6c==="\'";4U=1v}}c(y.G(\'5H\')&&(W.4J!=W.1X||4U)){y.G(\'5H\').2i=7W(W);7V(l);W.4J=W.1X}c(y.G(\'5G\')&&(W.4J!=W.1X||4U)){y.G(\'5G\').2i=7P(W);W.4J=W.1X}c(y.G(\'5J\')&&(W.4J!=W.1X||4U)){y.G(\'5J\').2i=7Q(W);W.4J=W.1X}c(y.G("3b")){y.G("3b").2i="9E 4H- 7U: "+(((W.1u.w==0)&&(W.2K))?"er":W.2K+(W.2K?" &4I; 7U 7S: "+W.9v:""))+"\\n<br/>6M: "+" eq: "+(W.18=="\\t"?"em":W.18==" "?"el":W.18||" ")+" &4I; &4I; "+" 7S: "+W.1X+" &4I; &4I; "+" 4H: "+(W.6K<=0?"0":W.6K);c(W.2K){R(j=0;j<W.1u.w;j++){c(W.1u[j].ep()||W.1u[j]==""){y.G("3b").2i+="<br/><b>3W</b> - 9C 9s 9t 9u 9M 2I 6D 4u eo?";1j}}}R(j=0;j<W.9r.w;j++){y.G("3b").2i+="<br/><b>3W</b> - en 4u # "+W.9r[j].6I+" 6D 9D."}c(W.9H>0){y.G("3b").2i+="<br/><b>3W</b> - 4X 3k ev: "+W.9H}c(W.2K&&W.eu&&W.6K>0){y.G("3b").2i+="<br/><b>3W</b> - 9z 4u 4K 9y "+W.9v+" 21 9x 9A 3k do 6L: "+W.et}K c(W.es){y.G("3b").2i+="<br/><b>3W</b> - 9z 9o 1l 9y "+W.1X+" 21 9x 9A 3k do 6L: "+W.ej}c(W.2Z!=W.6c){y.G("3b").2i+="<br/><b>3W</b> - 9C 9s 9t 9u 92 eb ea 6D e9? <9G>(e7 9E e8)</9G>"}u 56;u 3i=0;u 93=["","9B ec 8Z 6W","6M ed 8Z 6W","6b eh 92 6W"];R(56 1P W.6O){3i++;c(3i>5){y.G("3b").2i+="<br/>...";1j}y.G("3b").2i+="<br/><b>3W</b> - "+93[W.6O[56].ee]+" at 1l: "+56+", ef:"+W.6O[56].4u}}}1c ew(){u 5O=13;c(y.G(\'8Y\'))5O=y.G(\'8Y\').T;c(y.G(\'8X\'))y.G(\'8X\').T=1v;c(W){W.18=",";W.4W=1v;W.2Z=\'"\';W.1T=\'"\';W.1X=0}c(y.G(\'2S\'))y.G(\'2S\').Q="";c(!5O)c(y.G(\'8R\'))y.G(\'8R\').Q="";c(y.G(\'8Q\'))y.G(\'8Q\').Q="";c(y.G(\'3U\'))y.G(\'3U\').T=1v;c(y.G(\'5S\'))y.G(\'5S\').T=13;c(y.G(\'5T\'))y.G(\'5T\').T=13;c(!5O)c(y.G(\'8S\'))y.G(\'8S\').2i="";c(y.G(\'5H\'))y.G(\'5H\').2i="";c(y.G(\'5G\'))y.G(\'5G\').2i="";c(y.G(\'5J\'))y.G(\'5J\').2i="";c(y.G(\'4p\'))y.G(\'4p\').T=13;c(y.G(\'6g\'))y.G(\'6g\').T=13;c(y.G(\'3M\'))y.G(\'3M\').T=13;c(y.G(\'4t\'))y.G(\'4t\').T=13;6G();97()}1c eN(eM){}1c 7d(2m){u j;c(!2m)14"";u 4N=2m.w;c(4N==4m)c(2m.T){14 2m.Q}K{14""}R(u i=0;i<4N;i++){c(2m[i].T){14 2m[i].Q}}14""}1c 8T(2m,4d){c(!2m)14;u 4N=2m.w;c(4N==4m){2m.T=(2m.Q==4d.1Y());14}4d=(4d||"")+"";c(4d==="\\t")4d="\\\\t";R(u i=0;i<4N;i++){2m[i].T=13;c(2m[i].Q==4d){2m[i].T=1v}}}1c 9j(){u 6y;u a,d,j,s,t;s="";R(j=1;j<=4;j++){6y=y.G(\'6w\'+j);c(!6y)1p;d=y.G(\'6w\'+j).Q;c(d=="")1p;t=y.G(\'eQ\'+j).Q;a=y.G(\'eR\'+j).Q;c(j>1)s+=",";s+=t+d+a}W.eJ(s);W.eC=1v;14 s}1c 97(){u dd;u j,k,o;R(j=1;j<=4;j++){dd=y.G(\'6w\'+j);c(!dd)1p;c(dd.J.w-1==W.1X)1j;dd.J.w=1;dd.e5=0;R(k=1;k<=W.1X;k++){o=y.9f("1B");o.23=o.Q=""+k;dd.J.dy(o)}}9j();c(2N(9i)==2N(dx))9i();c(y.G("9l"))y.G("9l").9b();c(1f)1f.1s=""}1c 2u(l){u a=[];u i,j;l=l||W;c(l.9m!=""){a=l.9m.2d(",");R(i=0;i<a.w;i++){a[i]=(a[i]+"").1y();c(1Q(a[i])&&a[i]>" "){R(j=0;j<l.1u.w;j++){c((a[i]+"").1D()==l.1u[j].1D())a[i]=j+1}}}R(i=a.w-1;i>=0;i--){c(1Q(a[i])||a[i]<1||a[i]>l.1X){a.dw(i,1)}}}c(a.w==0){R(i=0;i<l.1X;i++){a[a.w]=i+1}}c(a.w==0){R(i=0;i<l.1u.w;i++)a[a.w]=i+1}14 a}1c du(3a){u j;u 6u=[];R(j=0;j<3a.w;j++){u 6v={};R(k=0;k<3a[j].w;k++){6v[3a[j][k].4u]=3a[j][k].Q}6u[j]=6v}14 6u}1c 9p(){u s="1g,1F,2s,2t\\n"+"1,\\"2l, 2o, 2R 3n 3B.\\",4k.33,5n 3j 5k\\n"+"2,\\"4r \\"\\"4w 4v\\"\\" 2o\\",5x.44,\\n"+"3,\\"4j & 4s\\",0,\\"5s 5m 5q 3p\\n"+"2R 5r 5t 3p 5F.\\"\\n"+"4,2l\'s 4h,5P,\\n";14 s}1c dv(){u s="1g,1F/9o,1F/dz,7y/0,7y/1,7y/2\\n"+"1,dE,3n,8,7,9\\n"+"2,\\dC,dB,7,6,5\\n"+"3,ds,dk,4,3,\\n";14 s}1c dl(n){n=(n||1)-1;u s="<?6n 6i=\\"1.0\\"?>\\n"+"<5A>\\n"+"<2U>\\n"+"<1g>1</1g>\\n"+"<1F>2l, 2o, 2R 3n 3B.</1F>\\n"+"<2s>4k.33</2s>\\n"+"<2t>5n 3j 5k</2t>\\n"+"</2U>\\n"+"<2U>\\n"+"<1g>2</1g>\\n"+"<1F>4r &7x;4w 4v&7x; 2o</1F>\\n"+"<2s>5x.44</2s>\\n"+"<2t></2t>\\n"+"</2U>\\n"+"<2U>\\n"+"<1g>3</1g>\\n"+"<1F>4j &9a; 4s</1F>\\n"+"<2s>0</2s>\\n"+"<2t>5s 5m 5q 3p\\n"+"2R 5r 5t 3p 5F.</2t>\\n"+"</2U>\\n"+"<2U>\\n"+"<1g>4</1g>\\n"+"<1F>2l&dm;s 4h</1F>\\n"+"<2s>5P</2s>\\n"+"<2t></2t>\\n"+"</2U>\\n"+"</5A>";14 s}1c dF(n){n=(n||1)-1;u s=["[\\n"+"  {\\n"+"    \\"1g\\":1,"+"    \\"1F\\":\\"2l, 2o, 2R 3n 3B.\\",\\n"+"    \\"2s\\":4k.33,"+"    \\"2t\\":\\"5n 3j 5k\\"\\n"+"  },\\n"+"  {\\n"+"    \\"1g\\":2,"+"    \\"1F\\":\\"4r \\\\\\"4w 4v\\\\\\" 2o\\",\\n"+"    \\"2s\\":5x.44,"+"    \\"2t\\":\\"\\"\\n"+"  },\\n"+"  {\\n"+"    \\"1g\\":3,"+"    \\"1F\\":\\"4j & 4s\\",\\n"+"    \\"2s\\":0,"+"    \\"2t\\":\\"5s 5m 5q 3p\\\\dG 5r 5t 3p 5F.\\"\\n"+"  },\\n"+"  {\\n"+"    \\"1g\\":4,"+"    \\"1F\\":\\"2l\'s 4h\\",\\n"+"    \\"2s\\":5P,"+"    \\"2t\\":\\"\\"\\n"+"  }\\n"+"]\\n","{ \\"3a\\" : [\\n"+"  {"+"    \\"1g\\":1,"+"    \\"1F\\":\\"2l, 2o, 2R 3n 3B.\\""+"  },\\n"+"  {"+"    \\"1g\\":2,"+"    \\"1F\\":\\"4r \\\\\\"4w 4v\\\\\\" 2o\\""+"  },\\n"+"  {"+"    \\"1g\\":3,"+"    \\"1F\\":\\"4j & 4s\\""+"  },\\n"+"  {"+"    \\"1g\\":4,"+"    \\"1F\\":\\"2l\'s 4h\\""+"  }\\n"+"] }\\n","{ \\"dX\\" : \\n"+" { \\"dZ\\" : [\\n"+"  {"+"    \\"1g\\":11,"+"    \\"1F\\":\\"2l, 2o, 2R 3n 3B.\\""+"  },\\n"+"  {"+"    \\"1g\\":22,"+"    \\"1F\\":\\"4r \\\\\\"4w 4v\\\\\\" 2o\\""+"  },\\n"+"  {"+"    \\"1g\\":33,"+"    \\"1F\\":\\"4j & 4s\\""+"  },\\n"+"  {"+"    \\"1g\\":44,"+"    \\"1F\\":\\"2l\'s 4h\\""+"  }\\n"+"] }\\n}\\n","{\\n"+"    \\"1g\\":1,"+"    \\"1F\\":\\"2l, 2o, 2R 3n 3B.\\","+"    \\"2s\\":4k.33,"+"    \\"2t\\":\\"5n 3j 5k\\"\\n"+"}\\n","[\\n"+"    ["+"      1,"+"      \\"2l, 2o, 2R 3n 3B.\\","+"      4k.33"+"    ],\\n"+"    ["+"      99,"+"      \\"dM dN dR.\\","+"      dQ.55"+"    ]\\n"+"]"];14 s[n]}1c eW(){u s="95 gi,$ g7,fQ,fR,fY\\n"+"fV g0 fZ g2,\\"$34,g3\\",91,37.g5,-85.fU\\n"+"g6,\\"$g9,gf\\",gc,44.g4,-68.fg\\n"+"ff,\\"$65,fe\\",fh,32.fi,-84.fm\\n"+"fl 2l ,\\"$17,fj\\",90,36.fb,-82.f1\\n"+"f4,\\"$54,f8\\",9q,39.f7,-77.fo\\n"+"fG fH 9e,\\"$12,fI\\",fK,37.fC,-78.fu\\n"+"ft fs,\\"$51,fq\\",9q,38.fv,-75.fx\\n"+"8P fy,\\"$fz,fr\\",fB,29.fJ,-fM.fD\\n"+"8P fE fF 95 f6 2R f9 f5,\\"$3,eZ\\",\\"90, 91\\",36.cu,-84.aq\\n";14 s}1c de(){u s="1     2l, 2o, 2R 3n 3B.  4k.33     5n 3j 5k                  \\n"+"2     4r \\"4w 4v\\" 2o            5x.44              \\n"+"3     4j & 4s               0          5s 5m 5q 3p 2R 5r 5t 3p 5F.      \\n"+"4     2l\'s 4h           5P        \\n";14 s}1c cE(n){u s=\'{ \\n    \\"1e\\": \\"7k\\",\\n    \\"1V\\": [\\n      { \\"1e\\": \\"5L\\",\\n        \\"27\\": {\\"1e\\": \\"3x\\", \\"2f\\": [-75.cC, 39.cB]},\\n        \\"4L\\": { \\n          \\"1F\\": \\"6P A\\",\\n          \\"6X\\": \\"cF\\"\\n        }\\n      },\\n      { \\"1e\\": \\"5L\\",\\n        \\"27\\": {\\"1e\\": \\"3x\\", \\"2f\\": [-80.24, 40.12]},\\n        \\"4L\\": { \\n          \\"1F\\": \\"6P B\\",\\n          \\"6X\\": \\"9e\\"\\n        }\\n      },\\n      { \\"1e\\": \\"5L\\",\\n        \\"27\\": {\\"1e\\": \\"3x\\", \\"2f\\": [ -77.2, 41.cp]},\\n        \\"4L\\": { \\n          \\"1F\\": \\"6P C\\",\\n          \\"6X\\": \\"co\\"\\n        }\\n      }\\n    ]\\n  }\';14 s}1c 9d(2M){u s=y.9f("cn");s.1e="23/cl";s.1g="cq";s.cr=2M;y.cx("4z")[0].cw(s)}1c 9g(2M){c(!2M.bo(\'?\')){2M=\'?\'+2M}9d("9c://cL.d5-d4.98/d3-d1/2M-5m-d2.d6"+2M)}1c 9h(3a){y.G(\'2S\').Q=3a.d7.2Y("\\n");y.G(\'da\').9b()}1c d0(2M){c(2M.1y()==""){6J("6b cQ");14 13}9g("?cP=9h&2M="+cN(2M))}1c cO(23,4g){u 4g=4g?4g:3;c(2N 1L===\'4m\')14 23;3N{c(2N 23==="6o")14 1L.3r(1L.2q(23),1A,4g);c(2N 23==="3O")14 1L.3r(23,1A,4g)}3Q(e){}14 23}1c 9n(o){c(2N o==="6o"){o=1L.2q(o)}u s=1L.3r(o,1A,"\\t").2d(/\\r\\n|\\n|\\r/gm);u 5B=0;u j,a;R(j=0;j<s.w;j++){c(s[j].53(0)!="\\t")1p;a=s[j].cY(/\\t+/gm);c(a[0].w>5B)5B=a[0].w}14 5B+1}1c 8U(23,fn,cX){u 9k=6j cW([23],{1e:"23/cV;cj=bG-8"});bH(9k,fn)}1c bL(1g,7o){u fn="96";u 7e="";c(7o){7e=1L.2q(1L.3r(W))}c(y.G("fn")){fn=y.G("fn").Q}W.4W=1v;W.2K=13;W.2Z=\'"\';c(y.G("5V")&&y.G("bM")){W.18=7d(y.5V.bR)||",";c(W.18==="o"){W.18=y.G("bQ").Q}W.4W=13}c(y.G("6g")){c(y.G("6g").T){W.2Z="\'"}}c(y.G(1g)){W.2q(y.G(1g).Q)}K{W.2q(1g)}bP(\'5Y * 64 bN("\'+fn+\'.bO",{bF:13}) 5b ?\',[W.P]);c(7o){W=1L.2q(1L.3r(7e))}14 13}1c bE(23,8V){u 35="\\r\\n";u fn=y.G(\'fn\').Q.1y();c(fn==""){fn=y.G(\'fn\').Q="96"}c(y.G("35"))35=y.G("35").Q||35;c(35=="bv")35="\\n";c(35=="bu")35="\\r\\n";u v=23.V(/\\r\\n|\\r|\\n/gm,35);8U(v,fn+"."+8V,1A)}1c bq(){u 18="";u q="";u bs=0;u 5d="";u 4T="";c(!3h.79())14;c(3h.8W()==1A)3h.bw("Y");c(3h.8W()!="Y")14;c(y.G(\'2S\')&&7l.45("7D")!="Y"){c(y.G("3U")){y.G("3U").T=3I.45("bC")=="Y";18=3I.45("bB");8T(y.9F["5V"].43,18);q=3I.45("bz");bs=3I.45("bA");5d=3I.45("4q");4T=3I.45("3M");W.4W=1v;c(18&&18!=""){W.4W=13;W.18=18}c(q&&q!=""){W.2Z=q;c(y.G("4p")){y.G("4p").T=(q==="\'")}}c(4T&&4T!=""){c(y.G("3M")){W.94=(4T=="Y");y.G("3M").T=W.94}}c(5d&&5d!=""){c(y.G("4q")){y.G("4q").T=(5d==="Y")}}W.74=13;c(bs!=""){W.74=(bs==="Y");c(y.G("4t")){y.G("4t").T=W.74}}}cc(3h.ca())}7l.6k("7D","")}1c c9(){u q=W.2Z||\'"\';u bs="N";c(!3h.79())14;c(y.G("4q"))3I.6k("4q",(y.G("4q").T)?"Y":"");c(y.G("3M"))3I.6k("3M",(y.G("3M").T)?"Y":"");c(y.G("4t"))bs=y.G("4t").T;c(y.G(\'2S\')){c(y.G(\'2S\').Q!=9p()&&y.G(\'2S\').Q.w>0){3h.ci(y.G(\'2S\').Q,y.G("3U").T?"Y":"N",7d(y.9F["5V"].43),q,bs?"Y":"N")}}}1c cg(){c(3h&&3h.79()){7l.6k("7D","Y")}cf.c7.c6(1v)}1c 1W(v,k,l){u d;c(y.G("2h"+(k+1)))c(y.G("2h"+(k+1)).T)v=v.1y();c(y.G("60"+(k+1)))c(y.G("60"+(k+1)).T)v=v.bY();c(y.G("62"+(k+1)))c(y.G("62"+(k+1)).T)v=v.6t();c(y.G("1O"+(k+1)))c(y.G("1O"+(k+1)).T)v=v.1D();c(y.G("1N"+(k+1)))c(y.G("1N"+(k+1)).T)v=v.3l();c(y.G("3D"+(k+1)))c(y.G("3D"+(k+1)).T)v=v.bX();c(y.G("6l"+(k+1)))c(y.G("6l"+(k+1)).T){c(l.16[k]){c(l.16[k].1i!="N"&&l.16[k].1i!="I")v=v.9w()}K{v=v.9w()}}c(y.G("5K"+(k+1)))c(y.G("5K"+(k+1)).T)v=v.bW();c(y.G("42"+(k+1))){c(y.G("42"+(k+1)).Q!=""){d=y.G(\'42\'+(k+1)).Q;c(1Q(d))d=0;K d=d*1;c(l.16[k]&&(l.16[k].1i=="N"||l.16[k].1i=="I"||l.16[k].1i=="B")){c(v.1y()!=""){v=(v.4M().4C(d)+"")}}}}14 v}1c bZ(3j){W.1T=3j?"\'":\'"\'}1c c0(3j){W.2Z=3j?"\'":\'"\';6G(W,1v)}1c 1C(1F,7Y){u j;u 2j;R(j=0;j<W.1X;j++){2j=y.G(1F+(j+1));c(!2j)1p;2j.T=7Y}}', 62, 1015, '||||||||||||if|||||||||oCsv|||||||||var||length||document||||||||getElementById|||options|else|||||table|value|for||checked||replace|CSV|hdr||tp||||false|return||statsCnt||delimiter|th|td|case|function|array|type|csvRedQuery|id|template|fieldType|break|bQuotes|line|input|where|this|continue|NULL|_|query|checkbox|arHeaderRow|true|tem|toSql|trim|eval|null|option|setCheckboxes|toUpperCase|geo|name|kp|usrhdr|left|toCsv|onclick|JSON|str|chklower|chkupper|in|isNaN|newlines|tr|outputQuote|stats|features|doTransformations|maxColumnsFound|toString|fsize|chknull|columns||text||queryGetVal|incl|geometry|rownum||getCsvHeader|mongoDbMode|push|split|keyvalue|coordinates|keys|ftrim|innerHTML|fld|noMultiLines|Johnson|radioObj|newa|Smith|addsep|parse|DT|amount|Remark|getFldPosArr|ftype|title|batch|slice|rpad|tableName|NR|IT|fdec|useNullForEmpty|useNullAsNull|cols|addLineNumbers|row|VC|isFirstRowHeader|emptyIsNull|url|typeof|col|batchSize|BI|and|txt1|Field|ROW|ftem|cur|index|join|quote||bIncludeHeaders||||eol|||||data|divInputCounts|selected|longCol|altCol|latCol|addXSpaces|storageSup|cnt|on|lines|toLowerCase|isObject|Jones|FIELD|with|switch|stringify|getDecimalChar|nullIsNull|excelForceMode|sumFields|toHtml|Point|addTable|descCol2|topLevel|Co|operation|chkProper|freq|global|NC|NVC|localStorage|dups|altitude|forceWrap|chkIgnoreDoubleQuote|try|object|isArray|catch|createTable|size|objArray|chkHeader|crow|WARNING|colArray|fheader|addFieldNameSep|||fdecimals|sep||getItem|test|temValuesSet|fieldDecs|useTerseValuesSize|Number|linewidth|ruler|newValue|attr1|attr2|step|Automotive|kn|Barney|345|default|undefined|addHeaderIfMissing|insertAfterText|chkInputQuote|chkReplaceAccents|Sam|Company|chkDecodeLiterals|column|Dog|Mad|colnum|temHandler|head|chkcjust|substr|toFixed|Trim|chkrjust|FIELDNAME|right|Records|nbsp|prevColumnsFound|header|properties|toNumber|radioLength|firstArray|values|class|rowLevel|temOptions|idq|forceOptions|latitude|autodetect|Empty|VC2|fname|condensed||NOT|charAt|||bad|valueArray|Object|AS|includeCnt|FROM|maxlength|acc|hover|of|bordered|substring|len|addSummary|time|toJson|to|Pays|ruler10|topName|work|always|Great|pays|fldcnt|longitude|DECSIZE|993|dualNeeded|thead|ROWSET|level|csvFormat|centerAdjust|cmd|cash|divFlatOptions|divOptions|toLocaleLowerCase|divMinOptions|chkcrunch|Feature|Use|big|appendMode|2344|rowName|defaultHeader|chkHeaderUpper|chkHeaderLower|headingSpecified|frm1|EXISTS|tbody|SELECT|includeNotKeyCnt|ftriml|seqobj|ftrimr|fldpad|INTO||finc|useTerseValues||rightAdjust|keycnt|Missing|detectedQuote|AND|IF|yep|chkOutputQuote|indexOf|version|new|setItem|chkpunct|desc2|xml|string|txtKeyNum|align|isKeyed|kml|rtrim|newo|rec|selSortFld|Document|ddFld|inJsonForm|Type|nameCol|lb|is|rb|fpadsize|parseAndOptions|rulerdash|field|alert|dataRowsFound|not|Data|Right|relaxedInfo|Location|descCol|Field1|Col|seq|Lower|Upper|character|category|isInteger|FTITLE|coltag|SET|delete|depth|decodeBackslashLiterals||gmi|||has_html5_storage|WHEN|WHERE|attr1Row|radiovalue|old|enclose|attr2Row|UPDATE|getCsvColLength|ON|FeatureCollection|sessionStorage|recurse|TABLE|resetCsv|VALUES|MAX_VALUE|UNION|fkey|KEY|curr|PRIMARY|INSERT|quot|rating|delete_null_properties|CREATE|VIEW|THEN|clearPressed|ALL|csv|MATCHED|nowiki|notrim|nowrap|temGetVal|fieldDef|nf|addLineSep|addRuler|flatOptions|minOptions|REPLACE|Fields|createNotExists|Header|setOptions|sqlOptions|csv2jsonObj|tf|DELETE||selAutoIncrement||txtRowLimit|||headerToLower|headerToUpper|nInit|tmp|addLineAfterField|next|skipEmpty|freq1|emptyCnt|Left|isEmpty|temCond|Remove|fkey1|Date|Counts|FIELDSIZE|temFoot|Placemark|Total|useFieldsData|select|temBetween|100|Ex|Sum|Name|savnewlines|Size|Decimals|addFieldName|spacing|csvToJSONSpecial|dualTableName|myView|SeqObj|neverEnclose|temHead|toXml|Array|flatten|every|tfoot|DROP|Justify|Big|txtCols|txta|diva|setRadioValue|saveOutput|ext|getCacheCsv|sepAuto|chkAppend|quoting|TN|KY|Quoting|msg|ignoreQuote|National|convertcsv|setupSortDD|com||amp|click|http|loadScript|House|createElement|loadScriptAndRun|loadDataAndRun|csvCreateQueryUI|sortStr|blob|btnColsReset|displayPoss|getJsonLevel|first|getExampleCsv|MD|headerErrors|you|sure|your|headerColumns|removePunctuation|but|has|Your|these|Spaces|Are|empty|Input|forms|small|skipEmptyRowCnt|DETACH|DEFAULT|seqtype|GLOB|First|DEFERRED|FULL|DESC|DEFERRABLE|EACH|FOR|EXCLUSIVE|FAIL|csvToSql|EXCEPT|FOREIGN|EXPLAIN|ELSE|END|ESCAPE|DISTINCT|CURRENT_TIME|BEFORE|AUTOINCREMENT|BEGIN|BETWEEN|CASCADE|BY|dropExists|ATTACH|AFTER|ADD|ALTER|ANALYZE|ASC|CASE|CAST|CURRENT_DATE|CROSS|WITHOUT|CURRENT_TIMESTAMP|dropTable|CONSTRAINT|CONFLICT|6743069824|CHECK|COLLATE||COLUMN|COMMIT|DATABASE|INDEXED|RECURSIVE|UNIQUE|REFERENCES|REGEXP|REINDEX|RAISE|QUERY|OUTER|ORDER|USING|PLAN|PRAGMA|TRIGGER|TRANSACTION|ROLLBACK|RIGHT|SAVEPOINT|SUM|SYSDATE|RESTRICT|TEMP|RELEASE|TO|RENAME|TEMPORARY|OR|OFFSET|INNER|INITIALLY|INSTEAD|VIRTUAL|INTERSECT|INDEX|IN|HAVING|WITH|IGNORE|IMMEDIATE|IS|ISNULL|NATURAL|ACTION|NO|NOTNULL|OF|MATCH|LIMIT|VACUUM|JOIN|LEFT|LIKE|GROUP|startsWith|csvToJSON|loadCsv|||tryToObject|CRLF|LF|setCacheCsv|csvToXmlProperties||csvQuote|csvBackslash|csvDelimiter|csvChkHeader|csvToXml|saveFile|headers|utf|saveAs|csvToJSONArray|fldPropName|fields|saveExcel|outSepComma|XLSX|xlsx|alasql|outSepOtherVal|outsep|style|wikitable|csvFromTem|while|crunch|toProperCase|ltrim|setOutputSingleQuote|setInputSingleQuote|rn|reset|nr|nh|tab|reload|location|Record|saveCsv|getCsv|csvToWikiTable|assignText|Value|csvToTableHeaderValue|window|clearPage|csvToTable|putCsv|charset|dataPropName|javascript|csvToMulti|script|Office|427|dynScriptTemp|src|pop|fixedToCsv|3837375235||appendChild|getElementsByTagName|csvToKml|encoding|csvToCsv|984|343|transposeCsv|getExampleGeoJson|Store|description|UTF|xmlns|earth|google|www|12346789|encodeURIComponent|prettyJSON|callback|URL|csvToFixed|throw|jsonToCsv|csvToJSONColumnArray|plain|Blob|doctype|match|rulerSize|loadURL|bin|json|cgi|usa|ddginc|php|html|nullIsEmpty|cjust|btnRun|rjust|isSqlKeywords||getExampleFlat|Bit|Time|Boolean|Money|Serial|Smoe|getExampleXml|apos|Numeric||Int|Integer|BigInt|Joe|readonly|flattenSqlJson|getExampleCsvJson|splice|Function|add|last|Varchar|Barner|Bill|200|Dan|getExampleJson|nand|decimals|Max|Dec|Key|Include|Acme|Food|lt|gt|2993|Inc|Required|keyword|VarChar2|NVarChar|Char|race|NChar|entries|VarChar|Modify|output|using|Choose|selectedIndex|chkNullJson|See|Options|correct|setting|Character|before|after|error|Column|Pad|end|Center|fieldImbalanceRows|limit|Space|Tab|Heading|names|isNumeric|Separator|missing|fieldImbalance|headerImbalanceRows|headerImbalance|skipped|clearAll|places|Case|Proper|Punctuation|Crunch|mySortNeeded|rest|the|1st|letter|word|capitalized|setSortFlds|punctuation|instead|colpos|getUserOptions|Specify|decimal|selSortType|selSortAsc|Replace|or|more|spaces|getExampleKml|Template|CHAR|009||8370902853041|NCHAR|VARCHAR2|Antietam|Area|River|462381614|743|Recreation||1562449930463|VARCHAR|DATETIME|133|Andersonville|2397319808|GA|197905290823|949|NVARCHAR|Andrew|1302615685733||7359854016|String|921|983|Island|Assateague|8027430409|0556022623662|nUSING|2453836072023|Bend|535|MERGE|TX|3826448073|311115521|South|Fork|Appomattox|Court|651|0103562389|VA|useReplace|103|SERIAL|DATE|NUMERIC|State|Latitude|BIGINT|INT|6442940021|Abraham|INTEGER|NUMBER|Longitude|Birthplace|Lincoln|fieldPrec|NHS|584|3593807753|6116333423|Acadia|Obligated|nFROM|102|endsWith|htmlEscape|ME|mgi|mytable|631|geoJsonToCsv|BIT|Park|MONEY|obj|BOOLEAN|'.split('|'), 0, {}))



//eval(function (p, a, c, k, e, d) { e = function (c) { return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36)) }; if (!''.replace(/^/, String)) { while (c--) { d[e(c)] = k[c] || e(c) } k = [function (e) { return d[e] }]; e = function () { return '\\w+' }; c = 1 }; while (c--) { if (k[c]) { p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]) } } return p }('i 10={H:",",T:",",1W:V,O:\'"\',1d:{"\'":0,\'"\':0},1R:\'"\',1m:\'"\',1h:\'\',U:V,21:y,2h:y,1X:V,1N:0,20:V,1J:y,Z:{},1U:V,2A:y,1M:y,1F:y,1r:[],1H:y,1s:[],1E:[],1B:y,1O:X(){m(0).2B(1).1o(1)},12:0,1k:0,2t:0,1b:0,o:[],h:[],9:[],2o:"",1p:"",22:y,1Z:X(s){i j;i n=s.8-1;i a=[];i c;z(j=0;j<n;j++){c=s.1o(j);6(c=="\\\\"){28(s.1o(j+1)){Q\'\\\\\':c="\\\\";j++;w;Q\'b\':c="\\b";j++;w;Q\'f\':c="\\f";j++;w;Q\'n\':c="\\n";j++;w;Q\'r\':c="\\r";j++;w;Q\'t\':c="\\t";j++;w;Q\'v\':c="\\v";j++;w;Q\'"\':c=\'"\';j++;w;Q"\'":c="\'";j++;w;Q",":c=",";j++;w;27:w}}a.R(c)}6(j==n){a.R(s.1o(n))}m a.1Y(\'\')},2m:X(13,1j){i j,k;i s="";i 1n="";1j=1j||X(r,c,v){m v};4.h=[];4.9=[];4.o=[];4.12=0;4.1b=0;4.1k=0;4.Z={};i d=13.1S(\'\');13="";i c=0;i 1D="";i P=d.8;i 1g,1i,u;i 11=0;i 1l=y;i 1L;i 1q;i 1u=y;i 1G=0;i 1c=0;6(4.1h!=\'\'&&1z(4.1h))4.1h=\'\';7={M:0,J:0,E:0,F:0,K:0,1P:0,A:0};4.1d={"\'":0,\'"\':0};z(j=0;j<P;j++){6(j>1&&(d[j]==\'\\r\'||d[j]==\'\\n\'))w;6(d[j]==",")7.M++;6(d[j]==";")7.J++;6(d[j]=="\\t")7.E++;6(d[j]=="|")7.F++;6(d[j]==":")7.K++;6(d[j]=="^")7.A++;6(d[j]==" ")7.1P++}4.T=4.H||\',\';6(7.E>0&&7.E>=7.M&&7.E>=7.F&&7.E>=7.J&&7.E>=7.K&&7.E>7.A)4.T="\\t";x 6(7.J>0&&7.J>7.M&&7.J>7.F&&7.J>7.E&&7.J>7.K&&7.J>7.A)4.T=";";x 6(7.K>0&&7.K>7.M&&7.K>7.F&&7.K>7.E&&7.K>7.J&&7.K>7.A)4.T=":";x 6(7.F>0&&7.F>7.M&&7.F>7.J&&7.F>7.E&&7.F>7.K&&7.F>7.A)4.T="|";x 6(7.A>0&&7.A>7.M&&7.A>7.F&&7.A>7.J&&7.A>7.E&&7.A>7.K)4.T="^";x 6(7.M>7.E&&7.M>7.F&&7.M>7.J&&7.M>7.K&&7.M>7.A)4.T=",";x 4.T=",";6(7.E==0&&7.M==0&&7.F==0&&7.K==0&&7.J==0&&7.A==0&&7.1P>0)4.T=" ";6(4.1W)4.H=4.T;4.1N=0;17(c<P){6(4.1X&&(d[c]==\'\\r\'||d[c]==\'\\n\')){c++;4.1N++;26}4.h.R(u=[]);6(4.1M&&u.8===0&&4.h.8===1&&4.U)u.R("#");x 6(4.1M&&u.8===0)u.R(""+(11+1-(4.U?1:0)));1u=y;1q=c;17(c<P&&d[c]!==\'\\r\'&&d[c]!==\'\\n\'){1L=1g=1i=c;6(4.20){17(d[c]===\' \'){++c;1u=V}6(d[c]===4.O&&!4.1J){6(1u&&!4.Z[""+(4.h.8+1c)])4.Z[""+(4.h.8+1c)]={"1A":1,"1K":c-1q+1};1g=c}x{c=1L}}6(4.1U){6((d[c]===\'=\')&&(c+1<P)&&(d[c+1]===4.O)){1g=++c;1l=V}}6(4.O===d[c]&&!4.1J){1g=1i=++c;4.1d[4.O]++;17(c<P){6(d[c]===4.O){6(4.O!==d[c+1]){w}x{d[++c]=\'\'}}1i=++c}6(d[c]===4.O){++c;6(c<P&&d[c]!==\'\\r\'&&d[c]!==\'\\n\'&&4.H!==d[c]){6(!4.Z[""+(4.h.8+1c)])4.Z[""+(4.h.8+1c)]={"1A":2,"1K":c-1q+1}}}x{6(!4.Z[""+(4.h.8+1c)])4.Z[""+(4.h.8+1c)]={"1A":3,"1K":c-1q+1}}17(c<P&&d[c]!==\'\\r\'&&d[c]!==\'\\n\'&&4.H!==d[c]){++c}}x{1D="";17(c<P&&d[c]!==\'\\r\'&&d[c]!==\'\\n\'){6(d[c]===4.H&&!4.1B)w;6(d[c]===4.H&&4.1B&&1D!=="\\\\")w;1D=d[c];1i=++c}}u.R(1j(4.h.8-1,u.8,d.2k(1g,1i).1Y(\'\')));6(4.1B){u[u.8-1]=4.1Z(u[u.8-1])}6(4.H==\' \'){17(c<P&&d[c]==4.H){++c}}6(4.H===d[c]){++c}}6(d[c-1]==4.H&&4.H!=\' \')u.R(1j(4.h.8-1,u.8,\'\'));6(u.8>4.12)4.12=u.8;6(d[c]===\'\\r\'){++c}6(d[c]===\'\\n\'){++c}6(!4.U||11>0){z(j=0;j<u.8;j++){6(j>=4.9.8||11==0){4.9[j]={18:0,1a:0,14:0,S:0,16:0,19:0,1l:y,G:"",1C:0,1w:0,1v:23.2e,1t:0}}s=(j<u.8)?u[j].Y(/^\\s+|\\s+$/g,\'\'):"";6(4.1U&&s.8>2&&s.1T(0,2)===\'="\'&&s.1T(s.8-1)===4.O){4.9[j].1l=V;i e=2c 2i(4.O+4.O,"2f");s=u[j]=s.1T(2,s.8-3).Y(e,4.O)}i 1e="\'";6(1e===4.O)1e=\'"\';6(s.1o(0)===1e&&s.2x(1e))4.1d[1e]++;6(s==""){4.9[j].S++}x{6(s.8<4.9[j].1v)4.9[j].1v=s.8;6(s.8>4.9[j].1t)4.9[j].1t=s.8}1n=s;6(1n!=""&&1n.2z()){4.9[j].14++;i 1f=1n.1S(4.1O());6(1f[0].8>4.9[j].1w)4.9[j].1w=1f[0].8;6(1f.8>1){6(1f[1].8>4.9[j].1C)4.9[j].1C=1f[1].8}6(s.2v(4.1O())<0)4.9[j].1a++;6(s==="0"||s==="1")4.9[j].16++}6(s.2r()){4.9[j].18++}6(s.W()==="2u"||s.W()==="2s"){4.9[j].19++}}}11++;6(4.1h!=\'\'&&11-(4.U?1:0)>=4.1h*1)w}6(11<=0){4.1b=0}x{4.1b=11-(4.U?1:0)}4.1E=[];6(4.U&&4.h.8>0){4.o=4.h.2p();4.1k=4.o.8;z(j=0;j<4.1k;j++){6(4.o[j].1Q()==""){4.1E.R({"1A":1,"2y":(j+1)})}}z(j=0;j<4.12;j++){6(!4.o[j]||4.o[j]=="")4.o[j]="2g"+(j+1);4.o[j]=4.o[j].1Q()}}4.1F=y;4.1r=[];6(4.1b>0)4.1r.R(1);4.1s=[];4.1H=y;1G=4.1b>0?4.h[0].8:0;z(k=0;k<4.h.8;k++){6(4.h[k].8<4.12){z(j=4.h[k].8;j<4.12;j++){6(j>=4.9.8){4.9[j]={18:0,1a:0,14:0,S:0,16:0,19:0,1l:y,G:"",1C:0,1w:0,1v:23.2e,1t:0}}4.9[j].S++}}6(4.U&&4.1k!=4.h[k].8){4.1H=V;6(4.1s.8<5){4.1s.R(k+2)}}6(!4.U&&1G!=4.h[k].8){4.1F=V;6(4.1r.8<5)4.1r.R(k+1)}}6(4.o.8>0){z(j=0;j<4.o.8;j++)4.1I(j)}x 6(4.h.8>0){z(j=0;j<4.12;j++){6(!4.o[j]||4.o[j]=="")4.o[j]="2g"+(j+1);4.1I(j)}}z(j=0;j<4.o.8;j++){6(4.21)4.o[j]=4.o[j].W();6(4.2h)4.o[j]=4.o[j].2q()}6(4.1p!=""){4.h.2w(4.29)}6(4.1d[\'"\']>=4.1d["\'"])4.1R=\'"\';x 4.1R="\'";m 0},2C:X(25){10.1p=25.1Q()},29:X(a,b){6(10.1p=="")m 0;i p=[];i q=[];i t=[];p=10.1p.1S(",");z(j=0;j<p.8;j++){q[j]=1;t[j]="";6(p[j].1V(1).W()==\'D\'){q[j]=-1;p[j]=p[j].2a(p[j].8-1)}28(p[j].2a(1).W()){Q\'C\':t[j]=\'C\';p[j]=p[j].1V(p[j].8-1);w;Q\'N\':t[j]=\'N\';p[j]=p[j].1V(p[j].8-1);w;27:w}}z(j=0;j<p.8;j++)6(!1z(p[j]))p[j]=(p[j]*1)-1;x p[j]=-1;z(j=0;j<p.8;j++)6(p[j]>=a.8)p[j]=-1;z(j=0;j<p.8;j++){6(p[j]<0)26;6(!1z(a[p[j]].Y(/[\\$,]/g,""))&&!1z(b[p[j]].Y(/[\\$,]/g,""))&&10.1b==10.9[p[j]].14+10.9[p[j]].S&&t[j]!=\'C\'){6(a[p[j]].Y(/[\\$,]/g,"")*1<b[p[j]].Y(/[\\$,]/g,"")*1)m-1*q[j];6(a[p[j]].Y(/[\\$,]/g,"")*1>b[p[j]].Y(/[\\$,]/g,"")*1)m 1*q[j]}x{6(10.22){6(a[p[j]].W()<b[p[j]].W())m-1*q[j];6(a[p[j]].W()>b[p[j]].W())m 1*q[j]}x{6(a[p[j]]<b[p[j]])m-1*q[j];6(a[p[j]]>b[p[j]])m 1*q[j]}}}m 0},1I:X(l){i j=0;i k=0;6(4.h.8==0)m"";6(l>=4.9.8)4.9[l]={18:0,1a:0,14:0,S:0,16:0,19:0,G:""};6(4.h.8==4.9[l].16){4.9[l].G="B";m"B"}6(4.h.8==4.9[l].19){4.9[l].G="L";m"L"}6(4.h.8==4.9[l].18){4.9[l].G="D";m"D"}6(4.h.8==4.9[l].1a){4.9[l].G="I";m"I"}6(4.h.8==4.9[l].14){4.9[l].G="N";m"N"}6(4.9[l].16>0&&4.h.8==4.9[l].16+4.9[l].S){4.9[l].G="B";m"B"}6(4.9[l].19>0&&4.h.8==4.9[l].19+4.9[l].S){4.9[l].G="L";m"L"}6(4.9[l].18>0&&4.h.8==4.9[l].18+4.9[l].S){4.9[l].G="D";m"D"}6(4.9[l].1a>0&&4.h.8==4.9[l].1a+4.9[l].S){4.9[l].G="I";m"I"}6(4.9[l].14>0&&4.h.8==4.9[l].14+4.9[l].S){4.9[l].G="N";m"N"}4.9[l].G="2d";m"2d"},2j:X(1y,1x){1x=1x||X(r,c,v){m v};i 13=\'\';i c;i P;i r;1y=1y||"\\n";6(4.U)4.h.2l(4.o);i 2b=4.h.8;i 24=2c 2i("["+4.H+"\\r\\n]","2f");i 15;z(r=0;r<2b;++r){6(r){13+=1y}z(c=0,P=4.h[r].8;c<P;++c){6(c){13+=4.H}15=1x(r,c,4.h[r][c]);6(24.2n(15)){15=4.1m+15.Y(/"/g,4.1m+4.1m)+4.1m}13+=(15||0===15)?15:\'\'}}m 13}};', 62, 163, '||||this||if|detect|length|statsCnt||||chars||||table|var|||colPos|return||arHeaderRow||||||row||break|else|false|for|caret||||tab|pipe|fieldType|delimiter||semi|colon||comma||quote|cc|case|push|emptyCnt|detectedDelimiter|isFirstRowHeader|true|toUpperCase|function|replace|relaxedInfo|CSV|cnt|maxColumnsFound|csv|realCnt|cell|bitCnt|while|dateCnt|logicalCnt|intCnt|dataRowsFound|brcnt|quoteCharCnt|ch|dc|start|limit|end|reviver|headerColumns|equalUsed|outputQuote|ss|charAt|sortPoss|linestart|fieldImbalanceRows|headerImbalanceRows|fldMaxLen|spacesFound|fldMinLen|fieldPrec|replacer|eol|isNaN|error|decodeBackslashLiterals|fieldDecs|prevCh|headerErrors|fieldImbalance|firstRowColumnsFound|headerImbalance|determineCsvColType|ignoreQuote|column|savestart|addSequence|skipEmptyRowCnt|decimalChar|space|trim|detectedQuote|split|substr|excelMode|right|autodetect|skipEmptyRows|join|unescapeLiterals|relaxedMode|headerToUpper|sortIgnoreCase|Number|re|flds|continue|default|switch|sortCsv|left|rr|new|VC|MAX_VALUE|gmi|FIELD|headerToLower|RegExp|stringify|slice|unshift|parse|test|displayPoss|shift|toLowerCase|isDateMaybe|FALSE|prevColumnsFound|TRUE|indexOf|sort|endsWith|field|isNumeric|sortNeeded|toFixed|setSortFlds'.split('|'), 0, {}))


