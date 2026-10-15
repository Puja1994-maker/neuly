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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.717391304347826, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.5, 500, 1500, "TX - CAST"], "isController": true}, {"data": [0.5, 500, 1500, "GET API /api/screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [0.5, 500, 1500, "TX - AQ-Child"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/screeners/meta"], "isController": false}, {"data": [0.5, 500, 1500, "TX - SCARED Parent"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Vanderbilt (NICHQ)"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.5, 500, 1500, "GET page /screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/gad_7_anxiety"], "isController": false}, {"data": [0.5, 500, 1500, "GET /screeners"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [0.5, 500, 1500, "GET API /api/screeners/gad_7_anxiety"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/aq_child_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/q_chat_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/aq_child_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Q-CHAT-25"], "isController": true}, {"data": [0.0, 500, 1500, "TX - SWAN"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/q_chat_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/swan_adhd_parent"], "isController": false}, {"data": [0.5, 500, 1500, "GET API /api/screeners/swan_adhd_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - GAD-7 Self"], "isController": true}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 16, 0, 0.0, 552.1249999999999, 385, 1209, 453.5, 1204.1, 1209.0, 1209.0, 1.2705471293575796, 13.60688974033193, 0.258467625863575], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TX - CAST", 1, 0, 0.0, 959.0, 959, 959, 959.0, 959.0, 959.0, 959.0, 1.0427528675703859, 55.09278871220021, 0.452131126173097], "isController": true}, {"data": ["GET API /api/screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 553.0, 553, 553, 553.0, 553.0, 553.0, 553.0, 1.8083182640144664, 91.70504633815551, 0.45561143761301987], "isController": false}, {"data": ["TX - AQ-Child", 1, 0, 0.0, 878.0, 878, 878, 878.0, 878.0, 878.0, 878.0, 1.1389521640091116, 29.296875, 0.45157673690205014], "isController": true}, {"data": ["GET API /api/screeners/vanderbilt_assessment", 1, 0, 0.0, 472.0, 472, 472, 472.0, 472.0, 472.0, 472.0, 2.1186440677966103, 49.79641154661017, 0.5069021451271186], "isController": false}, {"data": ["GET /api/screeners/meta", 1, 0, 0.0, 385.0, 385, 385, 385.0, 385.0, 385.0, 385.0, 2.5974025974025974, 21.349939123376622, 0.578327922077922], "isController": false}, {"data": ["TX - SCARED Parent", 1, 0, 0.0, 857.0, 857, 857, 857.0, 857.0, 857.0, 857.0, 1.1668611435239205, 22.88027822345391, 0.5401290840140024], "isController": true}, {"data": ["GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 433.0, 433, 433, 433.0, 433.0, 433.0, 433.0, 2.3094688221709005, 40.3863849595843, 0.6157079965357968], "isController": false}, {"data": ["TX - Vanderbilt (NICHQ)", 1, 0, 0.0, 1048.0, 1048, 1048, 1048.0, 1048.0, 1048.0, 1048.0, 0.9541984732824427, 24.451335877862594, 0.38950679866412213], "isController": true}, {"data": ["GET page /screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 424.0, 424, 424, 424.0, 424.0, 424.0, 424.0, 2.3584905660377355, 5.002579599056604, 0.46294590212264153], "isController": false}, {"data": ["GET page /screeners/vanderbilt_assessment", 1, 0, 0.0, 576.0, 576, 576, 576.0, 576.0, 576.0, 576.0, 1.736111111111111, 3.6824544270833335, 0.2933078342013889], "isController": false}, {"data": ["GET page /screeners/gad_7_anxiety", 1, 0, 0.0, 393.0, 393, 393, 393.0, 393.0, 393.0, 393.0, 2.544529262086514, 5.3971851145038165, 0.41000715648854963], "isController": false}, {"data": ["GET /screeners", 1, 0, 0.0, 1209.0, 1209, 1209, 1209.0, 1209.0, 1209.0, 1209.0, 0.8271298593879239, 1.7576509511993381, 0.12196934449958642], "isController": false}, {"data": ["GET page /screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 406.0, 406, 406, 406.0, 406.0, 406.0, 406.0, 2.4630541871921183, 5.224368842364532, 0.44739070197044334], "isController": false}, {"data": ["GET API /api/screeners/gad_7_anxiety", 1, 0, 0.0, 579.0, 579, 579, 579.0, 579.0, 579.0, 579.0, 1.7271157167530224, 7.982850280656304, 0.39973283678756477], "isController": false}, {"data": ["GET API /api/screeners/aq_child_parent", 1, 0, 0.0, 470.0, 470, 470, 470.0, 470.0, 470.0, 470.0, 2.127659574468085, 50.21609042553192, 0.496592420212766], "isController": false}, {"data": ["GET API /api/screeners/q_chat_parent", 1, 0, 0.0, 446.0, 446, 446, 446.0, 446.0, 446.0, 446.0, 2.242152466367713, 31.869657371076233, 0.5189356782511211], "isController": false}, {"data": ["GET page /screeners/aq_child_parent", 1, 0, 0.0, 408.0, 408, 408, 408.0, 408.0, 408.0, 408.0, 2.450980392156863, 5.198759191176471, 0.3997204350490196], "isController": false}, {"data": ["TX - Q-CHAT-25", 1, 0, 0.0, 863.0, 863, 863, 863.0, 863.0, 863.0, 863.0, 1.1587485515643106, 18.932638687717265, 0.45489933371958285], "isController": true}, {"data": ["TX - SWAN", 1, 0, 0.0, 1663.0, 1663, 1663, 1663.0, 1663.0, 1663.0, 1663.0, 0.6013229104028863, 8.499558403487672, 0.23958959711365002], "isController": true}, {"data": ["GET page /screeners/q_chat_parent", 1, 0, 0.0, 417.0, 417, 417, 417.0, 417.0, 417.0, 417.0, 2.398081534772182, 5.095923261390888, 0.3864096223021583], "isController": false}, {"data": ["GET page /screeners/swan_adhd_parent", 1, 0, 0.0, 461.0, 461, 461, 461.0, 461.0, 461.0, 461.0, 2.1691973969631237, 4.60107104121475, 0.3558839479392625], "isController": false}, {"data": ["GET API /api/screeners/swan_adhd_parent", 1, 0, 0.0, 1202.0, 1202, 1202, 1202.0, 1202.0, 1202.0, 1202.0, 0.831946755407654, 9.994735336938437, 0.19498752079866888], "isController": false}, {"data": ["TX - GAD-7 Self", 1, 0, 0.0, 972.0, 972, 972, 972.0, 972.0, 972.0, 972.0, 1.02880658436214, 6.937411586934156, 0.4038869598765432], "isController": true}]}, function(index, item){
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
