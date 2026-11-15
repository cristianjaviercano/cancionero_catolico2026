# Cancionero Digital

Aplicación web para coros y ministerios de música católicos: repertorio de cantos con acordes, armador de la Eucaristía, modo de ejecución para tocar en la celebración, sincronización en vivo con el coro, afinador, diccionario de acordes, lecturas del día, Liturgia de las Horas, calendario litúrgico y devociones.

Hecha con React 19, TypeScript, Vite y Tailwind 4. Usa Firebase (Hosting, Firestore y acceso con Google).

## Qué hay en este repositorio

Solo el programa. **No incluye datos**:

| No está aquí | Dónde va | Para qué sirve |
|---|---|---|
| Repertorio de cantos | `src/data/songs.json` | Lista base de cantos. Sin este archivo la app no compila. |
| Partituras | `public/partituras/` | PDF e imágenes que se abren desde cada canto. |
| Eucaristías guardadas | Firestore (por usuario) | Se guardan en la cuenta de cada persona, no en el código. |

`src/data/songs.json` es una lista de cantos con esta forma:

```json
[
  {
    "id": "1",
    "title": "Título del canto",
    "type": "Entrada",
    "content": "Le[C]tra con a[Am]cordes entre corchetes"
  }
]
```

## Cómo ejecutarla

```bash
npm install
npm run dev       # desarrollo
npm run build     # compila a dist/
```

Para usar tu propio proyecto de Firebase, cambia la configuración de `src/firebase.ts` y el proyecto de `.firebaserc`.

## Publicar

```bash
npm run build
npx firebase deploy
```

## Respaldo en GitHub

```bash
bash scripts/respaldo_github.sh --simular   # ver qué se subiría
bash scripts/respaldo_github.sh             # subir
```

El script publica el código y deja fuera el repertorio, las partituras y las copias de datos.
