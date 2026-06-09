-- SQL Script to Populate Temu-style 3-Level Categories for all Active Tenants
-- You can run this in your Supabase SQL Editor.

WITH inserted_l1 AS (
  INSERT INTO public.categories (tenant_id, name, slug)
  SELECT t.id, cat.name, cat.slug
  FROM public.tenants t
  CROSS JOIN (
    VALUES
      ('Moda de Mujer', 'moda-de-mujer'),
      ('Moda de Hombre', 'moda-de-hombre'),
      ('Calzado', 'calzado'),
      ('Joyería y Relojes', 'joyeria-y-relojes'),
      ('Bolsos y Equipaje', 'bolsos-y-equipaje'),
      ('Hogar y Cocina', 'hogar-y-cocina'),
      ('Electrónica y Tecnología', 'electronica-y-tecnologia'),
      ('Electrodomésticos', 'electrodomesticos'),
      ('Belleza y Salud', 'belleza-y-salud'),
      ('Juguetes y Juegos', 'juguetes-y-juegos'),
      ('Deportes y Aire Libre', 'deportes-y-aire-libre'),
      ('Mascotas', 'mascotas'),
      ('Bebé y Maternidad', 'bebe-y-maternidad'),
      ('Herramientas y Bricolaje', 'herramientas-y-bricolaje'),
      ('Automotriz', 'automotriz'),
      ('Oficina y Papelería', 'oficina-y-papeleria'),
      ('Arte, Manualidades y Costura', 'arte-manualidades-y-costura')
  ) AS cat(name, slug)
  WHERE t.status = 'active'
  ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id, tenant_id, slug
),
inserted_l2 AS (
  INSERT INTO public.categories (tenant_id, name, slug, parent_id)
  SELECT l1.tenant_id, cat.name, cat.slug, l1.id
  FROM inserted_l1 l1
  CROSS JOIN (
    VALUES
      -- Under 'moda-de-mujer'
      ('Ropa de Mujer', 'ropa-de-mujer', 'moda-de-mujer'),
      ('Lencería y Ropa de Dormir', 'lenceria-y-ropa-de-dormir-mujer', 'moda-de-mujer'),
      ('Accesorios de Mujer', 'accesorios-de-mujer', 'moda-de-mujer'),

      -- Under 'moda-de-hombre'
      ('Ropa de Hombre', 'ropa-de-hombre', 'moda-de-hombre'),
      ('Ropa Interior y de Dormir', 'ropa-interior-y-de-dormir-hombre', 'moda-de-hombre'),
      ('Accesorios de Hombre', 'accesorios-de-hombre', 'moda-de-hombre'),

      -- Under 'calzado'
      ('Calzado de Mujer', 'calzado-de-mujer', 'calzado'),
      ('Calzado de Hombre', 'calzado-de-hombre', 'calzado'),
      ('Calzado Infantil', 'calzado-infantil', 'calzado'),

      -- Under 'joyeria-y-relojes'
      ('Joyería', 'joyeria-fina', 'joyeria-y-relojes'),
      ('Relojes de Pulsera', 'relojes-de-pulsera', 'joyeria-y-relojes'),

      -- Under 'bolsos-y-equipaje'
      ('Bolsos de Mujer', 'bolsos-de-mujer', 'bolsos-y-equipaje'),
      ('Mochilas y Maletines', 'mochilas-y-maletines', 'bolsos-y-equipaje'),
      ('Maletas y Equipaje', 'maletas-y-equipaje', 'bolsos-y-equipaje'),

      -- Under 'hogar-y-cocina'
      ('Cocina y Comedor', 'cocina-y-comedor', 'hogar-y-cocina'),
      ('Decoración del Hogar', 'decoracion-del-hogar', 'hogar-y-cocina'),
      ('Textiles del Hogar', 'textiles-del-hogar', 'hogar-y-cocina'),
      ('Organización y Almacenamiento', 'organizacion-y-almacenamiento', 'hogar-y-cocina'),

      -- Under 'electronica-y-tecnologia'
      ('Teléfonos y Accesorios', 'telefonos-y-accesorios', 'electronica-y-tecnologia'),
      ('Accesorios de Computadora', 'accesorios-de-computadora', 'electronica-y-tecnologia'),
      ('Dispositivos de Audio', 'dispositivos-de-audio', 'electronica-y-tecnologia'),
      ('Relojes Inteligentes', 'relojes-inteligentes', 'electronica-y-tecnologia'),

      -- Under 'electrodomesticos'
      ('Electrodomésticos de Cocina', 'electrodomesticos-de-cocina', 'electrodomesticos'),
      ('Cuidado del Hogar', 'cuidado-del-hogar', 'electrodomesticos'),

      -- Under 'belleza-y-salud'
      ('Maquillaje', 'maquillaje', 'belleza-y-salud'),
      ('Cuidado de la Piel', 'cuidado-de-la-piel', 'belleza-y-salud'),
      ('Accesorios de Belleza', 'accesorios-de-belleza', 'belleza-y-salud'),
      ('Cuidado del Cabello', 'cuidado-del-cabello', 'belleza-y-salud'),

      -- Under 'juguetes-y-juegos'
      ('Juegos de Construcción', 'juegos-de-construccion', 'juguetes-y-juegos'),
      ('Muñecas y Peluches', 'munecas-y-peluches', 'juguetes-y-juegos'),
      ('Rompecabezas y Juegos de Mesa', 'rompecabezas-y-juegos-de-mesa', 'juguetes-y-juegos'),

      -- Under 'deportes-y-aire-libre'
      ('Fitness y Ejercicio', 'fitness-y-ejercicio', 'deportes-y-aire-libre'),
      ('Ciclismo', 'ciclismo', 'deportes-y-aire-libre'),
      ('Camping y Senderismo', 'camping-y-senderismo', 'deportes-y-aire-libre'),

      -- Under 'mascotas'
      ('Artículos para Perros', 'articulos-para-perros', 'mascotas'),
      ('Artículos para Gatos', 'articulos-para-gatos', 'mascotas'),

      -- Under 'bebe-y-maternidad'
      ('Ropa de Bebé', 'ropa-de-bebe', 'bebe-y-maternidad'),
      ('Accesorios y Cuidado', 'accesorios-y-cuidado-bebe', 'bebe-y-maternidad'),

      -- Under 'herramientas-y-bricolaje'
      ('Herramientas de Mano', 'herramientas-de-mano', 'herramientas-y-bricolaje'),
      ('Ferretería y Accesorios', 'ferreteria-y-accesorios', 'herramientas-y-bricolaje'),

      -- Under 'automotriz'
      ('Accesorios de Interior', 'accesorios-de-interior-auto', 'automotriz'),
      ('Accesorios de Exterior', 'accesorios-de-exterior-auto', 'automotriz'),

      -- Under 'oficina-y-papeleria'
      ('Útiles de Escritorio', 'utiles-de-escritorio', 'oficina-y-papeleria'),
      ('Organización de Oficina', 'organizacion-de-oficina', 'oficina-y-papeleria'),

      -- Under 'arte-manualidades-y-costura'
      ('Costura y Tejido', 'costura-y-tejido', 'arte-manualidades-y-costura'),
      ('Pintura y Dibujo', 'pintura-y-dibujo', 'arte-manualidades-y-costura')
  ) AS cat(name, slug, parent_slug)
  WHERE l1.slug = cat.parent_slug
  ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
  RETURNING id, tenant_id, slug
)
INSERT INTO public.categories (tenant_id, name, slug, parent_id)
SELECT l2.tenant_id, cat.name, cat.slug, l2.id
FROM inserted_l2 l2
CROSS JOIN (
  VALUES
    -- Under 'ropa-de-mujer'
    ('Vestidos', 'vestidos', 'ropa-de-mujer'),
    ('Blusas y Tops', 'blusas-y-tops', 'ropa-de-mujer'),
    ('Pantalones y Jeans', 'pantalones-y-jeans-mujer', 'ropa-de-mujer'),
    ('Chaquetas y Abrigos', 'chaquetas-y-abrigos-mujer', 'ropa-de-mujer'),

    -- Under 'lenceria-y-ropa-de-dormir-mujer'
    ('Conjuntos de Lencería', 'conjuntos-de-lenceria', 'lenceria-y-ropa-de-dormir-mujer'),
    ('Pijamas y Batas', 'pijamas-y-batas-mujer', 'lenceria-y-ropa-de-dormir-mujer'),
    ('Sujetadores y Calzones', 'sujetadores-y-calzones', 'lenceria-y-ropa-de-dormir-mujer'),

    -- Under 'accesorios-de-mujer'
    ('Gafas de Sol', 'gafas-de-sol-mujer', 'accesorios-de-mujer'),
    ('Sombreros y Gorras', 'sombreros-y-gorras-mujer', 'accesorios-de-mujer'),
    ('Cinturones', 'cinturones-mujer', 'accesorios-de-mujer'),

    -- Under 'ropa-de-hombre'
    ('Camisetas y Polos', 'camisetas-y-polos-hombre', 'ropa-de-hombre'),
    ('Camisas de Vestir', 'camisas-de-vestir-hombre', 'ropa-de-hombre'),
    ('Pantalones y Jeans', 'pantalones-y-jeans-hombre', 'ropa-de-hombre'),
    ('Chaquetas y Sudaderas', 'chaquetas-y-sudaderas-hombre', 'ropa-de-hombre'),

    -- Under 'ropa-interior-y-de-dormir-hombre'
    ('Boxers y Briefs', 'boxers-y-briefs-hombre', 'ropa-interior-y-de-dormir-hombre'),
    ('Calcetines y Calcetines Cortos', 'calcetines-y-calcetines-cortos-hombre', 'ropa-interior-y-de-dormir-hombre'),
    ('Pijamas', 'pijamas-hombre', 'ropa-interior-y-de-dormir-hombre'),

    -- Under 'accesorios-de-hombre'
    ('Cinturones', 'cinturones-hombre', 'accesorios-de-hombre'),
    ('Gafas de Sol', 'gafas-de-sol-hombre', 'accesorios-de-hombre'),
    ('Gorras', 'gorras-hombre', 'accesorios-de-hombre'),

    -- Under 'calzado-de-mujer'
    ('Zapatillas Deportivas', 'zapatillas-deportivas-mujer', 'calzado-de-mujer'),
    ('Zapatos de Tacón', 'zapatos-de-tacon', 'calzado-de-mujer'),
    ('Sandalias', 'sandalias-mujer', 'calzado-de-mujer'),
    ('Botas y Botines', 'botas-y-botines-mujer', 'calzado-de-mujer'),

    -- Under 'calzado-de-hombre'
    ('Zapatillas Deportivas', 'zapatillas-deportivas-hombre', 'calzado-de-hombre'),
    ('Zapatos de Vestir', 'zapatos-de-vestir-hombre', 'calzado-de-hombre'),
    ('Botas', 'botas-hombre', 'calzado-de-hombre'),
    ('Sandalias y Chanclas', 'sandalias-y-chanclas-hombre', 'calzado-de-hombre'),

    -- Under 'calzado-infantil'
    ('Zapatos para Bebé', 'zapatos-para-bebe', 'calzado-infantil'),
    ('Zapatillas para Niños', 'zapatillas-para-ninos', 'calzado-infantil'),
    ('Zapatillas para Niñas', 'zapatillas-para-ninas', 'calzado-infantil'),

    -- Under 'joyeria-fina'
    ('Collares y Pendientes', 'collares-y-pendientes', 'joyeria-fina'),
    ('Anillos', 'anillos', 'joyeria-fina'),
    ('Pulseras', 'pulseras', 'joyeria-fina'),
    ('Aretes', 'aretes', 'joyeria-fina'),

    -- Under 'relojes-de-pulsera'
    ('Relojes Analógicos', 'relojes-analogicos', 'relojes-de-pulsera'),
    ('Relojes Digitales', 'relojes-digitales', 'relojes-de-pulsera'),
    ('Relojes Deportivos', 'relojes-deportivos', 'relojes-de-pulsera'),

    -- Under 'bolsos-de-mujer'
    ('Bolsos de Hombro', 'bolsos-de-hombro', 'bolsos-de-mujer'),
    ('Bolsos Cruzados', 'bolsos-cruzados', 'bolsos-de-mujer'),
    ('Carteras y Monederos', 'carteras-y-monederos-mujer', 'bolsos-de-mujer'),

    -- Under 'mochilas-y-maletines'
    ('Mochilas para Laptop', 'mochilas-para-laptop', 'mochilas-y-maletines'),
    ('Maletines de Trabajo', 'maletines-de-trabajo', 'mochilas-y-maletines'),
    ('Mochilas Escolares', 'mochilas-escolares', 'mochilas-y-maletines'),

    -- Under 'maletas-y-equipaje'
    ('Maletas de Cabina', 'maletas-de-cabina', 'maletas-y-equipaje'),
    ('Bolsos de Viaje', 'bolsos-de-viaje', 'maletas-y-equipaje'),
    ('Organizadores de Viaje', 'organizadores-de-viaje', 'maletas-y-equipaje'),

    -- Under 'cocina-y-comedor'
    ('Utensilios de Cocina', 'utensilios-de-cocina', 'cocina-y-comedor'),
    ('Sartenes y Ollas', 'sartenes-y-ollas', 'cocina-y-comedor'),
    ('Vajilla y Cubertería', 'vajilla-y-cuberteria', 'cocina-y-comedor'),
    ('Almacenamiento de Alimentos', 'almacenamiento-de-alimentos', 'cocina-y-comedor'),

    -- Under 'decoracion-del-hogar'
    ('Alfombras y Tapetes', 'alfombras-y-tapetes', 'decoracion-del-hogar'),
    ('Cuadros y Arte de Pared', 'cuadros-y-arte-de-pared', 'decoracion-del-hogar'),
    ('Velas y Difusores', 'velas-y-difusores', 'decoracion-del-hogar'),
    ('Espejos Decorativos', 'espejos-decorativos', 'decoracion-del-hogar'),

    -- Under 'textiles-del-hogar'
    ('Sábanas y Fundas', 'sabanas-y-fundas', 'textiles-del-hogar'),
    ('Edredones y Mantas', 'edredones-y-mantas', 'textiles-del-hogar'),
    ('Almohadas y Cojines', 'almohadas-y-cojines', 'textiles-del-hogar'),
    ('Cortinas', 'cortinas', 'textiles-del-hogar'),

    -- Under 'organizacion-y-almacenamiento'
    ('Cajas Organizadoras', 'cajas-organizadoras', 'organizacion-y-almacenamiento'),
    ('Zapateras', 'zapateras', 'organizacion-y-almacenamiento'),
    ('Percheros y Ganchos', 'percheros-y-ganchos', 'organizacion-y-almacenamiento'),

    -- Under 'telefonos-y-accesorios'
    ('Fundas para Teléfono', 'fundas-para-telefono', 'telefonos-y-accesorios'),
    ('Cables y Cargadores', 'cables-y-cargadores', 'telefonos-y-accesorios'),
    ('Soportes para Teléfono', 'soportes-para-telefono', 'telefonos-y-accesorios'),
    ('Baterías Portátiles', 'baterias-portatiles', 'telefonos-y-accesorios'),

    -- Under 'accesorios-de-computadora'
    ('Mouses y Teclados', 'mouses-y-teclados', 'accesorios-de-computadora'),
    ('Memorias USB y Discos', 'memorias-usb-y-discos', 'accesorios-de-computadora'),
    ('Soportes para Laptop', 'soportes-para-laptop', 'accesorios-de-computadora'),

    -- Under 'dispositivos-de-audio'
    ('Auriculares Inalámbricos', 'auriculares-inalambricos', 'dispositivos-de-audio'),
    ('Altavoces Bluetooth', 'altavoces-bluetooth', 'dispositivos-de-audio'),
    ('Micrófonos', 'microfonos', 'dispositivos-de-audio'),

    -- Under 'relojes-inteligentes'
    ('Smartwatches', 'smartwatches-l3', 'relojes-inteligentes'),
    ('Correas de Reloj', 'correas-de-reloj', 'relojes-inteligentes'),

    -- Under 'electrodomesticos-de-cocina'
    ('Licuadoras y Batidoras', 'licuadoras-y-batidoras', 'electrodomesticos-de-cocina'),
    ('Freidoras de Aire', 'freidoras-de-aire', 'electrodomesticos-de-cocina'),
    ('Cafeteras', 'cafeteras', 'electrodomesticos-de-cocina'),

    -- Under 'cuidado-del-hogar'
    ('Aspiradoras Robot', 'aspiradoras-robot', 'cuidado-del-hogar'),
    ('Humidificadores', 'humidificadores', 'cuidado-del-hogar'),

    -- Under 'maquillaje'
    ('Labiales y Brillos', 'labiales-y-brillos', 'maquillaje'),
    ('Sombras y Delineadores', 'sombras-y-delineadores', 'maquillaje'),
    ('Bases y Correctores', 'bases-y-correctores', 'maquillaje'),

    -- Under 'cuidado-de-la-piel'
    ('Cremas Hidratantes', 'cremas-hidratantes', 'cuidado-de-la-piel'),
    ('Limpiadores Faciales', 'limpiadores-faciales', 'cuidado-de-la-piel'),
    ('Protectores Solares', 'protectores-solares', 'cuidado-de-la-piel'),

    -- Under 'accesorios-de-belleza'
    ('Brochas de Maquillaje', 'brochas-de-maquillaje', 'accesorios-de-belleza'),
    ('Espejos con Luz', 'espejos-con-luz', 'accesorios-de-belleza'),
    ('Organizadores de Maquillaje', 'organizadores-de-maquillaje', 'accesorios-de-belleza'),

    -- Under 'cuidado-del-cabello'
    ('Shampoo y Acondicionador', 'shampoo-y-accondicionador', 'cuidado-del-cabello'),
    ('Cepillos y Peines', 'cepillos-y-peines', 'cuidado-del-cabello'),

    -- Under 'juegos-de-construccion'
    ('Bloques y Ladrillos', 'bloques-y-ladrillos', 'juegos-de-construccion'),
    ('Pistas de Carreras', 'pistas-de-carreras', 'juegos-de-construccion'),

    -- Under 'munecas-y-peluches'
    ('Peluches', 'peluches-l3', 'munecas-y-peluches'),
    ('Muñecas y Figuras', 'munecas-y-figuras', 'munecas-y-peluches'),

    -- Under 'rompecabezas-y-juegos-de-mesa'
    ('Rompecabezas 3D', 'rompecabezas-3d', 'rompecabezas-y-juegos-de-mesa'),
    ('Juegos de Mesa Familiares', 'juegos-de-mesa-familiares', 'rompecabezas-y-juegos-de-mesa'),

    -- Under 'fitness-y-ejercicio'
    ('Bandas de Resistencia', 'bandas-de-resistencia', 'fitness-y-ejercicio'),
    ('Mancuernas y Pesas', 'mancuernas-y-pesas', 'fitness-y-ejercicio'),
    ('Tapetes de Yoga', 'tapetes-de-yoga', 'fitness-y-ejercicio'),

    -- Under 'ciclismo'
    ('Luces para Bicicleta', 'luces-para-bicicleta', 'ciclismo'),
    ('Bolsas para Bicicleta', 'bolsas-para-bicicleta', 'ciclismo'),

    -- Under 'camping-y-senderismo'
    ('Linternas de Camping', 'linternas-de-camping', 'camping-y-senderismo'),
    ('Tiendas de Campaña', 'tiendas-de-campana', 'camping-y-senderismo'),
    ('Sacos de Dormir', 'sacos-de-dormir', 'camping-y-senderismo'),

    -- Under 'articulos-para-perros'
    ('Juguetes para Perros', 'juguetes-para-perros', 'articulos-para-perros'),
    ('Camas y Cobijas', 'camas-y-cobijas-perro', 'articulos-para-perros'),
    ('Collares y Correas', 'collares-y-correas-perro', 'articulos-para-perros'),

    -- Under 'articulos-para-gatos'
    ('Juguetes para Gatos', 'juguetes-para-gatos', 'articulos-para-gatos'),
    ('Rascadores', 'rascadores-gato', 'articulos-para-gatos'),
    ('Camas para Gatos', 'camas-para-gatos', 'articulos-para-gatos'),

    -- Under 'ropa-de-bebe'
    ('Mamelucos y Monos', 'mamelucos-y-monos', 'ropa-de-bebe'),
    ('Conjuntos para Bebé', 'conjuntos-para-bebe', 'ropa-de-bebe'),

    -- Under 'accesorios-y-cuidado-bebe'
    ('Biberones y Chupones', 'biberones-y-chupones', 'accesorios-y-cuidado-bebe'),
    ('Bolsos de Pañales', 'bolsos-de-panales', 'accesorios-y-cuidado-bebe'),

    -- Under 'herramientas-de-mano'
    ('Destornilladores y Llaves', 'destornilladores-y-llaves', 'herramientas-de-mano'),
    ('Alicates y Pinzas', 'alicates-y-pinzas', 'herramientas-de-mano'),

    -- Under 'ferreteria-y-accesorios'
    ('Pomos y Jaladeras', 'pomos-y-jaladeras', 'ferreteria-y-accesorios'),
    ('Cintas y Adhesivos', 'cintas-y-adhesivos', 'ferreteria-y-accesorios'),

    -- Under 'accesorios-de-interior-auto'
    ('Fundas de Asiento', 'fundas-de-asiento', 'accesorios-de-interior-auto'),
    ('Soportes y Organizadores', 'soportes-y-organizaciones-auto', 'accesorios-de-interior-auto'),

    -- Under 'accesorios-de-exterior-auto'
    ('Cubiertas para Auto', 'cubiertas-para-auto', 'accesorios-de-exterior-auto'),
    ('Luces LED para Auto', 'luces-led-para-auto', 'accesorios-de-exterior-auto'),

    -- Under 'utiles-de-escritorio'
    ('Bolígrafos y Lapiceros', 'boligrafos-y-lapiceros', 'utiles-de-escritorio'),
    ('Cuadernos y Agendas', 'cuadernos-y-agendas', 'utiles-de-escritorio'),

    -- Under 'organizacion-de-oficina'
    ('Organizadores de Escritorio', 'organizadores-de-escritorio', 'organizacion-de-oficina'),

    -- Under 'costura-y-tejido'
    ('Hilos y Agujas', 'hilos-y-agujas', 'costura-y-tejido'),

    -- Under 'pintura-y-dibujo'
    ('Pinceles y Lienzos', 'pinceles-y-lienzos', 'pintura-y-dibujo')
) AS cat(name, slug, parent_slug)
WHERE l2.slug = cat.parent_slug
ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id;
