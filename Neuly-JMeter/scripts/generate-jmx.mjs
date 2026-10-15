import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outJmx = path.resolve(__dirname, '../neuly_screeners.jmx');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function httpSampler(name, method, pathExpr) {
  return `
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${esc(name)}" enabled="true">
          <stringProp name="HTTPSampler.domain">\${__P(host,demo.neuly.ai)}</stringProp>
          <stringProp name="HTTPSampler.protocol">\${__P(protocol,https)}</stringProp>
          <stringProp name="HTTPSampler.path">${pathExpr}</stringProp>
          <stringProp name="HTTPSampler.method">${method}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <stringProp name="HTTPSampler.connect_timeout">\${__P(connect_timeout_ms,10000)}</stringProp>
          <stringProp name="HTTPSampler.response_timeout">\${__P(response_timeout_ms,30000)}</stringProp>
          <boolProp name="HTTPSampler.postBodyRaw">false</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
        </HTTPSamplerProxy>`;
}

function responseAssertion200() {
  return `
          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert response code 200" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="49586">200</stringProp>
            </collectionProp>
            <stringProp name="Assertion.custom_message">Expected HTTP 200</stringProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>`;
}

function jsonAssertionFormKey(formKey) {
  return `
          <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="Assert form_key" enabled="true">
            <stringProp name="JSON_PATH">$.form_key</stringProp>
            <stringProp name="EXPECTED_VALUE">${formKey}</stringProp>
            <boolProp name="JSONVALIDATION">true</boolProp>
            <boolProp name="EXPECT_NULL">false</boolProp>
            <boolProp name="INVERT">false</boolProp>
            <boolProp name="ISREGEX">false</boolProp>
          </JSONPathAssertion>
          <hashTree/>`;
}

const assessments = [
  ['Vanderbilt (NICHQ)', 'vanderbilt_assessment', 55], // API question_count (workbook: 55 scored + performance items)
  ['SWAN', 'swan_adhd_parent', 18],
  ['SCARED Parent', 'screen_for_child_anxiety_related_disorders_parent', 41],
  ['GAD-7 Self', 'gad_7_anxiety', 8],
  ['CAST', 'the_childhood_autism_spectrum_test', 37],
  ['AQ-Child', 'aq_child_parent', 50],
  ['Q-CHAT-25', 'q_chat_parent', 25],
];

let assessmentControllers = '';
for (const [label, formKey, qCount] of assessments) {
  const txName = `TX - ${label}`;
  assessmentControllers += `
        <TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="${esc(txName)}" enabled="true">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
          <boolProp name="TransactionController.parent">true</boolProp>
        </TransactionController>
        <hashTree>
            ${httpSampler(`GET page /screeners/${formKey}`, 'GET', `/screeners/${formKey}`)}
            <hashTree>
              ${responseAssertion200()}
            </hashTree>
            ${httpSampler(`GET API /api/screeners/${formKey}`, 'GET', `/api/screeners/${formKey}`)}
            <hashTree>
              <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="API headers" enabled="true">
                <collectionProp name="HeaderManager.headers">
                  <elementProp name="Accept" elementType="Header">
                    <stringProp name="Header.name">Accept</stringProp>
                    <stringProp name="Header.value">application/json</stringProp>
                  </elementProp>
                  <elementProp name="Referer" elementType="Header">
                    <stringProp name="Header.name">Referer</stringProp>
                    <stringProp name="Header.value">\${__P(referer,https://demo.neuly.ai/screeners)}</stringProp>
                  </elementProp>
                </collectionProp>
              </HeaderManager>
              <hashTree/>
              ${responseAssertion200()}
              ${jsonAssertionFormKey(formKey)}
              <JSONPathAssertion guiclass="JSONPathAssertionGui" testclass="JSONPathAssertion" testname="Assert question_count present" enabled="true">
                <stringProp name="JSON_PATH">$.question_count</stringProp>
                <stringProp name="EXPECTED_VALUE">${qCount}</stringProp>
                <boolProp name="JSONVALIDATION">true</boolProp>
                <boolProp name="EXPECT_NULL">false</boolProp>
                <boolProp name="INVERT">false</boolProp>
                <boolProp name="ISREGEX">false</boolProp>
              </JSONPathAssertion>
              <hashTree/>
            </hashTree>
        </hashTree>`;
}

const jmx = `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Neuly Screeners (Manual Scorecards)" enabled="true">
      <stringProp name="TestPlan.comments">Derived from Neuly_All_Age_Screener_Manual_Scorecards.xlsx and observed demo.neuly.ai routes. Public GET only; no report email submission.</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">true</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
    </TestPlan>
    <hashTree>
      <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults" enabled="true">
        <stringProp name="HTTPSampler.domain">\${__P(host,demo.neuly.ai)}</stringProp>
        <stringProp name="HTTPSampler.protocol">\${__P(protocol,https)}</stringProp>
        <stringProp name="HTTPSampler.connect_timeout">\${__P(connect_timeout_ms,10000)}</stringProp>
        <stringProp name="HTTPSampler.response_timeout">\${__P(response_timeout_ms,30000)}</stringProp>
        <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
          <collectionProp name="Arguments.arguments"/>
        </elementProp>
      </ConfigTestElement>
      <hashTree/>
      <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Global HTTP Headers" enabled="true">
        <collectionProp name="HeaderManager.headers">
          <elementProp name="User-Agent" elementType="Header">
            <stringProp name="Header.name">User-Agent</stringProp>
            <stringProp name="Header.value">Neuly-JMeter/1.0 (QA; synthetic)</stringProp>
          </elementProp>
          <elementProp name="Accept-Language" elementType="Header">
            <stringProp name="Header.name">Accept-Language</stringProp>
            <stringProp name="Header.value">en-GB,en;q=0.9</stringProp>
          </elementProp>
        </collectionProp>
      </HeaderManager>
      <hashTree/>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="01 Setup - Screener catalogue" enabled="true">
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        ${httpSampler('GET /screeners', 'GET', '/screeners')}
        <hashTree>${responseAssertion200()}</hashTree>
        ${httpSampler('GET /api/screeners/meta', 'GET', '/api/screeners/meta')}
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="API headers" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="Accept" elementType="Header">
                <stringProp name="Header.name">Accept</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
              <elementProp name="Referer" elementType="Header">
                <stringProp name="Header.name">Referer</stringProp>
                <stringProp name="Header.value">\${__P(referer,https://demo.neuly.ai/screeners)}</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
          ${responseAssertion200()}
        </hashTree>
      </hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="02 All assessments (scorecard combinations)" enabled="true">
        <stringProp name="ThreadGroup.num_threads">1</stringProp>
        <stringProp name="ThreadGroup.ramp_time">1</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        <ConstantTimer guiclass="ConstantTimerGui" testclass="ConstantTimer" testname="Think time between assessments" enabled="true">
          <stringProp name="ConstantTimer.delay">\${__P(think_time_ms,250)}</stringProp>
        </ConstantTimer>
        <hashTree/>
${assessmentControllers}
      </hashTree>
      <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time><latency>true</latency><timestamp>true</timestamp><success>true</success>
            <label>true</label><code>true</code><message>true</message><threadName>true</threadName>
            <dataType>true</dataType><encoding>false</encoding><assertions>true</assertions><subresults>true</subresults>
            <responseData>false</responseData><samplerData>false</samplerData><xml>false</xml><fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders><requestHeaders>false</requestHeaders><responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage><assertionsResultsToSave>0</assertionsResultsToSave>
            <bytes>true</bytes><sentBytes>true</sentBytes><url>true</url><threadCounts>true</threadCounts>
            <idleTime>true</idleTime><connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename"></stringProp>
      </ResultCollector>
      <hashTree/>
    </hashTree>
  </hashTree>
</jmeterTestPlan>`;

fs.writeFileSync(outJmx, jmx, 'utf8');
console.log('Wrote', outJmx);
