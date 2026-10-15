// JSR223 PostProcessor — attach to POST /api/screener-report (SWAN)
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import java.nio.file.Files
import java.nio.file.Paths

def runId = vars.get('swan_run_id') ?: 'unknown'
def elapsed = prev.getTime()
def success = prev.isSuccessful()
def responseCode = prev.getResponseCode()

def apiSuccess = false
def apiMessage = ''
def parseError = ''

try {
    def text = prev.getResponseDataAsString()
    if (text != null && !text.isEmpty()) {
        def json = new JsonSlurper().parseText(text)
        apiSuccess = json.success == true
        apiMessage = json.message?.toString() ?: ''
        if (!apiSuccess) {
            success = false
        }
    } else {
        parseError = 'empty response body'
        success = false
    }
} catch (Exception e) {
    parseError = e.message
    success = false
}

def record = [
    runId              : runId,
    answerMode         : vars.get('swan_answer_mode_used') ?: '',
    postElapsedMs      : elapsed,
    httpCode           : responseCode,
    jmeterSuccess      : prev.isSuccessful(),
    reportSubmitSuccess: apiSuccess,
    reportMessage      : apiMessage,
    parseError         : parseError,
    overallPass        : success && apiSuccess && responseCode == '200',
    expectedScores     : [
        totalScore : vars.get('swan_expected_total'),
        attention  : vars.get('swan_expected_attention'),
        activity   : vars.get('swan_expected_activity'),
    ],
    resultSummary      : [
        totalScoreDisplay    : vars.get('swan_expected_total'),
        attentionDisplay     : vars.get('swan_expected_attention'),
        activityDisplay      : vars.get('swan_expected_activity'),
        overallClassification: 'See email report (API returns success only)',
    ],
]

def metaPath = props.get('swan_run_meta_path')
if (metaPath == null || metaPath.isEmpty()) {
    metaPath = 'results/swan_report_run.json'
}
def path = Paths.get(metaPath)
if (!path.isAbsolute()) {
    def base = props.get('neuly_jmeter_root')
    if (base != null && !base.isEmpty()) {
        path = Paths.get(base, metaPath)
    }
}
Files.createDirectories(path.getParent())
Files.write(path, JsonOutput.prettyPrint(JsonOutput.toJson(record)).getBytes('UTF-8'))

if (!record.overallPass) {
    prev.setSuccessful(false)
    prev.setResponseMessage("SWAN report submit failed: ${parseError ?: apiMessage ?: 'assertions'}")
}
