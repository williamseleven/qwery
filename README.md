# Qwery Infracommerce

Tablero logístico en HTML: una tabla dinámica (pivot) que muestra cuántos
envíos maneja cada **Courier** y bajo qué **método de envío**, día a día.
**La tabla se reconstruye solo cuando tocás “Actualizar descarga”** — no hay
polling, auto-refresh ni cache por tiempo.

## Qué subir a GitHub

```
index.html                        ← la app (HTML + CSS + JS inline, logo incluido)
data/ops-om-ar.csv                ← los datos (los actualiza el workflow; va una copia semilla)
.github/workflows/update-data.yml ← baja el CSV de VTEX al repo (evita CORS)
README.md
```

Subí **todo** tal cual (respetando las carpetas `data/` y `.github/workflows/`).

## Publicar en GitHub Pages (paso a paso)

1. Creá un repo y subí estos archivos.
2. **Settings → Pages** → Source: rama `main`, carpeta `/root`. Guardá.
3. A los minutos queda en `https://<usuario>.github.io/<repo>/`.
4. **Settings → Actions → General** → en “Workflow permissions” elegí
   **Read and write permissions** (para que el bot pueda commitear el CSV). Guardá.
5. Andá a la pestaña **Actions → “Actualizar datos CSV” → Run workflow** para
   traer los datos frescos por primera vez (después corre solo cada hora).

Con eso, `index.html` lee `data/ops-om-ar.csv` **same-origin** y el botón funciona
sin ningún problema de CORS.

## Cómo funciona (por qué así y no un proxy)

CORS lo decide el **servidor** que hostea el dato, según sus headers — **no** el
formato (da igual CSV o JSON). VTEX (`vtex.brandlive.net`) probablemente no manda
`Access-Control-Allow-Origin`, así que un `fetch()` directo desde `*.github.io`
fallaría. En vez de depender de un proxy externo, el **workflow de GitHub Actions**
descarga el CSV *del lado del servidor* (ahí no hay CORS) y lo guarda en el repo;
la página lo lee desde el mismo dominio. Sin servicios de terceros.

### Fuentes de datos disponibles en la app (selector “Fuente de datos”)

- **Archivo del repo** *(por defecto, recomendado)* — lee `data/ops-om-ar.csv`. Cero CORS.
- **URL de VTEX en vivo** — `fetch` directo; solo funciona si VTEX manda headers CORS.
- **URL de VTEX vía proxy CORS** — allorigins / corsproxy / tu proxy propio.
- **Cargar un CSV local** — para probar offline con un archivo de tu máquina.

El botón siempre descarga fresco (`cache:'no-store'` + cache-buster en la URL).

> ⚠️ **Importante:** el runner de GitHub Actions también tiene que poder alcanzar
> `vtex.brandlive.net`. Si ese endpoint es **interno/privado** (VPN o whitelist de IPs),
> el `curl` del workflow va a fallar igual. En ese caso las opciones son: un
> **self-hosted runner** dentro de tu red, o un **proxy propio** (Cloudflare Worker)
> alojado donde sí tenga acceso. Avisame y te lo armo.

### Frecuencia de actualización

El workflow corre **cada hora** (`cron` en el `.yml`) y también **a mano** desde la
pestaña Actions. Cambiá o borrá la línea `schedule:` si querés otra cadencia.
El texto de “última actualización” sale de la **columna A (`now()`)** del CSV, o sea
refleja cuándo VTEX generó la bajada, no cuándo corrió el workflow.

## Probarlo local

El `fetch` no anda con `file://`; usá un server estático:

```bash
python3 -m http.server 8000   # y abrí http://localhost:8000
```

## Mapeo de columnas (confirmado con la base real, separador `;`)

| Referencia            | Columna en el CSV                    | Uso                               |
|-----------------------|-------------------------------------|-----------------------------------|
| Columna **A** (idx 0) | `now()`                             | Timestamp de “última actualización” |
| —                     | `brand_name` (idx 2)                | Filtro **Brand**                  |
| —                     | `order_channel-created-at` (idx 11) | Fecha del pedido → **columnas por día** |
| Columna **AC** (idx 28) | `ship_shipping-method`            | **Sub-filas** (método de envío)   |
| —                     | `ship_carier2` (idx 31)             | Courier de respaldo (reglas 1 y 5)|

## Lógica de Courier (`getCourier`, función pura y auditable)

Evalúa en orden sobre `ship_shipping-method` (minúsculas); gana la **primera**:

1. `me2_flex_bsas` / `me2_flex_caba` → courier de `ship_carier2` (vacío → *Sin asignar*).
2. empieza con `spu_estandar` → **Elogistica**.
3. empieza con `spu_ocasa` → **Ocasa**.
4. prefijo (antes del primer `_` o `:`) ∈ {andreani, cabify, fasttrack, hop, inner,
   moova, ocasa, pickit, elogistica, elogisticaregular} → ese courier.
5. resto → `ship_carier2`; vacío → *Sin asignar*.

Couriers posibles (lista cerrada): **Moova, Andreani, Ocasa, Fasttrack, Inner,
Pickit, Cabify, Elogistica, HOP, Sin asignar**. *(“Meliflex” es un tipo de envío,
no un courier.)*

## Métrica de las celdas

Hoy cada celda **cuenta filas** (envíos/pedidos). Para sumar un monto, buscá el
comentario `MÉTRICA` en `buildPivot()` dentro de `index.html` y cambiá `+ 1` por
`+ Number(row['<columna_monto>'])`.

## Filtros

- **Courier** (multi-selección, lista cerrada).
- **Brand** (multi-selección, valores únicos del CSV).

Se aplican en el cliente sobre los datos ya descargados; no vuelven a pegarle a la URL.
