#!/usr/bin/env python3
"""Local CLI for Print-OS agent and operator workflows."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from typing import Any


DEFAULT_BASE_URL = "http://127.0.0.1:8000"

API_RESOURCES = {
    "health": "/health",
    "printers": "/api/v1/printers/",
    "jobs": "/api/v1/jobs/",
    "queue": "/api/v1/queue/",
    "inventory": "/api/v1/inventory/",
    "business": "/api/v1/business/summary",
    "system": "/api/v1/system/backup",
}

MANIFEST = {
    "name": "Print-OS",
    "repository": "https://github.com/simongonzalezdc/Print-OS",
    "purpose": "Local-first 3D print farm management, costing, queues, and AI-assisted CAD.",
    "components": {
        "caedo-api": "FastAPI backend for printers, jobs, queue, inventory, costing, backup, and Streamlit operations.",
        "caedo-web": "Next.js 16 dashboard and CAD/analytics surface.",
        "modules/3d-designer": "Standalone Three.js/JSCAD AI-assisted parametric design workspace.",
    },
    "local_ports": {
        "api": DEFAULT_BASE_URL,
        "caedo-web": "http://127.0.0.1:3002",
        "3d-designer": "http://127.0.0.1:3003",
        "streamlit": "http://127.0.0.1:8501",
    },
    "verification": [
        "cd caedo-api && python -m pytest -q",
        "cd caedo-web && SKIP_OLLAMA_BOOT=true npm run validate",
        "cd modules/3d-designer && SKIP_OLLAMA_BOOT=true npm run validate",
        "bash scripts/smoke-test.sh",
    ],
    "privacy_boundary": "Do not commit .env, printer credentials, customer data, local databases, .omx, .next, node_modules, or scratch exports.",
}


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, sort_keys=True))


def format_output(data: Any, output: str) -> None:
    if output == "json":
        print_json(data)
        return
    if isinstance(data, dict):
        for key, value in data.items():
            print(f"{key}: {value}")
    else:
        print(data)


def request_json(method: str, url: str, payload: dict[str, Any] | None = None, timeout: float = 10.0) -> Any:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Accept", "application/json")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"{method} {url} failed: {exc.reason}") from exc


def endpoint_url(base_url: str, resource: str) -> str:
    if resource not in API_RESOURCES:
        raise ValueError(f"unknown resource {resource!r}; choose one of {', '.join(sorted(API_RESOURCES))}")
    return base_url.rstrip("/") + API_RESOURCES[resource]


def build_job_payload(args: argparse.Namespace) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "name": args.name,
        "source": args.source,
        "priority": args.priority,
        "material": args.material,
        "width_mm": args.width,
        "depth_mm": args.depth,
        "height_mm": args.height,
        "status": "queued",
    }
    optional = {
        "weight_g": args.weight,
        "estimated_minutes": args.minutes,
        "notes": args.notes,
        "recommended_printer_id": args.recommended_printer_id,
        "assigned_printer_id": args.assigned_printer_id,
    }
    payload.update({key: value for key, value in optional.items() if value is not None})
    return payload


def add_job_payload_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--name", required=True)
    parser.add_argument("--material", choices=["PLA", "PETG", "TPU"], default="PLA")
    parser.add_argument("--width", type=float, required=True, help="Width in mm")
    parser.add_argument("--depth", type=float, required=True, help="Depth in mm")
    parser.add_argument("--height", type=float, required=True, help="Height in mm")
    parser.add_argument("--weight", type=float, help="Estimated filament weight in grams")
    parser.add_argument("--minutes", type=int, help="Estimated print time in minutes")
    parser.add_argument("--priority", choices=["urgent", "normal", "low"], default="normal")
    parser.add_argument("--source", default="personal")
    parser.add_argument("--notes")
    parser.add_argument("--recommended-printer-id", type=int)
    parser.add_argument("--assigned-printer-id", type=int)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Print-OS local operator CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    manifest = subparsers.add_parser("manifest", help="Print architecture, ports, and verification guidance")
    manifest.add_argument("--format", choices=["json", "text"], default="text")

    job_payload = subparsers.add_parser("job-payload", help="Build a validated print-job JSON payload")
    add_job_payload_args(job_payload)
    job_payload.add_argument("--format", choices=["json", "text"], default="json")

    api_get = subparsers.add_parser("api-get", help="Read a safe local API resource")
    api_get.add_argument("resource", choices=sorted(API_RESOURCES))
    api_get.add_argument("--base-url", default=DEFAULT_BASE_URL)
    api_get.add_argument("--format", choices=["json", "text"], default="json")

    create_job = subparsers.add_parser("create-job", help="Create a queued print job through the local FastAPI backend")
    add_job_payload_args(create_job)
    create_job.add_argument("--base-url", default=DEFAULT_BASE_URL)
    create_job.add_argument("--format", choices=["json", "text"], default="json")

    args = parser.parse_args(argv)

    try:
        if args.command == "manifest":
            format_output(MANIFEST, args.format)
        elif args.command == "job-payload":
            format_output(build_job_payload(args), args.format)
        elif args.command == "api-get":
            format_output(request_json("GET", endpoint_url(args.base_url, args.resource)), args.format)
        elif args.command == "create-job":
            format_output(request_json("POST", endpoint_url(args.base_url, "jobs"), build_job_payload(args)), args.format)
        else:
            parser.error(f"unknown command {args.command}")
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
