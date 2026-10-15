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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.68, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.5, 500, 1500, "TX - AQ-Child"], "isController": true}, {"data": [0.0, 500, 1500, "SWAN build dynamic report payload"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET /api/screeners/meta"], "isController": false}, {"data": [0.5, 500, 1500, "TX - SCARED Parent"], "isController": true}, {"data": [1.0, 500, 1500, "GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.0, 500, 1500, "POST /api/screener-report (SWAN)"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/screen_for_child_anxiety_related_disorders_parent"], "isController": false}, {"data": [0.5, 500, 1500, "GET page /screeners/vanderbilt_assessment"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/gad_7_anxiety"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/gad_7_anxiety"], "isController": false}, {"data": [0.5, 500, 1500, "GET API /api/screeners/aq_child_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/q_chat_parent"], "isController": false}, {"data": [0.0, 500, 1500, "TX - SWAN"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/q_chat_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - GAD-7 Self"], "isController": true}, {"data": [0.5, 500, 1500, "TX - CAST"], "isController": true}, {"data": [0.5, 500, 1500, "GET API /api/screeners/the_childhood_autism_spectrum_test"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Vanderbilt (NICHQ)"], "isController": true}, {"data": [0.5, 500, 1500, "GET /screeners"], "isController": false}, {"data": [1.0, 500, 1500, "GET page /screeners/aq_child_parent"], "isController": false}, {"data": [0.5, 500, 1500, "TX - Q-CHAT-25"], "isController": true}, {"data": [1.0, 500, 1500, "GET page /screeners/swan_adhd_parent"], "isController": false}, {"data": [1.0, 500, 1500, "GET API /api/screeners/swan_adhd_parent"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 18, 0, 0.0, 880.3333333333334, 343, 5857, 416.5, 2131.900000000006, 5857.0, 5857.0, 0.6792965506830705, 6.480405065948373, 0.29402278002113363], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["TX - AQ-Child", 1, 0, 0.0, 1320.0, 1320, 1320, 1320.0, 1320.0, 1320.0, 1320.0, 0.7575757575757576, 19.489820075757574, 0.30036695075757575], "isController": true}, {"data": ["SWAN build dynamic report payload", 1, 0, 0.0, 1718.0, 1718, 1718, 1718.0, 1718.0, 1718.0, 1718.0, 0.5820721769499417, 0.0, 0.0], "isController": false}, {"data": ["GET API /api/screeners/vanderbilt_assessment", 1, 0, 0.0, 486.0, 486, 486, 486.0, 486.0, 486.0, 486.0, 2.05761316872428, 48.36194701646091, 0.4923000257201646], "isController": false}, {"data": ["GET /api/screeners/meta", 1, 0, 0.0, 397.0, 397, 397, 397.0, 397.0, 397.0, 397.0, 2.5188916876574305, 20.704600913098236, 0.5608469773299748], "isController": false}, {"data": ["TX - SCARED Parent", 1, 0, 0.0, 739.0, 739, 739, 739.0, 739.0, 739.0, 739.0, 1.3531799729364007, 26.533692066982407, 0.6263743234100135], "isController": true}, {"data": ["GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 382.0, 382, 382, 382.0, 382.0, 382.0, 382.0, 2.617801047120419, 45.778284522251305, 0.6979098494764397], "isController": false}, {"data": ["POST /api/screener-report (SWAN)", 1, 0, 0.0, 5857.0, 5857, 5857, 5857.0, 5857.0, 5857.0, 5857.0, 0.17073587160662457, 0.0625253436059416, 0.7744805894655967], "isController": false}, {"data": ["GET page /screeners/screen_for_child_anxiety_related_disorders_parent", 1, 0, 0.0, 357.0, 357, 357, 357.0, 357.0, 357.0, 357.0, 2.8011204481792715, 5.941439075630252, 0.5498293067226891], "isController": false}, {"data": ["GET page /screeners/vanderbilt_assessment", 1, 0, 0.0, 551.0, 551, 551, 551.0, 551.0, 551.0, 551.0, 1.8148820326678765, 3.8495349364791287, 0.30661581215970957], "isController": false}, {"data": ["GET page /screeners/gad_7_anxiety", 1, 0, 0.0, 344.0, 344, 344, 344.0, 344.0, 344.0, 344.0, 2.9069767441860463, 6.1659702034883725, 0.4684093386627907], "isController": false}, {"data": ["GET page /screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 377.0, 377, 377, 377.0, 377.0, 377.0, 377.0, 2.6525198938992043, 5.6262433687002655, 0.4818053713527851], "isController": false}, {"data": ["GET API /api/screeners/gad_7_anxiety", 1, 0, 0.0, 375.0, 375, 375, 375.0, 375.0, 375.0, 375.0, 2.6666666666666665, 12.325520833333334, 0.6171875], "isController": false}, {"data": ["GET API /api/screeners/aq_child_parent", 1, 0, 0.0, 824.0, 824, 824, 824.0, 824.0, 824.0, 824.0, 1.2135922330097086, 28.642672936893206, 0.28325053094660196], "isController": false}, {"data": ["GET API /api/screeners/q_chat_parent", 1, 0, 0.0, 351.0, 351, 351, 351.0, 351.0, 351.0, 351.0, 2.849002849002849, 40.495348112535616, 0.6593883547008548], "isController": false}, {"data": ["TX - SWAN", 1, 0, 0.0, 8360.0, 8360, 8360, 8360.0, 8360.0, 8360.0, 8360.0, 0.11961722488038277, 1.7345665744617227, 0.5902596067583733], "isController": true}, {"data": ["GET page /screeners/q_chat_parent", 1, 0, 0.0, 343.0, 343, 343, 343.0, 343.0, 343.0, 343.0, 2.9154518950437316, 6.183946793002915, 0.4697749635568513], "isController": false}, {"data": ["TX - GAD-7 Self", 1, 0, 0.0, 719.0, 719, 719, 719.0, 719.0, 719.0, 719.0, 1.3908205841446453, 9.37853138038943, 0.5460057371349096], "isController": true}, {"data": ["TX - CAST", 1, 0, 0.0, 1102.0, 1102, 1102, 1102.0, 1102.0, 1102.0, 1102.0, 0.9074410163339383, 47.94372447822141, 0.3934607531760435], "isController": true}, {"data": ["GET API /api/screeners/the_childhood_autism_spectrum_test", 1, 0, 0.0, 725.0, 725, 725, 725.0, 725.0, 725.0, 725.0, 1.379310344827586, 69.94881465517241, 0.34752155172413796], "isController": false}, {"data": ["TX - Vanderbilt (NICHQ)", 1, 0, 0.0, 1037.0, 1037, 1037, 1037.0, 1037.0, 1037.0, 1037.0, 0.9643201542912248, 24.710703953712635, 0.3936385004821601], "isController": true}, {"data": ["GET /screeners", 1, 0, 0.0, 1478.0, 1478, 1478, 1478.0, 1478.0, 1478.0, 1478.0, 0.6765899864682003, 1.4377537212449256, 0.09977059370771313], "isController": false}, {"data": ["GET page /screeners/aq_child_parent", 1, 0, 0.0, 496.0, 496, 496, 496.0, 496.0, 496.0, 496.0, 2.0161290322580645, 4.284274193548387, 0.3288022933467742], "isController": false}, {"data": ["TX - Q-CHAT-25", 1, 0, 0.0, 694.0, 694, 694, 694.0, 694.0, 694.0, 694.0, 1.440922190201729, 23.53740769092219, 0.5656745317002883], "isController": true}, {"data": ["GET page /screeners/swan_adhd_parent", 1, 0, 0.0, 349.0, 349, 349, 349.0, 349.0, 349.0, 349.0, 2.865329512893983, 6.077632521489972, 0.4700931232091691], "isController": false}, {"data": ["GET API /api/screeners/swan_adhd_parent", 1, 0, 0.0, 436.0, 436, 436, 436.0, 436.0, 436.0, 436.0, 2.293577981651376, 27.554293291284402, 0.5375573394495413], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 18, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
