const express = require('express');
const app = express();
app.use(express.json());

app.get('/ruta-get', (req, res) => {
    res.send('¡Hola desde GET!');
});

app.post('/ruta-post', (req, res) => {
    console.log(req.body);
    res.send('¡Hola desde POST!');
});

const port =  3005;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
