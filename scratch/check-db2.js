fetch('https://elvestiertulua.vercel.app/api/db')
  .then(r => r.json())
  .then(d => {
    console.log(JSON.stringify(d.recibos, null, 2));
  })
