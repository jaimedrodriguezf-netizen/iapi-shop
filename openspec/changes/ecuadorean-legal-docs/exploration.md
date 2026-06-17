# Exploration: Ecuadorean Legal Compliance (T&C & Privacy Policy)

This exploration investigates the legal and structural requirements for drafting the Terms and Conditions (*Términos y Condiciones*) and Privacy Policy (*Política de Privacidad*) for **IAPI Shop** in compliance with Ecuadorean legislation, specifically:
1.  **LCE** (Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos)
2.  **LODC** (Ley Orgánica de Defensa del Consumidor)
3.  **LOPDP** (Ley Orgánica de Protección de Datos Personales)

---

## 1. Context & Platform Architecture

IAPI Shop operates under a specific structural model that shifts transactional responsibilities to merchants and peer-to-peer (P2P) interactions. 

### Key Constraints:
- **No Transactional Commissions**: The platform provides software-as-a-service (SaaS) features for catalog management and listing but does not charge transaction-based commissions.
- **P2P WhatsApp Checkout**: There is no cart checkout flow within the platform that handles payment or order fulfillment. The checkout button redirects the buyer to the merchant's WhatsApp number with a pre-filled text message of the order.
- **No Payment Processing**: The platform does not collect, process, or route payments. Payment terms are agreed upon directly between the buyer and the seller.
- **No Shipping/Logistics**: IAPI Shop does not manage, coordinate, or guarantee shipping or product delivery.
- **No Catalog/Product Validation**: Merchants are solely responsible for their catalogs. IAPI Shop does not inspect, validate, or guarantee the quality, safety, legality, or availability of the listed products.

---

## 2. Ecuadorean Legal Framework Analysis

### 2.1. LCE (Ley de Comercio Electrónico)
Under the LCE, IAPI Shop operates as an **Information Society Service Intermediary** (*intermediario de servicios de la sociedad de la información*).
- **Safe Harbor & Liability Limitation (Arts. 54 & 55)**: Intermediaries who act as hosts or transmission lines are not liable for the content uploaded by users, provided they do not initiate the transmission, select the receiver, or select/modify the transmitted data.
- **Electronic Consent (Art. 2)**: Consent expressed via electronic data messages (e.g., clicking "Acepto los Términos y Condiciones") is fully valid and binding. A "click-wrap" model is legally robust in Ecuador for store signup and platform usage.

### 2.2. LODC (Ley Orgánica de Defensa del Consumidor)
The LODC regulates the relationship between suppliers (*proveedores*) and consumers (*consumidores*).
- **Exclusion of Supplier Status**: IAPI Shop is NOT a supplier (*proveedor*) of the goods or services listed. The terms must clearly establish that the **Merchant** is the sole *proveedor* under LODC.
- **Supplier Responsibilities (Arts. 9, 11, & 45)**:
  - Truthful and clear product descriptions (Art. 9).
  - Product quality and warranty compliance (Art. 11).
  - The right of withdrawal (*derecho de devolución/retracto*) within 3 days of purchase (Art. 45).
  - *Mitigation*: The terms must make it explicitly clear that these duties belong strictly to the merchant, and consumers must direct all claims and exercises of rights directly to the merchant.

### 2.3. LOPDP (Ley Orgánica de Protección de Datos Personales)
The LOPDP governs personal data processing in Ecuador, enforcing strict rules on consent, rights, and security.
- **Data Controller Roles**:
  - **IAPI Shop**: Acts as the *Responsable del Tratamiento* (Data Controller) for the data of registered **Merchants/Users** (e.g., name, store slug, business email, store logo, analytics on dashboard).
  - **The Merchant**: Acts as the *Responsable del Tratamiento* for the data of **Buyers/Customers** collected during checkout.
- **WhatsApp Checkout Data Boundary**:
  - Since the buyer's order data is sent peer-to-peer over WhatsApp, IAPI Shop does not store, access, or process customer checkout data.
  - *Mitigation*: The Privacy Policy must clearly state that IAPI Shop does not collect or process buyer checkout information. Buyers interact directly with merchants, and the processing of their data is governed by the merchant's individual privacy policy.
- **ARCO Rights**: Registered users (Merchants) must have clear mechanisms to exercise their access, rectification, cancellation, and opposition rights.

---

## 3. Structural Draft Requirements

### 3.1. Terms & Conditions (Términos y Condiciones)
The T&C document should be structured with the following key sections:

1.  **Objeto del Servicio**: Definition of IAPI Shop as a technology platform for digital catalogs.
2.  **Declaración de Intermediación**: Explicit declaration that the platform is a neutral technological tool, does not charge commissions on sales, and does not intervene in transaction details.
3.  **Canal de Venta (WhatsApp)**: Explanation that ordering occurs P2P via WhatsApp, outside IAPI Shop's scope of control.
4.  **Exclusiones de Responsabilidad**:
    - No liability for payment processing.
    - No liability for delivery, shipping, or logistics.
    - No liability for catalog accuracy, product quality, safety, or legal compliance.
    - No liability for merchant-buyer disputes.
5.  **Obligaciones del Comerciante**: Requirement for merchants to comply with LODC, provide accurate pricing/descriptions, handle customer support, and respect refund policies.
6.  **Uso Aceptable y Suspensión de Cuenta**: Restrictions on illegal goods (drugs, weapons, copyrighted material) and rights to suspend accounts violating these policies.
7.  **Propiedad Intelectual**: Protection of the platform's brand, software, and codebase.
8.  **Ley Aplicable y Jurisdicción**: Governing laws of the Republic of Ecuador.

### 3.2. Privacy Policy (Política de Privacidad)
The Privacy Policy must contain:

1.  **Responsable del Tratamiento**: Identification of IAPI Shop (operator/legal representative name, contact email).
2.  **Datos Recopilados**:
    - For Merchants: Account setup details (email, passwords, store details).
    - For Visitors: Basic usage cookies, IP addresses (if logged for system security).
3.  **Finalidades del Tratamiento**: Account management, performance analytics, platform security, and communications.
4.  **Límite en la Recopilación (No Tratamiento de Datos del Comprador)**: Explicit disclaimer that IAPI Shop does not collect, record, or store buyers' names, addresses, or payment details transmitted over WhatsApp.
5.  **Legitimación**: Processing based on consent (signup) and contract execution (providing the dashboard service).
6.  **Derechos del Titular (ARCO)**: Procedure for users to exercise access, rectification, deletion, and opposition (via support email).
7.  **Conservación de Datos**: Storage duration (generally as long as the account remains active, or as required by Ecuadorean tax/commercial laws).

---

## 4. Codebase Analysis & Integration Points

A search in the codebase reveals that **no legal documents or routes currently exist**. 

### Codebase Integration Analysis
To introduce these legal pages, we compare three architectural options:

| Option | Pros | Cons | Complexity |
| :--- | :--- | :--- | :--- |
| **Option A: Static Page Routes**<br>`src/app/terminos/page.tsx`<br>`src/app/privacidad/page.tsx` | - Highly performant<br>- Great for SEO<br>- Simple implementation in Next.js 16 | - Text edits require a codebase commit and deploy. | Low |
| **Option B: Grouped Legal Layout**<br>`src/app/legal/[slug]/page.tsx` | - Clean folder structure (`/legal/terminos`, `/legal/privacidad`) <br>- Shared wrapper styling and layout. | - Dynamic route matching boilerplate needed. | Low-Medium |
| **Option C: DB-Backed Content**<br>Fetch text dynamically from Supabase `site_settings`. | - Dynamic content edits directly via a CMS/Admin dashboard. | - Overkill for static legal documents.<br>- Extra database reads on page load. | Medium-High |

### Recommendation:
**Option B (Grouped Legal Layout)** is the cleanest way to maintain structure while keeping implementation simple and keeping routes separate from core business routes.

---

## 5. UI/UX Touchpoints

To ensure transparency and compliance, links and consent mechanisms must be placed in:
1.  **Global Footer**: In `src/components/landing/marketplace-page.tsx` and public tenant pages (e.g. inside `src/app/[slug]/page.tsx`), adding links to `/legal/terminos` and `/legal/privacidad`.
2.  **Merchant Registration/Onboarding**: At `src/app/register/page.tsx` and `src/app/onboarding/page.tsx`, a checkbox stating: *"Acepto los Términos y Condiciones y la Política de Privacidad de IAPI Shop under Ecuadorean regulations (LCE, LODC, LOPDP)."*

---

## 6. Risks & Mitigation Strategies

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Consumer confusion regarding checkout** | High | Place clear warning badges near checkout buttons in tenant catalogs stating that the order will be sent to WhatsApp and payment is agreed P2P. |
| **Data leakage or non-compliance under LOPDP** | Medium | Limit data transmission elements; ensure the platform stores minimal merchant data and does not store buyer data at all. |
| **Illegal/banned catalogs (e.g. contraband, weapons)** | High | Establish a reporting mechanism (*Denunciar tienda*) to support LCE notice-and-take-down safe harbor. |
