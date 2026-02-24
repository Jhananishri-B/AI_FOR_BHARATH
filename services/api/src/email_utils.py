"""
Email utility for sending certificates and notifications
"""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from pathlib import Path

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@learnquest.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "LearnQuest Certifications")


def send_certificate_email(
    to_email: str,
    user_name: str,
    cert_name: str,
    difficulty: str,
    score: float,
    pass_percentage: float,
    date: str,
    cert_id: str,
    certificate_path: Optional[str] = None
) -> bool:
    """
    Send certificate via email with PDF attachment
    
    Args:
        to_email: Recipient email address
        user_name: Student's name
        cert_name: Certification name
        difficulty: Easy/Medium/Hard
        score: Final score
        pass_percentage: Pass threshold
        date: Completion date
        cert_id: Certificate ID
        certificate_path: Path to PDF certificate file
        
    Returns:
        bool: True if sent successfully, False otherwise
    """
    
    # Email subject
    subject = f"🎉 Congratulations! Your {cert_name} Certificate"
    
    # Email body (HTML)
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .header p {{
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                background: white;
                padding: 40px 30px;
                border: 1px solid #ddd;
                border-top: none;
                border-radius: 0 0 10px 10px;
            }}
            .greeting {{
                font-size: 18px;
                margin-bottom: 20px;
            }}
            .stats {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }}
            .stat-row {{
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #ddd;
            }}
            .stat-row:last-child {{
                border-bottom: none;
            }}
            .stat-label {{
                font-weight: bold;
                color: #666;
            }}
            .stat-value {{
                color: #333;
            }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white !important;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
                text-align: center;
            }}
            .button:hover {{
                background: #5568d3;
            }}
            .note {{
                background: #e7f3ff;
                padding: 15px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #f0f0f0;
                color: #666;
                font-size: 14px;
            }}
            .social {{
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations {user_name}!</h1>
                <p>You've earned your certificate</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear {user_name},
                </div>
                
                <p>
                    Congratulations on successfully completing the <strong>{cert_name}</strong> 
                    certification at <strong>{difficulty}</strong> level!
                </p>
                
                <div class="stats">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #667eea;">
                        📊 Your Achievement Summary
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Score:</span>
                        <span class="stat-value">{score}% (Required: {pass_percentage}%)</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value">{date}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Level:</span>
                        <span class="stat-value">{difficulty}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Certificate ID:</span>
                        <span class="stat-value">{cert_id}</span>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <p style="font-size: 16px; margin: 20px 0;">
                        <strong>Your certificate is attached to this email</strong>
                    </p>
                </div>
                
                <div class="note">
                    <strong>💡 Pro Tip:</strong> Share your achievement on LinkedIn and other social media 
                    platforms to showcase your skills to potential employers!
                </div>
                
                <p style="margin-top: 30px;">
                    Your certificate is a testament to your dedication and hard work. Keep learning 
                    and exploring new certifications on LearnQuest to further advance your skills!
                </p>
                
                <div class="social">
                    <p style="font-weight: bold; margin-bottom: 10px;">Share Your Success:</p>
                    <p style="font-size: 14px; color: #666;">
                        "I just earned my {cert_name} certification from LearnQuest! 
                        Score: {score}% 🎓 #LearnQuest #Certification #ProfessionalDevelopment"
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin: 5px 0;">
                        <strong>LearnQuest Team</strong>
                    </p>
                    <p style="margin: 5px 0; font-size: 12px;">
                        Keep learning, keep growing! 🚀
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version (fallback)
    text_body = f"""
    Congratulations {user_name}!
    
    You've successfully completed the {cert_name} certification at {difficulty} level!
    
    Your Achievement:
    - Score: {score}% (Required: {pass_percentage}%)
    - Completed: {date}
    - Level: {difficulty}
    - Certificate ID: {cert_id}
    
    Your certificate is attached to this email.
    
    Share your achievement on social media to showcase your skills!
    
    Best regards,
    LearnQuest Team
    """
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach text and HTML parts
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Attach certificate PDF if provided
        if certificate_path and Path(certificate_path).exists():
            with open(certificate_path, 'rb') as f:
                pdf_attachment = MIMEApplication(f.read(), _subtype='pdf')
                pdf_attachment.add_header(
                    'Content-Disposition', 
                    'attachment', 
                    filename=f'Certificate_{cert_id}.pdf'
                )
                msg.attach(pdf_attachment)
        
        # Send email
        if not SMTP_USER or not SMTP_PASSWORD:
            # For development: print email content instead of sending
            print(f"\n{'='*60}")
            print("EMAIL WOULD BE SENT (SMTP not configured):")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Certificate attached: {certificate_path if certificate_path else 'No'}")
            print(f"{'='*60}\n")
            return True
        
        # Send via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Error sending email to {to_email}: {e}")
        return False


def send_test_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send a simple test email
    
    Args:
        to_email: Recipient email
        subject: Email subject
        body: Email body (HTML)
        
    Returns:
        bool: True if sent successfully
    """
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        if not SMTP_USER or not SMTP_PASSWORD:
            print(f"\nTest email would be sent to: {to_email}")
            print(f"Subject: {subject}")
            return True
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
        
    except Exception as e:
        print(f"Error sending test email: {e}")
        return False
