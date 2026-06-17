#!/usr/bin/env python3
"""Static file server with BCRA ICL proxy for local development."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parent
DIAR_ICL_URL = "https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/diar_icl.xls"
ICL_YEAR_URL = "https://www.bcra.gob.ar/archivos/pdfs/PublicacionesEstadisticas/icl{year}.xls"

_diari_cache: Dict[str, float] | None = None


def _parse_dd_mm_yyyy(value: str) -> str | None:
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", value.strip())
    if not match:
        return None
    day, month, year = match.groups()
    return f"{year}-{month}-{day}"


def _parse_yyyymmdd(value: str | float | int) -> str | None:
    if isinstance(value, (float, int)):
        value = str(int(value))
    if not re.match(r"^\d{8}$", str(value)):
        return None
    s = str(value)
    return f"{s[:4]}-{s[4:6]}-{s[6:8]}"


def _load_xlrd():
    try:
        import xlrd  # type: ignore
    except ImportError as exc:
        raise RuntimeError("xlrd is required for ICL proxy: pip install xlrd") from exc
    return xlrd


def _parse_diar_rows(book) -> Dict[str, float]:
    sheet = book.sheet_by_index(0)
    values: Dict[str, float] = {}

    for row_idx in range(sheet.nrows):
        fecha_cell = sheet.cell_value(row_idx, 0)
        valor_cell = sheet.cell_value(row_idx, 1)

        if isinstance(fecha_cell, str):
            if fecha_cell.lower() in {"fecha", "cd_serie"}:
                continue
            iso = _parse_dd_mm_yyyy(fecha_cell)
        else:
            iso = _parse_yyyymmdd(fecha_cell)

        if not iso or valor_cell in ("", None):
            continue

        try:
            values[iso] = round(float(valor_cell), 6)
        except (TypeError, ValueError):
            continue

    return values


def _parse_year_sheet(book) -> Dict[str, float]:
    sheet = book.sheet_by_name("ICL")
    values: Dict[str, float] = {}

    for row_idx in range(sheet.nrows):
        fecha_cell = sheet.cell_value(row_idx, 7)
        valor_cell = sheet.cell_value(row_idx, 8)
        if not fecha_cell or valor_cell in ("", None):
            continue
        iso = _parse_yyyymmdd(fecha_cell)
        if not iso:
            continue
        try:
            values[iso] = round(float(valor_cell), 6)
        except (TypeError, ValueError):
            continue

    return values


def _download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "AlquilerCalc/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def _load_all_icl_values() -> Dict[str, float]:
    global _diari_cache
    if _diari_cache is not None:
        return _diari_cache

    xlrd = _load_xlrd()
    values: Dict[str, float] = {}

    try:
        payload = _download(DIAR_ICL_URL)
        book = xlrd.open_workbook(file_contents=payload)
        values.update(_parse_diar_rows(book))
    except Exception as err:
        print(f"[icl-proxy] diar_icl.xls failed: {err}", file=sys.stderr)

    if not values:
        for year in range(2020, datetime.utcnow().year + 2):
            try:
                payload = _download(ICL_YEAR_URL.format(year=year))
                book = xlrd.open_workbook(file_contents=payload)
                values.update(_parse_year_sheet(book))
            except Exception:
                continue

    _diari_cache = dict(sorted(values.items()))
    return _diari_cache


def fetch_icl_range(desde: str, hasta: str) -> List[Dict[str, float]]:
    all_values = _load_all_icl_values()
    results = [
        {"fecha": iso, "valor": value}
        for iso, value in all_values.items()
        if desde <= iso <= hasta
    ]
    return results


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        if args and str(args[0]).startswith("GET /api/icl"):
            super().log_message(format, *args)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/api/icl"):
            self.handle_icl_api()
            return
        super().do_GET()

    def handle_icl_api(self):
        from urllib.parse import parse_qs, urlparse

        query = parse_qs(urlparse(self.path).query)
        desde = (query.get("desde") or ["2020-07-01"])[0]
        hasta = (query.get("hasta") or [datetime.utcnow().strftime("%Y-%m-%d")])[0]

        if not re.match(r"^\d{4}-\d{2}-\d{2}$", desde) or not re.match(r"^\d{4}-\d{2}-\d{2}$", hasta):
            self.send_error(400, "Invalid date format. Use YYYY-MM-DD.")
            return

        try:
            results = fetch_icl_range(desde, hasta)
            body = json.dumps({"results": results}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as err:
            print(f"[icl-proxy] error: {err}", file=sys.stderr)
            self.send_error(500, f"BCRA fetch failed: {err}")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving {ROOT} at http://localhost:{port}/")
    print(f"ICL proxy: http://localhost:{port}/api/icl?desde=2020-07-01&hasta={datetime.utcnow():%Y-%m-%d}")
    server.serve_forever()


if __name__ == "__main__":
    main()
