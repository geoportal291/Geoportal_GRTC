import React from 'react';
import { usePageTitle } from '../../contexts/PageTitleContext';
import './DisenosIngenieria.css';

const DISENIOS_INGENIERIA_OPCIONES_GEO = [
    {
        titulo: 'Diseño de Seguridad Vial y Señalización',
        icono: 'fa-traffic-light',
        descripcion: 'Configuración base para organizar la información técnica de seguridad vial y señalización.'
    },
    {
        titulo: 'Diseño de Pavimento',
        icono: 'fa-road',
        descripcion: 'Espacio de trabajo para el desarrollo y seguimiento del diseño de pavimento.'
    },
    {
        titulo: 'Diseño Geométrico',
        icono: 'fa-drafting-compass',
        descripcion: 'Módulo preparado para consolidar parámetros, criterios y entregables geométricos.'
    },
    {
        titulo: 'Diseño Estructural',
        icono: 'fa-building',
        descripcion: 'Sección reservada para soluciones estructurales y su documentación técnica.'
    },
    {
        titulo: 'Drenaje Obras de Arte',
        icono: 'fa-water',
        descripcion: 'Vista inicial para organizar drenaje, obras de arte y componentes asociados.'
    }
];

export default function DisenosIngenieria() {
    const { setPageTitle } = usePageTitle();

    React.useEffect(() => {
        setPageTitle('Diseños de Ingeniería');
        return () => setPageTitle('');
    }, [setPageTitle]);

    return (
        <section className="diseniosing_wrap_geo">
            <div className="diseniosing_header_geo">
                <span className="diseniosing_badge_geo">Ingeniería Básica</span>
                <h1 className="diseniosing_title_geo">Diseños de Ingeniería</h1>
                <p className="diseniosing_text_geo">
                    Nuevo acceso centralizado para las especialidades de diseño.
                    Desde aquí quedan visibles las subopciones principales del módulo.
                </p>
            </div>

            <div className="diseniosing_grid_geo">
                {DISENIOS_INGENIERIA_OPCIONES_GEO.map((opcion) => (
                    <article key={opcion.titulo} className="diseniosing_card_geo">
                        <div className="diseniosing_icon_geo">
                            <i className={`fas ${opcion.icono}`}></i>
                        </div>
                        <h2 className="diseniosing_card_title_geo">{opcion.titulo}</h2>
                        <p className="diseniosing_card_text_geo">{opcion.descripcion}</p>
                        <span className="diseniosing_state_geo">Próximamente</span>
                    </article>
                ))}
            </div>
        </section>
    );
}
