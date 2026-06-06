# WhatsApp Integration Specification

## Purpose

Enable end-customers to initiate a WhatsApp conversation with the merchant directly from the public storefront, pre-filling the message with the selected product name.

## Requirements

### Requirement: WhatsApp Message Generator

The system MUST generate a pre-filled WhatsApp message URL for each product, including the product name in the message body.

#### Scenario: Generate WhatsApp link for a product

- GIVEN a product named "Paracetamol 500mg" and the tenant's WhatsApp number `+593987654321`
- WHEN the WhatsApp link is generated for that product
- THEN the URL MUST encode the phone number and a pre-filled message
- AND the pre-filled message SHALL include "Hola, me interesa: Paracetamol 500mg"

#### Scenario: Tenant has no WhatsApp number

- GIVEN a tenant has no WhatsApp phone number configured
- WHEN the product card renders
- THEN the WhatsApp action button SHALL be hidden or disabled
- AND no broken link must be generated

#### Scenario: Special characters in product name

- GIVEN a product named "Café & Té orgánico"
- WHEN the WhatsApp message is generated
- THEN special characters MUST be URL-encoded correctly
- AND the decoded message in WhatsApp SHALL read the original product name

### Requirement: Storefront WhatsApp CTA

The system SHALL provide a "Order via WhatsApp" call-to-action on each product card in the public storefront.

#### Scenario: Tap WhatsApp button opens chat

- GIVEN a customer is viewing the storefront on a mobile device with WhatsApp installed
- WHEN they tap the WhatsApp button on a product card
- THEN WhatsApp SHALL open with the pre-filled message
- AND the user SHALL remain on the storefront page (new tab on desktop, app switch on mobile)

#### Scenario: Desktop fallback

- GIVEN a customer is on a desktop without WhatsApp Desktop installed
- WHEN they click the WhatsApp button
- THEN WhatsApp Web SHALL open in a new tab with the pre-filled message
