export const fetchShopifyProducts = async () => {
  const storeUrl = import.meta.env.VITE_SHOPIFY_STORE_URL;
  const accessToken = import.meta.env.VITE_SHOPIFY_API_KEY;

  try {
    const response = await fetch(`https://${storeUrl}/admin/api/2024-01/products.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error("Shopify fetch error:", error);
    throw error;
  }
};

export const fetchShopifyOrders = async () => {
  const storeUrl = import.meta.env.VITE_SHOPIFY_STORE_URL;
  const accessToken = import.meta.env.VITE_SHOPIFY_API_KEY;

  try {
    const response = await fetch(`https://${storeUrl}/admin/api/2024-01/orders.json?status=any`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error("Shopify fetch error:", error);
    throw error;
  }
};
