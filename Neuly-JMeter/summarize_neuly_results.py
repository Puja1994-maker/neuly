#!/usr/bin/env python3
"""
Parse Neuly JMeter JTL output and print a CMD-friendly assessment summary.

Groups by transaction controllers defined in neuly_screeners.jmx (TX - *).
Setup samplers (GET /screeners, GET /api/screeners/meta) are excluded from assessments.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional, Tuple

# Display name -> (JMeter transaction label, required child sampler labels from neuly_screeners.jmx)
ASSESSMENTS: List[Tuple[str, str, List[str]]] = [
    (
        "Vanderbilt (NICHQ)",
        "TX - Vanderbilt (NICHQ)",
        [
            "GET page /screeners/vanderbilt_assessment",
            "GET API /api/screeners/vanderbilt_assessment",
        ],
    ),
    (
        "SWAN",
        "TX - SWAN",
        [
            "GET page /screeners/swan_adhd_parent",
            "GET API /api/screeners/swan_adhd_parent",
        ],
    ),  # optional: POST /api/screener-report (SWAN) when enable_swan_report_submit=true
    (
        "SCARED Parent",
        "TX - SCARED Parent",
        [
            "GET page /screeners/screen_for_child_anxiety_related_disorders_parent",
            "GET API /api/screeners/screen_for_child_anxiety_related_disorders_parent",
        ],
    ),
    (
        "GAD-7 Self",
        "TX - GAD-7 Self",
        [
            "GET page /screeners/gad_7_anxiety",
            "GET API /api/screeners/gad_7_anxiety",
        ],
    ),
    (
        "CAST",
        "TX - CAST",
        [
            "GET page /screeners/the_childhood_autism_spectrum_test",
            "GET API /api/screeners/the_childhood_autism_spectrum_test",
        ],
    ),
    (
        "AQ-Child",
        "TX - AQ-Child",
        [
            "GET page /screeners/aq_child_parent",
            "GET API /api/screeners/aq_child_parent",
        ],
    ),
    (
        "Q-CHAT-25",
        "TX - Q-CHAT-25",
        [
            "GET page /screeners/q_chat_parent",
            "GET API /api/screeners/q_chat_parent",
        ],
    ),
]

OPTIONAL_SAMPLER_BY_TX: dict[str, str] = {
    "TX - SWAN": "POST /api/screener-report (SWAN)",
}

TX_SAMPLES_RE = re.compile(
    r"Number of samples in transaction\s*:\s*(\d+)\s*,\s*number of failing samples\s*:\s*(\d+)",
    re.IGNORECASE,
)


@dataclass
class SampleRow:
    timestamp: int
    elapsed: int
    label: str
    success: bool
    response_message: str


@dataclass
class SwanReportMeta:
    run_id: str
    answer_mode: str
    post_elapsed_ms: int
    overall_pass: bool
    report_message: str
    total_score: str
    attention_score: str
    activity_score: str
    present: bool = True


def load_swan_meta(path: Optional[Path]) -> Optional[SwanReportMeta]:
    if path is None or not path.is_file():
        return None
    try:
        data: Dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return SwanReportMeta(
            run_id="",
            answer_mode="",
            post_elapsed_ms=0,
            overall_pass=False,
            report_message="Could not parse SWAN meta file",
            total_score="",
            attention_score="",
            activity_score="",
            present=True,
        )
    expected = data.get("expectedScores") or {}
    summary = data.get("resultSummary") or {}
    return SwanReportMeta(
        run_id=str(data.get("runId", "")),
        answer_mode=str(data.get("answerMode", "")),
        post_elapsed_ms=int(data.get("postElapsedMs") or 0),
        overall_pass=bool(data.get("overallPass")),
        report_message=str(data.get("reportMessage") or ""),
        total_score=str(
            expected.get("totalScore") or summary.get("totalScoreDisplay") or ""
        ),
        attention_score=str(
            expected.get("attention") or summary.get("attentionDisplay") or ""
        ),
        activity_score=str(
            expected.get("activity") or summary.get("activityDisplay") or ""
        ),
        present=True,
    )


@dataclass
class AssessmentResult:
    display_name: str
    status: str
    sample_count: int = 0
    passed: int = 0
    failed: int = 0
    avg_ms: float = 0.0
    detail: str = ""


def read_jtl(path: Path) -> List[SampleRow]:
    rows: List[SampleRow] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for raw in reader:
            label = (raw.get("label") or "").strip()
            if not label:
                continue
            success_raw = (raw.get("success") or "").strip().lower()
            success = success_raw == "true"
            try:
                ts = int(raw.get("timeStamp") or 0)
            except ValueError:
                ts = 0
            try:
                elapsed = int(float(raw.get("elapsed") or 0))
            except ValueError:
                elapsed = 0
            rows.append(
                SampleRow(
                    timestamp=ts,
                    elapsed=elapsed,
                    label=label,
                    success=success,
                    response_message=(raw.get("responseMessage") or "").strip(),
                )
            )
    return rows


def last_row_by_label(rows: List[SampleRow], label: str) -> Optional[SampleRow]:
    matches = [r for r in rows if r.label == label]
    if not matches:
        return None
    return max(matches, key=lambda r: r.timestamp)


def parse_tx_row(tx: Optional[SampleRow]) -> Tuple[Optional[int], Optional[int]]:
    if not tx:
        return None, None
    m = TX_SAMPLES_RE.search(tx.response_message)
    if not m:
        return None, None
    return int(m.group(1)), int(m.group(2))


def evaluate_assessment(
    rows: List[SampleRow],
    display_name: str,
    tx_label: str,
    child_labels: List[str],
    blocked_reason: Optional[str],
) -> AssessmentResult:
    if blocked_reason:
        return AssessmentResult(
            display_name=display_name,
            status="BLOCKED",
            detail=blocked_reason,
        )

    tx = last_row_by_label(rows, tx_label)
    child_rows = [last_row_by_label(rows, lbl) for lbl in child_labels]

    if tx is None and all(r is None for r in child_rows):
        return AssessmentResult(display_name=display_name, status="NOT RUN")

    optional_label = OPTIONAL_SAMPLER_BY_TX.get(tx_label)
    optional_row = last_row_by_label(rows, optional_label) if optional_label else None

    present_children = [r for r in child_rows if r is not None]
    if optional_row is not None:
        present_children.append(optional_row)

    if len([r for r in child_rows if r is not None]) != len(child_labels):
        return AssessmentResult(
            display_name=display_name,
            status="NOT RUN",
            sample_count=len(present_children),
            passed=sum(1 for r in present_children if r.success),
            failed=sum(1 for r in present_children if not r.success),
            avg_ms=mean([r.elapsed for r in present_children]) if present_children else 0.0,
            detail="Missing required sampler(s) in JTL",
        )

    sample_count = len(present_children)
    passed = sum(1 for r in present_children if r.success)
    failed = sample_count - passed
    avg_ms = mean([r.elapsed for r in present_children])

    tx_samples, tx_failing = parse_tx_row(tx)
    if tx is not None:
        if tx_samples == 0:
            return AssessmentResult(
                display_name=display_name,
                status="NOT RUN",
                sample_count=sample_count,
                passed=passed,
                failed=failed,
                avg_ms=avg_ms,
                detail="Transaction recorded zero child samples",
            )
        if tx_failing is not None and tx_failing > 0:
            return AssessmentResult(
                display_name=display_name,
                status="FAIL",
                sample_count=sample_count,
                passed=passed,
                failed=failed,
                avg_ms=avg_ms,
                detail=f"Transaction failing samples: {tx_failing}",
            )
        if not tx.success:
            return AssessmentResult(
                display_name=display_name,
                status="FAIL",
                sample_count=sample_count,
                passed=passed,
                failed=failed,
                avg_ms=avg_ms,
                detail="Transaction sample marked unsuccessful",
            )

    required_present = [r for r in child_rows if r is not None]
    required_failed = sum(1 for r in required_present if not r.success)
    optional_failed = optional_row is not None and not optional_row.success
    if required_failed > 0 or optional_failed:
        return AssessmentResult(
            display_name=display_name,
            status="FAIL",
            sample_count=sample_count,
            passed=passed,
            failed=failed,
            avg_ms=avg_ms,
            detail="One or more required requests failed assertions"
            + (" (includes optional report submit)" if optional_failed else ""),
        )

    if tx_samples is not None and tx_samples < len(child_labels):
        return AssessmentResult(
            display_name=display_name,
            status="FAIL",
            sample_count=sample_count,
            passed=passed,
            failed=failed,
            avg_ms=avg_ms,
            detail=f"Expected {len(child_labels)} transaction samples, saw {tx_samples}",
        )

    return AssessmentResult(
        display_name=display_name,
        status="PASS",
        sample_count=sample_count,
        passed=passed,
        failed=failed,
        avg_ms=avg_ms,
    )


def pad_name(name: str, width: int = 18) -> str:
    return name + (" " * max(0, width - len(name)))


def print_report(
    results: List[AssessmentResult],
    jtl_path: Path,
    html_report_dir: Optional[Path],
    swan_meta: Optional[SwanReportMeta],
) -> int:
    counts = {"PASS": 0, "FAIL": 0, "NOT RUN": 0, "BLOCKED": 0}
    for r in results:
        counts[r.status] = counts.get(r.status, 0) + 1

    print("========================================")
    print("NEULY SCREENER TEST EXECUTION SUMMARY")
    print("========================================")
    for r in results:
        print(f"{pad_name(r.display_name)} : {r.status}")
        print(
            f"  samples={r.sample_count}  passed={r.passed}  failed={r.failed}  "
            f"avg_ms={r.avg_ms:.0f}"
        )
        if r.detail:
            print(f"  note: {r.detail}")
        if r.display_name == "SWAN" and swan_meta is not None and swan_meta.present:
            status = "PASS" if swan_meta.overall_pass else "FAIL"
            print("  SWAN report submit (email flow):")
            print(f"    run_id={swan_meta.run_id}  mode={swan_meta.answer_mode}")
            print(
                f"    scores (client/oracle): total={swan_meta.total_score}  "
                f"attention={swan_meta.attention_score}  "
                f"activity={swan_meta.activity_score}"
            )
            print(
                f"    post_ms={swan_meta.post_elapsed_ms}  submit={status}  "
                f"api_message={swan_meta.report_message!r}"
            )
        elif r.display_name == "SWAN" and swan_meta is None:
            print("  SWAN report submit: not run (enable_swan_report_submit=false)")
    print("----------------------------------------")
    print(f"Total assessments  : {len(results)}")
    print(f"Passed             : {counts.get('PASS', 0)}")
    print(f"Failed             : {counts.get('FAIL', 0)}")
    print(f"Not run            : {counts.get('NOT RUN', 0)}")
    print(f"Blocked            : {counts.get('BLOCKED', 0)}")
    print("----------------------------------------")
    print(f"JTL results        : {jtl_path}")
    if html_report_dir:
        print(f"HTML report        : {html_report_dir}")
    print("========================================")

    if counts.get("FAIL", 0) or counts.get("BLOCKED", 0) or counts.get("NOT RUN", 0):
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize Neuly JMeter JTL results")
    parser.add_argument("jtl", type=Path, help="Path to JTL results file")
    parser.add_argument(
        "--html-report",
        type=Path,
        default=None,
        help="Path to HTML report directory or index.html",
    )
    parser.add_argument(
        "--blocked-reason",
        default="",
        help="If set, mark all assessments BLOCKED with this reason",
    )
    parser.add_argument(
        "--swan-meta",
        type=Path,
        default=None,
        help="JSON written by SWAN POST run (no email logged)",
    )
    args = parser.parse_args()

    jtl_path = args.jtl.resolve()
    html_dir: Optional[Path] = None
    if args.html_report:
        html_path = args.html_report.resolve()
        html_dir = html_path if html_path.is_dir() else html_path.parent

    blocked = args.blocked_reason.strip() or None
    swan_meta_path = args.swan_meta.resolve() if args.swan_meta else None
    swan_meta = load_swan_meta(swan_meta_path)

    if not jtl_path.is_file():
        print(f"ERROR: JTL file not found: {jtl_path}", file=sys.stderr)
        results = [
            AssessmentResult(
                display_name=name,
                status="BLOCKED",
                detail="JTL file missing",
            )
            for name, _, _ in ASSESSMENTS
        ]
        print_report(results, jtl_path, html_dir, swan_meta)
        return 1

    try:
        rows = read_jtl(jtl_path)
    except OSError as exc:
        print(f"ERROR: Cannot read JTL: {exc}", file=sys.stderr)
        return 1

    if not rows:
        blocked = blocked or "JTL contains no samples"

    results = [
        evaluate_assessment(rows, display, tx, children, blocked)
        for display, tx, children in ASSESSMENTS
    ]
    return print_report(results, jtl_path, html_dir, swan_meta)


if __name__ == "__main__":
    sys.exit(main())
