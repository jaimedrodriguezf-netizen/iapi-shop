/** Maximum length for a product name in the WhatsApp message before truncation */
const MAX_NAME_LENGTH = 120;

interface CartMessageItem {
  name: string
  quantity: number
  price: number
}

/**
 * Format cart items into a WhatsApp-friendly order message.
 *
 * Produces a markdown-style message with:
 * - Tenant name header
 * - Optional order reference
 * - Itemized list (name × qty = subtotal)
 * - Grand total
 *
 * Product names longer than 120 characters are truncated.
 */
export function formatCartMessage(
  tenantName: string,
  items: CartMessageItem[],
  options?: { orderRef?: string }
): string {
  const lines: string[] = []

  lines.push(`*Nuevo Pedido - ${tenantName}*`)

  if (options?.orderRef) {
    lines.push(`_Orden #${options.orderRef}_`)
  }

  lines.push('')

  for (const item of items) {
    const displayName =
      item.name.length > MAX_NAME_LENGTH
        ? item.name.slice(0, MAX_NAME_LENGTH) + '…'
        : item.name
    const subtotal = item.price * item.quantity
    lines.push(`• ${item.quantity}x ${displayName} - $${subtotal.toFixed(2)}`)
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  lines.push('')
  lines.push(`*Total: $${total.toFixed(2)}*`)
  lines.push('')
  lines.push('Muchas gracias!')

  return lines.join('\n')
}

/**
 * Build a WhatsApp click-to-chat URL from a formatted cart message.
 *
 * @param phone  - The merchant's WhatsApp phone number (e.g. "+593987654321")
 * @param message - The pre-formatted message to send
 * @returns A `https://wa.me/` URL with encoded phone and message
 * @throws Error if phone is empty or undefined
 */
export function buildWhatsAppCartUrl(phone: string, message: string): string {
  if (!phone || phone.trim() === '') {
    throw new Error('Phone number is required to generate a WhatsApp URL.')
  }

  const cleanPhone = phone.replace(/[\s\-+]/g, '')
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Build a WhatsApp click-to-chat URL with a pre-filled message.
 *
 * @param phone - The merchant's WhatsApp phone number (e.g. "+593987654321")
 * @param productName - The product name to include in the message
 * @returns A `https://wa.me/` URL with encoded phone and message
 * @throws Error if phone is empty or undefined
 *
 * @example
 * buildWhatsAppUrl("+593987654321", "Paracetamol 500mg")
 * // => "https://wa.me/593987654321?text=Hola%2C%20me%20interesa%3A%20Paracetamol%20500mg"
 */
export function buildWhatsAppUrl(
  phone: string,
  productName: string
): string {
  if (!phone || phone.trim() === '') {
    throw new Error('Phone number is required to generate a WhatsApp URL.');
  }

  // Strip the leading "+" and any spaces/dashes from the phone number
  const cleanPhone = phone.replace(/[\s\-+]/g, '');

  const message = `Hola, me interesa: ${productName}`;
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}