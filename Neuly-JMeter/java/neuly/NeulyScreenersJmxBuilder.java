package neuly;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.apache.jmeter.assertions.JSONPathAssertion;
import org.apache.jmeter.assertions.ResponseAssertion;
import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.config.ConfigTestElement;
import org.apache.jmeter.control.LoopController;
import org.apache.jmeter.control.TransactionController;
import org.apache.jmeter.protocol.http.control.Header;
import org.apache.jmeter.protocol.http.control.HeaderManager;
import org.apache.jmeter.protocol.http.sampler.HTTPSamplerProxy;
import org.apache.jmeter.reporters.ResultCollector;
import org.apache.jmeter.reporters.Summariser;
import org.apache.jmeter.save.SaveService;
import org.apache.jmeter.testelement.TestElement;
import org.apache.jmeter.testelement.TestPlan;
import org.apache.jmeter.threads.ThreadGroup;
import org.apache.jmeter.timers.ConstantTimer;
import org.apache.jmeter.util.JMeterUtils;
import org.apache.jorphan.collections.HashTree;
import org.apache.jorphan.collections.ListedHashTree;

/**
 * Builds {@code neuly_screeners.jmx} using the JMeter Java API (same plan as scripts/generate-jmx.mjs).
 *
 * <p>Run: {@code build_jmx.bat} or compile with JMeter lib classpath and:
 * {@code java -cp ... neuly.NeulyScreenersJmxBuilder [jmeterHome] [outputJmx]}
 */
public final class NeulyScreenersJmxBuilder {

    private record Assessment(String label, String formKey, int questionCount) {}

    private static final Assessment[] ASSESSMENTS = {
            new Assessment("Vanderbilt (NICHQ)", "vanderbilt_assessment", 55),
            new Assessment("SWAN", "swan_adhd_parent", 18),
            new Assessment("SCARED Parent", "screen_for_child_anxiety_related_disorders_parent", 41),
            new Assessment("GAD-7 Self", "gad_7_anxiety", 8),
            new Assessment("CAST", "the_childhood_autism_spectrum_test", 37),
            new Assessment("AQ-Child", "aq_child_parent", 50),
            new Assessment("Q-CHAT-25", "q_chat_parent", 25),
    };

    public static void main(String[] args) throws IOException {
        String jmeterHome = args.length > 0
                ? args[0]
                : "C:\\Users\\PUJABANSODE\\apache-jmeter-5.6.3 (1)\\apache-jmeter-5.6.3";
        Path out = args.length > 1
                ? Paths.get(args[1])
                : Paths.get("..", "neuly_screeners.jmx").toAbsolutePath().normalize();

        initJMeter(jmeterHome);

        ListedHashTree testPlanTree = new ListedHashTree();
        TestPlan testPlan = new TestPlan("Neuly Screeners (Manual Scorecards)");
        testPlan.setComment(
                "Built by NeulyScreenersJmxBuilder.java from Neuly_All_Age_Screener_Manual_Scorecards.xlsx. "
                        + "Public GET only; no report email submission.");
        testPlan.setFunctionalMode(false);
        testPlan.setSerialized(true);
        testPlan.setTearDownOnShutdown(true);
        HashTree planNode = testPlanTree.add(testPlan);

        planNode.add(httpDefaults());
        planNode.add(globalHeaders());

        HashTree setup = planNode.add(threadGroup("01 Setup - Screener catalogue", 1, 1));
        setup.add(httpGet("GET /screeners", "/screeners"), responseCode200());
        HashTree metaTree = setup.add(httpGet("GET /api/screeners/meta", "/api/screeners/meta"));
        metaTree.add(apiHeaders());
        metaTree.add(responseCode200());

        HashTree main = planNode.add(threadGroup("02 All assessments (scorecard combinations)", 1, 1));
        main.add(thinkTime());

        for (Assessment a : ASSESSMENTS) {
            HashTree tx = main.add(transaction("TX - " + a.label()));
            String pagePath = "/screeners/" + a.formKey();
            String apiPath = "/api/screeners/" + a.formKey();
            tx.add(httpGet("GET page " + pagePath, pagePath), responseCode200());
            HashTree apiTree = tx.add(httpGet("GET API " + apiPath, apiPath));
            apiTree.add(apiHeaders());
            apiTree.add(responseCode200());
            apiTree.add(jsonEquals("$.form_key", a.formKey()));
            apiTree.add(jsonEquals("$.question_count", String.valueOf(a.questionCount())));
        }

        planNode.add(summaryReport());

        File outFile = out.toFile();
        outFile.getParentFile().mkdirs();
        SaveService.saveTree(testPlanTree, outFile);
        System.out.println("Wrote JMX: " + outFile.getAbsolutePath());
    }

    private static void initJMeter(String jmeterHome) {
        File home = new File(jmeterHome);
        if (!home.isDirectory()) {
            throw new IllegalArgumentException("JMeter home not found: " + jmeterHome);
        }
        JMeterUtils.setJMeterHome(home.getAbsolutePath());
        File props = new File(home, "bin/jmeter.properties");
        JMeterUtils.loadJMeterProperties(props.getAbsolutePath());
        JMeterUtils.initLocale();
        try {
            SaveService.loadProperties();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load JMeter SaveService properties", e);
        }
    }

    private static ConfigTestElement httpDefaults() {
        ConfigTestElement defaults = new ConfigTestElement();
        defaults.setName("HTTP Request Defaults");
        defaults.setProperty(TestElement.GUI_CLASS, "HttpDefaultsGui");
        defaults.setProperty(TestElement.TEST_CLASS, ConfigTestElement.class.getName());
        defaults.setEnabled(true);
        defaults.setProperty("HTTPSampler.domain", "${__P(host,demo.neuly.ai)}");
        defaults.setProperty("HTTPSampler.protocol", "${__P(protocol,https)}");
        defaults.setProperty("HTTPSampler.connect_timeout", "${__P(connect_timeout_ms,10000)}");
        defaults.setProperty("HTTPSampler.response_timeout", "${__P(response_timeout_ms,30000)}");
        return defaults;
    }

    private static HeaderManager globalHeaders() {
        HeaderManager hm = new HeaderManager();
        hm.setName("Global HTTP Headers");
        hm.add(new Header("User-Agent", "Neuly-JMeter/1.0 (QA; synthetic)"));
        hm.add(new Header("Accept-Language", "en-GB,en;q=0.9"));
        return hm;
    }

    private static HeaderManager apiHeaders() {
        HeaderManager hm = new HeaderManager();
        hm.setName("API headers");
        hm.add(new Header("Accept", "application/json"));
        hm.add(new Header("Referer", "${__P(referer,https://demo.neuly.ai/screeners)}"));
        return hm;
    }

    private static ThreadGroup threadGroup(String name, int threads, int rampUp) {
        LoopController loop = new LoopController();
        loop.setLoops(1);
        loop.setContinueForever(false);
        loop.setName("Loop Controller");
        loop.initialize();

        ThreadGroup tg = new ThreadGroup();
        tg.setName(name);
        tg.setNumThreads(threads);
        tg.setRampUp(rampUp);
        tg.setSamplerController(loop);
        tg.setProperty("ThreadGroup.on_sample_error", "continue");
        tg.setScheduler(false);
        return tg;
    }

    private static ConstantTimer thinkTime() {
        ConstantTimer timer = new ConstantTimer();
        timer.setName("Think time between assessments");
        timer.setDelay("${__P(think_time_ms,250)}");
        return timer;
    }

    private static TransactionController transaction(String name) {
        TransactionController tx = new TransactionController();
        tx.setName(name);
        tx.setGenerateParentSample(true);
        tx.setIncludeTimers(false);
        return tx;
    }

    private static HTTPSamplerProxy httpGet(String name, String path) {
        HTTPSamplerProxy sampler = new HTTPSamplerProxy();
        sampler.setName(name);
        sampler.setDomain("${__P(host,demo.neuly.ai)}");
        sampler.setProtocol("${__P(protocol,https)}");
        sampler.setPath(path);
        sampler.setMethod("GET");
        sampler.setFollowRedirects(true);
        sampler.setUseKeepAlive(true);
        sampler.setProperty("HTTPSampler.connect_timeout", "${__P(connect_timeout_ms,10000)}");
        sampler.setProperty("HTTPSampler.response_timeout", "${__P(response_timeout_ms,30000)}");
        sampler.setArguments(new Arguments());
        return sampler;
    }

    private static ResponseAssertion responseCode200() {
        ResponseAssertion ra = new ResponseAssertion();
        ra.setName("Assert response code 200");
        ra.setProperty("Assertion.test_field", "Assertion.response_code");
        ra.setProperty("Assertion.test_type", ResponseAssertion.EQUALS);
        List<String> patterns = new ArrayList<>();
        patterns.add("200");
        ra.setTestStrings(patterns);
        ra.setCustomFailureMessage("Expected HTTP 200");
        return ra;
    }

    private static JSONPathAssertion jsonEquals(String jsonPath, String expected) {
        JSONPathAssertion assertion = new JSONPathAssertion();
        assertion.setName("Assert " + jsonPath);
        assertion.setJsonPath(jsonPath);
        assertion.setExpectedValue(expected);
        assertion.setJsonValidationBool(true);
        assertion.setExpectNull(false);
        assertion.setInvert(false);
        assertion.setIsRegex(false);
        return assertion;
    }

    private static ResultCollector summaryReport() {
        ResultCollector collector = new ResultCollector(new Summariser("summary"));
        collector.setName("Summary Report");
        collector.setEnabled(true);
        return collector;
    }
}
