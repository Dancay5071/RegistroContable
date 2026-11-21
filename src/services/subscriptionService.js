export async function createSubscriptionCheckout({ userId, userEmail, planType = "annual" }) {
  if (!userId) {
    throw new Error("Se requiere identificación de usuario");
  }

  const cloudFunctionUrl = import.meta.env.VITE_CHECKOUT_FUNCTION_URL 
    || "https://us-central1-registrocontable32.cloudfunctions.net/createCheckoutSession";

  try {
    const response = await fetch(cloudFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        userEmail: userEmail || "usuario@fintrack.app",
        planType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en el servidor de pagos (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al generar checkout de suscripción:", error);
    throw error;
  }
}
