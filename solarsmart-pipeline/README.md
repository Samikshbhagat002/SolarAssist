# ☀️ SolarSmart

SolarSmart is a solar energy recommendation system that combines **Data Engineering, Machine Learning, empirical data analysis, and deterministic engineering calculations** to provide solar system recommendations.

The system provides:

- ☀️ Recommended Solar System Capacity
- ⚡ Estimated Monthly Solar Generation
- 🔋 Recommended Battery Capacity
- 📊 SHAP-based Model Explainability

---

# 🚀 Project Overview

SolarSmart helps estimate an appropriate solar system configuration based on household electricity consumption and future energy requirements.

The project consists of:

- Data Collection
- Web Scraping
- Data Cleaning and ETL
- Machine Learning
- Empirical Solar Generation Analysis
- Battery Sizing
- Explainable AI

---

# ✨ Features

## 1. Solar Capacity Recommendation

The system predicts the recommended solar system capacity based on:

- Monthly electricity consumption
- Expected future electricity usage growth

### Model

Gradient Boosting Regressor

### Output

```text
Recommended Solar Capacity (kW)
```

---

# 2. Solar Generation Estimation

The final production generation estimate uses an empirical approach based on observed UNISOLAR data.

### Formula

```text
Monthly Generation =
Recommended Capacity × Observed Monthly Median Yield
```

The monthly yield is calculated as:

```text
Generation per kWp =
Monthly Generation / Installed Capacity
```

The empirical monthly yield table is calculated using the training period to maintain a leakage-free methodology.

### Output

```text
Expected Monthly Solar Generation (kWh)
```

---

# 3. Battery Sizing

Battery capacity is calculated using a deterministic engineering calculation.

The calculation considers:

- Monthly electricity consumption
- Required backup hours
- Backup load percentage
- Depth of discharge
- Battery efficiency

### Output

```text
Recommended Battery Capacity (kWh)
```

---

# 4. Explainable AI

SHAP is used to explain feature contributions for:

- Solar capacity prediction
- Generation ML benchmark model

This improves transparency and interpretability of the machine learning models.

---

# 🏗️ Project Structure

```text
solarsmart-pipeline/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── etl/
│   ├── clean_consumption.py
│   ├── clean_generation.py
│   └── clean_Products.py
│
├── kaggle_data/
│   └── download_datasets.py
│
├── scraping/
│   ├── scrape_products.py
│   ├── scrape_subsidies.py
│   └── utils.py
│
├── ml/
│   │
│   ├── models/
│   │   ├── model_capacity.pkl
│   │   ├── model_generation.pkl
│   │   ├── capacity_features.json
│   │   └── generation_features.json
│   │
│   ├── results/
│   │   ├── capacity_monthly_yield.csv
│   │   └── capacity_monthly_yield_metadata.json
│   │
│   ├── battery_sizing.py
│   ├── capacity_calculator.py
│   ├── capacity_sizing.py
│   ├── capacity_yield.py
│   ├── check_generation_sanity.py
│   ├── create_capacity_dataset.py
│   ├── empirical_generation.py
│   ├── explain_capacity_shap.py
│   ├── explain_shap.py
│   ├── main_pipeline.py
│   ├── predict.py
│   ├── product_recommendation.py
│   ├── site_suitability.py
│   ├── subsidy_calculator.py
│   ├── train_capacity.py
│   ├── train_model.py
│   ├── update_sunshine.py
│   └── weather_data.py
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

# 🛠️ Technologies Used

## Programming

- Python

## Data Engineering

- Pandas
- NumPy
- ETL
- Data Cleaning
- Web Scraping

## Machine Learning

- Scikit-learn
- XGBoost

## Explainable AI

- SHAP

## Data Collection

- Requests
- BeautifulSoup

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd solarsmart-pipeline
```

---

# 2. Create a Virtual Environment

### Windows

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
```

Activate it:

```bash
source venv/bin/activate
```

---

# 3. Upgrade pip

```bash
python -m pip install --upgrade pip
```

---

# 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# ▶️ Running the Unified Prediction Pipeline

Run:

```bash
python ml/predict.py
```

The pipeline will:

1. Load trained ML models
2. Predict solar capacity
3. Estimate monthly solar generation
4. Calculate battery requirements
5. Generate SHAP explanations
6. Return the final recommendation

---

# 📥 Input Parameters

The main function is:

```python
predict_solar_system()
```

Example:

```python
from ml.predict import predict_solar_system


result = predict_solar_system(

    # Household
    monthly_consumption_kwh=300,
    future_usage_growth_pct=10,

    # Generation context
    month_num=1,
    latitude=-37.718287,
    longitude=145.050975,
    air_temperature_c=20,
    apparent_temperature_c=20,
    dew_point_c=12,
    relative_humidity_pct=65,

    # Battery
    backup_hours=4,
    backup_load_pct=50,
    depth_of_discharge_pct=80,
    battery_efficiency_pct=90
)
```

---

# 📤 Output

The function returns a dictionary containing:

```python
{
    "capacity": {
        "recommended_capacity_kw": 3.766,
        "model": "Gradient Boosting",
        "label_source": "method_derived",
        "shap": {}
    },

    "generation": {
        "predicted_monthly_generation_kwh": 448.31,
        "month": 1,
        "model": "Empirical observed monthly median yield",
        "method": "empirical_observed_monthly_median",
        "monthly_yield_kwh_per_kwp": 119.04,

        "ml_benchmark": {
            "model": "Gradient Boosting",
            "predicted_monthly_generation_kwh": 3255.85,
            "shap": {}
        }
    },

    "battery": {
        "recommended_battery_kwh": 1.16
    }
}
```

---

# ⭐ Important Output for Production

The primary values intended for the application are:

## ☀️ Recommended Solar Capacity

```python
result["capacity"]["recommended_capacity_kw"]
```

---

## ⚡ Expected Monthly Generation

```python
result["generation"]["predicted_monthly_generation_kwh"]
```

---

## 🔋 Recommended Battery Capacity

```python
result["battery"]["recommended_battery_kwh"]
```

---

# ⚠️ Generation ML Benchmark

The project also contains a machine learning benchmark prediction:

```python
result["generation"]["ml_benchmark"]
```

This value is retained for:

- Research
- Model comparison
- Analysis
- SHAP explainability

It should **not be used as the primary production generation recommendation**.

The final production generation estimate is:

```python
result["generation"]["predicted_monthly_generation_kwh"]
```

---

# 🔌 Backend Integration

The primary file for backend integration is:

```text
ml/predict.py
```

Import:

```python
from ml.predict import predict_solar_system
```

Then call:

```python
result = predict_solar_system(...)
```

The backend can return the complete result as JSON.

---

# 🎨 Frontend Integration

The frontend should primarily collect:

- Monthly Electricity Consumption
- Future Electricity Usage Growth
- Backup Hours
- Backup Load Percentage
- User Location

The application should display:

```text
☀️ Recommended Solar Capacity

⚡ Expected Monthly Generation

🔋 Recommended Battery Capacity
```

Example:

```text
☀️ Recommended Solar Capacity
3.77 kW


⚡ Expected Monthly Generation
448.31 kWh/month


🔋 Recommended Battery Capacity
1.16 kWh
```

---

# 🌍 Weather and Location

The prediction pipeline accepts:

```text
latitude
longitude

air_temperature_c
apparent_temperature_c
dew_point_c
relative_humidity_pct
```

For production, these values can be obtained automatically using:

1. User location
2. Geolocation service
3. Weather API

The frontend does not need to manually request all weather parameters from the user.

---

# 📊 Data Engineering

The project includes data engineering components.

## Data Download

```text
kaggle_data/download_datasets.py
```

---

## ETL and Data Cleaning

```text
etl/clean_consumption.py

etl/clean_generation.py

etl/clean_Products.py
```

---

## Web Scraping

```text
scraping/scrape_products.py

scraping/scrape_subsidies.py

scraping/utils.py
```

---

# 🤖 Model Training

The following scripts are used for training and experimentation:

```text
ml/train_capacity.py

ml/train_model.py

ml/create_capacity_dataset.py

ml/capacity_yield.py
```

These scripts are not required during normal application execution.

The trained models are stored in:

```text
ml/models/
```

---

# 🔬 Analysis and Validation

The following scripts are retained for model validation and explainability:

```text
ml/check_generation_sanity.py

ml/explain_capacity_shap.py

ml/explain_shap.py
```

These scripts are used for research and analysis and do not need to run during normal backend execution.

---

# 📁 Required Files

Do not remove or rename the following directories:

```text
ml/models/
```

```text
ml/results/
```

The prediction pipeline depends on files inside these directories.

Important files include:

```text
ml/models/model_capacity.pkl

ml/models/model_generation.pkl

ml/models/capacity_features.json

ml/models/generation_features.json

ml/results/capacity_monthly_yield.csv
```

---

# 🔐 Environment Variables

Do not commit sensitive credentials.

The following files should not be uploaded to GitHub:

```text
.env

venv/

__pycache__/
```

Make sure these are included in `.gitignore`.

---

# 🧪 Testing

The unified prediction pipeline has been tested successfully using:

```bash
python ml/predict.py
```

Example output:

```text
Recommended capacity: 3.766 kW

Expected monthly generation: 448.31 kWh

Recommended battery: 1.16 kWh
```

---

# 👥 Project Components

| Component | Status |
|---|---|
| Data Collection | Complete |
| Web Scraping | Complete |
| Data Cleaning | Complete |
| ETL | Complete |
| Machine Learning | Complete |
| Capacity Prediction | Complete |
| Empirical Generation Estimation | Complete |
| Battery Sizing | Complete |
| SHAP Explainability | Complete |
| Unified Prediction Pipeline | Complete |
| Backend Integration | Pending |
| Frontend Integration | Pending |

---

# 🚀 Future Improvements

Possible future improvements include:

- Real-time weather API integration
- Automatic geolocation
- Real-time solar irradiation data
- Improved generation prediction models
- Product recommendation integration
- Subsidy recommendation
- Site suitability analysis
- Cloud deployment
- Model monitoring

---

# 👩‍💻 ML and Data Engineering

Machine Learning and Data Engineering components include:

- Data collection
- Data cleaning
- ETL
- Machine learning model development
- Model evaluation
- Empirical data analysis
- Battery sizing
- Explainable AI
- Unified prediction pipeline

---

# 📌 Important Note

For production integration, the backend should use:

```text
ml/predict.py
```

The primary function is:

```python
predict_solar_system()
```

The primary generation output is:

```python
result["generation"]["predicted_monthly_generation_kwh"]
```

---

# ☀️ SolarSmart

SolarSmart combines Data Engineering, Machine Learning, empirical solar data analysis, and engineering calculations to provide practical solar energy recommendations.