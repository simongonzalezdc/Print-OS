from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def run_tool(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )


def test_agent_surface_files_exist():
    required = [
        ".mcp.json",
        "tools/print_os_cli.py",
        "tools/print_os_mcp.py",
        "skills/print-os/SKILL.md",
        "skills/print-os/agents/openai.yaml",
    ]
    for path in required:
        assert (ROOT / path).exists(), path


def test_cli_manifest_and_job_payload_are_valid_json():
    manifest = run_tool("tools/print_os_cli.py", "manifest", "--format", "json")
    manifest_json = json.loads(manifest.stdout)
    assert manifest_json["name"] == "Print-OS"
    assert "caedo-api" in manifest_json["components"]

    payload = run_tool(
        "tools/print_os_cli.py",
        "job-payload",
        "--name",
        "Test Bracket",
        "--material",
        "PLA",
        "--width",
        "40",
        "--depth",
        "20",
        "--height",
        "12",
    )
    payload_json = json.loads(payload.stdout)
    assert payload_json["status"] == "queued"
    assert payload_json["material"] == "PLA"


def test_mcp_self_test_lists_tools():
    result = run_tool("tools/print_os_mcp.py", "--self-test")
    data = json.loads(result.stdout)
    assert "print_os_manifest" in data["tools"]
    assert "print_os_create_job" in data["tools"]


def test_mcp_config_names_print_os_server():
    config = json.loads((ROOT / ".mcp.json").read_text())
    assert "print-os" in config["mcpServers"]
