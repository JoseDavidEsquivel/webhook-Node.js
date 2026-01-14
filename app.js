// Import Express.js
const express = require('express');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = 123456;
const whatsappToken = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.PHONE_ID;

// Función para enviar mensaje por WhatsApp
async function sendWhatsAppMessage(to, message) {
  if (!whatsappToken || !phoneId) {
    console.error('❌ Faltan WHATSAPP_TOKEN o PHONE_ID en variables de entorno');
    return null;
  }
  
  try {
    const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`;
    
    const response = await axios.post(url, {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: message
      }
    }, {
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Mensaje enviado exitosamente');
    return response.data;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
    return null;
  }
}

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFICADO');
    res.status(200).send(challenge);
  } else {
    console.log('❌ FALLA DE VERIFICACIÓN');
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n📩 Webhook recibido ${timestamp}`);
  
  // Responder inmediatamente a Meta
  res.status(200).send('EVENT_RECEIVED');
  
  // Procesar el mensaje
  try {
    const body = req.body;
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    
    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body.toLowerCase().trim();
      
      console.log(`📱 De: ${from}`);
      console.log(`💬 Texto: ${text}`);
      
      // Verificar si es un saludo
      const saludos = ['hola', 'holi', 'holaa', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches'];
      const esSaludo = saludos.some(saludo => text.includes(saludo));
      
      if (esSaludo) {
        console.log('🤖 Reconocido como saludo, respondiendo...');
        await sendWhatsAppMessage(from, 
          "Hola buenas tardes, gracias por usar el servicio de atención a cliente. " +
          "¿En qué puedo ayudarte hoy?"
        );
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`\nServidor listo en puerto ${port}`);
});