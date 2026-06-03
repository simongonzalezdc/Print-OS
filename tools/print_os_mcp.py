#!/usr/bin/env python3
"""Minimal stdio MCP server for Print-OS."""

from __future__ import annotations

import argparse
import json
import sys
from argparse import Namespace
from typing import Any

from print_os_cli import DEFAULT_BASE_URL, MANIFEST, build_job_payload, endpoint_url, request_json


SERVER_INFO = {"name": "print-os", "version": "0.1.0"}


TOOLS = [
    {
        "name": "print_os_manifest",
        "description": "Return Print-OS architecture, local ports, verification commands, and public repo privacy boundary.",
        "inputSchema": {"type": "object", "properties": {}},
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "print_os_job_payload",
        "description": "Build a validated queued print-job JSON payload for the Print-OS API.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "material": {"type": "string", "enum": ["PLA", "PETG", "TPU"], "default": "PLA"},
                "width": {"type": "number"},
                "depth": {"type": "number"},
                "height": {"type": "number"},
                "weight": {"type": "number"},
                "minutes": {"type": "integer"},
                "priority": {"type": "string", "enum": ["urgent", "normal", "low"], "default": "normal"},
                "source": {"type": "string", "default": "personal"},
                "notes": {"type": "string"},
                "recommended_printer_id": {"type": "integer"},
                "assigned_printer_id": {"type": "integer"},
            },
            "required": ["name", "width", "depth", "height"],
        },
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "print_os_api_get",
        "description": "Read a safe resource from a running local Print-OS FastAPI backend.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "resource": {"type": "string", "enum": ["health", "printers", "jobs", "queue", "inventory", "business"]},
                "base_url": {"type": "string", "default": DEFAULT_BASE_URL},
            },
            "required": ["resource"],
        },
        "annotations": {"readOnlyHint": True, "destructiveHint": False},
    },
    {
        "name": "print_os_create_job",
        "description": "Create a queued print job through the running local Print-OS FastAPI backend.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "base_url": {"type": "string", "default": DEFAULT_BASE_URL},
                "name": {"type": "string"},
                "material": {"type": "string", "enum": ["PLA", "PETG", "TPU"], "default": "PLA"},
                "width": {"type": "number"},
                "depth": {"type": "number"},
                "height": {"type": "number"},
                "weight": {"type": "number"},
                "minutes": {"type": "integer"},
                "priority": {"type": "string", "enum": ["urgent", "normal", "low"], "default": "normal"},
                "source": {"type": "string", "default": "personal"},
                "notes": {"type": "string"},
                "recommended_printer_id": {"type": "integer"},
                "assigned_printer_id": {"type": "integer"},
            },
            "required": ["name", "width", "depth", "height"],
        },
        "annotations": {"readOnlyHint": False, "destructiveHint": False},
    },
]


def _namespace(arguments: dict[str, Any]) -> Namespace:
    return Namespace(
        name=arguments["name"],
        material=arguments.get("material", "PLA"),
        width=arguments["width"],
        depth=arguments["depth"],
        height=arguments["height"],
        weight=arguments.get("weight"),
        minutes=arguments.get("minutes"),
        priority=arguments.get("priority", "normal"),
        source=arguments.get("source", "personal"),
        notes=arguments.get("notes"),
        recommended_printer_id=arguments.get("recommended_printer_id"),
        assigned_printer_id=arguments.get("assigned_printer_id"),
    )


def _content(data: Any) -> dict[str, Any]:
    text = data if isinstance(data, str) else json.dumps(data, indent=2, sort_keys=True)
    return {"content": [{"type": "text", "text": text}]}


def call_tool(name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    if name == "print_os_manifest":
        return _content(MANIFEST)
    if name == "print_os_job_payload":
        return _content(build_job_payload(_namespace(arguments)))
    if name == "print_os_api_get":
        base_url = arguments.get("base_url", DEFAULT_BASE_URL)
        return _content(request_json("GET", endpoint_url(base_url, arguments["resource"])))
    if name == "print_os_create_job":
        base_url = arguments.get("base_url", DEFAULT_BASE_URL)
        return _content(request_json("POST", endpoint_url(base_url, "jobs"), build_job_payload(_namespace(arguments))))
    raise ValueError(f"unknown tool: {name}")


def handle(message: dict[str, Any]) -> dict[str, Any] | None:
    msg_id = message.get("id")
    method = message.get("method")
    params = message.get("params") or {}

    if msg_id is None:
        return None

    try:
        if method == "initialize":
            result = {
                "protocolVersion": "2025-11-25",
                "capabilities": {"tools": {}},
                "serverInfo": SERVER_INFO,
            }
        elif method == "tools/list":
            result = {"tools": TOOLS}
        elif method == "tools/call":
            result = call_tool(params["name"], params.get("arguments") or {})
        else:
            return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"method not found: {method}"}}
        return {"jsonrpc": "2.0", "id": msg_id, "result": result}
    except Exception as exc:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32000, "message": str(exc)}}


def serve() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        response = handle(json.loads(line))
        if response is not None:
            print(json.dumps(response), flush=True)
    return 0


def self_test() -> int:
    print(json.dumps({"server": SERVER_INFO, "tools": [tool["name"] for tool in TOOLS]}, indent=2))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Print-OS MCP stdio server")
    parser.add_argument("--self-test", action="store_true", help="Print server metadata and exit")
    args = parser.parse_args(argv)
    return self_test() if args.self_test else serve()


if __name__ == "__main__":
    raise SystemExit(main())
