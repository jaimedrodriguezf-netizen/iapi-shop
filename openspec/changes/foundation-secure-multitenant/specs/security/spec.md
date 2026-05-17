# Security Delta Spec

## Requirements

### Requirement: Anonymous access boundary
Anonymous visitors MUST only access public marketing routes and MUST NOT read product, tenant, order, customer, inventory, AI usage, or subscription data from the database.

#### Scenario: Anonymous visitor opens landing
Given an anonymous visitor
When they open `/`
Then they see static marketing content
And no product database query is required.

#### Scenario: Anonymous visitor opens product data route
Given an anonymous visitor
When they open `/marketplace`, `/tienda/{slug}`, `/producto/{slug}`, `/dashboard`, or `/admin`
Then the app requires authentication before any protected database read.

### Requirement: Tenant role permissions
Registered users MUST access tenant data according to their tenant membership role.

#### Scenario: Owner manages billing
Given a registered tenant member with role `owner`
When they request `billing.manage`
Then permission is granted.

#### Scenario: Non-owner billing denial
Given a registered tenant member with role `admin`, `sales`, `inventory`, or `viewer`
When they request `billing.manage`
Then permission is denied.

#### Scenario: Inventory manages AI product images
Given a registered tenant member with role `inventory`
When they request product media or AI image permissions
Then permission is granted
And order mutation permission is denied.
