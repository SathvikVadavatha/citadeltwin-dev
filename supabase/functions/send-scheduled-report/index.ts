import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  projectName: string;
  dateGenerated: string;
  data: any[];
  summary: {
    totalItems: number;
    successRate?: number;
    averageScore?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, deliveryId } = await req.json();
    const startTime = Date.now();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing scheduled report: reportId=${reportId}, deliveryId=${deliveryId}`);

    // Get the report configuration
    const { data: report, error: reportError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error(`Report not found: ${reportError?.message}`);
    }

    // Validate recipients before doing any work
    const recipients = Array.isArray(report.recipients)
      ? report.recipients.filter((r: string) => typeof r === 'string' && r.trim().length > 0)
      : [];

    if (recipients.length === 0) {
      console.error(`Report "${report.name}" has no valid recipients — skipping.`);

      await supabase.rpc('complete_report_delivery', {
        delivery_id: deliveryId,
        delivery_status: 'failed',
        error_msg: 'No valid recipients configured for this report.',
      });

      return new Response(
        JSON.stringify({ success: false, error: 'No valid recipients configured.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate mock report data based on report type
    const reportData = await generateReportData(report.report_type, report.filters);
    
    // Generate report content and attachments
    let reportContent: string | Uint8Array;
    let fileExtension: string;
    let mimeType: string;
    let attachmentContent: Uint8Array;

    switch (report.delivery_format) {
      case 'csv':
        reportContent = generateCSVContent(reportData);
        fileExtension = 'csv';
        mimeType = 'text/csv';
        attachmentContent = new TextEncoder().encode(reportContent);
        break;
      case 'json':
        reportContent = JSON.stringify(reportData, null, 2);
        fileExtension = 'json';
        mimeType = 'application/json';
        attachmentContent = new TextEncoder().encode(reportContent);
        break;
      case 'pdf':
        reportContent = generatePDFContent(reportData, report);
        fileExtension = 'pdf';
        mimeType = 'application/pdf';
        attachmentContent = reportContent as Uint8Array;
        break;
      default: // html
        reportContent = generateHTMLContent(reportData, report);
        fileExtension = 'html';
        mimeType = 'text/html';
        attachmentContent = new TextEncoder().encode(reportContent);
        break;
    }

    // Check file size (35MB limit)
    const fileSize = attachmentContent.length;
    const maxFileSize = 35 * 1024 * 1024; // 35MB in bytes
    
    if (fileSize > maxFileSize) {
      console.error(`Report file size (${fileSize} bytes) exceeds 35MB limit`);
      
      // Mark delivery as failed due to file size
      await supabase
        .rpc('complete_report_delivery', {
          delivery_id: deliveryId,
          delivery_status: 'failed',
          error_msg: `Report file size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds 35MB attachment limit`
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Report file size exceeds 35MB limit',
          fileSize,
          maxFileSize
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const fileName = `${report.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    
    // Create dynamic subject line
    const frequencyText = report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1);
    const reportTypeText = report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const emailSubject = `${frequencyText} ${reportTypeText} Report`;

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send email to all recipients with attachment
    try {
      console.log(`Sending report email to ${recipients.join(', ')} with subject: ${emailSubject}`);
      
      // Convert attachment to base64 for Resend
      const base64Content = btoa(String.fromCharCode(...attachmentContent));
      
      const emailResponse = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipients, // use validated recipients list
        subject: emailSubject,
        html: generateEmailContent(reportData, report),
        attachments: [
          {
            filename: fileName,
            content: base64Content,
            contentType: mimeType,
          }
        ]
      });

      if (emailResponse.error) {
        throw new Error(emailResponse.error.message);
      }

      console.log(`Report email sent successfully to ${recipients.length} recipients`);
      
      const executionTime = Date.now() - startTime;

      // Update delivery record
      const { error: updateError } = await supabase
        .rpc('complete_report_delivery', {
          delivery_id: deliveryId,
          delivery_status: 'sent',
          file_path_val: fileName,
          error_msg: null,
          recipients_sent_val: JSON.stringify(report.recipients),
          execution_time: executionTime
        });

      if (updateError) {
        console.error('Error updating delivery record:', updateError);
      }

      console.log(`Report delivery completed: ${report.recipients.length}/${report.recipients.length} recipients successful`);

      return new Response(
        JSON.stringify({
          success: true,
          deliveryId,
          reportName: report.name,
          subject: emailSubject,
          recipientsSent: report.recipients.length,
          totalRecipients: report.recipients.length,
          failedRecipients: [],
          executionTime,
          fileSize,
          fileName,
          message: `Report sent successfully to ${report.recipients.length} recipients with attachment.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (emailError) {
      console.error('Failed to send report email:', emailError);
      
      const executionTime = Date.now() - startTime;
      const err = emailError instanceof Error ? emailError : new Error(String(emailError));
      const errorMessage = `Failed to send email: ${err.message}`;

      // Update delivery record with error
      const { error: updateError } = await supabase
        .rpc('complete_report_delivery', {
          delivery_id: deliveryId,
          delivery_status: 'failed',
          error_msg: errorMessage,
          execution_time: executionTime
        });

      if (updateError) {
        console.error('Error updating delivery record:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          deliveryId,
          reportName: report.name,
          recipientsSent: 0,
          totalRecipients: report.recipients.length,
          failedRecipients: report.recipients.map((r: string) => ({ recipient: r, error: err.message })),
          executionTime,
          fileSize,
          fileName
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

  } catch (error) {
    console.error('Error in send-scheduled-report function:', error);
    
    // Try to update delivery record with error status if we have deliveryId
    try {
      const { deliveryId } = await req.json();
      if (deliveryId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .rpc('complete_report_delivery', {
            delivery_id: deliveryId,
            delivery_status: 'failed',
            error_msg: error instanceof Error ? error.message : String(error)
          });
      }
    } catch (updateError) {
      console.error('Error updating delivery record with error:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function generatePDFContent(reportData: ReportData, report: any): Uint8Array {
  // Simple PDF generation using basic PDF format
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length ${generatePDFContentStream(reportData, report).length}
>>
stream
${generatePDFContentStream(reportData, report)}
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
0000000${(400 + generatePDFContentStream(reportData, report).length).toString().padStart(3, '0')} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${450 + generatePDFContentStream(reportData, report).length}
%%EOF`;

  return new TextEncoder().encode(pdfContent);
}

function generatePDFContentStream(reportData: ReportData, report: any): string {
  const frequencyText = report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1);
  const reportTypeText = report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  
  let yPos = 750;
  let content = 'BT\n/F1 16 Tf\n50 750 Td\n';
  
  // Title
  content += `(${report.name}) Tj\n`;
  yPos -= 30;
  content += `0 -30 Td\n/F1 12 Tf\n`;
  
  // Report info
  content += `(Generated: ${new Date(reportData.dateGenerated).toLocaleString()}) Tj\n`;
  content += `0 -20 Td\n(Type: ${reportTypeText}) Tj\n`;
  content += `0 -20 Td\n(Frequency: ${frequencyText}) Tj\n`;
  yPos -= 60;
  
  // Summary section
  content += `0 -30 Td\n/F1 14 Tf\n(Summary) Tj\n`;
  content += `0 -25 Td\n/F1 12 Tf\n`;
  content += `(Total Items: ${reportData.summary.totalItems}) Tj\n`;
  
  if (reportData.summary.successRate) {
    content += `0 -20 Td\n(Success Rate: ${reportData.summary.successRate}%) Tj\n`;
  }
  
  if (reportData.summary.averageScore) {
    content += `0 -20 Td\n(Average Score: ${reportData.summary.averageScore}) Tj\n`;
  }
  
  yPos -= 100;
  
  // Data section
  content += `0 -30 Td\n/F1 14 Tf\n(Data) Tj\n`;
  content += `0 -25 Td\n/F1 10 Tf\n`;
  
  // Add first few data rows (limit to prevent PDF from getting too large)
  const dataToShow = reportData.data.slice(0, 10);
  dataToShow.forEach((row, index) => {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const rowText = `${index + 1}: ${keys[0]}: ${values[0]}`;
    content += `(${rowText.substring(0, 60)}) Tj\n0 -15 Td\n`;
  });
  
  content += 'ET';
  return content;
}

async function generateReportData(reportType: string, filters: any): Promise<ReportData> {
  const now = new Date();
  
  // Generate mock data based on report type
  let data: any[] = [];
  let summary: any = {};

  switch (reportType) {
    case 'performance':
      data = Array.from({ length: 10 }, (_, i) => ({
        metric: `Performance Metric ${i + 1}`,
        value: Math.round(Math.random() * 100),
        target: 80 + Math.round(Math.random() * 20),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }));
      summary = {
        totalItems: data.length,
        averageScore: Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length)
      };
      break;
      
    case 'compliance':
      data = Array.from({ length: 15 }, (_, i) => ({
        rule: `Compliance Rule ${i + 1}`,
        status: Math.random() > 0.2 ? 'Compliant' : 'Non-Compliant',
        lastCheck: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
      }));
      summary = {
        totalItems: data.length,
        successRate: Math.round((data.filter(item => item.status === 'Compliant').length / data.length) * 100)
      };
      break;
      
    case 'fea_analysis':
      data = Array.from({ length: 8 }, (_, i) => ({
        analysis: `FEA Analysis ${i + 1}`,
        maxStress: Math.round(Math.random() * 1000) + 100,
        maxDeflection: (Math.random() * 10).toFixed(3),
        safetyFactor: (Math.random() * 3 + 1).toFixed(2),
        status: Math.random() > 0.1 ? 'Passed' : 'Warning'
      }));
      summary = {
        totalItems: data.length,
        successRate: Math.round((data.filter(item => item.status === 'Passed').length / data.length) * 100)
      };
      break;
      
    default: // activity
      data = Array.from({ length: 12 }, (_, i) => ({
        activity: `Project Activity ${i + 1}`,
        user: `User ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        type: ['Upload', 'Analysis', 'Export', 'Review'][Math.floor(Math.random() * 4)]
      }));
      summary = {
        totalItems: data.length
      };
      break;
  }

  return {
    projectName: 'CitadelTwin Project',
    dateGenerated: now.toISOString(),
    data,
    summary
  };
}

function generateCSVContent(reportData: ReportData): string {
  if (reportData.data.length === 0) return 'No data available';
  
  const headers = Object.keys(reportData.data[0]);
  const csvRows = [
    headers.join(','),
    ...reportData.data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

function generateHTMLContent(reportData: ReportData, report: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1>${report.name}</h1>
      <p><strong>Generated:</strong> ${new Date(reportData.dateGenerated).toLocaleString()}</p>
      <p><strong>Report Type:</strong> ${report.report_type}</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Summary</h3>
        <p><strong>Total Items:</strong> ${reportData.summary.totalItems}</p>
        ${reportData.summary.successRate ? `<p><strong>Success Rate:</strong> ${reportData.summary.successRate}%</p>` : ''}
        ${reportData.summary.averageScore ? `<p><strong>Average Score:</strong> ${reportData.summary.averageScore}</p>` : ''}
      </div>
      
      <h3>Data</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #e9ecef;">
            ${Object.keys(reportData.data[0] || {}).map(key => 
              `<th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">${key}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${reportData.data.map(row => 
            `<tr>
              ${Object.values(row).map(value => 
                `<td style="padding: 8px; border: 1px solid #dee2e6;">${value}</td>`
              ).join('')}
            </tr>`
          ).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateEmailContent(reportData: ReportData, report: any): string {
  const frequencyText = report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1);
  const reportTypeText = report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${frequencyText} ${reportTypeText} Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">CitadelTwin ${frequencyText} Report</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your automated ${reportTypeText.toLowerCase()} report is ready</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;">
        <h2 style="margin-top: 0; color: #667eea;">${report.name}</h2>
        <p><strong>Generated:</strong> ${new Date(reportData.dateGenerated).toLocaleString()}</p>
        <p><strong>Report Type:</strong> ${reportTypeText}</p>
        <p><strong>Frequency:</strong> ${frequencyText}</p>
        <p><strong>Format:</strong> ${report.delivery_format.toUpperCase()}</p>
      </div>

      <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;">
        <h3 style="color: #667eea; margin-top: 0;">Report Summary</h3>
        <p><strong>Total Items:</strong> ${reportData.summary.totalItems}</p>
        ${reportData.summary.successRate ? `<p><strong>Success Rate:</strong> ${reportData.summary.successRate}%</p>` : ''}
        ${reportData.summary.averageScore ? `<p><strong>Average Score:</strong> ${reportData.summary.averageScore}</p>` : ''}
      </div>

      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin-bottom: 30px;">
        <h3 style="color: #2e7d32; margin-top: 0;">📎 Report Attachment</h3>
        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
          <strong>The complete report is attached to this email</strong> in ${report.delivery_format.toUpperCase()} format. 
          Please download and open the attachment to view the full report data and analysis.
        </p>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <p style="margin: 0; font-size: 14px; color: #1976d2;">
          <strong>Note:</strong> This is an automated ${report.frequency} report generated by CitadelTwin. 
          The complete report data is provided as an attachment for detailed analysis.
        </p>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          Generated by CitadelTwin - Civil Engineering Digital Twin Platform<br>
          © ${new Date().getFullYear()} Community Dreams Foundation
        </p>
      </div>
    </body>
    </html>
  `;
}