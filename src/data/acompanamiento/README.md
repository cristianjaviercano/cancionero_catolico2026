# Acompañamiento: teclado Yamaha PSR-E383, guitarra y piano

Esta carpeta guarda todo lo que usa el botón **Acompañar** de cada canto. Son archivos JSON: se pueden editar a mano y la app los lee al compilar.

## Archivos

| Archivo | Qué contiene | De dónde sale |
|---|---|---|
| `psr_e383_estilos.json` | Los 260 estilos (ritmos) del teclado con número, nombre, categoría y si necesitan ACMP | Yamaha *Data List*, págs. 16–17 (extraído con un script, no a mano) |
| `psr_e383_voces.json` | 43 voces útiles para la liturgia (pianos, órganos, cuerdas, coros, flautas, ambientes) y cómo elegirlas | Yamaha *Data List*, lista de voces |
| `psr_e383_smart_chord.json` | Qué acorde produce cada tecla en modo Smart Chord según la armadura, y los atajos de Multi Finger | *Reference Manual*, págs. 35–36 (revisado fila por fila) |
| `ritmos_guitarra.json` | 9 rasgueos y 5 arpegios, paso por paso | Patrones de uso común en coros parroquiales |
| `perfiles_ritmicos.json` | 9 perfiles (balada, pop/folk, vals, 6/8, marcha, himno sin batería…) con compás, tempo, estilos y voces del teclado, rasgueos y patrón de piano | Elaborado para la liturgia |
| `sugerencias_por_tipo.json` | Qué perfiles sugerir según el tipo de canto (Entrada, Comunión, María…) y qué evitar en Cuaresma, Adviento y Triduo | IGMR 313 para los tiempos |
| `cantos_parametros.json` | Parámetros fijos por canto, para todo el equipo | Lo llenas tú (ver abajo) |

Manuales oficiales: <https://usa.yamaha.com/products/musical_instruments/keyboards/portable_keyboards/psr-e383/downloads.html>

## Cómo funciona la sugerencia

1. La app lee los acordes del canto y detecta el tono (o usa el tono guardado).
2. Elige perfiles según el **tipo de canto** y el **tiempo litúrgico de hoy**.
3. Con el tono calcula la **Style Key** del teclado y revisa, acorde por acorde, si Smart Chord lo produce igual, parecido o distinto. Si alguno sale distinto, recomienda Multi Finger.
4. Para guitarra, propone el capo con las formas más fáciles y genera la tablatura del arpegio con las digitaciones de `guitarChords.json`.

## Parametrizar un canto

En **Acompañar** ajusta perfil, compás, BPM, estilo, rasgueo, capo y melodía, y pulsa **Guardar para este canto**:

- Con sesión iniciada se guarda en tu cuenta (`users/{uid}/songParams/{idDelCanto}` en Firestore).
- Sin sesión, en el navegador (`localStorage`, clave `vt-song-params`).

Para que **todo el equipo** vea los mismos parámetros, copia lo que guardaste a `cantos_parametros.json`. En la consola del navegador:

```js
copy(localStorage.getItem('vt-song-params'))
```

y pégalo aquí. El formato es:

```json
{
  "rc_65": { "perfil": "pop_moderado", "compas": "4/4", "bpm": 96, "estilo": 69, "rasgueo": "pop_folk", "capo": 0 }
}
```

Campos: `perfil` (id de `perfiles_ritmicos.json`), `compas` (`4/4`, `3/4`, `6/8`, `2/4`), `bpm`, `estilo` (número del PSR-E383), `rasgueo` (id de `ritmos_guitarra.json`), `capo`, `notas` y `abc` (melodía en notación ABC).

## Agregar un rasgueo o un perfil

- **Rasgueo:** añade un objeto en `rasgueos` con `pasos` (una letra por subdivisión: `D` abajo, `U` arriba, `B` bajo, `X` apagado, `-` pausa). `subdivision` es la cantidad de pasos por tiempo.
- **Perfil:** copia uno existente en `perfiles_ritmicos.json`, cambia el `id` y añádelo en `sugerencias_por_tipo.json` donde corresponda.

Los números de estilo y de voz deben existir en los JSON del teclado. Si cambias de instrumento, crea archivos equivalentes con su propia lista oficial; no reutilices los números del PSR-E383.
