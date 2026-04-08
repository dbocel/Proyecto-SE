from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

FACULTAD_MAP = {
    'Ingeniería': 'Ingeniería',
    'Salud': 'Salud',
    'Negocios': 'Negocios',
    'Ciencias Sociales': 'Ciencias Sociales',
    'Diseño': 'Diseño',
    'Comunicación': 'Comunicación',
    'Ciencias Jurídicas': 'Ciencias Jurídicas',
    'Tecnología': 'Tecnología',
    'Arte': 'Arte',
}

def cargar_base_conocimientos():
    with open('reglas.json', 'r', encoding='utf-8') as f:
        return json.load(f)
print("Base de conocimientos cargada exitosamente.")


@app.route('/diagnosticar', methods=['POST'])
def diagnosticar():
    hechos = request.json
    print("Hechos recibidos:", hechos)
    departamento = hechos.get('departamento', '').strip()
    municipio    = hechos.get('municipio', '').strip()
    presupuesto  = hechos.get('presupuesto', '').strip()
    facultad     = hechos.get('facultad', '').strip()
    jornada      = hechos.get('jornada', '').strip()

    if not all([departamento, municipio, presupuesto, facultad, jornada]):
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    base = cargar_base_conocimientos()

    # Paso 1: filtrar por departamento y municipio
    por_ubicacion = [
        u for u in base['universidades']
        if u['departamento'].lower() == departamento.lower()
        and u['municipio'].lower() == municipio.lower()
    ]
    if not por_ubicacion:
        return jsonify({'error': 'No hay universidades disponibles en esa ubicación'}), 404

    # Paso 2: filtrar por presupuesto
    por_presupuesto = [
        u for u in por_ubicacion
        if u['presupuesto'].lower() == presupuesto.lower()
    ]
    if not por_presupuesto:
        return jsonify({'error': 'No hay universidades en esa ubicación con ese presupuesto'}), 404

    # Paso 3: filtrar por facultad y jornada
    clave_facultad = FACULTAD_MAP.get(facultad)
    recomendaciones = []

    for uni in por_presupuesto:
        if clave_facultad:
            carreras = uni['facultades'].get(clave_facultad, [])
        else:
            # Búsqueda flexible: recorrer todas las facultades
            carreras = []
            for key, lista in uni['facultades'].items():
                if facultad.lower() in key.lower():
                    carreras.extend(lista)

        if carreras and jornada in uni['jornadas']:
            recomendaciones.append({
                'universidad': uni['nombre'],
                'sede': uni['sede'],
                'ubicacion': uni['direccion'],   
                'departamento': uni['departamento'],
                'municipio': uni['municipio'],
                'facultad': clave_facultad or facultad,
                'carreras_sugeridas': carreras,
                'jornadas_disponibles': uni['jornadas'],
                'jornada_seleccionada': jornada,
                'presupuesto': uni['presupuesto'],
                'sitio_web': uni.get('sitio_web', ''),
            })

    if not recomendaciones:
        return jsonify({'error': 'No existen coincidencias con la facultad o jornada seleccionada'}), 404

    return jsonify({
        'total_recomendaciones': len(recomendaciones),
        'recomendaciones': recomendaciones
    })


@app.route('/departamentos', methods=['GET'])
def obtener_departamentos():
    base = cargar_base_conocimientos()
    departamentos = sorted(set(u['departamento'] for u in base['universidades']))
    return jsonify(departamentos)


@app.route('/municipios/<departamento>', methods=['GET'])
def obtener_municipios(departamento):
    base = cargar_base_conocimientos()
    municipios = sorted(set(
        u['municipio']
        for u in base['universidades']
        if u['departamento'].lower() == departamento.lower()
    ))
    return jsonify(municipios)


@app.route('/facultades', methods=['GET'])
def obtener_facultades():
    """Devuelve todas las claves de facultad presentes en el JSON."""
    base = cargar_base_conocimientos()
    facultades = sorted(set(
        fac
        for u in base['universidades']
        for fac in u['facultades'].keys()
    ))
    return jsonify(facultades)


if __name__ == '__main__':
    app.run(debug=True, port=5000)