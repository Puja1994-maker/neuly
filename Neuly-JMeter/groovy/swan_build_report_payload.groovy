// JSR223 Sampler — builds POST /api/screener-report JSON from random or CSV answers.
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import java.math.RoundingMode
import java.time.Instant
import java.time.format.DateTimeFormatter

def OPTION_DEFS = [
    [id: 'far_below_average',       label: 'Far below',       points: -3],
    [id: 'slightly_below_average',  label: 'Slightly below',  points: -1],
    [id: 'below_average',           label: 'Below',           points: -2],
    [id: 'average',                 label: 'Average',         points:  0],
    [id: 'slightly_above_average',  label: 'Slightly above',  points:  1],
    [id: 'above_average',           label: 'Above',           points:  2],
    [id: 'far_above_average',       label: 'Far above',       points:  3],
]
def OPTION_BY_ID = OPTION_DEFS.collectEntries { [(it.id): it] }

def ATTENTION_KEYS = [
    'close_attention_detail', 'sustain_attention', 'listen_spoken', 'follow_through',
    'organise_tasks', 'sustained_mental_effort', 'keep_track', 'ignore_extraneous', 'remember_daily',
]
def ACTIVITY_KEYS = [
    'sit_still', 'stay_seated', 'modulate_motor', 'play_quietly', 'settle_rest',
    'modulate_verbal', 'reflect_questions', 'await_turn', 'enter_without_intruding',
]
def ALL_KEYS = ATTENTION_KEYS + ACTIVITY_KEYS

def round2 = { BigDecimal v -> v.setScale(2, RoundingMode.HALF_UP).doubleValue() }

def avgPoints = { List keys, Map answers ->
    if (keys.isEmpty()) return 0.0d
    def sum = keys.sum { k ->
        def optId = answers[k]
        def opt = OPTION_BY_ID[optId]
        if (opt == null) throw new IllegalArgumentException("Unknown option for ${k}: ${optId}")
        opt.points
    } as int
    round2(new BigDecimal(sum).divide(new BigDecimal(keys.size()), 4, RoundingMode.HALF_UP))
}

def definitionJson = props.get('SWAN_DEFINITION_JSON')
if (definitionJson == null || definitionJson.isEmpty()) {
    throw new IllegalStateException('SWAN_DEFINITION_JSON missing — run GET API /api/screeners/swan_adhd_parent first')
}
def definition = new JsonSlurper().parseText(definitionJson)
def radioByKey = definition.questions_en
    .findAll { it.question_type == 'radio' }
    .collectEntries { [(it.question_key): it] }

ALL_KEYS.each { k ->
    if (!radioByKey.containsKey(k)) {
        throw new IllegalStateException("Definition missing radio question_key: ${k}")
    }
}

def mode = (vars.get('swan_answer_mode') ?: props.get('swan_answer_mode') ?: 'random').toString().trim().toLowerCase()
def runId = vars.get('swan_run_id')
if (runId == null || runId.isEmpty()) {
    runId = "swan-${Instant.now().toEpochMilli()}-${Integer.toHexString(new Random().nextInt(0xFFFFFF))}"
}
vars.put('swan_run_id', runId)

Map<String, String> selected = [:]

if (mode == 'csv') {
    def csvRunId = vars.get('swan_csv_run_id')
    if (csvRunId == null || csvRunId.isEmpty()) {
        throw new IllegalStateException('swan_answer_mode=csv but swan_csv_run_id is empty (check CSV Data Set)')
    }
    ALL_KEYS.each { k ->
        def col = vars.get("swan_q_${k}")
        if (col == null || col.isEmpty()) {
            throw new IllegalStateException("CSV column swan_q_${k} missing for run ${csvRunId}")
        }
        selected[k] = col.trim()
    }
    runId = "csv-${csvRunId}"
    vars.put('swan_run_id', runId)
} else {
    def rnd = new Random()
    ALL_KEYS.each { k ->
        selected[k] = OPTION_DEFS[rnd.nextInt(OPTION_DEFS.size())].id
    }
}

def questions = []
ALL_KEYS.eachWithIndex { key, idx ->
    def qdef = radioByKey[key]
    def optId = selected[key]
    def opt = OPTION_BY_ID[optId]
    def optMeta = qdef.options.find { it.value == optId }
    if (optMeta == null) {
        throw new IllegalStateException("Option ${optId} not in API definition for ${key}")
    }
    questions << [
        number     : idx + 1,
        questionId : key,
        optionId   : optId,
        text       : qdef.question,
        answer     : opt.label,
        points     : optMeta.score != null ? optMeta.score : opt.points,
        scored     : true,
    ]
}

def attentionAvg = avgPoints(ATTENTION_KEYS, selected)
def activityAvg = avgPoints(ACTIVITY_KEYS, selected)
def totalAvg = avgPoints(ALL_KEYS, selected)

def verifyScoring = 'true'.equalsIgnoreCase(
    (vars.get('swan_verify_scoring') ?: props.get('swan_verify_scoring') ?: 'true').toString()
)
if (verifyScoring) {
    // Cross-check item points against API option scores
    questions.each { q ->
        def expected = OPTION_BY_ID[q.optionId].points
        if (q.points != expected) {
            throw new IllegalStateException("Point mismatch ${q.questionId}: API ${q.points} vs map ${expected}")
        }
    }
}

def email = (vars.get('swan_report_email') ?: props.get('swan_report_email')
    ?: 'qa.neuly.synthetic+swan@example.test').toString()
def childYears = (vars.get('swan_child_age_years') ?: props.get('swan_child_age_years') ?: '7').toString()
def childMonths = (vars.get('swan_child_age_months') ?: props.get('swan_child_age_months') ?: '0').toString()
def marketing = 'true'.equalsIgnoreCase((vars.get('swan_marketing_opt_in') ?: props.get('swan_marketing_opt_in') ?: 'false').toString())

def payload = [
    email            : email,
    screenerTitle    : definition.form_name,
    screenerId       : definition.form_key,
    completedAt      : DateTimeFormatter.ISO_INSTANT.format(Instant.now()),
    questions        : questions,
    submittedAnswers : selected,
    scoreResult      : [
        formKey    : definition.form_key,
        totalScore : totalAvg,
        subscales  : [
            [label: 'Attention', score: attentionAvg],
            [label: 'Activity and impulsivity', score: activityAvg],
        ],
    ],
    marketingOptIn   : marketing,
    childAgeYears    : childYears,
    childAgeMonths   : childMonths,
]

vars.put('swan_report_body', JsonOutput.toJson(payload))
vars.put('swan_expected_total', String.valueOf(totalAvg))
vars.put('swan_expected_attention', String.valueOf(attentionAvg))
vars.put('swan_expected_activity', String.valueOf(activityAvg))
vars.put('swan_answer_mode_used', mode)

SampleResult.setSuccessful(true)
SampleResult.setResponseMessage("Built SWAN payload runId=${runId} mode=${mode} total=${totalAvg}")
