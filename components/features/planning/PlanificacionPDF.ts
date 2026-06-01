import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Planificacion, Exercise, User } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

export default async function generatePDF(plan: Planificacion, exercises: Exercise[], students: User[]) {
  let logoSrc = '';
  let coachName = 'Entrenador';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: persona } = await supabase.from('persona').select('nombre, apellido, configuracion').eq('user_id', user.id).single();
      if (persona) {
        coachName = `${persona.nombre} ${persona.apellido}`;
        if (persona.configuracion) {
          const config = typeof persona.configuracion === 'string' ? JSON.parse(persona.configuracion) : persona.configuracion;
          logoSrc = config.logoUrl || '';
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  const student = students.find(s => s.id === plan.studentId);
  const studentName = student ? student.name : 'Plantilla General';

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '0';
  container.style.color = '#1e293b';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.all = 'initial';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '0';
  container.style.color = '#1e293b';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  container.style.colorScheme = 'light';
  document.body.appendChild(container);

  // Header
  let headerHtml = `
    <div style="border-bottom: 2px solid #e2e8f0; padding: 32px 40px 20px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 13px; font-weight: 600; color: #3b82f6; margin-bottom: 4px;">${plan.type}</div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a;">${plan.name}</h1>
          <p style="margin: 6px 0 0; color: #64748b; font-size: 14px;">
            ${plan.duration ? `Duración: ${plan.duration} • ` : ''}Alumno: ${studentName}
          </p>
        </div>
        <div style="text-align: right; flex-shrink: 0; margin-left: 24px;">
  `;

  if (logoSrc) {
    headerHtml += `
          <img src="${logoSrc}" style="max-width: 100px; max-height: 60px; object-fit: contain;" crossorigin="anonymous" />
          <p style="margin: 6px 0 0; font-size: 12px; color: #94a3b8;">${coachName}</p>
    `;
  } else {
    headerHtml += `
          <div style="width: 48px; height: 48px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-left: auto;">
            <span style="font-size: 20px; font-weight: 700; color: #3b82f6;">${coachName.charAt(0)}</span>
          </div>
          <p style="margin: 6px 0 0; font-size: 12px; color: #94a3b8;">${coachName}</p>
    `;
  }

  headerHtml += `</div></div></div>`;

  // Description
  let descHtml = '';
  if (plan.description) {
    descHtml = `
      <div style="margin: 0 40px 28px; padding: 0 0 0 14px; border-left: 3px solid #3b82f6;">
        <h3 style="margin: 0 0 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8;">Objetivos</h3>
        <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${plan.description}</p>
      </div>
    `;
  }

  // Days
  let daysHtml = '';
  plan.days.forEach((dayLine, i) => {
    const routine = dayLine.routine;
    if (!routine) return;

    daysHtml += `
      <div style="margin: 0 40px 28px; page-break-inside: avoid;">
        <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 700; color: #0f172a;">
          Día ${i + 1}: ${routine.name}
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Ejercicio</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 60px;">Series</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 60px;">Reps</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 70px;">Cadencia</th>
              <th style="padding: 8px 12px; text-align: center; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 70px;">Descanso</th>
              <th style="padding: 8px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Método</th>
            </tr>
          </thead>
          <tbody>
    `;

    routine.exercises.forEach((ex, exIdx) => {
      const exObj = exercises.find(e => e.id === ex.exerciseId);
      const exName = exObj ? exObj.name : 'Ejercicio Desconocido';
      const bgColor = exIdx % 2 === 0 ? '#ffffff' : '#fafafa';

      daysHtml += `
        <tr style="background: ${bgColor};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">
            ${exName}
            ${exObj?.accessory ? `<span style="color: #d97706; font-weight: 500; font-size: 11px;"> (${exObj.accessory})</span>` : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 600; color: #0f172a;">${ex.sets}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 600; color: #0f172a;">${ex.reps}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${ex.cadence || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">${ex.rest || '-'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #64748b;">${ex.observation || ''}</td>
        </tr>
      `;
    });

    daysHtml += `
          </tbody>
        </table>
      </div>
    `;
  });

  // Footer
  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const footerHtml = `
    <div style="margin: 32px 40px 0; padding: 16px 0 0; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
      <span>Generado por ${coachName}</span>
      <span>${today}</span>
    </div>
  `;

  container.innerHTML = `
    <div style="padding-bottom: 24px;">
      ${headerHtml}
      ${descHtml}
      ${daysHtml}
      ${footerHtml}
    </div>
  `;

  // Inject CSS to override Tailwind oklch color variables that html2canvas can't parse
  const fixStyle = document.createElement('style');
  fixStyle.textContent = `
    :root {
      --color-white: #ffffff;
      --color-black: #000000;
      --color-slate-50: #f8fafc;
      --color-slate-100: #f1f5f9;
      --color-slate-200: #e2e8f0;
      --color-slate-300: #cbd5e1;
      --color-slate-400: #94a3b8;
      --color-slate-500: #64748b;
      --color-slate-600: #475569;
      --color-slate-700: #334155;
      --color-slate-800: #1e293b;
      --color-slate-900: #0f172a;
      --color-slate-950: #020617;
      --color-gray-50: #f9fafb;
      --color-gray-100: #f3f4f6;
      --color-gray-200: #e5e7eb;
      --color-gray-300: #d1d5db;
      --color-gray-400: #9ca3af;
      --color-gray-500: #6b7280;
      --color-gray-600: #4b5563;
      --color-gray-700: #374151;
      --color-gray-800: #1f2937;
      --color-gray-900: #111827;
      --color-blue-50: #eff6ff;
      --color-blue-100: #dbeafe;
      --color-blue-200: #bfdbfe;
      --color-blue-300: #93c5fd;
      --color-blue-400: #60a5fa;
      --color-blue-500: #3b82f6;
      --color-blue-600: #2563eb;
      --color-blue-700: #1d4ed8;
      --color-blue-800: #1e40af;
      --color-blue-900: #1e3a8a;
      --color-red-50: #fef2f2;
      --color-red-100: #fee2e2;
      --color-red-200: #fecaca;
      --color-red-300: #fca5a5;
      --color-red-400: #f87171;
      --color-red-500: #ef4444;
      --color-red-600: #dc2626;
      --color-red-700: #b91c1c;
      --color-red-800: #991b1b;
      --color-red-900: #7f1d1d;
      --color-green-50: #f0fdf4;
      --color-green-100: #dcfce7;
      --color-green-200: #bbf7d0;
      --color-green-300: #86efac;
      --color-green-400: #4ade80;
      --color-green-500: #22c55e;
      --color-green-600: #16a34a;
      --color-green-700: #15803d;
      --color-green-800: #166534;
      --color-green-900: #14532d;
    }
  `;
  container.insertBefore(fixStyle, container.firstChild);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const cw = canvas.width;
    const ch = canvas.height;

    const mmPerPx = pw / cw;
    const pxPerPage = ph / mmPerPx;

    let srcY = 0;
    let pageNum = 0;

    while (srcY < ch) {
      const sliceH = Math.min(pxPerPage, ch - srcY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = cw;
      sliceCanvas.height = sliceH;
      const sliceCtx = sliceCanvas.getContext('2d')!;
      sliceCtx.drawImage(canvas, 0, srcY, cw, sliceH, 0, 0, cw, sliceH);
      const sliceData = sliceCanvas.toDataURL('image/png');

      if (pageNum > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', 0, 0, pw, sliceH * mmPerPx);

      srcY += sliceH;
      pageNum++;
    }

    pdf.save(`${plan.type}_${plan.name.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Hubo un error al generar el PDF. Revisa la consola.");
  } finally {
    document.body.removeChild(container);
  }
}
