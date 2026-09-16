USE SolarSmart;
GO

PRINT '==============================================';
PRINT 'SolarSmart Database Upgrade';
PRINT '==============================================';
GO


/* =========================================================
   1. ENSURE CATEGORY EXISTS IN SolarProducts
   ========================================================= */

IF COL_LENGTH('dbo.SolarProducts', 'category') IS NULL
BEGIN
    ALTER TABLE dbo.SolarProducts
    ADD category NVARCHAR(50) NULL;

    PRINT 'Added category column to SolarProducts.';
END
ELSE
BEGIN
    PRINT 'category column already exists.';
END;
GO


/* =========================================================
   2. WEATHER DATA
   Historical + API weather/solar-resource data
   ========================================================= */

IF OBJECT_ID('dbo.WeatherData', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.WeatherData
    (
        weather_id INT IDENTITY(1,1) PRIMARY KEY,

        location_name NVARCHAR(150) NOT NULL,

        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),

        recorded_at DATETIME NOT NULL,

        temperature_c DECIMAL(10,2),

        humidity_percent DECIMAL(10,2),

        cloud_cover_percent DECIMAL(10,2),

        wind_speed_kmh DECIMAL(10,2),

        precipitation_mm DECIMAL(10,2),

        solar_irradiance DECIMAL(12,4),

        sunshine_hours DECIMAL(10,2),

        data_source NVARCHAR(100),

        created_at DATETIME DEFAULT GETDATE()
    );

    PRINT 'Created WeatherData.';
END
ELSE
BEGIN
    PRINT 'WeatherData already exists.';
END;
GO


/* =========================================================
   3. SOLAR GENERATION DATA
   Kaggle / historical generation dataset
   ========================================================= */

IF OBJECT_ID('dbo.SolarGenerationData', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.SolarGenerationData
    (
        generation_id INT IDENTITY(1,1) PRIMARY KEY,

        location_name NVARCHAR(150),

        recorded_at DATETIME,

        temperature_c DECIMAL(10,2),

        humidity_percent DECIMAL(10,2),

        cloud_cover_percent DECIMAL(10,2),

        wind_speed_kmh DECIMAL(10,2),

        solar_irradiance DECIMAL(12,4),

        sunshine_hours DECIMAL(10,2),

        power_generation_kw DECIMAL(14,4),

        dataset_source NVARCHAR(200),

        created_at DATETIME DEFAULT GETDATE()
    );

    PRINT 'Created SolarGenerationData.';
END
ELSE
BEGIN
    PRINT 'SolarGenerationData already exists.';
END;
GO


/* =========================================================
   4. ML MODEL REGISTRY
   Stores model performance and selected model
   ========================================================= */

IF OBJECT_ID('dbo.MLModels', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.MLModels
    (
        model_id INT IDENTITY(1,1) PRIMARY KEY,

        model_name NVARCHAR(100) NOT NULL,

        algorithm NVARCHAR(100),

        mae DECIMAL(14,6),

        rmse DECIMAL(14,6),

        r2_score DECIMAL(14,6),

        model_path NVARCHAR(500),

        training_records INT,

        is_best_model BIT DEFAULT 0,

        trained_at DATETIME DEFAULT GETDATE()
    );

    PRINT 'Created MLModels.';
END
ELSE
BEGIN
    PRINT 'MLModels already exists.';
END;
GO


/* =========================================================
   5. GOVERNMENT SUBSIDIES
   Central + State subsidy information
   ========================================================= */

IF OBJECT_ID('dbo.GovernmentSubsidies', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.GovernmentSubsidies
    (
        subsidy_id INT IDENTITY(1,1) PRIMARY KEY,

        scheme_name NVARCHAR(250) NOT NULL,

        government_level NVARCHAR(50),

        state NVARCHAR(100),

        consumer_category NVARCHAR(100),

        min_capacity_kw DECIMAL(10,2),

        max_capacity_kw DECIMAL(10,2),

        subsidy_amount_inr DECIMAL(14,2),

        subsidy_type NVARCHAR(100),

        eligibility_conditions NVARCHAR(MAX),

        effective_from DATE,

        effective_to DATE,

        source_url NVARCHAR(1000),

        last_verified_at DATETIME,

        is_active BIT DEFAULT 1,

        created_at DATETIME DEFAULT GETDATE()
    );

    PRINT 'Created GovernmentSubsidies.';
END
ELSE
BEGIN
    PRINT 'GovernmentSubsidies already exists.';
END;
GO


/* =========================================================
   6. SUBSIDY CALCULATIONS
   Stores calculated subsidy estimates
   ========================================================= */

IF OBJECT_ID('dbo.SubsidyCalculations', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.SubsidyCalculations
    (
        calculation_id INT IDENTITY(1,1) PRIMARY KEY,

        location_name NVARCHAR(150),

        state NVARCHAR(100),

        system_capacity_kw DECIMAL(10,2),

        estimated_system_cost DECIMAL(14,2),

        estimated_subsidy DECIMAL(14,2),

        final_estimated_cost DECIMAL(14,2),

        subsidy_id INT,

        calculated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_SubsidyCalculations_Subsidy
            FOREIGN KEY (subsidy_id)
            REFERENCES dbo.GovernmentSubsidies(subsidy_id)
    );

    PRINT 'Created SubsidyCalculations.';
END
ELSE
BEGIN
    PRINT 'SubsidyCalculations already exists.';
END;
GO


/* =========================================================
   7. MCDM CRITERIA
   Criteria + weights for site suitability
   ========================================================= */

IF OBJECT_ID('dbo.MCDMCriteria', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.MCDMCriteria
    (
        criteria_id INT IDENTITY(1,1) PRIMARY KEY,

        criteria_name NVARCHAR(150) NOT NULL,

        description NVARCHAR(500),

        criteria_type NVARCHAR(50),

        weight DECIMAL(8,4),

        is_active BIT DEFAULT 1,

        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT CK_MCDMCriteria_Type
            CHECK (criteria_type IN ('Benefit', 'Cost'))
    );

    PRINT 'Created MCDMCriteria.';
END
ELSE
BEGIN
    PRINT 'MCDMCriteria already exists.';
END;
GO


/* =========================================================
   8. INSERT DEFAULT MCDM CRITERIA
   Only inserts if table is empty
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.MCDMCriteria)
BEGIN

    INSERT INTO dbo.MCDMCriteria
    (
        criteria_name,
        description,
        criteria_type,
        weight
    )
    VALUES
    (
        'Solar Irradiance',
        'Amount of solar energy received at the location',
        'Benefit',
        0.30
    ),
    (
        'Sunshine Hours',
        'Average duration of sunlight',
        'Benefit',
        0.15
    ),
    (
        'Cloud Cover',
        'Percentage of cloud coverage',
        'Cost',
        0.10
    ),
    (
        'Roof Area',
        'Available area for solar panel installation',
        'Benefit',
        0.20
    ),
    (
        'Shading',
        'Amount of shading affecting solar panels',
        'Cost',
        0.15
    ),
    (
        'Roof Orientation',
        'Suitability of roof direction',
        'Benefit',
        0.10
    );

    PRINT 'Inserted default MCDM criteria.';
END
ELSE
BEGIN
    PRINT 'MCDM criteria already populated.';
END;
GO


/* =========================================================
   9. SITES
   User installation location information
   ========================================================= */

IF OBJECT_ID('dbo.Sites', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.Sites
    (
        site_id INT IDENTITY(1,1) PRIMARY KEY,

        location_name NVARCHAR(200),

        latitude DECIMAL(10,6),

        longitude DECIMAL(10,6),

        roof_area_sq_m DECIMAL(12,2),

        roof_orientation NVARCHAR(50),

        roof_tilt_degree DECIMAL(10,2),

        shading_percent DECIMAL(10,2),

        created_at DATETIME DEFAULT GETDATE()
    );

    PRINT 'Created Sites.';
END
ELSE
BEGIN
    PRINT 'Sites already exists.';
END;
GO


/* =========================================================
   10. SITE SUITABILITY RESULTS
   ========================================================= */

IF OBJECT_ID('dbo.SiteSuitabilityResults', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.SiteSuitabilityResults
    (
        result_id INT IDENTITY(1,1) PRIMARY KEY,

        site_id INT NOT NULL,

        solar_irradiance_score DECIMAL(8,2),

        sunshine_score DECIMAL(8,2),

        cloud_cover_score DECIMAL(8,2),

        roof_area_score DECIMAL(8,2),

        shading_score DECIMAL(8,2),

        orientation_score DECIMAL(8,2),

        final_suitability_score DECIMAL(8,2),

        suitability_category NVARCHAR(100),

        calculated_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_SiteSuitability_Site
            FOREIGN KEY (site_id)
            REFERENCES dbo.Sites(site_id)
    );

    PRINT 'Created SiteSuitabilityResults.';
END
ELSE
BEGIN
    PRINT 'SiteSuitabilityResults already exists.';
END;
GO


/* =========================================================
   11. PRODUCT RECOMMENDATIONS
   Connects sites + products + ML results
   ========================================================= */

IF OBJECT_ID('dbo.ProductRecommendations', 'U') IS NULL
BEGIN

    CREATE TABLE dbo.ProductRecommendations
    (
        recommendation_id INT IDENTITY(1,1) PRIMARY KEY,

        site_id INT,

        product_id INT,

        recommendation_score DECIMAL(10,4),

        recommendation_reason NVARCHAR(MAX),

        estimated_generation_kw DECIMAL(14,4),

        estimated_cost DECIMAL(14,2),

        created_at DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_ProductRecommendation_Site
            FOREIGN KEY (site_id)
            REFERENCES dbo.Sites(site_id),

        CONSTRAINT FK_ProductRecommendation_Product
            FOREIGN KEY (product_id)
            REFERENCES dbo.SolarProducts(product_id)
    );

    PRINT 'Created ProductRecommendations.';
END
ELSE
BEGIN
    PRINT 'ProductRecommendations already exists.';
END;
GO


/* =========================================================
   12. CREATE INDEXES
   ========================================================= */

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_WeatherData_Location_Date'
      AND object_id = OBJECT_ID('dbo.WeatherData')
)
BEGIN

    CREATE INDEX IX_WeatherData_Location_Date
    ON dbo.WeatherData(location_name, recorded_at);

END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_SolarGeneration_Location_Date'
      AND object_id = OBJECT_ID('dbo.SolarGenerationData')
)
BEGIN

    CREATE INDEX IX_SolarGeneration_Location_Date
    ON dbo.SolarGenerationData(location_name, recorded_at);

END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_SolarProducts_Category'
      AND object_id = OBJECT_ID('dbo.SolarProducts')
)
BEGIN

    CREATE INDEX IX_SolarProducts_Category
    ON dbo.SolarProducts(category);

END;
GO


/* =========================================================
   13. FINAL DATABASE VERIFICATION
   ========================================================= */

PRINT '';
PRINT '==============================================';
PRINT 'DATABASE TABLE SUMMARY';
PRINT '==============================================';

SELECT
    t.name AS table_name,
    SUM(p.rows) AS row_count
FROM sys.tables t
LEFT JOIN sys.partitions p
    ON t.object_id = p.object_id
    AND p.index_id IN (0,1)
WHERE t.name IN
(
    'Manufacturers',
    'SolarProducts',
    'WeatherData',
    'SolarGenerationData',
    'MLModels',
    'GovernmentSubsidies',
    'SubsidyCalculations',
    'MCDMCriteria',
    'Sites',
    'SiteSuitabilityResults',
    'ProductRecommendations'
)
GROUP BY t.name
ORDER BY t.name;
GO


PRINT '';
PRINT '==============================================';
PRINT 'SolarSmart database upgrade completed!';
PRINT '==============================================';
GO