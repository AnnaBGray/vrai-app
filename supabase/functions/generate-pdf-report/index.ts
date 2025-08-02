import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
serve(async (req)=>{
  try {
    const { fullName, images, updatedAt, submissionId, model } = await req.json();
    const name = fullName || 'Customer';
    const date = new Date(updatedAt).toLocaleDateString('en-US');
    const brand = 'Hermès';
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    let y = height - 50;
    const lineHeight = 18;
    const drawText = (text, x, customY)=>{
      page.drawText(text, {
        x,
        y: customY ?? y,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      });
    };
    // Title
    drawText('Vrai Company', 50, y);
    y -= 30;
    // Row 1: Customer Name | Submission ID
    drawText(`Customer Name: ${name}`, 50, y);
    drawText(`Submission ID: ${submissionId}`, width / 2 + 10, y);
    y -= lineHeight;
    // Row 2: Brand | Date
    drawText(`Brand: ${brand}`, 50, y);
    drawText(`Date: ${date}`, width / 2 + 10, y);
    y -= lineHeight;
    // Row 3: Model
    drawText(`Model: ${model}`, 50, y);
    y -= lineHeight * 2;
    // Comments
    drawText('Comments:', 50, y);
    y -= lineHeight;
    const commentLines = [
      'We have reviewed the photographs of the handbag you provided,',
      'including the front and stamp images shown below.',
      'Based on our assessment of these images, we are of the opinion',
      'that the item depicted is an authentic Hermès piece.'
    ];
    for (const line of commentLines){
      drawText(line, 50, y);
      y -= lineHeight;
    }
    // Images
    for (const url of images || []){
      try {
        const res = await fetch(url);
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        let image;
        if (url.toLowerCase().endsWith('.png')) {
          image = await pdfDoc.embedPng(imgBytes);
        } else {
          image = await pdfDoc.embedJpg(imgBytes);
        }
        const imgDims = image.scale(0.25);
        if (y - imgDims.height < 50) {
          y = height - 50;
          pdfDoc.addPage();
        }
        page.drawImage(image, {
          x: 50,
          y: y - imgDims.height,
          width: imgDims.width,
          height: imgDims.height
        });
        y -= imgDims.height + 20;
      } catch (err) {
        console.error('Image embed failed:', url, err);
      }
    }
    // Disclaimer
    if (y < 120) {
      pdfDoc.addPage();
      y = height - 50;
    }
    drawText('Disclaimer:', 50, y);
    y -= lineHeight;
    const disclaimerLines = [
      'Please note that this opinion is based solely on the images submitted',
      'and does not constitute a definitive authentication.',
      'A physical inspection may be required for a conclusive evaluation.'
    ];
    for (const line of disclaimerLines){
      drawText(line, 50, y);
      y -= lineHeight;
    }
    const pdfBytes = await pdfDoc.save();
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const bucket = 'auth-reports';
    const fileName = `${submissionId}.pdf`;
    const upload = await supabase.storage.from(bucket).upload(fileName, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    });
    if (upload.error) {
      return new Response(JSON.stringify({
        error: upload.error.message
      }), {
        status: 500
      });
    }
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
    // Write back to authentication_requests
    const updateRes = await supabase.from('authentication_requests').update({
      report_url: publicUrl
    }).ilike('human_readable_id', submissionId);
    if (updateRes.error) {
      console.error('Update DB error:', updateRes.error);
      return new Response(JSON.stringify({
        error: 'PDF created but failed to update DB'
      }), {
        status: 500
      });
    }
    return new Response(JSON.stringify({
      status: 'success',
      url: publicUrl
    }), {
      status: 200
    });
  } catch (err) {
    console.error('Fatal Error:', err);
    return new Response(JSON.stringify({
      error: 'Failed to generate report'
    }), {
      status: 500
    });
  }
});
