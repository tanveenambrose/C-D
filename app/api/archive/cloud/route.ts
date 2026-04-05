import { NextRequest, NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

export async function POST(req: NextRequest) {
  try {
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'MISSING_KEY');
    
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const targetFormat = (formData.get('format') as string || 'zip').toLowerCase();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json({ 
        error: 'Engine 2 (Cloud API) requires a CLOUDCONVERT_API_KEY. Fall back to Engine 1 or 3.' 
      }, { status: 500 });
    }

    // CloudConvert handles multi-file archives via a specific job structure
    // but for simplicity, if multi-file, we'll combine them or use standard conversion for single.
    
    // For now, handling single or first file for simple format conversion (RAR -> ZIP)
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();

    let job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'archive', // use archive operation for multi-file or single format change
          input: 'import-my-file',
          output_format: targetFormat,
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    const uploadTask = job.tasks.find(task => task.name === 'import-my-file');
    if (!uploadTask || !uploadTask.result || !uploadTask.result.form) {
      throw new Error("Failed to initialize upload task");
    }

    await cloudConvert.tasks.upload(uploadTask, Buffer.from(arrayBuffer), file.name);

    job = await cloudConvert.jobs.wait(job.id); 

    const exportTask = job.tasks.find(task => task.name === 'export-my-file');
    
    if (exportTask && exportTask.status === 'finished') {
       const fileResult = exportTask.result?.files?.[0];
       if (fileResult) {
         return NextResponse.json({ downloadUrl: fileResult.url, fileName: fileResult.filename });
       }
    }

    throw new Error('Cloud conversion failed or timed out');

  } catch (error: any) {
    console.error("Cloud Archive API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during Cloud SDK archiving' }, { status: 500 });
  }
}
