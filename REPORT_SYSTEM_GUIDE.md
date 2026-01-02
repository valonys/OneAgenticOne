# 📊 AgenticOne Report System Guide

## Overview

The AgenticOne Report System provides comprehensive, AI-powered report generation for all specialist types. Each specialist can generate professional PDF-ready reports from analysis results, with multiple conversion methods and customizable templates.

## 🎯 Features

### ✅ **What's Implemented**
- **Professional Report Generation** - AI-enhanced analysis reports for all specialists
- **Multiple PDF Conversion Methods** - 4 different approaches for maximum compatibility
- **Specialist-Specific Templates** - Customized report formats for each specialist type
- **Real-time Report Generation** - Instant report creation from analysis results
- **PDF Download & Preview** - Direct download and browser preview capabilities
- **Markdown to PDF Conversion** - Standalone conversion tool
- **Report Management** - List, download, and manage generated reports

### 🔧 **Specialist Types Supported**
- **Corrosion Engineer** - Corrosion analysis and prevention reports
- **Subsea Engineer** - Subsea systems and operations reports  
- **Discipline Head** - Project coordination and decision-making reports
- **Methods Specialist** - Engineering methods and procedures reports

## 🚀 Quick Start

### 1. **Generate a Report via API**

```bash
# Generate a corrosion engineer report
curl -X POST "http://localhost:8000/api/reports/generate" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "specialist_type=corrosion_engineer" \
  -d "customer_request=Analyze corrosion in storage tank" \
  -d "user_email=user@example.com" \
  -d "analysis_data={\"findings\":[\"Severe corrosion detected\",\"Material degradation observed\"],\"recommendations\":[\"Immediate inspection required\",\"Apply protective coating\"]}"
```

### 2. **Upload Documents for Analysis**

```bash
# Generate report from uploaded files
curl -X POST "http://localhost:8000/api/reports/generate-from-upload" \
  -F "specialist_type=corrosion_engineer" \
  -F "customer_request=Analyze uploaded corrosion data" \
  -F "user_email=user@example.com" \
  -F "files=@corrosion_report.pdf" \
  -F "files=@inspection_data.xlsx"
```

### 3. **List Available Reports**

```bash
# Get list of all generated reports
curl -X GET "http://localhost:8000/api/reports/list"
```

### 4. **Download a Report**

```bash
# Download a specific report
curl -X GET "http://localhost:8000/api/reports/download/corrosion_engineer_report_20241219_143022.pdf"
```

## 📋 API Endpoints

### **Report Generation**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/generate` | POST | Generate report from analysis data |
| `/api/reports/generate-from-upload` | POST | Generate report from uploaded files |
| `/api/reports/convert-markdown` | POST | Convert Markdown to PDF |

### **Report Management**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/list` | GET | List all available reports |
| `/api/reports/download/{filename}` | GET | Download specific report |
| `/api/reports/preview/{filename}` | GET | Preview report in browser |
| `/api/reports/templates/{specialist_type}` | GET | Get report template for specialist |

### **Health & Status**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/health` | GET | Check report service health |

## 🎨 Report Templates

### **Corrosion Engineer Template**
```json
{
  "title": "Corrosion Analysis Report",
  "sections": [
    "Executive Summary",
    "Corrosion Assessment", 
    "Material Analysis",
    "Environmental Factors",
    "Risk Assessment",
    "Mitigation Recommendations",
    "Monitoring Plan",
    "Technical Specifications"
  ],
  "fields": [
    "corrosion_type",
    "severity_level",
    "affected_areas", 
    "material_composition",
    "environmental_conditions",
    "inspection_date",
    "recommended_actions"
  ]
}
```

### **Subsea Engineer Template**
```json
{
  "title": "Subsea Engineering Report",
  "sections": [
    "Executive Summary",
    "Subsea System Analysis",
    "Equipment Assessment",
    "Installation Analysis", 
    "Operational Readiness",
    "Risk Assessment",
    "Maintenance Recommendations",
    "Technical Specifications"
  ]
}
```

## 🔄 PDF Conversion Methods

### **Method 1: WeasyPrint (Recommended)**
```bash
pip install weasyprint markdown2
python md2pdf_converter.py -m 1 input.md
```
**Best for:** Professional styling, CSS control, no external tools needed

### **Method 2: Pandoc**
```bash
pip install pypandoc
# Also install Pandoc from https://pandoc.org
python md2pdf_converter.py -m 2 input.md
```
**Best for:** Academic papers, automatic table of contents

### **Method 3: PDFKit**
```bash
pip install pdfkit
# Also install wkhtmltopdf
python md2pdf_converter.py -m 3 input.md
```
**Best for:** Good balance of features and ease of use

### **Method 4: ReportLab**
```bash
pip install reportlab
python md2pdf_converter.py -m 4 input.md
```
**Best for:** Pure Python solution, no external dependencies

## 📝 Report Structure

### **Professional HTML Report Features**
- **Header Section** - Title, date, specialist, customer info
- **Executive Summary** - AI-enhanced overview with risk assessment
- **Detailed Analysis** - Comprehensive findings and technical details
- **Recommendations** - Immediate and long-term action items
- **Technical Specifications** - Analysis method and validation status
- **Professional Styling** - Color-coded sections, responsive design

### **PDF Output Features**
- **Print-Optimized Layout** - A4 page size with proper margins
- **Professional Typography** - Segoe UI font family
- **Color-Coded Risk Levels** - High (red), Medium (yellow), Low (green)
- **Table Formatting** - Alternating row colors, proper borders
- **Page Breaks** - Logical section breaks for printing
- **Header/Footer** - Page numbers and report identification

## 🛠️ Installation & Setup

### **1. Install Dependencies**
```bash
cd /Users/atalibamiguel/Documents/AgenticOne/agenticone/agenticone-backend
source venv/bin/activate
pip install -r requirements.txt
```

### **2. Required Packages**
```
weasyprint==60.2          # PDF generation (recommended)
markdown==3.5.1           # Markdown processing
jinja2==3.1.2             # Template engine
pypandoc==1.11            # Pandoc integration
pdfkit==1.0.0             # PDFKit integration
reportlab==4.0.7          # ReportLab integration
```

### **3. Start the Server**
```bash
cd /Users/atalibamiguel/Documents/AgenticOne/agenticone/agenticone-backend
source venv/bin/activate
export GOOGLE_APPLICATION_CREDENTIALS=/Users/atalibamiguel/Documents/AgenticOne/agenticone-ed918-9678627db0c2.json
export GOOGLE_CLIENT_SECRET=your-google-client-secret-here
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Usage Examples

### **Example 1: Corrosion Analysis Report**

```python
import requests

# Generate corrosion report
response = requests.post("http://localhost:8000/api/reports/generate", data={
    "specialist_type": "corrosion_engineer",
    "customer_request": "Analyze corrosion in offshore platform",
    "user_email": "engineer@company.com",
    "analysis_data": json.dumps({
        "findings": [
            "Severe pitting corrosion in carbon steel components",
            "Galvanic corrosion at dissimilar metal joints",
            "Stress corrosion cracking in stainless steel welds"
        ],
        "recommendations": [
            "Immediate cathodic protection system installation",
            "Replace affected components with corrosion-resistant alloys",
            "Implement regular inspection schedule"
        ],
        "technical_details": "Analysis based on visual inspection and material testing"
    })
})

report = response.json()
print(f"Report ID: {report['report']['report_id']}")
print(f"PDF Path: {report['report']['pdf_path']}")
```

### **Example 2: Convert Markdown to PDF**

```python
# Using the standalone converter
from md2pdf_converter import MarkdownToPDFConverter

converter = MarkdownToPDFConverter()
success = converter.convert("corrosion_report.md", "output.pdf", method="1")

if success:
    print("✅ PDF created successfully!")
else:
    print("❌ Conversion failed")
```

### **Example 3: Interactive Conversion**

```bash
# Run interactive converter
python md2pdf_converter.py -i

# Or with specific file
python md2pdf_converter.py corrosion_report.md -o professional_report.pdf
```

## 🎯 Frontend Integration

### **Chat Interface Integration**
When a customer requests a report in the chat interface:

1. **Specialist analyzes the request**
2. **AI generates enhanced analysis**
3. **Report is automatically created**
4. **PDF is generated and made available for download**
5. **Customer receives download link**

### **Report Display in Canvas**
```javascript
// Example frontend integration
async function generateReport(specialistType, analysisData, customerRequest) {
    const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            specialist_type: specialistType,
            customer_request: customerRequest,
            user_email: getCurrentUserEmail(),
            analysis_data: JSON.stringify(analysisData)
        })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
        // Display report in canvas
        displayReportInCanvas(result.report.html_content);
        
        // Provide download link
        showDownloadLink(result.report.pdf_path);
    }
}
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Required for report generation
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLIENT_SECRET=your-client-secret

# Optional report settings
REPORT_TEMPLATE_PATH=templates/
REPORT_OUTPUT_PATH=reports/
```

### **Report Customization**
- **Templates** - Modify HTML templates in `app/services/report_generator.py`
- **Styling** - Update CSS in the `_generate_html_report` method
- **Fields** - Add new fields to specialist templates
- **Sections** - Customize report sections per specialist type

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Missing Dependencies**
```bash
# Install missing packages
pip install weasyprint markdown jinja2
```

#### **2. PDF Generation Fails**
```bash
# Try different conversion method
python md2pdf_converter.py -m 2 input.md  # Use Pandoc
python md2pdf_converter.py -m 3 input.md  # Use PDFKit
```

#### **3. WeasyPrint Issues**
```bash
# Install system dependencies (macOS)
brew install cairo pango gdk-pixbuf libffi

# Or use alternative method
python md2pdf_converter.py -m 4 input.md  # Use ReportLab
```

#### **4. Server Won't Start**
```bash
# Check for missing modules
pip install python-multipart
pip install -r requirements.txt
```

### **Health Checks**
```bash
# Check report service health
curl -X GET "http://localhost:8000/api/reports/health"

# Check available reports
curl -X GET "http://localhost:8000/api/reports/list"
```

## 📈 Future Enhancements

### **Planned Features**
- **Email Integration** - Send reports directly via email
- **Report Scheduling** - Automated report generation
- **Custom Templates** - User-defined report templates
- **Batch Processing** - Multiple report generation
- **Report Analytics** - Usage tracking and insights
- **Advanced Styling** - More customization options

### **Integration Opportunities**
- **Slack/Teams** - Direct report sharing
- **Cloud Storage** - Automatic backup to Google Drive
- **Version Control** - Report versioning and history
- **Collaboration** - Multi-user report editing

## 📞 Support

### **Getting Help**
- **API Documentation** - Available at `http://localhost:8000/docs`
- **Health Endpoints** - Check service status
- **Log Files** - Review server logs for errors
- **Template Issues** - Verify specialist type and data format

### **Report System Status**
```bash
# Check all services
curl -X GET "http://localhost:8000/health"

# Check report service specifically  
curl -X GET "http://localhost:8000/api/reports/health"
```

---

## 🎉 **Ready to Generate Professional Reports!**

The AgenticOne Report System is now fully operational with:
- ✅ **AI-Enhanced Analysis** - Real Google Cloud Vertex AI integration
- ✅ **Professional PDF Generation** - Multiple conversion methods
- ✅ **Specialist-Specific Templates** - Customized for each expert type
- ✅ **Real-time Generation** - Instant report creation
- ✅ **Download & Preview** - Complete report management

**Your specialists can now generate comprehensive, professional reports that customers can download as PDFs directly from the chat interface!**
