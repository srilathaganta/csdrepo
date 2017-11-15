"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
require("rxjs/add/operator/toPromise");
require("Scripts/pdfExternal.js");
require("Scripts/xlsx.full.min.js");
require("Scripts/FileSaver.js");
var GridComponent = (function () {
    function GridComponent(http) {
        this.http = http;
        this.showmenu = false;
        this.jsonVal = false;
        this.example = true;
        this.fileNametxt = "Demo Grid";
        this.grid1 = true;
        this.grid2 = true;
        this.grid3 = true;
        this.dsDetails = 'client';
        this.firstRowColEmptyDDl = true;
        this.rowcolumn = 1;
        this.SingleSheetDDl = false;
        this.dynamicWidthDDl = "true";
        this.minWidthtxt = "30";
        this.htmltableStyleDDl = false;
        this.CustomTxtarea = "This Text box helps adding custom text to PDF as a Header";
        this.CustomTxtareaLinestxt = 2;
        this.rowColumnEmpty = true;
    }
    //Grid onload
    GridComponent.prototype.ngAfterViewInit = function () {
        this.getGridOnloadData();
    };
    //show or hide DataSource 
    GridComponent.prototype.toggleView = function () {
        if (this.example) {
            this.jsonVal = true;
            this.example = false;
        }
        else {
            this.getGridOnloadData();
            this.example = true;
            this.jsonVal = false;
        }
    };
    //show or hide RowColumn
    GridComponent.prototype.rowColumnView = function (value) {
        if (value) {
            this.rowColumnEmpty = true;
        }
        else {
            this.rowColumnEmpty = false;
        }
    };
    GridComponent.prototype.getGridOnloadData = function () {
        // Chart Code    
        var width = 960, height = 500;
        var m = 5, // number of series
        n = 90; // number of values
        // Generate random data into five arrays.
        var data = d3.range(m).map(function () {
            return d3.range(n).map(function () {
                return Math.random() * 100 | 0;
            });
        });
        var x = d3.scale.linear()
            .domain([0, n - 1])
            .range([0, width]);
        var y = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangePoints([0, height], 1);
        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);
        var area = d3.svg.area()
            .interpolate("basis")
            .x(function (d, i) { return x(i); })
            .y0(function (d) { return -d / 2; })
            .y1(function (d) { return d / 2; });
        var svg = d3.select("#svg").append("svg")
            .attr("width", width)
            .attr("height", height);
        svg.selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("transform", function (d, i) { return "translate(0," + y(i) + ")"; })
            .style("fill", function (d, i) { return color(i); })
            .attr("d", area);
        var html = d3.select("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;
        var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
        var img = '<img src="' + imgsrc + '">';
        d3.select("#svgdataurl").html(img);
        //Canvas Data
        var canvas = document.querySelector("canvas");
        var context = canvas.getContext("2d");
        var canvasDataVal = '';
        var image = new Image;
        image.src = $('#svgdataurl img').attr('src');
        image.onload = function () {
            // Draw the image onto the canvas
            context.drawImage(image, 0, 0);
            /** save canvas image as data url (png format by default)
              * If you'd like for the image data URL to be in the jpeg format,
              * you can pass image/jpeg as the first argument in the toDataURL() method.
              */
            canvasDataVal = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg|svg\+xml);base64,/, '');
        };
        // Grid1
        $("#grid1").kendoGrid({
            dataSource: {
                type: "odata",
                transport: {
                    read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Customers"
                },
                pageSize: 20
            },
            height: 550,
            groupable: true,
            sortable: true,
            selectable: "multiple",
            reorderable: true,
            resizable: true,
            filterable: true,
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            columns: [{
                    field: "CompanyName",
                    title: "Company Name",
                    width: 420
                },
                {
                    title: "Contact Info",
                    columns: [{
                            field: "ContactTitle",
                            title: "Contact Title",
                            width: 200
                        }, {
                            field: "ContactName",
                            title: "Contact Name",
                            width: 200
                        }, {
                            title: "Location",
                            columns: [{
                                    field: "Country",
                                    width: 200
                                }, {
                                    field: "City",
                                    width: 200
                                }]
                        }, {
                            field: "Phone",
                            title: "Phone",
                            width: 200
                        }]
                }]
        });
        // Grid2
        $("#grid2").kendoGrid({
            dataSource: {
                type: "odata",
                transport: {
                    read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Customers"
                },
                pageSize: 15
            },
            height: 550,
            groupable: true,
            sortable: true,
            selectable: "multiple",
            reorderable: true,
            resizable: true,
            filterable: true,
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            columns: [{
                    template: "<div class='customer-photo'" +
                        "style='background-image: url(../content/web/Customers/#:data.CustomerID#.jpg);'></div>" +
                        "<div class='customer-name'>#: ContactName #</div>",
                    field: "ContactName",
                    title: "Contact Name",
                    width: 240
                }, {
                    field: "ContactTitle",
                    title: "Contact Title",
                    width: 240
                }, {
                    field: "CompanyName",
                    title: "Company Name",
                    width: 240
                }, {
                    field: "Country",
                    width: 150
                }]
        });
        // Grid3    
        $("#grid3").kendoGrid({
            dataSource: {
                type: "odata",
                transport: {
                    read: "https://demos.telerik.com/kendo-ui/service/Northwind.svc/Customers"
                },
                pageSize: 15,
                group: { field: "ContactTitle" }
            },
            height: 550,
            groupable: true,
            sortable: true,
            selectable: "multiple",
            reorderable: true,
            resizable: true,
            filterable: true,
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            columns: [
                {
                    field: "ContactName",
                    template: "<div class=\'customer-name\'>#: ContactName #</div>",
                    title: "Contact",
                    width: 200
                }, {
                    field: "ContactTitle",
                    title: "Contact Title",
                    width: 220
                }, {
                    field: "Phone",
                    title: "Phone",
                    width: 160
                }, {
                    field: "CompanyName",
                    title: "Company Name",
                    width: 240
                }, {
                    field: "City",
                    title: "City",
                    width: 160
                }
            ]
        });
    };
    // Export Pdf
    GridComponent.prototype.pdfExport = function () {
        var dsDetail = this.dsDetails;
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
        var irowSpan = Array();
        var icolSpan = Array();
        var ShowLabel = this.fileNametxt;
        var headercount = 0;
        var object = {};
        var PdfdefaultsInf = {
            htmltableStyle: false,
            customText: utilityCallbackObject.utilityCallback(object),
            customtextLines: 0
        };
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
            dataSource: 'Server',
            containerid: null,
            datatype: 'json',
            dataset: null,
            columns: null,
            returnUri: false,
            worksheetName: "My Worksheet",
            encoding: "utf-8"
        };
        // Canvas Data 
        var canvas = document.querySelector("canvas");
        var context = canvas.getContext("2d");
        var image = new Image;
        image.src = $('#svgdataurl img').attr('src');
        // Draw the image onto the canvas
        context.drawImage(image, 0, 0);
        /** save canvas image as data url (png format by default)
        * If you'd like for the image data URL to be in the jpeg format,
        * you can pass image/jpeg as the first argument in the toDataURL() method.
        */
        var canvasdata = canvas.toDataURL("image/png");
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
        for (var i = 0; i < defaults.tableName.length; i++) {
            var defGridValue = defaults.tableName[i];
            if (this.grid1) {
                selected.push("grid1");
            }
            if (this.grid2) {
                selected.push("grid2");
            }
            if (this.grid3) {
                selected.push("grid3");
            }
        }
        defaults.tableName = selected.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
        var hi = 0;
        var hj = 0;
        if (dsDetail == 'server') {
            columns = Array();
            rows = Array();
            var arrData = typeof jsonDataVal != 'object' ? JSON.parse(jsonDataVal) : jsonDataVal;
            columns[hi] = Array();
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
            columns = generateArrayPDFObject.generateArrayPDF(columns, irowSpan, icolSpan);
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
            PdfdefaultsInf.customtextLines = this.CustomTxtareaLinestxt;
            // Dynamic data generate in pdf using callback - starts
            var count = 0;
            if (checkObject.checkObj(PdfdefaultsInf.customText)) {
                for (var key in PdfdefaultsInf.customText) {
                    doc.text(PdfdefaultsInf.customText[key], 15, 10 + count);
                    count = count + 10;
                }
            }
            // Dynamic data generate in pdf using callback - ends 
            if (tablecount == 0) {
                tablestartpos = PdfdefaultsInf.customtextLines * 10 + count;
            }
            else {
                tablestartpos = parseInt(doc.autoTable.previous.finalY) + 10;
            }
            doc.autoTable(columns, rows, {
                addPageContent: pageContent,
                margin: { top: PdfdefaultsInf.customtextLines * 10 },
                startY: tablestartpos,
            });
        }
        else {
            PdfdefaultsInf.customtextLines = this.CustomTxtareaLinestxt;
            PdfdefaultsInf.htmltableStyle = this.htmltableStyleDDl;
            $.each(defaults.tableName, function (key, value) {
                columns = Array();
                rows = Array();
                HeaderStyle = Array();
                RowOddStyle = Array();
                RowEvenStyle = Array();
                var headingrows = 0;
                $('#' + value).find('thead').find('tr').each(function (i, v) {
                    columns[i] = Array();
                    irowSpan[i] = Array();
                    icolSpan[i] = Array();
                    $(this).filter(':visible').find('th').each(function (index, data) {
                        if ($(this).css('display') != 'none') {
                            HeaderStyle[0] = (colorToRgbObject.colorToRgb($(this).css('background-color')));
                            HeaderStyle[1] = (colorToRgbObject.colorToRgb($(this).css('color')));
                            columns[i][index] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
                            irowSpan[i][index] = ($(this).prop('rowSpan'));
                            icolSpan[i][index] = ($(this).prop('colSpan'));
                        }
                    });
                    headingrows = +1;
                });
                columns = generateArrayPDFObject.generateArrayPDF(columns, irowSpan, icolSpan);
                // Row vs Column
                $('#' + value).find('tbody').find('tr').each(function (i, v) {
                    tdData += "\n";
                    rows[i] = Array();
                    irowSpan[i] = Array();
                    icolSpan[i] = Array();
                    $(this).filter(':visible').find('td').each(function (index, vv) {
                        if ($(this).css('display') != 'none') {
                            if (index == 0) {
                                RowEvenStyle[0] = (colorToRgbObject.colorToRgb($(this).css('background-color')));
                                RowEvenStyle[1] = (colorToRgbObject.colorToRgb($(this).css('color')));
                            }
                            else if (index == 1) {
                                RowOddStyle[0] = (colorToRgbObject.colorToRgb($(this).css('background-color')));
                                RowOddStyle[1] = (colorToRgbObject.colorToRgb($(this).css('color')));
                            }
                            rows[i][index] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
                            irowSpan[i][index] = ($(this).prop('rowSpan'));
                            icolSpan[i][index] = ($(this).prop('colSpan'));
                        }
                    });
                });
                //output
                if (defaults.consoleLog == 'true') {
                    console.log(tdData);
                }
                // Dynamic data generate in pdf using callback - starts
                var count = 0;
                if (checkObject.checkObj(PdfdefaultsInf.customText)) {
                    for (var key_1 in PdfdefaultsInf.customText) {
                        doc.text(PdfdefaultsInf.customText[key_1], 15, 10 + count);
                        count = count + 10;
                    }
                }
                // Dynamic data generate in pdf using callback - ends  
                if (tablecount == 0) {
                    tablestartpos = PdfdefaultsInf.customtextLines * 10 + count;
                }
                else {
                    tablestartpos = parseInt(doc.autoTable.previous.finalY) + 10;
                }
                if (PdfdefaultsInf.htmltableStyle != false) {
                    doc.autoTable(columns, rows, {
                        addPageContent: pageContent,
                        margin: { top: PdfdefaultsInf.customtextLines * 10 }, styles: { fillColor: RowEvenStyle[0], textColor: RowEvenStyle[1], fontStyle: 'normal' },
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
                        margin: { top: PdfdefaultsInf.customtextLines * 10 },
                        startY: tablestartpos
                    });
                }
                tablecount += 1;
            });
        }
        doc.addPage(); //New page
        doc.addImage(canvasdata, 'png', 0, 0); //Add chart into PDF
        doc.save(this.fileNametxt + '.pdf');
        return '';
    };
    // Excel Export
    GridComponent.prototype.excelExport = function () {
        var irowSpan = Array();
        var icolSpan = Array();
        var tdData = "";
        var dsDetail = this.dsDetails;
        var XlsdefaultsInf = {
            dynamicWidth: true,
            minWidth: 30,
            firstRowColEmpty: true,
            SingleSheet: true
        };
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
            dataSource: 'Server',
            containerid: null,
            datatype: 'json',
            dataset: null,
            columns: null,
            returnUri: false,
            worksheetName: "My Worksheet",
            encoding: "utf-8"
        };
        // Canvas Data
        var canvas = document.querySelector("canvas");
        var context = canvas.getContext("2d");
        var canvasdata = '';
        var image = new Image;
        image.src = $('#svgdataurl img').attr('src');
        var firstColumnEmpty = this.rowcolumn;
        var fileNametxt = this.fileNametxt;
        var selected = new Array();
        for (var i = 0; i < defaults.tableName.length; i++) {
            var defGridValue = defaults.tableName[i];
            if (this.grid1) {
                selected.push("grid1");
            }
            if (this.grid2) {
                selected.push("grid2");
            }
            if (this.grid3) {
                selected.push("grid3");
            }
        }
        defaults.tableName = selected.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
        XlsdefaultsInf.SingleSheet = this.SingleSheetDDl;
        // create workbook
        var wb = WorkbookObject.Workbook();
        var obj = defaults.tableName;
        var ws;
        image.onload = function () {
            // Draw the image onto the canvas  
            context.drawImage(image, 0, 0);
            /** save canvas image as data url (png format by default)
              * If you'd like for the image data URL to be in the jpeg format,
              * you can pass image/jpeg as the first argument in the toDataURL() method.
              */
            canvasdata = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg|svg\+xml);base64,/, '');
            if (dsDetail == 'server') {
                var tdata = getExcelExportObject.getExcelExport('', irowSpan, icolSpan, firstColumnEmpty);
                var oo = generateArrayObject.generateArray(tdata[0], irowSpan, icolSpan);
                var data = oo[0];
                /* generate worksheet */
                var ws = sheet_from_array_of_arraysObject.sheet_from_array_of_arrays(data, oo[1], tdata[1], irowSpan, icolSpan, canvasdata, firstColumnEmpty);
                wb.SheetNames.push(fileNametxt);
                wb.Sheets[fileNametxt] = ws;
            }
            else {
                if (XlsdefaultsInf.SingleSheet) {
                    var tdata = getExcelExportObject.getExcelExport('', irowSpan, icolSpan, firstColumnEmpty);
                    var oo = generateArrayObject.generateArray(tdata[0], irowSpan, icolSpan);
                    var data = oo[0];
                    /* generate worksheet */
                    ws = sheet_from_array_of_arraysObject.sheet_from_array_of_arrays(data, oo[1], tdata[1], irowSpan, icolSpan, canvasdata, firstColumnEmpty);
                    wb.SheetNames.push(fileNametxt);
                    wb.Sheets[fileNametxt] = ws;
                }
                else {
                    $.each(obj, function (key, value) {
                        var tdata = getExcelExportObject.getExcelExport(value, irowSpan, icolSpan, firstColumnEmpty);
                        var oo = generateArrayObject.generateArray(tdata[0], irowSpan, icolSpan);
                        var data = oo[0];
                        /* generate worksheet */
                        ws = sheet_from_array_of_arraysObject.sheet_from_array_of_arrays(data, oo[1], tdata[1], irowSpan, icolSpan, canvasdata, firstColumnEmpty);
                        wb.SheetNames.push(value); //
                        wb.Sheets[value] = ws;
                    });
                }
            }
            /* save to file */
            var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
            saveAs(new Blob([s2abObject.s2ab(wbout)], { type: "application/octet-stream" }), fileNametxt + ".xlsx");
        };
    };
    //CSV Export    
    GridComponent.prototype.csvExport = function () {
        var dsDetail = this.dsDetails;
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
        var irowSpan = Array();
        var icolSpan = Array();
        var ShowLabel = this.fileNametxt;
        var headercount = 0;
        var PdfdefaultsInf = {
            htmltableStyle: false,
            customText: '',
            customtextLines: 0
        };
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
            dataSource: 'Server',
            containerid: null,
            datatype: 'json',
            dataset: null,
            columns: null,
            returnUri: false,
            worksheetName: "My Worksheet",
            encoding: "utf-8"
        };
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
        }
        else {
            debugger;
            var columns = Array();
            var rows = Array();
            var selected = new Array();
            for (var i = 0; i < defaults.tableName.length; i++) {
                var defGridValue = defaults.tableName[i];
                if (this.grid1) {
                    selected.push("grid1");
                }
                if (this.grid2) {
                    selected.push("grid2");
                }
                if (this.grid3) {
                    selected.push("grid3");
                }
            }
            defaults.tableName = selected.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
            $.each(defaults.tableName, function (key, value) {
                $('#' + value).find('thead').find('tr').each(function (i, v) {
                    tdData += "\n";
                    columns[i] = Array();
                    irowSpan[i] = Array();
                    icolSpan[i] = Array();
                    $(this).filter(':visible').find('th').each(function (index, data) {
                        if ($(this).css('display') != 'none') {
                            columns[i][index] = getTextFromFirstChildObject.getTextFromFirstChild($(this));
                            irowSpan[i][index] = ($(this).prop('rowSpan'));
                            icolSpan[i][index] = ($(this).prop('colSpan'));
                        }
                    });
                });
                columns = generateArrayPDFObject.generateArrayPDF(columns, irowSpan, icolSpan);
                var newString = "";
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].length > 1)
                        newString += "\n";
                    newString += columns[i].join(defaults.separator);
                }
                columns.fill("");
                tdData += "\n";
                tdData += "\n";
                tdData += newString;
                // Row vs Column
                $('#' + value).find('tbody').find('tr').each(function () {
                    tdData += "\n";
                    $(this).filter(':visible').find('td').each(function (index, vv) {
                        if ($(this).css('display') != 'none') {
                            tdData += getTextFromFirstChildObject.getTextFromFirstChild($(this)) + defaults.separator;
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
        var fileType = "application/msexcel";
        //Generate a file name
        var fileName = "MyReport_";
        fileType = "text/csv;charset=utf-8;";
        var blob = new Blob([tdData], { type: fileType });
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, this.fileNametxt + ".csv");
        }
        else {
            var link = document.createElement("a");
            if (link.download !== undefined) {
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", this.fileNametxt + ".csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        return tdData;
    };
    return GridComponent;
}());
GridComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        templateUrl: './grid.component.html',
        styleUrls: ['./grid.component.css']
    }),
    __metadata("design:paramtypes", [http_1.Http])
], GridComponent);
exports.GridComponent = GridComponent;
//# sourceMappingURL=grid.component.js.map