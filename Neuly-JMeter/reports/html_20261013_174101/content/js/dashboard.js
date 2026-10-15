/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8043478260869565, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.5, 500, 1500, "TX - CAST"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [0.5, 500, 1500, "TX - AQ-Child"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/screeners/meta"], "isController": false}, {"data": [0.5, 500, 1500, "TX - SCARED Parent"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Vanderbilt (NICHQ)"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.5, 500, 1500, "GET page /screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/gad_7_anxiety"], "isController": false}, {"data": [0.5, 500, 1500, "GET /screeners"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/gad_7_anxiety"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/aq_child_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/q_chat_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/aq_child_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Q-CHAT-25"], "isController": true}, {"data": [0.5, 500, 1500, "TX - SWAN"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/q_chat_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/swan_adhd_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/swan_adhd_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - GAD-7 Self"], "isController": true}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 16, 0, 0.0, 442.3125, 331, 1363, 368.5, 777.8000000000006, 1363.0, 1363.0, 1.202736224911674, 12.880670713372922, 0.24467284165225886], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TX - CAST", 1, 0, 0.0, 786.0, 786, 786, 786.0, 786.0, 786.0, 786.0, 1.272264631043257, 67.21880963740458, 0.5516459923664122], "isController": true}, {"data": ["GET API /api/screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 445.0, 445, 445, 445.0, 445.0, 445.0, 445.0, 2.247191011235955, 113.96155196629213, 0.566186797752809], "isController": false}, {"data": ["TX - AQ-Child", 1, 0, 0.0, 755.0, 755, 755, 755.0, 755.0, 755.0, 755.0, 1.3245033112582782, 34.07491721854305, 0.5251448675496688], "isController": true}, {"data": ["GET API /api/screeners/vanderbilt_assessment", 1, 0, 0.0, 374.0, 374, 374, 374.0, 374.0, 374.0, 374.0, 2.6737967914438503, 62.84466911764706, 0.6397267713903744], "isController": false}, {"data": ["GET /api/screeners/meta", 1, 0, 0.0, 405.0, 405, 405, 405.0, 405.0, 405.0, 405.0, 2.4691358024691357, 20.295621141975307, 0.5497685185185185], "isController": false}, {"data": ["TX - SCARED Parent", 1, 0, 0.0, 722.0, 722, 722, 722.0, 722.0, 722.0, 722.0, 1.3850415512465375, 27.15844658933518, 0.6411227493074793], "isController": true}, {"data": ["GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 391.0, 391, 391, 391.0, 391.0, 391.0, 391.0, 2.557544757033248, 44.724564418158565, 0.6818454283887467], "isController": false}, {"data": ["TX - Vanderbilt (NICHQ)", 1, 0, 0.0, 901.0, 901, 901, 901.0, 901.0, 901.0, 901.0, 1.1098779134295227, 28.44062153163152, 0.45305563263041065], "isController": true}, {"data": ["GET page /screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 331.0, 331, 331, 331.0, 331.0, 331.0, 331.0, 3.0211480362537766, 6.408138217522659, 0.5930183157099698], "isController": false}, {"data": ["GET page /screeners/vanderbilt_assessment", 1, 0, 0.0, 527.0, 527, 527, 527.0, 527.0, 527.0, 527.0, 1.8975332068311195, 4.024845825426945, 0.3205793406072106], "isController": false}, {"data": ["GET page /screeners/gad_7_anxiety", 1, 0, 0.0, 356.0, 356, 356, 356.0, 356.0, 356.0, 356.0, 2.8089887640449436, 5.958128511235955, 0.4526202598314607], "isController": false}, {"data": ["GET /screeners", 1, 0, 0.0, 1363.0, 1363, 1363, 1363.0, 1363.0, 1363.0, 1363.0, 0.7336757153338225, 1.5590608950843727, 0.10818850880410859], "isController": false}, {"data": ["GET page /screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 341.0, 341, 341, 341.0, 341.0, 341.0, 341.0, 2.932551319648094, 6.220216275659824, 0.5326704545454545], "isController": false}, {"data": ["GET API /api/screeners/gad_7_anxiety", 1, 0, 0.0, 347.0, 347, 347, 347.0, 347.0, 347.0, 347.0, 2.881844380403458, 13.320087355907782, 0.6669893731988473], "isController": false}, {"data": ["GET API /api/screeners/aq_child_parent", 1, 0, 0.0, 419.0, 419, 419, 419.0, 419.0, 419.0, 419.0, 2.3866348448687353, 56.328311455847256, 0.5570368436754177], "isController": false}, {"data": ["GET API /api/screeners/q_chat_parent", 1, 0, 0.0, 363.0, 363, 363, 363.0, 363.0, 363.0, 363.0, 2.7548209366391188, 39.15665891873278, 0.6375903925619835], "isController": false}, {"data": ["GET page /screeners/aq_child_parent", 1, 0, 0.0, 336.0, 336, 336, 336.0, 336.0, 336.0, 336.0, 2.976190476190476, 6.324404761904762, 0.48537481398809523], "isController": false}, {"data": ["TX - Q-CHAT-25", 1, 0, 0.0, 706.0, 706, 706, 706.0, 706.0, 706.0, 706.0, 1.41643059490085, 23.13733843838527, 0.5560596671388103], "isController": true}, {"data": ["TX - SWAN", 1, 0, 0.0, 736.0, 736, 736, 736.0, 736.0, 736.0, 736.0, 1.358695652173913, 19.20484459918478, 0.5413552989130435], "isController": true}, {"data": ["GET page /screeners/q_chat_parent", 1, 0, 0.0, 343.0, 343, 343, 343.0, 343.0, 343.0, 343.0, 2.9154518950437316, 6.183946793002915, 0.4697749635568513], "isController": false}, {"data": ["GET page /screeners/swan_adhd_parent", 1, 0, 0.0, 343.0, 343, 343, 343.0, 343.0, 343.0, 343.0, 2.9154518950437316, 6.183946793002915, 0.47831632653061223], "isController": false}, {"data": ["GET API /api/screeners/swan_adhd_parent", 1, 0, 0.0, 393.0, 393, 393, 393.0, 393.0, 393.0, 393.0, 2.544529262086514, 30.569139631043257, 0.5963740458015266], "isController": false}, {"data": ["TX - GAD-7 Self", 1, 0, 0.0, 703.0, 703, 703, 703.0, 703.0, 703.0, 703.0, 1.4224751066856332, 9.591983019203415, 0.5584326102418208], "isController": true}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 16, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
