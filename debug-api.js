const axios = require('axios');

const API_URL = 'https://sknupdates-production.up.railway.app/api';

async function debugAPI() {
  console.log('\n🔍 DEBUG DETALLADO DE API\n');
  
  try {
    // 1. Login
    console.log('1️⃣ Intentando login...');
    const loginResponse = await axios.post(`${API_URL}/mobile/login`, {
      email: 'prueba1@gmail.com',
      password: '123456'
    });
    
    console.log('✅ Login exitoso');
    console.log('Usuario:', loginResponse.data.user);
    const userId = loginResponse.data.user.id;
    
    // 2. Intentar obtener tickets con más detalle
    console.log('\n2️⃣ Intentando obtener tickets...');
    console.log('URL:', `${API_URL}/mobile/tickets?userId=${userId}`);
    
    try {
      const ticketsResponse = await axios.get(`${API_URL}/mobile/tickets?userId=${userId}`);
      console.log('✅ Respuesta exitosa');
      console.log('Tickets:', ticketsResponse.data);
    } catch (error) {
      console.log('\n❌ ERROR AL OBTENER TICKETS:');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Error message:', error.response?.data?.message);
      console.log('\n📋 Respuesta completa del servidor:');
      console.log(JSON.stringify(error.response?.data, null, 2));
      
      // Mostrar más detalles del error
      if (error.response?.data) {
        console.log('\n🔍 Detalle del error:');
        console.log(error.response.data);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN LOGIN:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.message);
  }
}

debugAPI();
