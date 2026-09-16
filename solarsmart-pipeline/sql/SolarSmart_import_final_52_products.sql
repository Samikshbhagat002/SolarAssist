USE SolarSmart;
GO

/* SolarSmart - replace old SolarProducts catalog with the finalized 52-product catalog.
   Existing ProductRecommendations = 0, so the old product rows can be removed safely.
   product_id is an IDENTITY column, so it is intentionally not inserted.
   scraped_at has a GETDATE() default, so it is intentionally not inserted.
*/

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1. Ensure Saatvik Green Energy exists in Manufacturers.
IF NOT EXISTS (
    SELECT 1
    FROM dbo.Manufacturers
    WHERE name = N'Saatvik Green Energy'
)
BEGIN
    INSERT INTO dbo.Manufacturers (name)
    VALUES (N'Saatvik Green Energy');
END;

-- 2. Remove the old 56-product catalog.
DELETE FROM dbo.SolarProducts;

-- 3. Insert the finalized 52 products.
INSERT INTO dbo.SolarProducts
(
    manufacturer_id,
    product_name,
    category,
    panel_type,
    wattage_w,
    efficiency_pct,
    price_inr,
    warranty_years,
    length_mm,
    width_mm,
    source_url
)
SELECT
    m.manufacturer_id,
    v.product_name,
    v.category,
    v.panel_type,
    v.wattage_w,
    v.efficiency_pct,
    v.price_inr,
    v.warranty_years,
    v.length_mm,
    v.width_mm,
    v.source_url
FROM
(
    VALUES
(N'Adani Solar', N'Shine Series | MonoPERC', N'panel', N'TOPCon, P-Type, DCR', 560.0, 21.22, NULL, NULL, NULL, NULL, N'https://www.adanisolar.com/product-monoperc-shine'),
(N'Adani Solar', N'Shine TopCon Series', N'panel', N'TOPCon, Bifacial, N-Type, DCR', 640.0, 22.3, NULL, NULL, NULL, NULL, N'https://www.adanisolar.com/product-topcon-shine-series'),
(N'Loom Solar', N'5 kWh Power Storage System for Commercials, Shops, Office, Showrooms', N'battery', NULL, NULL, NULL, 240000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/5-kva-solar-inverter-with-5-kwh-lithium-battery-for-home'),
(N'Loom Solar', N'C&I ESS Product: 50-1000kWh (Customized)', N'battery', NULL, NULL, NULL, 5000000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/c-i-ess-product'),
(N'Loom Solar', N'CAML 10.24 kWh (200Ah, 51.2V) LiFePO4 Battery - Wall Mount', N'battery', NULL, NULL, NULL, 230000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-51-2-v-200-ah-10-24-kwh-lifepo4-battery-wall-mount'),
(N'Loom Solar', N'CAML 100 Ah, 204.8 V / 20kWh High-Voltage Lithium Battery', N'battery', NULL, NULL, NULL, 520000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-100ah-51-2v-high-voltage-lithium-battery'),
(N'Loom Solar', N'CAML 12.8 V 100 Ah, 1.28 kWh LiFePO4 - Lithium Battery', N'battery', NULL, NULL, NULL, 34500.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-10012-low-voltage-lithium-battery'),
(N'Loom Solar', N'CAML 125kW/261kWh All-in-One BESS for C&I Applications', N'battery', NULL, NULL, NULL, 6000000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-125kw_261kwh-2h-liquid-cooled-battery-energy-storage-system'),
(N'Loom Solar', N'CAML 2.56 kWh (100Ah, 25.6V) LiFePO4 Wall-Mount - Lithium Battery', N'battery', NULL, NULL, NULL, 64375.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-10025-wall-mount-lv-lithium-battery'),
(N'Loom Solar', N'CAML 48 V 100 Ah, 5 kWh Lithium Battery - Rack Mount', N'battery', NULL, NULL, NULL, 99000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/100-ah-5000-watt-hour-lithium-battery-for-inverter'),
(N'Loom Solar', N'CAML 5 MWh Liquid Cooled Containerized Battery Energy Storage System (BESS)', N'battery', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-5-mwh-liquid-cooled-containerized-battery-energy-storage-system-bess'),
(N'Loom Solar', N'CAML 5.12 kWh (100Ah, 51.2V) LiFePO4 Battery - Wall Mount', N'battery', NULL, NULL, NULL, 115000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/100ah-5kwh-lifepo4-battery-for-home'),
(N'Loom Solar', N'CAML 50 Ah, 204.8 V / 10 kWh High-Voltage Stackable Lithium Battery', N'battery', NULL, NULL, NULL, 275000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-50-ah-51-2-v-high-voltage-lithium-battery'),
(N'Loom Solar', N'CAML 51.2 V 100 Ah, 5.12 kWh Rack-Mount Lithium Battery', N'battery', NULL, NULL, NULL, 108000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/caml-51-2-v-100-ah-5-12-kwh-rack-mount-terminal-block-lithium-battery'),
(N'Loom Solar', N'FUSION 3 kW Single Phase On-Grid Solar Inverter', N'inverter', NULL, NULL, NULL, 20000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-31fe-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 10 kW, 3 ø on grid solar inverter', N'inverter', NULL, NULL, NULL, 60000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-10-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 10 kW/ 48 V Hybrid Solar inverter', N'inverter', NULL, NULL, NULL, 279000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-10-kva-48-volt-hybrid-solar-inverter'),
(N'Loom Solar', N'Fusion 100 kw on grid solar inverter', N'inverter', NULL, NULL, NULL, 300000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-100-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Fusion 15 kw, 3 Φ on grid solar inverter', N'inverter', NULL, NULL, NULL, 76000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-15-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 20 kw on grid solar inverter', N'inverter', NULL, NULL, NULL, 101640.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-20-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Fusion 25 kW on grid solar inverter', N'inverter', NULL, NULL, NULL, 96500.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-25-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Fusion 30 kw on grid solar inverter', N'inverter', NULL, NULL, NULL, 135125.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-30-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Fusion 4 kw, 1 ø on grid solar inverter', N'inverter', NULL, NULL, NULL, 28500.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-4-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 5 kW / 48 V Hybrid Solar Inverter', N'inverter', NULL, NULL, NULL, 117000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/5kw-48v-hybrid-solar-inverter-for-lithium-battery'),
(N'Loom Solar', N'Fusion 5 kW, 1 ø on grid solar inverter', N'inverter', NULL, NULL, NULL, 33500.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-5-kw-on-grid-solar-inverter-1phase'),
(N'Loom Solar', N'Fusion 50 kW on grid solar inverter', N'inverter', NULL, NULL, NULL, 200000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-50-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Fusion 6 kW, 3 ø On-Grid Solar Inverter', N'inverter', NULL, NULL, NULL, 52500.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-6-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 8 kw, 3 ø on grid solar inverter', N'inverter', NULL, NULL, NULL, 57000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-8-kw-on-grid-solar-inverter'),
(N'Loom Solar', N'Fusion 80 kw on grid solar inverter', N'inverter', NULL, NULL, NULL, 275000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/fusion-80-kw-on-grid-solar-inverter-three-phase'),
(N'Loom Solar', N'Loom Solar Panel - SHARK 600 Wp | N-Type TOPCon Bifacial 16BB (Pack of 2)', N'panel', N'TOPCon, Bifacial, N-Type', 600.0, 23.23, 30000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/loom-solar-panel-shark-600-wp-n-type-topcon-bifacial-16bb'),
(N'Loom Solar', N'Loom Solar SHARK 625 Wp N-Type TOPCon G12R Dual Glass Bifacial Solar Panel(Pack of 36)', N'panel', N'TOPCon, Bifacial, N-Type, Half-Cut, Dual Glass', 625.0, 23.25, 383644.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/shark-625-wp-n-topcon-g12r-dual-glass-solar-panel-pack-of-31'),
(N'Loom Solar', N'SHARK 600 Wp HJT Dual-Glass Solar Panel (Pack of 31)', N'panel', N'Bifacial, HJT', 600.0, 23.5, 342000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/shark-600-wp-hjt-dual-glass-solar-panel-pack-of-33'),
(N'Loom Solar', N'SHARK 730~750 Wp HJT Dual-Glass Solar Panel (Pack of 33)', N'panel', N'Bifacial, HJT, N-Type, Dual Glass', 750.0, NULL, 530000.0, NULL, NULL, NULL, N'https://www.loomsolar.com/products/shark-730wp-hjt-dual-glass-solar-panel'),
(N'Saatvik Green Energy', N'Saatvik UDAY Plus Series Hybrid Solar Inverter', N'inverter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'https://www.saatvikgroup.com/inverters/hybrid'),
(N'Saatvik Green Energy', N'Saatvik Tej N-TOPCon M10R Bifacial Module', N'panel', N'TOPCon, Mono PERC, Bifacial, N-Type, P-Type, Glass-to-Glass', 585.0, 23.69, NULL, NULL, NULL, NULL, N'https://www.saatvikgroup.com/modules/n-topcon'),
(N'Saatvik Green Energy', N'Saatvik Tej Plus N-TOPCon G12R Bifacial Module', N'panel', N'TOPCon, Bifacial, N-Type, P-Type, Glass-to-Glass', 640.0, 23.69, NULL, NULL, NULL, NULL, N'https://www.saatvikgroup.com/modules/bifacial-g12r'),
(N'Saatvik Green Energy', N'Saatvik VEGA Plus Mono PERC G2TB Bifacial Module', N'panel', N'Mono PERC, Bifacial, Half-Cut', 550.0, 21.29, NULL, NULL, NULL, NULL, N'https://www.saatvikgroup.com/modules/bifacial-g2tb'),
(N'Waaree Energies', N'Buy 4kW Three Phase Solar On-Grid Inverter | Waaree', N'inverter', NULL, NULL, NULL, 63000.0, NULL, NULL, NULL, N'https://shop.waaree.com/on-grid-three-phase-w3-4k'),
(N'Waaree Energies', N'Single Phase On Grid Inverter', N'inverter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'https://shop.waaree.com/single-phase-on-grid-inverter'),
(N'Waaree Energies', N'Buy 540Wp Mono PERC DCR Solar Panel Online | Waaree', N'panel', N'Mono PERC, Monocrystalline, Polycrystalline, Bifacial, Dual Glass, DCR', 540.0, 22.0, 15199.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-540wp-144-cells-24v-mono-perc-dcr-solar-panel-m10-mono-10bb-glass-to-backsheet-module-high-efficiency-solar-module'),
(N'Waaree Energies', N'Buy Waaree 700Wp TOPCon Bifacial Solar Module | Waaree', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 700.0, 22.32, 15599.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-700wp-topcon-n-type-bifacial-solar-panel-m12-g2g-132-cells-dual-glass-high-efficiency-solar-module-for-rooftop-commercial-use'),
(N'Waaree Energies', N'WAAREE 250WP Mono PERC Flexible Solar Module', N'panel', N'Mono PERC, Monocrystalline, Polycrystalline, Bifacial', 250.0, 22.0, 14199.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-250wp-mono-perc-flexible-solar-module'),
(N'Waaree Energies', N'WAAREE 545Wp 144 Cells 24 Volts Framed Dual Glass Mono PERC Bifacial Solar Module', N'panel', N'Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 545.0, 22.0, 11499.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-545wp-144-cells-24-volts-framed-dual-glass-mono-perc-bifacial-solar-module'),
(N'Waaree Energies', N'WAAREE 550Wp 144Cells 24 Volts Mono PERC Solar Module', N'panel', N'Mono PERC, Monocrystalline, Polycrystalline, Bifacial, DCR', 550.0, 22.0, 11799.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-550wp-m10-mono-10bb-solar-panel-glass-to-white-backsheet-module-high-efficiency-mono-perc-solar-pv-module'),
(N'Waaree Energies', N'WAAREE 550Wp 144Cells 44 Volts Framed Dual Glass Mono PERC Bifacial Solar Module', N'panel', N'Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Half-Cut, Dual Glass, DCR', 550.0, 22.0, 11899.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-550wp-144cells-44-volts-framed-dual-glass-mono-perc-bifacial-solar-module'),
(N'Waaree Energies', N'WAAREE 565Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 565.0, 22.0, 11699.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-565wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-module'),
(N'Waaree Energies', N'WAAREE 575Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial Non-DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 575.0, 22.0, 11299.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-575wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-module'),
(N'Waaree Energies', N'WAAREE 580Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial Non-DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 580.0, 22.0, 12099.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-580wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-module'),
(N'Waaree Energies', N'WAAREE 585Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial Non-DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 585.0, 22.0, 12199.01, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-585wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-modules'),
(N'Waaree Energies', N'WAAREE 590Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial Non-DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 590.0, 22.0, 12299.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-590wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-module'),
(N'Waaree Energies', N'WAAREE 595Wp 144Cells 24 Volts N-Type Framed Dual Glass Bifacial Non-DCR Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 595.0, 22.0, 12999.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-595wp-144cells-24-volts-n-type-framed-dual-glass-bifacial-non-dcr-solar-modules'),
(N'Waaree Energies', N'WAAREE 685Wp 132 Cells 24 Volts N-Type Framed Dual Glass Bifacial Solar Module', N'panel', N'TOPCon, Mono PERC, Monocrystalline, Polycrystalline, Bifacial, N-Type, Dual Glass, DCR', 685.0, 22.0, 15499.0, NULL, NULL, NULL, N'https://shop.waaree.com/waaree-695-wp-132cells-24-volts-n-type-framed-dual-glass-bifacial-solar-module')
) AS v
(
    manufacturer_name,
    product_name,
    category,
    panel_type,
    wattage_w,
    efficiency_pct,
    price_inr,
    warranty_years,
    length_mm,
    width_mm,
    source_url
)
INNER JOIN dbo.Manufacturers AS m
    ON m.name = v.manufacturer_name;

-- 4. Verify that all 52 rows were inserted.
IF (SELECT COUNT(*) FROM dbo.SolarProducts) <> 52
BEGIN
    THROW 50001, 'SolarProducts verification failed: expected 52 rows.', 1;
END;

COMMIT TRANSACTION;
GO

-- Final verification
SELECT COUNT(*) AS TotalProducts
FROM dbo.SolarProducts;

SELECT
    m.name AS Manufacturer,
    COUNT(*) AS ProductCount
FROM dbo.SolarProducts AS p
INNER JOIN dbo.Manufacturers AS m
    ON m.manufacturer_id = p.manufacturer_id
GROUP BY m.name
ORDER BY m.name;

SELECT
    category,
    COUNT(*) AS ProductCount
FROM dbo.SolarProducts
GROUP BY category
ORDER BY category;
GO
