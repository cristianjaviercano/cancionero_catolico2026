// Oraciones y devociones a San José.

export interface Prayer {
  id: string;
  titulo: string;
  origen: string;
  texto: string;
}

export const ORACIONES_SAN_JOSE: Prayer[] = [
  {
    id: 'a-ti-bienaventurado',
    titulo: 'A ti, bienaventurado San José',
    origen: 'León XIII, encíclica Quamquam pluries (1889)',
    texto:
      'A ti, bienaventurado San José, acudimos en nuestra tribulación, y después de implorar el auxilio de tu santísima Esposa, solicitamos también confiadamente tu patrocinio.\n' +
      'Con aquella caridad que te tuvo unido con la Inmaculada Virgen María, Madre de Dios, y por el paterno amor con que abrazaste al Niño Jesús, humildemente te suplicamos que vuelvas benigno los ojos a la herencia que con su sangre adquirió Jesucristo, y con tu poder y auxilio socorras nuestras necesidades.\n' +
      'Protege, oh providentísimo Custodio de la divina Familia, la escogida descendencia de Jesucristo; aleja de nosotros, oh padre amantísimo, la peste de errores y vicios. Asístenos propicio desde el cielo, en esta lucha contra el poder de las tinieblas; y como en otro tiempo libraste de la muerte la vida amenazada del Niño Jesús, así ahora defiende a la santa Iglesia de Dios de las hostiles insidias y de toda adversidad.\n' +
      'Y a cada uno de nosotros protégenos con tu constante patrocinio, para que, a ejemplo tuyo y sostenidos por tu auxilio, podamos vivir y morir santamente y alcanzar en el cielo la eterna bienaventuranza. Amén.',
  },
  {
    id: 'ave-jose',
    titulo: 'Dios te salve, José',
    origen: 'Oración popular (texto que ya tenía la app)',
    texto:
      'Dios te salve, José, lleno de la gracia divina. El Salvador reposó en tus brazos y creció bajo tu mirada. Bendito eres entre todos los hombres y bendito es Jesús, el Hijo divino de tu virginal esposa.\n' +
      'San José, dado por padre al Hijo de Dios, ruega por nosotros en nuestras preocupaciones de familia, de salud y de trabajo, hasta nuestros últimos días, y dígnate socorrernos en la hora de nuestra muerte. Amén.',
  },
  {
    id: 'jaculatoria',
    titulo: 'Jaculatoria a la Sagrada Familia',
    origen: 'Oración popular',
    texto:
      'Jesús, José y María, les doy el corazón y el alma mía.\nJesús, José y María, asístanme en mi última agonía.\nJesús, José y María, con ustedes descanse en paz el alma mía.',
  },
];

export const PATRIS_CORDE_URL = 'https://www.vatican.va/content/francesco/es/apost_letters/documents/papa-francesco-lettera-ap_20201208_patris-corde.html';

// Novena (10 al 18 de marzo): un rasgo de San José por día, tomado de sus letanías
export const NOVENA_TEMAS: { tema: string; peticion: string }[] = [
  { tema: 'Esposo de la Madre de Dios', peticion: 'Por los matrimonios y los novios.' },
  { tema: 'Custodio del Redentor', peticion: 'Por quienes cuidan de otros: padres, maestros, cuidadores.' },
  { tema: 'Padre nutricio del Hijo de Dios', peticion: 'Por los padres de familia y quienes ejercen la paternidad.' },
  { tema: 'José obedientísimo', peticion: 'Por los que buscan la voluntad de Dios en sus decisiones.' },
  { tema: 'Modelo de trabajadores', peticion: 'Por los que no tienen empleo y por quienes trabajan en condiciones duras.' },
  { tema: 'Sostén de las familias', peticion: 'Por las familias que atraviesan dificultades.' },
  { tema: 'Patrono de los exiliados', peticion: 'Por los migrantes y desplazados, en Colombia y en el mundo.' },
  { tema: 'Patrono de los moribundos', peticion: 'Por los enfermos graves y los que van a morir hoy.' },
  { tema: 'Protector de la santa Iglesia', peticion: 'Por el Papa, los obispos, los sacerdotes y nuestra parroquia.' },
];
