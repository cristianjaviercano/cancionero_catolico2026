import React, { useState } from 'react';
import { SacredBanner } from './SacredBanner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, BookOpen, Music, Calendar, Info, Bookmark } from 'lucide-react';

export function PartesEucaristia() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'estructura' | 'tiempos' | 'clasificacion'>('estructura');
  
  const sections = [
    {
      title: "Ritos Iniciales",
      subtitle: "Congregar a la asamblea, formar comunidad, introducir en el misterio del día y disponer los corazones a la escucha de la Palabra.",
      color: "border-amber-200 bg-amber-50/50 text-amber-900",
      iconColor: "text-amber-600 bg-amber-100",
      items: [
        {
          num: "1",
          name: "Canto de Entrada",
          type: "Propio",
          description: "Abre la celebración, fomenta la unión de quienes se han reunido, introduce en el misterio del tiempo litúrgico o festividad y acompaña la procesión de los ministros hacia el altar."
        },
        {
          num: "2",
          name: "Señor, ten piedad (Kyrie)",
          type: "Ordinario",
          description: "Aclamar al Señor e implorar su misericordia. Es un canto de súplica que pertenece a toda la asamblea."
        },
        {
          num: "3",
          name: "Gloria",
          type: "Ordinario",
          description: "Antiquísimo himno de alabanza y súplica con el que la Iglesia glorifica a Dios Padre y al Cordero en el Espíritu Santo. Nota: Se omite en Adviento y Cuaresma."
        }
      ]
    },
    {
      title: "Liturgia de la Palabra",
      subtitle: "Proclamar la enseñanza de Dios y responder a ella con un acto de fe y oración.",
      color: "border-blue-200 bg-blue-50/50 text-blue-900",
      iconColor: "text-blue-600 bg-blue-100",
      items: [
        {
          num: "4",
          name: "Salmo Responsorial",
          type: "Propio",
          description: "Favorece la meditación de la Palabra de Dios recién proclamada. Lo ideal es que el pueblo cante al menos la antífona o respuesta."
        },
        {
          num: "5",
          name: "Aclamación antes del Evangelio (Aleluya)",
          type: "Propio",
          description: "La asamblea acoge y saluda al Señor, que les va a hablar en el Evangelio. Es una aclamación de alegría. Se canta en todo tiempo, excepto en Cuaresma."
        }
      ]
    },
    {
      title: "Liturgia de la Eucaristía",
      subtitle: "Culmen de la misa. Se actualiza el sacrificio de Cristo y se participa de su Cuerpo y su Sangre en la comunión.",
      color: "border-red-200 bg-red-50/50 text-red-900",
      iconColor: "text-red-600 bg-red-100",
      items: [
        {
          num: "6",
          name: "Presentación de Dones (Ofrendas)",
          type: "Propio",
          description: "Acompaña la procesión en la que se llevan el pan y el vino (y otras ofrendas) al altar. El canto se prolonga por lo menos hasta que los dones han sido depositados en el altar."
        },
        {
          num: "7",
          name: "Santo (Sanctus)",
          type: "Ordinario",
          description: "Aclamación de alabanza, júbilo y adoración trinitaria. Toda la asamblea se une a las potestades celestiales dentro de la Plegaria Eucarística."
        },
        {
          num: "8",
          name: "Aclamación al Memorial",
          type: "Ordinario",
          description: "Tras la consagración, el pueblo aclama el misterio de la fe: \"Anunciamos tu muerte, proclamamos tu resurrección, ¡Ven, Señor Jesús!\""
        },
        {
          num: "9",
          name: "Doxología Final (Amén)",
          type: "Ordinario",
          description: "El \"Amén\" solemne con el que la asamblea ratifica y concluye toda la gran Plegaria Eucarística."
        },
        {
          num: "10",
          name: "Padre Nuestro",
          type: "Ordinario",
          description: "Oración dominical preparatoria para la comunión. Se recomienda cantarlo respetando siempre la música y letra tradicional y aprobada por la liturgia."
        },
        {
          num: "11",
          name: "Cordero de Dios (Agnus Dei)",
          type: "Ordinario",
          description: "Acompaña la fracción del Pan (cuando el sacerdote parte la Hostia). Es un canto de letanía y súplica a Cristo por la paz y misericordia."
        },
        {
          num: "12",
          name: "Canto de Comunión",
          type: "Propio",
          description: "Expresa la unión espiritual de quienes comulgan, demuestra la alegría del corazón y hace más fraternal la procesión de quienes comulgan. Comienza cuando el sacerdote comulga."
        }
      ]
    },
    {
      title: "Rito de Conclusión",
      subtitle: "Despedir a la comunidad para que vivan la fe en su vida cotidiana y vayan a anunciar el Evangelio.",
      color: "border-emerald-200 bg-emerald-50/50 text-emerald-900",
      iconColor: "text-emerald-600 bg-emerald-100",
      items: [
        {
          num: "13",
          name: "Canto de Salida (Opcional)",
          type: "Propio",
          description: "Acompaña la salida de los ministros y la disolución de la asamblea. Tradición muy arraigada, usualmente es un canto de acción de gracias o dedicado a la Virgen María."
        }
      ]
    }
  ];

  const seasons = [
    {
      name: "Tiempo de Adviento",
      sense: "Espera, vigilancia y esperanza ante la venida del Señor.",
      colorClass: "bg-purple-900 text-purple-100 border-purple-800",
      tagColor: "bg-purple-800 text-purple-200",
      bulletColor: "bg-purple-500",
      music: [
        "Cantos sobrios que inviten a la preparación.",
        "Se omite el canto del Gloria.",
        "Moderación en el uso de instrumentos musicales, permitiendo que la atención se centre en la espera vigilante."
      ]
    },
    {
      name: "Tiempo de Navidad",
      sense: "Celebración y júbilo por el nacimiento del Salvador.",
      colorClass: "bg-amber-100 text-amber-900 border-amber-200",
      tagColor: "bg-white text-amber-800 border-amber-200 border",
      bulletColor: "bg-amber-500",
      music: [
        "Tónica de gran alegría y regocijo.",
        "Se entonan villancicos litúrgicos y cantos festivos que proclaman la llegada del Salvador.",
        "El Gloria vuelve a cantarse con gran esplendor e instrumentos jubilosos."
      ]
    },
    {
      name: "Tiempo de Cuaresma",
      sense: "Penitencia, conversión y preparación espiritual hacia la Pascua.",
      colorClass: "bg-indigo-950 text-indigo-100 border-indigo-900",
      tagColor: "bg-indigo-900 text-indigo-200",
      bulletColor: "bg-indigo-500",
      music: [
        "Carácter austero, sobrio y penitencial.",
        "Se omiten el Gloria y el Aleluya (se reemplaza por aclamaciones al honor a Cristo).",
        "Los instrumentos se utilizan únicamente para sostener el canto, evitando adornos excesivos, solos o interludios."
      ]
    },
    {
      name: "Tiempo de Pascua",
      sense: "La máxima alegría de la Iglesia por la Resurrección de Cristo.",
      colorClass: "bg-yellow-50 text-yellow-900 border-yellow-200",
      tagColor: "bg-white text-yellow-700 border-yellow-200 border",
      bulletColor: "bg-yellow-500",
      music: [
        "Sumamente jubilosa, victoriosa y festiva.",
        "Es el momento del regocijo máximo: resurrección y victoria sobre la muerte.",
        "El Aleluya se canta de manera constante, solemne e insistente durante los 50 días de Pascua hasta Pentecostés."
      ]
    },
    {
      name: "Tiempo Ordinario",
      sense: "Profundización en las enseñanzas, parábolas y vida cotidiana de Jesús.",
      colorClass: "bg-emerald-800 text-emerald-50 border-emerald-700",
      tagColor: "bg-emerald-900 text-emerald-200",
      bulletColor: "bg-emerald-400",
      music: [
        "Equilibrada y variada según las lecturas del domingo.",
        "Los cantos suelen hacer un eco directo de las lecturas bíblicas, animando la vida comunitaria y el amor fraterno.",
        "Oportunidad para un repertorio amplio de servicio, alabanza y seguimiento discipular."
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center gap-2 print:hidden">
        <button 
          onClick={() => navigate('/secciones')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-red-500 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver a Todas las secciones
        </button>
      </div>

      {/* Encabezado estilo Misal */}
      <SacredBanner
        badge="Mysterium Fidei"
        icon={<Compass size={15} />}
        title="Guía de Cantos en la Eucaristía"
        subtitle="Qué se canta en cada momento de la misa, en cada tiempo litúrgico y con qué función."
      />
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <blockquote className="m-0 font-serif italic text-lg leading-relaxed text-stone-700 border-l-2 border-red-600 pl-4">
          "La música en la misa no es un simple acompañamiento, sino una parte esencial de la liturgia que busca elevar el espíritu, fomentar la unidad de la asamblea y facilitar la participación en el misterio celebrado."
        </blockquote>
        <div className="card-static" style={{ padding: '1rem 1.1rem' }}>
          <p className="font-bold mb-1 flex items-center gap-1 text-sm text-red-600"><Info size={16} /> ¿Sabías qué?</p>
          <p className="text-sm text-stone-600 m-0">El Misal Romano divide los cantos según el momento e intención de la liturgia, dándole a la música una función sagrada y comunitaria.</p>
        </div>
      </div>

      {/* Custom Premium Tabs Navigation */}
      <div className="flex bg-stone-100 p-1.5 rounded-xl border border-stone-200/60 print:hidden">
        <button
          onClick={() => setActiveTab('estructura')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'estructura' ? 'bg-white text-red-600 shadow-sm border border-stone-200/50' : 'text-stone-600 hover:text-stone-800'}`}
        >
          <Compass size={18} />
          Estructura de la Misa
        </button>
        <button
          onClick={() => setActiveTab('tiempos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'tiempos' ? 'bg-white text-red-600 shadow-sm border border-stone-200/50' : 'text-stone-600 hover:text-stone-800'}`}
        >
          <Calendar size={18} />
          Tiempos Litúrgicos
        </button>
        <button
          onClick={() => setActiveTab('clasificacion')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'clasificacion' ? 'bg-white text-red-600 shadow-sm border border-stone-200/50' : 'text-stone-600 hover:text-stone-800'}`}
        >
          <BookOpen size={18} />
          Tipos de Cantos
        </button>
      </div>

      {/* Tab 1: Estructura del Canto */}
      {activeTab === 'estructura' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Estructura y Ubicación de los Cantos</h2>
            <p className="text-stone-500 text-sm">
              La Eucaristía se divide en cuatro grandes bloques donde se insertan los distintos cantos. Revisa en qué momentos específicos se debe incluir música.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <div key={idx} className={`border rounded-2xl p-6 ${section.color} shadow-sm space-y-4`}>
                <div>
                  <h3 className="text-lg font-bold border-b pb-1.5 mb-2">{section.title}</h3>
                  <p className="text-sm opacity-90">{section.subtitle}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex gap-3 items-start hover:border-red-200 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${section.iconColor}`}>
                        {item.num}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-stone-800 text-sm md:text-base">{item.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === 'Ordinario' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Tiempos Litúrgicos */}
      {activeTab === 'tiempos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Particularidades según los Tiempos Litúrgicos</h2>
            <p className="text-stone-500 text-sm">
              La música debe acompañar el espíritu de cada tiempo litúrgico, ayudando a los fieles a adentrarse en el misterio de la fe correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {seasons.map((season, idx) => (
              <div key={idx} className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 ${season.colorClass}`}>
                <div className="md:w-1/3 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${season.tagColor}`}>
                      {season.name.split(" ").slice(2).join(" ") || "General"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{season.name}</h3>
                  <div className="text-sm font-serif italic opacity-95">
                    "{season.sense}"
                  </div>
                </div>
                <div className="md:w-2/3 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider opacity-75">Indicaciones Musicales:</h4>
                  <ul className="space-y-2">
                    {season.music.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex gap-2 items-start text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${season.bulletColor}`}></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Clasificación de los Cantos */}
      {activeTab === 'clasificacion' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Clasificación de los Cantos Litúrgicos</h2>
            <p className="text-stone-500 text-sm">
              Para estructurar y organizar la música de manera litúrgica, los cantos se clasifican generalmente en dos tipos según su texto y su origen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ordinario */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Bookmark size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">Cantos del Ordinario</h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Textos Fijos</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed font-serif">
                  Son aquellos cuyos textos son invariables, ya que están fijados en el Misal Romano. Al no cambiar, la asamblea debe conocerlos muy bien y cantarlos con facilidad.
                </p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2">Cantos incluidos:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["Señor, ten piedad", "Gloria", "Credo", "Santo", "Padrenuestro", "Cordero de Dios"].map((c, i) => (
                      <span key={i} className="text-xs bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-lg">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Propio */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Music size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-800 mb-1">Cantos del Propio</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Textos Variables</span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed font-serif">
                  Son aquellos cuyos textos pueden variar de acuerdo con el tiempo litúrgico (Adviento, Navidad, Cuaresma, Pascua, Ordinario), la festividad o las intenciones de la misa.
                </p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-2">Cantos incluidos:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["Canto de entrada", "Salmo responsorial", "Aleluya", "Canto de ofrendas", "Canto de comunión", "Canto de salida"].map((c, i) => (
                      <span key={i} className="text-xs bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-lg">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-md">
            <h3 className="text-base font-bold uppercase tracking-wider text-stone-400 mb-4 flex items-center gap-1.5">
              <Bookmark size={16} /> Objetivos Generales del Canto Litúrgico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <div className="text-red-400 font-bold text-sm">1. Ambientación</div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Crear el clima espiritual adecuado para cada momento del rito (alabanza, penitencia, meditación profunda, acción de gracias).
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-red-400 font-bold text-sm">2. Participación Activa</div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Facilitar que la asamblea no sea un mero espectador, sino que se una con una sola voz y corazón en la oración litúrgica cantada.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-red-400 font-bold text-sm">3. Expresión de Fe</div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Glorificar a Dios y celebrar de manera visible el misterio pascual de Jesucristo a través del canto y la alabanza.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
