import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Ensure Node doesn't kill this process too quickly if testing locally
export const maxDuration = 300;

function getFfmpegPath(): string {
  // Resolve dynamically at runtime to bypass Webpack bundling issues
  const isWindows = process.platform === 'win32';
  const exeName = isWindows ? 'ffmpeg.exe' : 'ffmpeg';

  // Try ffmpeg-static from node_modules first (most reliable on Windows dev)
  const candidates = [
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName),
    path.join(process.cwd(), 'node_modules', '.bin', exeName),
  ];

  // Also try what ffmpeg-static exports, but catch if it resolves to wrong path
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

    if (!file || !formatRaw) {
      return NextResponse.json({ error: 'File and target format are required' }, { status: 400 });
    }

    const format = formatRaw.toLowerCase();

    // Resolve ffmpeg path at request time to avoid Webpack bundling issues
    let ffmpegPath: string;
    try {
      ffmpegPath = getFfmpegPath();
      ffmpeg.setFfmpegPath(ffmpegPath);
    } catch (e: any) {
      return NextResponse.json({ error: `FFmpeg binary not found: ${e.message}` }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create temporary paths for the conversion
    const tempDir = os.tmpdir();
    const uid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const inputPath = path.join(tempDir, `input_${uid}_${safeFileName}`);
    const outputPath = path.join(tempDir, `output_${uid}.${format}`);

    // Write input to disk
    fs.writeFileSync(inputPath, buffer);

    // Map extensions to strict codecs to ensure playback safety
    const codecMap: Record<string, { video?: string; audio?: string; audioOnly?: boolean }> = {
      mp4:  { video: 'libx264',  audio: 'aac' },
      mov:  { video: 'libx264',  audio: 'aac' },
      mkv:  { video: 'libx264',  audio: 'aac' },
      webm: { video: 'libvpx',   audio: 'libvorbis' },
      avi:  { video: 'mpeg4',    audio: 'libmp3lame' },
      mp3:  { audioOnly: true },
      wav:  { audioOnly: true },
    };

    const codecInfo = codecMap[format] || { video: 'libx264', audio: 'aac' };

    return new Promise<NextResponse>((resolve) => {
      const command = ffmpeg(inputPath);

      if (codecInfo.audioOnly) {
        command.noVideo();
        if (format === 'mp3') command.audioCodec('libmp3lame');
        // wav uses default pcm encoder
      } else {
        if (codecInfo.video) command.videoCodec(codecInfo.video);
        if (codecInfo.audio) command.audioCodec(codecInfo.audio);
      }

      command
        .outputOptions(['-y'])   // overwrite if exists
        .toFormat(format)
        .on('start', (cmdLine) => console.log('FFmpeg started:', cmdLine))
        .on('end', () => {
          try {
            const fileBuffer = fs.readFileSync(outputPath);
            // Cleanup temps
            try { fs.unlinkSync(inputPath); } catch (_) {}
            try { fs.unlinkSync(outputPath); } catch (_) {}

            const mimeTypes: Record<string, string> = {
              mp4:  'video/mp4',
              webm: 'video/webm',
              mkv:  'video/x-matroska',
              mov:  'video/quicktime',
              avi:  'video/x-msvideo',
              mp3:  'audio/mpeg',
              wav:  'audio/wav',
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
          console.error('FFmpeg execution error:', err);
          try { fs.unlinkSync(inputPath); } catch (_) {}
          try { fs.unlinkSync(outputPath); } catch (_) {}
          resolve(NextResponse.json({ error: err.message || 'FFmpeg conversion failed' }, { status: 500 }));
        })
        .save(outputPath);
    });

  } catch (error: any) {
    console.error('Local FFmpeg Engine Error:', error);
    return NextResponse.json({ error: error.message || 'Server error during local conversion' }, { status: 500 });
  }
}
