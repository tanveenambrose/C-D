import { NextRequest, NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

// Using Next.js 14 Web Standard API, but avoiding strict size limits 
// CloudConvert might need importing from a signed URL, but their SDK supports buffer streams for small files too.
// For large files, we should instead let CloudConvert handle it or stream it. 
// Standard Vercel Serverless payload limit is 4.5MB. For video, this approach won't work perfectly on Vercel
// without proper multipart form parsing. We'll use the browser SDK approach ideally, but the user requested an API route. 

export async function POST(req: NextRequest) {
  try {
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'MISSING_KEY');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;

    if (!file || !format) {
      return NextResponse.json({ error: 'File and target format are required' }, { status: 400 });
    }

    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json({ 
        error: 'Engine 2 (Cloud API) requires a CLOUDCONVERT_API_KEY in .env.local. You can get one for free at cloudconvert.com' 
      }, { status: 500 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Create Job
    let job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: format,
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    // 2. Upload the file to the task
    const uploadTask = job.tasks.find(task => task.name === 'import-my-file');
    if (!uploadTask || !uploadTask.result || !uploadTask.result.form) {
      throw new Error("Failed to initialize upload task");
    }

    // The SDK provides a helper to upload streams/buffers
    await cloudConvert.tasks.upload(uploadTask, Buffer.from(arrayBuffer), file.name);

    // 3. Wait for job to finish
    job = await cloudConvert.jobs.wait(job.id); 

    // 4. Get the export task to get the download URL
    const exportTask = job.tasks.find(task => task.name === 'export-my-file');
    
    if (exportTask && exportTask.status === 'finished') {
       const fileResult = exportTask.result?.files?.[0];
       if (fileResult) {
         return NextResponse.json({ downloadUrl: fileResult.url, fileName: fileResult.filename });
       }
    }

    throw new Error('Conversion failed or timed out on CloudConvert');

  } catch (error: any) {
    console.error("CloudConvert API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during Cloud SDK conversion' }, { status: 500 });
  }
}
