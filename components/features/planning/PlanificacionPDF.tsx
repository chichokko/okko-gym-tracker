import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, pdf } from '@react-pdf/renderer';
import { Planificacion, Exercise, User } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

// Register a clean font (optional, uses Helvetica by default)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' });

const ACCESSORY_LABELS: Record<string, string> = {
  'BARRA_OLIMPICA': 'Barra Olímpica',
  'CUERDA': 'Cuerda',
  'MANCUERNAS': 'Mancuernas',
  'MAQUINA': 'Máquina',
  'POLEA': 'Polea',
};

const formatAccessory = (acc: string) => ACCESSORY_LABELS[acc] || acc;

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
  },
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  studentLine: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    objectFit: 'cover',
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  coachName: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  // DESCRIPTION
  descriptionBox: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  descriptionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  // DAY SECTION
  daySection: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    marginBottom: 10,
  },
  // TABLE
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 24,
    alignItems: 'center',
  },
  cellExercise: { width: '30%', paddingHorizontal: 6, paddingVertical: 6, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  cellSeries: { width: '8%', paddingHorizontal: 4, paddingVertical: 6, textAlign: 'center', fontSize: 9 },
  cellReps: { width: '10%', paddingHorizontal: 4, paddingVertical: 6, textAlign: 'center', fontSize: 9 },
  cellCadence: { width: '12%', paddingHorizontal: 4, paddingVertical: 6, textAlign: 'center', fontSize: 9, color: '#64748b' },
  cellRest: { width: '10%', paddingHorizontal: 4, paddingVertical: 6, textAlign: 'center', fontSize: 9, color: '#64748b' },
  cellNotes: { width: '30%', paddingHorizontal: 4, paddingVertical: 6, fontSize: 8, color: '#64748b' },
  // Header cells are bold
  headerCell: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

// --------------- PDF Document Component ---------------

interface PlanPDFProps {
  plan: Planificacion;
  exercises: Exercise[];
  coachName: string;
  logoSrc: string;
  studentName: string;
}

const PlanPDFDocument: React.FC<PlanPDFProps> = ({ plan, exercises, coachName, logoSrc, studentName }) => (
  <Document>
    <Page size="A4" style={s.page}>
      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{plan.name}</Text>
          <Text style={s.subtitle}>{plan.type} • Duración: {plan.duration || 'N/A'}</Text>
          <Text style={s.studentLine}>Alumno: {studentName}</Text>
        </View>
        <View style={s.avatarContainer}>
          {logoSrc ? (
            <Image style={s.avatarImage} src={logoSrc} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={s.avatarInitial}>{coachName.charAt(0)}</Text>
            </View>
          )}
          <Text style={s.coachName}>Coach: {coachName}</Text>
        </View>
      </View>

      {/* DESCRIPTION */}
      {plan.description ? (
        <View style={s.descriptionBox}>
          <Text style={s.descriptionTitle}>Objetivos / Descripción</Text>
          <Text style={s.descriptionText}>{plan.description}</Text>
        </View>
      ) : null}

      {/* DAYS */}
      {plan.days.sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((dayLine, i) => {
        const routine = dayLine.routine;
        if (!routine) return null;

        return (
          <View key={dayLine.id || i} style={s.daySection} wrap={false}>
            <Text style={s.dayTitle}>Día {dayLine.orden || i + 1}: {routine.name}</Text>

            {/* Table Header */}
            <View style={s.tableHeader}>
              <Text style={[s.cellExercise, s.headerCell]}>Ejercicio</Text>
              <Text style={[s.cellSeries, s.headerCell]}>Series</Text>
              <Text style={[s.cellReps, s.headerCell]}>Reps</Text>
              <Text style={[s.cellCadence, s.headerCell]}>Cadencia</Text>
              <Text style={[s.cellRest, s.headerCell]}>Descanso</Text>
              <Text style={[s.cellNotes, s.headerCell]}>Notas</Text>
            </View>

            {/* Table Rows */}
            {routine.exercises.map((ex, j) => {
              const exObj = exercises.find(e => e.id === ex.exerciseId);
              const exName = exObj
                ? exObj.name + (exObj.accessory ? ` (${formatAccessory(exObj.accessory)})` : '')
                : 'Ejercicio Desconocido';

              return (
                <View key={j} style={s.tableRow}>
                  <Text style={s.cellExercise}>{exName}</Text>
                  <Text style={s.cellSeries}>{ex.sets}</Text>
                  <Text style={s.cellReps}>{ex.reps}</Text>
                  <Text style={s.cellCadence}>{ex.cadence || '-'}</Text>
                  <Text style={s.cellRest}>{ex.rest || '-'}</Text>
                  <Text style={s.cellNotes}>{ex.observation || ''}</Text>
                </View>
              );
            })}
          </View>
        );
      })}

      {/* FOOTER */}
      <Text style={s.footer} fixed>
        Generado en OKKO Gym Tracker • {new Date().toLocaleDateString('es-AR')}
      </Text>
    </Page>
  </Document>
);

// --------------- Export function (called from the Builder) ---------------

export default async function generatePDF(plan: Planificacion, exercises: Exercise[], students: User[]) {
  let logoSrc = '';
  let coachName = 'Entrenador';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: persona } = await supabase
        .from('persona')
        .select('nombre, apellido, configuracion')
        .eq('user_id', user.id)
        .single();
      if (persona) {
        coachName = `${persona.nombre} ${persona.apellido}`;
        if (persona.configuracion) {
          const config = typeof persona.configuracion === 'string' ? JSON.parse(persona.configuracion) : persona.configuracion;
          logoSrc = config.logoUrl || '';
        }
      }
    }
  } catch (e) {
    console.error('Error fetching coach for PDF:', e);
  }

  // Resize logo before embedding (reduces PDF size ~10x)
  const resizeLogo = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const img = await createImageBitmap(blob, { resizeWidth: 200, resizeQuality: 'medium' });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      img.close();
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return url;
    }
  };

  if (logoSrc && !logoSrc.startsWith('data:')) {
    logoSrc = await resizeLogo(logoSrc);
  }

  const student = students.find(s => s.id === plan.studentId);
  const studentName = student ? student.name : 'Plantilla General';

  // 2. Generate PDF blob using @react-pdf/renderer
  const blob = await pdf(
    <PlanPDFDocument
      plan={plan}
      exercises={exercises}
      coachName={coachName}
      logoSrc={logoSrc}
      studentName={studentName}
    />
  ).toBlob();

  // 3. Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Planificacion_${plan.name.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
