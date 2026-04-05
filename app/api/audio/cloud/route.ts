import { NextRequest, NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

export async function POST(req: NextRequest) {
  try {
    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || 'MISSING_KEY');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;
    const quality = (formData.get('quality') as string) || 'best';

    if (!file || !format) {
      return NextResponse.json({ error: 'File and target format are required' }, { status: 400 });
    }

    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json({ 
        error: 'Engine 2 (Cloud API) requires a CLOUDCONVERT_API_KEY in .env.local. You can get one for free at cloudconvert.com' 
      }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();

    const bitrateMap: Record<string, number> = {
      best: 320,
      good: 192,
      standard: 128
    };
    const br = bitrateMap[quality] || 320;

    // 1. Create Job
    let job = await cloudConvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          output_format: format.toLowerCase(),
          audio_bitrate: br
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

    throw new Error('Conversion failed or timed out on CloudConvert');

  } catch (error: any) {
    console.error("CloudConvert Audio API Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during Cloud SDK conversion' }, { status: 500 });
  }
}
