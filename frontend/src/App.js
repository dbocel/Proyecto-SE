import React, { useState, useEffect } from 'react';
import './App.css';

//const API = 'https://proyecto-se-qyp7.onrender.com';
const API = process.env.REACT_APP_API;

const FACULTADES = [
  { label: 'Ingeniería',        descripcion: 'Civil, Electrónica, Industrial…',     valor: 'Ingeniería' },
  { label: 'Salud',             descripcion: 'Medicina, Odontología, Enfermería…',  valor: 'Salud' },
  { label: 'Negocios',          descripcion: 'Administración, Economía, CPA…',      valor: 'Negocios' },
  { label: 'Ciencias Sociales', descripcion: 'Derecho, Psicología, Comunicación…',  valor: 'Ciencias Sociales' },
  { label: 'Diseño',            descripcion: 'Arquitectura, Diseño Gráfico…',       valor: 'Diseño' },
];

const JORNADAS = [
  { label: 'Matutina',      descripcion: 'Clases por la mañana', valor: 'Matutina' },
  { label: 'Vespertina',    descripcion: 'Clases por la tarde',  valor: 'Vespertina' },
  { label: 'Nocturna',      descripcion: 'Clases por la noche',  valor: 'Nocturna' },
  { label: 'Fin de Semana', descripcion: 'Sábados y domingos',   valor: 'Fin de Semana' },
];

const PRESUPUESTOS = [
  { label: 'Bajo',  descripcion: 'Q0 – Q500',       valor: 'Bajo' },
  { label: 'Medio', descripcion: 'Q1,000 – Q2,500', valor: 'Medio' },
  { label: 'Alto',  descripcion: 'Más de Q4,000',   valor: 'Alto' },
];

// ── Paso 0: selector de ubicación con dropdowns encadenados ──────────────────
function PasoUbicacion({ onConfirmar }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios]       = useState([]);
  const [deptoSel, setDeptoSel]           = useState('');
  const [muniSel, setMuniSel]             = useState('');
  const [loadingMunis, setLoadingMunis]   = useState(false);

  useEffect(() => {
    fetch(`${API}/departamentos`)
      .then(r => r.json())
      .then(setDepartamentos)
      .catch(() => setDepartamentos(['Guatemala', 'Quetzaltenango', 'Sacatepéquez']));
  }, []);

  const handleDepartamento = async (e) => {
    const val = e.target.value;
    setDeptoSel(val);
    setMuniSel('');
    setMunicipios([]);
    if (!val) return;
    setLoadingMunis(true);
    try {
      const res = await fetch(`${API}/municipios/${encodeURIComponent(val)}`);
      const data = await res.json();
      setMunicipios(data);
    } catch {
      setMunicipios([]);
    } finally {
      setLoadingMunis(false);
    }
  };

  return (
    <div className="question-section">
      <div>
        <h2>¿Dónde te encuentras o donde vives?</h2>
        <p className="subtitle">
          Selecciona tu departamento y municipio para encontrar universidades cercanas.
        </p>
      </div>

      <div className="ubicacion-form">
        {/* Departamento */}
        <div className="select-group">
          <label className="select-label">Departamento</label>
          <div className="select-wrapper">
            <select
              className="select-dropdown"
              value={deptoSel}
              onChange={handleDepartamento}
            >
              <option value="">-- Selecciona un departamento --</option>
              {departamentos.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className="select-arrow">▾</span>
          </div>
        </div>

        {/* Municipio: aparece solo cuando hay departamento */}
        {deptoSel && (
          <div className="select-group select-group--animated">
            <label className="select-label">
              Municipio
              {loadingMunis && <span className="select-loading"> Cargando…</span>}
            </label>
            <div className="select-wrapper">
              <select
                className="select-dropdown"
                value={muniSel}
                onChange={e => setMuniSel(e.target.value)}
                disabled={loadingMunis || municipios.length === 0}
              >
                <option value="">-- Selecciona un municipio --</option>
                {municipios.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>
        )}

        {/* Botón confirmar: habilitado solo cuando ambos están elegidos */}
        <button
          className="confirm-btn"
          disabled={!deptoSel || !muniSel}
          onClick={() => onConfirmar(deptoSel, muniSel)}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ── Pasos 1–3: botones de opción
function PasoOpciones({ pregunta, onSeleccionar }) {
  return (
    <div className="question-section">
      <div>
        <h2>{pregunta.titulo}</h2>
        <p className="subtitle">{pregunta.subtitulo}</p>
      </div>
      <div className="options">
        {pregunta.opciones.map((opcion, i) => (
          <button
            key={i}
            className="option-card"
            onClick={() => onSeleccionar(pregunta.campo, opcion.valor)}
          >
            <div>
              <h3>{opcion.label}</h3>
              {opcion.descripcion && <p>{opcion.descripcion}</p>}
            </div>
            <div className="arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// App principal 
export default function App() {
  const [paso, setPaso]             = useState(0);
  const [cargando, setCargando]     = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [respuestas, setRespuestas] = useState({
    departamento: '',
    municipio:    '',
    presupuesto:  '',
    facultad:     '',
    jornada:      '',
  });

  const TOTAL_PASOS = 4;

  const preguntasBotones = [
    {
      campo: 'presupuesto',
      titulo: '¿Cuál es tu presupuesto mensual?',
      subtitulo: 'Selecciona el rango que mejor se adapte a tu situación económica.',
      opciones: PRESUPUESTOS,
    },
    {
      campo: 'facultad',
      titulo: 'Selecciona tu área de interés',
      subtitulo: 'Elige el área profesional que más te llama la atención.',
      opciones: FACULTADES,
    },
    {
      campo: 'jornada',
      titulo: '¿En qué horario puedes estudiar?',
      subtitulo: 'Selecciona la jornada que mejor se adapte a tu tiempo.',
      opciones: JORNADAS,
    },
  ];

  const confirmarUbicacion = (depto, muni) => {
    setRespuestas(prev => ({ ...prev, departamento: depto, municipio: muni }));
    setPaso(1);
  };

  const seleccionarOpcion = async (campo, valor) => {
    const nuevas = { ...respuestas, [campo]: valor };
    setRespuestas(nuevas);

    if (paso < TOTAL_PASOS - 1) {
      setPaso(paso + 1);
      return;
    }

    // Último paso → llamar API
    setCargando(true);
    try {
      const res = await fetch(`${API}/diagnosticar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevas),
      });
      const data = await res.json();
      setResultado(res.ok ? data : { error: data.error || 'Sin resultados' });
    } catch {
      setResultado({ error: 'No se pudo conectar con el servidor.' });
    } finally {
      setCargando(false);
      setPaso(TOTAL_PASOS);
    }
  };

  const reiniciar = () => {
    setPaso(0);
    setResultado(null);
    setRespuestas({ departamento: '', municipio: '', presupuesto: '', facultad: '', jornada: '' });
  };

  return (
    <div className="app">
      <div className="background"></div>
      <div className="blur blur-left"></div>
      <div className="blur blur-right"></div>

      <div className="container">
        {/* ── Panel izquierdo ── */}
        <div className="left-panel">
          <div className="badge">Sistema de Asistente Universitario</div>
          <h1>Encuentra la universidad ideal para tu futuro</h1>
          <p>
            Nuestro asistente analiza tu ubicación, presupuesto, área de interés
            y disponibilidad para recomendarte la mejor opción universitaria.
          </p>

          <div className="progress-bar">
            {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
              <div
                key={i}
                className={`progress-step ${paso > i ? 'completed' : paso === i ? 'active' : ''}`}
              />
            ))}
          </div>

          {paso < TOTAL_PASOS && (
            <p className="progress-label">Paso {paso + 1} de {TOTAL_PASOS}</p>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div className="card-container">

          {paso === 0 && (
            <PasoUbicacion onConfirmar={confirmarUbicacion} />
          )}

          {paso >= 1 && paso < TOTAL_PASOS && (
            <PasoOpciones
              pregunta={preguntasBotones[paso - 1]}
              onSeleccionar={seleccionarOpcion}
            />
          )}

          {cargando && (
            <div className="loading">
              <div className="spinner"></div>
              Analizando tus respuestas…
            </div>
          )}

          {paso === TOTAL_PASOS && resultado && (
            <div className="result-section">
              {resultado.error ? (
                <div className="result-card">
                  <h2>Sin resultados</h2>
                  <p>{resultado.error}</p>
                </div>
              ) : (
                <>
                  <div className="result-header">
                    <h2>Recomendaciones Personalizadas</h2>
                    <p>
                      Se encontraron{' '}
                      <strong>{resultado.total_recomendaciones}</strong>{' '}
                      universidad(es) que coinciden con tu perfil.
                    </p>
                  </div>

                  {resultado.recomendaciones?.map((rec, i) => (
                    <div key={i} className="result-card">
                      <span>Universidad</span>
                      <h3>{rec.universidad}</h3>

                      <span>Sede</span>
                      <p>{rec.sede}</p>

                      <span>Dirección</span>
                      <p>{rec.ubicacion}</p>

                      <span>Facultad</span>
                      <p>{rec.facultad}</p>

                      <span>Jornada seleccionada</span>
                      <p>{rec.jornada_seleccionada}</p>

                      <span>Jornadas disponibles</span>
                      <div className="tags">
                        {rec.jornadas_disponibles?.map((j, idx) => (
                          <div key={idx} className={`tag ${j === rec.jornada_seleccionada ? 'tag-active' : ''}`}>
                            {j}
                          </div>
                        ))}
                      </div>

                      <span>Carreras sugeridas</span>
                      <div className="tags">
                        {rec.carreras_sugeridas?.map((c, idx) => (
                          <div key={idx} className="tag">{c}</div>
                        ))}
                      </div>

                      {rec.sitio_web && (
                        <a href={rec.sitio_web} target="_blank" rel="noreferrer" className="web-link">
                          Visitar sitio web →
                        </a>
                      )}
                    </div>
                  ))}
                </>
              )}

              <button className="restart-btn" onClick={reiniciar}>
                Nueva Consulta
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="footer">
        <p>
          Desarrollado por <strong>dbocel</strong>. Datos obtenidos de fuentes públicas y actualizados a 2026.
        </p>
      </div>
    </div>
  );
}
