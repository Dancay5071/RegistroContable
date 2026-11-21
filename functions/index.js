const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

admin.initializeApp();

const getMercadoPagoClient = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
  return new MercadoPagoConfig({ accessToken });
};

exports.createCheckoutSession = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { userId, userEmail, planType } = req.body;

      if (!userId || !userEmail) {
        return res.status(400).json({ error: "Faltan parámetros requeridos (userId, userEmail)" });
      }

      const client = getMercadoPagoClient();
      const preference = new Preference(client);

      const isAnnual = planType === "annual";
      const title = isAnnual 
        ? "FinTrack Pro - Suscripción Anual (12 Meses)" 
        : "FinTrack Pro - Suscripción Mensual";
      const unitPrice = isAnnual ? 32000 : 3900;
      const appUrl = process.env.APP_URL || "https://fintrack-finanzas.web.app";

      const preferenceData = {
        items: [
          {
            id: isAnnual ? "fintrack_pro_annual" : "fintrack_pro_monthly",
            title,
            description: "Acceso total e ilimitado a FinTrack Gestión Financiera Pro",
            quantity: 1,
            currency_id: "ARS",
            unit_price: unitPrice
          }
        ],
        payer: {
          email: userEmail
        },
        external_reference: userId,
        metadata: {
          userId,
          userEmail,
          planType: isAnnual ? "annual" : "monthly"
        },
        back_urls: {
          success: `${appUrl}/?payment=success&plan=${isAnnual ? "annual" : "monthly"}`,
          failure: `${appUrl}/?payment=failure`,
          pending: `${appUrl}/?payment=pending`
        },
        auto_return: "approved",
        statement_descriptor: "FINTRACK PRO"
      };

      const response = await preference.create({ body: preferenceData });

      return res.status(200).json({
        success: true,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
        preferenceId: response.id
      });
    } catch (error) {
      console.error("Error al crear sesión de Mercado Pago:", error);
      return res.status(500).json({
        error: "Error interno al crear checkout",
        details: error.message
      });
    }
  });
});

exports.mercadopagoWebhook = onRequest({ region: "us-central1" }, async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const topic = req.query.topic || req.query.type || req.body?.type || req.body?.topic;
    const paymentId = req.query.id || req.query["data.id"] || req.body?.data?.id;

    if (topic === "payment" && paymentId) {
      const client = getMercadoPagoClient();
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData && paymentData.status === "approved") {
        const userId = paymentData.external_reference || paymentData.metadata?.user_id;
        const planType = paymentData.metadata?.plan_type || "monthly";

        if (userId) {
          const isAnnual = planType === "annual";
          const daysToAdd = isAnnual ? 365 : 30;
          const now = new Date();
          const nextBilling = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

          const db = admin.firestore();
          const subDocRef = db.doc(`users/${userId}/config/subscription`);
          const auditRef = db.collection(`users/${userId}/auditLog`);

          await subDocRef.set({
            status: "active",
            plan: isAnnual ? "pro_annual" : "pro_monthly",
            gateway: "mercadopago",
            paymentId: String(paymentId),
            lastPaymentDate: now.toISOString(),
            nextBillingDate: nextBilling.toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          await auditRef.add({
            action: "SUSCRIPCION_ACTIVADA",
            category: "PAGOS",
            details: `Suscripción Pro activada vía Mercado Pago (${isAnnual ? "Plan Anual" : "Plan Mensual"})`,
            monto: paymentData.transaction_amount || 0,
            moneda: "ARS",
            paymentId: String(paymentId),
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error al procesar webhook de Mercado Pago:", error);
    return res.status(200).send("OK");
  }
});

exports.cancelSubscription = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Falta parámetro userId" });
      }

      const db = admin.firestore();
      const subDocRef = db.doc(`users/${userId}/config/subscription`);
      const auditRef = db.collection(`users/${userId}/auditLog`);

      await subDocRef.set({
        autoRenew: false,
        cancelAtPeriodEnd: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await auditRef.add({
        action: "CANCELAR_RENOVACION",
        category: "PAGOS",
        details: "El usuario solicitó la no renovación de su suscripción Pro",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        message: "Renovación automática cancelada. Tu acceso Pro continuará hasta el fin de tu ciclo."
      });
    } catch (error) {
      console.error("Error al cancelar renovación:", error);
      return res.status(500).json({ error: "Error interno al cancelar", details: error.message });
    }
  });
});
