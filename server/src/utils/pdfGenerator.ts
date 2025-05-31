import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ContractTemplate } from '../types/contract';

export async function generatePDF(data: ContractTemplate & { signature_url?: string }): Promise<Buffer> {
    // Create a new PDF document
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();
    
    // Embed the standard font
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    
    // Set some initial values
    const margin = 50;
    let currentY = height - margin;
    const lineHeight = 20;
    
    // Helper function to write text
    const writeText = (text: string, isBold = false) => {
        page.drawText(text, {
            x: margin,
            y: currentY,
            size: 11,
            font: isBold ? boldFont : font,
            color: rgb(0, 0, 0),
        });
        currentY -= lineHeight;
    };

    // Write header
    writeText('INFLUENCER AGREEMENT CONTRACT', true);
    currentY -= 20;

    // Write contract details
    writeText(`This agreement is made between:`, true);
    writeText(`Brand: ${data.brand_name}`);
    writeText(`Influencer: ${data.influencer_name}`);
    currentY -= 20;

    writeText('SCOPE OF WORK', true);
    writeText(`Deliverables: ${data.deliverables}`);
    writeText(`Timeline: ${data.timeline}`);
    currentY -= 20;

    writeText('COMPENSATION', true);
    writeText(`Rate: $${data.rate}`);
    writeText(`Payment Terms: ${data.payment_terms}`);
    currentY -= 20;

    if (data.special_requirements) {
        writeText('SPECIAL REQUIREMENTS', true);
        writeText(data.special_requirements);
        currentY -= 20;
    }

    // Add signature section
    if (data.signature_url) {
        // If we have a signature, embed it
        const signatureImage = await fetch(data.signature_url).then(res => res.arrayBuffer());
        const image = await doc.embedPng(signatureImage);
        
        page.drawImage(image, {
            x: width - 200,
            y: 100,
            width: 150,
            height: 50,
        });
    }

    // Add signature line
    page.drawLine({
        start: { x: width - 200, y: 80 },
        end: { x: width - 50, y: 80 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    writeText('Signature', true);
    
    // Serialize the PDF to bytes
    const pdfBytes = await doc.save();
    
    return Buffer.from(pdfBytes);
} 