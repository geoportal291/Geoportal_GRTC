/**
 * Plantillas HTML para el proceso de importación de modelos 3D.
 */

export const getImportModelTemplate = (tramosOptions) => `
    <div class="text-left w-full mt-4">
        <div class="mb-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700 shadow-inner">
            <label class="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <i class="fa-solid fa-microchip mr-1"></i> Modo de Renderizado
            </label>
            <select id="swal-tipo" class="w-full bg-slate-900 text-slate-200 border border-slate-600 rounded-lg text-sm p-2.5 outline-none focus:border-emerald-400 transition-colors cursor-pointer appearance-none px-3" style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right .7rem top 50%; background-size: .65rem auto;">
                <option value="tramo_maestro">TRAMO MAESTRO (Sin Malla, RAM Optimizada)</option>
                <option value="pieza">PIEZA ESPECÍFICA (Malla Completa)</option>
            </select>
            <p class="text-[9px] text-slate-400 mt-2 font-mono leading-tight">
                * 'Tramo Maestro' desactiva la descarga de la pesada malla geométrica y dibuja un muro estratigráfico local.
            </p>
        </div>

        <div class="bg-slate-800/60 p-4 rounded-xl border border-slate-700 shadow-inner">
            <label class="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                <i class="fa-solid fa-link mr-1"></i> Vincular a Tramo en BD
            </label>
            <select id="swal-tramo" class="w-full bg-slate-900 text-slate-200 border border-slate-600 rounded-lg text-sm p-2.5 outline-none focus:border-blue-400 transition-colors cursor-pointer appearance-none px-3" style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right .7rem top 50%; background-size: .65rem auto;">
                <option value="">-- Suelto / Sin Vincular --</option>
                ${tramosOptions}
            </select>
            <p class="text-[9px] text-slate-400 mt-2 font-mono leading-tight">
                * Especialmente vital para el vuelo de cámara al centro del proyecto.
            </p>
        </div>
    </div>
`;
