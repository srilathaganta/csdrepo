/*! exportDirective.js
 *  implementation in Angular1.x using custom directives.
 *  purpose of this file is call the angularJs custom directive bind events to generate Excel, PDf and CSV formats.
 *  2017-10-8
 *
 *  By Ganta Srilatha
 */


/*! @source https://github.com/srilathaganta/csdrepo/blob/master/DataGridWithAngularJs/WebContent/controller/exportDirective.js */

//load the angular module
var app = angular.module('gridApp', []);

/*!
 * custom directive implemented for exporting Excel.
 */
app.directive('exportToExcel', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
        	
        	//bind the click event to angularJs
            elem.bind('click', function() {
            	tdData = "";
                var selected = new Array();
                
                //getting all input data whose type is checkbox and its checked.
                $("input:checkbox[name=grid]:checked").each(function () {
                    selected.push($(this).val());
                });
                defaults.tableName = selected;
                XlsdefaultsInf.SingleSheet = $("#SingleSheetDDl").val();
                var wb = new Workbook();           
                var obj = defaults.tableName;
                var ws;
                debugger
                //execute the following code based on custom option selected in UI.
                if (dsDetails == 'server') {
                    
            	    var tdata = tableAllExport('excel', dsDetails, jsonData, '');

            	    var oo = generateArray(tdata[0]);
            	    var data = oo[0];
            	    var ws = sheet_from_array_of_arrays(data, oo[1], tdata[1]);
            	    wb.SheetNames.push($("#fileNametxt").val());
            	    wb.Sheets[$("#fileNametxt").val()] = ws;
            	}else{
            	
                    if (XlsdefaultsInf.SingleSheet == 'true') {               
                        
                        var tdata = tableAllExport('excel', dsDetails, jsonData, '');
                        var oo = generateArray(tdata[0]);
                        var data = oo[0];
                        ws = sheet_from_array_of_arrays(data, oo[1], tdata[1]);
                        wb.SheetNames.push($("#fileNametxt").val());
                        wb.Sheets[$("#fileNametxt").val()] = ws;
                    }
                    else {
                        $.each(obj, function (key, value) {                    
                        var tdata = tableAllExport('excel', dsDetails, jsonData, value);

                        var oo = generateArray(tdata[0]);
                        var data = oo[0];
                        ws = sheet_from_array_of_arrays(data, oo[1], tdata[1]);
                        wb.SheetNames.push(value);
                        wb.Sheets[value] = ws;
                        });
                    }
            }
                /*     add worksheet to workbook	*/
                var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
                saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), $("#fileNametxt").val() + ".xlsx")
               
            });
        }
    };
}),

/*!
 * custom directive implemented for exporting PDF.
 */
app.directive('exportToPdf', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
        	
        //bind dynamic image in PDF export file	
        var html = d3.select("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

        var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
        var img = '<img src="'+imgsrc+'">'; 
        d3.select("#svgdataurl").html(img);

        var canvas = document.querySelector("canvas");
    	  	context = canvas.getContext("2d");
    	var image = new Image;
    		image.src = imgsrc;
    		image.onload = function() { 
    			context.drawImage(image, 0, 0);
    			canvasdata = canvas.toDataURL("image/png");
    		}
    		
    		//bind the click event to angularJs
            elem.bind('click', function() {
            	var tpdfdata = tableAllExport('pdf1', dsDetails, jsonData, '', canvasdata);
            });
        }
    };
}),

/*!
 * custom directive implemented for exporting CSV.
 */
app.directive('exportToCsv', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
            
        	//bind the click event to angularJs
        	elem.bind('click', function() {
            	jsonData = $('#txt').val();
        		
                debugger
                tdData = "";
                document.getElementById('txta').value = tableAllExport('csv',dsDetails,jsonData);
    			ExportFile("csv");
            });
        }
    };
});

/*!
 * send empty object to the callback function display this object data as part of 
 * implementation of export PDF function this method calling as Callback function. 
 * 
 * @param Object, the type of Object array. if not pass any value as parameter, it will be null or undefined.
 * returns object array.
 */
function addText(obj) {
	var myObject = {
		    header1: 'some string value',
		    header2: 'some text',
		    header3: 'some other text'
		};
	obj = myObject;
	return obj;
}
