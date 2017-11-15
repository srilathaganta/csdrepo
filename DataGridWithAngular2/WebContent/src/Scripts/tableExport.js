var tdData = "";

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
PdfdefaultsInf.customText='';
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
		                        columns[i][index] = getTextFromFirstChild($(this));
		                        irowSpan[i][index] = ($(this).prop('rowSpan'));
		                        icolSpan[i][index] = ($(this).prop('colSpan'));
		                    }

		                });
		            });

		            columns = generateArrayPDF(columns);
		            var newString = "";
		            for (var i = 0; i < columns.length; i++) {
		                if (columns[i].length > 1) newString += "\n";
		                newString += columns[i].join(defaults.separator);
		            }
		            columns.fill("");
		            tdData += "\n"; tdData += "\n";
		            tdData += newString;

		            // Row vs Column
		            $('#' + value).find('tbody').find('tr').each(function () {
		                tdData += "\n";
		                $(this).filter(':visible').find('td').each(function (index, vv) {
		                    if ($(this).css('display') != 'none') {

		                        tdData += getTextFromFirstChild($(this)) + defaults.separator;
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
         
            // FOOTER
            var str = "Page " + data.pageCount;
            // Total page number plugin only available in jspdf v1.0+
            if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
            }
            doc.setFontSize(10);
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
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                    margin: { top: parseInt(PdfdefaultsInf.customtextLines) *10 }, styles: { fillColor: RowEvenStyle[0], textColor: RowEvenStyle[1], fontStyle: 'normal' },
                    headerStyles: { textColor: HeaderStyle[1], fillColor: HeaderStyle[0], fontStyle: 'bold' },
                    body: {},
                    alternateRowStyles: { textColor: RowOddStyle[1], fillColor: RowOddStyle[0] }, 
                    startY: tablestartpos,
                    pageBreak: 'avoid'
                });
        }
        else {
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                margin: { top: parseInt(PdfdefaultsInf.customtextLines) * 10 },
                startY: tablestartpos//,
            });
        }

        tablecount += 1;
            });
        }
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

