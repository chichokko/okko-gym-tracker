import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Planificacion, Exercise, User } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

export default async function generatePDF(plan: Planificacion, exercises: Exercise[], students: User[]) {
  // 1. Get current coach data for logo
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

  // 2. Create a temporary container, fully isolated from page CSS
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.color = '#000000';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.all = 'initial';
  // Re-apply needed styles after all:initial
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.color = '#000000';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.colorScheme = 'light';
  document.body.appendChild(container);

  // 3. Build HTML structure
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        <h1 style="margin: 0; font-size: 28px; color: #0f172a;">${plan.name}</h1>
        <p style="margin: 5px 0 0; color: #64748b; font-size: 16px;">${plan.type} • Duración: ${plan.duration || 'N/A'}</p>
        <p style="margin: 5px 0 0; font-weight: bold; font-size: 16px;">Alumno: ${studentName}</p>
      </div>
  `;

  if (logoSrc) {
    html += `
      <div style="text-align: center;">
        <img src="${logoSrc}" style="max-width: 120px; max-height: 80px; object-fit: contain;" crossorigin="anonymous" />
        <p style="margin: 5px 0 0; font-size: 12px; color: #64748b;">${coachName}</p>
      </div>
    `;
  } else {
    html += `
      <div style="text-align: center;">
        <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; color: #3b82f6;">
          ${coachName.charAt(0)}
        </div>
        <p style="margin: 5px 0 0; font-size: 12px; color: #64748b;">${coachName}</p>
      </div>
    `;
  }

  html += `</div>`;

  if (plan.description) {
    html += `
      <div style="margin-bottom: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; font-size: 16px;">Objetivos / Descripción</h3>
        <p style="margin: 0; color: #334155; line-height: 1.5;">${plan.description}</p>
      </div>
    `;
  }

  // Days
  plan.days.forEach((dayLine, i) => {
    const routine = dayLine.routine;
    if (!routine) return;

    html += `
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h2 style="margin: 0 0 15px; font-size: 20px; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
          Día ${i + 1}: ${routine.name}
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Ejercicio</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: center;">Series</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: center;">Reps</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: center;">Cadencia</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: center;">Descanso</th>
              <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Método</th>
            </tr>
          </thead>
          <tbody>
    `;

    routine.exercises.forEach(ex => {
      const exObj = exercises.find(e => e.id === ex.exerciseId);
      const exName = exObj ? exObj.name : 'Ejercicio Desconocido';

      html += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${exName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${ex.sets}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${ex.reps}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${ex.cadence || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${ex.rest || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${ex.observation || ''}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  });

  container.innerHTML = html;

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

  // 4. Generate PDF
  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${plan.type}_${plan.name.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Hubo un error al generar el PDF. Revisa la consola.");
  } finally {
    document.body.removeChild(container);
  }
}
