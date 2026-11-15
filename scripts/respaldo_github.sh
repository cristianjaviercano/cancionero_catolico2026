#!/bin/bash
# Respaldo del programa en GitHub (repositorio público): sube una foto del código SIN datos.
# No toca tu rama ni tus cambios sin guardar: arma el commit aparte y lo envía a "main" del repo de respaldo.
#
#   bash scripts/respaldo_github.sh                 → sube el respaldo
#   bash scripts/respaldo_github.sh "mi mensaje"    → igual, con mensaje propio
#   bash scripts/respaldo_github.sh --simular       → solo muestra qué archivos subiría
#
# OJO: no uses "git push" de las ramas normales hacia este repo: su historial sí contiene
# el repertorio y copias de datos. El respaldo público sale únicamente por este script.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

REPO_URL="https://github.com/cristianjaviercano/cancionero_catolico2026.git"
RAMA_LOCAL="respaldo-github"   # recuerda el último respaldo para encadenar el siguiente
AUTOR_NOMBRE="Cristian Javier Cano"
AUTOR_CORREO="cristianjaviercano@users.noreply.github.com"   # correo privado de GitHub

# Lo que NO se publica: repertorio, eucaristías guardadas, copias de datos, partituras y archivos personales
EXCLUIR=(
  'src/data/songs*'
  'src/data/nuevos_cantos.json'
  'src/data/respaldo_*'
  'public/partituras'
  'scripts/compare_projects.cjs'
  'scripts/comparison_data.json'
  'deploy_output.txt'
  '.firebase'
)

SIMULAR=0
if [ "${1:-}" = "--simular" ]; then SIMULAR=1; shift; fi
MENSAJE="${1:-Respaldo del programa $(date +%Y-%m-%d)}"

# Índice temporal: así no se altera lo que tengas preparado en git
INDICE="$(mktemp -u -t respaldo-indice)"
export GIT_INDEX_FILE="$INDICE"
trap 'rm -f "$INDICE"' EXIT

git add -A
git rm -r -q --cached --ignore-unmatch -- "${EXCLUIR[@]}"

# firebase.json se publica sin el correo de soporte
BLOB=$(sed -E 's/("supportEmail": *")[^"]*"/\1tu-correo@ejemplo.com"/' firebase.json | git hash-object -w --stdin)
git update-index --cacheinfo "100644,$BLOB,firebase.json"

# Freno de seguridad: ningún correo personal en lo que se va a publicar
if git grep --cached -nIE '[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.' -- . >/dev/null; then
  echo "✋ Hay un correo personal en los archivos a publicar. No se subió nada:" >&2
  git grep --cached -lIE '[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.' -- . >&2
  exit 1
fi

if [ "$SIMULAR" = 1 ]; then
  git ls-files
  echo "— $(git ls-files | wc -l | tr -d ' ') archivos. Simulación: no se subió nada."
  exit 0
fi

ARBOL=$(git write-tree)
PADRE=$(git rev-parse -q --verify "refs/heads/$RAMA_LOCAL" || true)
if [ -n "$PADRE" ] && [ "$(git rev-parse "$PADRE^{tree}")" = "$ARBOL" ]; then
  echo "Sin cambios desde el último respaldo."
  exit 0
fi

COMMIT=$(GIT_AUTHOR_NAME="$AUTOR_NOMBRE" GIT_AUTHOR_EMAIL="$AUTOR_CORREO" \
         GIT_COMMITTER_NAME="$AUTOR_NOMBRE" GIT_COMMITTER_EMAIL="$AUTOR_CORREO" \
         git commit-tree "$ARBOL" ${PADRE:+-p "$PADRE"} -m "$MENSAJE")

git push "$REPO_URL" "$COMMIT:refs/heads/main"
git update-ref "refs/heads/$RAMA_LOCAL" "$COMMIT"
echo "✅ Respaldo subido: $(git rev-parse --short "$COMMIT")"
