const express = require('express');
const path = require('path');
const paypal = require('@paypal/checkout-server-sdk');
const dotenv = require('dotenv');
dotenv.config();

// PayPal environment setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

const app = express();
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create Order endpoint
app.post('/api/orders', async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: '10.00'
        }
      }
    ]
  });

  try {
    const order = await client.execute(request);
    res.status(201).json({ orderID: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating order');
  }
});

// Capture Order endpoint
app.post('/api/orders/:orderID/capture', async (req, res) => {
  const { orderID } = req.params;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    res.status(200).json({ capture });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error capturing order');
  }
});

// ✅ Webhook Listener endpoint
app.post('/webhook', (req, res) => {
  const event = req.body;

  console.log('📩 Webhook recebido:');
  console.log(JSON.stringify(event, null, 2));

  if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
    console.log('✅ Pedido aprovado pelo cliente');
    // Você pode salvar o orderID, buyer info, etc. aqui
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    console.log('💰 Pagamento capturado com sucesso');
    // Atualize status de pedido, estoque, etc.
  }

  res.sendStatus(200);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
