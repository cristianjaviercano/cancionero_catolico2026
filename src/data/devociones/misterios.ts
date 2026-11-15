// Misterios del Rosario y los siete dolores y gozos de San José.
// Meditaciones tomadas del Rosario original de la app; preguntas para la vida añadidas.

export type MysteryKey = 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos';

export interface Mystery {
  number: number;
  title: string;
  fruit: string;
  scripture: string;
  meditation: string;
}

export const MARIAN_MYSTERIES: Record<MysteryKey, { name: string; days: string; list: Mystery[] }> = {
  gozosos: {
    name: 'Misterios Gozosos',
    days: 'Lunes y Sábados',
    list: [
      { number: 1, title: 'La Anunciación del Ángel a la Virgen María', fruit: 'La humildad', scripture: 'Lc 1, 26-38', meditation: 'El Ángel Gabriel anuncia a María que será la Madre del Salvador. Ella responde con obediencia amorosa: "He aquí la esclava del Señor".' },
      { number: 2, title: 'La Visitación de María a su prima Santa Isabel', fruit: 'La caridad fraterna', scripture: 'Lc 1, 39-56', meditation: 'María se pone en camino con prontitud para servir a su prima Isabel. Al oír su saludo, la criatura salta de gozo y María entona el Magníficat.' },
      { number: 3, title: 'El Nacimiento del Hijo de Dios en Belén', fruit: 'El desprendimiento y la pobreza de espíritu', scripture: 'Lc 2, 1-20', meditation: 'En la pobreza de un pesebre nace el Rey del Universo. Los ángeles cantan gloria en el cielo y los pastores adoran al Emmanuel.' },
      { number: 4, title: 'La Presentación del Niño Jesús en el Templo', fruit: 'La pureza y la obediencia a Dios', scripture: 'Lc 2, 22-38', meditation: 'María y José presentan a Jesús según la ley. El anciano Simeón proclama que el Niño es luz para alumbrar a las naciones.' },
      { number: 5, title: 'El Niño Jesús perdido y hallado en el Templo', fruit: 'El celo por las cosas de Dios', scripture: 'Lc 2, 41-52', meditation: 'Tras tres días de angustiosa búsqueda, encuentran a Jesús en medio de los doctores escuchándolos y haciéndoles preguntas.' }
    ]
  },
  luminosos: {
    name: 'Misterios Luminosos',
    days: 'Jueves',
    list: [
      { number: 1, title: 'El Bautismo de Jesús en el Jordán', fruit: 'La apertura al Espíritu Santo', scripture: 'Mt 3, 13-17', meditation: 'Los cielos se abren y el Padre proclama: "Este es mi Hijo amado, en quien me complazco".' },
      { number: 2, title: 'La Auto-revelación en las Bodas de Caná', fruit: 'La confianza en la intercesión de María', scripture: 'Jn 2, 1-12', meditation: 'Por intercesión de la Santísima Virgen, Jesús realiza su primer signo milagroso transformando el agua en vino nuevo.' },
      { number: 3, title: 'El Anuncio del Reino de Dios invitando a la Conversión', fruit: 'La conversión del corazón', scripture: 'Mc 1, 14-15', meditation: 'Jesús proclama la Buena Noticia invitando a todos a acoger el Reino de Dios con un corazón renovado.' },
      { number: 4, title: 'La Transfiguración de Jesús en el Monte Tabor', fruit: 'El deseo de santidad', scripture: 'Mt 17, 1-8', meditation: 'El rostro de Jesús resplandece como el sol y sus vestiduras se vuelven blancas como la luz ante Pedro, Santiago y Juan.' },
      { number: 5, title: 'La Institución de la Santísima Eucaristía', fruit: 'El amor eucarístico y la adoración', scripture: 'Mt 26, 26-29', meditation: 'En la Última Cena, Jesús nos entrega su Cuerpo y Sangre bajo las especies de pan y vino como memorial de su Amor eterno.' }
    ]
  },
  dolorosos: {
    name: 'Misterios Dolorosos',
    days: 'Martes y Viernes',
    list: [
      { number: 1, title: 'La Oración y Agonía de Jesús en el Huerto', fruit: 'El arrepentimiento sincero de los pecados', scripture: 'Mt 26, 36-46', meditation: 'En Getsemaní, Jesús experimenta la angustia del pecado del mundo y reza: "Padre mío, si es posible, aparta de mí este cáliz; pero no se haga mi voluntad, sino la tuya".' },
      { number: 2, title: 'La Flagelación de Nuestro Señor Jesucristo', fruit: 'La pureza de los sentidos y la mortificación', scripture: 'Jn 19, 1', meditation: 'Pilato manda azotar a Jesús. Por sus llagas fuimos nosotros sanados.' },
      { number: 3, title: 'La Coronación de Espinas', fruit: 'La humildad moral y la fortaleza', scripture: 'Mt 27, 27-31', meditation: 'Los soldados colocan una corona de espinas en su cabeza y una caña en su mano, burlándose del Rey de Reyes.' },
      { number: 4, title: 'Jesús con la Cruz a cuestas camino al Calvario', fruit: 'La paciencia para sobrellevar las cruces', scripture: 'Lc 23, 26-32', meditation: 'Jesús carga el pesado madero del pecado del mundo hasta el Gólgota, consolando a las santas mujeres.' },
      { number: 5, title: 'La Crucifixión y Muerte de Nuestro Señor Jesucristo', fruit: 'El perdón y la salvación de las almas', scripture: 'Jn 19, 17-30', meditation: 'Jesús entrega su vida en la Cruz por amor a nosotros y nos entrega a su Santísima Madre como Madre nuestra.' }
    ]
  },
  gloriosos: {
    name: 'Misterios Gloriosos',
    days: 'Miércoles y Domingos',
    list: [
      { number: 1, title: 'La Resurrección del Hijo de Dios', fruit: 'La fe viva y la victoria sobre la muerte', scripture: 'Mt 28, 1-10', meditation: '¡Cristo ha vencido la muerte y el sepulcro! Al tercer día resucita glorioso para nuestra justificación.' },
      { number: 2, title: 'La Ascensión del Señor a los Cielos', fruit: 'La esperanza del Cielo', scripture: 'Hch 1, 6-11', meditation: 'Jesús bendice a sus apóstoles y sube a los cielos, donde está sentado a la derecha de Dios Padre Todopoderoso.' },
      { number: 3, title: 'La Venida del Espíritu Santo en Pentecostés', fruit: 'El amor a Dios y el celo misionero', scripture: 'Hch 2, 1-13', meditation: 'Reunidos con María en oración, lenguas de fuego descienden sobre los apóstoles llenándolos de valor para evangelizar.' },
      { number: 4, title: 'La Asunción de la Santísima Virgen María al Cielo', fruit: 'La gracia de una buena muerte', scripture: 'Ap 12, 1', meditation: 'Concluida su vida terrena, la Madre de Dios es asunta en cuerpo y alma a la gloria celestial.' },
      { number: 5, title: 'La Coronación de María como Reina del Universo', fruit: 'La confianza plena en el triunfo del Corazón Inmaculado', scripture: 'Ap 12, 1', meditation: 'La Santísima Trinidad corona a María como Reina de los Ángeles y de los Santos, Reina de la Paz.' }
    ]
  }
};

export const SAN_JOSE_MYSTERIES: Mystery[] = [
  { number: 1, title: 'El dolor y gozo ante el misterio de la Encarnación', fruit: 'Confianza ciega en los planes de Dios', scripture: 'Mt 1, 18-25', meditation: 'Dolor ante la duda; gozo indescriptible cuando el Ángel le revela en sueños que lo concebido en María viene del Espíritu Santo.' },
  { number: 2, title: 'El dolor y gozo en el Nacimiento de Jesús en la pobreza', fruit: 'Paz en la sencillez y el abandono', scripture: 'Lc 2, 1-20', meditation: 'Dolor por no hallar posada digna en Belén; gozo al ver nacer al Salvador adorado por los ángeles y pastores.' },
  { number: 3, title: 'El dolor y gozo en la Circuncisión de Jesús', fruit: 'Fidelidad y respeto al Nombre de Jesús', scripture: 'Lc 2, 21', meditation: 'Dolor al ver derramar las primeras gotas de sangre del Divino Infante; gozo al imponerle el dulcísimo Nombre de Jesús, que salva.' },
  { number: 4, title: 'El dolor y gozo en la profecía del anciano Simeón', fruit: 'Fortaleza ante las pruebas', scripture: 'Lc 2, 22-35', meditation: 'Dolor al escuchar que una espada atravesará el alma de María; gozo al saber que Jesús será luz y salvación de muchos.' },
  { number: 5, title: 'El dolor y gozo en la Huida a Egipto', fruit: 'Prontitud para obedecer la voluntad divina', scripture: 'Mt 2, 13-15', meditation: 'Dolor de escapar de noche perseguidos por Herodes; gozo inmenso de custodiar al Niño Dios y a su Madre bendita.' },
  { number: 6, title: 'El dolor y gozo en el regreso a Nazaret', fruit: 'Amor al trabajo y a la vida oculta', scripture: 'Mt 2, 19-23', meditation: 'Dolor por el temor a Arquelao; gozo de regresar a la paz de Nazaret donde Jesús crecía en sabiduría y gracia.' },
  { number: 7, title: 'El dolor y gozo en la pérdida y hallazgo en el Templo', fruit: 'Búsqueda incansable de Jesús', scripture: 'Lc 2, 41-52', meditation: 'Tres días de angustia buscando al Niño perdido; inefable alegría al encontrarlo en la Casa del Padre entre los doctores.' }
];

// Una pregunta para llevar el misterio a la vida (mismo orden que cada lista)
export const PREGUNTAS: Record<MysteryKey, string[]> = {
  gozosos: [
    '¿A qué me está pidiendo Dios que diga "sí" en esta etapa?',
    '¿A quién puedo visitar o servir esta semana sin que me lo pidan?',
    '¿Qué cosas me sobran y me impiden recibir a Jesús con sencillez?',
    '¿Qué le estoy ofreciendo hoy a Dios de mi tiempo y de mi familia?',
    '¿Dónde busco a Jesús cuando siento que lo he perdido?',
  ],
  luminosos: [
    '¿Cómo vivo hoy las promesas de mi bautismo?',
    '¿Qué necesidad de mi casa o de mi comunidad pongo en manos de María?',
    '¿De qué tengo que convertirme para acoger el Reino?',
    '¿Qué momento de oración me ayuda a ver la gloria de Dios en lo cotidiano?',
    '¿Cómo preparo el corazón para cada Eucaristía y para el canto de la misa?',
  ],
  dolorosos: [
    '¿Qué cruz me cuesta aceptar y cómo la pongo en manos del Padre?',
    '¿Qué sufrimiento ajeno puedo aliviar con un gesto concreto?',
    '¿Cómo respondo cuando me humillan o no me valoran?',
    '¿A quién puedo ayudar a cargar su cruz, como el Cireneo?',
    '¿A quién necesito perdonar para estar en paz?',
  ],
  gloriosos: [
    '¿Dónde veo hoy signos de vida nueva y de esperanza?',
    '¿Mis decisiones de hoy me acercan al cielo?',
    '¿Qué don del Espíritu Santo necesito pedir para servir mejor?',
    '¿Cómo cuido mi cuerpo y el de los demás como templo de Dios?',
    '¿En qué confío a María como Madre y Reina de mi vida?',
  ],
};

export const PREGUNTAS_SAN_JOSE: string[] = [
  '¿Confío en los planes de Dios cuando no los entiendo?',
  '¿Sé encontrar paz en la sencillez de lo que tengo?',
  '¿Honro el nombre de Jesús con mis palabras?',
  '¿Me mantengo fiel cuando llegan las pruebas?',
  '¿Obedezco con prontitud cuando Dios me pide cambiar de camino?',
  '¿Valoro mi trabajo diario como lugar de encuentro con Dios?',
  '¿Busco a Jesús con perseverancia cuando lo siento lejos?',
];

// Tipos de canto del repertorio afines a cada grupo de misterios
export const TIPOS_CANTO: Record<MysteryKey, string[]> = {
  gozosos: ['María', 'Navidad', 'Adviento'],
  luminosos: ['Comunión', 'Eucaristía', 'Adoración', 'Adoración Eucarística', 'Espíritu Santo'],
  dolorosos: ['Cuaresma', 'Meditación', 'María'],
  gloriosos: ['Pascua', 'Espíritu Santo', 'Pentecostés', 'María'],
};
