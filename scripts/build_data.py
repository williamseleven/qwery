#!/usr/bin/env python3
"""
build_data.py — Transportadoras Infracommerce
=============================================
Se ejecuta en GitHub Actions (server-side, sin CORS). Baja el CSV de origen,
aplica las reglas de negocio y publica en la raíz del repo un data.json chico
con ÍNDICES ENTEROS que consume index.html.

Reglas de negocio:
  - 1 fila por PEDIDO: se deduplica por order_id (cada order_id = 1 envío,
    aunque el pedido tenga varios items / filas repetidas).
  - Se EXCLUYEN los pedidos con order_status == "cancelled".
  - Se EXCLUYE el método "me2" (bare) — es MELI FULL, no un envío de transporte.

Salida data.json:
  {
    "brands":   [...],                         # ordenadas por volumen desc
    "couriers": [...],                         # en orden fijo, solo presentes
    "methods":  [...],                         # ship_shipping-method crudo (sub-filas)
    "dates":    ["aaaa-mm-dd", ...],           # ordenadas ascendente
    "orders":   [[brandIdx, courierIdx, methodIdx, dateIdx], ...],
    "last_update": "d/m/aaaa hh:mm",           # columna A now() (bajada del CSV)
    "generated_at": "ISO-8601 UTC"
  }

Solo usa la librería estándar (no requiere pip install).
"""
import csv, io, json, os, sys, datetime, urllib.request

CSV_URL = "https://vtex.brandlive.net/upload/queries/ops-om-ar.csv"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Orden fijo de couriers (lista cerrada). "Meliflex" NO es courier.
COURIER_ORDER = ["Moova", "Andreani", "Ocasa", "Fasttrack", "Inner", "Pickit",
                 "Cabify", "Elogistica", "HOP", "Sin asignar"]

# Prefijo de ship_shipping-method (antes del 1er "_" o ":") -> courier.
PMAP = {"andreani": "Andreani", "cabify": "Cabify", "fasttrack": "Fasttrack",
        "hop": "HOP", "inner": "Inner", "moova": "Moova", "ocasa": "Ocasa",
        "pickit": "Pickit", "elogistica": "Elogistica", "elogisticaregular": "Elogistica"}
# Valor de ship_carier2 -> courier (reglas 1 y 5).
C2MAP = {"moova": "Moova", "cabify": "Cabify", "andreani": "Andreani",
         "fasttrack": "Fasttrack", "inner": "Inner", "innerlogistics": "Inner",
         "ocasa": "Ocasa", "pickit": "Pickit", "hop": "HOP",
         "elogistica": "Elogistica", "elogisticaregular": "Elogistica"}


def courier_of(method, c2):
    """Reglas EN ORDEN sobre ship_shipping-method (minúsculas). Gana la 1ra."""
    ml = (method or "").strip().lower()
    # Regla 1: me2_flex_bsas / me2_flex_caba -> courier desde ship_carier2
    if ml in ("me2_flex_bsas", "me2_flex_caba"):
        return C2MAP.get((c2 or "").strip().lower(), "Sin asignar")
    # Regla 2 / 3
    if ml.startswith("spu_estandar"):
        return "Elogistica"
    if ml.startswith("spu_ocasa"):
        return "Ocasa"
    # Regla 4: prefijo conocido
    pre = ml.split("_")[0].split(":")[0]
    if pre in PMAP:
        return PMAP[pre]
    # Regla 5: fallback -> ship_carier2 ; vacío -> Sin asignar
    return C2MAP.get((c2 or "").strip().lower(), "Sin asignar")


def to_iso(raw):
    """'d/m/aaaa hh:mm' -> 'aaaa-mm-dd'. Sin fecha válida -> 's/f'."""
    if not raw:
        return "s/f"
    part = str(raw).strip().split()[0]        # "25/8/2026"
    bits = part.split("/")
    if len(bits) < 3:
        return "s/f"
    try:
        d, m, y = int(bits[0]), int(bits[1]), int(bits[2])
    except ValueError:
        return "s/f"
    if not (d and m and y):
        return "s/f"
    return "%04d-%02d-%02d" % (y, m, d)


def download(url):
    print("Descargando CSV: %s" % url, flush=True)
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; gh-actions-transportadoras/1.0)"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read()
    print("Descargado: %.1f MB" % (len(raw) / 1048576.0), flush=True)
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def main():
    try:
        text = download(CSV_URL)
    except Exception as e:
        print("ERROR al descargar el CSV: %s" % e, file=sys.stderr)
        sys.exit(1)

    # El separador puede variar entre exports (la muestra vino con ';', el CSV
    # en vivo usa ','). Se detecta con la línea de encabezado: gana el que más
    # columnas produce.
    first_line = text.split("\n", 1)[0]
    delim = max([",", ";", "\t", "|"], key=lambda d: len(first_line.split(d)))
    print("Delimitador detectado: %r" % delim, flush=True)

    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    cols = reader.fieldnames or []
    needed = ["order_id", "order_status", "ship_shipping-method",
              "brand_name", "order_channel-created-at", "ship_carier2"]
    missing = [c for c in needed if c not in cols]
    if missing:
        print("ERROR: al CSV le faltan columnas: %s" % missing, file=sys.stderr)
        print("Columnas presentes: %s" % cols, file=sys.stderr)
        sys.exit(1)

    seen = set()
    recs = []                 # (brand, courier, method, iso)
    last_update = ""
    n_total = n_cancel = n_me2 = n_dup = 0

    for r in reader:
        n_total += 1
        # Columna A (now()) = fecha de la bajada. Igual en todas las filas: tomamos la 1ra.
        if not last_update:
            last_update = (r.get("now()") or "").strip()

        oid = (r.get("order_id") or "").strip()
        if not oid:
            continue
        # Dedup por order_id: cada pedido = 1 envío
        if oid in seen:
            n_dup += 1
            continue
        seen.add(oid)

        # Excluir cancelados (columna H order_status)
        if (r.get("order_status") or "").strip().lower() == "cancelled":
            n_cancel += 1
            continue

        method = (r.get("ship_shipping-method") or "").strip()
        # Excluir me2 (bare) — MELI FULL, no es transporte
        if method.lower() == "me2":
            n_me2 += 1
            continue

        brand = (r.get("brand_name") or "-").strip() or "-"
        cour = courier_of(method, r.get("ship_carier2"))
        iso = to_iso(r.get("order_channel-created-at"))
        recs.append((brand, cour, method or "(vacío)", iso))

    if not recs:
        print("ERROR: no quedaron pedidos válidos después de filtrar.", file=sys.stderr)
        sys.exit(1)

    # ---- diccionarios (índices enteros) ----
    bcount = {}
    for b, _, _, _ in recs:
        bcount[b] = bcount.get(b, 0) + 1
    brands = sorted(bcount, key=lambda b: (-bcount[b], b))            # por volumen desc

    present = {c for _, c, _, _ in recs}
    couriers = [c for c in COURIER_ORDER if c in present]
    # cualquier courier inesperado fuera de la lista, al final
    couriers += sorted(present - set(couriers))

    mcount = {}
    for _, _, m, _ in recs:
        mcount[m] = mcount.get(m, 0) + 1
    methods = sorted(mcount, key=lambda m: (-mcount[m], m))

    dates = sorted({iso for _, _, _, iso in recs}, key=lambda x: (x == "s/f", x))

    bi = {b: i for i, b in enumerate(brands)}
    ci = {c: i for i, c in enumerate(couriers)}
    mi = {m: i for i, m in enumerate(methods)}
    di = {d: i for i, d in enumerate(dates)}

    orders = [[bi[b], ci[c], mi[m], di[iso]] for (b, c, m, iso) in recs]

    payload = {
        "brands": brands,
        "couriers": couriers,
        "methods": methods,
        "dates": dates,
        "orders": orders,
        "last_update": last_update or "—",
        "generated_at": datetime.datetime.now(datetime.timezone.utc)
                        .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }
    with open(os.path.join(ROOT, "data.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    print("OK: %d filas leídas | %d envíos únicos | duplicados: %d | cancelados: %d | me2: %d"
          % (n_total, len(orders), n_dup, n_cancel, n_me2), flush=True)
    print("   brands=%d couriers=%d methods=%d dias=%d"
          % (len(brands), len(couriers), len(methods), len(dates)), flush=True)


if __name__ == "__main__":
    main()
