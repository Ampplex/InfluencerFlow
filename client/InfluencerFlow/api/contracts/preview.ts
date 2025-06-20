import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ContractTemplate {
  influencer_name: string;
  brand_name: string;
  rate: number;
  timeline: string;
  deliverables: string;
  payment_terms: string;
  special_requirements?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contractData: ContractTemplate = req.body;

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let yPosition = height - 50;

    // Helper function to add text
    const addText = (text: string, size = 12, isBold = false, color = rgb(0, 0, 0)) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size,
        font: isBold ? boldFont : font,
        color,
      });
      yPosition -= size + 10;
    };

    // Contract Header
    addText('INFLUENCER MARKETING CONTRACT', 18, true, rgb(0, 0.2, 0.8));
    yPosition -= 10;

    // Contract Details
    addText(`Brand: ${contractData.brand_name}`, 14, true);
    addText(`Influencer: ${contractData.influencer_name}`, 14, true);
    addText(`Compensation: $${contractData.rate.toLocaleString()}`, 14, true);
    yPosition -= 10;

    addText('TERMS AND CONDITIONS', 14, true);
    addText(`Timeline: ${contractData.timeline}`);
    addText(`Deliverables: ${contractData.deliverables}`);
    addText(`Payment Terms: ${contractData.payment_terms}`);
    
    if (contractData.special_requirements) {
      addText(`Special Requirements: ${contractData.special_requirements}`);
    }

    yPosition -= 20;
    addText('This contract is legally binding upon signature by both parties.', 10);
    
    // Signature lines
    yPosition -= 40;
    addText('Brand Signature: _________________________    Date: __________');
    yPosition -= 30;
    addText('Influencer Signature: ____________________    Date: __________');

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=contract-preview.pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract preview' });
  }
}