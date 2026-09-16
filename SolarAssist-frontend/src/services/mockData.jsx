export const mockUsers = [
  { id: 1, name: 'Archita R.', email: 'user@demo.com', phone: '+91 9876543210', role: 'USER', is_active: true },
  { id: 2, name: 'GreenTech Solar', email: 'vendor@demo.com', phone: '+91 9823012345', role: 'VENDOR', vendorStatus: 'APPROVED', is_active: true, business_name: 'GreenTech Solar Solutions', city: 'Amravati', state: 'Maharashtra', gst_id: '27AAAAA0000A1Z5', service_area: 'Vidarbha' },
  { id: 3, name: 'SunRise Energy', email: 'sunrise@demo.com', phone: '+91 9765432109', role: 'VENDOR', vendorStatus: 'PENDING', is_active: true, business_name: 'SunRise Energy Pvt Ltd', city: 'Nagpur', state: 'Maharashtra', gst_id: '27BBBBB1111B2Z4', service_area: 'Nagpur District' },
  { id: 4, name: 'EcoVolt Power', email: 'ecovolt@demo.com', phone: '+91 9988776655', role: 'VENDOR', vendorStatus: 'APPROVED', is_active: true, business_name: 'EcoVolt Systems', city: 'Pune', state: 'Maharashtra', gst_id: '27CCCCC2222C3Z3', service_area: 'Pune & PCMC' },
  { id: 5, name: 'Admin', email: 'admin@demo.com', phone: '+91 9000000000', role: 'ADMIN', is_active: true },
];

export const mockProducts = [
  { id: 101, name: 'SolarAssist Residential Kit 3kW', category: 'Panel Kit', capacity_kw: 3.0, price: 156000, description: 'Mono PERC 440W panels with 3kW On-Grid String Inverter.', warranty_years: 10, is_available: true },
  { id: 102, name: 'SolarAssist Premium Kit 5kW', category: 'Panel Kit', capacity_kw: 5.0, price: 260000, description: 'Bi-facial half-cut solar panels with smart WiFi inverter.', warranty_years: 12, is_available: true },
  { id: 103, name: 'Lithium Storage Battery 5kWh', category: 'Battery', capacity_kw: 5.0, price: 125000, description: 'LiFePO4 wall-mounted battery unit with 6000 cycle life.', warranty_years: 5, is_available: true },
  { id: 104, name: 'Complete Rooftop Installation & Net-Metering Service', category: 'Installation', capacity_kw: null, price: 25000, description: 'Full turn-key installation including MSEDCL net-metering paperwork.', warranty_years: 5, is_available: true },
  { id: 105, name: 'Annual Solar Panel Cleaning & Maintenance', category: 'Maintenance', capacity_kw: null, price: 4999, description: 'Quarterly panel washing, electrical safety check, and yield audit.', warranty_years: 1, is_available: true },
];

export const mockVendorRequests = [
  { id: 1, customer: 'Rohan P.', email: 'rohan@example.com', phone: '+91 9811223344', location: 'Amravati', capacity: '5 kW', service: '5kW Rooftop Package', status: 'PENDING', date: '2026-09-08', user_notes: 'Need quote with battery storage.' },
  { id: 2, customer: 'Sneha K.', email: 'sneha@example.com', phone: '+91 9822334455', location: 'Nagpur', capacity: '3 kW', service: '3kW Residential Kit', status: 'ACCEPTED', date: '2026-09-05', user_notes: 'Flat rooftop, ready for inspection.' },
  { id: 3, customer: 'Amit V.', email: 'amit@example.com', phone: '+91 9833445566', location: 'Amravati', capacity: '4 kW', service: 'Installation & Net-metering', status: 'COMPLETED', date: '2026-08-28', user_notes: 'Installation completed on 2nd Sep.' },
  { id: 4, customer: 'Pooja M.', email: 'pooja@example.com', phone: '+91 9844556677', location: 'Wardha', capacity: '2 kW', service: '2kW On-Grid Kit', status: 'REJECTED', date: '2026-08-20', user_notes: 'Location out of immediate coverage.' },
];

export const mockVendorReports = {
  total_sales_inr: 441000,
  conversion_rate_pct: 75.0,
  active_products_count: 5,
  completed_projects_count: 8,
  monthly_breakdown: [
    { month: 'Apr', sales: 65000, jobs: 2 },
    { month: 'May', sales: 95000, jobs: 3 },
    { month: 'Jun', sales: 120000, jobs: 4 },
    { month: 'Jul', sales: 85000, jobs: 3 },
    { month: 'Aug', sales: 110000, jobs: 4 },
    { month: 'Sep', sales: 156000, jobs: 5 },
  ]
};

export const mockAdminStats = {
  totalUsers: 1250,
  registeredVendors: 85,
  pendingApprovals: 12,
  plansGenerated: 2480,
};

export const mockAdminAnalytics = {
  platform_summary: {
    total_users: 1250,
    total_vendors: 85,
    total_quote_requests: 640,
    total_capacity_recommended_kw: 14250.0,
    total_co2_reduced_tons: 1120.5
  },
  monthly_user_growth: [
    { month: 'Apr', users: 120, vendors: 8 },
    { month: 'May', users: 210, vendors: 14 },
    { month: 'Jun', users: 340, vendors: 22 },
    { month: 'Jul', users: 520, vendors: 35 },
    { month: 'Aug', users: 890, vendors: 58 },
    { month: 'Sep', users: 1250, vendors: 85 },
  ],
  top_regions: [
    { city: 'Amravati', vendors: 12, requests: 140 },
    { city: 'Nagpur', vendors: 24, requests: 320 },
    { city: 'Pune', vendors: 38, requests: 580 },
    { city: 'Mumbai', vendors: 45, requests: 790 }
  ]
};

export const mockSystemSettings = [
  { id: 1, key: 'subsidy_max_cap_inr', value: '78000', description: 'Maximum PM Surya Ghar subsidy amount (₹)' },
  { id: 2, key: 'default_tariff_inr', value: '7.50', description: 'Default electricity tariff rate per kWh (₹)' },
  { id: 3, key: 'grid_co2_factor', value: '0.82', description: 'kg CO2 per kWh grid electricity' },
  { id: 4, key: 'platform_fee_percent', value: '2.5', description: 'Vendor commission fee percentage (%)' },
];

export const mockRecommendation = {
  capacity_kw: 3.5,
  recommended_capacity_kw: 3.5,
  capacity_limited: false,
  annual_generation_kwh: 5075,
  monthly_generation_kwh: 422,
  gross_cost_inr: 182000,
  subsidy_inr: 78000,
  net_cost_inr: 104000,
  annual_savings_inr: 38062,
  payback_years: 2.7,
  panel_config: '8 x 440W High Efficiency Mono PERC Panels',
  battery_spec: '5.2 kWh Lithium-ion Storage',
  shap_factors: [
    { factor: 'Monthly Energy Consumption', influence: 88, label: 'High Influence' },
    { factor: 'Roof Area', influence: 64, label: 'Medium Constraint' },
    { factor: 'Solar Irradiance', influence: 58, label: 'Moderate Positive' },
    { factor: 'Budget Limit', influence: 42, label: 'Neutral' },
    { factor: 'Grid Tariff Rate', influence: 35, label: 'Positive Driver' }
  ],
  matched_vendors: [
    { id: 1, name: 'GreenTech Solar Solutions', city: 'Amravati', phone: '+91 9823012345', service_area: 'Vidarbha Region', rating: 4.8 },
    { id: 2, name: 'SunRise Energy Systems', city: 'Nagpur', phone: '+91 9765432109', service_area: 'Maharashtra State', rating: 4.6 }
  ]
};

export const mockFinancials = {
  capacity_kw: 3.5,
  gross_cost: 182000,
  subsidy: 78000,
  net_cost: 104000,
  monthly_bill_before: 3200,
  estimated_monthly_bill_after: 28.0,
  annual_savings: 38062,
  payback_years: 2.7,
  roi_25_year_percent: 1145.2,
  net_25yr_savings: 1191000,
  annual_co2_tons_offset: 4.16,
  trees_equivalent: 187,
  projections: Array.from({ length: 25 }, (_, i) => {
    const yr = i + 1;
    const yrSave = 38062 * Math.pow(1.05, i);
    return { year: `Yr ${yr}`, net_balance: Math.round(-104000 + (38062 * ((Math.pow(1.05, yr) - 1) / 0.05))), yearly_savings: Math.round(yrSave) };
  })
};