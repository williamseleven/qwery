# Transportadoras Infracommerce

Tablero logístico (HTML + JS, sin backend) para GitHub Pages: muestra cuántos
**envíos** maneja cada **Courier** y bajo qué **método de envío**, día a día.

**Por qué no se traba:** el CSV **no** se parsea en el navegador. Un script de
Python (`scripts/build_data.py`) corre en **GitHub Actions**, baja el CSV
servidor-a-servidor (sin CORS), lo pre-agrega y publica un **`data.json` chico
con índices enteros**. La página solo lee ese JSON y cuenta → carga casi instantánea.

## Qué subir a GitHub

```
index.html                          el dashboard (lee ./data.json)
data.json                           lo regenera el Action (liviano, índices enteros)
scripts/build_data.py               baja el CSV y genera data.json (solo stdlib)
.github/workflows/update-data.yml   corre build_data.py cada 5 min y commitea data.json
README.md
```

## Puesta en marcha

1. Creá un repo **público** y subí estos archivos respetando las carpetas.
2. **Settings → Actions → General → Workflow permissions**: **Read and write permissions** → Save.
3. **Settings → Pages → Source**: **Deploy from a branch**, rama `main`, carpeta `/ (root)` → Save.
4. Pestaña **Actions → update-data → Run workflow** (una vez; después corre solo cada 5 min).
5. Abrí `https://TU-USUARIO.github.io/TU-REPO/`.

## Reglas de negocio (en `build_data.py`)

- **1 fila por pedido:** se deduplica por `order_id` (cada `order_id` = 1 envío,
  aunque el pedido tenga varios items / filas repetidas).
- **Se excluyen cancelados:** `order_status == "cancelled"`.
- **Se excluye `me2`** (MELI FULL) — no es un envío de transporte.

### Lógica de Courier (`ship_shipping-method`, en orden; gana la 1ª)

1. `me2_flex_bsas` / `me2_flex_caba` → courier de `ship_carier2` (vacío → *Sin asignar*).
2. empieza con `spu_estandar` → **Elogistica**.
3. empieza con `spu_ocasa` → **Ocasa**.
4. prefijo (antes del 1er `_` o `:`) ∈ {andreani, cabify, fasttrack, hop, inner,
   moova, ocasa, pickit, elogistica, elogisticaregular} → ese courier.
5. resto → `ship_carier2`; vacío → *Sin asignar*.

## Estructura de `data.json`

```json
{
  "brands":   ["Nike AR", ...],
  "couriers": ["Moova", "Andreani", ...],
  "methods":  ["Andreani_Home_Regular", ...],   // ship_shipping-method crudo (sub-filas)
  "dates":    ["2026-08-25", ...],              // ordenadas asc
  "orders":   [[brandIdx, courierIdx, methodIdx, dateIdx], ...],
  "last_update": "25/8/2026 18:15",             // columna A now()
  "generated_at": "2026-08-25T21:15:00Z"
}
```

## Filtros

- **Courier** (multi, lista cerrada) · **Brand** (multi) · **Fecha** (rango desde/hasta).
- Todos en el cliente sobre `data.json`; no vuelven a pegarle a ninguna URL.

## Actualización

- El Action corre **cada 5 min** (`cron` en el `.yml`) y también a mano.
- La página se **auto-refresca cada 5 min** (checkbox) y con el botón "Actualizar descarga".
- "Última actualización" sale de la **columna A (`now()`)** del CSV (cuándo se generó la bajada).

## Notas

- Los `schedule` de GitHub Actions son best-effort (pueden demorarse) y se pausan
  si el repo queda 60 días sin actividad.
- La URL del CSV está en `scripts/build_data.py` (constante `CSV_URL`).
- **Métrica:** hoy cada celda cuenta pedidos. Para sumar un monto, incluí ese valor
  en `data.json` (build_data.py) y acumulalo en `buildPivot()` de `index.html`.
