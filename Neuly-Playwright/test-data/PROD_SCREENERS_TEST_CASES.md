# PROD Screener Test Cases

## Scope
- Target environment: `https://neuly.ai/screeners`
- DEV configuration remains unchanged; all execution used `NEULY_BASE_URL=https://neuly.ai` at runtime only.
- Approved test data: the existing in-repo screener answer patterns and baseline data sets were used.
- No real user data was submitted or modified in Production.

## Screeners under test
1. GAD-7
2. SWAN
3. Vanderbilt
4. SCARED
5. CAST
6. AQ-Child
7. Q-CHAT

## Positive scenarios

| ID | Screener | Scenario | Steps | Expected result | Execution status |
|---|---|---|---|---|---|
| TC-POS-001 | GAD-7 | Baseline completion | Open `/screeners/gad_7_anxiety`, answer seven GAD-7 scored questions, answer difficulty question, verify result screen | All questions answered and results screen visible | PASS |
| TC-POS-002 | SWAN | Parent screener completion | Open `/screeners/swan_adhd_parent`, answer all questions using approved pattern, reach completion screen | Completion screen appears and report step is offered | PASS |
| TC-POS-003 | Vanderbilt | Parent screener completion | Open `/screeners/vanderbilt_assessment`, answer all items with approved pattern | Completion screen appears and result screen visible | PASS |
| TC-POS-004 | SCARED | Parent screener completion | Open `/screeners/screen_for_child_anxiety_related_disorders_parent`, complete workflow | Completion screen appears and result screen visible | PASS |
| TC-POS-005 | CAST | Parent screener completion | Open `/screeners/the_childhood_autism_spectrum_test`, complete workflow | Completion screen appears and result screen visible | PASS |
| TC-POS-006 | AQ-Child | Parent screener completion | Open `/screeners/aq_child_parent`, complete workflow | Completion screen appears and result screen visible | PASS |
| TC-POS-007 | Q-CHAT | Parent screener completion | Open `/screeners/q_chat_parent`, complete workflow | Completion screen appears and result screen visible | PASS |

## Negative scenarios

| ID | Screener | Scenario | Steps | Expected result | Execution status |
|---|---|---|---|---|---|
| TC-NEG-001 | All screeners | Report submission gate disabled | Keep report submission disabled through `PARENT_SEND_REPORT` / `GAD7_SEND_REPORT` | Submission button not triggered and no report request sent | Documented / not executed in PROD |
| TC-NEG-002 | All screeners | Invalid email | Enter malformed address and try to send | Validation error shown, send blocked | Documented / not executed in PROD |
| TC-NEG-003 | All screeners | Incomplete workflow | Stop before final answer step | Completion screen cannot appear and no report email is sent | Documented / not executed in PROD |

## Validation scenarios

| ID | Screener | Scenario | Steps | Expected result | Execution status |
|---|---|---|---|---|---|
| TC-VAL-001 | GAD-7 | Total score calculation | Use known value set with expected total of 8 / 0 / 21 | Total matches the score oracle exactly | PASS for baseline case |
| TC-VAL-002 | All parent screeners | Completion count / all questions answered | Complete all questions using approved answers | The completion indicator reads `All Questions Answered` and result screen is visible | PASS |
| TC-VAL-003 | All screeners | Browser evidence capture | Take screenshots at start and completion | Screenshots saved under each screener evidence folder | PASS |

## End-to-end scenarios

| ID | Screener | Scenario | Steps | Expected result | Execution status |
|---|---|---|---|---|---|
| TC-E2E-001 | GAD-7 | Full user journey | Load screener, answer all questions, view results, optionally complete report workflow | Page loads, questions complete, result page displays, evidence captured | PASS |
| TC-E2E-002 | Parent screeners | Full user journey for each screener | Open screener, answer all questions in pattern, reach completion screen, verify summary | Completion and result screen appear for all 6 parent screeners | PASS |

## Actual PROD run status
- 7 screener cases executed successfully in PROD.
- Result: 7 passed, 0 failed.
- No production data exposure was introduced; the automation used the existing approved answer patterns only.
