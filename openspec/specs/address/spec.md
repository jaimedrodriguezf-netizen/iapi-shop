# Address Locations Specification

## Purpose

To establish a structured, error-free address location selector (Country -> Province -> Canton) in the merchant dashboard settings specifically optimized for Ecuador, replacing the plain text inputs with dynamic dropdown selects, while maintaining text input fallbacks for other countries.

## Requirements

### Requirement: Database Location Schema

The database MUST provide read-only lookup tables for countries, provinces, and cantons to support hierarchical geographical selections.
- The `countries` table SHALL contain a unique ISO code, UUID identifier, and name.
- The `provinces` table SHALL reference a parent country via a foreign key relationship.
- The `cantons` table SHALL reference a parent province via a foreign key relationship.
- Read access to these tables MUST be protected by public Row Level Security (RLS) policies allowing read-only access to all users, but preventing insert, update, or delete operations from unauthorized sessions.
- The database tables MUST be seeded with Ecuador (EC), Colombia (CO), and Peru (PE) for countries, and Ecuador's corresponding provinces and cantons.

#### Scenario: Read-only query for countries

- GIVEN a database client
- WHEN a user queries the `countries` table
- THEN the system MUST return the seeded list of countries including Ecuador, Colombia, and Peru
- AND the system SHALL NOT allow insert, update, or delete operations on the `countries` table.

#### Scenario: Cascading queries for provinces and cantons

- GIVEN the geographic tables have been seeded with Ecuador sub-regions
- WHEN a user queries provinces by the country ID of Ecuador
- THEN the system MUST return all corresponding provinces of Ecuador
- AND WHEN a user queries cantons by a selected province ID
- THEN the system MUST return all corresponding cantons of that province.


### Requirement: Dynamic Address Selector for Ecuador

When the selected country is Ecuador, the dashboard settings form MUST render dynamic dropdown selectors (`<Select>`) for both Province and Canton.
- The Province select options SHALL be populated dynamically from the database using the selected country ID.
- The Canton select options SHALL be populated dynamically from the database using the selected province ID.
- The state/province and city/canton inputs MUST change state to reflect the selection, and the selections SHALL cascade (changing the country resets the province and canton; changing the province resets the canton).

#### Scenario: Country is selected as Ecuador

- GIVEN the dashboard settings form is open with a default blank address
- WHEN the user selects "Ecuador" as the country
- THEN the Province input MUST render as a dropdown menu (`<Select>`)
- AND the Canton input MUST render as a dropdown menu (`<Select>`)
- AND the Province selector SHALL dynamically load and display only provinces belonging to Ecuador.

#### Scenario: Province selection triggers canton dropdown loading

- GIVEN the country is selected as "Ecuador"
- WHEN the user selects a province from the Province dropdown
- THEN the Canton selector MUST dynamically load and display only cantons belonging to the selected province.

#### Scenario: Changing country resets cascading selectors

- GIVEN the country is "Ecuador", a province is selected, and a canton is selected
- WHEN the user changes the country to "Colombia"
- THEN the Province selection MUST be reset to empty
- AND the Canton selection MUST be reset to empty.


### Requirement: Fallback Address Inputs

For countries other than Ecuador, the dashboard settings form MUST display the Province and Canton inputs as plain text fields.
- The values entered in these text fields SHALL be captured and stored as the tenant's address state.
- The form MUST transition between select dropdowns and text inputs smoothly depending on the country selection.

#### Scenario: Country is selected as a non-Ecuador country

- GIVEN the dashboard settings form is open
- WHEN the user selects a country that is not "Ecuador" (e.g. "Colombia" or "Peru")
- THEN the Province input MUST render as a plain text field
- AND the Canton input MUST render as a plain text field
- AND the user SHALL be able to type custom text values for province and canton.

#### Scenario: Form transition from select to text fallback clears or updates values

- GIVEN the country is "Ecuador" with a selected province and canton
- WHEN the user changes the country selector from "Ecuador" to "Peru"
- THEN the Province and Canton inputs MUST transition to text fields
- AND the values in these text inputs SHALL be initialized as empty strings.


### Requirement: Formatted Storefront Address

The storefront footer MUST format and display the tenant's address by concatenating street, canton, province, and country with comma separators.
- The format SHALL be: `[Street], [Canton], [Province], [Country]`.
- Empty or null fields MUST be omitted without displaying duplicate or trailing/leading comma delimiters.

#### Scenario: Displaying fully populated address in footer

- GIVEN a tenant with street "Av. Amazonas 123", canton "Quito", province "Pichincha", and country "Ecuador"
- WHEN a visitor views the storefront footer
- THEN the address text MUST display exactly as "Av. Amazonas 123, Quito, Pichincha, Ecuador".

#### Scenario: Omit missing address parts gracefully

- GIVEN a tenant with street "Calle Principal", canton "Quito", and country "Ecuador" but no province configured
- WHEN a visitor views the storefront footer
- THEN the address text MUST display exactly as "Calle Principal, Quito, Ecuador" without consecutive commas.
