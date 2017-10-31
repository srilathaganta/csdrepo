var app = angular.module('gridApp', []);

app.directive('exportToExcel', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
            elem.bind('click', function() {
            	tdData = "";
                //document.getElementById('txta').value = tableAllExport('excel');
               
               //saveExcel('txta', false);
                //doit('xlsx');
                //saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), "test.xlsx")
                var selected = new Array();
                $("input:checkbox[name=grid]:checked").each(function () {
                    selected.push($(this).val());
                });
                defaults.tableName = selected;
                XlsdefaultsInf.SingleSheet = $("#SingleSheetDDl").val();
                var wb = new Workbook();           
                var obj = defaults.tableName;
                var ws;
                debugger
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
            	
            /*     add worksheet to workbook	*/         
             
            }

                var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
                saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), $("#fileNametxt").val() + ".xlsx")
               
            });
        }
    };
}),

app.directive('exportToPdf', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
            elem.bind('click', function() {
            	var tpdfdata = tableAllExport('pdf1', dsDetails, jsonData);
            });
        }
    };
}),

app.directive('exportToCsv', function() {
    return {
        restrict: 'AE',
        replace: true,
        link: function(scope, elem, attrs) {
            elem.bind('click', function() {
            	jsonData = $('#txt').val();
        		
                debugger
                tdData = "";
    			//var dsDetails = document.getElementByName('dsDetails').value;
    			 
                document.getElementById('txta').value = tableAllExport('csv',dsDetails,jsonData);
               
    				ExportFile("csv");
            });
        }
    };
});