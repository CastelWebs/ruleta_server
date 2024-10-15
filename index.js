const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');  // Permite todas las solicitudes
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.json());

app.post('/registrar', (req, res) => {
    const { nombre, email } = req.body;
    console.log("Intentando registrar usuario");

    const filePath = './usuarios.xlsx';
    let workbook;

    // Cargar o crear el archivo Excel
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.aoa_to_sheet([['Nombre', 'Email']]); 
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
        xlsx.writeFile(workbook, filePath);  // Crear el archivo si no existe
    }

    const worksheet = workbook.Sheets['Usuarios'];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Verificar si el email ya existe
    const emailExists = jsonData.some(row => row[1] === email);
    
    if (emailExists) {
        return res.status(400).json({ message: 'El email ya está registrado. No puedes jugar de nuevo.' });
    }

    // Si el email no existe, agregar los datos
    jsonData.push([nombre, email]);

    // Crear una nueva hoja con los datos actualizados
    const newWorksheet = xlsx.utils.aoa_to_sheet(jsonData);
    workbook.Sheets['Usuarios'] = newWorksheet;

    // Guardar el archivo actualizado
    xlsx.writeFile(workbook, filePath);

    console.log("Usuario registrado con éxito");
    res.status(200).json({ message: 'Datos guardados en usuarios.xlsx' });
});

app.post('/premio', (req, res) => {
    const { email, premio } = req.body;  // Supone que enviamos el email del usuario y el premio

    const filePath = './usuarios.xlsx';
    let workbook;

    // Cargar el archivo Excel
    if (fs.existsSync(filePath)) {
        workbook = xlsx.readFile(filePath);
    } else {
        return res.status(400).json({ message: 'No se encontró el archivo usuarios.xlsx' });
    }

    const worksheet = workbook.Sheets['Usuarios'];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Encontrar la fila del usuario por email
    const headers = jsonData[0];  // La primera fila contiene los encabezados
    const emailIndex = headers.indexOf('Email');
    let premioIndex = headers.indexOf('Premio');

    // Si no existe la columna "Premio", agregarla
    if (premioIndex === -1) {
        headers.push('Premio');  // Agregar el encabezado "Premio"
        premioIndex = headers.length - 1;  // El nuevo índice será la última columna
    }

    // Buscar la fila del usuario correspondiente al email
    const userRow = jsonData.find(row => row[emailIndex] === email);
    if (!userRow) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Asignar el premio al usuario
    userRow[premioIndex] = premio;

    // Crear una nueva hoja con los datos actualizados
    const newWorksheet = xlsx.utils.aoa_to_sheet(jsonData);
    workbook.Sheets['Usuarios'] = newWorksheet;

    // Guardar el archivo actualizado
    xlsx.writeFile(workbook, filePath);

    console.log("Premio registrado con éxito");
    res.status(200).json({ message: 'Premio registrado correctamente en usuarios.xlsx' });
});



app.listen(4000, () => {
    console.log('Servidor corriendo en http://localhost:4000');
});
