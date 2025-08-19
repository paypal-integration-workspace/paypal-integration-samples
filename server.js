const express = require('express');
const path = require('path');
const paypal = require('@paypal/checkout-server-sdk');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 💾 Armazenamento temporário dos pagamentos e credenciais
const paymentStatus = {};

let runtimeCredentials = {
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  amount: '10.00',
  currency: 'USD'
};

let environment = new paypal.core.SandboxEnvironment(
  runtimeCredentials.clientId,
  runtimeCredentials.clientSecret
);
let client = new paypal.core.PayPalHttpClient(environment);

// 🔧 Rota para atualizar clientId, secret, valor e moeda
app.post('/api/config', (req, res) => {
  const { clientId, clientSecret, amount, currency } = req.body;

  runtimeCredentials = {
    clientId: clientId || runtimeCredentials.clientId,
    clientSecret: clientSecret || runtimeCredentials.clientSecret,
    amount: amount || runtimeCredentials.amount,
    currency: currency || runtimeCredentials.currency
  };

  environment = new paypal.core.SandboxEnvironment(
    runtimeCredentials.clientId,
    runtimeCredentials.clientSecret
  );
  client = new paypal.core.PayPalHttpClient(environment);

  console.log('⚙️ Configuração atualizada via /api/config');
  res.sendStatus(200);
});

// Criar pedido com amount e currency dinâmicos
app.post('/api/orders', async (req, res) => {
  const { amount, currency } = runtimeCredentials;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount
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

// Capturar pedido
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

// Webhook do PayPal
app.post('/webhook', (req, res) => {
  const event = req.body;

  console.log('📩 Webhook recebido:');
  console.log(JSON.stringify(event, null, 2));

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource;
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    const transactionId = resource.id;
    const amount = resource.amount?.value;
    const webhookId = event.id;

    if (orderId) {
      paymentStatus[orderId] = {
        status: 'COMPLETED',
        transactionId,
        amount,
        webhookId
      };
      console.log(`✅ Pagamento salvo para o orderID: ${orderId}`);
    } else {
      console.warn('⚠️ order_id não encontrado no webhook');
    }
  }

  res.sendStatus(200);
});

// Verificar status
app.get('/api/status/:orderID', (req, res) => {
  const { orderID } = req.params;
  const status = paymentStatus[orderID];

  if (status) {
    res.json(status);
  } else {
    res.json({ status: 'PENDING' });
  }
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Retorna uma lista com todos os orderIDs recebidos via webhook
app.get('/api/status', (req, res) => {
  const allOrderIDs = Object.keys(paymentStatus);
  res.json(allOrderIDs);
});
// Retorna o objeto completo com todos os status de pedidos
app.get('/api/status/full', (req, res) => {
  res.json(paymentStatus);
});

