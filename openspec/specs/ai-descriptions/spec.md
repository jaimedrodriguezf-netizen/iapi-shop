# AI Product Descriptions Specification

## Purpose

OpenAI integration for generating marketing-oriented product descriptions based on product name and optional category context.

## Requirements

### Requirement: Generate product description from name and category

The system SHALL provide a server action that calls OpenAI to generate a short, marketing-focused product description in Spanish. The description MUST NOT contain hashtags and MUST sound natural for Ecuadorian audience.

| Field | Constraint |
|-------|-----------|
| Model | gpt-4o-mini |
| Max tokens | 150 |
| Temperature | 0.7 |
| Prompt language | Spanish (Ecuadorian natural tone) |
| Description length | Maximum 2 sentences |

#### Scenario: Description generated from name and category

- GIVEN product name "Hamburguesa" and category "Comida"
- WHEN `generateProductDescription("Hamburguesa", "Comida")` is called
- THEN a marketing description in Spanish is returned
- AND the description does not include the product name in the text
- AND no hashtags are present.

#### Scenario: Description generated from name only (no category)

- GIVEN product name "Café Molido" and no category
- WHEN `generateProductDescription("Café Molido")` is called
- THEN a description is still generated without category context.

### Requirement: Input validation

The system MUST reject product names shorter than 2 characters.

#### Scenario: Name too short rejected

- GIVEN a product name of "" or "A"
- WHEN `generateProductDescription` is called
- THEN `{ success: false, error: "El nombre del producto es demasiado corto." }` is returned.

### Requirement: Error handling for API failures

The system SHALL return a structured error when the OpenAI API call fails or returns no content.

#### Scenario: API returns empty response

- GIVEN OpenAI returns choices with no message content
- WHEN `generateProductDescription` is called
- THEN `{ success: false, error: "No se pudo generar la descripción." }` is returned.

#### Scenario: Network or API error

- GIVEN the OpenAI API call throws an exception
- WHEN `generateProductDescription` is called
- THEN `{ success: false, error: "Error al conectar con la IA." }` is returned
- AND the error is logged server-side.
