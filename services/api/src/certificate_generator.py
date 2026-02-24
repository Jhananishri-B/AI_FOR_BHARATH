"""
Certificate PDF generator using WeasyPrint
"""
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    print("Warning: WeasyPrint not available. PDF generation will be skipped.")


def generate_certificate_pdf(
    user_name: str,
    cert_name: str,
    difficulty: str,
    score: float,
    pass_percentage: float,
    date: str,
    cert_id: str,
    template_path: Optional[str] = None
) -> Optional[str]:
    """
    Generate a certificate PDF from HTML template
    
    Args:
        user_name: Student's name
        cert_name: Certification name
        difficulty: Easy/Medium/Hard
        score: Final score
        pass_percentage: Pass threshold
        date: Completion date
        cert_id: Certificate ID
        template_path: Path to HTML template (optional)
        
    Returns:
        str: Path to generated PDF file, or None if generation failed
    """
    
    if not WEASYPRINT_AVAILABLE:
        print("WeasyPrint not available, skipping PDF generation")
        return None
    
    try:
        # Default template path
        if not template_path:
            # Look for template in root directory or services/api
            template_candidates = [
                Path("/app/certificate_template_default.html"),  # In Docker
                Path("certificate_template_default.html"),  # Current directory
                Path("../certificate_template_default.html"),  # Parent directory
            ]
            
            for candidate in template_candidates:
                if candidate.exists():
                    template_path = str(candidate)
                    break
            
            if not template_path:
                print("Certificate template not found!")
                return None
        
        # Read template
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Replace placeholders
        html_content = html_content.replace('{{USER_NAME}}', user_name)
        html_content = html_content.replace('{{CERTIFICATION_NAME}}', cert_name)
        html_content = html_content.replace('{{DIFFICULTY}}', difficulty)
        html_content = html_content.replace('{{SCORE}}', f"{score}%")
        html_content = html_content.replace('{{PASS_PERCENTAGE}}', f"{pass_percentage}%")
        html_content = html_content.replace('{{DATE}}', date)
        html_content = html_content.replace('{{CERTIFICATE_ID}}', cert_id)
        
        # Create certificates directory
        cert_dir = Path("/app/certificates")
        cert_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate PDF filename
        safe_name = user_name.replace(' ', '_').replace('/', '_')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        pdf_filename = f"certificate_{safe_name}_{timestamp}.pdf"
        pdf_path = cert_dir / pdf_filename
        
        # Generate PDF
        print(f"Generating certificate PDF: {pdf_path}")
        HTML(string=html_content).write_pdf(str(pdf_path))
        
        print(f"Certificate PDF generated successfully: {pdf_path}")
        return str(pdf_path)
        
    except Exception as e:
        print(f"Error generating certificate PDF: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_pdf_generation():
    """Test function to verify PDF generation works"""
    pdf_path = generate_certificate_pdf(
        user_name="John Doe",
        cert_name="Python Programming",
        difficulty="MEDIUM",
        score=95.5,
        pass_percentage=70.0,
        date="January 15, 2025",
        cert_id="LQ-PYT-2025-ABC123"
    )
    
    if pdf_path:
        print(f"Test successful! PDF saved at: {pdf_path}")
        return True
    else:
        print("Test failed!")
        return False


if __name__ == "__main__":
    test_pdf_generation()
