"node_modules\ffmpeg-static\ffmpeg.exe" -f lavfi -i color=c=blue:s=320x240:d=1 -vcodec libx264 -y test_video.mp4
