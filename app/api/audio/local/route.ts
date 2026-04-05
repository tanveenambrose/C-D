import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Ensure Node doesn't kill this process too quickly
export const maxDuration = 300;

function getFfmpegPath(): string {
  const isWindows = process.platform === 'win32';
  const exeName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';

  const candidates = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName),
    path.join(process.cwd(), 'node_modules', '.bin', exeName),
  ];

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const staticPath: string = require('ffmpeg-static');
    if (staticPath && fs.existsSync(staticPath)) {
      candidates.unshift(staticPath);
    }
  } catch (_) { /* ignore */ }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`ffmpeg binary not found. Searched: ${candidates.join(', ')}`);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const formatRaw = formData.get('format') as string;
    const quality = (formData.get('quality') as string) || 'best';

    if (!file || !formatRaw) {
      return NextResponse.json({ error: 'File and target format are required' }, { status: 400 });
    }

    const format = formatRaw.toLowerCase();

    // Resolve ffmpeg path at request time
    let ffmpegPath: string;
    try {
      ffmpegPath = getFfmpegPath();
      ffmpeg.setFfmpegPath(ffmpegPath);
    } catch (e: any) {
      return NextResponse.json({ error: `FFmpeg binary not found: ${e.message}` }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempDir = os.tmpdir();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const inputPath = path.join(tempDir, `input_audio_${uid}_${safeFileName}`);
    const outputPath = path.join(tempDir, `output_audio_${uid}.${format}`);

    fs.writeFileSync(inputPath, buffer);

    const bitrateMap: Record<string, string> = {
      best: '320k',
      good: '192k',
      standard: '128k'
    };

    const br = bitrateMap[quality] || '320k';

    return new Promise<NextResponse>((resolve) => {
      const command = ffmpeg(inputPath).noVideo();

      if (format === 'mp3') {
        command.audioCodec('libmp3lame').audioBitrate(br);
      } else if (format === 'ogg') {
        command.audioCodec('libvorbis').audioBitrate(br);
      } else if (format === 'm4a') {
        command.audioCodec('aac').audioBitrate(br);
      } else if (format === 'flac') {
        command.audioCodec('flac');
      } else if (format === 'wav') {
        // use default pcm encoder for wav
      }

      command
        .outputOptions(['-y'])
        .toFormat(format)
        .on('start', (cmdLine) => console.log('Audio Conversion started:', cmdLine))
        .on('end', () => {
          try {
            const fileBuffer = fs.readFileSync(outputPath);
            try { fs.unlinkSync(inputPath); } catch (_) {}
            try { fs.unlinkSync(outputPath); } catch (_) {}

            const mimeTypes: Record<string, string> = {
              mp3:  'audio/mpeg',
              wav:  'audio/wav',
              ogg:  'audio/ogg',
              m4a:  'audio/mp4',
              flac: 'audio/flac',
            };

            const outName = `${file.name.split('.')[0]}_converted.${format}`;
            resolve(new NextResponse(fileBuffer, {
              status: 200,
              headers: {
                'Content-Type': mimeTypes[format] || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${outName}"`,
                'Content-Length': String(fileBuffer.length),
              },
            }));
          } catch (e: any) {
            resolve(NextResponse.json({ error: 'Failed to read output file: ' + e.message }, { status: 500 }));
          }
        })
        .on('error', (err) => {
          console.error('Audio FFmpeg execution error:', err);
          try { fs.unlinkSync(inputPath); } catch (_) {}
          try { fs.unlinkSync(outputPath); } catch (_) {}
          resolve(NextResponse.json({ error: err.message || 'Audio conversion failed' }, { status: 500 }));
        })
        .save(outputPath);
    });

  } catch (error: any) {
    console.error('Local Audio Engine Error:', error);
    return NextResponse.json({ error: error.message || 'Server error during local conversion' }, { status: 500 });
  }
}
