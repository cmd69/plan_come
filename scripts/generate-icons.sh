#!/bin/bash
# Genera el set completo de iconos PWA a partir de una imagen fuente.
# Uso: ./generate-icons.sh <imagen-fuente> [color-fondo]
# Ejemplo: ./generate-icons.sh logo.jpg "#2563eb"
#
# - Centra la imagen en un canvas cuadrado con el color de fondo indicado
# - Genera PNG para cada tamaño declarado en manifest.json
# - Coloca los iconos en frontend/public/icons/ (relativo al repo)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPT_DIR}")"

SOURCE="${1:-}"
BG_COLOR="${2:-#2563eb}"
OUTPUT_DIR="${REPO_ROOT}/frontend/public/icons"

if [ -z "${SOURCE}" ]; then
  echo "Uso: $0 <imagen-fuente> [color-fondo]"
  echo "Ejemplo: $0 logo.jpg \"#2563eb\""
  exit 1
fi

# Ruta absoluta de la imagen fuente
if [[ "${SOURCE}" != /* ]]; then
  SOURCE="${REPO_ROOT}/${SOURCE}"
fi

if [ ! -f "${SOURCE}" ]; then
  echo "Error: no se encuentra la imagen '${SOURCE}'"
  exit 1
fi

SIZES=(48 72 96 144 192 384 512)

echo "=== Generador de iconos PWA ==="
echo "Fuente : ${SOURCE}"
echo "Fondo  : ${BG_COLOR}"
echo "Salida : ${OUTPUT_DIR}"
echo ""

mkdir -p "${OUTPUT_DIR}"

docker run --rm \
  -v "${SOURCE}:/input/source$(basename "${SOURCE}" | grep -o '\.[^.]*$')" \
  -v "${OUTPUT_DIR}:/output" \
  alpine sh -c "
    apk add --no-cache imagemagick imagemagick-jpeg > /dev/null 2>&1
    SOURCE_FILE=\$(ls /input/*)
    BG='${BG_COLOR}'

    for SIZE in ${SIZES[*]}; do
      OUT=\"/output/icon-\${SIZE}x\${SIZE}.png\"
      magick \"\${SOURCE_FILE}\" \
        -background \"\${BG}\" \
        -gravity center \
        -extent \"\$(magick \"\${SOURCE_FILE}\" -format '%[fx:max(w,h)]x%[fx:max(w,h)]' info:)\" \
        -resize \"\${SIZE}x\${SIZE}\" \
        -strip \
        PNG:\"\${OUT}\"
      echo \"  -> icon-\${SIZE}x\${SIZE}.png\"
    done
  "

echo ""
echo "=== Iconos generados en ${OUTPUT_DIR} ==="
ls -lh "${OUTPUT_DIR}/"
