# paypal-integration-samples
Samples for functional PayPal integrations.
 ## Running the sample

This sample demonstrates a simple PayPal checkout integration using the JavaScript SDK and a Node.js backend.

### Prerequisites

- Node.js installed

### Setup

1. Clone this repository and install the dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your PayPal credentials:

   ```
   PAYPAL_CLIENT_ID=Your-Sandbox-Client-ID
   PAYPAL_CLIENT_SECRET=Your-Sandbox-Client-Secret
   ```

3. Replace `REPLACE_CLIENT_ID` in `public/index.html` with your actual PayPal client ID.

4. Start the server:

   ```bash
   npm start

   ```

  

### How it 

- The frontend loads the PayPal JS SDK script with your `client-id` and the `currency` parameter to specify the currency.
- When the buyer clicks the button, the `createOrder` callback uses `fetch` to call `/api/orders` on your Node server. This endpoint uses the PayPal server SDK to create an order with `intent: "CAPTURE"` and returns an order ID.
- After the buyer approves the payment, the `onApprove` callback calls `/api/orders/:orderID/capture` on the server to capture the order and complete the transaction.
  
- The backend uses your client credentials (from the `.env` file) to authenticate with PayPal.

For more information, refer to the [PayPal JavaScript SDK documentation](https://developer.paypal.com/sdk/js) and the [Standard Checkout integration guide](https://developer.paypal.com/docs/checkout/standard/integrate/).
