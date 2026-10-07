fetch('https://elvestiertulua.vercel.app/api/db')
  .then(r => r.json())
  .then(d => {
    console.log('Operadoras:', d.operadoras?.length);
    console.log('Recibos:', d.recibos?.length);
    console.log('Asistencia:', d.asistencia?.length);
    console.log('Egresos:', d.egresos?.length);
  })
