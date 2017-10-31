jsonData = $('#txt').val();
//alert("json iss "+jsonData);	 
	function doit(type, fn) { return export_table_to_excel('activity', type || 'xlsx', fn); }



    function tableToJSON(tblObj) {
        var data = [];
        var $headers = $(tblObj).find("th");
        var $rows = $(tblObj).find("tbody tr").each(function (index) {
            $cells = $(this).find("td");
            data[index] = [];
            $cells.each(function (cellIndex) {
                data[index][$($headers[cellIndex]).html()] = $(this).html();
            });
        });
        return data;
    }


    function Workbook() {
        if (!(this instanceof Workbook)) return new Workbook();
        this.SheetNames = [];
        this.Sheets = {};
    }

    

    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    

var varpdfFontSize = '7';
var dsDetails ='';
function toggleView(){
 dsDetails =document.querySelector('input[name = "dsDetails"]:checked').value;
if(dsDetails=='server') {
	$("#example").hide();
	$("#jsonVal").show();
	 jsonData = $('#txt').val();
	}
else{
	$("#jsonVal").hide();
	$("#example").show();
	}
}

 var jsonData = '';

$(document).ready(function () { 
dsDetails = document.querySelector('input[name = "dsDetails"]:checked').value;
   jsonData = $('#txt').val();
if(dsDetails=='server')
	$("#example").hide();
else
	$("#jsonVal").hide();

    $('#showmenu').click(function () {
        $('#Configdiv').slideToggle("slide");
    });

        $('#exportexcel').bind('click', function (e) {
		
            tdData = "";
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
        
			
            /* add worksheet to workbook */        
         
		}

            var wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
            saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), $("#fileNametxt").val() + ".xlsx")
           
        });
        $('#exportpdf').bind('click', function (e) {
            var tpdfdata = tableAllExport('pdf1', dsDetails, jsonData)
           
        });
        $('#exportimage').bind('click', function (e) {
           
            $('#activity').tableExport({ type: 'png', escape: 'false' });
        });
        $('#exportcsv').bind('click', function (e) {
		jsonData = $('#txt').val();
		
            debugger
            tdData = "";
			//var dsDetails = document.getElementByName('dsDetails').value;
			 
            document.getElementById('txta').value = tableAllExport('csv',dsDetails,jsonData);
           
				ExportFile("csv");
			
        });
        $('#exportppt').bind('click', function (e) {
            $('#activity').tableExport({ type: 'powerpoint', escape: 'false' });
        });
        $('#exportxml').bind('click', function (e) {
            $('#activity').tableExport({ type: 'xml', escape: 'false' });
        });
        $('#exportword').bind('click', function (e) {
            $('#activity').tableExport({ type: 'doc', escape: 'false' });
        });
        $('#exporttxt').bind('click', function (e) {
            $('#activity').tableExport({ type: 'txt', escape: 'false' });
        });
    });
