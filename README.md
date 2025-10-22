# 🚛 Bakhtera1 - Advanced Freight Forwarding Management System

A comprehensive freight forwarding management system built with React.js and Material-UI, designed for Indonesian logistics companies.

## ✨ Features

### 🏢 Customer Management
- Customer registration with validation
- Contact person details with auto-formatting
- NPWP validation and formatting
- Credit limit management
- Payment terms configuration

### 📦 Sales Order Management
- Order creation and tracking
- Customer and vendor linking
- Cargo item management
- Cost calculation and pricing
- Status tracking (Draft → Confirmed → In Transit → Delivered)

### 🏭 Vendor Management
- Vendor registration and profiles
- Service type classification
- Performance rating system
- Contract management
- Compliance tracking

### 💰 Cost Management
- Operational cost tracking
- Selling cost management
- Margin calculation
- Multi-currency support (IDR, USD, SGD)
- Cost analysis and reporting

### 📋 Purchase Order Management
- PO creation and approval workflow
- Vendor quotation management
- Itemized cost breakdown
- PDF and Excel export functionality

### 📊 Reporting & Analytics
- Dashboard with key metrics
- Export capabilities (PDF, Excel)
- Financial reporting
- Performance analytics

### 🔧 System Features
- Real-time form validation
- Auto-formatting for Indonesian formats (NPWP, Phone)
- Error handling and user feedback
- Responsive design
- Local storage with fallback mechanisms

## 🛠️ Technology Stack

- **Frontend**: React.js 18.2.0
- **UI Framework**: Material-UI (MUI) 5.11.0
- **Icons**: Material-UI Icons
- **PDF Generation**: jsPDF with AutoTable
- **Excel Export**: XLSX (SheetJS)
- **Date Handling**: date-fns
- **Build Tool**: Create React App
- **Language**: JavaScript (ES6+)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bakhtera-one.git
   cd bakhtera-one
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

### Alternative: GitHub Pages

1. **Install gh-pages package**
   ```bash
   npm install --save gh-pages
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
bakhtera-one/
├── public/
│   └── index.html              # Main HTML template
├── src/
│   ├── components/             # React components
│   │   ├── CustomerManagement.js
│   │   ├── VendorManagement.js
│   │   ├── SalesOrder.js
│   │   ├── PurchaseOrder.js
│   │   ├── InvoiceManagement.js
│   │   ├── CostManagement.js
│   │   ├── Dashboard.js
│   │   └── ErrorBoundary.js
│   ├── services/               # Business logic services
│   │   ├── localStorage.js     # Data persistence
│   │   ├── dataSync.js         # Data synchronization
│   │   ├── currencyUtils.js    # Currency formatting
│   │   └── errorHandler.js     # Error handling
│   ├── hooks/                  # Custom React hooks
│   ├── data/                   # Static data and constants
│   ├── App.js                  # Main app component
│   └── index.js                # App entry point
├── build/                      # Production build (auto-generated)
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=your_api_url_here
REACT_APP_ENVIRONMENT=production
```

### Build Configuration
The app is configured for optimal performance with:
- Code splitting and lazy loading
- Service worker for caching
- Optimized bundle size
- Indonesian localization

## 📊 Data Models

### Customer
```javascript
{
  id: "string",
  name: "PT. Global Trade Indonesia",
  type: "Corporation",
  email: "contact@globaltrade.co.id",
  phone: "+62-21-555-0123",
  address: "Jl. Sudirman No. 123, Jakarta",
  taxId: "01.234.567.8-901.000", // NPWP
  creditLimit: 100000000,
  paymentTerms: "Net 30",
  contactPerson: "Budi Santoso",
  contactPersonPhone: "+62-811-1234-5678",
  contactPersonEmail: "budi.santoso@globaltrade.co.id",
  industry: "Electronics",
  website: "www.globaltrade.co.id",
  notes: "Major electronics importer"
}
```

### Sales Order
```javascript
{
  id: "string",
  orderNumber: "SO-2024-001",
  customerId: "customer_id",
  origin: "Jakarta, Indonesia",
  destination: "Singapore",
  cargoType: "Electronics",
  weight: 1500, // kg
  volume: 8.5,  // cbm
  value: 75000000, // IDR
  serviceType: "Sea Freight",
  estimatedCost: 8500000,
  sellingPrice: 12000000,
  margin: 3500000,
  status: "Confirmed"
}
```

## 🎨 UI Components

### Material-UI Integration
- Custom theme with Indonesian color palette
- Responsive design for mobile and desktop
- Consistent typography and spacing
- Accessible components

### Form Validation
- Real-time validation feedback
- Indonesian format validation (NPWP, Phone)
- Auto-formatting for better UX
- Comprehensive error messages

## 🔒 Security Features

- Input validation and sanitization
- XSS protection
- Secure localStorage usage
- Error boundary implementation

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Progressive Web App ready

## 🔄 Data Persistence

- localStorage for offline capability
- Data synchronization service
- Automatic data backup
- Conflict resolution

## 📈 Performance

- Code splitting and lazy loading
- Optimized bundle size
- Efficient re-renders
- Caching strategies

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- React.js community for the framework
- Indonesian logistics industry for requirements

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

---

**Built with ❤️ for Indonesian Freight Forwarding Industry**"Update: $(date)" 
"Last deployment fix: $(date)" 
