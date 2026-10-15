# Generate JMX with Java (JMeter API)

JMeter test plans are normally saved as **`.jmx` (XML)**. This folder contains a **Java builder** that creates the same plan using Apache JMeter’s Java API.

## Files

| File | Purpose |
|------|---------|
| `neuly/NeulyScreenersJmxBuilder.java` | Builds all 7 screener transactions + setup |
| `build_jmx.bat` | Compiles and writes `../neuly_screeners.jmx` |

## Build the JMX

```bat
cd c:\Users\PUJABANSODE\Neuly\Neuly-JMeter\java
build_jmx.bat
```

Output: `Neuly-JMeter\neuly_screeners.jmx`

## Manual compile (if batch fails)

```bat
set JMETER_HOME=C:\Users\PUJABANSODE\apache-jmeter-5.6.3 (1)\apache-jmeter-5.6.3
javac -encoding UTF-8 -cp "%JMETER_HOME%\lib\*" -d build\classes neuly\NeulyScreenersJmxBuilder.java
java -cp "build\classes;%JMETER_HOME%\lib\*" neuly.NeulyScreenersJmxBuilder "%JMETER_HOME%" "..\neuly_screeners.jmx"
```

## Run the generated plan

```bat
cd ..
run_neuly_tests.bat
```

**Note:** JMX is not Java source — it is XML. The Java class is only a **generator**; JMeter still executes the `.jmx` file.
