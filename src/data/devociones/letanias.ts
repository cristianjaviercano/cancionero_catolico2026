// Letanías: cada bloque tiene invocaciones y la respuesta de la asamblea.

export interface LitanyBlock {
  respuesta: string;
  invocaciones: string[];
}

export interface Litany {
  titulo: string;
  nota?: string;
  bloques: LitanyBlock[];
  versiculo: [string, string];
  oracion: string;
}

const INICIO: LitanyBlock[] = [
  { respuesta: '', invocaciones: ['Señor, ten piedad.', 'Cristo, ten piedad.', 'Señor, ten piedad.', 'Cristo, óyenos.', 'Cristo, escúchanos.'] },
  {
    respuesta: 'ten piedad de nosotros',
    invocaciones: ['Dios, Padre celestial,', 'Dios, Hijo, Redentor del mundo,', 'Dios, Espíritu Santo,', 'Santísima Trinidad, que eres un solo Dios,'],
  },
];

const CORDERO: LitanyBlock[] = [
  { respuesta: 'perdónanos, Señor', invocaciones: ['Cordero de Dios, que quitas el pecado del mundo,'] },
  { respuesta: 'escúchanos, Señor', invocaciones: ['Cordero de Dios, que quitas el pecado del mundo,'] },
  { respuesta: 'ten piedad de nosotros', invocaciones: ['Cordero de Dios, que quitas el pecado del mundo,'] },
];

export const LETANIAS_LAURETANAS: Litany = {
  titulo: 'Letanías de la Santísima Virgen (lauretanas)',
  nota: 'Incluye las invocaciones Madre de la misericordia, Madre de la esperanza y Consuelo de los migrantes, añadidas por el papa Francisco en 2020.',
  bloques: [
    ...INICIO,
    {
      respuesta: 'ruega por nosotros',
      invocaciones: [
        'Santa María,', 'Santa Madre de Dios,', 'Santa Virgen de las vírgenes,',
        'Madre de Cristo,', 'Madre de la Iglesia,', 'Madre de la misericordia,', 'Madre de la divina gracia,', 'Madre de la esperanza,',
        'Madre purísima,', 'Madre castísima,', 'Madre siempre virgen,', 'Madre inmaculada,', 'Madre amable,', 'Madre admirable,',
        'Madre del buen consejo,', 'Madre del Creador,', 'Madre del Salvador,',
        'Virgen prudentísima,', 'Virgen digna de veneración,', 'Virgen digna de alabanza,', 'Virgen poderosa,', 'Virgen clemente,', 'Virgen fiel,',
        'Espejo de justicia,', 'Trono de la sabiduría,', 'Causa de nuestra alegría,', 'Vaso espiritual,', 'Vaso digno de honor,', 'Vaso de insigne devoción,',
        'Rosa mística,', 'Torre de David,', 'Torre de marfil,', 'Casa de oro,', 'Arca de la alianza,', 'Puerta del cielo,', 'Estrella de la mañana,',
        'Salud de los enfermos,', 'Refugio de los pecadores,', 'Consuelo de los migrantes,', 'Consoladora de los afligidos,', 'Auxilio de los cristianos,',
        'Reina de los ángeles,', 'Reina de los patriarcas,', 'Reina de los profetas,', 'Reina de los apóstoles,', 'Reina de los mártires,',
        'Reina de los confesores,', 'Reina de las vírgenes,', 'Reina de todos los santos,', 'Reina concebida sin pecado original,',
        'Reina asunta a los cielos,', 'Reina del santísimo Rosario,', 'Reina de la familia,', 'Reina de la paz,',
      ],
    },
    ...CORDERO,
  ],
  versiculo: ['Ruega por nosotros, santa Madre de Dios.', 'Para que seamos dignos de alcanzar las promesas de Cristo.'],
  oracion:
    'Te rogamos, Señor Dios, que nosotros, tus siervos, gocemos de perpetua salud de alma y cuerpo, y por la gloriosa intercesión de la bienaventurada siempre Virgen María, seamos librados de las tristezas presentes y gocemos de la alegría eterna. Por Cristo nuestro Señor. Amén.',
};

export const LETANIAS_SAN_JOSE: Litany = {
  titulo: 'Letanías de San José',
  nota: 'Incluye las siete invocaciones añadidas en 2021 (Custodio del Redentor, Servidor de Cristo, Ministro de la salvación, Apoyo en las dificultades, Patrono de los exiliados, de los afligidos y de los pobres).',
  bloques: [
    ...INICIO,
    { respuesta: 'ruega por nosotros', invocaciones: ['Santa María,'] },
    {
      respuesta: 'ruega por nosotros',
      invocaciones: [
        'San José,', 'Ilustre descendiente de David,', 'Luz de los patriarcas,', 'Esposo de la Madre de Dios,', 'Custodio del Redentor,',
        'Casto guardián de la Virgen,', 'Padre nutricio del Hijo de Dios,', 'Celoso defensor de Cristo,', 'Servidor de Cristo,', 'Ministro de la salvación,',
        'Jefe de la Sagrada Familia,', 'José justísimo,', 'José castísimo,', 'José prudentísimo,', 'José fortísimo,', 'José obedientísimo,', 'José fidelísimo,',
        'Espejo de paciencia,', 'Amante de la pobreza,', 'Modelo de trabajadores,', 'Gloria de la vida doméstica,', 'Custodio de las vírgenes,',
        'Sostén de las familias,', 'Apoyo en las dificultades,', 'Consuelo de los desgraciados,', 'Esperanza de los enfermos,',
        'Patrono de los exiliados,', 'Patrono de los afligidos,', 'Patrono de los pobres,', 'Patrono de los moribundos,',
        'Terror de los demonios,', 'Protector de la santa Iglesia,',
      ],
    },
    ...CORDERO,
  ],
  versiculo: ['Lo nombró administrador de su casa.', 'Y señor de todas sus posesiones.'],
  oracion:
    'Oh Dios, que con inefable providencia te dignaste elegir al bienaventurado José por esposo de tu santísima Madre: concédenos que merezcamos tener por intercesor en el cielo al que veneramos como protector en la tierra. Tú que vives y reinas por los siglos de los siglos. Amén.',
};
